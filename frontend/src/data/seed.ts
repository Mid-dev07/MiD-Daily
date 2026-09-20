import type { FinanceEntry, Task } from '../types'

export const initialTasks: Task[] = [
  { id: 1, title: 'Review weekly priorities', category: 'Planning', priority: 'high', status: 'in-progress', dueDate: '2026-09-20', notes: 'Confirm the top three outcomes for this week.', progress: 60 },
  { id: 2, title: 'Finish database schema draft', category: 'Project', priority: 'high', status: 'todo', dueDate: '2026-09-22', notes: 'Draft the first multi-user schema and ownership rules.', progress: 25 },
  { id: 3, title: 'Study TypeScript fundamentals', category: 'Learning', priority: 'medium', status: 'todo', dueDate: '2026-09-24', notes: 'Continue types, generics, and strict mode exercises.', progress: 10 },
  { id: 4, title: 'Organize downloaded files', category: 'Personal', priority: 'low', status: 'done', dueDate: '2026-09-20', notes: 'Move old downloads into the project archive.', progress: 100 },
]

export const financeEntries: FinanceEntry[] = [
  { id: 1, type: 'expense', title: 'Lunch', amount: 25000 },
  { id: 2, type: 'expense', title: 'Transport', amount: 15000 },
  { id: 3, type: 'income', title: 'Allowance', amount: 150000 },
]
