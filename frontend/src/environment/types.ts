export type EnvironmentStatus = 'idle' | 'loading' | 'ready' | 'degraded'
export type LocationSource = 'browser' | 'saved' | 'neutral'
export type DayPhase = 'night' | 'dawn' | 'morning' | 'day' | 'golden-hour' | 'dusk'
export type WeatherCondition = 'clear' | 'partly-cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'heavy-rain' | 'storm' | 'snow' | 'showers'

export interface EnvironmentLocation {
  latitude: number
  longitude: number
  timezone: string
  source: LocationSource
}

export interface WeatherSnapshot {
  temperatureC: number
  apparentTemperatureC: number
  weatherCode: number
  condition: WeatherCondition
  cloudCover: number
  precipitationMm: number
  rainMm: number
  visibilityM: number
  windSpeedKmh: number
  isDay: boolean
  timezone: string
  sunrise: string | null
  sunset: string | null
  fetchedAt: number
}

export interface SolarPosition {
  azimuth: number
  altitude: number
  sunrise: string | null
  sunset: string | null
}

export interface LunarPosition {
  azimuth: number
  altitude: number
  phase: number
  illumination: number
}

export interface EnvironmentVisualState {
  lightIntensity: number
  cloudOpacity: number
  fogOpacity: number
  precipitationOpacity: number
  starOpacity: number
  sunOpacity: number
  moonOpacity: number
}

export interface EnvironmentState {
  status: EnvironmentStatus
  location: EnvironmentLocation | null
  weather: WeatherSnapshot | null
  sun: SolarPosition
  moon: LunarPosition
  dayPhase: DayPhase
  visual: EnvironmentVisualState
  updatedAt: number
  error: string | null
}
