import type { FinanceEntry, ScheduleItem, Task } from '../types'

export const initialTasks: Task[] = [
  { id: 1, title: 'Review weekly priorities', category: 'Planning', priority: 'high', status: 'in-progress' },
  { id: 2, title: 'Finish database schema draft', category: 'Project', priority: 'high', status: 'todo' },
  { id: 3, title: 'Study TypeScript fundamentals', category: 'Learning', priority: 'medium', status: 'todo' },
  { id: 4, title: 'Organize downloaded files', category: 'Personal', priority: 'low', status: 'done' },
]

export const scheduleItems: ScheduleItem[] = [
  { id: 1, title: 'Project planning', type: 'Work', start: '09:00', end: '10:00', location: 'Workspace' },
  { id: 2, title: 'Coding session', type: 'Study', start: '13:00', end: '15:00', location: 'Home' },
  { id: 3, title: 'Evening review', type: 'Personal', start: '20:00', end: '20:30', location: 'Home' },
]

export const financeEntries: FinanceEntry[] = [
  { id: 1, type: 'expense', title: 'Lunch', amount: 25000 },
  { id: 2, type: 'expense', title: 'Transport', amount: 15000 },
  { id: 3, type: 'income', title: 'Allowance', amount: 150000 },
]
