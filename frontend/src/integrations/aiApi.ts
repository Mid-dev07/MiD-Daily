import { apiRequest } from '../lib/api'

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AIProposal {
  tool: string
  arguments: Record<string, unknown>
}

export interface AIAssistantResponse {
  text: string
  actions: Array<{ tool: string; ok: boolean; preview?: boolean }>
  proposals: AIProposal[]
  model: string
}

export async function sendAIMessage(messages: AIMessage[], allowWrites: boolean, executionMode: 'preview' | 'execute' = 'preview') {
  return apiRequest<AIAssistantResponse>('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, allowWrites, executionMode }),
  })
}

export async function getAIStatus() {
  return apiRequest<{ configured: boolean }>('/api/ai/status')
}

export function executeAIProposals(proposals: AIProposal[]) {
  return apiRequest<{ actions: Array<{ tool: string; ok: boolean }> }>('/api/ai/proposals/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ proposals }),
  })
}
