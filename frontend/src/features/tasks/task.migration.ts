import type { Task, TaskPriority, TaskStatus } from '../../types'

const DEFAULT_CATEGORY = 'Personal'
const DEFAULT_PRIORITY: TaskPriority = 'medium'
const DEFAULT_STATUS: TaskStatus = 'todo'

export function normalizeTask(input: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  const rawProgress = typeof input.progress === 'number' ? input.progress : input.status === 'done' ? 100 : 0
  const progress = Math.min(100, Math.max(0, Math.round(rawProgress)))

  return {
    id: input.id,
    title: input.title,
    category: input.category?.trim() || DEFAULT_CATEGORY,
    priority: input.priority ?? DEFAULT_PRIORITY,
    status: input.status ?? DEFAULT_STATUS,
    dueDate: input.dueDate || undefined,
    notes: input.notes?.trim() || undefined,
    progress,
  }
}

export function normalizeTaskList(items: Task[]): Task[] {
  return items.map((item) => normalizeTask(item))
}
