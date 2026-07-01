package com.applocksdk

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Key-value boundary for on-device secrets. The real implementation is backed by
 * [EncryptedSharedPreferences] (Android Keystore) - an OS boundary Robolectric cannot
 * simulate, so tests inject a fake instead of exercising the real Keystore on the JVM.
 */
internal interface SecureStore {
    fun getString(key: String): String?
    fun putString(key: String, value: String)
    fun clear()
}

internal class EncryptedSecureStore(context: Context, fileName: String) : SecureStore {

    private val prefs = EncryptedSharedPreferences.create(
        context,
        fileName,
        MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override fun getString(key: String): String? = prefs.getString(key, null)

    override fun putString(key: String, value: String) {
        prefs.edit().putString(key, value).apply()
    }

    override fun clear() {
        prefs.edit().clear().apply()
    }
}
