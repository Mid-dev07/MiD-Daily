import type { GoogleCalendarSyncMeta } from '../../integrations/calendar/calendar.types'

export type ScheduleType =
  | 'CLASS'
  | 'WORK'
  | 'MEETING'
  | 'STUDY'
  | 'PERSONAL'
  | 'APPOINTMENT'
  | 'EVENT'
  | 'OTHER'

export type ReminderOffset = 0 | 5 | 10 | 15 | 30 | 60
export type RecurrenceFrequency = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type ReminderStatus = 'disabled' | 'scheduled' | 'due' | 'expired'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  until?: string
}

export interface ReminderState {
  status: ReminderStatus
  eventAt: Date
  triggerAt: Date | null
  label: string
}

export interface ScheduleItem {
  id: number
  title: string
  type: ScheduleType
  date: string
  startTime: string
  endTime: string
  location: string
  notes: string
  reminderEnabled: boolean
  reminderOffset: ReminderOffset
  recurrence: RecurrenceRule
  googleCalendar: GoogleCalendarSyncMeta
}

export type ScheduleDraft = Omit<ScheduleItem, 'id' | 'googleCalendar'>
