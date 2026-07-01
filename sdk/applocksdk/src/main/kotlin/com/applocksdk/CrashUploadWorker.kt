package com.applocksdk

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

internal class CrashUploadWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences(CrashReporter.PREFS_NAME, Context.MODE_PRIVATE)
        val error = prefs.getString(CrashReporter.KEY_PENDING_ERROR, null) ?: return Result.success()
        val ts = prefs.getLong(CrashReporter.KEY_ERROR_TS, 0L)
        val appId = prefs.getString(CrashReporter.KEY_APP_ID, null) ?: return Result.failure()
        val deviceId = prefs.getString(CrashReporter.KEY_DEVICE_ID, "") ?: ""
        val sdkVersion = prefs.getString(CrashReporter.KEY_SDK_VERSION, "") ?: ""
        val apiKey = prefs.getString(CrashReporter.KEY_API_KEY, null) ?: return Result.failure()
        val baseUrl = prefs.getString(CrashReporter.KEY_BASE_URL, null) ?: return Result.failure()

        val api = buildRetrofitClient(baseUrl, apiKey)
        return try {
            val response = api.reportError(ErrorReport(appId, deviceId, error, ts, sdkVersion))
            if (response.isSuccessful) {
                prefs.edit().remove(CrashReporter.KEY_PENDING_ERROR).remove(CrashReporter.KEY_ERROR_TS).apply()
                Result.success()
            } else {
                Result.retry()
            }
        } catch (e: Exception) {
            Result.retry()
        }
    }

}