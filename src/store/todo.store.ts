import { create } from 'zustand'
import type { Todo, TodoPriority } from '../types/todo.types'

const STORAGE_KEY = 'todos'

interface TodoState {
  todos: Todo[]
  initialized: boolean
  init: () => Promise<void>
  addTodo: (text: string, dueDate?: string, priority?: TodoPriority) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  updateTodo: (id: string, partial: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>
  reorderTodos: (activeId: string, overId: string) => Promise<void>
}

async function readTodosFromStorage(): Promise<Todo[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    if (result[STORAGE_KEY] && Array.isArray(result[STORAGE_KEY])) {
      return result[STORAGE_KEY] as Todo[]
    }
  } catch {
    // Fallback to empty array if storage is unavailable
  }
  return []
}

async function writeTodosToStorage(todos: Todo[]): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: todos })
  } catch {
    // Silently fail if storage is unavailable
  }
}

function generateId(): string {
  return `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  initialized: false,

  init: async () => {
    const todos = await readTodosFromStorage()
    set({ todos, initialized: true })
  },

  addTodo: async (text, dueDate, priority) => {
    const todo: Todo = {
      id: generateId(),
      text: text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate } : {}),
      ...(priority ? { priority } : {}),
    }
    const todos = [...get().todos, todo]
    set({ todos })
    await writeTodosToStorage(todos)
  },

  toggleDone: async (id) => {
    const todos = get().todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    set({ todos })
    await writeTodosToStorage(todos)
  },

  deleteTodo: async (id) => {
    const todos = get().todos.filter((t) => t.id !== id)
    set({ todos })
    await writeTodosToStorage(todos)
  },

  updateTodo: async (id, partial) => {
    const todos = get().todos.map((t) => (t.id === id ? { ...t, ...partial } : t))
    set({ todos })
    await writeTodosToStorage(todos)
  },

  reorderTodos: async (activeId, overId) => {
    const todos = [...get().todos]
    const activeIndex = todos.findIndex((t) => t.id === activeId)
    const overIndex = todos.findIndex((t) => t.id === overId)
    if (activeIndex === -1 || overIndex === -1) return

    const [moved] = todos.splice(activeIndex, 1)
    todos.splice(overIndex, 0, moved)
    set({ todos })
    await writeTodosToStorage(todos)
  },
}))
