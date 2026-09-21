import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

const whatsappDatabaseClient = SUPABASE_URL && SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null

function db() {
  if (!whatsappDatabaseClient) throw new Error('Supabase persistence is not configured.')
  return whatsappDatabaseClient
}

function hash(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function generateCode() {
  return randomBytes(24).toString('base64url')
}

export async function createWhatsAppLinkCode(userId: string, phoneNumber: string) {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await db().from('whatsapp_link_codes').delete().eq('user_id', userId).is('used_at', null)

  const { error } = await db().from('whatsapp_link_codes').insert({
    code_hash: hash(code),
    user_id: userId,
    expires_at: expiresAt,
  })
  if (error) throw new Error(`WhatsApp link-code creation failed: ${error.message}`)

  return {
    code,
    expiresAt,
    deepLink: `https://wa.me/${phoneNumber}?text=${encodeURIComponent('link ' + code)}`,
  }
}

export async function redeemWhatsAppLinkCode(code: string, waId: string, phoneNumber?: string, displayName?: string) {
  const { data, error } = await db().from('whatsapp_link_codes')
    .select('code_hash,user_id,expires_at,used_at')
    .eq('code_hash', hash(code))
    .maybeSingle()

  if (error) throw new Error(`WhatsApp link-code lookup failed: ${error.message}`)
  if (!data || data.used_at || new Date(data.expires_at).getTime() <= Date.now()) return null

  const { data: marked, error: markError } = await db().from('whatsapp_link_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code_hash', data.code_hash)
    .is('used_at', null)
    .select('user_id')
    .maybeSingle()

  if (markError) throw new Error(`WhatsApp link-code consume failed: ${markError.message}`)
  if (!marked) return null

  const { error: connectionError } = await db().from('whatsapp_connections').upsert({
    user_id: data.user_id,
    wa_id: waId,
    phone_number: phoneNumber ?? null,
    display_name: displayName ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (connectionError) {
    await db().from('whatsapp_link_codes').update({ used_at: null }).eq('code_hash', data.code_hash)
    if (connectionError.code === '23505') throw new Error('This WhatsApp account is already linked to another MiD-Daily account.')
    throw new Error(`WhatsApp connection save failed: ${connectionError.message}`)
  }

  return { userId: data.user_id }
}

export async function getWhatsAppConnectionByUserId(userId: string) {
  const { data, error } = await db().from('whatsapp_connections')
    .select('wa_id,phone_number,display_name,connected_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(`WhatsApp connection read failed: ${error.message}`)
  return data
}

export async function getWhatsAppConnectionByWaId(waId: string) {
  const { data, error } = await db().from('whatsapp_connections')
    .select('user_id,wa_id,phone_number,display_name,connected_at,updated_at')
    .eq('wa_id', waId)
    .maybeSingle()
  if (error) throw new Error(`WhatsApp connection lookup failed: ${error.message}`)
  return data
}

export async function deleteWhatsAppConnectionByUserId(userId: string) {
  const { error } = await db().from('whatsapp_connections').delete().eq('user_id', userId)
  if (error) throw new Error(`WhatsApp disconnect failed: ${error.message}`)
}

export async function claimWhatsAppUpdate(updateHash: string) {
  const { error } = await db().from('whatsapp_updates').insert({ update_hash: updateHash })
  if (!error) return true
  if (error.code === '23505') return false
  throw new Error(`WhatsApp webhook dedupe failed: ${error.message}`)
}

export function isWhatsAppPersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY)
}
