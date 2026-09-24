import { httpServerHandler } from 'cloudflare:node'
import { configureAssistantRuntime, type WorkersAiBinding } from '../src/ai/index.js'
import { refreshInstagramConnections } from '../src/integrations/instagramRefresh.js'
import { server } from '../src/server.js'

server.listen(8787)
const handler = httpServerHandler({ port: 8787 })

type WorkerEnv = {
  AI: WorkersAiBinding
  FRONTEND_URL?: string
}

export default {
  ...handler,
  async fetch(...args: Parameters<typeof handler.fetch>) {
    const request = args[0]
    const env = args[1] as WorkerEnv

    configureAssistantRuntime(env.AI)

    const url = new URL(request.url)
    if (request.method === 'GET' && url.pathname.startsWith('/api/security/password-range/')) {
      const hashPrefix = url.pathname.split('/').pop()?.trim().toUpperCase() ?? ''
      if (!/^[0-9A-F]{5}$/.test(hashPrefix)) {
        return new Response(JSON.stringify({ error: 'A valid 5-character SHA-1 hash prefix is required.' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      }

      const upstream = await fetch(`https://api.pwnedpasswords.com/range/${hashPrefix}`, {
        headers: {
          'User-Agent': 'MiD-Daily Password Security Check/1.0',
          'Add-Padding': 'true',
          Accept: 'text/plain',
        },
      })

      if (!upstream.ok) {
        return new Response(JSON.stringify({ error: 'Password security check is temporarily unavailable. Please try again.' }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
          },
        })
      }

      const origin = request.headers.get('Origin')
      const allowedOrigin = origin && origin === env.FRONTEND_URL ? origin : (env.FRONTEND_URL ?? '')
      const headers = new Headers({
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Vary': 'Origin',
      })
      if (allowedOrigin) headers.set('Access-Control-Allow-Origin', allowedOrigin)

      return new Response(JSON.stringify({ ok: true, suffixes: await upstream.text() }), { status: 200, headers })
    }

    return handler.fetch(...args)
  },
  async scheduled(controller: { scheduledTime: number }) {
    const scheduledAt = new Date(controller.scheduledTime)
    const { runBackgroundReminderDispatch } = await import('../src/backgroundReminders.js')
    await runBackgroundReminderDispatch(scheduledAt)

    if (scheduledAt.getUTCMinutes() === 0 && scheduledAt.getUTCHours() % 6 === 0) {
      await refreshInstagramConnections(scheduledAt)
    }
  },
}
