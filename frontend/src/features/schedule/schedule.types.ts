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
  googleCalendarConnected: boolean
}
