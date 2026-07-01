package com.applocksdk

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

internal class LockActivity : FragmentActivity() {

    private val enteredDigits = StringBuilder()
    private var setupFirstEntry: String? = null
    private lateinit var mode: Mode
    private lateinit var titleView: TextView
    private lateinit var dotViews: List<View>
    private lateinit var inputButtons: List<Button>
    private lateinit var patternView: PatternLockView
    private var isPatternMode = false
    private var lockoutTimer: CountDownTimer? = null
    private var biometricPrompt: BiometricPrompt? = null
    private var theme: LockTheme? = null

    private val methodLabel: String
        get() = if (isPatternMode) "Pattern" else "PIN"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.applocksdk_activity_lock)

        mode = Mode.valueOf(intent.getStringExtra(EXTRA_MODE) ?: Mode.ENTRY.name)
        isPatternMode = AppLockSDK.engineForInternalUse().isPatternEnabled()
        titleView = findViewById(R.id.applocksdk_title)
        dotViews = listOf(
            R.id.applocksdk_dot_1,
            R.id.applocksdk_dot_2,
            R.id.applocksdk_dot_3,
            R.id.applocksdk_dot_4,
        ).map { findViewById(it) }

        titleView.text = if (mode == Mode.SETUP) "Set up $methodLabel" else "Enter $methodLabel"

        val digitButtonIds = listOf(
            R.id.applocksdk_button_0, R.id.applocksdk_button_1, R.id.applocksdk_button_2,
            R.id.applocksdk_button_3, R.id.applocksdk_button_4, R.id.applocksdk_button_5,
            R.id.applocksdk_button_6, R.id.applocksdk_button_7, R.id.applocksdk_button_8,
            R.id.applocksdk_button_9,
        )
        val backspaceButton = findViewById<Button>(R.id.applocksdk_button_backspace)
        inputButtons = digitButtonIds.map { findViewById<Button>(it) } + backspaceButton
        digitButtonIds.forEachIndexed { digit, id ->
            findViewById<Button>(id).setOnClickListener { onDigitEntered(digit.toString()) }
        }
        backspaceButton.setOnClickListener { onBackspace() }

        patternView = findViewById(R.id.applocksdk_pattern_view)
        if (isPatternMode) {
            findViewById<View>(R.id.applocksdk_dots_row).visibility = View.GONE
            findViewById<View>(R.id.applocksdk_number_pad).visibility = View.GONE
            patternView.visibility = View.VISIBLE
            patternView.onPatternComplete = { points -> onSecretEntered(PatternEncoding.patternToString(points)) }
        }

        applyTheme(AppLockSDK.engineForInternalUse().theme())

        if (mode == Mode.ENTRY) {
            // The system Back button must never just dismiss the lock screen and reveal
            // whatever is underneath with no PIN/biometric check - cancel by closing the
            // protected screen too, landing the user further back instead.
            onBackPressedDispatcher.addCallback(
                this,
                object : OnBackPressedCallback(true) {
                    override fun handleOnBackPressed() {
                        setResult(RESULT_CANCELED)
                        AppLockSDK.finishProtectedActivity()
                        finish()
                    }
                },
            )

            val engine = AppLockSDK.engineForInternalUse()
            if (engine.isLockedOut()) {
                enterLockoutUi()
            } else if (engine.isBiometricEnabled()) {
                startBiometricPrompt()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        lockoutTimer?.cancel()
        biometricPrompt?.cancelAuthentication()
    }

    private fun startBiometricPrompt() {
        val coordinator = BiometricUnlockCoordinator(
            engine = AppLockSDK.engineForInternalUse(),
            onUnlockSuccess = {
                setResult(RESULT_OK)
                finish()
            },
            onFallbackToPin = {
                biometricPrompt?.cancelAuthentication()
                titleView.text = "Use $methodLabel to continue"
            },
        )
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                coordinator.onAuthenticationSucceeded()
            }

            override fun onAuthenticationFailed() {
                coordinator.onAuthenticationFailed()
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                coordinator.onAuthenticationError()
            }
        }
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock the App")
            .setNegativeButtonText("Use $methodLabel")
            .build()
        BiometricPrompt(this, ContextCompat.getMainExecutor(this), callback).also {
            biometricPrompt = it
            it.authenticate(promptInfo)
        }
    }

    private fun onDigitEntered(digit: String) {
        if (enteredDigits.length >= PIN_LENGTH) return
        enteredDigits.append(digit)
        updateDots()
        if (enteredDigits.length == PIN_LENGTH) onPinComplete()
    }

    private fun onBackspace() {
        if (enteredDigits.isNotEmpty()) enteredDigits.deleteCharAt(enteredDigits.length - 1)
        updateDots()
    }

    private fun onPinComplete() {
        val pin = enteredDigits.toString()
        enteredDigits.clear()
        onSecretEntered(pin)
        updateDots()
    }

    private fun onSecretEntered(secret: String) {
        when (mode) {
            Mode.SETUP -> handleSetupEntry(secret)
            Mode.ENTRY -> handleUnlockAttempt(secret)
        }
    }

    private fun handleSetupEntry(secret: String) {
        val firstEntry = setupFirstEntry
        when {
            firstEntry == null -> {
                setupFirstEntry = secret
                titleView.text = "Confirm $methodLabel"
            }
            firstEntry == secret -> {
                val engine = AppLockSDK.engineForInternalUse()
                if (isPatternMode) engine.setupPattern(secret) else engine.setupPin(secret)
                setResult(RESULT_OK)
                finish()
            }
            else -> {
                setupFirstEntry = null
                titleView.text = "${methodLabel}s didn't match, try again"
            }
        }
    }

    private fun handleUnlockAttempt(secret: String) {
        val engine = AppLockSDK.engineForInternalUse()
        val success = if (isPatternMode) engine.attemptUnlockPattern(secret) else engine.attemptUnlock(secret)
        if (success) {
            setResult(RESULT_OK)
            finish()
        } else if (engine.isLockedOut()) {
            enterLockoutUi()
        } else {
            titleView.text = "Wrong $methodLabel - try again"
        }
    }

    private fun enterLockoutUi() {
        inputButtons.forEach { it.isEnabled = false }
        patternView.isEnabled = false
        val lockoutSeconds = AppLockSDK.engineForInternalUse().lockoutSeconds()
        lockoutTimer?.cancel()
        lockoutTimer = object : CountDownTimer(lockoutSeconds * 1000L, 1000L) {
            override fun onTick(millisRemaining: Long) {
                val secondsRemaining = (millisRemaining + 999) / 1000
                titleView.text = "Too many attempts - try again in ${secondsRemaining}s"
            }

            override fun onFinish() {
                inputButtons.forEach { it.isEnabled = true }
                patternView.isEnabled = true
                titleView.text = "Enter $methodLabel"
            }
        }.also { it.start() }
    }

    private fun applyTheme(theme: LockTheme?) {
        this.theme = theme
        if (theme == null) return
        theme.backgroundColor?.let { findViewById<View>(R.id.applocksdk_root).setBackgroundColor(Color.parseColor(it)) }
        theme.logoResId?.let {
            findViewById<ImageView>(R.id.applocksdk_logo).apply {
                setImageResource(it)
                visibility = View.VISIBLE
            }
        }
        theme.accentColor?.let { hex ->
            val color = Color.parseColor(hex)
            inputButtons.forEach { it.setTextColor(color) }
            patternView.lineColor = color
        }
        theme.pinDotColor?.let { patternView.dotColor = Color.parseColor(it) }
    }

    private fun updateDots() {
        dotViews.forEachIndexed { index, view ->
            val filled = index < enteredDigits.length
            view.setBackgroundResource(if (filled) R.drawable.applocksdk_dot_filled else R.drawable.applocksdk_dot_empty)
            if (filled) {
                theme?.pinDotColor?.let { (view.background.mutate() as GradientDrawable).setColor(Color.parseColor(it)) }
            }
        }
    }

    internal enum class Mode { SETUP, ENTRY }

    companion object {
        private const val EXTRA_MODE = "com.applocksdk.EXTRA_MODE"
        private const val PIN_LENGTH = 4

        fun setupIntent(context: Context): Intent =
            Intent(context, LockActivity::class.java).putExtra(EXTRA_MODE, Mode.SETUP.name)

        fun entryIntent(context: Context): Intent =
            Intent(context, LockActivity::class.java).putExtra(EXTRA_MODE, Mode.ENTRY.name)
    }
}
