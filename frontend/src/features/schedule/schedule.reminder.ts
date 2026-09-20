import type { ReminderState, ScheduleItem } from './schedule.types'

function localDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  const originalDay = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(originalDay, lastDay))
  return next
}

function nextOccurrenceDate(item: ScheduleItem, now: Date) {
  let candidate = localDateTime(item.date, item.startTime)

  if (item.recurrence.frequency === 'NONE') return candidate

  const until = item.recurrence.until ? localDateTime(item.recurrence.until, item.endTime) : null
  const step = Math.max(1, item.recurrence.interval)

  for (let index = 0; index < 2000 && candidate <= now; index += 1) {
    if (item.recurrence.frequency === 'DAILY') candidate = addDays(candidate, step)
    if (item.recurrence.frequency === 'WEEKLY') candidate = addDays(candidate, 7 * step)
    if (item.recurrence.frequency === 'MONTHLY') candidate = addMonths(candidate, step)
  }

  if (until && candidate > until) return null
  return candidate
}

export function getReminderState(item: ScheduleItem, now = new Date()): ReminderState {
  if (!item.reminderEnabled) {
    return {
      status: 'disabled',
      eventAt: localDateTime(item.date, item.startTime),
      triggerAt: null,
      label: 'Reminder off',
    }
  }

  const eventAt = nextOccurrenceDate(item, now)
  if (!eventAt) {
    return {
      status: 'expired',
      eventAt: localDateTime(item.date, item.startTime),
      triggerAt: null,
      label: 'Schedule ended',
    }
  }

  const triggerAt = new Date(eventAt.getTime() - item.reminderOffset * 60_000)
  const eventEnd = localDateTime(
    item.recurrence.frequency === 'NONE'
      ? item.date
      : new Intl.DateTimeFormat('sv-SE').format(eventAt).slice(0, 10),
    item.endTime,
  )

  if (item.recurrence.frequency === 'NONE' && eventEnd <= now) {
    return { status: 'expired', eventAt, triggerAt, label: 'Event passed' }
  }

  if (triggerAt > now) {
    return {
      status: 'scheduled',
      eventAt,
      triggerAt,
      label: `In ${formatRelative(triggerAt.getTime() - now.getTime())}`,
    }
  }

  if (eventAt > now) {
    return {
      status: 'due',
      eventAt,
      triggerAt,
      label: 'Ready to notify',
    }
  }

  return { status: 'expired', eventAt, triggerAt, label: 'Event passed' }
}

function formatRelative(deltaMs: number) {
  const minutes = Math.max(1, Math.round(deltaMs / 60_000))
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export function formatReminderTime(value: Date | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value)
}
