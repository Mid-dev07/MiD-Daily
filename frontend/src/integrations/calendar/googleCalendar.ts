import type { ScheduleItem } from '../../features/schedule/schedule.types'
import type { GoogleCalendarEventPayload } from './calendar.types'

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

export function getGoogleCalendarConfig() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  return {
    clientId: clientId?.trim() || '',
    configured: Boolean(clientId?.trim()),
  }
}

function toCalendarDateTime(date: string, time: string) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
}

function buildDetails(item: ScheduleItem) {
  const lines = [`MiD-Daily • ${item.type}`]

  if (item.notes.trim()) lines.push('', item.notes.trim())
  if (item.recurrence.frequency !== 'NONE') {
    lines.push('', 'Recurrence is currently managed by MiD-Daily; this handoff exports the selected occurrence.')
  }

  return lines.join('\n')
}

export function toGoogleCalendarEventPayload(item: ScheduleItem): GoogleCalendarEventPayload {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  return {
    summary: item.title,
    description: buildDetails(item),
    location: item.location || undefined,
    start: {
      dateTime: `${item.date}T${item.startTime}:00`,
      timeZone,
    },
    end: {
      dateTime: `${item.date}T${item.endTime}:00`,
      timeZone,
    },
    extendedProperties: {
      private: {
        midDailyScheduleId: String(item.id),
      },
    },
  }
}

export function buildGoogleCalendarTemplateUrl(item: ScheduleItem) {
  const payload = toGoogleCalendarEventPayload(item)
  const start = toCalendarDateTime(item.date, item.startTime)
  const end = toCalendarDateTime(item.date, item.endTime)

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: payload.summary,
    dates: `${start}/${end}`,
    details: payload.description ?? '',
  })

  if (payload.location) params.set('location', payload.location)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
