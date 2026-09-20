import type { View } from '../../types'

interface TopbarProps {
  view: View
}

export function Topbar({ view }: TopbarProps) {
  const pageTitle = view === 'dashboard' ? 'Dashboard' : `${view[0].toUpperCase()}${view.slice(1)}`

  return (
    <header className="topbar">
      <div>
        <span className="topbar-kicker">MI-D DAILY</span>
        <h1>{pageTitle}</h1>
      </div>
      <div className="profile-chip">
        <span className="avatar">M</span>
        <span>Personal workspace</span>
      </div>
    </header>
  )
}
