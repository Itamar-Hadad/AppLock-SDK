package com.applocksdk.demo

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.RecyclerView
import androidx.recyclerview.widget.StaggeredGridLayoutManager
import com.google.android.material.appbar.MaterialToolbar
import com.google.android.material.floatingactionbutton.FloatingActionButton

class MainActivity : AppCompatActivity() {

    private lateinit var adapter: NoteAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        setSupportActionBar(findViewById<MaterialToolbar>(R.id.toolbar))

        adapter = NoteAdapter(NoteStore.notes) { note ->
            startActivity(
                Intent(this, NoteDetailActivity::class.java)
                    .putExtra(NoteDetailActivity.EXTRA_NOTE_ID, note.id)
            )
        }

        val recycler = findViewById<RecyclerView>(R.id.notes_recycler)
        recycler.layoutManager = StaggeredGridLayoutManager(2, StaggeredGridLayoutManager.VERTICAL)
        recycler.adapter = adapter

        ViewCompat.setOnApplyWindowInsetsListener(recycler) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(v.paddingLeft, v.paddingTop, v.paddingRight, bars.bottom + 96)
            insets
        }

        findViewById<FloatingActionButton>(R.id.fab_add_note).setOnClickListener {
            startActivity(Intent(this, NoteDetailActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        adapter.notifyDataSetChanged()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menuInflater.inflate(R.menu.menu_main, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_control_panel -> {
                startActivity(Intent(this, ControlPanelActivity::class.java))
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
}