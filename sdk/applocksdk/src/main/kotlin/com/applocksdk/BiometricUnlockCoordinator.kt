package com.applocksdk

/**
 * Decision logic for biometric unlock, kept separate from the real `androidx.biometric.BiometricPrompt`
 * wiring in [LockActivity] so it can be exercised with direct method calls in tests - mirrors the
 * [AppLockLifecycleObserver] pattern from auto-lock-on-timeout.
 */
internal class BiometricUnlockCoordinator(
    private val engine: AppLockEngine,
    private val onUnlockSuccess: () -> Unit,
    private val onFallbackToPin: () -> Unit,
) {
    fun onAuthenticationSucceeded() {
        engine.onBiometricUnlockSuccess()
        onUnlockSuccess()
    }

    fun onAuthenticationFailed() {
        if (engine.onBiometricRecognitionFailed()) onFallbackToPin()
    }

    fun onAuthenticationError() {
        onFallbackToPin()
    }
}