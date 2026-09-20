import OpenAI from 'openai'
import { toResponseInputItems } from 'openai/lib/responses/ResponseInputItems'
import type { ResponseInputItem } from 'openai/resources/responses/responses'
import { createFinance, createTask, listFinance, listTasks } from '../dataStore.js'
import { listSchedule } from '../scheduleStore.js'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? ''
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-5.6'
const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'Asia/Jakarta'
const MAX_TOOL_ROUNDS = 4
const MAX_ITEMS = 20

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ToolCall = {
  type: 'function_call'
  name: string
  arguments: string
  call_id: string
}

const baseTools = [
  {
    type: 'function' as const,
    name: 'get_today_schedule',
    description: 'Read up to 20 Schedule items for the user on the current date in the app timezone.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function' as const,
    name: 'get_open_tasks',
    description: 'Read up to 20 tasks that are not done, including title, category, priority, due date, and progress.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function' as const,
    name: 'get_expense_summary',
    description: 'Read finance totals for today: income, expenses, balance, and top expense categories.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
]

const writeTools = [
  {
    type: 'function' as const,
    name: 'create_task',
    description: 'Create a task for the authenticated user. Use only when the user explicitly asks to create/add a task.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title.' },
        category: { type: 'string', description: 'Short task category.' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        dueDate: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD or null.' },
      },
      required: ['title', 'category', 'priority', 'dueDate'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function' as const,
    name: 'create_expense',
    description: 'Create an expense for the authenticated user. Use only when the user explicitly asks to record an expense.',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Positive amount in the app currency.' },
        category: { type: 'string', description: 'Expense category.' },
        title: { type: 'string', description: 'Expense title.' },
        date: { type: ['string', 'null'], description: 'ISO date YYYY-MM-DD or null for today.' },
      },
      required: ['amount', 'category', 'title', 'date'],
      additionalProperties: false,
    },
    strict: true,
  },
]

export function buildAssistantTools(allowWrites: boolean) {
  return allowWrites ? [...baseTools, ...writeTools] : baseTools
}

function todayInTimeZone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return values.year + '-' + values.month + '-' + values.day
}

function assertString(value: unknown, field: string, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(field + ' is invalid.')
  return value.trim()
}

function assertOptionalDate(value: unknown, field: string) {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) throw new Error(field + ' is invalid.')
  return value
}

function assertPositiveAmount(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) throw new Error('Expense amount is invalid.')
  return amount
}

async function executeTool(userId: string, name: string, rawArguments: string) {
  let args: Record<string, unknown>
  try {
    args = JSON.parse(rawArguments) as Record<string, unknown>
  } catch {
    throw new Error('Tool arguments are invalid JSON.')
  }

  if (name === 'get_today_schedule') {
    const today = todayInTimeZone()
    const items = (await listSchedule(userId))
      .filter((item) => item.date === today)
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        title: item.title,
        type: item.type,
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location || null,
      }))
    return { date: today, items }
  }

  if (name === 'get_open_tasks') {
    const items = (await listTasks(userId))
      .filter((task) => task.status !== 'done')
      .slice(0, MAX_ITEMS)
      .map((task) => ({
        title: task.title,
        category: task.category,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ?? null,
        progress: task.progress,
      }))
    return { items }
  }

  if (name === 'get_expense_summary') {
    const today = todayInTimeZone()
    const entries = (await listFinance(userId)).filter((entry) => entry.date === today)
    const income = entries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0)
    const expenses = entries.filter((entry) => entry.type === 'expense')
    const expenseTotal = expenses.reduce((sum, entry) => sum + entry.amount, 0)
    const byCategory = new Map<string, number>()
    for (const entry of expenses) byCategory.set(entry.category, (byCategory.get(entry.category) ?? 0) + entry.amount)

    return {
      date: today,
      income,
      expenses: expenseTotal,
      balance: income - expenseTotal,
      topCategories: Array.from(byCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount })),
    }
  }

  if (name === 'create_task') {
    const title = assertString(args.title, 'Task title')
    const category = assertString(args.category, 'Task category', 100)
    const priority = assertString(args.priority, 'Task priority', 20) as 'low' | 'medium' | 'high'
    const dueDate = assertOptionalDate(args.dueDate, 'Task due date')

    return {
      created: await createTask(userId, {
        title,
        category,
        priority,
        status: 'todo',
        dueDate,
        progress: 0,
      }),
    }
  }

  if (name === 'create_expense') {
    const amount = assertPositiveAmount(args.amount)
    const category = assertString(args.category, 'Expense category', 100)
    const title = assertString(args.title, 'Expense title')
    const date = assertOptionalDate(args.date, 'Expense date') ?? todayInTimeZone()

    return {
      created: await createFinance(userId, {
        type: 'expense',
        amount,
        category,
        title,
        date,
      }),
    }
  }

  throw new Error('Unknown AI tool.')
}

function toolCallItems(value: unknown): ToolCall[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ToolCall =>
    Boolean(
      item &&
      typeof item === 'object' &&
      (item as Record<string, unknown>).type === 'function_call' &&
      typeof (item as Record<string, unknown>).name === 'string' &&
      typeof (item as Record<string, unknown>).arguments === 'string' &&
      typeof (item as Record<string, unknown>).call_id === 'string'
    ),
  )
}

export async function runAssistant(
  userId: string,
  messages: ChatMessage[],
  allowWrites: boolean,
) {
  if (!client) throw new Error('AI integration is not configured.')

  const sanitized = messages
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: assertString(message.content, 'Message', 4000),
    }))

  let input: ResponseInputItem[] = sanitized
  const tools = buildAssistantTools(allowWrites)
  const actions: Array<{ tool: string; ok: boolean }> = []

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      instructions: [
        'You are MiD-Daily Assistant.',
        'Use only the tools provided. Never claim data that was not returned by a tool.',
        'The authenticated user owns all tool data. Never ask for or invent a user id.',
        'Current app timezone: ' + APP_TIMEZONE + '.',
        allowWrites
          ? 'Write actions are enabled because the user explicitly allowed actions. Only create data when the user explicitly requests it.'
          : 'Write actions are disabled. Do not create or modify anything.',
      ].join(' '),
      input,
      tools,
      store: false,
    })

    const calls = toolCallItems(response.output)
    if (calls.length === 0) {
      return {
        text: response.output_text || 'I could not produce a response.',
        actions,
        model: OPENAI_MODEL,
      }
    }

    input.push(...toResponseInputItems(response.output))

    const actionResults: Array<Record<string, unknown>> = []
    for (const call of calls) {
      try {
        const result = await executeTool(userId, call.name, call.arguments)
        actionResults.push({ tool: call.name, ok: true })
        actions.push({ tool: call.name, ok: true })
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(result),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool failed.'
        actionResults.push({ tool: call.name, ok: false })
        actions.push({ tool: call.name, ok: false })
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify({ error: message }),
        })
      }
    }

    if (round === MAX_TOOL_ROUNDS - 1) {
      throw new Error('AI tool execution exceeded the safety limit.')
    }
  }

  throw new Error('AI request failed.')
}
