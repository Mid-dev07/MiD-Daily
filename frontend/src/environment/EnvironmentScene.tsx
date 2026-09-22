import { environmentCssVariables } from './visual'
import type { EnvironmentState } from './types'

const stars = [
  [7, 18, 0.7], [13, 30, 0.45], [19, 11, 0.52], [24, 42, 0.6], [31, 20, 0.38],
  [37, 34, 0.64], [43, 13, 0.48], [49, 28, 0.55], [56, 10, 0.4], [62, 38, 0.72],
  [68, 18, 0.34], [74, 45, 0.58], [81, 25, 0.48], [88, 14, 0.68], [93, 36, 0.4],
  [11, 55, 0.52], [28, 61, 0.42], [46, 54, 0.36], [63, 62, 0.55], [77, 58, 0.43],
  [84, 72, 0.32], [96, 63, 0.52], [54, 71, 0.33], [36, 75, 0.46],
] as const

interface EnvironmentSceneProps {
  environment: EnvironmentState
}

export function EnvironmentScene({ environment }: EnvironmentSceneProps) {
  const vars = environmentCssVariables(environment)

  return (
    <div className="environment-scene" data-day-phase={environment.dayPhase} data-weather={environment.weather?.condition ?? 'clear'} style={vars} aria-hidden="true">
      <div className="environment-sky" />
      <div className="environment-stars">
        {stars.map(([left, top, opacity], index) => (
          <i key={index} style={{ left: left + '%', top: top + '%', opacity }} />
        ))}
      </div>
      <div className="environment-clouds" />
      <div className="environment-sun" />
      <div className="environment-moon" />
      <div className="environment-horizon" />
      <div className="environment-fog" />
      <div className="environment-rain" />
      <div className="environment-vignette" />
      <span className="environment-attribution">
        {environment.weather ? 'Weather data: Open-Meteo · CC BY 4.0' : 'MiD local environment'}
      </span>
    </div>
  )
}
