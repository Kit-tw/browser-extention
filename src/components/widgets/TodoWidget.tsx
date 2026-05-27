import React, { useState, useRef, useCallback, KeyboardEvent } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTodos } from '../../hooks/useTodos'
import type { Todo } from '../../types/todo.types'

function CheckCircle({ checking, onCheck }: { checking: boolean; onCheck: () => void }) {
  return (
    <button
      onClick={onCheck}
      disabled={checking}
      className={`
        shrink-0 w-[18px] h-[18px] rounded-full border-2
        flex items-center justify-center
        transition-all duration-150
        ${checking
          ? 'border-[#4F90F0] bg-[#4F90F0]'
          : 'border-[#C2CAD8] dark:border-[#3A4555] hover:border-[#4F90F0] hover:bg-[#4F90F0]/10 group-hover/row:border-[#4F90F0]/60'
        }
      `}
      aria-label="Complete task"
    >
      <svg
        className={`w-2.5 h-2.5 transition-opacity duration-100
          ${checking
            ? 'text-white animate-check-in opacity-100'
            : 'text-[#4F90F0] opacity-0 group-hover/row:opacity-50'
          }`}
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

interface RowProps {
  todo: Todo
  onDelete: (id: string) => void
  onUpdate: (id: string, partial: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void
}

function SortableTodoRow({ todo, onDelete, onUpdate }: RowProps) {
  const [checking, setChecking] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: checking,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  }

  const handleCheck = () => {
    if (checking) return
    setChecking(true)
    setTimeout(() => onDelete(todo.id), 420)
  }

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) onUpdate(todo.id, { text: trimmed })
    else setEditText(todo.text)
    setEditing(false)
  }, [editText, todo.id, todo.text, onUpdate])

  const handleEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditText(todo.text); setEditing(false) }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group/row flex items-center gap-2.5 py-2
        border-b border-[#F0F3F7] dark:border-[#1A1E28] last:border-0
        ${checking ? 'animate-todo-done pointer-events-none' : ''}
        ${isDragging ? 'z-10 relative' : ''}
      `}
    >
      {/* Drag grip */}
      <button
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Drag to reorder"
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none
          text-transparent group-hover/row:text-[#C2CAD8] dark:group-hover/row:text-[#3A4555]
          transition-colors duration-150"
      >
        <svg className="w-3 h-3.5" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3"  r="1.1" /><circle cx="9" cy="3"  r="1.1" />
          <circle cx="3" cy="8"  r="1.1" /><circle cx="9" cy="8"  r="1.1" />
          <circle cx="3" cy="13" r="1.1" /><circle cx="9" cy="13" r="1.1" />
        </svg>
      </button>

      {/* Checkbox */}
      <CheckCircle checking={checking} onCheck={handleCheck} />

      {/* Text */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKey}
            autoFocus
            className="w-full text-sm bg-transparent outline-none
              border-b border-[#4F90F0]/40
              text-[#374151] dark:text-[#CDD3DF]"
          />
        ) : (
          <span
            onClick={() => {
              if (checking) return
              setEditing(true)
              setEditText(todo.text)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className={`
              text-sm cursor-pointer leading-snug select-none
              transition-colors duration-200
              ${checking
                ? 'line-through text-[#C2CAD8] dark:text-[#3A4555]'
                : 'text-[#374151] dark:text-[#CDD3DF] hover:text-[#4F90F0] dark:hover:text-[#4F90F0]'
              }
            `}
          >
            {todo.text}
          </span>
        )}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(todo.id)}
        aria-label="Delete"
        className="shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity
          text-[#C2CAD8] dark:text-[#3A4555]
          hover:text-red-400 dark:hover:text-red-400"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function TodoWidget() {
  const { todos, addTodo, deleteTodo, updateTodo, reorderTodos } = useTodos()
  const [inputText, setInputText] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleAdd = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed) return
    addTodo(trimmed)
    setInputText('')
  }, [inputText, addTodo])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) reorderTodos(String(active.id), String(over.id))
  }

  return (
    <div>
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 min-w-0 text-sm
            bg-[#F7F8FA] dark:bg-[#1A1E28]
            border border-[#E2E6EF] dark:border-[#252D3D] rounded-lg
            px-3 py-1.5
            text-[#374151] dark:text-[#CDD3DF]
            placeholder-[#C2CAD8] dark:placeholder-[#3A4555]
            outline-none focus:ring-1 focus:ring-[#4F90F0]/50 focus:border-[#4F90F0]/40
            transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium
            bg-[#4F90F0] hover:bg-[#3B7DE8] text-white
            disabled:opacity-35 disabled:cursor-not-allowed
            transition-colors"
        >
          Add
        </button>
      </form>

      {/* List */}
      <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {todos.map(todo => (
              <SortableTodoRow
                key={todo.id}
                todo={todo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
