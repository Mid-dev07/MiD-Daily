import { useAuth } from '../../features/auth/AuthProvider'
import type { Profile, View } from '../../types'

interface TopbarProps {
  view: View
  profile: Profile | null
  onProfile: () => void
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
}

function initials(name: string) {
  const letters = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
  return letters.toUpperCase() || 'M'
}

export function Topbar({ view, profile, onProfile }: TopbarProps) {
  const { configured, user, signOut } = useAuth()

  const logout = async () => {
    const error = await signOut()
    if (error) window.alert(error)
  }

  const displayName = profile?.displayName || user?.email || 'Personal workspace'

  return (
    <header className="topbar">
      <h1>{titles[view]}</h1>

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
    </header>
  )
}
