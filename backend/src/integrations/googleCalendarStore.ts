import { createClient } from '@supabase/supabase-js'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export interface GoogleTokenSet {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  scope?: string
  tokenType: string
}

export interface GoogleConnection {
  token: GoogleTokenSet
  connectedAt: string
}

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''
const TABLE = 'google_calendar_connections'

function db() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('Supabase persistence is not configured.')
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
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

function encrypt(ownerKey: string, payload: GoogleConnection) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  cipher.setAAD(Buffer.from(ownerKey, 'utf8'))
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()])
  return `v1.${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(encrypted)}`
}

function decrypt(ownerKey: string, value: string): GoogleConnection {
  const [version, iv, tag, ciphertext] = value.split('.')
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Stored Calendar token has an unsupported format.')

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), decode(iv))
  decipher.setAAD(Buffer.from(ownerKey, 'utf8'))
  decipher.setAuthTag(decode(tag))
  const decrypted = Buffer.concat([decipher.update(decode(ciphertext)), decipher.final()])
  return JSON.parse(decrypted.toString('utf8')) as GoogleConnection
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function getGoogleConnection(ownerKey: string): Promise<GoogleConnection | null> {
  const query = db().from(TABLE).select('owner_id,user_id,encrypted_token,connected_at')
  const { data, error } = await (isUuid(ownerKey)
    ? query.eq('user_id', ownerKey).maybeSingle()
    : query.eq('owner_id', ownerKey).maybeSingle())

  if (error) throw new Error(`Calendar persistence read failed: ${error.message}`)
  if (!data) return null

  return {
    ...decrypt(ownerKey, data.encrypted_token),
    connectedAt: data.connected_at,
  }
}

export async function saveGoogleConnection(ownerKey: string, connection: GoogleConnection) {
  const record = {
    owner_id: ownerKey,
    user_id: isUuid(ownerKey) ? ownerKey : null,
    encrypted_token: encrypt(ownerKey, connection),
    connected_at: connection.connectedAt,
    updated_at: new Date().toISOString(),
  }

  const query = db().from(TABLE)
  const { error } = isUuid(ownerKey)
    ? await query.upsert(record, { onConflict: 'user_id' })
    : await query.upsert(record, { onConflict: 'owner_id' })

  if (error) throw new Error(`Calendar persistence write failed: ${error.message}`)
}

export async function deleteGoogleConnection(ownerKey: string) {
  const query = db().from(TABLE)
  const { error } = await (isUuid(ownerKey)
    ? query.delete().eq('user_id', ownerKey)
    : query.delete().eq('owner_id', ownerKey))

  if (error) throw new Error(`Calendar persistence delete failed: ${error.message}`)
}

export function isGooglePersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY && process.env.TOKEN_ENCRYPTION_KEY_B64)
}
