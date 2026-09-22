import { shiftDate } from '../schedule/schedule.date'
import type { Habit } from '../../types'

export function weekday(date: string) {
  const day = new Date(date + 'T12:00:00Z').getUTCDay()
  return day === 0 ? 7 : day
}

export function weekDates(today: string) {
  const mondayOffset = weekday(today) - 1
  const monday = shiftDate(today, -mondayOffset)
  return Array.from({ length: 7 }, (_, index) => shiftDate(monday, index))
}

export function habitStreak(habit: Habit, logs: Set<string>, today: string) {
  let cursor = today
  let streak = 0
  for (let i = 0; i < 90; i += 1) {
    const day = weekday(cursor)
    if (habit.targetDays.includes(day)) {
      if (!logs.has(habit.id + ':' + cursor)) break
      streak += 1
    }
    cursor = shiftDate(cursor, -1)
  }
  return streak
}

export function habitWeekProgress(habit: Habit, logs: Set<string>, dates: string[], today: string) {
  const dueSoFar = dates.filter((date) => date <= today && habit.targetDays.includes(weekday(date)))
  const complete = dueSoFar.filter((date) => logs.has(habit.id + ':' + date)).length
  return { complete, due: dueSoFar.length }
}
