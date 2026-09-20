import { createHmac, timingSafeEqual } from 'node:crypto'

const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? ''
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? ''
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION ?? ''
const APP_SECRET = process.env.WHATSAPP_APP_SECRET ?? ''
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? ''
const BUSINESS_PHONE_NUMBER = (process.env.WHATSAPP_BUSINESS_PHONE_NUMBER ?? '').replace(/\D/g, '')
const GRAPH_BASE = GRAPH_VERSION && PHONE_NUMBER_ID
  ? `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}`
  : ''

export function isWhatsAppConfigured() {
  return Boolean(ACCESS_TOKEN && PHONE_NUMBER_ID && GRAPH_VERSION && APP_SECRET && VERIFY_TOKEN && BUSINESS_PHONE_NUMBER)
}

export function getWhatsAppConfig() {
  return { configured: isWhatsAppConfigured(), businessPhoneNumber: BUSINESS_PHONE_NUMBER }
}

export function verifyWebhookChallenge(mode: string | null, token: string | null, challenge: string | null) {
  return mode === 'subscribe' && Boolean(challenge) && token === VERIFY_TOKEN ? challenge : null
}

export function verifyWhatsAppSignature(rawBody: string, signature: string | undefined) {
  if (!APP_SECRET || !signature?.startsWith('sha256=')) return false
  const expected = Buffer.from('sha256=' + createHmac('sha256', APP_SECRET).update(rawBody, 'utf8').digest('hex'))
  const received = Buffer.from(signature)
  return expected.length === received.length && timingSafeEqual(expected, received)
}

async function graphRequest<T>(body: Record<string, unknown>) {
  if (!GRAPH_BASE || !ACCESS_TOKEN) throw new Error('WhatsApp Cloud API is not configured.')
  const response = await fetch(`${GRAPH_BASE}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json() as { messages?: Array<{ id?: string }>; error?: { message?: string } }
  if (!response.ok) throw new Error(data.error?.message ?? 'WhatsApp API request failed.')
  return data as T
}

export async function sendWhatsAppText(to: string, text: string) {
  return graphRequest({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text.slice(0, 4096) },
  })
}

export function parseWhatsAppCommand(text: string) {
  const value = text.trim()
  const match = value.match(/^(?:link|\/link)\\s+(.+)$/i)
  if (match) return { command: 'link', args: match[1].trim() }

  const command = value.match(/^\\/([a-zA-Z0-9_]+)\\s*([\\s\\S]*)$/)
  if (!command) return null
  return { command: command[1].toLowerCase(), args: command[2].trim() }
}

export function buildWhatsAppUpdateHash(rawBody: string) {
  return createHmac('sha256', APP_SECRET || 'mid-daily').update(rawBody).digest('hex').slice(0, 32)
}
