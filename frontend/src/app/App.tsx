import { lazy, Suspense, useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Toast } from '../components/ui/Toast'
import { initialTasks, financeEntries } from '../data/seed'

const DashboardView = lazy(() => import('../features/dashboard/DashboardView').then((module) => ({ default: module.DashboardView })))
const FinanceView = lazy(() => import('../features/finance/FinanceView').then((module) => ({ default: module.FinanceView })))
const ScheduleView = lazy(() => import('../features/schedule/ScheduleView').then((module) => ({ default: module.ScheduleView })))
const TasksView = lazy(() => import('../features/tasks/TasksView').then((module) => ({ default: module.TasksView })))
const SocialAnalyticsView = lazy(() => import('../features/social/SocialAnalyticsView').then((module) => ({ default: module.SocialAnalyticsView })))
const AssistantView = lazy(() => import('../features/ai/AssistantView').then((module) => ({ default: module.AssistantView })))
import { normalizeTaskList } from '../features/tasks/task.migration'
import { validateTaskDraft } from '../features/tasks/task.validation'
import { createRemoteTask, updateRemoteTask, deleteRemoteTask } from '../features/tasks/tasksApi'
import { normalizeFinanceList } from '../features/finance/finance.migration'
import { validateFinanceDraft } from '../features/finance/finance.validation'
import { createRemoteFinance, updateRemoteFinance, deleteRemoteFinance } from '../features/finance/financeApi'
import { initialScheduleItems } from '../features/schedule/schedule.data'
import { loadWorkspaceBootstrap } from '../features/workspace/workspaceApi'
import { normalizeScheduleList } from '../features/schedule/schedule.migration'
import { createRemoteSchedule, updateRemoteSchedule, deleteRemoteSchedule } from '../features/schedule/scheduleApi'
import { useReminderScheduler } from '../features/schedule/hooks/useReminderScheduler'
import { registerBrowserServiceWorker } from '../integrations/notifications/serviceWorker'
import { readUserStorage, writeUserStorage, hasUserStorage } from '../lib/userStorage'
import { hasCompletedRemoteSync, markRemoteSyncComplete } from '../lib/dataSync'
import { useWorkspaceRealtime } from '../features/workspace/useWorkspaceRealtime'
import { useAuth } from '../features/auth/AuthProvider'
import { navigateToView, viewFromPath } from './routing'
import type { FinanceDraft, FinanceEntry, Task, TaskDraft, View } from '../types'
import type { ScheduleItem } from '../features/schedule/schedule.types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const FINANCE_STORAGE_KEY = 'mid-daily.finance'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'

const reportError = (reason: unknown) => reason instanceof Error ? reason.message : 'Remote data sync failed.'

