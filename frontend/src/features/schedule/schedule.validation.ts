import { isValidDateString } from './schedule.date'
import type { ScheduleDraft, ScheduleItem } from './schedule.types'

export interface ScheduleValidationResult {
  valid: boolean
  message: string
}

function toMinutes(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return Number.NaN
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function validateScheduleDraft(
  draft: ScheduleDraft,
  existing: ScheduleItem[],
  editingId?: number,
): ScheduleValidationResult {
  if (!draft.title.trim()) return { valid: false, message: 'Title is required.' }
  if (!isValidDateString(draft.date)) return { valid: false, message: 'Choose a valid date.' }

  const start = toMinutes(draft.startTime)
  const end = toMinutes(draft.endTime)
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { valid: false, message: 'Choose valid start and end times.' }
  }
  if (start >= end) return { valid: false, message: 'End time must be after start time.' }
  if (end - start > 24 * 60) return { valid: false, message: 'Activity duration cannot exceed 24 hours.' }

  if (!Number.isInteger(draft.recurrence.interval) || draft.recurrence.interval < 1 || draft.recurrence.interval > 30) {
    return { valid: false, message: 'Repeat interval must be between 1 and 30.' }
  }
  if (draft.recurrence.until && !isValidDateString(draft.recurrence.until)) {
    return { valid: false, message: 'Repeat end date is invalid.' }
  }
  if (draft.recurrence.until && draft.recurrence.until < draft.date) {
    return { valid: false, message: 'Repeat end date cannot be before the activity date.' }
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
