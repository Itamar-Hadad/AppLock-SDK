package com.applocksdk

/**
 * maxAttempts/lockoutSeconds/timeoutSeconds are accepted now to keep init()'s signature
 * stable for later slices, but only `methods` (PIN) has any behavior wired up yet.
 */
data class AppLockConfig(
    val methods: List<LockMethod> = listOf(LockMethod.PIN),
    val timeoutSeconds: Int = 30,
    val maxAttempts: Int = 5,
    val lockoutSeconds: Int = 30,
    val theme: LockTheme? = null,
)
