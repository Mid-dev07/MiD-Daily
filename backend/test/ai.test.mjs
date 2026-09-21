import test from 'node:test'
import assert from 'node:assert/strict'
import { buildAssistantTools, hasScheduleConflict } from '../dist/ai/assistant.js'

test('AI exposes only read tools by default', () => {
  const tools = buildAssistantTools(false)
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ['get_today_schedule', 'get_schedule_range', 'get_active_budgets', 'get_open_tasks', 'get_expense_summary'],
  )
})

test('AI exposes write tools only when explicitly enabled', () => {
  const tools = buildAssistantTools(true)
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'get_today_schedule',
      'get_schedule_range',
      'get_active_budgets',
      'get_open_tasks',
      'get_expense_summary',
      'create_activity',
      'create_budget',
      'create_task',
      'create_expense',
    ],
  )
})

test('AI write schemas require complete strict argument sets', () => {
  const tools = buildAssistantTools(true)
  const createActivity = tools.find((tool) => tool.name === 'create_activity')
  const createBudget = tools.find((tool) => tool.name === 'create_budget')
  const createTask = tools.find((tool) => tool.name === 'create_task')
  const createExpense = tools.find((tool) => tool.name === 'create_expense')

  assert.ok(createActivity)
  assert.ok(createBudget)
  assert.ok(createTask)
  assert.ok(createExpense)

  assert.deepEqual(createActivity.parameters.required, [
    'title',
    'type',
    'mode',
    'date',
    'startTime',
    'endTime',
    'targetCount',
    'targetPeriod',
    'durationMinutes',
    'preferredStartTime',
    'preferredEndTime',
    'activityDeadline',
    'location',
    'notes',
  ])
  assert.deepEqual(createBudget.parameters.required, ['name', 'category', 'amount', 'period', 'startsOn', 'endsOn', 'notes'])
  assert.deepEqual(createTask.parameters.required, ['title', 'category', 'priority', 'dueDate'])
  assert.deepEqual(createExpense.parameters.required, ['amount', 'category', 'title', 'date'])
})

test('read tools stay available without write permission', () => {
  const readOnly = buildAssistantTools(false).map((tool) => tool.name)
  assert.ok(readOnly.includes('get_schedule_range'))
  assert.ok(readOnly.includes('get_active_budgets'))
  assert.ok(!readOnly.includes('create_activity'))
  assert.ok(!readOnly.includes('create_budget'))
})

test('AI schedule conflict guard catches overlapping fixed activities and ignores flexible plans', () => {
  const items = [
    {
      id: 1,
      title: 'Class',
      type: 'CLASS',
      activityMode: 'ONE_TIME',
      date: '2026-09-22',
      startTime: '14:00',
      endTime: '16:00',
      recurrence: { frequency: 'NONE', interval: 1 },
    },
    {
      id: 2,
      title: 'Flexible AI study',
      type: 'STUDY',
      activityMode: 'FLEXIBLE',
      date: '2026-09-22',
      startTime: '',
      endTime: '',
      recurrence: { frequency: 'NONE', interval: 1 },
    },
  ]

  assert.equal(hasScheduleConflict(items, { date: '2026-09-22', startTime: '15:00', endTime: '15:30' }), true)
  assert.equal(hasScheduleConflict(items, { date: '2026-09-22', startTime: '16:00', endTime: '16:30' }), false)
})
