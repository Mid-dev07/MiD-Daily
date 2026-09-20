import { useEffect } from 'react'
import { getNotificationSupport, showScheduleReminder } from '../../../integrations/notifications/browserNotification'
import { normalizeScheduleList } from '../schedule.migration'
import { getReminderState } from '../schedule.reminder'
import type { ScheduleItem } from '../schedule.types'

const DISPATCHED_KEY = 'mid-daily.notification-dispatched'
const POLL_INTERVAL = 15_000

function readDispatched() {
  try {
    const raw = sessionStorage.getItem(DISPATCHED_KEY)
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>()
  } catch {
    return new Set<string>()
  }
}

function writeDispatched(values: Set<string>) {
  try {
    sessionStorage.setItem(DISPATCHED_KEY, JSON.stringify([...values].slice(-100)))
  } catch {
    // Storage can be unavailable in restricted contexts.
  }
}

export function useReminderScheduler(schedule: ScheduleItem[]) {
  useEffect(() => {
    let running = false

    const tick = async () => {
      if (running || getNotificationSupport() !== 'granted') return
      running = true

      try {
        const dispatched = readDispatched()
        const now = new Date()

        for (const item of normalizeScheduleList(schedule)) {
          const reminder = getReminderState(item, now)
          if (reminder.status !== 'due' || !reminder.triggerAt) continue

          const key = item.id + ':' + reminder.triggerAt.getTime()
          if (dispatched.has(key)) continue

          if (await showScheduleReminder(item, reminder)) {
            dispatched.add(key)
            writeDispatched(dispatched)
          }
        }
      } finally {
        running = false
      }
    }

    void tick()
    const interval = window.setInterval(() => void tick(), POLL_INTERVAL)
    return () => window.clearInterval(interval)
  }, [schedule])
}
