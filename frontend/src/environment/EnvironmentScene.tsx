import { environmentCssVariables } from './visual'
import type { EnvironmentState } from './types'

interface EnvironmentSceneProps {
  environment: EnvironmentState
}

export function EnvironmentScene({ environment }: EnvironmentSceneProps) {
  const vars = environmentCssVariables(environment)

  return (
    <div
      className="environment-scene"
      data-day-phase={environment.dayPhase}
      data-weather={environment.weather?.condition ?? 'clear'}
      style={vars}
      aria-hidden="true"
    >
      <div className="environment-sky" />
      <picture className="environment-photograph">
        <source
          media="(max-width: 760px)"
          srcSet="https://images.unsplash.com/photo-1707500879906-a5d6268e09d8?auto=format&fm=avif&q=56&w=900&fit=crop&crop=entropy"
          type="image/avif"
        />
        <img
          src="https://images.unsplash.com/photo-1707500879906-a5d6268e09d8?auto=format&fm=avif&q=56&w=1600&fit=crop&crop=entropy"
          alt=""
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <div className="environment-light-shafts" />
      <div className="environment-fog" />
      <div className="environment-vignette" />
    </div>
  )
}
