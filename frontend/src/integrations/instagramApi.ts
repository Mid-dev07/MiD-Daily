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
}

export function getInstagramInsights() {
  return apiRequest<InstagramInsightsResponse>('/api/integrations/instagram/insights')
}
