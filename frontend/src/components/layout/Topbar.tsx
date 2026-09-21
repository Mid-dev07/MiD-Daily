import { useAuth } from '../../features/auth/AuthProvider'
import type { View } from '../../types'

interface TopbarProps { view: View }

const titles: Record<View, string> = {
  dashboard: 'Today',
  schedule: 'Schedule',
  tasks: 'Tasks',
  finance: 'Finance',
  social: 'Social',
  assistant: 'Assistant',
}

export function Topbar({ view }: TopbarProps) {
  const { configured, user, signOut } = useAuth()

  const logout = async () => {
    const error = await signOut()
    if (error) window.alert(error)
  }

  return (
    <header className="topbar">
      <h1>{titles[view]}</h1>

      <div className="profile-chip" aria-label="Workspace account">
        <span className="avatar">{user?.email?.slice(0, 1).toUpperCase() ?? 'M'}</span>
        <span className="profile-email">{user?.email ?? 'Personal workspace'}</span>
        {configured && user && (
          <button className="text-button" type="button" onClick={() => void logout}>Sign out</button>
        )}
      </div>
    </header>
  )
}
