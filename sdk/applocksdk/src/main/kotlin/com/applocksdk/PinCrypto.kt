package com.applocksdk

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

/**
 * Pure PIN hashing/verification core (SHA-256 + random salt). No Android
 * dependencies, so it can be verified with standalone JVM unit tests.
 */
internal object PinCrypto {

    private const val SALT_LENGTH_BYTES = 16

    fun hashPin(pin: String): String {
        val salt = ByteArray(SALT_LENGTH_BYTES).also { SecureRandom().nextBytes(it) }
        val hash = sha256(salt, pin)
        return "${Base64.getEncoder().encodeToString(salt)}:${Base64.getEncoder().encodeToString(hash)}"
    }

    fun verifyPin(input: String, storedHash: String): Boolean {
        val (saltPart, hashPart) = storedHash.split(":", limit = 2)
        val salt = Base64.getDecoder().decode(saltPart)
        val expectedHash = Base64.getDecoder().decode(hashPart)
        val actualHash = sha256(salt, input)
        return actualHash.contentEquals(expectedHash)
    }

    private fun sha256(salt: ByteArray, pin: String): ByteArray =
        MessageDigest.getInstance("SHA-256").apply {
            update(salt)
            update(pin.toByteArray(Charsets.UTF_8))
        }.digest()
}