package com.applocksdk

import android.content.Context

/**
 * On-device cache for the last successfully fetched remote config, keyed by fetch time so
 * [RemoteConfigManager] can decide whether the 10-minute TTL has expired. Unlike [PinManager]'s
 * storage, these values aren't secret - plain [android.content.SharedPreferences] is enough,
 * no Keystore/EncryptedSharedPreferences boundary to fake in tests.
 */
internal class RemoteConfigCache(context: Context) {

    private val prefs = context.getSharedPreferences(PREFS_FILE_NAME, Context.MODE_PRIVATE)

    fun read(): CachedRemoteConfig? {
        val fetchedAtMillis = prefs.getLong(KEY_FETCHED_AT, -1L)
        if (fetchedAtMillis == -1L) return null
        return CachedRemoteConfig(
            fetchedAtMillis = fetchedAtMillis,
            maxAttempts = prefs.getInt(KEY_MAX_ATTEMPTS, 0),
            lockoutSeconds = prefs.getInt(KEY_LOCKOUT_SECONDS, 0),
            timeoutSeconds = prefs.getInt(KEY_TIMEOUT_SECONDS, 0),
            methods = prefs.getString(KEY_METHODS, "")!!.split(",").filter { it.isNotBlank() },
        )
    }

    fun save(config: CachedRemoteConfig) {
        prefs.edit()
            .putLong(KEY_FETCHED_AT, config.fetchedAtMillis)
            .putInt(KEY_MAX_ATTEMPTS, config.maxAttempts)
            .putInt(KEY_LOCKOUT_SECONDS, config.lockoutSeconds)
            .putInt(KEY_TIMEOUT_SECONDS, config.timeoutSeconds)
            .putString(KEY_METHODS, config.methods.joinToString(","))
            .apply()
    }

    companion object {
        private const val PREFS_FILE_NAME = "applocksdk_remote_config"
        private const val KEY_FETCHED_AT = "fetched_at"
        private const val KEY_MAX_ATTEMPTS = "max_attempts"
        private const val KEY_LOCKOUT_SECONDS = "lockout_seconds"
        private const val KEY_TIMEOUT_SECONDS = "timeout_seconds"
        private const val KEY_METHODS = "methods"
    }
}

internal data class CachedRemoteConfig(
    val fetchedAtMillis: Long,
    val maxAttempts: Int,
    val lockoutSeconds: Int,
    val timeoutSeconds: Int,
    val methods: List<String>,
)