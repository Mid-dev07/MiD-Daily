import { httpServerHandler } from 'cloudflare:node'
import { env } from 'cloudflare:workers'
import * as process from 'node:process'

const ENV_KEYS = [
  'PORT',
  'FRONTEND_URL',
  'COOKIE_SECURE',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'TOKEN_ENCRYPTION_KEY_B64',
  'APP_TIMEZONE',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_BOT_USERNAME',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_WEBHOOK_URL',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_GRAPH_VERSION',
  'WHATSAPP_APP_SECRET',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_BUSINESS_PHONE_NUMBER',
  'INSTAGRAM_ACCESS_TOKEN',
  'INSTAGRAM_GRAPH_VERSION',
  'INSTAGRAM_ACCOUNT_ID',
  'INSTAGRAM_GRAPH_HOST',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
] as const

function hasBinding(key: string) {
  return typeof (env as Record<string, unknown>)[key] === 'string'
    && String((env as Record<string, unknown>)[key]).length > 0
}

for (const key of ENV_KEYS) {
  const value = (env as Record<string, unknown>)[key]
  if (typeof value === 'string') {
    process.env[key] = value
  }
}

await import('../src/server.js')

const nodeHandler = httpServerHandler({ port: 8787 })

export default {
  async fetch(request: Request, requestEnv: unknown, ctx: ExecutionContext) {
    const url = new URL(request.url)

    // Safe diagnostics: report only whether bindings exist, never their values.
    if (url.pathname === '/__config-check') {
      const keys = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'TOKEN_ENCRYPTION_KEY_B64', 'FRONTEND_URL', 'COOKIE_SECURE', 'APP_TIMEZONE']
      const bindings: Record<string, boolean> = {}
      const processValues: Record<string, boolean> = {}

      for (const key of keys) {
        bindings[key] = hasBinding(key)
        processValues[key] = typeof process.env[key] === 'string' && process.env[key].length > 0
      }

      return Response.json({
        ok: true,
        bindings,
        processEnv: processValues,
      })
    }

    return nodeHandler.fetch(request, requestEnv, ctx)
  },
}
