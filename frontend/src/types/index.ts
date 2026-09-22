export type View = 'dashboard' | 'schedule' | 'tasks' | 'finance' | 'social' | 'assistant' | 'profile' | 'insights'

export interface Profile {
  userId: string
  displayName: string
  username: string
  bio: string
  avatarPath: string | null
  avatarUrl: string | null
  createdAt: string
  updatedAt: string
}

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


export type FinanceBudgetPeriod = 'WEEK' | 'MONTH'

export interface FinanceBudget {
  id: number
  name: string
  category: string
  amount: number
  period: FinanceBudgetPeriod
  startsOn: string
  endsOn?: string
  notes?: string
}

export type FinanceBudgetDraft = Omit<FinanceBudget, 'id'>
