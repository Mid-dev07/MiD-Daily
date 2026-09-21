import { apiRequest } from '../lib/api'

export interface IntegrationStatus {
  ai: {
    configured: boolean
  }
  telegram: {
    configured: boolean
    connected: boolean
    connectedAt: string | null
    username: string | null
  }
  whatsapp: {
    configured: boolean
    connected: boolean
    connectedAt: string | null
    displayName: string | null
    businessPhoneNumber: string | null
  }
  instagram: {
    configured: boolean
    mode: 'analytics-read-only'
  }
}

export interface IntegrationLink {
  code: string
  expiresAt: string
  deepLink: string
}

export function getIntegrationStatus() {
  return apiRequest<IntegrationStatus>('/api/integrations/status')
}

export function createTelegramLink() {
  return apiRequest<IntegrationLink>('/api/integrations/telegram/link-code', { method: 'POST' })
}

export function createWhatsAppLink() {
  return apiRequest<IntegrationLink>('/api/integrations/whatsapp/link-code', { method: 'POST' })
}

export function disconnectTelegram() {
  return apiRequest<{ connected: boolean }>('/api/integrations/telegram/disconnect', { method: 'POST' })
}

export function disconnectWhatsApp() {
  return apiRequest<{ connected: boolean }>('/api/integrations/whatsapp/disconnect', { method: 'POST' })
}
