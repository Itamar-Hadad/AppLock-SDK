package com.applocksdk

/**
 * Converts a drawn 3x3 grid Pattern into the string fed through PinCrypto - no Android
 * dependencies, so it can be verified with standalone JVM unit tests.
 */
internal object PatternEncoding {

    fun patternToString(points: List<Int>): String = points.joinToString("-")
}