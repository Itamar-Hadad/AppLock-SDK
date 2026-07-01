package com.applocksdk

import android.os.Build
import java.util.Locale

data class DeviceInfo(
    val osVersion: String,
    val manufacturer: String,
    val model: String,
    val sdkInt: Int,
    val language: String,
    val appVersion: String,
) {
    companion object {
        fun current(appVersion: String): DeviceInfo = DeviceInfo(
            osVersion = Build.VERSION.RELEASE,
            manufacturer = Build.MANUFACTURER,
            model = Build.MODEL,
            sdkInt = Build.VERSION.SDK_INT,
            language = Locale.getDefault().language,
            appVersion = appVersion,
        )
    }
}
