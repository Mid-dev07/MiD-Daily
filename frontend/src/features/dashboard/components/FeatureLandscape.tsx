import type { View } from '../../../types'

interface FeatureLandscapeProps {
  activeView: View
  onNavigate: (view: View) => void
}

const features: Array<{ id: View; index: string; label: string; meta: string }> = [
  { id: 'dashboard', index: '01', label: 'Today', meta: 'orientation & daily signals' },
  { id: 'schedule', index: '02', label: 'Schedule', meta: 'time, rhythm & commitments' },
  { id: 'tasks', index: '03', label: 'Tasks', meta: 'focus, progress & priorities' },
  { id: 'finance', index: '04', label: 'Finance', meta: 'spending, budgets & resources' },
  { id: 'social', index: '05', label: 'Social', meta: 'read-only digital pulse' },
  { id: 'assistant', index: '06', label: 'Assistant', meta: 'guided next actions' },
  { id: 'profile', index: '07', label: 'Profile', meta: 'identity & preferences' },
  { id: 'insights', index: '08', label: 'Insights', meta: 'current patterns & signals' },
  { id: 'habits', index: '09', label: 'Habits', meta: 'rhythm & consistency' },
]

export function FeatureLandscape({ activeView, onNavigate }: FeatureLandscapeProps) {
  return (
    <section className="feature-landscape" aria-labelledby="feature-landscape-title">
      <div className="feature-landscape-heading">
        <div>
          <div className="feature-level" aria-hidden="true"><span>FIELD GUIDE 001</span><i>/</i><strong>MIÐ DAILY</strong></div>
          <span className="section-kicker">NAVIGATE THE ENVIRONMENT</span>
          <h3 id="feature-landscape-title">Everything has a place.</h3>
          <p>Move through your day from one calm workspace. Each module belongs to the same system, but serves a different purpose.</p>
        </div>
        <span className="feature-landscape-hint">Select a workspace</span>
      </div>

      <nav className="feature-directory" aria-label="MiD Daily workspaces">
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
