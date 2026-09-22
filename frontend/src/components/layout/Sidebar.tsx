import type { View } from '../../types'

interface SidebarProps {
  activeView: View
  onNavigate: (view: View) => void
}

const navigation: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Today', icon: '⌂' },
  { id: 'schedule', label: 'Schedule', icon: '◷' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'finance', label: 'Finance', icon: 'Rp' },
  { id: 'social', label: 'Social', icon: '◎' },
  { id: 'assistant', label: 'Assistant', icon: '✦' },
  { id: 'profile', label: 'Profile', icon: '●' },
  { id: 'insights', label: 'Insights', icon: '↗' },
]

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">M</div>
        <div className="brand-copy">
          <strong>MiD-Daily</strong>
          <span>Daily workspace</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? 'nav-item is-active' : 'nav-item'}
            type="button"
            aria-current={activeView === item.id ? 'page' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
