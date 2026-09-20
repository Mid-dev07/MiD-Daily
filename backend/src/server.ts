import { createHash, randomBytes } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import {
  deleteGoogleConnection,
  getGoogleConnection,
  isGooglePersistenceConfigured,
  saveGoogleConnection,
  type GoogleConnection,
} from './integrations/googleCalendarStore.js'

const PORT = Number(process.env.PORT ?? 8787)
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ''
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? `http://localhost:${PORT}/auth/google/callback`
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true'
const OWNER_COOKIE_NAME = 'mid_daily_owner'
const OAUTH_STATE_COOKIE_NAME = 'mid_daily_google_oauth_state'
const OWNER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60_000
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''
const supabaseAuthClient = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } })
  : null

interface OAuthState {
  verifier: string
  createdAt: number
  ownerId: string
}

interface GoogleCalendarEventPayload {
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  extendedProperties?: {
    private?: Record<string, string>
  }
}

const oauthStates = new Map<string, OAuthState>()

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

function appendCookie(res: ServerResponse, value: string) {
  const existing = res.getHeader('Set-Cookie')
  const cookies = Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : []
  res.setHeader('Set-Cookie', [...cookies, value])
}

function cookieSuffix() {
  return COOKIE_SECURE ? '; Secure' : ''
}

function setOwnerCookie(res: ServerResponse, ownerId: string) {
  appendCookie(
    res,
    `${OWNER_COOKIE_NAME}=${encodeURIComponent(ownerId)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${OWNER_MAX_AGE_SECONDS}${cookieSuffix()}`,
  )
}

function clearOwnerCookie(res: ServerResponse) {
  appendCookie(
    res,
    `${OWNER_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${cookieSuffix()}`,
  )
}

function setOAuthStateCookie(res: ServerResponse, state: string) {
  appendCookie(
    res,
    `${OAUTH_STATE_COOKIE_NAME}=${encodeURIComponent(state)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=600${cookieSuffix()}`,
  )
}

function clearOAuthStateCookie(res: ServerResponse) {
  appendCookie(
    res,
    `${OAUTH_STATE_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${cookieSuffix()}`,
  )
}

function base64Url(buffer: Buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
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

function ensureOwnerId(req: IncomingMessage, res: ServerResponse) {
  const existing = parseCookies(req)[OWNER_COOKIE_NAME]
  if (existing && /^[A-Za-z0-9_-]{24,128}$/.test(existing)) return existing

  const ownerId = createId()
  setOwnerCookie(res, ownerId)
  return ownerId
}

function readOwnerId(req: IncomingMessage) {
  const ownerId = parseCookies(req)[OWNER_COOKIE_NAME]
  if (!ownerId || !/^[A-Za-z0-9_-]{24,128}$/.test(ownerId)) {
    throw new Error('MiD-Daily owner session is missing. Refresh and try again.')
  }
  return ownerId
}

function assertGoogleConfigured() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth is not configured.')
  }
}

function httpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number }
  error.status = status
  return error
}

async function resolveOwnerId(req: IncomingMessage, res: ServerResponse) {
  const authorization = req.headers.authorization
  if (authorization) {
    if (!authorization.startsWith('Bearer ')) throw httpError(401, 'Invalid authorization header.')
    if (!supabaseAuthClient) throw httpError(503, 'Supabase Auth is not configured.')
    const token = authorization.slice('Bearer '.length).trim()
    if (!token) throw httpError(401, 'Invalid access token.')

    const { data, error } = await supabaseAuthClient.auth.getUser(token)
    if (error || !data.user) throw httpError(401, 'Authentication session is invalid.')
    return data.user.id
  }

  return ensureOwnerId(req, res)
}

function assertPersistenceConfigured() {
  if (!isGooglePersistenceConfigured()) {
    throw new Error('Supabase persistence is not configured.')
  }
}

async function exchangeCode(code: string, verifier: string): Promise<GoogleConnection['token']> {
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

async function refreshAccessToken(ownerId: string, connection: GoogleConnection) {
  if (!connection.token.refreshToken) {
    throw new Error('Google access expired. Reconnect Google Calendar.')
  }

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: connection.token.refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await response.json() as Record<string, unknown>

  if (!response.ok || typeof data.access_token !== 'string') {
    throw new Error(typeof data.error_description === 'string' ? data.error_description : 'Google access token refresh failed.')
  }

  connection.token = {
    ...connection.token,
    accessToken: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in ?? 3600) * 1000,
    tokenType: typeof data.token_type === 'string' ? data.token_type : connection.token.tokenType,
    scope: typeof data.scope === 'string' ? data.scope : connection.token.scope,
    refreshToken: connection.token.refreshToken,
  }

  await saveGoogleConnection(ownerId, connection)
}

async function getValidAccessToken(ownerId: string, connection: GoogleConnection) {
  if (connection.token.expiresAt - Date.now() <= ACCESS_TOKEN_REFRESH_MARGIN_MS) {
    await refreshAccessToken(ownerId, connection)
  }
  return connection.token.accessToken
}

