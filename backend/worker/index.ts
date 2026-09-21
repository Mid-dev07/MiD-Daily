import { httpServerHandler } from 'cloudflare:node'
import { env } from 'cloudflare:workers'
import * as process from 'node:process'

// The existing backend is written for Node.js and reads configuration from
// process.env at module load time. Cloudflare Workers exposes dashboard
// variables/secrets through the Worker env binding, so bridge the configured
// values before loading the Node server.
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

for (const key of ENV_KEYS) {
  const value = env[key as keyof typeof env]
  if (typeof value === 'string') {
    process.env[key] = value
  }
}

// Import the existing Node HTTP server only after process.env has been
// populated from Cloudflare bindings.
await import('../src/server.js')

export default httpServerHandler({ port: 8787 })
