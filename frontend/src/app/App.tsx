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
import { normalizeFinanceList } from '../features/finance/finance.migration'
import { validateFinanceDraft } from '../features/finance/finance.validation'
import { initialScheduleItems } from '../features/schedule/schedule.data'
import { normalizeScheduleList } from '../features/schedule/schedule.migration'
import { useReminderScheduler } from '../features/schedule/hooks/useReminderScheduler'
import { readUserStorage, writeUserStorage } from '../lib/userStorage'
import { useAuth } from '../features/auth/AuthProvider'
import type { FinanceDraft, FinanceEntry, Task, TaskDraft, View } from '../types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const FINANCE_STORAGE_KEY = 'mid-daily.finance'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'

export function App() {
  const { user } = useAuth()
  const userId = user?.id
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, initialTasks)))
  const [finance, setFinance] = useState<FinanceEntry[]>(() => normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, financeEntries)))
  const [schedule, setSchedule] = useState(() => normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, initialScheduleItems)))
  const [toast, setToast] = useState('')

  useReminderScheduler(schedule)

  useEffect(() => writeUserStorage(TASK_STORAGE_KEY, userId, tasks), [tasks, userId])
  useEffect(() => writeUserStorage(FINANCE_STORAGE_KEY, userId, finance), [finance, userId])
  useEffect(() => writeUserStorage(SCHEDULE_STORAGE_KEY, userId, schedule), [schedule, userId])
  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const toggleTask = (id: number) => {
    setTasks((current) => current.map((task) => {
      if (task.id !== id) return task
      const completed = task.status === 'done'
      setToast(completed ? 'Task reopened' : 'Task completed')
      return { ...task, status: completed ? 'todo' : 'done', progress: completed ? Math.min(task.progress ?? 0, 99) : 100 }
    }))
  }

  const saveTask = (draft: TaskDraft, editingId?: number) => {
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
      setTasks((items) => items.map((task) => task.id === editingId ? { ...task, ...normalizedDraft } : task))
      setToast('Task updated')
    } else {
      setTasks((items) => [...items, { id: Date.now(), ...normalizedDraft }])
      setToast('Task added')
    }
    return null
  }

  const deleteTask = (id: number) => {
    setTasks((current) => current.filter((task) => task.id !== id))
    setToast('Task deleted')
  }

  const saveFinance = (draft: FinanceDraft, editingId?: number) => {
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
      setFinance((items) => items.map((entry) => entry.id === editingId ? { ...entry, ...normalizedDraft } : entry))
      setToast('Transaction updated')
    } else {
      setFinance((items) => [...items, { id: Date.now(), ...normalizedDraft }])
      setToast('Transaction added')
    }
    return null
  }

  const deleteFinance = (id: number) => {
    setFinance((current) => current.filter((entry) => entry.id !== id))
    setToast('Transaction deleted')
  }

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-content">
        <Topbar view={activeView} />
        <div className="view-key">
          {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} finance={finance} onToggleTask={toggleTask} />}
          {activeView === 'schedule' && <ScheduleView schedule={schedule} onScheduleChange={setSchedule} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} onSaveTask={saveTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} />}
          {activeView === 'finance' && <FinanceView finance={finance} onSaveFinance={saveFinance} onDeleteFinance={deleteFinance} />}
        </div>
      </main>
      {toast && <Toast message={toast} />}
    </div>
  )
}
