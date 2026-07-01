package com.applocksdk.demo

import android.app.Application
import android.content.Context
import com.applocksdk.AppLockConfig
import com.applocksdk.AppLockSDK

class DemoApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        initAppLock(this, AppLockConfig())
    }
}

// applock.baseUrl in local.properties is empty by default (production server). Setting it
// (e.g. to a LAN address for on-device testing against a local server) routes the SDK there
// instead - see demo/README.md.
fun initAppLock(context: Context, config: AppLockConfig) {
    if (BuildConfig.APPLOCK_BASE_URL.isEmpty()) {
        AppLockSDK.init(context, BuildConfig.APPLOCK_APP_ID, BuildConfig.APPLOCK_API_KEY, config)
    } else {
        AppLockSDK.init(context, BuildConfig.APPLOCK_APP_ID, BuildConfig.APPLOCK_API_KEY, config, BuildConfig.APPLOCK_BASE_URL)
    }
}