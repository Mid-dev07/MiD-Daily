import { createHash, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? ''
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? ''

function db() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) throw new Error('Supabase persistence is not configured.')
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

function hash(value: string) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function generateCode() {
  return randomBytes(24).toString('base64url')
}

export async function createTelegramLinkCode(userId: string, botUsername: string) {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await db().from('telegram_link_codes').delete().eq('user_id', userId).is('used_at', null)

  const { error } = await db().from('telegram_link_codes').insert({
    code_hash: hash(code),
    user_id: userId,
    expires_at: expiresAt,
  })
  if (error) throw new Error(`Telegram link-code creation failed: ${error.message}`)

  return {
    code,
    expiresAt,
    deepLink: `https://t.me/${botUsername}?start=${encodeURIComponent(code)}`,
  }
}

export async function redeemTelegramLinkCode(
  code: string,
  chatId: number,
  telegramUserId: number,
  username?: string,
) {
  const { data, error } = await db().from('telegram_link_codes')
    .select('code_hash,user_id,expires_at,used_at')
    .eq('code_hash', hash(code))
    .maybeSingle()

  if (error) throw new Error(`Telegram link-code lookup failed: ${error.message}`)
  if (!data || data.used_at || new Date(data.expires_at).getTime() <= Date.now()) return null

  const { error: markUsedError } = await db().from('telegram_link_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code_hash', data.code_hash)
    .is('used_at', null)

  if (markUsedError) throw new Error(`Telegram link-code consume failed: ${markUsedError.message}`)

  const { error: connectionError } = await db().from('telegram_connections').upsert({
    user_id: data.user_id,
    chat_id: chatId,
    telegram_user_id: telegramUserId,
    telegram_username: username ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (connectionError) throw new Error(`Telegram connection save failed: ${connectionError.message}`)

  return { userId: data.user_id }
}

export async function claimTelegramUpdate(updateId: number) {
  const { error } = await db().from('telegram_updates').insert({ update_id: updateId })
  if (!error) return true
  if (error.code === '23505') return false
  throw new Error(`Telegram update dedupe failed: ${error.message}`)
}

export async function getTelegramConnectionByUserId(userId: string) {
  const { data, error } = await db().from('telegram_connections')
    .select('chat_id,telegram_user_id,telegram_username,connected_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(`Telegram connection read failed: ${error.message}`)
  return data
}

export async function getTelegramConnectionByChatId(chatId: number) {
  const { data, error } = await db().from('telegram_connections')
    .select('user_id,chat_id,telegram_user_id,telegram_username,connected_at,updated_at')
    .eq('chat_id', chatId)
    .maybeSingle()

  if (error) throw new Error(`Telegram connection lookup failed: ${error.message}`)
  return data
}

export async function deleteTelegramConnectionByUserId(userId: string) {
  const { error } = await db().from('telegram_connections').delete().eq('user_id', userId)
  if (error) throw new Error(`Telegram disconnect failed: ${error.message}`)
}

export function isTelegramPersistenceConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY)
}
