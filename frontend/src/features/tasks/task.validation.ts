import { isValidDateString } from '../schedule/schedule.date'
import type { TaskDraft, Task } from '../../types'

export interface TaskValidationResult {
  valid: boolean
  message: string
}

export function validateTaskDraft(draft: TaskDraft, existing: Task[], editingId?: number): TaskValidationResult {
  if (!draft.title.trim()) return { valid: false, message: 'Title is required.' }
  if (!draft.category.trim()) return { valid: false, message: 'Category is required.' }
  if (!Number.isInteger(draft.progress) || draft.progress < 0 || draft.progress > 100) {
    return { valid: false, message: 'Progress must be between 0 and 100.' }
  }

  if (draft.dueDate && !isValidDateString(draft.dueDate)) {
    return { valid: false, message: 'Due date is invalid.' }
  }

  if (existing.some((task) => task.id !== editingId && task.title.trim().toLowerCase() === draft.title.trim().toLowerCase())) {
    return { valid: false, message: 'A task with this title already exists.' }
  }

  return { valid: true, message: '' }
}
