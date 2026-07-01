package com.applocksdk

/**
 * Maps a raw touch coordinate to one of the 3x3 Pattern grid's 9 cells. No Android
 * dependencies, so it can be verified with standalone JVM unit tests.
 */
internal object PatternGridGeometry {

    // Each node only claims a hit-circle around its own center, not its whole 1/9 rectangle -
    // a real finger never traces an exactly straight diagonal, so without a dead zone between
    // nodes a wobbly drag toward a diagonal neighbor briefly clips an axis-adjacent node instead.
    private const val HIT_RADIUS_FRACTION = 0.4f

    fun cellIndexAt(x: Float, y: Float, width: Int, height: Int): Int? {
        val cellWidth = width / 3f
        val cellHeight = height / 3f
        val hitRadius = minOf(cellWidth, cellHeight) * HIT_RADIUS_FRACTION
        for (i in 0 until 9) {
            val centerX = (i % 3 + 0.5f) * cellWidth
            val centerY = (i / 3 + 0.5f) * cellHeight
            val dx = x - centerX
            val dy = y - centerY
            if (dx * dx + dy * dy <= hitRadius * hitRadius) return i
        }
        return null
    }
}