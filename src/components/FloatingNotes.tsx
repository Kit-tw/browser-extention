import React, { useState, useRef, useEffect } from 'react'
import { useNotes } from '../hooks/useNotes'
import { useNotesStore } from '../store/notes.store'

const ROTATIONS = ['-2deg', '1.5deg', '-1.2deg', '2.2deg', '-0.8deg']
const MAX_VISIBLE = 5

function NotePaper({
  note,
  rotation,
  isSelected,
  isNew,
  onClick,
}: {
  note: { id: string; title: string; body: string }
  rotation: string
  isSelected: boolean
  isNew: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        shrink-0 cursor-pointer select-none
        transition-all duration-200
        ${isNew ? 'animate-note-paper-in' : ''}
        ${isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105 hover:-translate-y-1'}
      `}
    >
      <div
        className={`
          relative w-[56px] h-[76px] rounded-sm bg-white
          transition-shadow duration-200
          ${isSelected
            ? 'shadow-xl border border-blue-200'
            : 'shadow-md border border-gray-100 hover:shadow-lg'}
        `}
        style={{ transform: `rotate(${rotation})` }}
      >
        {/* Red margin line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-red-200 pointer-events-none" />

        {/* Ruled lines */}
        <div className="absolute inset-x-2 top-[26px] bottom-2 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-px bg-blue-100" />
          ))}
        </div>

        {/* Title */}
        <p className="absolute top-2 left-4 right-1 text-[7.5px] font-semibold font-mono truncate text-gray-600">
          {note.title || 'Note'}
        </p>
      </div>
    </div>
  )
}

function ComposePanel({
  onSave,
  onCancel,
}: {
  onSave: (title: string, body: string) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  return (
    <div
      className="w-64 animate-compose-panel-in bg-white rounded-xl shadow-2xl border border-gray-100 p-4"
      onKeyDown={e => e.key === 'Escape' && onCancel()}
    >
      <input
        ref={titleRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Note title"
        className="w-full text-sm font-semibold outline-none bg-transparent
          text-gray-700 placeholder-gray-400 border-b border-gray-100 pb-2 mb-3"
      />
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write something…"
        rows={4}
        className="w-full text-sm font-mono leading-relaxed resize-none outline-none
          bg-transparent text-gray-600 placeholder-gray-400"
        onKeyDown={e => e.key === 'Escape' && onCancel()}
      />
      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(title, body)}
          className="text-xs bg-[#4F90F0] hover:bg-[#3B7DE8] text-white px-3 py-1 rounded-md transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}

function NoteViewPanel({
  note,
  onClose,
  onUpdate,
  onDelete,
  canDelete,
}: {
  note: { id: string; title: string; body: string }
  onClose: () => void
  onUpdate: (partial: { title?: string; body?: string }) => void
  onDelete: () => void
  canDelete: boolean
}) {
  return (
    <div className="w-72 animate-compose-panel-in bg-white rounded-xl shadow-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <input
          value={note.title}
          onChange={e => onUpdate({ title: e.target.value })}
          placeholder="Note title"
          className="flex-1 text-sm font-semibold outline-none bg-transparent
            text-gray-700 placeholder-gray-400
            border-b border-transparent focus:border-[#4F90F0]/30 transition-colors pb-0.5"
        />
        <div className="flex items-center gap-0.5 shrink-0">
          {canDelete && (
            <button
              onClick={onDelete}
              className="w-6 h-6 flex items-center justify-center rounded
                text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
              aria-label="Delete"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded
              text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <textarea
        value={note.body}
        onChange={e => onUpdate({ body: e.target.value })}
        placeholder="Note content…"
        rows={6}
        className="w-full text-sm font-mono leading-relaxed resize-none outline-none
          bg-transparent text-gray-600 placeholder-gray-400"
      />
    </div>
  )
}

function LimitToast() {
  return (
    <div className="animate-compose-panel-in flex items-center gap-2
      bg-white border border-amber-200 rounded-lg shadow-lg
      px-3.5 py-2.5 text-xs font-medium text-amber-600">
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Max 5 notes reached
    </div>
  )
}

export function FloatingNotes({ open = true, onClose }: { open?: boolean; onClose?: () => void }) {
  if (!open) return null
  return <FloatingNotesInner onClose={onClose} />
}

function FloatingNotesInner({ onClose: _onClose }: { onClose?: () => void }) {
  const { notes, addNote, updateNote, deleteNote } = useNotes()
  const [composing, setComposing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newNoteId, setNewNoteId] = useState<string | null>(null)
  const [limitHit, setLimitHit] = useState(false)
  const prevIdsRef = useRef<string[]>([])

  const visibleNotes = notes.slice(-MAX_VISIBLE)
  const selectedNote = notes.find(n => n.id === selectedId)

  // Detect newly added note for entrance animation
  useEffect(() => {
    const prev = prevIdsRef.current
    const curr = notes.map(n => n.id)
    const added = curr.find(id => !prev.includes(id))
    if (added) setNewNoteId(added)
    prevIdsRef.current = curr
  }, [notes])

  useEffect(() => {
    if (!newNoteId) return
    const t = setTimeout(() => setNewNoteId(null), 500)
    return () => clearTimeout(t)
  }, [newNoteId])

  const notifyLimit = () => {
    setLimitHit(true)
    setTimeout(() => setLimitHit(false), 2500)
  }

  // N shortcut → open compose panel (or notify if at limit)
  useEffect(() => {
    const handler = () => {
      if (notes.length >= MAX_VISIBLE) { notifyLimit(); return }
      setComposing(true)
      setSelectedId(null)
    }
    document.addEventListener('note:compose', handler)
    return () => document.removeEventListener('note:compose', handler)
  }, [notes.length])

  const handleSave = (title: string, body: string) => {
    addNote()
    const newId = useNotesStore.getState().activeNoteId
    if (newId) updateNote(newId, { title: title.trim() || 'New note', body })
    setComposing(false)
  }

  const toggleCompose = () => {
    if (notes.length >= MAX_VISIBLE) { notifyLimit(); return }
    setComposing(v => !v)
    setSelectedId(null)
  }

  const selectNote = (id: string) => {
    setSelectedId(prev => (prev === id ? null : id))
    setComposing(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Limit toast */}
      {limitHit && <LimitToast />}

      {/* Compose or view panel — floats above the paper row */}
      {composing && (
        <ComposePanel onSave={handleSave} onCancel={() => setComposing(false)} />
      )}
      {selectedNote && !composing && (
        <NoteViewPanel
          note={selectedNote}
          onClose={() => setSelectedId(null)}
          onUpdate={partial => updateNote(selectedId!, partial)}
          onDelete={() => { deleteNote(selectedId!); setSelectedId(null) }}
          canDelete={true}
        />
      )}

      {/* Paper row + add button */}
      <div className="flex items-end gap-2">
        {visibleNotes.map((note, i) => (
          <NotePaper
            key={note.id}
            note={note}
            rotation={ROTATIONS[i % ROTATIONS.length]}
            isSelected={note.id === selectedId}
            isNew={note.id === newNoteId}
            onClick={() => selectNote(note.id)}
          />
        ))}

        <button
          onClick={toggleCompose}
          className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center
            bg-[#4F90F0] hover:bg-[#3B7DE8] text-white shadow-lg
            transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="New note"
        >
          <svg
            className="w-5 h-5 transition-transform duration-300"
            style={{ transform: composing ? 'rotate(45deg)' : 'none' }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
