import React, { useState, useRef, useEffect } from 'react'
import { useNotes } from '../../hooks/useNotes'

function PaperCard({
  note,
  isActive,
  isNew,
  canDelete,
  onClick,
  onDelete,
}: {
  note: { id: string; title: string; body: string }
  isActive: boolean
  isNew: boolean
  canDelete: boolean
  onClick: () => void
  onDelete: () => void
}) {
  const firstLine = note.body.split('\n')[0]?.trim().slice(0, 55) || ''

  return (
    <div
      className={`
        group relative shrink-0 w-[68px] h-[84px] rounded cursor-pointer select-none
        transition-all duration-200
        ${isNew ? 'animate-paper-in' : ''}
        ${isActive
          ? 'bg-white dark:bg-[#1E2535] shadow-[0_4px_16px_rgba(79,144,240,0.22)] -translate-y-1.5 border border-[#4F90F0]/50 dark:border-[#4F90F0]/40'
          : 'bg-white dark:bg-[#1A2130] shadow-sm hover:-translate-y-1 hover:shadow-md border border-[#E2E6EF] dark:border-[#252D3D]'}
      `}
      onClick={onClick}
    >
      {/* Red margin line */}
      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-red-300/50 dark:bg-red-800/30 pointer-events-none" />

      {/* Ruled lines */}
      <div className="absolute inset-x-2 top-[30px] bottom-2 flex flex-col justify-between pointer-events-none">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-px bg-[#EEF1F6] dark:bg-[#232B3A]" />
        ))}
      </div>

      {/* Title */}
      <p className="relative px-2 pt-1.5 ml-3 text-[9px] font-semibold font-mono truncate
        text-[#374151] dark:text-[#CDD3DF] leading-tight">
        {note.title || 'Untitled'}
      </p>

      {/* Body preview */}
      <p className="relative px-2 mt-1 ml-3 text-[8px] text-[#9BA3B0] dark:text-[#6B7585]
        leading-[1.6] overflow-hidden h-[38px]">
        {firstLine || '–'}
      </p>

      {/* Delete badge */}
      {canDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full
            flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-opacity duration-150
            bg-red-500 text-white shadow-sm z-10"
          aria-label="Delete note"
        >
          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function NoteWidget() {
  const { notes, activeNoteId, addNote, updateNote, deleteNote, setActive } = useNotes()
  const [newNoteId, setNewNoteId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const prevNoteIdsRef = useRef<string[]>([])

  const activeNote = notes.find(n => n.id === activeNoteId)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [activeNote?.body])

  // Detect newly added note for entrance animation
  useEffect(() => {
    const prevIds = prevNoteIdsRef.current
    const currIds = notes.map(n => n.id)
    const added = currIds.find(id => !prevIds.includes(id))
    if (added) setNewNoteId(added)
    prevNoteIdsRef.current = currIds
  }, [notes])

  useEffect(() => {
    if (!newNoteId) return
    const t = setTimeout(() => setNewNoteId(null), 400)
    return () => clearTimeout(t)
  }, [newNoteId])

  // note:focus-title → focus title input
  useEffect(() => {
    const handler = () => setTimeout(() => titleInputRef.current?.focus(), 60)
    document.addEventListener('note:focus-title', handler)
    return () => document.removeEventListener('note:focus-title', handler)
  }, [])

  const savedTime = activeNote?.updatedAt
    ? new Date(activeNote.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : null

  return (
    <div>
      {/* Papers row */}
      <div className="flex items-end gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {notes.map(note => (
          <PaperCard
            key={note.id}
            note={note}
            isActive={note.id === activeNoteId}
            isNew={note.id === newNoteId}
            canDelete={notes.length > 1}
            onClick={() => setActive(note.id)}
            onDelete={() => deleteNote(note.id)}
          />
        ))}

        {/* Add circle button */}
        <button
          onClick={addNote}
          className="shrink-0 w-9 h-9 rounded-full self-center mb-2
            flex items-center justify-center
            bg-[#F0F5FF] dark:bg-[#1A2235]
            border border-[#4F90F0]/30 dark:border-[#4F90F0]/20
            text-[#4F90F0]
            hover:bg-[#4F90F0]/15 hover:border-[#4F90F0]/60
            transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="New note"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#F0F3F7] dark:bg-[#1A1E28] my-2.5" />

      {/* Editor — key forces re-mount (and re-animation) on note switch */}
      {activeNote && (
        <div key={activeNoteId} className="animate-editor-in">
          <input
            ref={titleInputRef}
            value={activeNote.title}
            onChange={e => updateNote(activeNoteId!, { title: e.target.value })}
            placeholder="Note title"
            className="w-full text-sm font-semibold bg-transparent outline-none
              text-[#374151] dark:text-[#CDD3DF]
              placeholder-[#C2CAD8] dark:placeholder-[#3A4555]
              border-b border-transparent focus:border-[#4F90F0]/30
              pb-1 mb-2 transition-colors duration-150"
          />
          <textarea
            ref={textareaRef}
            value={activeNote.body}
            onChange={e => updateNote(activeNoteId!, { body: e.target.value })}
            placeholder="Start typing…"
            rows={4}
            className="w-full resize-none text-sm font-mono leading-relaxed
              text-[#374151] dark:text-[#CDD3DF]
              placeholder-[#C2CAD8] dark:placeholder-[#3A4555]
              bg-transparent outline-none"
            spellCheck={false}
          />
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#B8BFCC] dark:text-[#6B7585] mt-1">
            {activeNote.body.length} chars{savedTime && ` · saved ${savedTime}`}
          </p>
        </div>
      )}
    </div>
  )
}
