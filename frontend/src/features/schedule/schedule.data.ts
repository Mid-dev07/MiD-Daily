import type { ScheduleItem } from './schedule.types'

const today = new Intl.DateTimeFormat('sv-SE').format(new Date())
const noRepeat = { frequency: 'NONE' as const, interval: 1 }
const notSynced = { status: 'not-synced' as const, calendarId: 'primary' }

export const initialScheduleItems: ScheduleItem[] = [
  {
    id: 1,
    title: 'Project planning',
    type: 'WORK',
    activityMode: 'ONE_TIME',
    date: today,
    startTime: '09:00',
    endTime: '10:00',
    location: 'Workspace',
    notes: 'Review priorities and break down the next development tasks.',
    reminderEnabled: true,
    reminderOffset: 15,
    recurrence: noRepeat,
    googleCalendar: notSynced,
  },
  {
    id: 2,
    title: 'Coding session',
    type: 'STUDY',
    activityMode: 'FIXED',
    date: today,
    startTime: '13:00',
    endTime: '15:00',
    location: 'Home',
    notes: 'Continue MiD-Daily feature implementation.',
    reminderEnabled: true,
    reminderOffset: 30,
    recurrence: { frequency: 'WEEKLY', interval: 1 },
    googleCalendar: notSynced,
  },
  {
    id: 3,
    title: 'Evening review',
    type: 'PERSONAL',
    activityMode: 'ONE_TIME',
    date: today,
    startTime: '20:00',
    endTime: '20:30',
    location: 'Home',
    notes: 'Review completed work and plan tomorrow.',
    reminderEnabled: false,
    reminderOffset: 10,
    recurrence: noRepeat,
    googleCalendar: notSynced,
  },
]
