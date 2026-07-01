package com.applocksdk

import android.app.Activity
import android.app.Application
import android.os.Bundle

/** Tracks the topmost resumed activity so [AppLockSDK.lock] can show [LockActivity] on top of it. */
internal class ForegroundActivityTracker : Application.ActivityLifecycleCallbacks {

    var current: Activity? = null
        private set

    override fun onActivityResumed(activity: Activity) {
        current = activity
    }

    override fun onActivityPaused(activity: Activity) {
        if (current == activity) current = null
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit
    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
    override fun onActivityDestroyed(activity: Activity) = Unit
}
