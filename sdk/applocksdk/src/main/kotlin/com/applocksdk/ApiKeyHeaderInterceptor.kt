package com.applocksdk

import okhttp3.Interceptor
import okhttp3.Response

/** Adds the headers `validateApiKey()`/`timestampValidator()` require to every SDK request. */
internal class ApiKeyHeaderInterceptor(private val apiKey: String) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request().newBuilder()
            .addHeader("X-Api-Key", apiKey)
            .addHeader("X-Timestamp", System.currentTimeMillis().toString())
            .build()
        return chain.proceed(request)
    }
}
