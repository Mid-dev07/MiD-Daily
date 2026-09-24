import { useEffect, useRef } from 'react'
import type { View } from '../../types'
import { MiDIcon, type MiDIconName } from '../ui/MiDIcon'

interface SidebarProps {
  activeView: View
  onNavigate: (view: View) => void
}

const navigation: Array<{ id: View; label: string; icon: MiDIconName; index: string }> = [
  { id: 'dashboard', label: 'Today', icon: 'home', index: '001' },
  { id: 'schedule', label: 'Schedule', icon: 'clock', index: '002' },
  { id: 'tasks', label: 'Tasks', icon: 'check', index: '003' },
  { id: 'finance', label: 'Finance', icon: 'wallet', index: '004' },
  { id: 'social', label: 'Social', icon: 'pulse', index: '005' },
  { id: 'assistant', label: 'Assistant', icon: 'spark', index: '006' },
  { id: 'profile', label: 'Profile', icon: 'user', index: '007' },
  { id: 'insights', label: 'Insights', icon: 'chart', index: '008' },
  { id: 'habits', label: 'Habits', icon: 'habit', index: '009' },
]

export function Sidebar({ activeView, onNavigate }: SidebarProps) {
  const activeNavigationRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeNavigationRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' })
  }, [activeView])

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
            ref={activeView === item.id ? activeNavigationRef : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-index" aria-hidden="true">{item.index}</span>
            <span className="nav-icon"><MiDIcon name={item.icon} size={17} /></span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
