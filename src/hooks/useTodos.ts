import { useEffect, useState } from 'react'
import { useTodoStore } from '../store/todo.store'
import type { Todo, TodoPriority } from '../types/todo.types'

export type TodoFilter = 'all' | 'active' | 'done'

export function useTodos() {
  const store = useTodoStore()
  const [filter, setFilter] = useState<TodoFilter>('all')

  useEffect(() => {
    if (!store.initialized) {
      store.init()
    }
  }, [store.initialized])

  const filteredTodos = store.todos.filter((todo: Todo) => {
    if (filter === 'active') return !todo.done
    if (filter === 'done') return todo.done
    return true
  })

  return {
    todos: store.todos,
    filteredTodos,
    filter,
    setFilter,
    initialized: store.initialized,
    addTodo: (text: string, dueDate?: string, priority?: TodoPriority) =>
      store.addTodo(text, dueDate, priority),
    toggleDone: store.toggleDone,
    deleteTodo: store.deleteTodo,
    updateTodo: store.updateTodo,
    reorderTodos: store.reorderTodos,
  }
}
