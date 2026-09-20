import { useAuth } from '../../features/auth/AuthProvider'
import type { View } from '../../types'

interface TopbarProps { view: View }

export function Topbar({ view }: TopbarProps) {
  const { configured, user, signOut } = useAuth()
  const title = view === 'dashboard' ? 'Dashboard' : view[0].toUpperCase() + view.slice(1)

  const logout = async () => {
    const error = await signOut()
    if (error) window.alert(error)
  }

  return (
    <header className="topbar">
      <div>
        <span className="topbar-kicker">MI-D DAILY</span>
        <h1>{title}</h1>
      </div>
      <div className="profile-chip">
        <span className="avatar">{user?.email?.slice(0, 1).toUpperCase() ?? 'M'}</span>
        <span>{user?.email ?? 'Personal workspace'}</span>
        {configured && user && <button className="text-button" type="button" onClick={() => void logout()}>Sign out</button>}
      </div>
    </header>
  )
}
