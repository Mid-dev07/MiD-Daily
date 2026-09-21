import { apiRequest } from '../lib/api'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAssistantResponse {
  text: string
  actions: Array<{ tool: string; ok: boolean }>
  model: string
}

export async function sendAIMessage(messages: AIMessage[], allowWrites: boolean) {
  return apiRequest<AIAssistantResponse>('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, allowWrites }),
  })
}

export async function getAIStatus() {
  return apiRequest<{ configured: boolean }>('/api/ai/status')
}
