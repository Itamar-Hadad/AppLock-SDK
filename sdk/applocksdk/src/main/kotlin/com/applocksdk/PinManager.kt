package com.applocksdk

import android.content.Context

/**
 * Android-side PIN storage. Persists only the salted SHA-256 hash produced by
 * [PinCrypto] inside [SecureStore] - the raw PIN never touches disk.
 */
internal class PinManager(
    context: Context,
    private val secureStore: SecureStore = EncryptedSecureStore(context, PREFS_FILE_NAME),
) {

    fun setupPin(pin: String) {
        saveHashedPin(PinCrypto.hashPin(pin))
    }

    fun saveHashedPin(hash: String) {
        secureStore.putString(KEY_PIN_HASH, hash)
    }

    fun verifyPin(input: String): Boolean {
        val storedHash = secureStore.getString(KEY_PIN_HASH) ?: return false
        return PinCrypto.verifyPin(input, storedHash)
    }

    fun reset() {
        secureStore.clear()
    }

    companion object {
        private const val PREFS_FILE_NAME = "applocksdk_pin_prefs"
        private const val KEY_PIN_HASH = "pin_hash"
    }
}
