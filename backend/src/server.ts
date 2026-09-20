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
import {
  createFinance,
  createTask,
  deleteFinance,
  deleteTask,
  isDataPersistenceConfigured,
  listFinance,
  listTasks,
  updateFinance,
  updateTask,
} from './dataStore.js'
import { claimTelegramUpdate, createTelegramLinkCode, deleteTelegramConnectionByUserId, getTelegramConnectionByChatId, getTelegramConnectionByUserId, redeemTelegramLinkCode, isTelegramPersistenceConfigured } from './integrations/telegramStore.js'
import { isTelegramConfigured, parseCommand, sendTelegramMessage, verifyWebhookSecret } from './integrations/telegram.js'
import { getWhatsAppConfig, isWhatsAppConfigured, parseWhatsAppCommand, sendWhatsAppText, verifyWebhookChallenge, verifyWhatsAppSignature, buildWhatsAppUpdateHash } from './integrations/whatsapp.js'
import { createWhatsAppLinkCode, deleteWhatsAppConnectionByUserId, getWhatsAppConnectionByUserId, getWhatsAppConnectionByWaId, redeemWhatsAppLinkCode, claimWhatsAppUpdate, isWhatsAppPersistenceConfigured } from './integrations/whatsappStore.js'
import {
  createSchedule,
  deleteSchedule,
  isSchedulePersistenceConfigured,
  listSchedule,
  updateSchedule,
  type ScheduleRecord,
} from './scheduleStore.js'

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
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  })
  res.end(body)
}

