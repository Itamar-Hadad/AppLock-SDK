package com.applocksdk

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Holds the SDK's lock state and orchestrates PIN verification + event reporting.
 * Kept separate from the [AppLockSDK] singleton so it can be constructed directly in tests.
 */
internal class AppLockEngine(
    private val appId: String,
    private val deviceId: String,
    private val sdkVersion: String,
    private val deviceInfo: DeviceInfo,
    private val pinManager: PinManager,
    private val api: AppLockApi,
    private val scope: CoroutineScope,
    private var maxAttempts: Int = 5,
    private var lockoutSeconds: Int = 30,
    private var methods: List<LockMethod> = listOf(LockMethod.PIN),
    private val theme: LockTheme? = null,
) {
    companion object {
        private const val BIOMETRIC_FALLBACK_THRESHOLD = 3
    }

    @Volatile
    private var locked = false
    @Volatile
    private var lockedOut = false
    private var attempt = 0
    private var consecutiveBiometricFailures = 0
    private var listener: LockListener? = null

    fun isLocked(): Boolean = locked

    fun isBiometricEnabled(): Boolean = methods.contains(LockMethod.BIOMETRIC)

    fun isPatternEnabled(): Boolean = methods.contains(LockMethod.PATTERN)

    fun isLockedOut(): Boolean = lockedOut

    fun lockoutSeconds(): Int = lockoutSeconds

    fun theme(): LockTheme? = theme

    fun setListener(listener: LockListener) {
        this.listener = listener
    }

    /** Applied by [AppLockSDK] after [RemoteConfigManager] resolves the server's current config - overrides whatever init() was called with, per the design doc's "Portal change wins" model. */
    fun applyRemoteConfig(maxAttempts: Int, lockoutSeconds: Int, methods: List<LockMethod>) {
        this.maxAttempts = maxAttempts
        this.lockoutSeconds = lockoutSeconds
        this.methods = methods
    }

    fun setupPin(pin: String) {
        pinManager.setupPin(pin)
    }

    /** Pattern reuses the exact same hashPin/saveHashedPin storage slot as PIN - no parallel crypto path. */
    fun setupPattern(pattern: String) {
        pinManager.setupPin(pattern)
    }

    fun lock() {
        locked = true
        attempt = 0
        report(LockEventType.LOCK_TRIGGERED, attempt = 0, method = "pin")
    }

    fun lockByTimeout() {
        locked = true
        attempt = 0
        report(LockEventType.LOCK_BY_TIMEOUT, attempt = 0, method = "pin")
        listener?.onLockedByTimeout()
    }

    fun attemptUnlock(pin: String): Boolean = attemptUnlockWithMethod(pin, "pin")

    fun attemptUnlockPattern(pattern: String): Boolean = attemptUnlockWithMethod(pattern, "pattern")

    private fun attemptUnlockWithMethod(secret: String, method: String): Boolean {
        if (lockedOut) return false
        val success = pinManager.verifyPin(secret)
        if (success) {
            attempt++
            report(LockEventType.UNLOCK_SUCCESS, attempt, method = method)
            locked = false
            attempt = 0
        } else {
            incrementFailCount(method)
        }
        return success
    }

    fun onBiometricUnlockSuccess() {
        report(LockEventType.UNLOCK_SUCCESS, attempt, method = "biometric")
        locked = false
        attempt = 0
        consecutiveBiometricFailures = 0
        listener?.onUnlockSuccess(LockMethod.BIOMETRIC)
    }

    /** Returns true once [BIOMETRIC_FALLBACK_THRESHOLD] consecutive soft misses is reached - caller should fall back to the PIN screen. */
    fun onBiometricRecognitionFailed(): Boolean {
        consecutiveBiometricFailures++
        report(LockEventType.BIOMETRIC_RECOGNITION_FAILED, consecutiveBiometricFailures, method = "biometric")
        return consecutiveBiometricFailures >= BIOMETRIC_FALLBACK_THRESHOLD
    }

    /** Testing/demo utility (same category as [reset]) - drives the exact same path a real wrong PIN/Pattern entry would. */
    fun simulateFailedAttempt(method: String) {
        incrementFailCount(method)
    }

    private fun incrementFailCount(method: String) {
        attempt++
        report(LockEventType.UNLOCK_FAILED, attempt, method = method)
        listener?.onUnlockFailed(attempt)
        if (attempt >= maxAttempts) enterLockout(method)
    }

    private fun enterLockout(method: String) {
        lockedOut = true
        report(LockEventType.MAX_ATTEMPTS_REACHED, attempt, method = method)
        listener?.onMaxAttemptsReached()
        scope.launch {
            delay(lockoutSeconds * 1000L)
            lockedOut = false
            attempt = 0
        }
    }

    fun reset() {
        pinManager.reset()
        locked = false
        lockedOut = false
        attempt = 0
    }

    private fun report(type: String, attempt: Int, method: String) {
        // reportEvent() is fire-and-forget by design (section 4/10c of the design doc) -
        // a network failure here must never crash the host app. Logged (not surfaced to
        // the host) so a revoked apiKey's 401 is still visible live, e.g. in Logcat.
        scope.launch {
            try {
                reportSuspend(type, attempt, method)
            } catch (e: Exception) {
                android.util.Log.w("AppLockSDK", "reportEvent failed for type=$type", e)
            }
        }
    }

    internal suspend fun reportSuspend(type: String, attempt: Int, method: String) {
        val event = LockEvent(
            appId = appId,
            deviceId = deviceId,
            event = type,
            method = method,
            attempt = attempt,
            timestamp = Instant.now().toString(),
            sdkVersion = sdkVersion,
            osVersion = deviceInfo.osVersion,
            manufacturer = deviceInfo.manufacturer,
            model = deviceInfo.model,
            sdkInt = deviceInfo.sdkInt,
            language = deviceInfo.language,
            appVersion = deviceInfo.appVersion,
        )
        api.reportEvent(event)
    }
}
