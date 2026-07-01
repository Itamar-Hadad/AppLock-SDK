package com.applocksdk.demo

import android.os.Bundle
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity
import com.applocksdk.AppLockSDK
import com.google.android.material.appbar.MaterialToolbar

class NoteDetailActivity : AppCompatActivity() {

    private var noteId: Int = NEW_NOTE_ID
    private lateinit var editTitle: EditText
    private lateinit var editContent: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_note_detail)

        AppLockSDK.lock()

        noteId = intent.getIntExtra(EXTRA_NOTE_ID, NEW_NOTE_ID)
        editTitle = findViewById(R.id.edit_title)
        editContent = findViewById(R.id.edit_content)

        val toolbar = findViewById<MaterialToolbar>(R.id.note_detail_toolbar)
        setSupportActionBar(toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val note = NoteStore.getById(noteId)
        if (note != null) {
            supportActionBar?.title = ""
            editTitle.setText(note.title)
            editContent.setText(note.content)
        } else {
            supportActionBar?.title = getString(R.string.new_note)
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    override fun onPause() {
        super.onPause()
        saveNote()
    }

    private fun saveNote() {
        val title = editTitle.text.toString().trim()
        val content = editContent.text.toString().trim()
        if (title.isEmpty() && content.isEmpty()) return
        if (noteId == NEW_NOTE_ID) {
            noteId = NoteStore.addNote(title, content).id
        } else {
            NoteStore.updateNote(noteId, title, content)
        }
    }

    companion object {
        const val EXTRA_NOTE_ID = "com.applocksdk.demo.EXTRA_NOTE_ID"
        const val NEW_NOTE_ID = -1
    }
}