import { useEffect } from 'react'
import { useNotesStore } from '../store/notes.store'

export function useNotes() {
  const store = useNotesStore()

  useEffect(() => {
    if (!store.initialized) store.init()
  }, [store.initialized])

  return {
    notes: store.notes,
    activeNoteId: store.activeNoteId,
    initialized: store.initialized,
    setActive: store.setActive,
    addNote: store.addNote,
    updateNote: store.updateNote,
    deleteNote: store.deleteNote,
  }
}
