package com.applocksdk

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

internal interface AppLockApi {
    @POST("api/lock/event")
    suspend fun reportEvent(@Body event: LockEvent): Response<Unit>

    @GET("api/config/{appId}")
    suspend fun getConfig(@Path("appId") appId: String): ConfigResponse

    @GET("api/config/{appId}/priority")
    suspend fun getPriorityStatus(@Path("appId") appId: String): PriorityResponse

    @POST("api/errors")
    suspend fun reportError(@Body report: ErrorReport): Response<Unit>
}

internal data class ErrorReport(
    val appId: String,
    val deviceId: String,
    val error: String,
    val timestamp: Long,
    val sdkVersion: String,
)

internal data class ConfigResponse(
    val maxAttempts: Int,
    val lockoutSeconds: Int,
    val timeoutSeconds: Int,
    val alertThreshold: Int,
    val methods: List<String>,
)

internal data class PriorityResponse(val pending: Boolean)
