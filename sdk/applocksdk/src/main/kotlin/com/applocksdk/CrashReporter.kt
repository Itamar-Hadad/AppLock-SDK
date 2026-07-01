package com.applocksdk

import android.content.SharedPreferences
import retrofit2.Response

internal class CrashReporter(
    private val prefs: SharedPreferences,
    private val appId: String,
    private val deviceId: String,
    private val sdkVersion: String,
    private val apiKey: String,
    private val baseUrl: String,
    private val api: AppLockApi,
    private val workEnqueuer: WorkEnqueuer,
    private val previousHandler: Thread.UncaughtExceptionHandler? = Thread.getDefaultUncaughtExceptionHandler(),
) {
    fun install() {
        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            saveLocally(throwable)
            previousHandler?.uncaughtException(thread, throwable)
        }
    }

    private fun saveLocally(throwable: Throwable) {
        prefs.edit()
            .putString(KEY_PENDING_ERROR, throwable.stackTraceToString())
            .putLong(KEY_ERROR_TS, System.currentTimeMillis())
            .putString(KEY_APP_ID, appId)
            .putString(KEY_DEVICE_ID, deviceId)
            .putString(KEY_SDK_VERSION, sdkVersion)
            .putString(KEY_API_KEY, apiKey)
            .putString(KEY_BASE_URL, baseUrl)
            .commit()
    }

    suspend fun flushIfPending() {
        val error = prefs.getString(KEY_PENDING_ERROR, null) ?: return
        val ts = prefs.getLong(KEY_ERROR_TS, 0L)
        val report = ErrorReport(appId = appId, deviceId = deviceId, error = error, timestamp = ts, sdkVersion = sdkVersion)
        try {
            val response: Response<Unit> = api.reportError(report)
            if (response.isSuccessful) {
                prefs.edit().remove(KEY_PENDING_ERROR).remove(KEY_ERROR_TS).apply()
            } else {
                workEnqueuer.enqueueCrashUpload()
            }
        } catch (e: Exception) {
            workEnqueuer.enqueueCrashUpload()
        }
    }

    companion object {
        const val PREFS_NAME = "applock_crash"
        const val KEY_PENDING_ERROR = "pending_error"
        const val KEY_ERROR_TS = "error_ts"
        const val KEY_APP_ID = "error_app_id"
        const val KEY_DEVICE_ID = "error_device_id"
        const val KEY_SDK_VERSION = "error_sdk_version"
        const val KEY_API_KEY = "error_api_key"
        const val KEY_BASE_URL = "error_base_url"
    }
}