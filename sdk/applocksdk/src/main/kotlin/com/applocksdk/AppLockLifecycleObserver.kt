package com.applocksdk

import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Drives auto-lock-on-background-timeout. Registered on [androidx.lifecycle.ProcessLifecycleOwner]
 * by [AppLockSDK], so [onStop]/[onStart] fire for whole-app background/foreground transitions,
 * not per-Activity ones.
 */
internal class AppLockLifecycleObserver(
    private val engine: AppLockEngine,
    private var timeoutSeconds: Int,
    private val scope: CoroutineScope,
    private val showLockScreen: () -> Unit,
) : DefaultLifecycleObserver {

    private var timeoutJob: Job? = null

    /** Applied by [AppLockSDK] after [RemoteConfigManager] resolves the server's current config. */
    fun updateTimeoutSeconds(seconds: Int) {
        timeoutSeconds = seconds
    }

    override fun onStop(owner: LifecycleOwner) {
        timeoutJob = startTimeoutTimer()
    }

    override fun onStart(owner: LifecycleOwner) {
        timeoutJob?.cancel()
        timeoutJob = null
        if (engine.isLocked()) showLockScreen()
    }

    private fun startTimeoutTimer(): Job = scope.launch {
        delay(timeoutSeconds * 1000L)
        engine.lockByTimeout()
    }
}