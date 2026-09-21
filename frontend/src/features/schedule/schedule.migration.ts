import type { GoogleCalendarSyncMeta } from '../../integrations/calendar/calendar.types'
import type { ScheduleItem, RecurrenceRule } from './schedule.types'

const defaultRecurrence: RecurrenceRule = { frequency: 'NONE', interval: 1 }
const defaultGoogleCalendar: GoogleCalendarSyncMeta = { status: 'not-synced', calendarId: 'primary' }

type LegacyScheduleItem = Omit<ScheduleItem, 'recurrence' | 'googleCalendar' | 'activityMode'> & {
  activityMode?: ScheduleItem['activityMode']
  recurrence?: Partial<RecurrenceRule>
  googleCalendar?: Partial<GoogleCalendarSyncMeta>
  googleCalendarConnected?: boolean
}

export function normalizeScheduleItem(input: LegacyScheduleItem): ScheduleItem {
  const recurrence = {
    frequency: input.recurrence?.frequency ?? defaultRecurrence.frequency,
    interval: input.recurrence?.interval ?? defaultRecurrence.interval,
    until: input.recurrence?.until,
  }

  const googleCalendar = input.googleCalendar
    ? {
        ...defaultGoogleCalendar,
        ...input.googleCalendar,
        calendarId: input.googleCalendar.calendarId ?? defaultGoogleCalendar.calendarId,
        status: input.googleCalendar.status ?? defaultGoogleCalendar.status,
      }
    : defaultGoogleCalendar

  const activityMode = input.activityMode ?? (recurrence.frequency !== 'NONE' ? 'FIXED' : 'ONE_TIME')
  return { ...input, activityMode, recurrence, googleCalendar }
}

export function normalizeScheduleList(items: LegacyScheduleItem[]): ScheduleItem[] {
  return items.map(normalizeScheduleItem)
}
