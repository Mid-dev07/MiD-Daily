import { createHash } from 'node:crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? ''
const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME ?? ''
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? ''
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL ?? ''
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : ''

export interface TelegramMessage {
  message_id: number
  text?: string
  chat: {
    id: number
    type: string
  }
  from?: {
    id: number
    username?: string
  }
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

export function verifyWebhookSecret(value: string | undefined) {
  return Boolean(WEBHOOK_SECRET && value === WEBHOOK_SECRET)
}

async function telegramRequest<T>(method: string, body: Record<string, unknown>) {
  if (!API_BASE) throw new Error('TELEGRAM_BOT_TOKEN is not configured.')

  const response = await fetch(`${API_BASE}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json() as { ok?: boolean; result?: T; description?: string }
  if (!response.ok || !data.ok) throw new Error(data.description ?? `Telegram API ${method} failed.`)
  return data.result as T
}

export async function sendTelegramMessage(chatId: number, text: string) {
  if (text.length > 4096) text = text.slice(0, 4093) + '...'
  return telegramRequest('sendMessage', { chat_id: chatId, text })
}

export async function setTelegramWebhook() {
  if (!WEBHOOK_URL || !WEBHOOK_SECRET) throw new Error('TELEGRAM_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET are required.')
  return telegramRequest('setWebhook', {
    url: WEBHOOK_URL,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ['message'],
  })
}

export function isTelegramConfigured() {
  return Boolean(BOT_TOKEN && BOT_USERNAME && WEBHOOK_SECRET && WEBHOOK_URL)
}

export function parseCommand(text: string) {
  const normalized = text.trim()
  const match = normalized.match(/^\/([a-zA-Z0-9_]+)(?:@[a-zA-Z0-9_]+)?(?:\s+([\s\S]*))?$/)
  if (!match) return null
  return {
    command: match[1].toLowerCase(),
    args: (match[2] ?? '').trim(),
  }
}

export function createAuditId(updateId: number) {
  return createHash('sha256').update(String(updateId)).digest('hex').slice(0, 16)
}

export { BOT_USERNAME }
