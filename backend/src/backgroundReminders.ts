import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage, isTelegramConfigured } from './integrations/telegram.js'
import { sendWhatsAppText, isWhatsAppConfigured } from './integrations/whatsapp.js'

type Channel = 'telegram' | 'whatsapp'
type Recurrence = {
  frequency: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval: number
  until?: string
}

interface ReminderSchedule {
  id: number
  user_id: string
  title: string
  type: string
  event_date: string
  start_time: string
  reminder_enabled: boolean
  reminder_offset: number
  recurrence: Recurrence
}

interface TelegramRecipient {
  user_id: string
  chat_id: number
}

interface WhatsAppRecipient {
  user_id: string
  wa_id: string
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Jakarta'
const LOOKBACK_MS = 2 * 60_000

const databaseClient = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null

function db() {
  if (!databaseClient) throw new Error('Supabase persistence is not configured.')
  return databaseClient
}

function wallClockParts(value: Date) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return {
    date: get('year') + '-' + get('month') + '-' + get('day'),
    time: get('hour') + ':' + get('minute'),
  }
}

function wallDateToUtc(date: string, time: string) {
  return new Date(date + 'T' + time + ':00Z')
}

function addDays(date: string, days: number) {
  const value = wallDateToUtc(date, '00:00')
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function addMonths(date: string, months: number) {
  const source = wallDateToUtc(date, '00:00')
  const originalDay = source.getUTCDate()
  source.setUTCDate(1)
  source.setUTCMonth(source.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + 1, 0)).getUTCDate()
  source.setUTCDate(Math.min(originalDay, lastDay))
  return source.toISOString().slice(0, 10)
}

function monthDifference(from: string, to: string) {
  const start = wallDateToUtc(from, '00:00')
  const target = wallDateToUtc(to, '00:00')
  return (target.getUTCFullYear() - start.getUTCFullYear()) * 12
    + target.getUTCMonth() - start.getUTCMonth()
}

function occursOnDate(item: ReminderSchedule, targetDate: string) {
  if (targetDate < item.event_date) return false
  if (item.recurrence.until && targetDate > item.recurrence.until) return false
  if (item.recurrence.frequency === 'NONE') return targetDate === item.event_date

  const interval = Math.max(1, item.recurrence.interval)
  if (item.recurrence.frequency === 'DAILY') {
    const days = Math.round((wallDateToUtc(targetDate, '00:00').getTime() - wallDateToUtc(item.event_date, '00:00').getTime()) / 86_400_000)
    return days >= 0 && days % interval === 0
  }

  if (item.recurrence.frequency === 'WEEKLY') {
    const days = Math.round((wallDateToUtc(targetDate, '00:00').getTime() - wallDateToUtc(item.event_date, '00:00').getTime()) / 86_400_000)
    return days >= 0 && days % (7 * interval) === 0
  }

  const months = monthDifference(item.event_date, targetDate)
  if (months < 0 || months % interval !== 0) return false

  return addMonths(item.event_date, months) === targetDate
}

function triggerWallClock(occurrenceDate: string, startTime: string, offsetMinutes: number) {
  const trigger = wallDateToUtc(occurrenceDate, startTime)
  trigger.setUTCMinutes(trigger.getUTCMinutes() - offsetMinutes)
  return {
    date: trigger.toISOString().slice(0, 10),
    time: trigger.toISOString().slice(11, 16),
  }
}

function reminderIsDue(trigger: { date: string; time: string }, now: { date: string; time: string }) {
  const triggerAt = wallDateToUtc(trigger.date, trigger.time)
  const nowAt = wallDateToUtc(now.date, now.time)
  const elapsed = nowAt.getTime() - triggerAt.getTime()
  return elapsed >= 0 && elapsed <= LOOKBACK_MS
}

async function claim(dispatchKey: string, scheduleId: number, channel: Channel, occurrenceDate: string, triggerAt: string) {
  const { error } = await db().from('reminder_dispatches').insert({
    dispatch_key: dispatchKey,
    schedule_id: scheduleId,
    channel,
    occurrence_date: occurrenceDate,
    trigger_at: triggerAt,
  })

  if (!error) return true
  if (error.code === '23505') return false
  throw new Error('Reminder dispatch claim failed: ' + error.message)
}