function getTimePeriod(hour = new Date().getHours()) {
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'day'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

export function App() {
  const { user } = useAuth()
  const userId = user?.id
  const workspaceScope = userId ? userId : 'demo'
  const [activeView, setActiveView] = useState<View>(() => viewFromPath(window.location.pathname))

  useEffect(() => {
    const handlePopState = () => setActiveView(viewFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (view: View) => {
    navigateToView(view)
    setActiveView(view)
  }
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, userId ? [] : initialTasks)))
  const [finance, setFinance] = useState<FinanceEntry[]>(() => normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, userId ? [] : financeEntries)))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, userId ? [] : initialScheduleItems)))
  const [toast, setToast] = useState('')
  const [timePeriod, setTimePeriod] = useState(getTimePeriod)
  const [readyScope, setReadyScope] = useState<string>('')

  useReminderScheduler(schedule)
  useWorkspaceRealtime(userId, readyScope === workspaceScope, setTasks, setFinance, setSchedule)

  useEffect(() => {
    void registerBrowserServiceWorker()
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setTimePeriod(getTimePeriod()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(TASK_STORAGE_KEY, userId, tasks)
  }, [tasks, workspaceScope, readyScope])
  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(FINANCE_STORAGE_KEY, userId, finance)
  }, [finance, workspaceScope, readyScope])
  useEffect(() => {
    if (readyScope !== workspaceScope) return
    writeUserStorage(SCHEDULE_STORAGE_KEY, userId, schedule)
  }, [schedule, workspaceScope, readyScope])

  useEffect(() => {
    setReadyScope('')

    if (!userId) {
      setTasks(normalizeTaskList(initialTasks))
      setFinance(normalizeFinanceList(financeEntries))
      setSchedule(normalizeScheduleList(initialScheduleItems))
      setReadyScope('demo')
      return
    }

    setTasks(normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, [])))
    setFinance(normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, [])))
    setSchedule(normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, [])))
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

        const taskNeedsMigration = remote.tasks.length === 0 && !hasCompletedRemoteSync(TASK_STORAGE_KEY, userId) && hasUserStorage(TASK_STORAGE_KEY, userId)
        const financeNeedsMigration = remote.finance.length === 0 && !hasCompletedRemoteSync(FINANCE_STORAGE_KEY, userId) && hasUserStorage(FINANCE_STORAGE_KEY, userId)
        const scheduleNeedsMigration = remote.schedule.length === 0 && !hasCompletedRemoteSync(SCHEDULE_STORAGE_KEY, userId) && hasUserStorage(SCHEDULE_STORAGE_KEY, userId)

        const [migratedTasks, migratedFinance, migratedSchedule] = await Promise.all([
          taskNeedsMigration
            ? Promise.all(localTasks.map((task) => createRemoteTask(task)))
            : Promise.resolve([]),
          financeNeedsMigration
            ? Promise.all(localFinance.map((entry) => createRemoteFinance(entry)))
            : Promise.resolve([]),
          scheduleNeedsMigration
            ? Promise.all(localSchedule.map((item) => createRemoteSchedule(item)))
            : Promise.resolve([]),
        ])

        if (!active) return

        const nextTasks = taskNeedsMigration ? normalizeTaskList(migratedTasks) : normalizeTaskList(remote.tasks)
        const nextFinance = financeNeedsMigration ? normalizeFinanceList(migratedFinance) : normalizeFinanceList(remote.finance)
        const nextSchedule = scheduleNeedsMigration ? normalizeScheduleList(migratedSchedule) : normalizeScheduleList(remote.schedule)

        setTasks(nextTasks)
        setFinance(nextFinance)
        setSchedule(nextSchedule)

        markRemoteSyncComplete(TASK_STORAGE_KEY, userId)
        markRemoteSyncComplete(FINANCE_STORAGE_KEY, userId)
        markRemoteSyncComplete(SCHEDULE_STORAGE_KEY, userId)
        setReadyScope(userId)
      } catch (reason) {
        if (active) {
          setReadyScope(userId)
          setToast(reportError(reason))
        }
      }
    }

    void hydrate()

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
      const remoteDraft = { ...normalizedDraft, dueDate: normalizedDraft.dueDate ?? null, notes: normalizedDraft.notes ?? null }
      const next = userId ? await updateRemoteTask(editingId, remoteDraft) : { ...tasks.find((task) => task.id === editingId)!, ...normalizedDraft }
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
      const remoteFinanceDraft = { ...normalizedDraft, notes: normalizedDraft.notes ?? null }
      const next = userId ? await updateRemoteFinance(editingId, remoteFinanceDraft) : { ...finance.find((entry) => entry.id === editingId)!, ...normalizedDraft }
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
    <div className="app-frame" data-view={activeView} data-time-period={timePeriod}>
      <div className="atmosphere" aria-hidden="true" />
      <Sidebar activeView={activeView} onNavigate={navigate} />
      <main className="main-content">
        <Topbar view={activeView} />
        <Suspense fallback={<section className="workspace view-loading" aria-live="polite"><span className="section-kicker">LOADING</span><h2>Opening your workspace…</h2></section>}>
          <div className="view-key">
            {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} finance={finance} onToggleTask={(id) => void toggleTask(id)} onNavigate={navigate} />}
            {activeView === 'schedule' && <ScheduleView schedule={schedule} onScheduleChange={handleScheduleChange} demoMode={!userId} />}
            {activeView === 'tasks' && <TasksView tasks={tasks} onSaveTask={saveTask} onToggleTask={(id) => void toggleTask(id)} onDeleteTask={(id) => void deleteTask(id)} />}
            {activeView === 'finance' && <FinanceView finance={finance} onSaveFinance={saveFinance} onDeleteFinance={(id) => void deleteFinance(id)} />}
            {activeView === 'social' && <SocialAnalyticsView />}
            {activeView === 'assistant' && <AssistantView />}
          </div>
        </Suspense>
      </main>
      {toast && <Toast message={toast} />}
    </div>
  )
}
