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
const ProfileView = lazy(() => import('../features/profile/ProfileView').then((module) => ({ default: module.ProfileView })))
const InsightsView = lazy(() => import('../features/insights/InsightsView').then((module) => ({ default: module.InsightsView })))
const HabitsView = lazy(() => import('../features/habits/HabitsView').then((module) => ({ default: module.HabitsView })))
const GlobalSearch = lazy(() => import('../components/layout/GlobalSearch').then((module) => ({ default: module.GlobalSearch })))
import { normalizeTaskList } from '../features/tasks/task.migration'
import { validateTaskDraft } from '../features/tasks/task.validation'
import { createRemoteTask, updateRemoteTask, deleteRemoteTask } from '../features/tasks/tasksApi'
import { normalizeFinanceList } from '../features/finance/finance.migration'
import { validateFinanceDraft } from '../features/finance/finance.validation'
import { createRemoteFinance, updateRemoteFinance, deleteRemoteFinance } from '../features/finance/financeApi'
import { createRemoteFinanceBudget, updateRemoteFinanceBudget, deleteRemoteFinanceBudget } from '../features/finance/financeBudgetApi'
import { initialScheduleItems } from '../features/schedule/schedule.data'
import { loadWorkspaceBootstrap } from '../features/workspace/workspaceApi'
import { normalizeScheduleList } from '../features/schedule/schedule.migration'
import { createRemoteSchedule, updateRemoteSchedule, deleteRemoteSchedule } from '../features/schedule/scheduleApi'
import { useReminderScheduler } from '../features/schedule/hooks/useReminderScheduler'
import { useEnvironment } from '../environment/useEnvironment'
import { environmentCssVariables } from '../environment/visual'
import { EnvironmentScene } from '../environment/EnvironmentScene'
import { registerBrowserServiceWorker } from '../integrations/notifications/serviceWorker'
import { readUserStorage, writeUserStorage, hasUserStorage } from '../lib/userStorage'
import { hasCompletedRemoteSync, markRemoteSyncComplete } from '../lib/dataSync'
import { useWorkspaceRealtime } from '../features/workspace/useWorkspaceRealtime'
import { useAuth } from '../features/auth/AuthProvider'
import { navigateToView, viewFromPath } from './routing'
import { getProfile } from '../features/profile/profileApi'
import type { FinanceBudget, FinanceBudgetDraft, FinanceDraft, FinanceEntry, Profile, Task, TaskDraft, View } from '../types'
import type { ScheduleItem } from '../features/schedule/schedule.types'

const TASK_STORAGE_KEY = 'mid-daily.tasks'
const FINANCE_STORAGE_KEY = 'mid-daily.finance'
const SCHEDULE_STORAGE_KEY = 'mid-daily.schedule'
const BUDGET_STORAGE_KEY = 'mid-daily.finance-budgets'

const reportError = (reason: unknown) => reason instanceof Error ? reason.message : 'Remote data sync failed.'

