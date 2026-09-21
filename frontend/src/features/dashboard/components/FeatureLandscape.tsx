import type { CSSProperties } from 'react'
import type { View } from '../../../types'

interface FeatureLandscapeProps {
  activeView: View
  onNavigate: (view: View) => void
}

const features: Array<{ id: View; label: string; meta: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', meta: 'your daily overview', icon: '⌂' },
  { id: 'schedule', label: 'Schedule', meta: 'time & rhythm', icon: '◷' },
  { id: 'tasks', label: 'Tasks', meta: 'focus & progress', icon: '✓' },
  { id: 'finance', label: 'Finance', meta: 'money in context', icon: 'Rp' },
  { id: 'social', label: 'Social', meta: 'digital pulse', icon: '◎' },
  { id: 'assistant', label: 'Assistant', meta: 'guided next step', icon: '✦' },
]

export function FeatureLandscape({ activeView, onNavigate }: FeatureLandscapeProps) {
  return (
    <section className="feature-landscape motion-card" aria-labelledby="feature-landscape-title">
      <div className="feature-landscape-heading">
        <div>
          <span className="section-kicker">EXPLORE YOUR DAY</span>
          <h3 id="feature-landscape-title">Everything grows from one place.</h3>
          <p>Move through MiD Daily like a landscape: each feature has its own place, depth, and state.</p>
        </div>
        <span className="feature-landscape-hint">Hover · feel · enter</span>
      </div>

      <div className="feature-orbit" aria-label="MiD Daily features">
        <div className="feature-core" aria-hidden="true">
          <div className="feature-core-label">
            <strong>MiD</strong>
            <span>daily rhythm</span>
          </div>
        </div>

        {features.map((feature) => {
          const style = {} as CSSProperties
          return (
            <button
              key={feature.id}
              type="button"
              className={activeView === feature.id ? 'feature-node is-active' : 'feature-node'}
              data-feature={feature.id}
              style={style}
              aria-current={activeView === feature.id ? 'page' : undefined}
              onClick={() => onNavigate(feature.id)}
            >
              <span className="feature-node-label">
                <span className="feature-node-icon" aria-hidden="true">{feature.icon}</span>
                <span className="feature-node-title">{feature.label}</span>
              </span>
              <span className="feature-node-meta">{feature.meta}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
