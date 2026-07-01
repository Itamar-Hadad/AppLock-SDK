package com.applocksdk

/**
 * Accumulates the cells touched during one drag gesture across the 3x3 Pattern grid.
 * Pure cell-index bookkeeping (no raw coordinates, no Android dependencies) so it can be
 * exercised with direct method calls instead of simulated touch events - same testing
 * approach as BiometricUnlockCoordinator.
 */
internal class PatternGestureTracker {

    private val points = mutableListOf<Int>()

    fun onTouchDown(cell: Int) {
        points.clear()
        points.add(cell)
    }

    fun onTouchMove(cell: Int) {
        if (points.lastOrNull() != cell) points.add(cell)
    }

    fun currentPoints(): List<Int> = points.toList()

    fun onTouchUp(): List<Int> {
        val result = points.toList()
        points.clear()
        return result
    }
}