export function App() {
  const { user } = useAuth()
  const userId = user?.id
  const workspaceScope = userId ? userId : 'demo'
  const [activeView, setActiveView] = useState<View>(() => viewFromPath(window.location.pathname))
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(Boolean(userId))
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const handlePopState = () => setActiveView(viewFromPath(window.location.pathname))
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (view: View) => {
    navigateToView(view)
    setActiveView(view)
  }

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfile(null)
    setProfileLoading(true)

    void getProfile(user)
      .then((next) => {
        if (active) setProfile(next)
      })
      .catch((reason) => {
        if (active) setToast(reportError(reason))
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => { active = false }
  }, [user, userId])
  const [tasks, setTasks] = useState<Task[]>(() => normalizeTaskList(readUserStorage(TASK_STORAGE_KEY, userId, userId ? [] : initialTasks)))
  const [finance, setFinance] = useState<FinanceEntry[]>(() => normalizeFinanceList(readUserStorage(FINANCE_STORAGE_KEY, userId, userId ? [] : financeEntries)))
  const [schedule, setSchedule] = useState<ScheduleItem[]>(() => normalizeScheduleList(readUserStorage(SCHEDULE_STORAGE_KEY, userId, userId ? [] : initialScheduleItems)))
  const [budgets, setBudgets] = useState<FinanceBudget[]>(() => readUserStorage(BUDGET_STORAGE_KEY, userId, []))
  const [toast, setToast] = useState('')
  const [readyScope, setReadyScope] = useState<string>('')
  const { environment, requestLocation, refresh: refreshEnvironment } = useEnvironment()

  useReminderScheduler(schedule)
  useWorkspaceRealtime(userId, readyScope === workspaceScope, setTasks, setFinance, setSchedule)

  useEffect(() => {
    void registerBrowserServiceWorker()
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
    if (readyScope !== workspaceScope) return
    writeUserStorage(BUDGET_STORAGE_KEY, userId, budgets)
  }, [budgets, workspaceScope, readyScope])

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
        setBudgets(remote.budgets ?? [])

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
      const next = userId ? await updateRemoteFinanceBudget(editingId, normalized) : { ...budgets.find((budget) => budget.id === editingId)!, ...normalized }
      setBudgets((items) => items.map((budget) => budget.id === editingId ? next : budget))
    } else {
      const next = userId ? await createRemoteFinanceBudget(normalized) : { id: Date.now(), ...normalized }
      setBudgets((items) => [...items, next])
    }
    setToast(editingId ? 'Budget updated' : 'Budget added')
    return null
  }

  const deleteBudget = async (id: number) => {
    try {
      if (userId) await deleteRemoteFinanceBudget(id)
      setBudgets((current) => current.filter((budget) => budget.id !== id))
      setToast('Budget deleted')
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
    <div
      className="app-frame"
      data-view={activeView}
      data-day-phase={environment.dayPhase}
      data-weather={environment.weather?.condition ?? 'clear'}
      data-environment-status={environment.status}
      style={environmentCssVariables(environment)}
    >
      <EnvironmentScene environment={environment} />
      <Sidebar activeView={activeView} onNavigate={navigate} />
      <main className="main-content">
        <Topbar view={activeView} profile={profile} onProfile={() => navigate('profile')} onSearch={() => setSearchOpen(true)} onNavigate={navigate} userId={userId} tasks={tasks} finance={finance} schedule={schedule} environment={environment} onEnvironmentAction={() => void (environment.location ? refreshEnvironment() : requestLocation())} />
        <Suspense fallback={<section className="workspace view-loading" aria-live="polite"><span className="section-kicker">LOADING</span><h2>Opening your workspace…</h2></section>}>
          <div className="view-key">
            {activeView === 'dashboard' && <DashboardView tasks={tasks} schedule={schedule} finance={finance} onToggleTask={(id) => void toggleTask(id)} onNavigate={navigate} timezone={environment.location?.timezone} />}
            {activeView === 'schedule' && <ScheduleView schedule={schedule} onScheduleChange={handleScheduleChange} demoMode={!userId} />}
            {activeView === 'tasks' && <TasksView tasks={tasks} onSaveTask={saveTask} onToggleTask={(id) => void toggleTask(id)} onDeleteTask={(id) => void deleteTask(id)} />}
            {activeView === 'finance' && <FinanceView finance={finance} budgets={budgets} onSaveFinance={saveFinance} onDeleteFinance={(id) => void deleteFinance(id)} onSaveBudget={saveBudget} onDeleteBudget={(id) => void deleteBudget(id)} />}
            {activeView === 'social' && <SocialAnalyticsView />}
            {activeView === 'assistant' && <AssistantView />}
            {activeView === 'profile' && (user && profile ? (
              <ProfileView user={user} profile={profile} onProfileChange={setProfile} onToast={setToast} />
            ) : (
              <section className="workspace view-loading" aria-live="polite">
                <span className="section-kicker">ACCOUNT</span>
                <h2>{profileLoading ? 'Loading your profile…' : 'Profile unavailable'}</h2>
                <p>{profileLoading ? 'Restoring your profile details.' : 'Sign in to manage your profile.'}</p>
              </section>
            ))}
            {activeView === 'insights' && <InsightsView tasks={tasks} schedule={schedule} finance={finance} onNavigate={navigate} />}
            {activeView === 'habits' && <HabitsView />}
          </div>
        </Suspense>
      </main>
      {toast && <Toast message={toast} />}
      {searchOpen && (
        <Suspense fallback={null}>
          <GlobalSearch tasks={tasks} finance={finance} schedule={schedule} onNavigate={navigate} onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}