async function releaseClaim(dispatchKey: string) {
  const { error } = await db().from('reminder_dispatches').delete().eq('dispatch_key', dispatchKey)
  if (error) console.error('Reminder dispatch rollback failed:', error.message)
}

function reminderText(item: ReminderSchedule) {
  return [
    'MiD-Daily reminder',
    item.title,
    item.start_time,
    item.type === 'OTHER' ? '' : item.type,
  ].filter(Boolean).join(' • ')
}

async function deliver(channel: Channel, recipient: TelegramRecipient | WhatsAppRecipient, text: string) {
  if (channel === 'telegram') {
    await sendTelegramMessage((recipient as TelegramRecipient).chat_id, text)
    return
  }
  await sendWhatsAppText((recipient as WhatsAppRecipient).wa_id, text)
}

export async function runBackgroundReminderDispatch(now = new Date()) {
  if (!databaseClient) return { sent: 0, skipped: 0, errors: 0 }

  const current = wallClockParts(now)
  const previousDate = addDays(current.date, -1)
  const [{ data: schedules, error: scheduleError }, { data: telegrams, error: telegramError }, { data: whatsapps, error: whatsAppError }] = await Promise.all([
    db().from('schedule_items')
      .select('id,user_id,title,type,event_date,start_time,reminder_enabled,reminder_offset,recurrence')
      .eq('reminder_enabled', true)
      .lte('event_date', current.date),
    db().from('telegram_connections').select('user_id,chat_id'),
    db().from('whatsapp_connections').select('user_id,wa_id'),
  ])

  if (scheduleError) throw new Error('Reminder schedule read failed: ' + scheduleError.message)
  if (telegramError) throw new Error('Reminder Telegram recipient read failed: ' + telegramError.message)
  if (whatsAppError) throw new Error('Reminder WhatsApp recipient read failed: ' + whatsAppError.message)

  const telegramByUser = new Map((telegrams ?? []).map((item) => [item.user_id, item as TelegramRecipient]))
  const whatsappByUser = new Map((whatsapps ?? []).map((item) => [item.user_id, item as WhatsAppRecipient]))

  let sent = 0
  let skipped = 0
  let errors = 0

  for (const raw of schedules ?? []) {
    const item = raw as ReminderSchedule

    for (const occurrenceDate of [previousDate, current.date]) {
      if (!occursOnDate(item, occurrenceDate)) continue

      const trigger = triggerWallClock(occurrenceDate, item.start_time.slice(0, 5), item.reminder_offset)
      if (!reminderIsDue(trigger, current)) continue

      const message = reminderText(item)
      const recipients: Array<{ channel: Channel; recipient: TelegramRecipient | WhatsAppRecipient }> = []
      if (telegramByUser.has(item.user_id) && isTelegramConfigured()) {
        recipients.push({ channel: 'telegram', recipient: telegramByUser.get(item.user_id)! })
      }
      if (whatsappByUser.has(item.user_id) && isWhatsAppConfigured()) {
        recipients.push({ channel: 'whatsapp', recipient: whatsappByUser.get(item.user_id)! })
      }

      for (const target of recipients) {
        const triggerAt = trigger.time + ':00'
        const dispatchKey = item.id + ':' + target.channel + ':' + occurrenceDate + ':' + triggerAt
        if (!(await claim(dispatchKey, item.id, target.channel, occurrenceDate, triggerAt))) {
          skipped += 1
          continue
        }

        try {
          await deliver(target.channel, target.recipient, message)
          sent += 1
        } catch (error) {
          errors += 1
          await releaseClaim(dispatchKey)
          console.error('Background reminder delivery failed:', error)
        }
      }
    }
  }

  await db().from('reminder_dispatches')
    .delete()
    .lt('sent_at', new Date(Date.now() - 31 * 86_400_000).toISOString())

  return { sent, skipped, errors }
}
