import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { Sidebar } from './components/Sidebar'
import { Workspace } from './components/Workspace'
import { financeEntries, initialTasks, scheduleItems } from './data'
import type { Task, View } from './types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'

function loadTasks(): Task[] {
  try {
    const stored = localStorage.getItem(TASK_STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Task[]) : initialTasks
  } catch {
    return initialTasks
  }
}

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  const toggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
          : task,
      ),
    )
  }

  return (
    <div className="app-frame">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">MI-D DAILY</span>
            <h1>{activeView === 'dashboard' ? 'Good evening.' : activeView[0].toUpperCase() + activeView.slice(1)}</h1>
          </div>
          <div className="profile-chip">
            <span className="avatar">M</span>
            <span>Personal workspace</span>
          </div>
        </header>

        {activeView === 'dashboard' ? (
          <Dashboard
            tasks={tasks}
            schedule={scheduleItems}
            finance={financeEntries}
            onToggleTask={toggleTask}
          />
        ) : (
          <Workspace
            view={activeView}
            tasks={tasks}
            schedule={scheduleItems}
            finance={financeEntries}
            onToggleTask={toggleTask}
          />
        )}
      </main>
    </div>
  )
}

export default App
