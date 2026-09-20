import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Toast } from '../components/ui/Toast'
import { initialTasks, financeEntries } from '../data/seed'
import { DashboardView } from '../features/dashboard/DashboardView'
import { FinanceView } from '../features/finance/FinanceView'
import { ScheduleView } from '../features/schedule/ScheduleView'
import { TasksView } from '../features/tasks/TasksView'
import { normalizeTaskList } from '../features/tasks/task.migration'
import { validateTaskDraft } from '../features/tasks/task.validation'
import { listRemoteTasks, createRemoteTask, updateRemoteTask, deleteRemoteTask } from '../features/tasks/tasksApi'
import { normalizeFinanceList } from '../features/finance/finance.migration'
import { validateFinanceDraft } from '../features/finance/finance.validation'
import { listRemoteFinance, createRemoteFinance, updateRemoteFinance, deleteRemoteFinance } from '../features/finance/financeApi'
import { initialScheduleItems } from '../features/schedule/schedule.data'
import { normalizeScheduleList } from '../features/schedule/schedule.migration'
import { listRemoteSchedule, createRemoteSchedule, updateRemoteSchedule, deleteRemoteSchedule } from '../features/schedule/scheduleApi'
import { useReminderScheduler } from '../features/schedule/hooks/useReminderScheduler'
import { readUserStorage, writeUserStorage, hasUserStorage } from '../lib/userStorage'
import { hasCompletedRemoteSync, markRemoteSyncComplete } from '../lib/dataSync'
import { useAuth } from '../features/auth/AuthProvider'
import type { FinanceDraft, FinanceEntry, Task, TaskDraft, ScheduleItem, View } from '../types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const FINANCE_STORAGE_KEY = 'mid-daily.finance'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'

const reportError = (reason: unknown) => reason instanceof Error ? reason.message : 'Remote data sync failed.'

