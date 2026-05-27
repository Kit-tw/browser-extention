import { create } from 'zustand'
import type { Note } from '../types/note.types'

const NOTES_KEY = 'notes'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function makeNote(title: string): Note {
  return { id: generateId(), title, body: '', updatedAt: new Date().toISOString() }
}

interface NotesState {
  notes: Note[]
  activeNoteId: string | null
  initialized: boolean
  init: () => Promise<void>
  setActive: (id: string) => void
  addNote: () => void
  updateNote: (id: string, partial: Partial<Pick<Note, 'title' | 'body'>>) => void
  deleteNote: (id: string) => void
}

async function readNotes(): Promise<Note[]> {
  try {
    const result = await chrome.storage.sync.get(NOTES_KEY)
    if (Array.isArray(result[NOTES_KEY])) return result[NOTES_KEY] as Note[]
  } catch { /* fallback */ }
  return []
}

async function writeNotes(notes: Note[]): Promise<void> {
  try {
    await chrome.storage.sync.set({ [NOTES_KEY]: notes })
  } catch { /* silently fail */ }
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  initialized: false,

  init: async () => {
    let notes = await readNotes()
    if (notes.length === 0) notes = [makeNote('Scratch')]
    set({ notes, activeNoteId: notes[0].id, initialized: true })

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync' || !changes[NOTES_KEY]) return
      const incoming = changes[NOTES_KEY].newValue as Note[] | undefined
      if (!Array.isArray(incoming)) return
      const { activeNoteId } = get()
      const stillExists = incoming.some((n) => n.id === activeNoteId)
      set({
        notes: incoming,
        activeNoteId: stillExists ? activeNoteId : (incoming[0]?.id ?? null),
      })
    })
  },

  setActive: (id) => set({ activeNoteId: id }),

  addNote: () => {
    const note = makeNote('New note')
    const updated = [...get().notes, note]
    set({ notes: updated, activeNoteId: note.id })
    writeNotes(updated)
  },

  updateNote: (id, partial) => {
    const updated = get().notes.map((n) =>
      n.id === id ? { ...n, ...partial, updatedAt: new Date().toISOString() } : n,
    )
    set({ notes: updated })
    writeNotes(updated)
  },

  deleteNote: (id) => {
    const current = get()
    const updated = current.notes.filter((n) => n.id !== id)
    const activeNoteId = current.activeNoteId === id ? (updated[0]?.id ?? null) : current.activeNoteId
    set({ notes: updated, activeNoteId })
    writeNotes(updated)
  },
}))
