export type TodoPriority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  text: string
  done: boolean
  createdAt: string
  dueDate?: string
  priority?: TodoPriority
}
