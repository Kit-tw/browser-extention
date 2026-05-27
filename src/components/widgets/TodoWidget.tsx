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
import type { Todo, TodoPriority } from '../../types/todo.types'
import { isOverdue } from '../../utils/time'
import type { TodoFilter } from '../../hooks/useTodos'

function priorityDotColor(priority: TodoPriority | undefined): string {
  switch (priority) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-400'
    case 'low':
      return 'bg-blue-400'
    default:
      return 'bg-transparent'
  }
}

interface SortableTodoRowProps {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, partial: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void
  isDragEnabled: boolean
}

function SortableTodoRow({
  todo,
  onToggle,
  onDelete,
  onUpdate,
  isDragEnabled,
}: SortableTodoRowProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const inputRef = useRef<HTMLInputElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    disabled: !isDragEnabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const commitEdit = useCallback(() => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, { text: trimmed })
    } else {
      setEditText(todo.text)
    }
    setEditing(false)
  }, [editText, todo.id, todo.text, onUpdate])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') {
      setEditText(todo.text)
      setEditing(false)
    }
  }

  const overdue = !todo.done && isOverdue(todo.dueDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0 group ${isDragging ? 'z-10 relative' : ''}`}
    >
      {/* Drag handle */}
      {isDragEnabled && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 text-gray-300 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 8h16M4 16h16" />
          </svg>
        </button>
      )}

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
        className="shrink-0 w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
        aria-label={`Mark "${todo.text}" as ${todo.done ? 'active' : 'done'}`}
      />

      {/* Text / inline edit */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm bg-white dark:bg-gray-700 border border-blue-400 rounded px-1 py-0.5 outline-none text-gray-800 dark:text-gray-100"
            autoFocus
          />
        ) : (
          <span
            className={`text-sm cursor-pointer ${
              todo.done
                ? 'line-through text-gray-400 dark:text-gray-400'
                : 'text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
            onClick={() => {
              setEditing(true)
              setEditText(todo.text)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
          >
            {todo.text}
          </span>
        )}

        {/* Due date chip */}
        {todo.dueDate && (
          <span
            className={`ml-1 text-xs px-1.5 py-0.5 rounded ${
              overdue
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            {todo.dueDate}
          </span>
        )}
      </div>

      {/* Priority dot */}
      {todo.priority && (
        <span
          className={`shrink-0 w-2 h-2 rounded-full ${priorityDotColor(todo.priority)}`}
          title={`Priority: ${todo.priority}`}
        />
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(todo.id)}
        className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Delete "${todo.text}"`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const FILTER_TABS: { label: string; value: TodoFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Done', value: 'done' },
]

export function TodoWidget() {
  const { todos, filteredTodos, filter, setFilter, addTodo, toggleDone, deleteTodo, updateTodo, reorderTodos } =
    useTodos()

  const [inputText, setInputText] = useState('')
  const [inputDueDate, setInputDueDate] = useState('')
  const [inputPriority, setInputPriority] = useState<TodoPriority | ''>('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleAdd = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmed = inputText.trim()
      if (!trimmed) return
      addTodo(
        trimmed,
        inputDueDate || undefined,
        (inputPriority as TodoPriority) || undefined,
      )
      setInputText('')
      setInputDueDate('')
      setInputPriority('')
    },
    [inputText, inputDueDate, inputPriority, addTodo],
  )

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTodos(String(active.id), String(over.id))
    }
  }

  const isDragEnabled = filter === 'all'
  const activeCount = todos.filter((t) => !t.done).length

  return (
    <div>
      {/* Active count summary */}
      {activeCount > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-400 mb-2">
          {activeCount} active task{activeCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Input form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-1.5 mb-3">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task..."
            className="flex-1 min-w-0 text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        <div className="flex gap-1.5">
          <input
            type="date"
            value={inputDueDate}
            onChange={(e) => setInputDueDate(e.target.value)}
            className="flex-1 min-w-0 text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={inputPriority}
            onChange={(e) => setInputPriority(e.target.value as TodoPriority | '')}
            className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </form>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              filter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Todo list */}
      {filteredTodos.length === 0 ? (
        <EmptyTodoState filter={filter} />
      ) : (
        <div className="max-h-64 overflow-y-auto pr-1 -mr-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTodos.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredTodos.map((todo) => (
                <SortableTodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleDone}
                  onDelete={deleteTodo}
                  onUpdate={updateTodo}
                  isDragEnabled={isDragEnabled}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  )
}

function EmptyTodoState({ filter }: { filter: TodoFilter }) {
  const messages: Record<TodoFilter, string> = {
    all: 'No tasks yet. Add one above!',
    active: 'No active tasks.',
    done: 'No completed tasks yet.',
  }
  return (
    <div className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-400">
      <p className="text-sm">{messages[filter]}</p>
    </div>
  )
}
