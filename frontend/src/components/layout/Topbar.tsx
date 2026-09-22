import { useAuth } from '../../features/auth/AuthProvider'
import type { FinanceEntry, Profile, Task, View } from '../../types'
import type { ScheduleItem } from '../../features/schedule/schedule.types'
import type { EnvironmentState } from '../../environment/types'
import { environmentLabel, weatherGlyph } from '../../environment/visual'
import { lazy, Suspense } from 'react'

const NotificationCenter = lazy(() => import('./NotificationCenter').then((module) => ({ default: module.NotificationCenter })))

interface TopbarProps {
  view: View
  profile: Profile | null
  onProfile: () => void
  onSearch: () => void
  onNavigate: (view: View) => void
  userId?: string
  tasks: Task[]
  finance: FinanceEntry[]
  schedule: ScheduleItem[]
  environment: EnvironmentState
  onEnvironmentAction: () => void
}

const viewIndices: Record<View, string> = {
  dashboard: '001',
  schedule: '002',
  tasks: '003',
  finance: '004',
  social: '005',
  assistant: '006',
  profile: '007',
  insights: '008',
  habits: '009',
}

const titles: Record<View, string> = {
  dashboard: 'Today',
  schedule: 'Schedule',
  tasks: 'Tasks',
  finance: 'Finance',
  social: 'Social',
  assistant: 'Assistant',
  profile: 'Profile',
  insights: 'Insights',
  habits: 'Habits',
}

function initials(name: string) {
  const letters = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
  return letters.toUpperCase() || 'M'
}

export function Topbar({ view, profile, onProfile, onSearch, onNavigate, userId, tasks, finance, schedule, environment, onEnvironmentAction }: TopbarProps) {
  const { configured, user, signOut } = useAuth()

  const logout = async () => {
    const error = await signOut()
    if (error) window.alert(error)
  }

  const displayName = profile?.displayName || user?.email || 'Personal workspace'
  const environmentText = environmentLabel(environment)
  const environmentTitle = environment.location
    ? 'Refresh MiD environment from your current location'
    : 'Use your location to personalize MiD weather and daylight'
  const searchShortcut = /Mac|iPhone|iPad/i.test(navigator.platform) ? '⌘K' : 'Ctrl K'

  return (
    <header className="topbar">
      <div className="topbar-title">
        <div className="topbar-heading">
          <span className="topbar-kicker">PERSONAL OPERATING LANDSCAPE</span>
          <div className="topbar-title-row">
            <span className="topbar-index" aria-hidden="true">{viewIndices[view]}</span>
            <h1>{titles[view]}</h1>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="environment-control" type="button" onClick={onEnvironmentAction} title={environmentTitle} aria-label={environmentTitle}>
          <span className="environment-glyph" aria-hidden="true">{weatherGlyph(environment)}</span>
          <span className="environment-readout">
            <b>{environmentText}</b>
            <small>{environment.location ? 'local environment' : 'personalize sky'}</small>
          </span>
        </button>
        <span className="environment-attribution-inline" aria-label="Weather data source">{environment.weather ? 'Open-Meteo' : 'MiD local'}</span>
        <button className="search-trigger" type="button" onClick={onSearch} aria-label="Search MiD-Daily">
          <span aria-hidden="true">⌕</span><span>Search</span><kbd>⌘K</kbd>
        </button>
        <Suspense fallback={<span className="notification-loading" aria-hidden="true" />}>
          <NotificationCenter userId={userId} tasks={tasks} schedule={schedule} finance={finance} onNavigate={onNavigate} />
        </Suspense>
        <div className="profile-chip">
        <button className="profile-trigger" type="button" onClick={onProfile} aria-label="Open your profile">
          {profile?.avatarUrl ? (
            <img className="avatar profile-chip-avatar-image" src={profile.avatarUrl} alt="" />
          ) : (
            <span className="avatar">{initials(displayName)}</span>
          )}
          <span className="profile-email">{displayName}</span>
        </button>
        {configured && user && (
          <button className="text-button" type="button" onClick={() => void logout()}>Sign out</button>
        )}
        </div>
      </div>
    </header>
  )
}
