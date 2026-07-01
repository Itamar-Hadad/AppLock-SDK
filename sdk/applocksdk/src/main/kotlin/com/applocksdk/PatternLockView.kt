package com.applocksdk

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View

/**
 * 3x3 grid the user draws a Pattern on. Thin Android adapter over [PatternGridGeometry]
 * (touch coordinate -> cell) and [PatternGestureTracker] (cell sequence -> completed
 * gesture). Canvas drawing itself is not unit tested - verified manually on-device.
 */
internal class PatternLockView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {

    var onPatternComplete: ((List<Int>) -> Unit)? = null

    var dotColor: Int = Color.WHITE
        set(value) { field = value; dotPaint.color = value }

    var lineColor: Int = Color.parseColor("#4F8EF7")
        set(value) { field = value; linePaint.color = value }

    private val tracker = PatternGestureTracker()

    private val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = dotColor }
    private val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = lineColor
        strokeWidth = 8f
        style = Paint.Style.STROKE
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isEnabled) return false
        val cell = PatternGridGeometry.cellIndexAt(event.x, event.y, width, height)
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> if (cell != null) tracker.onTouchDown(cell)
            // A fast drag can have several samples batched into one ACTION_MOVE - replay the
            // batched history first, or an in-between cell (e.g. the center, on a diagonal) can
            // get skipped entirely.
            MotionEvent.ACTION_MOVE -> {
                for (i in 0 until event.historySize) {
                    val historicalCell = PatternGridGeometry.cellIndexAt(event.getHistoricalX(i), event.getHistoricalY(i), width, height)
                    if (historicalCell != null) tracker.onTouchMove(historicalCell)
                }
                if (cell != null) tracker.onTouchMove(cell)
            }
            MotionEvent.ACTION_UP -> onPatternComplete?.invoke(tracker.onTouchUp())
        }
        invalidate()
        return true
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val cellWidth = width / 3f
        val cellHeight = height / 3f
        val centers = (0 until 9).map { i ->
            (i % 3 + 0.5f) * cellWidth to (i / 3 + 0.5f) * cellHeight
        }

        val touchedPoints = tracker.currentPoints()
        for (i in 0 until touchedPoints.size - 1) {
            val (x1, y1) = centers[touchedPoints[i]]
            val (x2, y2) = centers[touchedPoints[i + 1]]
            canvas.drawLine(x1, y1, x2, y2, linePaint)
        }

        // Drawn a bit smaller than the actual touch hit-radius (PatternGridGeometry) so the
        // dot still looks reasonable, while giving a visual hint of how forgiving the real
        // touch target is.
        val radius = minOf(cellWidth, cellHeight) / 3f
        centers.forEach { (x, y) -> canvas.drawCircle(x, y, radius, dotPaint) }
    }
}