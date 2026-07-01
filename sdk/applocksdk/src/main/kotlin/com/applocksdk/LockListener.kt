package com.applocksdk

/** Matches the design doc's Callbacks — Event Listening section; all methods are optional to override. */
interface LockListener {
    fun onUnlockSuccess(method: LockMethod) {}
    fun onUnlockFailed(attempt: Int) {}
    fun onMaxAttemptsReached() {}
    fun onLockedByTimeout() {}
}