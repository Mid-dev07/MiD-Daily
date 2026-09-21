import { httpServerHandler } from 'cloudflare:node'
import { server } from '../src/server.js'

const fetchHandler = httpServerHandler(server)

async function fetchWithBoundary(request: Request) {
  try {
    return await fetchHandler(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Worker runtime error.'
    console.error('MiD-Daily Worker request failed:', error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }
}

export default {
  fetch: fetchWithBoundary,
  async scheduled(controller: { scheduledTime: number }) {
    const { runBackgroundReminderDispatch } = await import('../src/backgroundReminders.js')
    await runBackgroundReminderDispatch(new Date(controller.scheduledTime))
  },
}
