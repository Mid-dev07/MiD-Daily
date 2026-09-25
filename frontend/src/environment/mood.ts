import type { DayPhase, WeatherCondition } from './types'

export interface EnvironmentMood {
  lightMultiplier: number
  warmth: number
  skyCoolness: number
  natureSaturation: number
  beam: number
  airDensity: number
  wetness: number
  contrast: number
}

const phaseMood: Record<DayPhase, Omit<EnvironmentMood, 'lightMultiplier' | 'wetness'>> = {
  night: { warmth: 0.08, skyCoolness: 0.9, natureSaturation: 0.72, beam: 0.03, airDensity: 0.12, contrast: 0.78 },
  dawn: { warmth: 0.82, skyCoolness: 0.34, natureSaturation: 0.86, beam: 0.72, airDensity: 0.16, contrast: 0.88 },
  morning: { warmth: 0.58, skyCoolness: 0.22, natureSaturation: 0.96, beam: 0.5, airDensity: 0.08, contrast: 0.98 },
  day: { warmth: 0.42, skyCoolness: 0.2, natureSaturation: 0.92, beam: 0.34, airDensity: 0.06, contrast: 1 },
  'golden-hour': { warmth: 0.94, skyCoolness: 0.08, natureSaturation: 0.98, beam: 0.82, airDensity: 0.12, contrast: 0.94 },
  dusk: { warmth: 0.74, skyCoolness: 0.48, natureSaturation: 0.82, beam: 0.26, airDensity: 0.2, contrast: 0.84 },
}

const weatherMood: Record<WeatherCondition, Pick<EnvironmentMood, 'lightMultiplier' | 'skyCoolness' | 'natureSaturation' | 'beam' | 'airDensity' | 'wetness' | 'contrast' | 'warmth'>> = {
  clear: { lightMultiplier: 1, warmth: 0.04, skyCoolness: -0.05, natureSaturation: 1, beam: 1.08, airDensity: 0.02, wetness: 0, contrast: 1.02 },
  'partly-cloudy': { lightMultiplier: 0.9, warmth: 0.0, skyCoolness: 0.04, natureSaturation: 0.98, beam: 0.78, airDensity: 0.08, wetness: 0.05, contrast: 0.98 },
  cloudy: { lightMultiplier: 0.78, warmth: -0.04, skyCoolness: 0.14, natureSaturation: 0.94, beam: 0.34, airDensity: 0.18, wetness: 0.16, contrast: 0.9 },
  fog: { lightMultiplier: 0.7, warmth: 0.0, skyCoolness: 0.1, natureSaturation: 0.88, beam: 0.12, airDensity: 0.78, wetness: 0.12, contrast: 0.72 },
  drizzle: { lightMultiplier: 0.74, warmth: -0.02, skyCoolness: 0.11, natureSaturation: 0.98, beam: 0.22, airDensity: 0.24, wetness: 0.52, contrast: 0.86 },
  rain: { lightMultiplier: 0.65, warmth: -0.05, skyCoolness: 0.16, natureSaturation: 1.02, beam: 0.12, airDensity: 0.34, wetness: 0.82, contrast: 0.82 },
  'heavy-rain': { lightMultiplier: 0.52, warmth: -0.08, skyCoolness: 0.22, natureSaturation: 0.94, beam: 0.05, airDensity: 0.5, wetness: 1, contrast: 0.72 },
  storm: { lightMultiplier: 0.42, warmth: -0.14, skyCoolness: 0.3, natureSaturation: 0.84, beam: 0.015, airDensity: 0.58, wetness: 0.94, contrast: 0.68 },
  snow: { lightMultiplier: 0.68, warmth: 0.06, skyCoolness: 0.18, natureSaturation: 0.82, beam: 0.16, airDensity: 0.22, wetness: 0.42, contrast: 0.8 },
  showers: { lightMultiplier: 0.72, warmth: -0.03, skyCoolness: 0.13, natureSaturation: 1.0, beam: 0.2, airDensity: 0.28, wetness: 0.64, contrast: 0.84 },
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function composeEnvironmentMood(dayPhase: DayPhase, condition: WeatherCondition | null): EnvironmentMood {
  const phase = phaseMood[dayPhase]
  const weather = condition ? weatherMood[condition] : weatherMood.clear

  return {
    lightMultiplier: weather.lightMultiplier,
    warmth: clamp(phase.warmth + weather.warmth, 0, 1),
    skyCoolness: clamp(phase.skyCoolness + weather.skyCoolness, 0, 1),
    natureSaturation: clamp(phase.natureSaturation * weather.natureSaturation, 0.55, 1.08),
    beam: clamp(phase.beam * weather.beam, 0, 1),
    airDensity: clamp(phase.airDensity + weather.airDensity, 0, 1),
    wetness: clamp(weather.wetness, 0, 1),
    contrast: clamp(phase.contrast * weather.contrast, 0.55, 1.05),
  }
}

export function environmentLightDirection(azimuth: number, altitude: number): [number, number, number] {
  const azimuthRad = (azimuth * Math.PI) / 180
  const altitudeRad = (Math.max(-4, Math.min(78, altitude)) * Math.PI) / 180
  const horizontal = Math.cos(altitudeRad)

  return [
    Math.sin(azimuthRad) * horizontal,
    Math.max(0.16, Math.sin(altitudeRad)),
    Math.cos(azimuthRad) * horizontal,
  ]
}
