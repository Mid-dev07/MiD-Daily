import { httpServerHandler } from 'cloudflare:node'
import { server } from '../src/server.js'

export default {
  fetch: httpServerHandler(server),
  async scheduled(controller: { scheduledTime: number }) {
    const { runBackgroundReminderDispatch } = await import('../src/backgroundReminders.js')
    await runBackgroundReminderDispatch(new Date(controller.scheduledTime))
  },
}
