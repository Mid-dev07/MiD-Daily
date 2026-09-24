import { createClient } from '@supabase/supabase-js'
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''
const DATABASE_CLIENT = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null

function db() {
  if (!DATABASE_CLIENT) throw new Error('Supabase persistence is not configured.')
  return DATABASE_CLIENT
}

function encryptionKey() {
  const raw = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY_B64 ?? '', 'base64')
  if (raw.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes.')
  return raw
}

function encode(value: Buffer) {
  return value.toString('base64url')
}

function decode(value: string) {
  return Buffer.from(value, 'base64url')
}

function encryptToken(userId: string, token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  cipher.setAAD(Buffer.from('mid-daily-instagram:' + userId, 'utf8'))
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return 'v1.' + encode(iv) + '.' + encode(cipher.getAuthTag()) + '.' + encode(ciphertext)
}

function decryptToken(userId: string, value: string) {
  const [version, iv, tag, ciphertext] = value.split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Instagram connection token is invalid.')

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), decode(iv))
  decipher.setAAD(Buffer.from('mid-daily-instagram:' + userId, 'utf8'))
  decipher.setAuthTag(decode(tag))
  return Buffer.concat([decipher.update(decode(ciphertext)), decipher.final()]).toString('utf8')
}

export interface InstagramConnection {
  userId: string
  providerAccountId: string
  username: string | null
  accessToken: string
  tokenExpiresAt: string | null
  status: 'connected' | 'degraded' | 'revoked'
  connectedAt: string
  updatedAt: string
}

export async function getInstagramConnectionByUserId(userId: string): Promise<InstagramConnection | null> {
  const { data, error } = await db()
    .from('instagram_connections')
    .select('user_id,provider_account_id,username,encrypted_access_token,token_expires_at,status,connected_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error('Instagram connection read failed: ' + error.message)
  if (!data) return null

  return {
    userId: String(data.user_id),
    providerAccountId: String(data.provider_account_id),
    username: typeof data.username === 'string' ? data.username : null,
    accessToken: decryptToken(userId, String(data.encrypted_access_token)),
    tokenExpiresAt: typeof data.token_expires_at === 'string' ? data.token_expires_at : null,
    status: data.status as InstagramConnection['status'],
    connectedAt: String(data.connected_at),
    updatedAt: String(data.updated_at),
  }
}

export async function saveInstagramConnection(input: {
  userId: string
  providerAccountId: string
  username?: string | null
  accessToken: string
  tokenExpiresAt?: string | null
}) {
  const { error } = await db()
    .from('instagram_connections')
    .upsert({
      user_id: input.userId,
      provider_account_id: input.providerAccountId,
      username: input.username ?? null,
      encrypted_access_token: encryptToken(input.userId, input.accessToken),
      token_expires_at: input.tokenExpiresAt ?? null,
      status: 'connected',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) throw new Error('Instagram connection save failed: ' + error.message)
}

export async function deleteInstagramConnectionByUserId(userId: string) {
  const { error } = await db().from('instagram_connections').delete().eq('user_id', userId)
  if (error) throw new Error('Instagram disconnect failed: ' + error.message)
}

export function isInstagramConnectionPersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY)
}


function hashState(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export async function createInstagramOAuthState(userId: string) {
  const state = randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await db().from('instagram_oauth_states').delete().eq('user_id', userId)

  const { error } = await db().from('instagram_oauth_states').insert({
    state_hash: hashState(state),
    user_id: userId,
    expires_at: expiresAt,
  })
  if (error) throw new Error('Instagram OAuth state creation failed: ' + error.message)

  return { state, expiresAt }
}

export async function consumeInstagramOAuthState(state: string) {
  const { data, error } = await db()
    .from('instagram_oauth_states')
    .delete()
    .eq('state_hash', hashState(state))
    .gt('expires_at', new Date().toISOString())
    .select('user_id')
    .maybeSingle()

  if (error) throw new Error('Instagram OAuth state validation failed: ' + error.message)
  return data?.user_id ? String(data.user_id) : null
}


export interface InstagramRefreshCandidate {
  userId: string
  providerAccountId: string
  encryptedAccessToken: string
  tokenExpiresAt: string | null
}

export async function listInstagramConnectionsForRefresh(threshold: Date) {
  const { data, error } = await db()
    .from('instagram_connections')
    .select('user_id,provider_account_id,encrypted_access_token,token_expires_at,status')
    .eq('status', 'connected')
    .not('token_expires_at', 'is', null)
    .lte('token_expires_at', threshold.toISOString())

  if (error) throw new Error('Instagram refresh candidates lookup failed: ' + error.message)
  return (data ?? []).map((row) => ({
    userId: String(row.user_id),
    providerAccountId: String(row.provider_account_id),
    encryptedAccessToken: String(row.encrypted_access_token),
    tokenExpiresAt: typeof row.token_expires_at === 'string' ? row.token_expires_at : null,
  })) as InstagramRefreshCandidate[]
}

export async function updateInstagramRefreshedToken(
  userId: string,
  accessToken: string,
  tokenExpiresAt: string | null,
) {
  const { error } = await db()
    .from('instagram_connections')
    .update({
      encrypted_access_token: encryptToken(userId, accessToken),
      token_expires_at: tokenExpiresAt,
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) throw new Error('Instagram refreshed token save failed: ' + error.message)
}

export async function markInstagramConnectionDegraded(userId: string) {
  await db()
    .from('instagram_connections')
    .update({ status: 'degraded', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
}

export function decryptInstagramTokenForRefresh(userId: string, encryptedToken: string) {
  return decryptToken(userId, encryptedToken)
}
