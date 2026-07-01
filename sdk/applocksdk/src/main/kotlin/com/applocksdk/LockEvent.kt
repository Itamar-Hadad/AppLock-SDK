package com.applocksdk

object LockEventType {
    const val LOCK_TRIGGERED = "LOCK_TRIGGERED"
    const val UNLOCK_SUCCESS = "UNLOCK_SUCCESS"
    const val UNLOCK_FAILED = "UNLOCK_FAILED"
    const val MAX_ATTEMPTS_REACHED = "MAX_ATTEMPTS_REACHED"
    const val LOCK_BY_TIMEOUT = "LOCK_BY_TIMEOUT"
    const val BIOMETRIC_RECOGNITION_FAILED = "BIOMETRIC_RECOGNITION_FAILED"
}

data class LockEvent(
    val appId: String,
    val deviceId: String,
    val event: String,
    val method: String,
    val attempt: Int,
    val timestamp: String,
    val sdkVersion: String,
    val osVersion: String,
    val manufacturer: String,
    val model: String,
    val sdkInt: Int,
    val language: String,
    val appVersion: String,
)
