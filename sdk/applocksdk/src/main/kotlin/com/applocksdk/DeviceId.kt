package com.applocksdk

import android.content.Context
import android.provider.Settings
import java.security.MessageDigest

/** Anonymous, stable per-device identifier: SHA-256 of ANDROID_ID, truncated to 16 hex chars. */
internal fun computeDeviceId(context: Context): String {
    val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: ""
    val hash = MessageDigest.getInstance("SHA-256").digest(androidId.toByteArray(Charsets.UTF_8))
    return hash.joinToString("") { "%02x".format(it) }.take(16)
}
