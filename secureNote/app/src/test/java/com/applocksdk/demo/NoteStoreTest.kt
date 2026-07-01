package com.applocksdk.demo

import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class NoteStoreTest {

    @Before
    fun setUp() {
        NoteStore.reset()
    }

    @Test
    fun `initial notes are populated`() {
        assertEquals(4, NoteStore.notes.size)
    }

    @Test
    fun `addNote creates note and appends it to list`() {
        val before = NoteStore.notes.size
        val note = NoteStore.addNote("Test Title", "Test Content")
        assertEquals(before + 1, NoteStore.notes.size)
        assertEquals("Test Title", note.title)
        assertEquals("Test Content", note.content)
    }

    @Test
    fun `getById returns correct note`() {
        val note = NoteStore.getById(1)
        assertNotNull(note)
        assertEquals("Bank Passwords", note!!.title)
    }

    @Test
    fun `getById returns null for unknown id`() {
        assertNull(NoteStore.getById(9999))
    }

    @Test
    fun `updateNote changes title and content`() {
        NoteStore.updateNote(1, "New Title", "New Content")
        val note = NoteStore.getById(1)
        assertEquals("New Title", note!!.title)
        assertEquals("New Content", note.content)
    }

    @Test
    fun `deleteById removes note from list`() {
        val sizeBefore = NoteStore.notes.size
        NoteStore.deleteById(1)
        assertEquals(sizeBefore - 1, NoteStore.notes.size)
        assertNull(NoteStore.getById(1))
    }
}