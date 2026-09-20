import { useEffect, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { initialTasks, financeEntries, scheduleItems } from '../data/seed'
import { DashboardView } from '../features/dashboard/DashboardView'
import { FinanceView } from '../features/finance/FinanceView'
import { ScheduleView } from '../features/schedule/ScheduleView'
import { TasksView } from '../features/tasks/TasksView'
import { readStorage, writeStorage } from '../lib/storage'
import type { Task, TaskPriority, View } from '../types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(() => readStorage(TASK_STORAGE_KEY, initialTasks))

  useEffect(() => writeStorage(TASK_STORAGE_KEY, tasks), [tasks])

  const toggleTask = (id: number) => {
    setTasks((current) => current.map((task) => (
      task.id === id
        ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
        : task
    )))
  }

  const addTask = (title: string, priority: TaskPriority) => {
    setTasks((current) => [
      ...current,
      { id: Date.now(), title, category: 'Personal', priority, status: 'todo' },
    ])
  }

  const pageTitle = activeView === 'dashboard'
    ? 'Dashboard'
    : `${activeView[0].toUpperCase()}${activeView.slice(1)}`

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="main-content">
        <header className="topbar">
          <div><span className="topbar-kicker">MI-D DAILY</span><h1>{pageTitle}</h1></div>
          <div className="profile-chip"><span className="avatar">M</span><span>Personal workspace</span></div>
        </header>

        {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={scheduleItems} finance={financeEntries} onToggleTask={toggleTask} />}
        {activeView === 'schedule' && <ScheduleView schedule={scheduleItems} />}
        {activeView === 'tasks' && <TasksView tasks={tasks} onAddTask={addTask} onToggleTask={toggleTask} />}
        {activeView === 'finance' && <FinanceView finance={financeEntries} />}
      </main>
    </div>
  )
}

export default App
