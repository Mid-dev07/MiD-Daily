import { useEffect, useRef } from 'react'
import type { View } from '../../types'
import { MiDIcon, type MiDIconName } from '../ui/MiDIcon'
import { MiDMark } from '../ui/MiDMark'

interface SidebarProps {
  activeView: View
  onNavigate: (view: View) => void
}

const navigation: Array<{ id: View; label: string; icon: MiDIconName }> = [
  { id: 'dashboard', label: 'Today', icon: 'home' },
  { id: 'schedule', label: 'Schedule', icon: 'clock' },
  { id: 'tasks', label: 'Tasks', icon: 'check' },
  { id: 'finance', label: 'Finance', icon: 'wallet' },
  { id: 'social', label: 'Social', icon: 'pulse' },
  { id: 'assistant', label: 'Assistant', icon: 'spark' },
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'insights', label: 'Insights', icon: 'chart' },
  { id: 'habits', label: 'Habits', icon: 'habit' },
]

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const activeNavigationRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeNavigationRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
  }, [activeView])

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" aria-hidden="true"><MiDMark size={34} /></div>
        <div className="brand-copy">
          <strong>MiD</strong>
          <span>your day, in one place</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Primary navigation">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={activeView === item.id ? 'nav-item is-active' : 'nav-item'}
            type="button"
            aria-current={activeView === item.id ? 'page' : undefined}
            ref={activeView === item.id ? activeNavigationRef : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon"><MiDIcon name={item.icon} size={17} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
