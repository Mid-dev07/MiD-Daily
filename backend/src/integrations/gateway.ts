import { runAssistant, type AssistantMessage } from '../ai/assistant.js'

export type GatewayChannel = 'telegram' | 'whatsapp'

export interface GatewayRequest {
  channel: GatewayChannel
  userId: string
  text: string
}

export interface GatewayResponse {
  text: string
  actions: Array<{ tool: string; ok: boolean }>
  model: string
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').slice(0, 4000)
}

function hasExplicitWriteIntent(text: string) {
  return /^(?:tambah|tambahkan|buat|catat|rekam|simpan|jadwalkan|atur|pasang|set|masukkan|masukan|add|create|record|save|schedule|set|log)\b/i.test(text)
}

export function channelAllowsWrites(text: string) {
  return hasExplicitWriteIntent(text)
}

export async function dispatchNaturalLanguageMessage(request: GatewayRequest): Promise<GatewayResponse> {
  const text = normalizeText(request.text)
  if (!text) throw new Error('Message is empty.')

  const allowWrites = hasExplicitWriteIntent(text)
  const context = [
    'Channel: ' + request.channel + '.',
    'This is an authenticated MiD-Daily channel message.',
    allowWrites
      ? 'This message begins with an explicit write-intent action. A write is allowed only if the user request itself clearly asks to create or record data.'
      : 'This message is read-only. Do not create or modify any data.',
    'For planning requests, use the read tools first and never invent unavailable data.',
    'Never expose internal tool names, ids, secrets, access tokens, or database details.',
    'Current app timezone is configured server-side.',
  ].join(' ')

  const messages: AssistantMessage[] = [{ role: 'user', content: context + '\n\nUser message:\n' + text }]
  return runAssistant(request.userId, messages, allowWrites)
}
