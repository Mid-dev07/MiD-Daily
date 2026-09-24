import { createFinance, createFinanceBudget, createTask, listFinance, listFinanceBudgets, listTasks, listHabits, listHabitLogs } from '../dataStore.js'
import { createSchedule, listSchedule, type ScheduleRecord } from '../scheduleStore.js'


const WORKERS_AI_MODEL = '@cf/zai-org/glm-4.7-flash'
import { todayInAppTimeZone } from '../time.js'

const MAX_TOOL_ROUNDS = 4
const MAX_ITEMS = 20

export interface WorkersAiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>
}

let assistantAi: WorkersAiBinding | null = null

type AssistantDataRuntime = {
  listTasks: typeof listTasks
  createTask: typeof createTask
  listFinance: typeof listFinance
  createFinance: typeof createFinance
  listFinanceBudgets: typeof listFinanceBudgets
  createFinanceBudget: typeof createFinanceBudget
  createSchedule: typeof createSchedule
  listSchedule: typeof listSchedule
  listHabits: typeof listHabits
  listHabitLogs: typeof listHabitLogs
}

const defaultAssistantDataRuntime: AssistantDataRuntime = {
  listTasks,
  createTask,
  listFinance,
  createFinance,
  listFinanceBudgets,
  createFinanceBudget,
  createSchedule,
  listSchedule,
  listHabits,
  listHabitLogs,
}

let assistantDataRuntime: AssistantDataRuntime = { ...defaultAssistantDataRuntime }

export function configureAssistantDataRuntime(runtime: Partial<AssistantDataRuntime> | null | undefined) {
  assistantDataRuntime = { ...defaultAssistantDataRuntime, ...(runtime ?? {}) }
}

export function configureAssistantRuntime(ai: WorkersAiBinding | null | undefined) {
  assistantAi = ai ?? null
}

export function isAssistantConfigured() {
  return Boolean(assistantAi)
}

export type AssistantMessage = {
  role: 'user' | 'assistant'
  content: string
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
    name: 'get_schedule_range',
    description: 'Read fixed activities for an ISO date range (maximum 14 days) and active flexible plans. Use this before suggesting free time.',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'ISO date YYYY-MM-DD.' },
        endDate: { type: 'string', description: 'ISO date YYYY-MM-DD, same or after startDate.' },
      },
      required: ['startDate', 'endDate'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function' as const,
    name: 'get_habits',
    description: 'Read active habits and their completion log for the last 7 days. Use this when the user asks about routines, habit consistency, or today habit progress.',
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
    name: 'get_active_budgets',
    description: 'Read active weekly and monthly finance budgets for the authenticated user.',
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
    name: 'create_activity',
    description: 'Create a schedule activity only when the user explicitly asks to add/create/save an activity. Supports fixed-time, flexible, and one-time plans.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Activity title.' },
        type: { type: 'string', enum: ['CLASS','WORK','MEETING','STUDY','PERSONAL','APPOINTMENT','EVENT','OTHER'] },
        mode: { type: 'string', enum: ['FIXED','FLEXIBLE','ONE_TIME'] },
        date: { type: 'string', description: 'Planning/activity date in YYYY-MM-DD.' },
        startTime: { type: ['string','null'], description: 'Fixed start time HH:MM, or null for flexible.' },
        endTime: { type: ['string','null'], description: 'Fixed end time HH:MM, or null for flexible.' },
        targetCount: { type: ['integer','null'], description: 'Flexible target count, or null.' },
        targetPeriod: { type: ['string','null'], description: 'Flexible target period DAY, WEEK, or MONTH, or null.' },
        durationMinutes: { type: ['integer','null'], description: 'Flexible session length in minutes, or null.' },
        preferredStartTime: { type: ['string','null'], description: 'Optional preferred window start HH:MM.' },
        preferredEndTime: { type: ['string','null'], description: 'Optional preferred window end HH:MM.' },
        activityDeadline: { type: ['string','null'], description: 'Optional flexible deadline YYYY-MM-DD.' },
        recurrenceFrequency: { type: 'string', enum: ['NONE','DAILY','WEEKLY','MONTHLY'] },
        recurrenceInterval: { type: 'integer', description: 'Repeat interval from 1 to 30.' },
        recurrenceUntil: { type: ['string','null'], description: 'Optional repeat end date YYYY-MM-DD.' },
        location: { type: ['string','null'], description: 'Optional location.' },
        notes: { type: ['string','null'], description: 'Optional notes.' },
      },
      required: ['title','type','mode','date','startTime','endTime','targetCount','targetPeriod','durationMinutes','preferredStartTime','preferredEndTime','activityDeadline','recurrenceFrequency','recurrenceInterval','recurrenceUntil','location','notes'],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: 'function' as const,
    name: 'create_budget',
    description: 'Create a weekly or monthly budget only when the user explicitly asks to add/set/create a budget.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Budget name.' },
        category: { type: 'string', description: 'Category to track, or empty string for all expenses.' },
        amount: { type: 'number', description: 'Positive budget amount.' },
        period: { type: 'string', enum: ['WEEK','MONTH'] },
        startsOn: { type: 'string', description: 'ISO start date YYYY-MM-DD.' },
        endsOn: { type: ['string','null'], description: 'Optional ISO end date YYYY-MM-DD.' },
        notes: { type: ['string','null'], description: 'Optional notes.' },
      },
      required: ['name','category','amount','period','startsOn','endsOn','notes'],
      additionalProperties: false,
    },
    strict: true,
  },

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
  return todayInAppTimeZone()
}

