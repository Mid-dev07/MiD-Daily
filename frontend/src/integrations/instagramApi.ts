import { apiRequest } from '../lib/api'

export interface InstagramInsightsResponse {
  provider: 'INSTAGRAM'
  accountId: string
  username?: string
  followers?: number
  views?: number
  reach?: number
  accountsEngaged?: number
  totalInteractions?: number
  updatedAt: string
  scope?: 'user' | 'deployment'
}

export function getInstagramInsights() {
  return apiRequest<InstagramInsightsResponse>('/api/integrations/instagram/insights')
}

export function disconnectInstagram() {
  return apiRequest<{ connected: boolean }>('/api/integrations/instagram/disconnect', { method: 'POST' })
}
