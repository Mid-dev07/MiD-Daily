import type { EnvironmentLocation } from './types'

const LOCATION_KEY = 'mid-daily.environment.location.v1'

interface StoredLocation {
  latitude: number
  longitude: number
  timezone: string
}

function normalizeCoordinate(value: number, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function normalizeLocation(latitude: number, longitude: number, source: EnvironmentLocation['source']): EnvironmentLocation {
  return {
    latitude: normalizeCoordinate(latitude),
    longitude: normalizeCoordinate(longitude),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    source,
  }
}

export function readStoredLocation(): EnvironmentLocation | null {
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredLocation
    if (!Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude) || !parsed.timezone) return null
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      timezone: parsed.timezone,
      source: 'saved',
    }
  } catch {
    return null
  }
}

export function saveLocation(location: EnvironmentLocation) {
  try {
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify({
      latitude: normalizeCoordinate(location.latitude),
      longitude: normalizeCoordinate(location.longitude),
      timezone: location.timezone,
    }))
  } catch {
    // Location can remain session-only.
  }
}

export function requestBrowserLocation(): Promise<EnvironmentLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This browser does not provide location services.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(normalizeLocation(position.coords.latitude, position.coords.longitude, 'browser'))
      },
      (error) => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was not granted.'
          : error.code === error.TIMEOUT
            ? 'Location lookup timed out.'
            : 'Location could not be determined.'
        reject(new Error(message))
      },
      {
        enableHighAccuracy: false,
        maximumAge: 15 * 60 * 1000,
        timeout: 8_000,
      },
    )
  })
}

export async function permissionState() {
  try {
    if (!navigator.permissions?.query) return 'unknown' as const
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch {
    return 'unknown' as const
  }
}
