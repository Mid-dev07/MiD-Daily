import type { View } from '../../../types'
import { MiDIcon, type MiDIconName } from '../../../components/ui/MiDIcon'

interface FeatureLandscapeProps {
  activeView: View
  onNavigate: (view: View) => void
}

const features: Array<{ id: View; index: string; label: string; meta: string; icon: MiDIconName }> = [
  { id: 'dashboard', index: '01', label: 'Today', meta: 'orientation & daily signals', icon: 'home' },
  { id: 'schedule', index: '02', label: 'Schedule', meta: 'time, rhythm & commitments', icon: 'clock' },
  { id: 'tasks', index: '03', label: 'Tasks', meta: 'focus, progress & priorities', icon: 'check' },
  { id: 'finance', index: '04', label: 'Finance', meta: 'spending, budgets & resources', icon: 'wallet' },
  { id: 'social', index: '05', label: 'Social', meta: 'read-only digital pulse', icon: 'pulse' },
  { id: 'assistant', index: '06', label: 'Assistant', meta: 'guided next actions', icon: 'spark' },
  { id: 'profile', index: '07', label: 'Profile', meta: 'identity & preferences', icon: 'user' },
  { id: 'insights', index: '08', label: 'Insights', meta: 'current patterns & signals', icon: 'chart' },
  { id: 'habits', index: '09', label: 'Habits', meta: 'rhythm & consistency', icon: 'habit' },
]

const spatialFeatures = features.slice(0, 6)

export function FeatureLandscape({ activeView, onNavigate }: FeatureLandscapeProps) {
  const activeFeature = features.find((feature) => feature.id === activeView) ?? features[0]

  return (
    <section className="feature-landscape" aria-labelledby="feature-landscape-title">
      <div className="feature-landscape-heading">
        <div>
          <div className="feature-level" aria-hidden="true"><span>FIELD GUIDE 001</span><i>/</i><strong>MIĐ DAILY</strong></div>
          <span className="section-kicker">SYSTEM COMPASS</span>
          <h3 id="feature-landscape-title">Everything has a place.</h3>
          <p>Move through your day from one living workspace. Focused modules catch light; the rest recede into the environment.</p>
        </div>
        <span className="feature-landscape-hint">Hover a workspace</span>
      </div>

      <div className="feature-scene" aria-label="Core workspace compass">
        {spatialFeatures.map((feature) => {
          const active = activeView === feature.id
          return (
            <button
              key={feature.id}
              type="button"
              className={active ? 'feature-node is-active' : 'feature-node'}
              data-feature={feature.id}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-node-label">
                <span className="feature-node-icon"><MiDIcon name={feature.icon} size={20} /></span>
                <span className="feature-node-title">{feature.label}</span>
              </span>
              <span className="feature-node-meta">{feature.meta}</span>
            </button>
          )
        })}

        <button className="feature-core" type="button" onClick={() => onNavigate('dashboard')} aria-label="Open Today dashboard">
          <span className="feature-core-label">
            <strong>M</strong>
            <span>{activeFeature.label}</span>
          </span>
        </button>

        <div className="feature-scene-caption" aria-hidden="true">
          <span className="scene-caption-line" />
          <span>ACTIVE TERRAIN</span>
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
