import { refreshLongLivedInstagramToken, isInstagramOAuthConfigured } from './instagramOAuth.js'
import {
  decryptInstagramTokenForRefresh,
  listInstagramConnectionsForRefresh,
  markInstagramConnectionDegraded,
  updateInstagramRefreshedToken,
} from './instagramStore.js'

const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export async function refreshInstagramConnections(now = new Date()) {
  if (!isInstagramOAuthConfigured()) return { scanned: 0, refreshed: 0, degraded: 0 }

  const candidates = await listInstagramConnectionsForRefresh(new Date(now.getTime() + REFRESH_WINDOW_MS))
  let refreshed = 0
  let degraded = 0

  for (const connection of candidates) {
    try {
      const token = decryptInstagramTokenForRefresh(connection.userId, connection.encryptedAccessToken)
      const result = await refreshLongLivedInstagramToken(token)
      const tokenExpiresAt = result.expiresIn > 0
        ? new Date(Date.now() + result.expiresIn * 1000).toISOString()
        : null

      await updateInstagramRefreshedToken(connection.userId, result.accessToken, tokenExpiresAt)
      refreshed += 1
    } catch {
      await markInstagramConnectionDegraded(connection.userId)
      degraded += 1
    }
  }

  return { scanned: candidates.length, refreshed, degraded }
}