function assertString(value: unknown, field: string, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(field + ' is invalid.')
  return value.trim()
}

function assertOptionalDate(value: unknown, field: string) {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(field + ' is invalid.')
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.toISOString().slice(0, 10) !== value) throw new Error(field + ' is invalid.')
  return value
}

function optionalText(value: unknown, field: string, max = 500) {
  if (value === null || value === undefined || value === '') return ''
  return assertString(value, field, max)
}

function assertPositiveAmount(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) throw new Error('Expense amount is invalid.')
  return amount
}

function scheduleOccursOnDate(
  item: Pick<ScheduleRecord, 'date' | 'recurrence' | 'activityMode'>,
  targetDate: string,
) {
  if (item.activityMode === 'FLEXIBLE' || targetDate < item.date) return false
  if (item.recurrence.frequency === 'NONE') return targetDate === item.date
  if (item.recurrence.until && targetDate > item.recurrence.until) return false

  const start = new Date(item.date + 'T00:00:00Z')
  const target = new Date(targetDate + 'T00:00:00Z')
  const interval = Math.max(1, item.recurrence.interval)

  if (item.recurrence.frequency === 'DAILY') {
    const days = Math.round((target.getTime() - start.getTime()) / 86_400_000)
    return days >= 0 && days % interval === 0
  }

  if (item.recurrence.frequency === 'WEEKLY') {
    const days = Math.round((target.getTime() - start.getTime()) / 86_400_000)
    return days >= 0 && days % (7 * interval) === 0
  }

  const months = (target.getUTCFullYear() - start.getUTCFullYear()) * 12 + (target.getUTCMonth() - start.getUTCMonth())
  if (months < 0 || months % interval !== 0) return false

  const occurrence = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  occurrence.setUTCMonth(occurrence.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(occurrence.getUTCFullYear(), occurrence.getUTCMonth() + 1, 0)).getUTCDate()
  occurrence.setUTCDate(Math.min(start.getUTCDate(), lastDay))
  return occurrence.toISOString().slice(0, 10) === targetDate
}

