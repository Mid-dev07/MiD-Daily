import { apiRequest } from '../lib/api'

export interface TelegramStatus {
  configured: boolean
  connected: boolean
  connectedAt: string | null
  username: string | null
}

export interface TelegramLink {
  code: string
  expiresAt: string
  deepLink: string
}

export async function getTelegramStatus() {
  return apiRequest<TelegramStatus>('/api/integrations/telegram/status')
}

export async function createTelegramLink() {
  return apiRequest<TelegramLink>('/api/integrations/telegram/link-code', { method: 'POST' })
}

export async function disconnectTelegram() {
  await apiRequest<{ connected: boolean }>('/api/integrations/telegram/disconnect', { method: 'POST' })
}
