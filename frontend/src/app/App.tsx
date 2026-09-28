import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { Toast } from '../components/ui/Toast'
import { WorkspaceContextRail } from '../components/layout/WorkspaceContextRail'
import { useForegroundInteraction } from './useForegroundInteraction'
import { navigateToView, viewFromPath } from './routing'
import { useAuth } from '../features/auth/AuthProvider'
import { useEnvironment } from '../environment/useEnvironment'
import { environmentCssVariables } from '../environment/visual'
import { useWorkspaceData } from '../features/workspace/useWorkspaceData'
import { useWorkspaceProfile } from '../features/profile/useWorkspaceProfile'
import { getToday as getAppToday, APP_TIMEZONE } from '../lib/dateTime'
import type { View } from '../types'

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
const EnvironmentScene = lazy(() => import('../environment/EnvironmentScene').then((module) => ({ default: module.EnvironmentScene })))

const SIDEBAR_HIDDEN_STORAGE_KEY = 'mid-daily.sidebar-hidden'

export function App() {
  const { user } = useAuth()
  const { environment, requestLocation, refresh: refreshEnvironment } = useEnvironment()
  const [activeView, setActiveView] = useState<View>(() => viewFromPath(window.location.pathname))
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarHidden, setSidebarHidden] = useState(false)
  const [toast, setToast] = useState('')

  const {
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
  } = useWorkspaceData({ onNotice: setToast })

  const { profile, setProfile, profileLoading } = useWorkspaceProfile({
    user,
    onError: setToast,
  })

  useForegroundInteraction()

  useEffect(() => {
    const { readUserStorage } = window as never
    void readUserStorage
  }, [])

  useEffect(() => {
    const current = document.querySelector('.app-frame')
    if (!(current instanceof HTMLElement)) return

    const stored = current.dataset.sidebarHidden === 'true'
    if (!stored) return
  }, [])

  useEffect(() => {
    setSidebarHidden(false)
  }, [userId])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarHidden((current) => !current)
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

  const navigate = useCallback((view: View) => {
    navigateToView(view)
    setActiveView(view)
  }, [])

  const toggleSidebar = useCallback(() => setSidebarHidden((current) => !current), [])
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const openProfile = useCallback(() => navigate('profile'), [navigate])
  const handleEnvironmentAction = useCallback(() => {
    void (environment.location ? refreshEnvironment() : requestLocation())
  }, [environment.location, refreshEnvironment, requestLocation])

  const appToday = getAppToday(APP_TIMEZONE)
  const workload = useMemo(() => {
    const overdueCount = tasks.filter((task) => task.status !== 'done' && task.dueDate && task.dueDate < appToday).length
    const openTaskCount = tasks.filter((task) => task.status !== 'done').length
    const todayActivityCount = schedule.filter((item) => item.date === appToday && item.activityMode !== 'FLEXIBLE').length

    return overdueCount >= 3 || openTaskCount >= 9 || todayActivityCount >= 8
      ? 'high' as const
      : overdueCount > 0 || openTaskCount >= 5 || todayActivityCount >= 5
        ? 'medium' as const
        : 'low' as const
  }, [appToday, tasks, schedule])

  return (
    <div
      className={sidebarHidden ? 'app-frame sidebar-hidden' : 'app-frame'}
      data-view={activeView}
      data-day-phase={environment.dayPhase}
      data-weather={environment.weather?.condition ?? 'clear'}
      data-environment-status={environment.status}
      data-workload={workload}
      style={environmentCssVariables(environment)}
    >
      <Suspense fallback={<div className="environment-scene environment-scene--loading" aria-hidden="true" />}>
        <EnvironmentScene environment={environment} activeView={activeView} workload={workload} />
      </Suspense>

      <Sidebar activeView={activeView} onNavigate={navigate} />

      <main className="main-content">
        <Topbar
          view={activeView}
          profile={profile}
          onProfile={openProfile}
          onSearch={openSearch}
          sidebarHidden={sidebarHidden}
          onToggleSidebar={toggleSidebar}
          onNavigate={navigate}
          userId={userId}
          tasks={tasks}
          finance={finance}
          schedule={schedule}
          environment={environment}
          onEnvironmentAction={handleEnvironmentAction}
        />

        {activeView !== 'dashboard' && (
          <WorkspaceContextRail
            activeView={activeView}
            tasks={tasks}
            finance={finance}
            schedule={schedule}
            timezone={environment.location?.timezone}
            onNavigate={navigate}
          />
        )}

        <Suspense fallback={<section className="workspace view-loading" aria-live="polite"><span className="section-kicker">LOADING</span><h2>Opening your workspace…</h2></section>}>
          <div className="view-key" data-module={activeView}>
            {activeView === 'dashboard' && (
              <DashboardView
                tasks={tasks}
                schedule={schedule}
                finance={finance}
                onToggleTask={(id) => void toggleTask(id)}
                onNavigate={navigate}
                timezone={environment.location?.timezone}
              />
            )}
            {activeView === 'schedule' && (
              <ScheduleView
                schedule={schedule}
                onScheduleChange={handleScheduleChange}
                demoMode={!userId}
              />
            )}
            {activeView === 'tasks' && (
              <TasksView
                tasks={tasks}
                onSaveTask={saveTask}
                onToggleTask={(id) => void toggleTask(id)}
                onDeleteTask={(id) => void deleteTask(id)}
              />
            )}
            {activeView === 'finance' && (
              <FinanceView
                finance={finance}
                budgets={budgets}
                onSaveFinance={saveFinance}
                onDeleteFinance={(id) => void deleteFinance(id)}
                onSaveBudget={saveBudget}
                onDeleteBudget={(id) => void deleteBudget(id)}
              />
            )}
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
          <GlobalSearch
            tasks={tasks}
            finance={finance}
            schedule={schedule}
            onNavigate={navigate}
            onClose={closeSearch}
          />
        </Suspense>
      )}
    </div>
  )
}
