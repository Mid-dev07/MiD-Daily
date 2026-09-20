import type { ScheduleItem, RecurrenceRule } from './schedule.types'

const defaultRecurrence: RecurrenceRule = { frequency: 'NONE', interval: 1 }

export function normalizeScheduleItem(input: ScheduleItem & { recurrence?: Partial<RecurrenceRule> }): ScheduleItem {
  const recurrence = input.recurrence
    ? {
        frequency: input.recurrence.frequency ?? 'NONE',
        interval: input.recurrence.interval ?? 1,
        until: input.recurrence.until,
      }
    : defaultRecurrence

  return { ...input, recurrence }
}

export function normalizeScheduleList(items: ScheduleItem[]) {
  return items.map(normalizeScheduleItem)
}
