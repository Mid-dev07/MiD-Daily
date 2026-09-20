export type View = 'dashboard' | 'schedule' | 'tasks' | 'finance'

export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: number
  title: string
  category: string
  priority: TaskPriority
  status: TaskStatus
  dueDate?: string
  notes?: string
  progress?: number
}

export type TaskDraft = Omit<Task, 'id'>

export type FinanceEntryType = 'income' | 'expense'

export interface FinanceEntry {
  id: number
  type: FinanceEntryType
  title: string
  amount: number
  category: string
  date: string
  notes?: string
}

export type FinanceDraft = Omit<FinanceEntry, 'id'>
