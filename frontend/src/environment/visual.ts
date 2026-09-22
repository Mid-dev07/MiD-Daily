import type { CSSProperties } from 'react'
import { weatherLabel } from './weather'
import type { EnvironmentState } from './types'

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function screenX(azimuth: number) {
  const normalized = ((azimuth % 360) + 360) % 360
  return clamp(50 + ((normalized - 180) / 90) * 40, 4, 96)
}

function screenY(altitude: number) {
  return clamp(70 - ((altitude + 6) / 86) * 62, 5, 94)
}

export function environmentCssVariables(environment: EnvironmentState): CSSProperties {
  const sun = environment.sun
  const moon = environment.moon
  return {
    '--env-sun-x': `${screenX(sun.azimuth)}%`,
    '--env-sun-y': `${screenY(sun.altitude)}%`,
    '--env-moon-x': `${screenX(moon.azimuth)}%`,
    '--env-moon-y': `${screenY(moon.altitude)}%`,
    '--env-light-angle': `${(sun.azimuth + 90) % 360}deg`,
    '--env-light-intensity': String(environment.visual.lightIntensity),
    '--env-cloud-opacity': String(environment.visual.cloudOpacity),
    '--env-fog-opacity': String(environment.visual.fogOpacity),
    '--env-rain-opacity': String(environment.visual.precipitationOpacity),
    '--env-star-opacity': String(environment.visual.starOpacity),
    '--env-sun-opacity': String(environment.visual.sunOpacity),
    '--env-moon-opacity': String(environment.visual.moonOpacity),
    '--env-horizon-opacity': String(0.24 + environment.visual.lightIntensity * 0.16),
    '--env-vignette-opacity': String(0.16 + (1 - environment.visual.lightIntensity) * 0.18),
  } as CSSProperties
}

export function environmentLabel(environment: EnvironmentState) {
  if (environment.weather) return `${Math.round(environment.weather.temperatureC)}° · ${weatherLabel(environment.weather.condition)}`
  const labels = {
    night: 'Night',
    dawn: 'Dawn',
    morning: 'Morning',
    day: 'Day',
    'golden-hour': 'Golden hour',
    dusk: 'Dusk',
  } as const
  return labels[environment.dayPhase]
}

export function weatherGlyph(environment: EnvironmentState) {
  const condition = environment.weather?.condition
  if (condition === 'storm') return 'ϟ'
  if (condition === 'heavy-rain' || condition === 'rain' || condition === 'showers') return '∿'
  if (condition === 'drizzle') return '⋰'
  if (condition === 'fog') return '≋'
  if (condition === 'snow') return '·'
  if (condition === 'cloudy' || condition === 'partly-cloudy') return '☁'
  if (condition === 'clear') return environment.dayPhase === 'night' ? '☾' : '☼'
  return environment.dayPhase === 'night' ? '☾' : '◌'
}
