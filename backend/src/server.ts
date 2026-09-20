import { createHash, randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'

const PORT = Number(process.env.PORT ?? 8787)
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${PORT}/auth/google/callback`
const COOKIE_NAME = 'mid_daily_google'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

interface OAuthState {
  verifier: string
  createdAt: number
}

interface GoogleTokenSet {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string
  tokenType: string
}

interface GoogleConnection {
  token: GoogleTokenSet
  connectedAt: string
}

const oauthStates = new Map<string, OAuthState>()
const connections = new Map<string, GoogleConnection>()

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  const body = JSON.stringify(payload)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function sendRedirect(res: ServerResponse, location: string) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' })
  res.end()
}

function parseCookies(req: IncomingMessage) {
  const raw = req.headers.cookie ?? ''
  return Object.fromEntries(raw.split(';').map((part) => {
    const [key, ...value] = part.trim().split('=')
    return [key, decodeURIComponent(value.join('='))]
  }).filter(([key]) => key))
}

function setConnectionCookie(res: ServerResponse, connectionId: string) {
  res.setHeader('Set-Cookie', [
    `${COOKIE_NAME}=${encodeURIComponent(connectionId)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ])
}

function clearConnectionCookie(res: ServerResponse) {
  res.setHeader('Set-Cookie', [`${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`])
}

function base64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/g, '')
}

function createPkceVerifier() {
  return base64Url(randomBytes(32))
}

function createPkceChallenge(verifier: string) {
  return base64Url(createHash('sha256').update(verifier).digest())
}

function createId() {
  return base64Url(randomBytes(24))
}

function assertGoogleConfigured() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  }
}

async function exchangeCode(code: string, verifier: string): Promise<GoogleTokenSet> {
  const body = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await response.json() as Record<string, unknown>
  if (!response.ok || typeof data.access_token !== 'string') {
    throw new Error(typeof data.error_description === 'string' ? data.error_description : 'Google token exchange failed.')
  }

  return {
    accessToken: data.access_token,
    refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
    scope: typeof data.scope === 'string' ? data.scope : undefined,
    tokenType: typeof data.token_type === 'string' ? data.token_type : 'Bearer',
  }
}

function cleanupOAuthStates() {
  const cutoff = Date.now() - OAUTH_STATE_TTL_MS
  for (const [state, item] of oauthStates) {
    if (item.createdAt < cutoff) oauthStates.delete(state)
  }
}

function handleStatus(req: IncomingMessage, res: ServerResponse) {
  const connectionId = parseCookies(req)[COOKIE_NAME]
  const connection = connectionId ? connections.get(connectionId) : undefined

  sendJson(res, 200, {
    configured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    connected: Boolean(connection),
    connectedAt: connection?.connectedAt ?? null,
  })
}

function handleStart(res: ServerResponse) {
  try {
    assertGoogleConfigured()
    cleanupOAuthStates()

    const state = base64Url(randomBytes(24))
    const verifier = createPkceVerifier()
    oauthStates.set(state, { verifier, createdAt: Date.now() })

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: CALENDAR_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
      code_challenge: createPkceChallenge(verifier),
      code_challenge_method: 'S256',
    })

    sendRedirect(res, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  } catch (error) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_not_configured')}`)
  }
}

async function handleCallback(url: URL, res: ServerResponse) {
  const error = url.searchParams.get('error')
  if (error) {
    sendRedirect(res, `${FRONTEND_URL}/?google=cancelled&reason=${encodeURIComponent(error)}`)
    return
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=missing_code_or_state`)
    return
  }

  const pending = oauthStates.get(state)
  oauthStates.delete(state)

  if (!pending || Date.now() - pending.createdAt > OAUTH_STATE_TTL_MS) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=invalid_or_expired_state`)
    return
  }

  try {
    assertGoogleConfigured()
    const token = await exchangeCode(code, pending.verifier)
    const connectionId = createId()
    connections.set(connectionId, { token, connectedAt: new Date().toISOString() })
    setConnectionCookie(res, connectionId)
    sendRedirect(res, `${FRONTEND_URL}/?google=connected`)
  } catch (exchangeError) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=${encodeURIComponent(exchangeError instanceof Error ? exchangeError.message : 'token_exchange_failed')}`)
  }
}

async function revokeToken(token: GoogleTokenSet) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token.refreshToken ?? token.accessToken)}`, {
    method: 'POST',
  })
}

async function handleDisconnect(req: IncomingMessage, res: ServerResponse) {
  const connectionId = parseCookies(req)[COOKIE_NAME]
  if (connectionId) {
    const connection = connections.get(connectionId)
    if (connection) {
      try {
        await revokeToken(connection.token)
      } finally {
        connections.delete(connectionId)
      }
    }
  }

  clearConnectionCookie(res)
  sendJson(res, 200, { connected: false })
}

function addCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  addCors(res)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  try {
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true, service: 'mid-daily-backend' })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/integrations/google-calendar/status') {
      handleStatus(req, res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/auth/google/start') {
      handleStart(res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/auth/google/callback') {
      await handleCallback(url, res)
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/integrations/google-calendar/disconnect') {
      await handleDisconnect(req, res)
      return
    }

    sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Internal server error' })
  }
}

createServer((req, res) => void handle(req, res)).listen(PORT, () => {
  console.log(`MiD-Daily backend listening on http://localhost:${PORT}`)
})