async function readRequestJson(req: IncomingMessage) {
  return await new Promise<Record<string, unknown>>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer | string) => {
      body += chunk.toString()
      if (body.length > 64 * 1024) {
        reject(new Error('Request body is too large.'))
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!body.trim()) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(body) as Record<string, unknown>)
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })
    req.on('error', reject)
  })
}

function parseEventPayload(value: unknown): GoogleCalendarEventPayload {
  if (!value || typeof value !== 'object') throw new Error('Calendar event is required.')
  const event = value as Record<string, unknown>
  const start = event.start as Record<string, unknown> | undefined
  const end = event.end as Record<string, unknown> | undefined

  if (typeof event.summary !== 'string' || !event.summary.trim()) throw new Error('Calendar event summary is required.')
  if (!start || typeof start.dateTime !== 'string' || typeof start.timeZone !== 'string') throw new Error('Calendar event start is invalid.')
  if (!end || typeof end.dateTime !== 'string' || typeof end.timeZone !== 'string') throw new Error('Calendar event end is invalid.')

  return {
    summary: event.summary.trim(),
    description: typeof event.description === 'string' ? event.description : undefined,
    location: typeof event.location === 'string' ? event.location : undefined,
    start: { dateTime: start.dateTime, timeZone: start.timeZone },
    end: { dateTime: end.dateTime, timeZone: end.timeZone },
    extendedProperties: event.extendedProperties,
  }
}

function assertCalendarId(value: unknown) {
  const calendarId = typeof value === 'string' && value.trim() ? value.trim() : 'primary'
  if (calendarId.length > 256) throw new Error('Calendar ID is invalid.')
  return calendarId
}

function assertEventId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,1024}$/.test(value)) {
    throw new Error('Google Calendar event ID is invalid.')
  }
  return value
}

async function googleCalendarRequest(
  ownerId: string,
  connection: GoogleConnection,
  method: string,
  url: string,
  body?: unknown,
) {
  const execute = async () => {
    const accessToken = await getValidAccessToken(ownerId, connection)
    return fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  }

  let response = await execute()

  if (response.status === 401 && connection.token.refreshToken) {
    await refreshAccessToken(ownerId, connection)
    response = await execute()
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as Record<string, unknown>
    const nestedError = data.error as Record<string, unknown> | undefined
    const message = typeof data.error_description === 'string'
      ? data.error_description
      : typeof nestedError?.message === 'string'
        ? nestedError.message
        : `Google Calendar request failed (${response.status}).`

    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null
  return response.json() as Promise<Record<string, unknown>>
}

function cleanupOAuthStates() {
  const cutoff = Date.now() - OAUTH_STATE_TTL_MS
  for (const [state, item] of oauthStates) {
    if (item.createdAt < cutoff) oauthStates.delete(state)
  }
}

async function handleStatus(req: IncomingMessage, res: ServerResponse) {
  const ownerId = await resolveOwnerId(req, res)
  const connection = isGooglePersistenceConfigured() ? await getGoogleConnection(ownerId) : null

  sendJson(res, 200, {
    configured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && isGooglePersistenceConfigured()),
    connected: Boolean(connection),
    connectedAt: connection?.connectedAt ?? null,
  })
}

async function createGoogleAuthUrl(req: IncomingMessage, res: ServerResponse) {
    assertGoogleConfigured()
    assertPersistenceConfigured()
    cleanupOAuthStates()

    const ownerId = await resolveOwnerId(req, res)
    const state = base64Url(randomBytes(24))
    const verifier = createPkceVerifier()
    oauthStates.set(state, { verifier, createdAt: Date.now(), ownerId })
    setOAuthStateCookie(res, state)

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

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

async function handleStart(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = await createGoogleAuthUrl(req, res)
    sendRedirect(res, url)
  } catch (error) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=${encodeURIComponent(error instanceof Error ? error.message : 'oauth_not_configured')}`)
  }
}

async function handleStartApi(req: IncomingMessage, res: ServerResponse) {
  try {
    const url = await createGoogleAuthUrl(req, res)
    sendJson(res, 200, { url })
  } catch (error) {
    const status = error instanceof Error && 'status' in error && typeof (error as { status?: unknown }).status === 'number' ? Number((error as { status?: unknown }).status) : 500
    sendJson(res, status, { error: error instanceof Error ? error.message : 'Unable to start Google authorization.' })
  }
}

async function handleCallback(req: IncomingMessage, url: URL, res: ServerResponse) {
  const error = url.searchParams.get('error')
  if (error) {
    clearOAuthStateCookie(res)
    sendRedirect(res, `${FRONTEND_URL}/?google=cancelled&reason=${encodeURIComponent(error)}`)
    return
  }

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  if (!code || !state) {
    clearOAuthStateCookie(res)
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=missing_code_or_state`)
    return
  }

  const requestState = parseCookies(req)[OAUTH_STATE_COOKIE_NAME]
  const pending = oauthStates.get(state)
  oauthStates.delete(state)
  clearOAuthStateCookie(res)

  if (requestState !== state || !pending || Date.now() - pending.createdAt > OAUTH_STATE_TTL_MS) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=invalid_or_expired_state`)
    return
  }

  try {
    assertGoogleConfigured()
    assertPersistenceConfigured()
    const token = await exchangeCode(code, pending.verifier)
    await saveGoogleConnection(pending.ownerId, { token, connectedAt: new Date().toISOString() })
    sendRedirect(res, `${FRONTEND_URL}/?google=connected`)
  } catch (exchangeError) {
    sendRedirect(res, `${FRONTEND_URL}/?google=error&reason=${encodeURIComponent(exchangeError instanceof Error ? exchangeError.message : 'token_exchange_failed')}`)
  }
}

async function revokeToken(token: GoogleConnection['token']) {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token.refreshToken ?? token.accessToken)}`, {
    method: 'POST',
  })
}

