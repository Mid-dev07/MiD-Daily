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

function syncWorkerEnv() {
  for (const key of ENV_KEYS) {
    const value = (env as Record<string, unknown>)[key]
    if (typeof value === 'string') {
      process.env[key] = value
    }
  }
}

syncWorkerEnv()

await import('../src/server.js')

const fetchHandler = httpServerHandler({ port: 8787 })

export default {
  fetch: fetchHandler,
  async scheduled(controller: { scheduledTime: number }) {
    syncWorkerEnv()
    const { runBackgroundReminderDispatch } = await import('../src/backgroundReminders.js')
    await runBackgroundReminderDispatch(new Date(controller.scheduledTime))
  },
}
