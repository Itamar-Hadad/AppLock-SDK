package com.applocksdk.demo

import android.os.Bundle
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.applocksdk.AppLockSDK
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.button.MaterialButton

class ControlPanelActivity : AppCompatActivity() {

    private lateinit var statusText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_control_panel)

        val toolbar = findViewById<MaterialToolbar>(R.id.control_panel_toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        statusText = findViewById(R.id.control_panel_status_text)

        findViewById<MaterialButton>(R.id.setup_pin_button).setOnClickListener {
            AppLockSDK.setupPin(this)
        }
        findViewById<MaterialButton>(R.id.lock_now_button).setOnClickListener {
            AppLockSDK.lock()
            refreshStatus()
        }
        findViewById<MaterialButton>(R.id.reset_button).setOnClickListener {
            AppLockSDK.reset()
            refreshStatus()
        }
        findViewById<MaterialButton>(R.id.simulate_crash_button).setOnClickListener {
            throw RuntimeException("Simulated crash for demo — AppLock SDK crash-safe error reporting")
        }
    }

    override fun onResume() {
        super.onResume()
        refreshStatus()
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    private fun refreshStatus() {
        statusText.text = "Locked: ${AppLockSDK.isLocked()}"
    }
}