async function handleDisconnect(req: IncomingMessage, res: ServerResponse) {
  try {
    const ownerId = await resolveOwnerId(req, res)
    const connection = await getGoogleConnection(ownerId)

    if (connection) {
      try {
        await revokeToken(connection.token)
      } finally {
        await deleteGoogleConnection(ownerId)
      }
    }

    sendJson(res, 200, { connected: false })
  } catch (error) {
    sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unable to disconnect Google Calendar.' })
  }
}

async function requireConnection(req: IncomingMessage, res: ServerResponse) {
  const ownerId = await resolveOwnerId(req, res)
  const connection = await getGoogleConnection(ownerId)

  if (!connection) {
    sendJson(res, 401, { error: 'Google Calendar is not connected.' })
    return null
  }

  return { ownerId, connection }
}

async function handleCreateEvent(req: IncomingMessage, res: ServerResponse) {
  const context = await requireConnection(req, res)
  if (!context) return

  const body = await readRequestJson(req)
  const calendarId = assertCalendarId(body.calendarId)
  const event = parseEventPayload(body.event)
  const result = await googleCalendarRequest(context.ownerId, context.connection, 'POST', `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`, event)

  sendJson(res, 200, {
    eventId: typeof result?.id === 'string' ? result.id : null,
    htmlLink: typeof result?.htmlLink === 'string' ? result.htmlLink : null,
  })
}

async function handleUpdateEvent(req: IncomingMessage, res: ServerResponse, url: URL) {
  const context = await requireConnection(req, res)
  if (!context) return

  const eventId = assertEventId(decodeURIComponent(url.pathname.split('/').pop() ?? ''))
  const body = await readRequestJson(req)
  const calendarId = assertCalendarId(body.calendarId)
  const event = parseEventPayload(body.event)
  const result = await googleCalendarRequest(
    context.ownerId,
    context.connection,
    'PUT',
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    event,
  )

  sendJson(res, 200, {
    eventId: typeof result?.id === 'string' ? result.id : eventId,
    htmlLink: typeof result?.htmlLink === 'string' ? result.htmlLink : null,
  })
}

async function handleDeleteEvent(req: IncomingMessage, res: ServerResponse, url: URL) {
  const context = await requireConnection(req, res)
  if (!context) return

  const eventId = assertEventId(decodeURIComponent(url.pathname.split('/').pop() ?? ''))
  const calendarId = assertCalendarId(url.searchParams.get('calendarId'))
  await googleCalendarRequest(
    context.ownerId,
    context.connection,
    'DELETE',
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
  )

  sendJson(res, 200, { deleted: true, eventId })
}

function addCors(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL)
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
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
      sendJson(res, 200, {
        ok: true,
        service: 'mid-daily-backend',
        persistenceConfigured: isGooglePersistenceConfigured(),
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/integrations/google-calendar/status') {
      await handleStatus(req, res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/auth/google/start') {
      await handleStart(req, res)
      return
    }

    if (req.method === 'POST' && url.pathname === '/auth/google/start') {
      await handleStartApi(req, res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/auth/google/callback') {
      await handleCallback(req, url, res)
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/integrations/google-calendar/disconnect') {
      await handleDisconnect(req, res)
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/integrations/google-calendar/events') {
      await handleCreateEvent(req, res)
      return
    }

    if (req.method === 'PUT' && url.pathname.startsWith('/api/integrations/google-calendar/events/')) {
      await handleUpdateEvent(req, res, url)
      return
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/integrations/google-calendar/events/')) {
      await handleDeleteEvent(req, res, url)
      return
    }

    sendJson(res, 404, { error: 'Not found' })
  } catch (error) {
    const status = error instanceof Error && 'status' in error && typeof (error as { status?: unknown }).status === 'number'
      ? Number((error as { status?: unknown }).status)
      : 500
    sendJson(res, status, { error: error instanceof Error ? error.message : 'Internal server error' })
  }
}

createServer((req, res) => void handle(req, res)).listen(PORT, () => {
  console.log(`MiD-Daily backend listening on http://localhost:${PORT}`)
})
