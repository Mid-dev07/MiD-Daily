import { createClient } from '@supabase/supabase-js'

export type ActivityMode = 'FIXED' | 'FLEXIBLE' | 'ONE_TIME'
export type TargetPeriod = 'DAY' | 'WEEK' | 'MONTH'

export interface ScheduleRecord {
  id: number
  title: string
  type: 'CLASS' | 'WORK' | 'MEETING' | 'STUDY' | 'PERSONAL' | 'APPOINTMENT' | 'EVENT' | 'OTHER'
  activityMode: ActivityMode
  date: string
  startTime: string
  endTime: string
  location: string
  notes: string
  reminderEnabled: boolean
  reminderOffset: 0 | 5 | 10 | 15 | 30 | 60
  recurrence: { frequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'; interval: number; until?: string }
  targetCount?: number | null
  targetPeriod?: TargetPeriod | null
  durationMinutes?: number | null
  preferredStartTime?: string | null
  preferredEndTime?: string | null
  activityDeadline?: string | null
  googleCalendar: { status: 'not-synced' | 'pending' | 'synced' | 'error'; calendarId: string; eventId?: string; lastSyncedAt?: string; error?: string }
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

const scheduleDatabaseClient = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null

function db() {
  if (!scheduleDatabaseClient) throw new Error('Supabase persistence is not configured.')
  return scheduleDatabaseClient
}

function fromRow(row: Record<string, unknown>): ScheduleRecord {
  return {
    id: Number(row.id),
    title: String(row.title),
    type: row.type as ScheduleRecord['type'],
    activityMode: row.activity_mode as ScheduleRecord['activityMode'],
    date: String(row.event_date),
    startTime: row.start_time == null ? '' : String(row.start_time).slice(0, 5),
    endTime: row.end_time == null ? '' : String(row.end_time).slice(0, 5),
    location: String(row.location ?? ''),
    notes: String(row.notes ?? ''),
    reminderEnabled: Boolean(row.reminder_enabled),
    reminderOffset: Number(row.reminder_offset) as ScheduleRecord['reminderOffset'],
    recurrence: (row.recurrence ?? { frequency: 'NONE', interval: 1 }) as ScheduleRecord['recurrence'],
    targetCount: row.target_count == null ? undefined : Number(row.target_count),
    targetPeriod: row.target_period as ScheduleRecord['targetPeriod'],
    durationMinutes: row.duration_minutes == null ? undefined : Number(row.duration_minutes),
    preferredStartTime: row.preferred_start_time == null ? undefined : String(row.preferred_start_time).slice(0, 5),
    preferredEndTime: row.preferred_end_time == null ? undefined : String(row.preferred_end_time).slice(0, 5),
    activityDeadline: typeof row.activity_deadline === 'string' ? row.activity_deadline : undefined,
    googleCalendar: (row.google_calendar ?? { status: 'not-synced', calendarId: 'primary' }) as ScheduleRecord['googleCalendar'],
  }
}

const columns = 'id,title,type,activity_mode,event_date,start_time,end_time,location,notes,reminder_enabled,reminder_offset,recurrence,target_count,target_period,duration_minutes,preferred_start_time,preferred_end_time,activity_deadline,google_calendar'

function normalizeScheduleWrite(item: Omit<ScheduleRecord, 'id'> | Partial<Omit<ScheduleRecord, 'id'>>) {
  const activityMode = item.activityMode ?? 'ONE_TIME'
  const flexible = activityMode === 'FLEXIBLE'
  return {
    ...(item.title === undefined ? {} : { title: item.title }),
    ...(item.type === undefined ? {} : { type: item.type }),
    ...(item.activityMode === undefined ? {} : { activity_mode: activityMode }),
    ...(item.date === undefined ? {} : { event_date: item.date }),
    ...(item.startTime === undefined ? {} : { start_time: flexible ? null : (item.startTime || null) }),
    ...(item.endTime === undefined ? {} : { end_time: flexible ? null : (item.endTime || null) }),
    ...(item.location === undefined ? {} : { location: item.location }),
    ...(item.notes === undefined ? {} : { notes: item.notes }),
    ...(item.reminderEnabled === undefined ? {} : { reminder_enabled: item.reminderEnabled }),
    ...(item.reminderOffset === undefined ? {} : { reminder_offset: item.reminderOffset }),
    ...(item.recurrence === undefined ? {} : { recurrence: item.recurrence }),
    ...(item.targetCount === undefined ? {} : { target_count: item.targetCount ?? null }),
    ...(item.targetPeriod === undefined ? {} : { target_period: item.targetPeriod ?? null }),
    ...(item.durationMinutes === undefined ? {} : { duration_minutes: item.durationMinutes ?? null }),
    ...(item.preferredStartTime === undefined ? {} : { preferred_start_time: item.preferredStartTime ?? null }),
    ...(item.preferredEndTime === undefined ? {} : { preferred_end_time: item.preferredEndTime ?? null }),
    ...(item.activityDeadline === undefined ? {} : { activity_deadline: item.activityDeadline ?? null }),
    ...(item.googleCalendar === undefined ? {} : { google_calendar: item.googleCalendar }),
  }
}

export async function listSchedule(userId: string) {
  const { data, error } = await db().from('schedule_items').select(columns).eq('user_id', userId).order('event_date', { ascending: true }).order('start_time', { ascending: true })
  if (error) throw new Error(`Schedule read failed: ${error.message}`)
  return (data ?? []).map(fromRow)
}

export async function createSchedule(userId: string, item: Omit<ScheduleRecord, 'id'>) {
  const { data, error } = await db().from('schedule_items').insert({
    user_id: userId,
    ...normalizeScheduleWrite(item),
  }).select(columns).single()
  if (error) throw new Error(`Schedule create failed: ${error.message}`)
  return fromRow(data)
}

export async function updateSchedule(userId: string, id: number, item: Partial<Omit<ScheduleRecord, 'id'>>) {
  const { data, error } = await db().from('schedule_items').update(
    normalizeScheduleWrite(item),
  ).eq('id', id).eq('user_id', userId).select(columns).maybeSingle()
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
