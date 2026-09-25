import type { Session } from '@supabase/supabase-js'
import { apiRequest } from '../../lib/api'

export async function syncGoogleCalendarProviderToken(session: Session | null) {
  if (!session || session.user.app_metadata.provider !== 'google') return

  const accessToken = session.provider_token
  if (!accessToken) return

  const refreshToken = session.provider_refresh_token

  await apiRequest<{ connected: boolean }>(
    '/api/integrations/google-calendar/provider-token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken,
        ...(refreshToken ? { refreshToken } : {}),
      }),
    },
  )
}
