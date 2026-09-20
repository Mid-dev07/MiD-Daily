import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

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
const TOKEN_ENCRYPTION_KEY_B64 = process.env.TOKEN_ENCRYPTION_KEY_B64 ?? ''
const TABLE = 'google_calendar_connections'

function encryptionKey() {
  const key = Buffer.from(TOKEN_ENCRYPTION_KEY_B64, 'base64')
  if (key.length !== 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY_B64 must decode to exactly 32 bytes.')
  }
  return key
}

function db() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Supabase persistence is not configured.')
  }

  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

function encode(buffer: Buffer) {
  return buffer.toString('base64url')
}

function decode(value: string) {
  return Buffer.from(value, 'base64url')
}

function encrypt(ownerId: string, payload: GoogleConnection) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  cipher.setAAD(Buffer.from(ownerId, 'utf8'))

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ])

  return `v1.${encode(iv)}.${encode(cipher.getAuthTag())}.${encode(encrypted)}`
}

function decrypt(ownerId: string, value: string): GoogleConnection {
  const [version, ivValue, tagValue, encryptedValue] = value.split('.')
  if (version !== 'v1' || !ivValue || !tagValue || !encryptedValue) {
    throw new Error('Stored Calendar token has an unsupported format.')
  }

  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), decode(ivValue))
  decipher.setAAD(Buffer.from(ownerId, 'utf8'))
  decipher.setAuthTag(decode(tagValue))

  const decrypted = Buffer.concat([
    decipher.update(decode(encryptedValue)),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString('utf8')) as GoogleConnection
}

export async function getGoogleConnection(ownerId: string): Promise<GoogleConnection | null> {
  const { data, error } = await db()
    .from(TABLE)
    .select('encrypted_token, connected_at')
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) throw new Error(`Calendar persistence read failed: ${error.message}`)
  if (!data) return null

  return {
    ...decrypt(ownerId, data.encrypted_token),
    connectedAt: data.connected_at,
  }
}

export async function saveGoogleConnection(ownerId: string, connection: GoogleConnection) {
  const payload = {
    owner_id: ownerId,
    encrypted_token: encrypt(ownerId, connection),
    connected_at: connection.connectedAt,
    updated_at: new Date().toISOString(),
  }

  const { error } = await db().from(TABLE).upsert(payload, { onConflict: 'owner_id' })
  if (error) throw new Error(`Calendar persistence write failed: ${error.message}`)
}

export async function deleteGoogleConnection(ownerId: string) {
  const { error } = await db().from(TABLE).delete().eq('owner_id', ownerId)
  if (error) throw new Error(`Calendar persistence delete failed: ${error.message}`)
}

export function isGooglePersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY && TOKEN_ENCRYPTION_KEY_B64)
}
