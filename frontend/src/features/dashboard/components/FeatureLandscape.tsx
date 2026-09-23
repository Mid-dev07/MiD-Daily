import { useState } from 'react'
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
  const [focusedFeature, setFocusedFeature] = useState<View | null>(null)
  const focused = features.find((feature) => feature.id === focusedFeature)

  return (
    <section className={focused ? 'feature-landscape motion-card is-interacting' : 'feature-landscape motion-card'} aria-labelledby="feature-landscape-title">
      <div className="feature-landscape-heading">
        <div>
          <div className="feature-level" aria-hidden="true"><span>LVLL 002</span><i>/</i><strong>LANDSCAPE</strong></div>
          <span className="section-kicker">YOUR DIGITAL LANDSCAPE</span>
          <h3 id="feature-landscape-title"><span>One place.</span> <em>Different rhythms.</em></h3>
          <p>Explore the parts of your day as living pieces of the same environment.</p>
        </div>
        <span className="feature-landscape-hint"><span>Explore the system</span><strong>↗</strong></span>
      </div>

      <div className="feature-scene">
        {features.map((feature) => {
          const isFocused = focusedFeature === feature.id
          const isDimmed = Boolean(focusedFeature) && !isFocused
          const classes = [
            'feature-node',
            activeView === feature.id ? 'is-active' : '',
            isFocused ? 'is-focused' : '',
            isDimmed ? 'is-dimmed' : '',
          ].filter(Boolean).join(' ')

          return (
          <button
            key={feature.id}
            type="button"
            className={classes}
            data-feature={feature.id}
            aria-current={activeView === feature.id ? 'page' : undefined}
            onPointerEnter={() => setFocusedFeature(feature.id)}
            onPointerLeave={() => setFocusedFeature(null)}
            onFocus={() => setFocusedFeature(feature.id)}
            onBlur={() => setFocusedFeature(null)}
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

        <div className={focused ? 'feature-core is-focused' : 'feature-core'} aria-hidden="true">
          <div className="feature-core-glass" />
          <div className="feature-core-label">
            <strong>{focused?.label ?? 'MiD'}</strong>
            <span>{focused?.meta ?? 'daily rhythm'}</span>
            {focused && <small>select to open</small>}
          </div>
        </div>

        <div className="feature-scene-caption" aria-hidden="true">
          <span className="scene-caption-line" />
          <span>calm systems · natural flow</span>
          <strong>06 modules</strong>
        </div>
      </div>
    </section>
  )
}
