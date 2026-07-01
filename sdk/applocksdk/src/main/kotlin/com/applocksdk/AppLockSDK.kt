package com.applocksdk

import android.app.Activity
import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.lifecycle.ProcessLifecycleOwner
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

object AppLockSDK {

    private const val SDK_VERSION = "1.0.0"
    private const val DEFAULT_BASE_URL = "https://api.applock.io/"

    private var engine: AppLockEngine? = null
    private var foregroundTracker: ForegroundActivityTracker? = null
    private var lifecycleObserver: AppLockLifecycleObserver? = null
    private var protectedActivity: Activity? = null

    fun init(context: Context, appId: String, apiKey: String, config: AppLockConfig) {
        initWithBaseUrl(context, appId, apiKey, config, DEFAULT_BASE_URL)
    }

    // Advanced: points the SDK at a custom server (e.g. staging) instead of the production default.
    fun init(context: Context, appId: String, apiKey: String, config: AppLockConfig, baseUrl: String) {
        initWithBaseUrl(context, appId, apiKey, config, baseUrl)
    }

    internal fun initWithBaseUrl(
        context: Context,
        appId: String,
        apiKey: String,
        config: AppLockConfig,
        baseUrl: String,
        pinManager: PinManager? = null,
        fetchRemoteConfigOnInit: Boolean = true,
        workEnqueuer: WorkEnqueuer? = null,
    ) {
        val appContext = context.applicationContext
        val appVersion = appContext.packageManager.getPackageInfo(appContext.packageName, 0).versionName ?: "unknown"
        val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        val api = buildRetrofitClient(baseUrl, apiKey)

        val crashPrefs = appContext.getSharedPreferences(CrashReporter.PREFS_NAME, android.content.Context.MODE_PRIVATE)
        val crashReporter = CrashReporter(
            prefs = crashPrefs,
            appId = appId,
            deviceId = computeDeviceId(appContext),
            sdkVersion = SDK_VERSION,
            apiKey = apiKey,
            baseUrl = baseUrl,
            api = api,
            workEnqueuer = workEnqueuer ?: WorkManagerEnqueuer(appContext),
        )
        crashReporter.install()
        scope.launch { crashReporter.flushIfPending() }

        val newEngine = AppLockEngine(
            appId = appId,
            deviceId = computeDeviceId(appContext),
            sdkVersion = SDK_VERSION,
            deviceInfo = DeviceInfo.current(appVersion),
            pinManager = pinManager ?: PinManager(appContext),
            api = api,
            scope = scope,
            maxAttempts = config.maxAttempts,
            lockoutSeconds = config.lockoutSeconds,
            methods = config.methods,
            theme = config.theme,
        )
        engine = newEngine

        val tracker = ForegroundActivityTracker()
        (appContext as Application).registerActivityLifecycleCallbacks(tracker)
        foregroundTracker = tracker

        lifecycleObserver?.let { ProcessLifecycleOwner.get().lifecycle.removeObserver(it) }
        val observer = AppLockLifecycleObserver(
            engine = newEngine,
            timeoutSeconds = config.timeoutSeconds,
            scope = scope,
            showLockScreen = ::showLockScreenOnCurrentActivity,
        )
        ProcessLifecycleOwner.get().lifecycle.addObserver(observer)
        lifecycleObserver = observer

        // Fire-and-forget, same "never block/crash the host app" philosophy as reportEvent() -
        // a slow/failed fetch just means this launch keeps running on init()'s local config.
        // fetchRemoteConfigOnInit only exists to keep it out of the way of acceptance tests
        // that don't care about it and assert strict request ordering against MockWebServer.
        if (fetchRemoteConfigOnInit) {
            val remoteConfigManager = RemoteConfigManager(api = api, appId = appId, cache = RemoteConfigCache(appContext))
            scope.launch {
                remoteConfigManager.getEffectiveConfig()?.let { remote ->
                    newEngine.applyRemoteConfig(
                        maxAttempts = remote.maxAttempts,
                        lockoutSeconds = remote.lockoutSeconds,
                        methods = remote.methods.mapNotNull { runCatching { LockMethod.valueOf(it.uppercase()) }.getOrNull() },
                    )
                    observer.updateTimeoutSeconds(remote.timeoutSeconds)
                }
            }
        }
    }

    fun lock() {
        engineOrThrow().lock()
        showLockScreenOnCurrentActivity()
    }

    // Deferred: when lock() is called from a just-created Activity's onCreate() (the
    // common "protect this screen" pattern), the framework dispatches
    // Application.ActivityLifecycleCallbacks.onActivityResumed() for that activity only
    // *after* its onCreate()/onResume() return - so foregroundTracker.current would still
    // be stale/null if read synchronously here. Posting lets that dispatch land first.
    private fun showLockScreenOnCurrentActivity() {
        Handler(Looper.getMainLooper()).post {
            foregroundTracker?.current?.let { activity ->
                protectedActivity = activity
                activity.startActivity(LockActivity.entryIntent(activity))
            }
        }
    }

    // Called when the entry screen is cancelled (system Back) without a successful unlock -
    // the screen lock() was protecting must close too, so the user lands on whatever was
    // behind it rather than seeing its content with no PIN/biometric check at all.
    internal fun finishProtectedActivity() {
        protectedActivity?.let { if (!it.isFinishing) it.finish() }
        protectedActivity = null
    }

    fun isLocked(): Boolean = engine?.isLocked() ?: false

    fun setListener(listener: LockListener) {
        engineOrThrow().setListener(listener)
    }

    fun setupPin(activity: Activity) {
        activity.startActivity(LockActivity.setupIntent(activity))
    }

    fun reset() {
        engineOrThrow().reset()
    }

    /** Testing/demo utility (same category as [reset]) - drives the exact same path a real wrong PIN/Pattern entry would, including reaching maxAttempts/lockout. */
    fun simulateFailedAttempt(method: LockMethod = LockMethod.PIN) {
        engineOrThrow().simulateFailedAttempt(method.name.lowercase())
    }

    internal fun engineForInternalUse(): AppLockEngine = engineOrThrow()

    private fun engineOrThrow(): AppLockEngine =
        engine ?: error("AppLockSDK.init() must be called before use")
}
