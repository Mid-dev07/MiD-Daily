import { httpServerHandler } from 'cloudflare:node'
import { configureAssistantRuntime, type WorkersAiBinding } from '../src/ai/index.js'
import { server } from '../src/server.js'

server.listen(8787)
const handler = httpServerHandler({ port: 8787 })

type WorkerEnv = {
  AI: WorkersAiBinding
}

export default {
  ...handler,
  async fetch(...args: Parameters<typeof handler.fetch>) {
    const env = args[1] as WorkerEnv
    configureAssistantRuntime(env.AI)
    return handler.fetch(...args)
  },
  async scheduled(controller: { scheduledTime: number }) {
    const { runBackgroundReminderDispatch } = await import('../src/backgroundReminders.js')
    await runBackgroundReminderDispatch(new Date(controller.scheduledTime))
  },
}
