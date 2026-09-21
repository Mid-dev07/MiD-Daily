export type ReminderRecurrence = {
  frequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval: number
  until?: string
}

export interface ReminderScheduleLike {
  event_date: string
  recurrence: ReminderRecurrence
}

export interface WallClockParts {
  date: string
  time: string
}

function wallDateToUtc(date: string, time: string) {
  return new Date(date + 'T' + time + ':00Z')
}

export function wallClockParts(value: Date, timeZone: string): WallClockParts {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return {
    date: get('year') + '-' + get('month') + '-' + get('day'),
    time: get('hour') + ':' + get('minute'),
  }
}

export function addDays(date: string, days: number) {
  const value = wallDateToUtc(date, '00:00')
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

export function addMonths(date: string, months: number) {
  const source = wallDateToUtc(date, '00:00')
  const originalDay = source.getUTCDate()
  source.setUTCDate(1)
  source.setUTCMonth(source.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + 1, 0)).getUTCDate()
  source.setUTCDate(Math.min(originalDay, lastDay))
  return source.toISOString().slice(0, 10)
}

function monthDifference(from: string, to: string) {
  const start = wallDateToUtc(from, '00:00')
  const target = wallDateToUtc(to, '00:00')
  return (target.getUTCFullYear() - start.getUTCFullYear()) * 12
    + target.getUTCMonth() - start.getUTCMonth()
}

export function occursOnDate(item: ReminderScheduleLike, targetDate: string) {
  if (targetDate < item.event_date) return false
  if (item.recurrence.until && targetDate > item.recurrence.until) return false
  if (item.recurrence.frequency === 'NONE') return targetDate === item.event_date

  const interval = Math.max(1, item.recurrence.interval)
  if (item.recurrence.frequency === 'DAILY') {
    const days = Math.round((wallDateToUtc(targetDate, '00:00').getTime() - wallDateToUtc(item.event_date, '00:00').getTime()) / 86_400_000)
    return days >= 0 && days % interval === 0
  }

  if (item.recurrence.frequency === 'WEEKLY') {
    const days = Math.round((wallDateToUtc(targetDate, '00:00').getTime() - wallDateToUtc(item.event_date, '00:00').getTime()) / 86_400_000)
    return days >= 0 && days % (7 * interval) === 0
  }

  const months = monthDifference(item.event_date, targetDate)
  if (months < 0 || months % interval !== 0) return false
  return addMonths(item.event_date, months) === targetDate
}

export function triggerWallClock(occurrenceDate: string, startTime: string, offsetMinutes: number) {
  const trigger = wallDateToUtc(occurrenceDate, startTime)
  trigger.setUTCMinutes(trigger.getUTCMinutes() - offsetMinutes)
  return {
    date: trigger.toISOString().slice(0, 10),
    time: trigger.toISOString().slice(11, 16),
  }
}

export function reminderIsDue(trigger: WallClockParts, now: WallClockParts, lookbackMs = 2 * 60_000) {
  const triggerAt = wallDateToUtc(trigger.date, trigger.time)
  const nowAt = wallDateToUtc(now.date, now.time)
  const elapsed = nowAt.getTime() - triggerAt.getTime()
  return elapsed >= 0 && elapsed <= lookbackMs
}
