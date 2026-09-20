import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAssistantTools } from '../dist/ai/assistant.js'

test('AI exposes only read tools by default', () => {
  const tools = buildAssistantTools(false)
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ['get_today_schedule', 'get_open_tasks', 'get_expense_summary'],
  )
})

test('AI exposes write tools only when explicitly enabled', () => {
  const tools = buildAssistantTools(true)
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'get_today_schedule',
      'get_open_tasks',
      'get_expense_summary',
      'create_task',
      'create_expense',
    ],
  )
})

test('AI write schemas require explicit nullable date fields', () => {
  const tools = buildAssistantTools(true)
  const createTask = tools.find((tool) => tool.name === 'create_task')
  const createExpense = tools.find((tool) => tool.name === 'create_expense')

  assert.ok(createTask)
  assert.ok(createExpense)
  assert.deepEqual(createTask.parameters.required, ['title', 'category', 'priority', 'dueDate'])
  assert.deepEqual(createExpense.parameters.required, ['amount', 'category', 'title', 'date'])
})
