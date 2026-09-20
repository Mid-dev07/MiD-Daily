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
import { useReminderScheduler } from '../features/schedule/hooks/useReminderScheduler'
import { readUserStorage, writeUserStorage, hasUserStorage } from '../lib/userStorage'
import { hasCompletedRemoteSync, markRemoteSyncComplete } from '../lib/dataSync'
import { useAuth } from '../features/auth/AuthProvider'
import type { FinanceDraft, FinanceEntry, Task, TaskDraft, View } from '../types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const FINANCE_STORAGE_KEY = 'mid-daily.finance'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'

export function App() {
  const { user } = useAuth()
  const userId = user?.id
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, userId ? [] : initialTasks)))
  const [finance, setFinance] = useState<FinanceEntry[]>(() => normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, userId ? [] : financeEntries)))
  const [schedule, setSchedule] = useState(() => normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, initialScheduleItems)))
  const [toast, setToast] = useState('')

  useReminderScheduler(schedule)

  useEffect(() => writeUserStorage(TASK_STORAGE_KEY, userId, tasks), [tasks, userId])
  useEffect(() => writeUserStorage(FINANCE_STORAGE_KEY, userId, finance), [finance, userId])
  useEffect(() => writeUserStorage(SCHEDULE_STORAGE_KEY, userId, schedule), [schedule, userId])

  useEffect(() => {
    if (!userId) return
    let active = true

    const loadRemoteData = async () => {
      try {
        const [remoteTasks, remoteFinance] = await Promise.all([listRemoteTasks(), listRemoteFinance()])

        if (!active) return

        const taskCacheExists = hasUserStorage(TASK_STORAGE_KEY, userId)
        const financeCacheExists = hasUserStorage(FINANCE_STORAGE_KEY, userId)

        if (remoteTasks.length > 0 || hasCompletedRemoteSync(TASK_STORAGE_KEY, userId)) {
          setTasks(normalizeTaskList(remoteTasks))
        } else if (taskCacheExists && tasks.length > 0) {
          const migrated = []
          for (const task of tasks) migrated.push(await createRemoteTask(task))
          if (active) setTasks(normalizeTaskList(migrated))
        } else {
          setTasks([])
        }
        markRemoteSyncComplete(TASK_STORAGE_KEY, userId)

        if (remoteFinance.length > 0 || hasCompletedRemoteSync(FINANCE_STORAGE_KEY, userId)) {
          setFinance(normalizeFinanceList(remoteFinance))
        } else if (financeCacheExists && finance.length > 0) {
          const migrated = []
          for (const entry of finance) migrated.push(await createRemoteFinance(entry))
          if (active) setFinance(normalizeFinanceList(migrated))
        } else {
          setFinance([])
        }
        markRemoteSyncComplete(FINANCE_STORAGE_KEY, userId)
      } catch (reason) {
        if (active) setToast(reason instanceof Error ? `Cloud sync unavailable: ${reason.message}` : 'Cloud sync unavailable; using local cache.')
      }
    }

    void loadRemoteData()
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3000)
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
      setToast(reason instanceof Error ? reason.message : 'Task update failed.')
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
      if (userId) {
        const remote = await updateRemoteTask(editingId, normalizedDraft)
        setTasks((items) => items.map((task) => task.id === editingId ? remote : task))
      } else {
        setTasks((items) => items.map((task) => task.id === editingId ? { ...task, ...normalizedDraft } : task))
      }
      setToast('Task updated')
    } else {
      if (userId) {
        const remote = await createRemoteTask(normalizedDraft)
        setTasks((items) => [...items, remote])
      } else {
        setTasks((items) => [...items, { id: Date.now(), ...normalizedDraft }])
      }
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
      setToast(reason instanceof Error ? reason.message : 'Task deletion failed.')
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
      if (userId) {
        const remote = await updateRemoteFinance(editingId, normalizedDraft)
        setFinance((items) => items.map((entry) => entry.id === editingId ? remote : entry))
      } else {
        setFinance((items) => items.map((entry) => entry.id === editingId ? { ...entry, ...normalizedDraft } : entry))
      }
      setToast('Transaction updated')
    } else {
      if (userId) {
        const remote = await createRemoteFinance(normalizedDraft)
        setFinance((items) => [...items, remote])
      } else {
        setFinance((items) => [...items, { id: Date.now(), ...normalizedDraft }])
      }
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
      setToast(reason instanceof Error ? reason.message : 'Transaction deletion failed.')
    }
  }

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-content">
        <Topbar view={activeView} />
        <div className="view-key">
          {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} finance={finance} onToggleTask={(id) => void toggleTask(id)} />}
          {activeView === 'schedule' && <ScheduleView schedule={schedule} onScheduleChange={setSchedule} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} onSaveTask={saveTask} onToggleTask={(id) => void toggleTask(id)} onDeleteTask={(id) => void deleteTask(id)} />}
          {activeView === 'finance' && <FinanceView finance={finance} onSaveFinance={saveFinance} onDeleteFinance={(id) => void deleteFinance(id)} />}
        </div>
      </main>
      {toast && <Toast message={toast} />}
    </div>
  )
}