export function App() {
  const { user } = useAuth()
  const userId = user?.id
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, userId ? [] : initialTasks)))
  const [finance, setFinance] = useState<FinanceEntry[]>(() => normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, userId ? [] : financeEntries)))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, userId ? [] : initialScheduleItems)))
  const [toast, setToast] = useState('')

  useReminderScheduler(schedule)

  useEffect(() => writeUserStorage(TASK_STORAGE_KEY, userId, tasks), [tasks, userId])
  useEffect(() => writeUserStorage(FINANCE_STORAGE_KEY, userId, finance), [finance, userId])
  useEffect(() => writeUserStorage(SCHEDULE_STORAGE_KEY, userId, schedule), [schedule, userId])

  useEffect(() => {
    if (!userId) return
    let active = true

    const hydrateTasks = async () => {
      try {
        const remote = normalizeTaskList(await listRemoteTasks())
        const cacheExists = hasUserStorage(TASK_STORAGE_KEY, userId)

        if (remote.length > 0 || hasCompletedRemoteSync(TASK_STORAGE_KEY, userId)) {
          if (active) setTasks(remote)
        } else if (cacheExists && tasks.length > 0) {
          const migrated: Task[] = []
          for (const task of tasks) migrated.push(await createRemoteTask(task))
          if (active) setTasks(normalizeTaskList(migrated))
        } else if (active) {
          setTasks([])
        }
        markRemoteSyncComplete(TASK_STORAGE_KEY, userId)
      } catch (reason) {
        if (active) setToast('Tasks: ' + reportError(reason))
      }
    }

    const hydrateFinance = async () => {
      try {
        const remote = normalizeFinanceList(await listRemoteFinance())
        const cacheExists = hasUserStorage(FINANCE_STORAGE_KEY, userId)

        if (remote.length > 0 || hasCompletedRemoteSync(FINANCE_STORAGE_KEY, userId)) {
          if (active) setFinance(remote)
        } else if (cacheExists && finance.length > 0) {
          const migrated: FinanceEntry[] = []
          for (const entry of finance) migrated.push(await createRemoteFinance(entry))
          if (active) setFinance(normalizeFinanceList(migrated))
        } else if (active) {
          setFinance([])
        }
        markRemoteSyncComplete(FINANCE_STORAGE_KEY, userId)
      } catch (reason) {
        if (active) setToast('Finance: ' + reportError(reason))
      }
    }

    const hydrateSchedule = async () => {
      try {
        const remote = normalizeScheduleList(await listRemoteSchedule())
        const cacheExists = hasUserStorage(SCHEDULE_STORAGE_KEY, userId)

        if (remote.length > 0 || hasCompletedRemoteSync(SCHEDULE_STORAGE_KEY, userId)) {
          if (active) setSchedule(remote)
        } else if (cacheExists && schedule.length > 0) {
          const migrated: ScheduleItem[] = []
          for (const item of schedule) migrated.push(await createRemoteSchedule(item))
          if (active) setSchedule(normalizeScheduleList(migrated))
        } else if (active) {
          setSchedule([])
        }
        markRemoteSyncComplete(SCHEDULE_STORAGE_KEY, userId)
      } catch (reason) {
        if (active) setToast('Schedule: ' + reportError(reason))
      }
    }

    void hydrateTasks()
    void hydrateFinance()
    void hydrateSchedule()

    return () => { active = false }
  }, [userId])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const toggleTask = async (id: number) => {
    const currentTask = tasks.find((task) => task.id === id)
    if (!currentTask) return

    const completed = currentTask.status === 'done'
    const next = { ...currentTask, status: completed ? 'todo' as const : 'done' as const, progress: completed ? Math.min(currentTask.progress ?? 0, 99) : 100 }

    try {
      if (userId) {
        const remote = await updateRemoteTask(id, { status: next.status, progress: next.progress })
        setTasks((items) => items.map((task) => task.id === id ? remote : task))
      } else {
        setTasks((items) => items.map((task) => task.id === id ? next : task))
      }
      setToast(completed ? 'Task reopened' : 'Task completed')
    } catch (reason) {
      setToast(reportError(reason))
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
      const next = userId ? await updateRemoteTask(editingId, normalizedDraft) : { ...tasks.find((task) => task.id === editingId)!, ...normalizedDraft }
      setTasks((items) => items.map((task) => task.id === editingId ? next : task))
      setToast('Task updated')
    } else {
      const next = userId ? await createRemoteTask(normalizedDraft) : { id: Date.now(), ...normalizedDraft }
      setTasks((items) => [...items, next])
      setToast('Task added')
    }
    return null
  }

  const deleteTask = async (id: number) => {
    try {
      if (userId) await deleteRemoteTask(id)
      setTasks((current) => current.filter((task) => task.id !== id))
      setToast('Task deleted')
    } catch (reason) {
      setToast(reportError(reason))
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
      const next = userId ? await updateRemoteFinance(editingId, normalizedDraft) : { ...finance.find((entry) => entry.id === editingId)!, ...normalizedDraft }
      setFinance((items) => items.map((entry) => entry.id === editingId ? next : entry))
      setToast('Transaction updated')
    } else {
      const next = userId ? await createRemoteFinance(normalizedDraft) : { id: Date.now(), ...normalizedDraft }
      setFinance((items) => [...items, next])
      setToast('Transaction added')
    }
    return null
  }

  const deleteFinance = async (id: number) => {
    try {
      if (userId) await deleteRemoteFinance(id)
      setFinance((current) => current.filter((entry) => entry.id !== id))
      setToast('Transaction deleted')
    } catch (reason) {
      setToast(reportError(reason))
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

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-content">
        <Topbar view={activeView} />
        <div className="view-key">
          {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} finance={finance} onToggleTask={(id) => void toggleTask(id)} />}
          {activeView === 'schedule' && <ScheduleView schedule={schedule} onScheduleChange={handleScheduleChange} demoMode={!userId} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} onSaveTask={saveTask} onToggleTask={(id) => void toggleTask(id)} onDeleteTask={(id) => void deleteTask(id)} />}
          {activeView === 'finance' && <FinanceView finance={finance} onSaveFinance={saveFinance} onDeleteFinance={(id) => void deleteFinance(id)} />}
        </div>
      </main>
      {toast && <Toast message={toast} />}
    </div>
  )
}
