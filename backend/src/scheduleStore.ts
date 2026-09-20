import { createClient } from '@supabase/supabase-js'

export interface ScheduleRecord {
  id: number
  title: string
  type: 'CLASS' | 'WORK' | 'MEETING' | 'STUDY' | 'PERSONAL' | 'APPOINTMENT' | 'EVENT' | 'OTHER'
  date: string
  startTime: string
  endTime: string
  location: string
  notes: string
  reminderEnabled: boolean
  reminderOffset: 0 | 5 | 10 | 15 | 30 | 60
  recurrence: { frequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; interval: number; until?: string }
  googleCalendar: { status: 'not-synced' | 'pending' | 'synced' | 'error'; calendarId: string; eventId?: string; lastSyncedAt?: string; error?: string }
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

function db() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('Supabase persistence is not configured.')
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

function fromRow(row: Record<string, unknown>): ScheduleRecord {
  return {
    id: Number(row.id),
    title: String(row.title),
    type: row.type as ScheduleRecord['type'],
    date: String(row.event_date),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    location: String(row.location ?? ''),
    notes: String(row.notes ?? ''),
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderOffset: Number(row.reminder_offset) as ScheduleRecord['reminderOffset'],
    recurrence: (row.recurrence ?? { frequency: 'NONE', interval: 1 }) as ScheduleRecord['recurrence'],
    googleCalendar: (row.google_calendar ?? { status: 'not-synced', calendarId: 'primary' }) as ScheduleRecord['googleCalendar'],
  }
}

const columns = 'id,title,type,event_date,start_time,end_time,location,notes,reminder_enabled,reminder_offset,recurrence,google_calendar'

export async function listSchedule(userId: string) {
  const { data, error } = await db().from('schedule_items').select(columns).eq('user_id', userId).order('event_date', { ascending: true }).order('start_time', { ascending: true })
  if (error) throw new Error(`Schedule read failed: ${error.message}`)
  return (data ?? []).map(fromRow)
}

export async function createSchedule(userId: string, item: Omit<ScheduleRecord, 'id'>) {
  const { data, error } = await db().from('schedule_items').insert({
    user_id: userId,
    title: item.title,
    type: item.type,
    event_date: item.date,
    start_time: item.startTime,
    end_time: item.endTime,
    location: item.location,
    notes: item.notes,
    reminder_enabled: item.reminderEnabled,
    reminder_offset: item.reminderOffset,
    recurrence: item.recurrence,
    google_calendar: item.googleCalendar,
  }).select(columns).single()
  if (error) throw new Error(`Schedule create failed: ${error.message}`)
  return fromRow(data)
}

export async function updateSchedule(userId: string, id: number, item: Partial<Omit<ScheduleRecord, 'id'>>) {
  const { data, error } = await db().from('schedule_items').update({
    ...(item.title === undefined ? {} : { title: item.title }),
    ...(item.type === undefined ? {} : { type: item.type }),
    ...(item.date === undefined ? {} : { event_date: item.date }),
    ...(item.startTime === undefined ? {} : { start_time: item.startTime }),
    ...(item.endTime === undefined ? {} : { end_time: item.endTime }),
    ...(item.location === undefined ? {} : { location: item.location }),
    ...(item.notes === undefined ? {} : { notes: item.notes }),
    ...(item.reminderEnabled === undefined ? {} : { reminder_enabled: item.reminderEnabled }),
    ...(item.reminderOffset === undefined ? {} : { reminder_offset: item.reminderOffset }),
    ...(item.recurrence === undefined ? {} : { recurrence: item.recurrence }),
    ...(item.googleCalendar === undefined ? {} : { google_calendar: item.googleCalendar }),
  }).eq('id', id).eq('user_id', userId).select(columns).maybeSingle()
  if (error) throw new Error(`Schedule update failed: ${error.message}`)
  if (!data) return null
  return fromRow(data)
}

export async function deleteSchedule(userId: string, id: number) {
  const { data, error } = await db().from('schedule_items').delete().eq('id', id).eq('user_id', userId).select('id').maybeSingle()
  if (error) throw new Error(`Schedule delete failed: ${error.message}`)
  return Boolean(data)
}

export function isSchedulePersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY)
}
