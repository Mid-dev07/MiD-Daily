import { useEffect } from 'react'
import { getNotificationSupport, showScheduleReminder } from '../../../integrations/notifications/browserNotification'
import { normalizeScheduleList } from '../schedule.migration'
import { getReminderState } from '../schedule.reminder'
import type { ScheduleItem } from '../schedule.types'

const DISPATCHED_KEY = 'mid-daily.notification-dispatched'
const PERMISSION_RECHECK_MS = 60_000

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
    let cancelled = false
    let timer: number | undefined
    let running = false
    const normalized = normalizeScheduleList(schedule)

    const scheduleNext = (targetAt?: number, fallbackDelay = PERMISSION_RECHECK_MS) => {
      if (cancelled) return
      const delay = targetAt === undefined
        ? fallbackDelay
        : Math.max(1000, targetAt - Date.now() + 50)
      timer = window.setTimeout(() => {
        void tick()
      }, delay)
    }

    const tick = async () => {
      if (cancelled || running) return

      if (getNotificationSupport() !== 'granted') {
        scheduleNext(undefined)
        return
      }

      running = true
      try {
        const dispatched = readDispatched()
        const now = new Date()
        let nextTriggerAt: number | undefined

        for (const item of normalized) {
          const reminder = getReminderState(item, now)

          if (reminder.status === 'due' && reminder.triggerAt) {
            const key = item.id + ':' + reminder.triggerAt.getTime()
            if (!dispatched.has(key) && await showScheduleReminder(item, reminder)) {
              dispatched.add(key)
              writeDispatched(dispatched)
            }
            continue
          }

          if (reminder.status === 'scheduled' && reminder.triggerAt) {
            const targetAt = reminder.triggerAt.getTime()
            nextTriggerAt = nextTriggerAt === undefined ? targetAt : Math.min(nextTriggerAt, targetAt)
          }
        }

        if (nextTriggerAt !== undefined) scheduleNext(nextTriggerAt)
      } finally {
        running = false
      }
    }

    void tick()

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [schedule])
}
