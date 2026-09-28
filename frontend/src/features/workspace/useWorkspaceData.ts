import { useEffect, useState } from 'react'
import { initialTasks, financeEntries } from '../../data/seed'
import { createRemoteTask, deleteRemoteTask, updateRemoteTask } from '../tasks/tasksApi'
import { normalizeTaskList } from '../tasks/task.migration'
import { validateTaskDraft } from '../tasks/task.validation'
import { createRemoteFinance, deleteRemoteFinance, updateRemoteFinance } from '../finance/financeApi'
import { createRemoteFinanceBudget, deleteRemoteFinanceBudget, updateRemoteFinanceBudget } from '../finance/financeBudgetApi'
import { normalizeFinanceList } from '../finance/finance.migration'
import { validateFinanceDraft } from '../finance/finance.validation'
import { initialScheduleItems } from '../schedule/schedule.data'
import { createRemoteSchedule, deleteRemoteSchedule, updateRemoteSchedule } from '../schedule/scheduleApi'
import { normalizeScheduleList } from '../schedule/schedule.migration'
import { loadWorkspaceBootstrap } from './workspaceApi'
import { useWorkspaceRealtime } from './useWorkspaceRealtime'
import { useReminderScheduler } from '../schedule/hooks/useReminderScheduler'
import { hasCompletedRemoteSync, markRemoteSyncComplete } from '../../lib/dataSync'
import { hasUserStorage, readUserStorage, writeUserStorage } from '../../lib/userStorage'
import type { FinanceBudget, FinanceBudgetDraft, FinanceDraft, FinanceEntry, Task, TaskDraft } from '../../types'
import type { ScheduleItem } from '../schedule/schedule.types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const FINANCE_STORAGE_KEY = 'mid-daily.finance'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'
const BUDGET_STORAGE_KEY = 'mid-daily.finance-budgets'

const reportError = (reason: unknown) => reason instanceof Error ? reason.message : 'Remote data sync failed.'

interface UseWorkspaceDataOptions {
  userId?: string
  onNotice?: (message: string) => void
}

