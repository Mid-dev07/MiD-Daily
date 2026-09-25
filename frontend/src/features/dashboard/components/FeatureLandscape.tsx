import type { View } from '../../../types'
import { MiDIcon, type MiDIconName } from '../../../components/ui/MiDIcon'

interface FeatureLandscapeProps {
  activeView: View
  onNavigate: (view: View) => void
}

type CompassPosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface WorkspaceFeature {
  id: View
  index: string
  label: string
  meta: string
  icon: MiDIconName
  position?: CompassPosition
}

const features: WorkspaceFeature[] = [
  { id: 'dashboard', index: '001', label: 'Today', meta: 'orientation & daily signals', icon: 'home' },
  { id: 'schedule', index: '002', label: 'Schedule', meta: 'time, rhythm & commitments', icon: 'clock', position: 'n' },
  { id: 'insights', index: '008', label: 'Insights', meta: 'patterns & signals', icon: 'chart', position: 'ne' },
  { id: 'tasks', index: '003', label: 'Tasks', meta: 'focus, progress & priorities', icon: 'check', position: 'e' },
  { id: 'habits', index: '009', label: 'Habits', meta: 'rhythm & consistency', icon: 'habit', position: 'se' },
  { id: 'finance', index: '004', label: 'Finance', meta: 'spending & resources', icon: 'wallet', position: 's' },
  { id: 'social', index: '005', label: 'Social', meta: 'digital pulse & signals', icon: 'pulse', position: 'sw' },
  { id: 'assistant', index: '006', label: 'Assistant', meta: 'guided next actions', icon: 'spark', position: 'w' },
  { id: 'profile', index: '007', label: 'Profile', meta: 'identity & preferences', icon: 'user', position: 'nw' },
]

const compassFeatures = features.filter((feature) => feature.position)

export function FeatureLandscape({ activeView, onNavigate }: FeatureLandscapeProps) {
  const activeFeature = features.find((feature) => feature.id === activeView) ?? features[0]
  const activeIsToday = activeView === 'dashboard'

  return (
    <section className="feature-landscape" aria-labelledby="feature-landscape-title">
      <div className="feature-landscape-heading">
        <div>
          <div className="feature-level" aria-hidden="true">
            <span>FIELD GUIDE 001</span>
            <i>/</i>
            <strong>MID DAILY</strong>
          </div>
          <span className="section-kicker">WORKSPACE COMPASS</span>
          <h3 id="feature-landscape-title">Everything has a place.</h3>
          <p>
            Use the compass as your spatial navigator. The center always returns to Today;
            the surrounding points take you directly into each workspace.
          </p>
        </div>
        <span className="feature-landscape-hint">Click a point to enter</span>
      </div>

      <div className="feature-compass-status" aria-live="polite">
        <span className="feature-compass-status-label">{activeIsToday ? 'HOME' : 'YOU ARE HERE'}</span>
        <strong>{activeFeature.index} · {activeFeature.label}</strong>
        <span>{activeFeature.meta}</span>
      </div>

      <div className="feature-scene" aria-label={`Workspace compass. Current workspace: ${activeFeature.label}`}>
        <div className="feature-compass-orbit feature-compass-orbit-a" aria-hidden="true" />
        <div className="feature-compass-orbit feature-compass-orbit-b" aria-hidden="true" />
        <div className="feature-compass-crosshair feature-compass-crosshair-x" aria-hidden="true" />
        <div className="feature-compass-crosshair feature-compass-crosshair-y" aria-hidden="true" />

        {compassFeatures.map((feature) => {
          const active = activeView === feature.id
          return (
            <button
              key={feature.id}
              type="button"
              className={active ? `feature-node feature-node--${feature.position} is-active` : `feature-node feature-node--${feature.position}`}
              data-feature={feature.id}
              aria-current={active ? 'page' : undefined}
              aria-label={`Open ${feature.label} workspace`}
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-node-label">
                <span className="feature-node-icon"><MiDIcon name={feature.icon} size={20} /></span>
                <span className="feature-node-title">{feature.label}</span>
                <span className="feature-node-index">{feature.index}</span>
              </span>
              <span className="feature-node-meta">{feature.meta}</span>
              <span className="feature-node-status">{active ? 'HERE' : 'OPEN'}</span>
            </button>
          )
        })}

        <button
          className={activeIsToday ? 'feature-core is-active' : 'feature-core'}
          type="button"
          onClick={() => onNavigate('dashboard')}
          aria-label="Return to Today workspace"
          aria-current={activeIsToday ? 'page' : undefined}
        >
          <span className="feature-core-label">
            <strong>M</strong>
            <span>001 · Today</span>
          </span>
        </button>

        <div className="feature-scene-caption" aria-hidden="true">
          <span className="scene-caption-line" />
          <span>{activeIsToday ? 'CENTER' : 'CURRENT WORKSPACE'}</span>
          <strong>{activeFeature.index} · {activeFeature.label}</strong>
        </div>
      </div>

      <nav className="feature-directory" aria-label="All MiD Daily workspaces">
        {features.map((feature) => {
          const active = activeView === feature.id
          return (
            <button
              key={feature.id}
              type="button"
              className={active ? 'feature-directory-item is-active' : 'feature-directory-item'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-directory-index">{feature.index}</span>
              <span className="feature-directory-copy">
                <strong>{feature.label}</strong>
                <small>{feature.meta}</small>
              </span>
              <span className="feature-directory-mark" aria-hidden="true">↗</span>
            </button>
          )
        })}
      </nav>
    </section>
  )
}
