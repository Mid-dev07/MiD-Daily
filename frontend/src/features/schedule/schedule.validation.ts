import type { ScheduleDraft, ScheduleItem } from './schedule.types'

export interface ScheduleValidationResult {
  valid: boolean
  message: string
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function validateScheduleDraft(draft: ScheduleDraft, existing: ScheduleItem[], editingId?: number): ScheduleValidationResult {
  if (!draft.title.trim()) return { valid: false, message: 'Title is required.' }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return { valid: false, message: 'Choose a valid date.' }

  const start = toMinutes(draft.startTime)
  const end = toMinutes(draft.endTime)
  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
    return { valid: false, message: 'End time must be after start time.' }
  }

  const conflict = existing.some((item) => {
    if (item.id === editingId || item.date !== draft.date) return false
    const itemStart = toMinutes(item.startTime)
    const itemEnd = toMinutes(item.endTime)
    return start < itemEnd && end > itemStart
  })

  if (conflict) return { valid: false, message: 'This time overlaps another activity.' }
  return { valid: true, message: '' }
}