function scheduleTimeMinutes(value: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('Schedule time is invalid.')
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function hasScheduleConflict(
  items: ScheduleRecord[],
  candidate: { date: string; startTime: string; endTime: string },
) {
  const start = scheduleTimeMinutes(candidate.startTime)
  const end = scheduleTimeMinutes(candidate.endTime)
  return items.some((item) =>
    item.activityMode !== 'FLEXIBLE' &&
    item.startTime &&
    item.endTime &&
    scheduleOccursOnDate(item, candidate.date) &&
    start < scheduleTimeMinutes(item.endTime) &&
    end > scheduleTimeMinutes(item.startTime),
  )
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
    const items = (await assistantDataRuntime.listSchedule(userId))
      .filter((item) => scheduleOccursOnDate(item, today))
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

  if (name === 'get_schedule_range') {
    const startDate = assertOptionalDate(args.startDate, 'Schedule range start') ?? todayInTimeZone()
    const endDate = assertOptionalDate(args.endDate, 'Schedule range end') ?? startDate
    const start = new Date(startDate + 'T00:00:00Z').getTime()
    const end = new Date(endDate + 'T00:00:00Z').getTime()
    if (end < start) throw new Error('Schedule range end cannot be before start.')
    if ((end - start) / 86_400_000 > 13) throw new Error('Schedule range cannot exceed 14 days.')

    const all = await assistantDataRuntime.listSchedule(userId)
    const fixed: Array<{
      date: string
      title: string
      type: ScheduleRecord['type']
      startTime: string
      endTime: string
      location: string | null
    }> = []

    for (let cursor = start; cursor <= end && fixed.length < MAX_ITEMS; cursor += 86_400_000) {
      const date = new Date(cursor).toISOString().slice(0, 10)
      for (const item of all) {
        if (!scheduleOccursOnDate(item, date) || item.activityMode === 'FLEXIBLE') continue
        fixed.push({
          date,
          title: item.title,
          type: item.type,
          startTime: item.startTime,
          endTime: item.endTime,
          location: item.location || null,
        })
        if (fixed.length >= MAX_ITEMS) break
      }
    }
    fixed.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    const flexible = all
      .filter((item) => item.activityMode === 'FLEXIBLE' && item.date <= endDate && (!item.activityDeadline || item.activityDeadline >= startDate))
      .slice(0, MAX_ITEMS)
      .map((item) => ({
        title: item.title,
        date: item.date,
        targetCount: item.targetCount ?? null,
        targetPeriod: item.targetPeriod ?? null,
        durationMinutes: item.durationMinutes ?? null,
        preferredStartTime: item.preferredStartTime ?? null,
        preferredEndTime: item.preferredEndTime ?? null,
        deadline: item.activityDeadline ?? null,
      }))
    return { startDate, endDate, fixed, flexible }
  }

  if (name === 'get_habits') {
    const today = todayInTimeZone()
    const startDate = new Date(today + 'T00:00:00Z')
    startDate.setUTCDate(startDate.getUTCDate() - 6)
    const start = startDate.toISOString().slice(0, 10)
    const [habits, logs] = await Promise.all([
      assistantDataRuntime.listHabits(userId),
      assistantDataRuntime.listHabitLogs(userId, start, today),
    ])
    const logMap = new Map<number, string[]>()
    for (const log of logs) {
      const dates = logMap.get(log.habitId) ?? []
      dates.push(log.date)
      logMap.set(log.habitId, dates)
    }
    return {
      startDate: start,
      endDate: today,
      items: habits.slice(0, MAX_ITEMS).map((habit) => ({
        name: habit.name,
        targetDays: habit.targetDays,
        completedDates: logMap.get(habit.id) ?? [],
      })),
    }
  }

  if (name === 'get_active_budgets') {
    const today = todayInTimeZone()
    const items = (await assistantDataRuntime.listFinanceBudgets(userId))
      .filter((budget) => budget.startsOn <= today && (!budget.endsOn || budget.endsOn >= today))
      .slice(0, MAX_ITEMS)
      .map((budget) => ({
        name: budget.name,
        category: budget.category || null,
        amount: budget.amount,
        period: budget.period,
        startsOn: budget.startsOn,
        endsOn: budget.endsOn ?? null,
      }))
    return { date: today, items }
  }

  if (name === 'get_open_tasks') {
    const items = (await assistantDataRuntime.listTasks(userId))
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
    const entries = (await assistantDataRuntime.listFinance(userId)).filter((entry) => entry.date === today)
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

  if (name === 'create_activity') {
    const title = assertString(args.title, 'Activity title')
    const type = assertString(args.type, 'Activity type', 20) as ScheduleRecord['type']
    const mode = assertString(args.mode, 'Activity mode', 20) as ScheduleRecord['activityMode']
    const date = assertOptionalDate(args.date, 'Activity date')
    if (!date) throw new Error('Activity date is required.')
    if (!['CLASS','WORK','MEETING','STUDY','PERSONAL','APPOINTMENT','EVENT','OTHER'].includes(type)) throw new Error('Activity type is invalid.')
    if (!['FIXED','FLEXIBLE','ONE_TIME'].includes(mode)) throw new Error('Activity mode is invalid.')

    const startTime = args.startTime === null ? '' : assertString(args.startTime, 'Activity start time', 5)
    const endTime = args.endTime === null ? '' : assertString(args.endTime, 'Activity end time', 5)
    const location = optionalText(args.location, 'Activity location', 200)
    const notes = optionalText(args.notes, 'Activity notes', 5000)

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
    if (mode !== 'FLEXIBLE') {
      if (!timePattern.test(startTime) || !timePattern.test(endTime)) throw new Error('Fixed activities require valid start and end times.')
      if (startTime >= endTime) throw new Error('Activity end time must be after start time.')
      const existing = await assistantDataRuntime.listSchedule(userId)
      if (hasScheduleConflict(existing, { date, startTime, endTime })) {
        throw new Error('This time overlaps another activity.')
      }
    }

    const targetCount = args.targetCount === null ? null : Number(args.targetCount)
    const targetPeriod = args.targetPeriod === null ? null : String(args.targetPeriod) as ScheduleRecord['targetPeriod']
    const durationMinutes = args.durationMinutes === null ? null : Number(args.durationMinutes)
    const preferredStartTime = args.preferredStartTime === null ? null : assertString(args.preferredStartTime, 'Preferred start time', 5)
    const preferredEndTime = args.preferredEndTime === null ? null : assertString(args.preferredEndTime, 'Preferred end time', 5)
    const activityDeadline = args.activityDeadline === null ? null : assertOptionalDate(args.activityDeadline, 'Activity deadline') ?? null
    const recurrenceFrequency = assertString(args.recurrenceFrequency, 'Recurrence frequency', 10) as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
    const recurrenceInterval = Number(args.recurrenceInterval)
    const recurrenceUntil = args.recurrenceUntil === null ? null : assertOptionalDate(args.recurrenceUntil, 'Recurrence end') ?? null

    if (!['NONE','DAILY','WEEKLY','MONTHLY'].includes(recurrenceFrequency)) throw new Error('Recurrence frequency is invalid.')
    if (!Number.isInteger(recurrenceInterval) || recurrenceInterval < 1 || recurrenceInterval > 30) throw new Error('Recurrence interval is invalid.')
    if (recurrenceUntil && recurrenceUntil < date) throw new Error('Recurrence end cannot be before the activity date.')
    if (mode === 'FLEXIBLE' && recurrenceFrequency !== 'NONE') throw new Error('Flexible activities cannot use recurrence.')

    if (mode === 'FLEXIBLE') {
      if (targetCount === null) throw new Error('Flexible target count is invalid.')
      if (!Number.isInteger(targetCount)) throw new Error('Flexible target count is invalid.')
      if (targetCount < 1 || targetCount > 100) throw new Error('Flexible target count is invalid.')
      if (!targetPeriod || !['DAY','WEEK','MONTH'].includes(targetPeriod)) throw new Error('Flexible target period is invalid.')
      if (durationMinutes === null) throw new Error('Flexible duration is invalid.')
      if (!Number.isInteger(durationMinutes)) throw new Error('Flexible duration is invalid.')
      if (durationMinutes < 5 || durationMinutes > 1440) throw new Error('Flexible duration is invalid.')
      if ((preferredStartTime === null) !== (preferredEndTime === null)) throw new Error('Preferred time window requires both start and end.')
      if (preferredStartTime && preferredEndTime && (!timePattern.test(preferredStartTime) || !timePattern.test(preferredEndTime) || preferredStartTime >= preferredEndTime)) throw new Error('Preferred time window is invalid.')
      if (activityDeadline && activityDeadline < date) throw new Error('Activity deadline cannot be before the planning date.')
    }

    const persistedTargetCount = mode === 'FLEXIBLE' ? Number(targetCount) : targetCount
    const persistedDurationMinutes = mode === 'FLEXIBLE' ? Number(durationMinutes) : durationMinutes

    return {
      created: await assistantDataRuntime.createSchedule(userId, {
        title,
        type,
        activityMode: mode,
        date,
        startTime: mode === 'FLEXIBLE' ? '' : startTime,
        endTime: mode === 'FLEXIBLE' ? '' : endTime,
        location,
        notes,
        reminderEnabled: false,
        reminderOffset: 0,
        recurrence: {
          frequency: mode === 'FLEXIBLE' ? 'NONE' : recurrenceFrequency,
          interval: mode === 'FLEXIBLE' ? 1 : recurrenceInterval,
          ...(mode === 'FLEXIBLE' || !recurrenceUntil ? {} : { until: recurrenceUntil }),
        },
        targetCount: persistedTargetCount,
        targetPeriod,
        durationMinutes: persistedDurationMinutes,
        preferredStartTime,
        preferredEndTime,
        activityDeadline,
        googleCalendar: { status: 'not-synced', calendarId: 'primary' },
      }),
    }
  }

  if (name === 'create_budget') {
    const nameValue = assertString(args.name, 'Budget name', 200)
    const category = typeof args.category === 'string' ? args.category.trim().slice(0, 100) : ''
    const amount = assertPositiveAmount(args.amount)
    const period = assertString(args.period, 'Budget period', 10) as 'WEEK' | 'MONTH'
    const startsOn = assertOptionalDate(args.startsOn, 'Budget start') 
    const endsOn = args.endsOn === null ? null : assertOptionalDate(args.endsOn, 'Budget end') ?? null
    const notes = args.notes === null || args.notes === '' ? null : assertString(args.notes, 'Budget notes', 5000)

    if (!startsOn) throw new Error('Budget start date is required.')
    if (!['WEEK','MONTH'].includes(period)) throw new Error('Budget period is invalid.')
    if (endsOn && endsOn < startsOn) throw new Error('Budget end date cannot be before start date.')

    return {
      created: await assistantDataRuntime.createFinanceBudget(userId, {
        name: nameValue,
        category,
        amount,
        period,
        startsOn,
        endsOn,
        notes,
      }),
    }
  }

  if (name === 'create_task') {
    const title = assertString(args.title, 'Task title')
    const category = assertString(args.category, 'Task category', 100)
    const priority = assertString(args.priority, 'Task priority', 20) as 'low' | 'medium' | 'high'
    const dueDate = assertOptionalDate(args.dueDate, 'Task due date')

    return {
      created: await assistantDataRuntime.createTask(userId, {
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
      created: await assistantDataRuntime.createFinance(userId, {
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

type WorkersAiToolCall = {
  id: string
  name: string
  arguments: Record<string, unknown>
}

type WorkersAiResponse = {
  response?: unknown
  choices?: Array<{
    message?: {
      content?: unknown
      tool_calls?: unknown
    }
  }>
  tool_calls?: unknown
}

function assistantResponseText(value: unknown) {
  if (!value || typeof value !== 'object') return ''
  const response = value as WorkersAiResponse

  const candidates = [
    response.response,
    Array.isArray(response.choices) ? response.choices[0]?.message?.content : undefined,
  ]

  for (const content of candidates) {
    if (typeof content === 'string' && content.trim()) return content
    if (Array.isArray(content)) {
      const textParts = content
        .filter((part) => part && typeof part === 'object' && typeof (part as Record<string, unknown>).text === 'string')
        .map((part) => String((part as Record<string, unknown>).text))
      if (textParts.length > 0) return textParts.join('')
    }
  }

  return ''
}

function assistantToolCalls(value: unknown): WorkersAiToolCall[] {
  if (!value || typeof value !== 'object') return []
  const response = value as WorkersAiResponse
  const firstMessage = Array.isArray(response.choices) ? response.choices[0]?.message : undefined
  const rawCalls = response.tool_calls ?? firstMessage?.tool_calls
  if (!Array.isArray(rawCalls)) return []

  const calls: WorkersAiToolCall[] = []
  for (let index = 0; index < rawCalls.length; index += 1) {
    const raw = rawCalls[index]
    if (!raw || typeof raw !== 'object') continue

    const item = raw as Record<string, unknown>
    const nestedFunction = item.function && typeof item.function === 'object'
      ? item.function as Record<string, unknown>
      : null
    const nameValue = typeof item.name === 'string'
      ? item.name
      : typeof nestedFunction?.name === 'string'
        ? nestedFunction.name
        : ''
    const argumentsValue = item.arguments ?? nestedFunction?.arguments
    if (!nameValue || argumentsValue === undefined) continue

    let parsedArguments: Record<string, unknown> | null = null
    if (argumentsValue && typeof argumentsValue === 'object' && !Array.isArray(argumentsValue)) {
      parsedArguments = argumentsValue as Record<string, unknown>
    } else if (typeof argumentsValue === 'string') {
      try {
        const parsed = JSON.parse(argumentsValue) as unknown
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          parsedArguments = parsed as Record<string, unknown>
        }
      } catch {
        continue
      }
    }

    if (!parsedArguments) continue

    const id = typeof item.id === 'string' && item.id.trim()
      ? item.id
      : `call_${index + 1}`

    calls.push({
      id,
      name: nameValue,
      arguments: parsedArguments,
    })
  }

  return calls
}

function workersAiTools(allowWrites: boolean) {
  // GLM-4.7-Flash expects OpenAI-compatible wrapped function definitions
  // when tools are passed through the Workers AI binding.
  return buildAssistantTools(allowWrites).map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }))
}

async function runWorkersAi(
  ai: WorkersAiBinding,
  userId: string,
  messages: AssistantMessage[],
  allowWrites: boolean,
) {
  const actions: Array<{ tool: string; ok: boolean }> = []
  const systemMessage = [
    'You are MiD-Daily Assistant.',
    'Use only the tools provided. Never claim data that was not returned by a tool.',
    'The authenticated user owns all tool data. Never ask for or invent a user id.',
    'Current app timezone: ' + APP_TIMEZONE + '.',
    'Current date in the app timezone: ' + todayInTimeZone() + '.',
    'When creating an activity, inspect the relevant schedule range first so you do not silently create a time conflict.',
    'Do not claim a time slot is free unless the schedule range tool was checked for that date.',
    allowWrites
      ? 'Write actions are enabled because the user explicitly allowed actions. Only create data when the user explicitly requests it.'
      : 'Write actions are disabled. Do not create or modify anything.',
    'Answer in the same language as the user when practical.',
  ].join(' ')

  const modelMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemMessage },
    ...messages,
  ]
  const tools = workersAiTools(allowWrites)

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const rawResponse = await ai.run(WORKERS_AI_MODEL, {
      // Keep the Workers AI binding payload deliberately minimal. The
      // documented traditional function-calling contract only requires
      // messages and tools; optional OpenAI-compatibility fields can be
      // model-specific and may trigger 8001 validation errors.
      messages: modelMessages,
      tools,
    })

    const calls = assistantToolCalls(rawResponse)
    if (calls.length === 0) {
      return {
        text: assistantResponseText(rawResponse) || 'I could not produce a response.',
        actions,
        model: WORKERS_AI_MODEL,
      }
    }

    modelMessages.push({
      role: 'assistant',
      content: null,
      tool_calls: calls.map((call) => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      })),
    })

    for (const call of calls) {
      try {
        const result = await executeTool(userId, call.name, JSON.stringify(call.arguments))
        actions.push({ tool: call.name, ok: true })
        modelMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.name,
          content: JSON.stringify(result),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Tool failed.'
        actions.push({ tool: call.name, ok: false })
        modelMessages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.name,
          content: JSON.stringify({ error: message }),
        })
      }
    }

    if (round === MAX_TOOL_ROUNDS - 1) {
      throw new Error('AI tool execution exceeded the safety limit.')
    }
  }

  throw new Error('AI request failed.')
}

export async function runAssistant(
  userId: string,
  messages: AssistantMessage[],
  allowWrites: boolean,
) {
  if (!assistantAi) throw new Error('AI integration is not configured.')

  const sanitized = messages
    .slice(-10)
    .map((message) => ({
      role: message.role,
      content: assertString(message.content, 'Message', 4000),
    }))

  return runWorkersAi(assistantAi, userId, sanitized, allowWrites)
}
