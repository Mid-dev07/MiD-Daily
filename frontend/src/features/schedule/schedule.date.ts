import type { ScheduleItem } from './schedule.types'

export function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function shiftDate(value: string, days: number) {
  const date = parseDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return formatDate(date)
}

export function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = parseDate(value)
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value
}

export function formatDateLong(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDate(value))
}

function monthDifference(from: Date, to: Date) {
  return (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())
}

export function scheduleOccursOnDate(item: ScheduleItem, targetDate: string) {
  if (item.activityMode === 'FLEXIBLE') return false
  if (!isValidDateString(targetDate) || targetDate < item.date) return false
  if (item.recurrence.frequency === 'NONE') return targetDate === item.date
  if (item.recurrence.until && targetDate > item.recurrence.until) return false

  const start = parseDate(item.date)
  const target = parseDate(targetDate)
  const interval = Math.max(1, item.recurrence.interval)

  if (item.recurrence.frequency === 'DAILY') {
    const days = Math.round((target.getTime() - start.getTime()) / 86_400_000)
    return days >= 0 && days % interval === 0
  }

  if (item.recurrence.frequency === 'WEEKLY') {
    const days = Math.round((target.getTime() - start.getTime()) / 86_400_000)
    return days >= 0 && days % (7 * interval) === 0
  }

  const months = monthDifference(start, target)
  if (months < 0 || months % interval !== 0) return false

  const occurrence = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  occurrence.setUTCMonth(occurrence.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(occurrence.getUTCFullYear(), occurrence.getUTCMonth() + 1, 0)).getUTCDate()
  occurrence.setUTCDate(Math.min(start.getUTCDate(), lastDay))

  return formatDate(occurrence) === targetDate
}
