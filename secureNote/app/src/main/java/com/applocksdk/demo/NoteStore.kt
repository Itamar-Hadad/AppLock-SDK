package com.applocksdk.demo

data class Note(val id: Int, var title: String, var content: String, val colorIndex: Int = 0)

object NoteStore {

    private var nextId = 5
    private const val PALETTE_SIZE = 5

    val notes: MutableList<Note> = mutableListOf(
        Note(1, "Bank Passwords", "Checking account PIN: 4821\nOnline banking password: Tr0ub4dor&3", 0),
        Note(2, "Diary", "Dear diary, today I finally told her how I felt...", 3),
        Note(3, "Crypto Wallet Seed", "abandon ability able about above absent absorb abstract", 1),
        Note(4, "Medical Records", "Blood type: O+\nAllergies: penicillin\nLast checkup: 2026-04-02", 2),
    )

    fun addNote(title: String, content: String): Note {
        val note = Note(nextId++, title, content, notes.size % PALETTE_SIZE)
        notes.add(note)
        return note
    }

    fun getById(id: Int): Note? = notes.find { it.id == id }

    fun updateNote(id: Int, title: String, content: String) {
        val note = getById(id) ?: return
        note.title = title
        note.content = content
    }

    fun deleteById(id: Int) {
        notes.removeAll { it.id == id }
    }

    fun reset() {
        notes.clear()
        notes.addAll(
            listOf(
                Note(1, "Bank Passwords", "Checking account PIN: 4821\nOnline banking password: Tr0ub4dor&3", 0),
                Note(2, "Diary", "Dear diary, today I finally told her how I felt...", 3),
                Note(3, "Crypto Wallet Seed", "abandon ability able about above absent absorb abstract", 1),
                Note(4, "Medical Records", "Blood type: O+\nAllergies: penicillin\nLast checkup: 2026-04-02", 2),
            )
        )
        nextId = 5
    }
}