package com.applocksdk

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

internal fun buildRetrofitClient(baseUrl: String, apiKey: String): AppLockApi {
    val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(ApiKeyHeaderInterceptor(apiKey))
        .build()

    val retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    return retrofit.create(AppLockApi::class.java)
}
