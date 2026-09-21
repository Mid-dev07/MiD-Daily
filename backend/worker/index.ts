import { httpServerHandler } from 'cloudflare:node'
import { server } from '../src/server.js'

server.listen(8787)
const handler = httpServerHandler({ port: 8787 })

export default {
  ...handler,
  async scheduled(controller: { scheduledTime: number }) {
    const { runBackgroundReminderDispatch } = await import('../src/backgroundReminders.js')
    await runBackgroundReminderDispatch(new Date(controller.scheduledTime))
  },
}
