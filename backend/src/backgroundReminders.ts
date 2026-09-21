import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage, isTelegramConfigured } from './integrations/telegram.js'
import { sendWhatsAppText, isWhatsAppConfigured } from './integrations/whatsapp.js'
import { addDays, occursOnDate, reminderIsDue, triggerWallClock, wallClockParts } from './backgroundReminderRules.js'

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

  const current = wallClockParts(now, APP_TIMEZONE)
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
