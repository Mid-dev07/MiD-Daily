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

export async function dispatchNaturalLanguageMessage(request: GatewayRequest): Promise<GatewayResponse> {
  const text = normalizeText(request.text)
  if (!text) throw new Error('Message is empty.')

  const context = [
    'Channel: ' + request.channel + '.',
    'This is an authenticated MiD-Daily channel message.',
    'Treat direct requests such as add/create/record/save as explicit user instructions.',
    'For questions, summaries, or planning requests, use read tools without writing data.',
    'Never expose internal tool names, ids, secrets, access tokens, or database details.',
    'Current app timezone is configured server-side.',
  ].join(' ')

  const messages: AssistantMessage[] = [{ role: 'user', content: context + '\n\nUser message:\n' + text }]
  return runAssistant(request.userId, messages, true)
}
