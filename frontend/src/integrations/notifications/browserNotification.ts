import type { ReminderState, ScheduleItem } from '../../features/schedule/schedule.types'

export type NotificationSupport = 'unsupported' | 'default' | 'granted' | 'denied'

export function getNotificationSupport(): NotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationSupport> {
  if (getNotificationSupport() === 'unsupported') return 'unsupported'
  return Notification.requestPermission()
}

async function getRegistration() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration()
    if (existing) return existing
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}

export async function showNotification(title: string, options: NotificationOptions = {}) {
  if (getNotificationSupport() !== 'granted') return false
  const registration = await getRegistration()

  if (registration) {
    try {
      await registration.showNotification(title, options)
      return true
    } catch {
      return false
    }
  }

  if (typeof Notification === 'function') {
    try {
      new Notification(title, options)
      return true
    } catch {
      return false
    }
  }

  return false
}

export async function showScheduleReminder(item: ScheduleItem, reminder: ReminderState) {
  if (!reminder.triggerAt || reminder.status !== 'due') return false
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(reminder.eventAt)

  return showNotification('MiD-Daily • Reminder', {
    body: item.title + ' starts at ' + time + '.',
    tag: 'mid-daily.schedule.' + item.id + '.' + reminder.triggerAt.getTime(),
    data: {
      type: 'schedule-reminder',
      scheduleId: item.id,
      url: '/',
    },
  })
}
