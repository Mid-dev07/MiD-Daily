import { isValidDateString, scheduleOccursOnDate } from './schedule.date'
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
  if (!isValidDateString(draft.date)) return { valid: false, message: 'Choose a valid planning date.' }

  if (draft.activityMode === 'FLEXIBLE') {
    if (!Number.isInteger(draft.targetCount) || (draft.targetCount ?? 0) < 1 || (draft.targetCount ?? 0) > 100) {
      return { valid: false, message: 'Choose a target between 1 and 100.' }
    }
    if (!draft.targetPeriod) return { valid: false, message: 'Choose a target period.' }
    if (!Number.isInteger(draft.durationMinutes) || (draft.durationMinutes ?? 0) < 5 || (draft.durationMinutes ?? 0) > 1440) {
      return { valid: false, message: 'Duration must be between 5 and 1440 minutes.' }
    }

    const preferredStart = draft.preferredStartTime ? toMinutes(draft.preferredStartTime) : null
    const preferredEnd = draft.preferredEndTime ? toMinutes(draft.preferredEndTime) : null
    if (preferredStart !== null && Number.isNaN(preferredStart)) return { valid: false, message: 'Preferred start time is invalid.' }
    if (preferredEnd !== null && Number.isNaN(preferredEnd)) return { valid: false, message: 'Preferred end time is invalid.' }
    if ((preferredStart === null) !== (preferredEnd === null)) return { valid: false, message: 'Choose both preferred start and end times.' }
    if (preferredStart !== null && preferredEnd !== null && preferredStart >= preferredEnd) {
      return { valid: false, message: 'Preferred end time must be after start time.' }
    }

    if (draft.activityDeadline && !isValidDateString(draft.activityDeadline)) {
      return { valid: false, message: 'Choose a valid deadline.' }
    }
    if (draft.activityDeadline && draft.activityDeadline < draft.date) {
      return { valid: false, message: 'Deadline cannot be before the planning date.' }
    }

    return { valid: true, message: '' }
  }

  if (!draft.startTime || !draft.endTime) return { valid: false, message: 'Choose valid start and end times.' }
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
    if (item.id === editingId || item.activityMode === 'FLEXIBLE' || !scheduleOccursOnDate(item, draft.date)) return false
    if (!item.startTime || !item.endTime) return false
    const itemStart = toMinutes(item.startTime)
    const itemEnd = toMinutes(item.endTime)
    return start < itemEnd && end > itemStart
  })

  if (conflict) return { valid: false, message: 'This time overlaps another activity.' }
  return { valid: true, message: '' }
}