function sendRedirect(res: ServerResponse, location: string) {
  res.writeHead(302, {
    Location: location,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  })
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

async function readRequestBody(req: IncomingMessage) {
  return await new Promise<string>((resolve, reject) => {
    let body = ''
    req.on('data', (chunk: Buffer | string) => {
      body += chunk.toString()
      if (body.length > 256 * 1024) {
        reject(new Error('Request body is too large.'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
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


function asyncHttpError(status: number, message: string) {
  return httpError(status, message)
}

async function requireAuthenticatedUserId(req: IncomingMessage) {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith('Bearer ')) throw asyncHttpError(401, 'Authentication is required.')
  if (!supabaseAuthClient) throw asyncHttpError(503, 'Supabase Auth is not configured.')
  const token = authorization.slice('Bearer '.length).trim()
  if (!token) throw asyncHttpError(401, 'Invalid access token.')

  const { data, error } = await supabaseAuthClient.auth.getUser(token)
  if (error || !data.user) throw asyncHttpError(401, 'Authentication session is invalid.')
  return data.user.id
}

function assertTaskId(url: URL) {
  const raw = url.pathname.split('/').pop() ?? ''
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id <= 0) throw httpError(400, 'Task ID is invalid.')
  return id
}

function assertFinanceId(url: URL) {
  const raw = url.pathname.split('/').pop() ?? ''
  const id = Number(raw)
  if (!Number.isSafeInteger(id) || id <= 0) throw httpError(400, 'Finance entry ID is invalid.')
  return id
}

function validateTaskInput(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const priority = body.priority
  const status = body.status
  const progress = body.progress
  const dueDate = body.dueDate
  const notes = body.notes

  if (!title || !category) throw httpError(400, 'Task title and category are required.')
  if (!['low', 'medium', 'high'].includes(String(priority))) throw httpError(400, 'Task priority is invalid.')
  if (!['todo', 'in-progress', 'done'].includes(String(status))) throw httpError(400, 'Task status is invalid.')
  if (!Number.isInteger(progress) || Number(progress) < 0 || Number(progress) > 100) throw httpError(400, 'Task progress is invalid.')
  if (dueDate !== undefined && dueDate !== null && (typeof dueDate !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dueDate))) {
    throw httpError(400, 'Task due date is invalid.')
  }

  return {
    title,
    category,
    priority: priority as 'low' | 'medium' | 'high',
    status: status as 'todo' | 'in-progress' | 'done',
    progress: Number(progress),
    dueDate: typeof dueDate === 'string' && dueDate ? dueDate : undefined,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
  }
}

function validateFinanceInput(body: Record<string, unknown>) {
  const type = body.type
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const amount = Number(body.amount)
  const category = typeof body.category === 'string' ? body.category.trim() : ''
  const date = body.date
  const notes = body.notes

  if (!['income', 'expense'].includes(String(type))) throw httpError(400, 'Finance type is invalid.')
  if (!title || !category) throw httpError(400, 'Finance title and category are required.')
  if (!Number.isFinite(amount) || amount <= 0) throw httpError(400, 'Finance amount must be greater than zero.')
  if (typeof date !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) throw httpError(400, 'Finance date is invalid.')

  return {
    type: type as 'income' | 'expense',
    title,
    amount,
    category,
    date,
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
  }
}


function scheduleTimeMinutes(value: string) {
  if (!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(value)) throw httpError(400, 'Schedule time is invalid.')
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function isIsoDate(value: unknown) {
  if (typeof value !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function validateScheduleInput(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const type = body.type
  const date = body.date
  const startTime = body.startTime
  const endTime = body.endTime
  const location = typeof body.location === 'string' ? body.location.trim() : ''
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''
  const reminderEnabled = Boolean(body.reminderEnabled)
  const reminderOffset = Number(body.reminderOffset)
  const recurrenceValue = body.recurrence
  const googleCalendarValue = body.googleCalendar

  if (!title) throw httpError(400, 'Schedule title is required.')
  if (!['CLASS','WORK','MEETING','STUDY','PERSONAL','APPOINTMENT','EVENT','OTHER'].includes(String(type))) throw httpError(400, 'Schedule type is invalid.')
  if (!isIsoDate(date)) throw httpError(400, 'Schedule date is invalid.')
  if (typeof startTime !== 'string' || typeof endTime !== 'string') throw httpError(400, 'Schedule time is required.')
  const start = scheduleTimeMinutes(startTime)
  const end = scheduleTimeMinutes(endTime)
  if (start >= end) throw httpError(400, 'Schedule end time must be after start time.')
  if (![0,5,10,15,30,60].includes(reminderOffset)) throw httpError(400, 'Schedule reminder offset is invalid.')

  const recurrence = recurrenceValue && typeof recurrenceValue === 'object'
    ? recurrenceValue as Record<string, unknown>
    : { frequency: 'NONE', interval: 1 }

  if (!['NONE','DAILY','WEEKLY','MONTHLY'].includes(String(recurrence.frequency))) throw httpError(400, 'Schedule recurrence is invalid.')
  const interval = Number(recurrence.interval ?? 1)
  if (!Number.isInteger(interval) || interval < 1 || interval > 30) throw httpError(400, 'Schedule recurrence interval is invalid.')
  if (recurrence.until !== undefined && recurrence.until !== null && !isIsoDate(recurrence.until)) throw httpError(400, 'Schedule recurrence end date is invalid.')
  if (recurrence.until && String(recurrence.until) < String(date)) throw httpError(400, 'Schedule recurrence end date cannot be before the activity date.')

  const googleCalendar = googleCalendarValue && typeof googleCalendarValue === 'object'
    ? googleCalendarValue as Record<string, unknown>
    : { status: 'not-synced', calendarId: 'primary' }

  const calendarId = typeof googleCalendar.calendarId === 'string' && googleCalendar.calendarId.trim()
    ? googleCalendar.calendarId.trim()
    : 'primary'

  const syncStatusValue = String(googleCalendar.status)
  const syncStatus: ScheduleRecord['googleCalendar']['status'] = ['not-synced','pending','synced','error'].includes(syncStatusValue)
    ? syncStatusValue as ScheduleRecord['googleCalendar']['status']
    : 'not-synced'

  const candidate: Omit<ScheduleRecord, 'id'> = {
    title,
    type: type as ScheduleRecord['type'],
    date: String(date),
    startTime,
    endTime,
    location,
    notes,
    reminderEnabled,
    reminderOffset: reminderOffset as ScheduleRecord['reminderOffset'],
    recurrence: {
      frequency: recurrence.frequency as ScheduleRecord['recurrence']['frequency'],
      interval,
      ...(typeof recurrence.until === 'string' ? { until: recurrence.until } : {}),
    },
    googleCalendar: {
      status: syncStatus,
      calendarId,
      ...(typeof googleCalendar.eventId === 'string' ? { eventId: googleCalendar.eventId } : {}),
      ...(typeof googleCalendar.lastSyncedAt === 'string' ? { lastSyncedAt: googleCalendar.lastSyncedAt } : {}),
      ...(typeof googleCalendar.error === 'string' ? { error: googleCalendar.error } : {}),
    },
  }

  return candidate
}

function assertNoScheduleOverlap(items: Array<{ id: number; date: string; startTime: string; endTime: string }>, candidate: { id?: number; date: string; startTime: string; endTime: string }) {
  const start = scheduleTimeMinutes(candidate.startTime)
  const end = scheduleTimeMinutes(candidate.endTime)
  const conflict = items.some((item) => item.id !== candidate.id && item.date === candidate.date && start < scheduleTimeMinutes(item.endTime) && end > scheduleTimeMinutes(item.startTime))
  if (conflict) throw httpError(409, 'This time overlaps another activity.')
}

async function handleListSchedule(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  sendJson(res, 200, { items: await listSchedule(userId) })
}

async function handleCreateSchedule(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  const body = await readRequestJson(req)
  const candidate = validateScheduleInput(body)
  const existing = await listSchedule(userId)
  assertNoScheduleOverlap(existing, candidate)
  sendJson(res, 201, { item: await createSchedule(userId, candidate) })
}

async function handleUpdateSchedule(req: IncomingMessage, res: ServerResponse, url: URL) {
  const userId = await requireAuthenticatedUserId(req)
  const id = assertTaskId(url)
  const body = await readRequestJson(req)
  const candidate = validateScheduleInput(body)
  const existing = await listSchedule(userId)
  if (!existing.some((item) => item.id === id)) throw httpError(404, 'Schedule item not found.')
  assertNoScheduleOverlap(existing, { ...candidate, id })
  const item = await updateSchedule(userId, id, candidate)
  if (!item) throw httpError(404, 'Schedule item not found.')
  sendJson(res, 200, { item })
}

async function handleDeleteSchedule(req: IncomingMessage, res: ServerResponse, url: URL) {
  const userId = await requireAuthenticatedUserId(req)
  const deleted = await deleteSchedule(userId, assertTaskId(url))
  if (!deleted) throw httpError(404, 'Schedule item not found.')
  sendJson(res, 200, { deleted: true })
}

async function handleListTasks(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  sendJson(res, 200, { items: await listTasks(userId) })
}

async function handleCreateTask(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  const body = await readRequestJson(req)
  const item = await createTask(userId, validateTaskInput(body))
  sendJson(res, 201, { item })
}

async function handleUpdateTask(req: IncomingMessage, res: ServerResponse, url: URL) {
  const userId = await requireAuthenticatedUserId(req)
  const id = assertTaskId(url)
  const body = await readRequestJson(req)
  const item = await updateTask(userId, id, validateTaskInput(body) as never)
  if (!item) throw httpError(404, 'Task not found.')
  sendJson(res, 200, { item })
}

async function handleDeleteTask(req: IncomingMessage, res: ServerResponse, url: URL) {
  const userId = await requireAuthenticatedUserId(req)
  const deleted = await deleteTask(userId, assertTaskId(url))
  if (!deleted) throw httpError(404, 'Task not found.')
  sendJson(res, 200, { deleted: true })
}

async function handleListFinance(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  sendJson(res, 200, { items: await listFinance(userId) })
}

async function handleCreateFinance(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  const body = await readRequestJson(req)
  const item = await createFinance(userId, validateFinanceInput(body))
  sendJson(res, 201, { item })
}

async function handleUpdateFinance(req: IncomingMessage, res: ServerResponse, url: URL) {
  const userId = await requireAuthenticatedUserId(req)
  const id = assertFinanceId(url)
  const body = await readRequestJson(req)
  const item = await updateFinance(userId, id, validateFinanceInput(body))
  if (!item) throw httpError(404, 'Finance entry not found.')
  sendJson(res, 200, { item })
}

async function handleDeleteFinance(req: IncomingMessage, res: ServerResponse, url: URL) {
  const userId = await requireAuthenticatedUserId(req)
  const deleted = await deleteFinance(userId, assertFinanceId(url))
  if (!deleted) throw httpError(404, 'Finance entry not found.')
  sendJson(res, 200, { deleted: true })
}

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? ''

function getWhatsAppMessage(body: Record<string, unknown>) {
  const entries = Array.isArray(body.entry) ? body.entry : []
  const entry = entries[0] && typeof entries[0] === 'object' ? entries[0] as Record<string, unknown> : null
  const changes = Array.isArray(entry?.changes) ? entry.changes : []
  const change = changes[0] && typeof changes[0] === 'object' ? changes[0] as Record<string, unknown> : null
  const value = change?.value && typeof change.value === 'object' ? change.value as Record<string, unknown> : null
  const messages = Array.isArray(value?.messages) ? value.messages : []
  const message = messages[0] && typeof messages[0] === 'object' ? messages[0] as Record<string, unknown> : null
  const contacts = Array.isArray(value?.contacts) ? value.contacts : []
  const contact = contacts[0] && typeof contacts[0] === 'object' ? contacts[0] as Record<string, unknown> : null
  const profile = contact?.profile && typeof contact.profile === 'object' ? contact.profile as Record<string, unknown> : null
  const textNode = message?.text && typeof message.text === 'object' ? message.text as Record<string, unknown> : null

  return {
    message,
    value,
    from: typeof message?.from === 'string' ? message.from : null,
    type: typeof message?.type === 'string' ? message.type : null,
    text: typeof textNode?.body === 'string' ? textNode.body : '',
    displayName: typeof profile?.name === 'string' ? profile.name : undefined,
  }
}

async function whatsAppHelp(to: string) {
  await sendWhatsAppText(to, [
    'MiD-Daily WhatsApp commands:',
    '/task <title>',
    '/expense <amount> <category> <title>',
    '/expenses',
    '/schedule',
    '/schedule tomorrow',
    '/disconnect',
  ].join('\\n'))
}

async function handleWhatsAppStatus(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  const connection = await getWhatsAppConnectionByUserId(userId)
  sendJson(res, 200, {
    configured: isWhatsAppConfigured() && isWhatsAppPersistenceConfigured(),
    connected: Boolean(connection),
    connectedAt: connection?.connected_at ?? null,
    displayName: connection?.display_name ?? null,
    businessPhoneNumber: getWhatsAppConfig().businessPhoneNumber || null,
  })
}

async function handleWhatsAppLinkCode(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  if (!isWhatsAppConfigured() || !isWhatsAppPersistenceConfigured()) throw httpError(503, 'WhatsApp integration is not configured.')
  const link = await createWhatsAppLinkCode(userId, getWhatsAppConfig().businessPhoneNumber)
  sendJson(res, 200, link)
}

async function handleWhatsAppDisconnect(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  await deleteWhatsAppConnectionByUserId(userId)
  sendJson(res, 200, { connected: false })
}

async function handleWhatsAppWebhookVerification(url: URL, res: ServerResponse) {
  const challenge = verifyWebhookChallenge(
    url.searchParams.get('hub.mode'),
    url.searchParams.get('hub.verify_token'),
    url.searchParams.get('hub.challenge'),
  )

  if (!challenge) {
    sendJson(res, 403, { error: 'WhatsApp webhook verification failed.' })
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(challenge)
}

async function handleWhatsAppWebhook(req: IncomingMessage, res: ServerResponse) {
  if (!isWhatsAppConfigured() || !isWhatsAppPersistenceConfigured()) {
    sendJson(res, 503, { error: 'WhatsApp integration is not configured.' })
    return
  }

  const rawBody = await readRequestBody(req)
  if (!verifyWhatsAppSignature(rawBody, req.headers['x-hub-signature-256'] as string | undefined)) {
    sendJson(res, 401, { error: 'Invalid WhatsApp webhook signature.' })
    return
  }

  const updateHash = buildWhatsAppUpdateHash(rawBody)
  if (!(await claimWhatsAppUpdate(updateHash))) {
    sendJson(res, 200, { ok: true, duplicate: true })
    return
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    sendJson(res, 400, { error: 'Webhook payload must be valid JSON.' })
    return
  }

  const incoming = getWhatsAppMessage(body)
  if (!incoming.message || incoming.type !== 'text' || !incoming.from) {
    sendJson(res, 200, { ok: true, ignored: true })
    return
  }

  const parsed = parseWhatsAppCommand(incoming.text)
  if (!parsed) {
    sendJson(res, 200, { ok: true, ignored: true })
    return
  }

  if (parsed.command === 'link') {
    const result = await redeemWhatsAppLinkCode(parsed.args, incoming.from, incoming.from, incoming.displayName)
    await sendWhatsAppText(incoming.from, result
      ? 'WhatsApp connected to your MiD-Daily account.'
      : 'This link code is invalid, expired, or already used.')
    sendJson(res, 200, { ok: true })
    return
  }

  const connection = await getWhatsAppConnectionByWaId(incoming.from)
  if (!connection) {
    await sendWhatsAppText(incoming.from, 'WhatsApp is not linked. Open MiD-Daily and generate a WhatsApp connection link first.')
    sendJson(res, 200, { ok: true })
    return
  }

  if (parsed.command === 'help') {
    await whatsAppHelp(incoming.from)
  } else if (parsed.command === 'task') {
    if (!parsed.args) {
      await sendWhatsAppText(incoming.from, 'Usage: /task <title>')
    } else {
      const task = await createTask(connection.user_id, {
        title: parsed.args,
        category: 'WhatsApp',
        priority: 'medium',
        status: 'todo',
        progress: 0,
      })
      await sendWhatsAppText(incoming.from, 'Task added: ' + task.title)
    }
  } else if (parsed.command === 'expense') {
    const parts = parsed.args.split(/\\s+/)
    const amount = Number(parts.shift())
    const category = parts.shift()
    const title = parts.join(' ').trim()

    if (!Number.isFinite(amount) || amount <= 0 || !category || !title) {
      await sendWhatsAppText(incoming.from, 'Usage: /expense <amount> <category> <title>')
    } else {
      const entry = await createFinance(connection.user_id, {
        type: 'expense',
        title,
        amount,
        category,
        date: dateInTimeZone(),
      })
      await sendWhatsAppText(incoming.from, 'Expense added: Rp ' + Math.round(entry.amount).toLocaleString('id-ID') + ' • ' + entry.title)
    }
  } else if (parsed.command === 'expenses') {
    const today = dateInTimeZone()
    const expenses = (await listFinance(connection.user_id)).filter((entry) => entry.type === 'expense' && entry.date === today)
    const total = expenses.reduce((sum, entry) => sum + entry.amount, 0)
    await sendWhatsAppText(incoming.from, "Today's expenses: Rp " + Math.round(total).toLocaleString('id-ID') + '\\n\\n' + formatTelegramExpenses(expenses))
  } else if (parsed.command === 'schedule') {
    const targetDate = parsed.args.toLowerCase() === 'tomorrow' ? dateInTimeZone(1) : dateInTimeZone()
    const items = (await listSchedule(connection.user_id)).filter((item) => item.date === targetDate)
    await sendWhatsAppText(incoming.from, targetDate + ' schedule:\\n\\n' + formatTelegramSchedule(items))
  } else if (parsed.command === 'disconnect') {
    await deleteWhatsAppConnectionByUserId(connection.user_id)
    await sendWhatsAppText(incoming.from, 'WhatsApp disconnected from MiD-Daily.')
  } else {
    await sendWhatsAppText(incoming.from, 'Unknown command. Use /help to see available commands.')
  }

  sendJson(res, 200, { ok: true })
}

const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'Asia/Jakarta'

function dateInTimeZone(daysFromToday = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const base = new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + daysFromToday))
  return base.toISOString().slice(0, 10)
}

function formatTelegramSchedule(items: Array<{ title: string; startTime: string; endTime: string; location: string }>) {
  if (items.length === 0) return 'No schedule found for this date.'
  return items.slice(0, 10).map((item, index) =>
    `${index + 1}. ${item.startTime}–${item.endTime} • ${item.title}${item.location ? ' • ' + item.location : ''}`
  ).join('\\n')
}

function formatTelegramExpenses(items: Array<{ title: string; amount: number; category: string }>) {
  if (items.length === 0) return 'No expenses recorded today.'
  return items.slice(0, 10).map((item, index) =>
    `${index + 1}. ${item.title} • Rp ${Math.round(item.amount).toLocaleString('id-ID')} • ${item.category}`
  ).join('\\n')
}

async function handleTelegramStatus(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  const connection = await getTelegramConnectionByUserId(userId)
  sendJson(res, 200, {
    configured: isTelegramConfigured() && isTelegramPersistenceConfigured(),
    connected: Boolean(connection),
    connectedAt: connection?.connected_at ?? null,
    username: connection?.telegram_username ?? null,
  })
}

async function handleTelegramLinkCode(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  if (!isTelegramConfigured() || !isTelegramPersistenceConfigured()) {
    throw httpError(503, 'Telegram integration is not configured.')
  }
  const link = await createTelegramLinkCode(userId, process.env.TELEGRAM_BOT_USERNAME ?? '')
  sendJson(res, 200, link)
}

async function handleTelegramDisconnect(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  await deleteTelegramConnectionByUserId(userId)
  sendJson(res, 200, { connected: false })
}

async function telegramHelp(chatId: number) {
  await sendTelegramMessage(chatId, [
    'MiD-Daily Telegram commands:',
    '/task <title>',
    '/expense <amount> <category> <title>',
    '/expenses',
    '/schedule',
    '/schedule tomorrow',
    '/disconnect',
  ].join('\\n'))
}

async function handleTelegramUpdate(req: IncomingMessage, res: ServerResponse) {
  if (!isTelegramConfigured() || !isTelegramPersistenceConfigured()) {
    sendJson(res, 503, { error: 'Telegram integration is not configured.' })
    return
  }

  if (!verifyWebhookSecret(req.headers['x-telegram-bot-api-secret-token'] as string | undefined)) {
    sendJson(res, 401, { error: 'Invalid Telegram webhook secret.' })
    return
  }

  const body = await readRequestJson(req)
  const updateId = typeof body.update_id === 'number' ? body.update_id : NaN
  if (!Number.isSafeInteger(updateId)) {
    sendJson(res, 400, { error: 'Telegram update_id is required.' })
    return
  }

  if (!(await claimTelegramUpdate(updateId))) {
    sendJson(res, 200, { ok: true, duplicate: true })
    return
  }

  const message = body.message && typeof body.message === 'object' ? body.message as Record<string, unknown> : null
  const chat = message?.chat && typeof message.chat === 'object' ? message.chat as Record<string, unknown> : null
  const from = message?.from && typeof message.from === 'object' ? message.from as Record<string, unknown> : null
  const textValue = typeof message?.text === 'string' ? message.text : ''

  const chatId = Number(chat?.id)
  const telegramUserId = Number(from?.id)
  if (!Number.isSafeInteger(chatId) || !Number.isSafeInteger(telegramUserId)) {
    sendJson(res, 200, { ok: true, ignored: true })
    return
  }

  if (chat?.type !== 'private') {
    await sendTelegramMessage(chatId, 'MiD-Daily commands are currently available only in private chats.')
    sendJson(res, 200, { ok: true })
    return
  }

  const parsed = parseCommand(textValue)
  if (!parsed) {
    sendJson(res, 200, { ok: true, ignored: true })
    return
  }

  if (parsed.command === 'start' || parsed.command === 'link') {
    if (!parsed.args) {
      await telegramHelp(chatId)
      sendJson(res, 200, { ok: true })
      return
    }

    const result = await redeemTelegramLinkCode(parsed.args, chatId, telegramUserId, typeof from?.username === 'string' ? from.username : undefined)
    await sendTelegramMessage(chatId, result ? 'Telegram connected to your MiD-Daily account.' : 'This link code is invalid, expired, or already used.')
    sendJson(res, 200, { ok: true })
    return
  }

  const connection = await getTelegramConnectionByChatId(chatId)
  if (!connection) {
    await sendTelegramMessage(chatId, 'Telegram is not linked. Open MiD-Daily and generate a Telegram connection link first.')
    sendJson(res, 200, { ok: true })
    return
  }

  if (parsed.command === 'help') {
    await telegramHelp(chatId)
  } else if (parsed.command === 'task') {
    if (!parsed.args) {
      await sendTelegramMessage(chatId, 'Usage: /task <title>')
    } else {
      const task = await createTask(connection.user_id, {
        title: parsed.args,
        category: 'Telegram',
        priority: 'medium',
        status: 'todo',
        progress: 0,
      })
      await sendTelegramMessage(chatId, `Task added: ${task.title}`)
    }
  } else if (parsed.command === 'expense') {
    const parts = parsed.args.split(/\\s+/)
    const amount = Number(parts.shift())
    const category = parts.shift()
    const title = parts.join(' ').trim()

    if (!Number.isFinite(amount) || amount <= 0 || !category || !title) {
      await sendTelegramMessage(chatId, 'Usage: /expense <amount> <category> <title>')
    } else {
      const entry = await createFinance(connection.user_id, {
        type: 'expense',
        title,
        amount,
        category,
        date: dateInTimeZone(),
      })
      await sendTelegramMessage(chatId, `Expense added: Rp ${Math.round(entry.amount).toLocaleString('id-ID')} • ${entry.title}`)
    }
  } else if (parsed.command === 'expenses') {
    const today = dateInTimeZone()
    const expenses = (await listFinance(connection.user_id)).filter((entry) => entry.type === 'expense' && entry.date === today)
    const total = expenses.reduce((sum, entry) => sum + entry.amount, 0)
    await sendTelegramMessage(chatId, `Today's expenses: Rp ${Math.round(total).toLocaleString('id-ID')}\\n\\n${formatTelegramExpenses(expenses)}`)
  } else if (parsed.command === 'schedule') {
    const targetDate = parsed.args.toLowerCase() === 'tomorrow' ? dateInTimeZone(1) : dateInTimeZone()
    const items = (await listSchedule(connection.user_id)).filter((item) => item.date === targetDate)
    await sendTelegramMessage(chatId, `${targetDate} schedule:\\n\\n${formatTelegramSchedule(items)}`)
  } else if (parsed.command === 'disconnect') {
    await deleteTelegramConnectionByUserId(connection.user_id)
    await sendTelegramMessage(chatId, 'Telegram disconnected from MiD-Daily.')
  } else {
    await sendTelegramMessage(chatId, 'Unknown command. Use /help to see available commands.')
  }

  sendJson(res, 200, { ok: true })
}


async function handleAiChat(req: IncomingMessage, res: ServerResponse) {
  const userId = await requireAuthenticatedUserId(req)
  const body = await readRequestJson(req)
  const messagesValue = body.messages
  const allowWrites = body.allowWrites === true

  if (!Array.isArray(messagesValue) || messagesValue.length === 0) throw httpError(400, 'At least one AI message is required.')

  const messages = messagesValue.map((value) => {
    if (!value || typeof value !== 'object') throw httpError(400, 'AI message is invalid.')
    const item = value as Record<string, unknown>
    const role = item.role
    const content = item.content
    if (role !== 'user' && role !== 'assistant') throw httpError(400, 'AI message role is invalid.')
    if (typeof content !== 'string') throw httpError(400, 'AI message content is invalid.')
    return { role, content } as { role: 'user' | 'assistant'; content: string }
  })

  try {
    const result = await runAssistant(userId, messages, allowWrites)
    sendJson(res, 200, result)
  } catch (error) {
    const status = error instanceof Error && 'status' in error && typeof (error as { status?: unknown }).status === 'number'
      ? Number((error as { status?: unknown }).status)
      : 500
    sendJson(res, status, { error: error instanceof Error ? error.message : 'AI request failed.' })
  }
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
    if (req.method === 'POST' && url.pathname === '/api/ai/chat') {
      await handleAiChat(req, res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, {
        ok: true,
        service: 'mid-daily-backend',
        persistenceConfigured: isGooglePersistenceConfigured(),
        dataPersistenceConfigured: isDataPersistenceConfigured(),
        schedulePersistenceConfigured: isSchedulePersistenceConfigured(),
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/integrations/whatsapp/status') {
      await handleWhatsAppStatus(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/integrations/whatsapp/link-code') {
      await handleWhatsAppLinkCode(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/integrations/whatsapp/disconnect') {
      await handleWhatsAppDisconnect(req, res)
      return
    }
    if (req.method === 'GET' && url.pathname === '/webhooks/whatsapp') {
      await handleWhatsAppWebhookVerification(url, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/webhooks/whatsapp') {
      await handleWhatsAppWebhook(req, res)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/integrations/telegram/status') {
      await handleTelegramStatus(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/integrations/telegram/link-code') {
      await handleTelegramLinkCode(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/integrations/telegram/disconnect') {
      await handleTelegramDisconnect(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/webhooks/telegram') {
      await handleTelegramUpdate(req, res)
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

    if (req.method === 'GET' && url.pathname === '/api/tasks') {
      await handleListTasks(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/tasks') {
      await handleCreateTask(req, res)
      return
    }
    if (req.method === 'PUT' && url.pathname.startsWith('/api/tasks/')) {
      await handleUpdateTask(req, res, url)
      return
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/tasks/')) {
      await handleDeleteTask(req, res, url)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/schedule') {
      await handleListSchedule(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/schedule') {
      await handleCreateSchedule(req, res)
      return
    }
    if (req.method === 'PUT' && url.pathname.startsWith('/api/schedule/')) {
      await handleUpdateSchedule(req, res, url)
      return
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/schedule/')) {
      await handleDeleteSchedule(req, res, url)
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/finance') {
      await handleListFinance(req, res)
      return
    }
    if (req.method === 'POST' && url.pathname === '/api/finance') {
      await handleCreateFinance(req, res)
      return
    }
    if (req.method === 'PUT' && url.pathname.startsWith('/api/finance/')) {
      await handleUpdateFinance(req, res, url)
      return
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/finance/')) {
      await handleDeleteFinance(req, res, url)
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

createServer((req, res) => void handle(req, res)).listen(PORT, '0.0.0.0', () => {
  console.log(`MiD-Daily backend listening on http://localhost:${PORT}`)
})
