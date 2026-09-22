import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fallbackLunarPosition, fallbackSolarPosition, inferDayPhase, lunarPosition, solarPosition } from './astronomy'
import { permissionState, readStoredLocation, requestBrowserLocation, saveLocation } from './location'
import { fetchWeather, getCachedWeather, weatherCacheIsStale } from './weather'
import type { EnvironmentState, EnvironmentVisualState, WeatherSnapshot } from './types'

function createVisualState(environment: Pick<EnvironmentState, 'dayPhase' | 'weather' | 'sun' | 'moon'>): EnvironmentVisualState {
  const cloud = environment.weather?.cloudCover ? environment.weather.cloudCover / 100 : 0
  const condition = environment.weather?.condition

  let lightIntensity = environment.sun.altitude > -6
    ? Math.min(1, Math.max(0.18, (environment.sun.altitude + 8) / 55))
    : 0.08

  if (environment.dayPhase === 'golden-hour') lightIntensity *= 0.82
  if (condition === 'cloudy' || condition === 'partly-cloudy') lightIntensity *= 0.82
  if (condition === 'fog') lightIntensity *= 0.72
  if (condition === 'rain' || condition === 'showers') lightIntensity *= 0.65
  if (condition === 'heavy-rain') lightIntensity *= 0.5
  if (condition === 'storm') lightIntensity *= 0.38

  const rainBase = environment.weather
    ? Math.max(
      environment.weather.rainMm / 4,
      environment.weather.precipitationMm / 6,
      condition === 'heavy-rain' ? 0.7 : condition === 'storm' ? 0.58 : condition === 'rain' ? 0.44 : condition === 'showers' ? 0.3 : 0,
    )
    : 0

  const fogBase = environment.weather
    ? condition === 'fog'
      ? Math.max(0.34, 1 - environment.weather.visibilityM / 10000)
      : 0
    : 0

  const night = environment.dayPhase === 'night' || environment.dayPhase === 'dusk'
  const starBase = environment.dayPhase === 'night'
    ? 0.82 * (1 - cloud * 0.72)
    : environment.dayPhase === 'dusk'
      ? 0.18 * (1 - cloud * 0.5)
      : 0

  const moonOpacity = night
    ? Math.max(0.08, environment.moon.illumination * 0.82)
    : Math.max(0, environment.moon.altitude > 5 ? environment.moon.illumination * 0.16 : 0)

  return {
    lightIntensity,
    cloudOpacity: Math.min(0.86, 0.07 + cloud * 0.78),
    fogOpacity: Math.min(0.62, fogBase),
    precipitationOpacity: Math.min(0.58, rainBase),
    starOpacity: Math.min(0.8, starBase),
    sunOpacity: environment.sun.altitude > -8 ? Math.min(0.9, Math.max(0, environment.sun.altitude + 4) / 50) : 0,
    moonOpacity,
  }
}

function computeState(now: Date, location: EnvironmentState['location'], weather: WeatherSnapshot | null, status: EnvironmentState['status'], error: string | null): EnvironmentState {
  const sun = location
    ? solarPosition(now, location.latitude, location.longitude)
    : fallbackSolarPosition(now)
  const moon = location
    ? lunarPosition(now, location.latitude, location.longitude)
    : fallbackLunarPosition(now)

  const dayPhase = inferDayPhase(sun, now)
  const weatherWithAstronomy = weather
    ? {
      ...weather,
      timezone: weather.timezone || location?.timezone || 'UTC',
    }
    : null

  const visual = createVisualState({
    dayPhase,
    weather: weatherWithAstronomy,
    sun,
    moon,
  })

  return {
    status,
    location,
    weather: weatherWithAstronomy,
    sun: {
      ...sun,
      sunrise: weatherWithAstronomy?.sunrise ?? null,
      sunset: weatherWithAstronomy?.sunset ?? null,
    },
    moon,
    dayPhase,
    visual,
    updatedAt: now.getTime(),
    error,
  }
}

export interface UseEnvironment {
  environment: EnvironmentState
  requestLocation: () => Promise<void>
  refresh: () => Promise<void>
}

export function useEnvironment(): UseEnvironment {
  const [location, setLocation] = useState<EnvironmentState['location']>(() => readStoredLocation())
  const [weather, setWeather] = useState<WeatherSnapshot | null>(() => {
    const saved = readStoredLocation()
    return saved ? getCachedWeather(saved) : null
  })
  const [status, setStatus] = useState<EnvironmentState['status']>(() => location ? 'degraded' : 'idle')
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const requestVersion = useRef(0)

  const refresh = useCallback(async (preferFreshLocation = false) => {
    const version = ++requestVersion.current
    setError(null)

    let activeLocation = location
    if (!activeLocation || preferFreshLocation) {
      try {
        const permission = await permissionState()
        if (permission === 'denied' && !location) {
          throw new Error('Location access is blocked. MiD will continue in local-time mode.')
        }
        if (permission !== 'denied' || !location) {
          const nextLocation = await requestBrowserLocation()
          saveLocation(nextLocation)
          activeLocation = nextLocation
          setLocation(nextLocation)
        }
      } catch (reason) {
        if (version !== requestVersion.current) return
        const message = reason instanceof Error ? reason.message : 'Location could not be determined.'
        setError(message)
        setStatus(location ? 'degraded' : 'idle')
        return
      }
    }

    if (version !== requestVersion.current) return
    if (!activeLocation) {
      setStatus('idle')
      return
    }

    const cached = getCachedWeather(activeLocation)
    if (cached) setWeather(cached)
    setStatus('loading')

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8_000)

    try {
      const nextWeather = await fetchWeather(activeLocation, controller.signal)
      if (version !== requestVersion.current) return
      setWeather(nextWeather)
      if (activeLocation.timezone !== nextWeather.timezone) {
        const resolvedLocation = { ...activeLocation, timezone: nextWeather.timezone }
        saveLocation(resolvedLocation)
        setLocation(resolvedLocation)
      }
      setStatus(weatherCacheIsStale(nextWeather) ? 'degraded' : 'ready')
      setError(null)
    } catch (reason) {
      if (version !== requestVersion.current) return
      setStatus(cached ? 'degraded' : 'idle')
      setError(reason instanceof Error ? reason.message : 'Weather data is temporarily unavailable.')
    } finally {
      window.clearTimeout(timeout)
    }
  }, [location])

  const requestLocation = useCallback(() => refresh(true), [refresh])

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      const saved = readStoredLocation()
      if (!saved) {
        const permission = await permissionState()
        if (active && permission === 'granted') void refresh(true)
        return
      }
      if (active) void refresh(false)
    }
    void bootstrap()
    return () => { active = false }
  }, [refresh])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && location) void refresh(false)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [location, refresh])

  const environment = useMemo(
    () => computeState(now, location, weather, status, error),
    [now, location, weather, status, error],
  )

  return { environment, requestLocation, refresh: () => refresh(false) }
}
