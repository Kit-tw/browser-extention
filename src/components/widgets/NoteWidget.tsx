import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNotes } from '../../hooks/useNotes'

export function NoteWidget() {
  const { notes, activeNoteId, addNote, updateNote, deleteNote, setActive } = useNotes()
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [tabEditValue, setTabEditValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeNote = notes.find((n) => n.id === activeNoteId)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [activeNote?.body])

  const handleBodyChange = useCallback(
    (value: string) => {
      if (!activeNoteId) return
      updateNote(activeNoteId, { body: value })
    },
    [activeNoteId, updateNote],
  )

  const startTabEdit = (id: string, currentTitle: string) => {
    setEditingTabId(id)
    setTabEditValue(currentTitle)
  }

  const commitTabEdit = () => {
    if (editingTabId && tabEditValue.trim()) {
      updateNote(editingTabId, { title: tabEditValue.trim() })
    }
    setEditingTabId(null)
  }

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitTabEdit()
    if (e.key === 'Escape') setEditingTabId(null)
  }

  const savedTime = activeNote?.updatedAt
    ? new Date(activeNote.updatedAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : null

  return (
    <div>
      {/* Tab strip */}
      <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
        {notes.map((note) => (
          <div
            key={note.id}
            className={`flex items-center gap-1 shrink-0 rounded px-2 py-1 text-xs font-medium cursor-pointer select-none transition-colors ${
              note.id === activeNoteId
                ? 'bg-[#F0F3F7] dark:bg-[#252D3D] text-[#374151] dark:text-[#CDD3DF]'
                : 'text-[#9BA3B0] dark:text-[#8B95A8] hover:bg-[#F7F8FA] dark:hover:bg-[#1E2535]'
            }`}
            onClick={() => setActive(note.id)}
          >
            {editingTabId === note.id ? (
              <input
                autoFocus
                value={tabEditValue}
                onChange={(e) => setTabEditValue(e.target.value)}
                onBlur={commitTabEdit}
                onKeyDown={handleTabKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="w-20 text-xs bg-transparent border-b border-[#4F90F0] outline-none"
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  startTabEdit(note.id, note.title)
                }}
                title="Double-click to rename"
              >
                {note.title}
              </span>
            )}

            {note.id === activeNoteId && notes.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNote(note.id)
                }}
                className="ml-0.5 text-[#C2CAD8] dark:text-[#3A4555] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label="Delete note"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        <button
          onClick={addNote}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded
            text-[#C2CAD8] dark:text-[#3A4555]
            hover:text-[#4F90F0] dark:hover:text-[#4F90F0]
            hover:bg-[#F0F3F7] dark:hover:bg-[#1E2535]
            transition-colors"
          aria-label="New note"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Editor */}
      {activeNote && (
        <textarea
          ref={textareaRef}
          value={activeNote.body}
          onChange={(e) => handleBodyChange(e.target.value)}
          placeholder="Start typing…"
          rows={5}
          className="w-full resize-none text-sm font-mono leading-relaxed
            text-[#374151] dark:text-[#CDD3DF]
            placeholder-[#C2CAD8] dark:placeholder-[#3A4555]
            bg-transparent outline-none"
          spellCheck={false}
        />
      )}

      {/* Footer */}
      {activeNote && (
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#B8BFCC] dark:text-[#6B7585] mt-1">
          {activeNote.body.length} chars
          {savedTime && ` · saved ${savedTime}`}
        </p>
      )}
    </div>
  )
}
