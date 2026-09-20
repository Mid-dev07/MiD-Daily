import { apiRequest } from '../lib/api'

export interface WhatsAppStatus {
  configured: boolean
  connected: boolean
  connectedAt: string | null
  displayName: string | null
  businessPhoneNumber: string | null
}

export interface WhatsAppLink {
  code: string
  expiresAt: string
  deepLink: string
}

export async function getWhatsAppStatus() {
  return apiRequest<WhatsAppStatus>('/api/integrations/whatsapp/status')
}

export async function createWhatsAppLink() {
  return apiRequest<WhatsAppLink>('/api/integrations/whatsapp/link-code', { method: 'POST' })
}

export async function disconnectWhatsApp() {
  await apiRequest<{ connected: boolean }>('/api/integrations/whatsapp/disconnect', { method: 'POST' })
}
