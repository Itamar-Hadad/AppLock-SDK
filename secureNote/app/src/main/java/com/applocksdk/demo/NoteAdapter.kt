package com.applocksdk.demo

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.card.MaterialCardView

class NoteAdapter(
    private val notes: MutableList<Note>,
    private val onClick: (Note) -> Unit,
) : RecyclerView.Adapter<NoteAdapter.NoteViewHolder>() {

    private val palette = intArrayOf(
        R.color.note_yellow,
        R.color.note_green,
        R.color.note_blue,
        R.color.note_purple,
        R.color.note_peach,
    )

    inner class NoteViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val card: MaterialCardView = view.findViewById(R.id.note_card)
        val title: TextView = view.findViewById(R.id.note_title)
        val lockedHint: TextView = view.findViewById(R.id.note_locked_hint)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NoteViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_note, parent, false)
        return NoteViewHolder(view)
    }

    override fun onBindViewHolder(holder: NoteViewHolder, position: Int) {
        val note = notes[position]
        holder.title.text = note.title
        holder.lockedHint.visibility = if (note.content.isBlank()) View.GONE else View.VISIBLE
        holder.card.setCardBackgroundColor(
            ContextCompat.getColor(holder.card.context, palette[note.colorIndex % palette.size])
        )
        holder.itemView.setOnClickListener { onClick(note) }
    }

    override fun getItemCount() = notes.size
}