export function useWorkspaceData({ userId, onNotice }: UseWorkspaceDataOptions = {}) {
  const workspaceScope = userId ?? 'demo'

  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, userId ? [] : initialTasks)))
  const [finance, setFinance] = useState<FinanceEntry[]>(() => normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, userId ? [] : financeEntries)))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, userId ? [] : initialScheduleItems)))
  const [budgets, setBudgets] = useState<FinanceBudget[]>(() => readUserStorage(BUDGET_STORAGE_KEY, userId, []))
  const [readyScope, setReadyScope] = useState('')

  useReminderScheduler(schedule)
  useWorkspaceRealtime(userId, readyScope === workspaceScope, setTasks, setFinance, setSchedule)

  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(TASK_STORAGE_KEY, userId, tasks)
  }, [tasks, workspaceScope, readyScope, userId])

  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(FINANCE_STORAGE_KEY, userId, finance)
  }, [finance, workspaceScope, readyScope, userId])

  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(SCHEDULE_STORAGE_KEY, userId, schedule)
  }, [schedule, workspaceScope, readyScope, userId])

  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(BUDGET_STORAGE_KEY, userId, budgets)
  }, [budgets, workspaceScope, readyScope, userId])

  useEffect(() => {
    setReadyScope('')

    if (!userId) {
      setTasks(normalizeTaskList(initialTasks))
      setFinance(normalizeFinanceList(financeEntries))
      setSchedule(normalizeScheduleList(initialScheduleItems))
      setBudgets([])
      setReadyScope('demo')
      return
    }

    setTasks(normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, [])))
    setFinance(normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, [])))
    setSchedule(normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, [])))
    setBudgets(readUserStorage(BUDGET_STORAGE_KEY, userId, []))
  }, [userId])

  useEffect(() => {
    if (!userId) return

    let active = true

    const hydrate = async () => {
      try {
        const remote = await loadWorkspaceBootstrap()
        const localTasks = normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, []))
        const localFinance = normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, []))
        const localSchedule = normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, []))

        const taskNeedsMigration = remote.tasks.length === 0
          && !hasCompletedRemoteSync(TASK_STORAGE_KEY, userId)
          && hasUserStorage(TASK_STORAGE_KEY, userId)
        const financeNeedsMigration = remote.finance.length === 0
          && !hasCompletedRemoteSync(FINANCE_STORAGE_KEY, userId)
          && hasUserStorage(FINANCE_STORAGE_KEY, userId)
        const scheduleNeedsMigration = remote.schedule.length === 0
          && !hasCompletedRemoteSync(SCHEDULE_STORAGE_KEY, userId)
          && hasUserStorage(SCHEDULE_STORAGE_KEY, userId)

        const [migratedTasks, migratedFinance, migratedSchedule] = await Promise.all([
          taskNeedsMigration ? Promise.all(localTasks.map((task) => createRemoteTask(task))) : Promise.resolve([]),
          financeNeedsMigration ? Promise.all(localFinance.map((entry) => createRemoteFinance(entry))) : Promise.resolve([]),
          scheduleNeedsMigration ? Promise.all(localSchedule.map((item) => createRemoteSchedule(item))) : Promise.resolve([]),
        ])

        if (!active) return

        setTasks(taskNeedsMigration ? normalizeTaskList(migratedTasks) : normalizeTaskList(remote.tasks))
        setFinance(financeNeedsMigration ? normalizeFinanceList(migratedFinance) : normalizeFinanceList(remote.finance))
        setSchedule(scheduleNeedsMigration ? normalizeScheduleList(migratedSchedule) : normalizeScheduleList(remote.schedule))
        setBudgets(remote.budgets ?? [])

        markRemoteSyncComplete(TASK_STORAGE_KEY, userId)
        markRemoteSyncComplete(FINANCE_STORAGE_KEY, userId)
        markRemoteSyncComplete(SCHEDULE_STORAGE_KEY, userId)
        setReadyScope(userId)
      } catch (reason) {
        if (!active) return
        setReadyScope(userId)
        onNotice?.(reportError(reason))
      }
    }

    void hydrate()
    return () => { active = false }
  }, [userId, onNotice])

  const toggleTask = async (id: number) => {
    const currentTask = tasks.find((task) => task.id === id)
    if (!currentTask) return

    const completed = currentTask.status === 'done'
    const next = {
      ...currentTask,
      status: completed ? 'todo' as const : 'done' as const,
      progress: completed ? Math.min(currentTask.progress ?? 0, 99) : 100,
    }

    try {
      if (userId) {
        const remote = await updateRemoteTask(id, { status: next.status, progress: next.progress })
        setTasks((items) => items.map((task) => task.id === id ? remote : task))
      } else {
        setTasks((items) => items.map((task) => task.id === id ? next : task))
      }
      onNotice?.(completed ? 'Task reopened' : 'Task completed')
    } catch (reason) {
      onNotice?.(reportError(reason))
    }
  }

  const saveTask = async (draft: TaskDraft, editingId?: number) => {
    const normalizedDraft: TaskDraft = {
      ...draft,
      title: draft.title.trim(),
      category: draft.category.trim(),
      notes: draft.notes?.trim() || undefined,
      dueDate: draft.dueDate || undefined,
      progress: draft.status === 'done' ? 100 : draft.progress,
    }
    const validation = validateTaskDraft(normalizedDraft, tasks, editingId)
    if (!validation.valid) return validation.message

    if (editingId) {
      if (!tasks.some((task) => task.id === editingId)) return 'Task not found.'
      const remoteDraft = { ...normalizedDraft, dueDate: normalizedDraft.dueDate ?? null, notes: normalizedDraft.notes ?? null }
      const existing = tasks.find((task) => task.id === editingId)
      const next = userId
        ? await updateRemoteTask(editingId, remoteDraft)
        : { ...existing!, ...normalizedDraft }
      setTasks((items) => items.map((task) => task.id === editingId ? next : task))
      onNotice?.('Task updated')
      return null
    }

    const next = userId
      ? await createRemoteTask(normalizedDraft)
      : { id: Date.now(), ...normalizedDraft }
    setTasks((items) => [...items, next])
    onNotice?.('Task added')
    return null
  }

  const deleteTask = async (id: number) => {
    try {
      if (userId) await deleteRemoteTask(id)
      setTasks((current) => current.filter((task) => task.id !== id))
      onNotice?.('Task deleted')
    } catch (reason) {
      onNotice?.(reportError(reason))
    }
  }

  const saveFinance = async (draft: FinanceDraft, editingId?: number) => {
    const normalizedDraft: FinanceDraft = {
      ...draft,
      title: draft.title.trim(),
      category: draft.category.trim(),
      amount: Math.abs(draft.amount),
      date: draft.date,
      notes: draft.notes?.trim() || undefined,
    }
    const validation = validateFinanceDraft(normalizedDraft, finance, editingId)
    if (!validation.valid) return validation.message

    if (editingId) {
      if (!finance.some((entry) => entry.id === editingId)) return 'Transaction not found.'
      const remoteDraft = { ...normalizedDraft, notes: normalizedDraft.notes ?? null }
      const existing = finance.find((entry) => entry.id === editingId)
      const next = userId
        ? await updateRemoteFinance(editingId, remoteDraft)
        : { ...existing!, ...normalizedDraft }
      setFinance((items) => items.map((entry) => entry.id === editingId ? next : entry))
      onNotice?.('Transaction updated')
      return null
    }

    const next = userId ? await createRemoteFinance(normalizedDraft) : { id: Date.now(), ...normalizedDraft }
    setFinance((items) => [...items, next])
    onNotice?.('Transaction added')
    return null
  }

  const deleteFinance = async (id: number) => {
    try {
      if (userId) await deleteRemoteFinance(id)
      setFinance((current) => current.filter((entry) => entry.id !== id))
      onNotice?.('Transaction deleted')
    } catch (reason) {
      onNotice?.(reportError(reason))
    }
  }

  const saveBudget = async (draft: FinanceBudgetDraft, editingId?: number) => {
    const normalized: FinanceBudgetDraft = {
      ...draft,
      name: draft.name.trim(),
      category: draft.category.trim(),
      amount: Math.abs(draft.amount),
      notes: draft.notes?.trim() || undefined,
      endsOn: draft.endsOn || undefined,
    }

    if (!normalized.name) return 'Budget name is required.'
    if (!Number.isFinite(normalized.amount) || normalized.amount <= 0) return 'Budget amount must be greater than zero.'
    if (!['WEEK', 'MONTH'].includes(normalized.period)) return 'Budget period is invalid.'

    if (editingId) {
      const existing = budgets.find((budget) => budget.id === editingId)
      const next = userId
        ? await updateRemoteFinanceBudget(editingId, normalized)
        : { ...existing!, ...normalized }
      setBudgets((items) => items.map((budget) => budget.id === editingId ? next : budget))
      onNotice?.('Budget updated')
      return null
    }

    const next = userId ? await createRemoteFinanceBudget(normalized) : { id: Date.now(), ...normalized }
    setBudgets((items) => [...items, next])
    onNotice?.('Budget added')
    return null
  }

  const deleteBudget = async (id: number) => {
    try {
      if (userId) await deleteRemoteFinanceBudget(id)
      setBudgets((current) => current.filter((budget) => budget.id !== id))
      onNotice?.('Budget deleted')
    } catch (reason) {
      onNotice?.(reportError(reason))
    }
  }

  const handleScheduleChange = async (next: ScheduleItem[]) => {
    if (!userId) {
      setSchedule(next)
      return
    }

    const currentById = new Map(schedule.map((item) => [item.id, item]))
    const nextById = new Map(next.map((item) => [item.id, item]))

    for (const item of schedule) {
      if (!nextById.has(item.id)) await deleteRemoteSchedule(item.id)
    }

    const resolved = [...next]
    for (let index = 0; index < resolved.length; index += 1) {
      const item = resolved[index]
      const previous = currentById.get(item.id)

      if (!previous) {
        resolved[index] = await createRemoteSchedule(item)
      } else if (JSON.stringify(previous) !== JSON.stringify(item)) {
        resolved[index] = await updateRemoteSchedule(item.id, item)
      }
    }

    setSchedule(normalizeScheduleList(resolved))
  }

  return {
    userId,
    tasks,
    finance,
    schedule,
    budgets,
    readyScope,
    toggleTask,
    saveTask,
    deleteTask,
    saveFinance,
    deleteFinance,
    saveBudget,
    deleteBudget,
    handleScheduleChange,
  }
}
