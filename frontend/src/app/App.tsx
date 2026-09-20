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
import { initialScheduleItems } from '../features/schedule/schedule.data'
import { normalizeScheduleList } from '../features/schedule/schedule.migration'
import { useReminderScheduler } from '../features/schedule/hooks/useReminderScheduler'
import { readStorage, writeStorage } from '../lib/storage'
import type { Task, TaskDraft, View } from '../types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'

export function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readStorage(TASK_STORAGE_KEY, initialTasks)))
  const [schedule, setSchedule] = useState(() => normalizeScheduleList(readStorage(SCHEDULE_STORAGE_KEY, initialScheduleItems)))
  const [toast, setToast] = useState('')

  useReminderScheduler(schedule)

  useEffect(() => writeStorage(TASK_STORAGE_KEY, tasks), [tasks])
  useEffect(() => writeStorage(SCHEDULE_STORAGE_KEY, schedule), [schedule])
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

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-content">
        <Topbar view={activeView} />
        <div className="view-key">
          {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} finance={financeEntries} onToggleTask={toggleTask} />}
          {activeView === 'schedule' && <ScheduleView schedule={schedule} onScheduleChange={setSchedule} />}
          {activeView === 'tasks' && <TasksView tasks={tasks} onSaveTask={saveTask} onToggleTask={toggleTask} onDeleteTask={deleteTask} />}
          {activeView === 'finance' && <FinanceView finance={financeEntries} />}
        </div>
      </main>
      {toast && <Toast message={toast} />}
    </div>
  )
}
