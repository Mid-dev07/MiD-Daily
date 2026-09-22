import type { EnvironmentLocation, WeatherCondition, WeatherSnapshot } from './types'

const WEATHER_BASE_URL = 'https://api.open-meteo.com/v1/forecast'
const CACHE_KEY = 'mid-daily.environment.weather.v1'
const CACHE_MAX_AGE_MS = 15 * 60 * 1000
const CACHE_STALE_AFTER_MS = 2 * 60 * 60 * 1000

interface OpenMeteoResponse {
  timezone?: string
  current?: {
    time?: string
    temperature_2m?: number
    apparent_temperature?: number
    weather_code?: number
    cloud_cover?: number
    precipitation?: number
    rain?: number
    visibility?: number
    wind_speed_10m?: number
    is_day?: number
  }
  daily?: {
    sunrise?: string[]
    sunset?: string[]
  }
}

interface WeatherCacheRecord {
  locationKey: string
  weather: WeatherSnapshot
}

function locationKey(location: EnvironmentLocation) {
  return [location.latitude.toFixed(2), location.longitude.toFixed(2)].join(',')
}

function safeNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function weatherConditionFromCode(code: number): WeatherCondition {
  if (code === 0) return 'clear'
  if (code === 1) return 'partly-cloudy'
  if (code === 2 || code === 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'drizzle'
  if (code >= 61 && code <= 65) return 'rain'
  if (code === 66 || code === 67) return 'heavy-rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return 'showers'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  return 'partly-cloudy'
}

export function weatherLabel(condition: WeatherCondition) {
  const labels: Record<WeatherCondition, string> = {
    clear: 'Clear',
    'partly-cloudy': 'Partly cloudy',
    cloudy: 'Cloudy',
    fog: 'Fog',
    drizzle: 'Drizzle',
    rain: 'Rain',
    'heavy-rain': 'Heavy rain',
    storm: 'Storm',
    snow: 'Snow',
    showers: 'Showers',
  }
  return labels[condition]
}

function readCache(): WeatherCacheRecord | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WeatherCacheRecord
    if (!parsed?.weather || typeof parsed.locationKey !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(record: WeatherCacheRecord) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(record))
  } catch {
    // Environment remains functional without local persistence.
  }
}

export function getCachedWeather(location: EnvironmentLocation) {
  const record = readCache()
  if (!record || record.locationKey !== locationKey(location)) return null
  return record.weather
}

export function getCachedWeatherAge(location: EnvironmentLocation) {
  const cached = getCachedWeather(location)
  return cached ? Date.now() - cached.fetchedAt : Infinity
}

export async function fetchWeather(location: EnvironmentLocation, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const cached = getCachedWeather(location)
  const age = getCachedWeatherAge(location)
  if (cached && age < CACHE_MAX_AGE_MS) return cached

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'weather_code',
      'cloud_cover',
      'precipitation',
      'rain',
      'visibility',
      'wind_speed_10m',
      'is_day',
    ].join(','),
    daily: 'sunrise,sunset',
    forecast_days: '1',
    timezone: 'auto',
  })

  const response = await fetch(`${WEATHER_BASE_URL}?${params.toString()}`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) throw new Error(`Weather service returned HTTP ${response.status}.`)

  const data = await response.json() as OpenMeteoResponse
  if (!data.current) throw new Error('Weather service returned no current conditions.')

  const weatherCode = safeNumber(data.current.weather_code, 2)
  const weather: WeatherSnapshot = {
    temperatureC: safeNumber(data.current.temperature_2m, 0),
    apparentTemperatureC: safeNumber(data.current.apparent_temperature, safeNumber(data.current.temperature_2m, 0)),
    weatherCode,
    condition: weatherConditionFromCode(weatherCode),
    cloudCover: Math.min(100, Math.max(0, safeNumber(data.current.cloud_cover, 0))),
    precipitationMm: Math.max(0, safeNumber(data.current.precipitation, 0)),
    rainMm: Math.max(0, safeNumber(data.current.rain, 0)),
    visibilityM: Math.max(0, safeNumber(data.current.visibility, 10000)),
    windSpeedKmh: Math.max(0, safeNumber(data.current.wind_speed_10m, 0)),
    isDay: safeNumber(data.current.is_day, 1) === 1,
    timezone: data.timezone || location.timezone,
    sunrise: data.daily?.sunrise?.[0] ?? null,
    sunset: data.daily?.sunset?.[0] ?? null,
    fetchedAt: Date.now(),
  }

  writeCache({ locationKey: locationKey(location), weather })
  return weather
}

export function weatherCacheIsStale(weather: WeatherSnapshot | null) {
  return Boolean(weather && Date.now() - weather.fetchedAt >= CACHE_STALE_AFTER_MS)
}
