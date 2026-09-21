import { useAuth } from '../../features/auth/AuthProvider'
import type { View } from '../../types'

interface TopbarProps { view: View }

const viewMeta: Record<View, { index: string; label: string; title: string }> = {
  dashboard: { index: '001', label: 'TODAY', title: 'Dashboard' },
  schedule: { index: '002', label: 'RHYTHM', title: 'Schedule' },
  tasks: { index: '003', label: 'FOCUS', title: 'Tasks' },
  finance: { index: '004', label: 'CONTEXT', title: 'Finance' },
  social: { index: '005', label: 'SIGNAL', title: 'Social' },
  assistant: { index: '006', label: 'GUIDANCE', title: 'Assistant' },
}

export function Topbar({ view }: TopbarProps) {
  const { configured, user, signOut } = useAuth()
  const meta = viewMeta[view]

  const logout = async () => {
    const error = await signOut()
    if (error) window.alert(error)
  }

  return (
    <header className="topbar editorial-topbar">
      <div className="topbar-copy">
        <div className="topbar-index" aria-label={meta.label}>
          <span>LEVEL {meta.index}</span>
          <i aria-hidden="true">/</i>
          <strong>{meta.label}</strong>
        </div>
        <div className="topbar-title-row">
          <div>
            <span className="topbar-kicker">MI-D / DAILY SYSTEM</span>
            <h1>{meta.title}</h1>
          </div>
          <span className="topbar-mark" aria-hidden="true">MI-D</span>
        </div>
      </div>

      <div className="profile-chip glass-panel">
        <span className="avatar">{user?.email?.slice(0, 1).toUpperCase() ?? 'M'}</span>
        <span className="profile-email">{user?.email ?? 'Personal workspace'}</span>
        {configured && user && <button className="text-button" type="button" onClick={() => void logout()}>Sign out</button>}
      </div>
    </header>
  )
}
