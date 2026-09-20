export type View = 'dashboard' | 'schedule' | 'tasks' | 'finance'

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  title: string
  category: string
  priority: TaskPriority
  status: TaskStatus
}

export interface ScheduleItem {
  id: number
  title: string
  type: string
  start: string
  end: string
  location: string
}

export interface FinanceEntry {
  id: number
  type: 'income' | 'expense'
  title: string
  amount: number
}
