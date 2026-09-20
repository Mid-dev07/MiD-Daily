import type { View } from '../types'

interface SidebarProps {
  activeView: View
  onNavigate: (view: View) => void
}

const navigation: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'schedule', label: 'Schedule', icon: '◷' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'finance', label: 'Finance', icon: 'Rp' },
]

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div>
          <strong>MiD-Daily</strong>
          <span>Daily management</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? 'nav-item is-active' : 'nav-item'}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span>Local foundation mode</span>
      </div>
    </aside>
  )
}
