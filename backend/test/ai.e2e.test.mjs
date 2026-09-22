import test, { after } from 'node:test'
import assert from 'node:assert/strict'

process.env.SUPABASE_URL = ''
process.env.SUPABASE_SECRET_KEY = ''
process.env.COOKIE_SECURE = 'false'

const { server } = await import('../dist/server.js')
const { configureAssistantDataRuntime, configureAssistantRuntime } = await import('../dist/ai/assistant.js')

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolve)
})

const address = server.address()
if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.')
const baseUrl = 'http://127.0.0.1:' + address.port

after(async () => {
  configureAssistantRuntime(null)
  configureAssistantDataRuntime(null)
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('AI chat route completes a UI-shaped read tool round-trip', async () => {
  configureAssistantDataRuntime({
    listTasks: async () => [{
      id: 101,
      title: 'Finish AI E2E test',
      category: 'Engineering',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-09-22',
      progress: 50,
    }],
  })

  let aiCalls = 0
  configureAssistantRuntime({
    async run(model, input) {
      aiCalls += 1
      assert.equal(model, '@cf/zai-org/glm-4.7-flash')
      assert.ok(Array.isArray(input.messages))
      assert.ok(Array.isArray(input.tools))

      if (aiCalls === 1) {
        assert.ok((input.tools as Array<{ name: string }>).some((tool) => tool.name === 'get_open_tasks'))
        assert.ok(!(input.tools as Array<{ name: string }>).some((tool) => tool.name === 'create_task'))
        return {
          tool_calls: [{
            name: 'get_open_tasks',
            arguments: {},
          }],
        }
      }

      const messages = input.messages as Array<{ role?: string; content?: unknown }>
      assert.ok(messages.some((message) => message.role === 'tool'))
      return {
        response: 'You have one open task: Finish AI E2E test.',
      }
    },
  })

  const response = await fetch(baseUrl + '/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'assistant', content: 'Hi. I can read your MiD-Daily data.' },
        { role: 'user', content: 'What tasks do I still need to finish?' },
      ],
      allowWrites: false,
    }),
  })

  assert.equal(response.status, 200)
  const data = await response.json()

  assert.equal(data.text, 'You have one open task: Finish AI E2E test.')
  assert.deepEqual(data.actions, [{ tool: 'get_open_tasks', ok: true }])
  assert.equal(data.model, '@cf/zai-org/glm-4.7-flash')
  assert.equal(aiCalls, 2)
})

test('AI chat route completes a UI-shaped write tool round-trip only when actions are enabled', async () => {
  const tasks = []
  configureAssistantDataRuntime({
    listTasks: async () => tasks,
    createTask: async (_userId, task) => {
      const created = { id: 202, ...task }
      tasks.push(created)
      return created
    },
  })

  let aiCalls = 0
  configureAssistantRuntime({
    async run(_model, input) {
      aiCalls += 1
      const tools = input.tools as Array<{ name: string }>

      if (aiCalls === 1) {
        assert.ok(tools.some((tool) => tool.name === 'create_task'))
        return {
          tool_calls: [{
            name: 'create_task',
            arguments: {
              title: 'Review AI integration',
              category: 'Engineering',
              priority: 'medium',
              dueDate: null,
            },
          }],
        }
      }

      const messages = input.messages as Array<{ role?: string; content?: unknown }>
      const toolMessage = messages.find((message) => message.role === 'tool')
      assert.ok(toolMessage)
      assert.match(String(toolMessage?.content), /Review AI integration/)
      return {
        response: 'Created the task “Review AI integration”.',
      }
    },
  })

  const response = await fetch(baseUrl + '/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'assistant', content: 'Hi. Actions are available only when you enable them.' },
        { role: 'user', content: 'Create a task to review the AI integration.' },
      ],
      allowWrites: true,
    }),
  })

  assert.equal(response.status, 200)
  const data = await response.json()

  assert.equal(data.text, 'Created the task “Review AI integration”.')
  assert.deepEqual(data.actions, [{ tool: 'create_task', ok: true }])
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].title, 'Review AI integration')
  assert.equal(aiCalls, 2)
})
