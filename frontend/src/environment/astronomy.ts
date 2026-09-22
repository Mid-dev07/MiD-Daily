import type { DayPhase, LunarPosition, SolarPosition } from './types'

const RAD = Math.PI / 180
const DEG = 180 / Math.PI
const TWO_PI = Math.PI * 2

function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360
}

function normalizeHours(value: number) {
  return ((value % 24) + 24) % 24
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5
}

function daysSinceJ2000(date: Date) {
  return julianDay(date) - 2451545
}

function localSiderealDegrees(date: Date, longitude: number) {
  const d = daysSinceJ2000(date)
  const gmstHours = normalizeHours(18.697374558 + 24.06570982441908 * d)
  return normalizeDegrees(gmstHours * 15 + longitude)
}

function horizontalCoordinates(date: Date, latitude: number, longitude: number, rightAscension: number, declination: number) {
  const lst = localSiderealDegrees(date, longitude)
  const hourAngle = (normalizeDegrees(lst - rightAscension + 180) - 180) * RAD
  const lat = latitude * RAD
  const dec = declination * RAD

  const altitude = Math.asin(
    Math.sin(lat) * Math.sin(dec)
      + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle),
  ) * DEG

  const azimuth = normalizeDegrees(
    Math.atan2(
      Math.sin(hourAngle),
      Math.cos(hourAngle) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat),
    ) * DEG + 180,
  )

  return { altitude, azimuth }
}

export function solarPosition(date: Date, latitude: number, longitude: number): SolarPosition {
  const n = daysSinceJ2000(date)
  const meanLongitude = normalizeDegrees(280.460 + 0.9856474 * n)
  const meanAnomaly = normalizeDegrees(357.528 + 0.9856003 * n) * RAD
  const eclipticLongitude = normalizeDegrees(
    meanLongitude + 1.915 * Math.sin(meanAnomaly) + 0.020 * Math.sin(2 * meanAnomaly),
  ) * RAD
  const obliquity = (23.439 - 0.0000004 * n) * RAD

  const rightAscension = Math.atan2(
    Math.cos(obliquity) * Math.sin(eclipticLongitude),
    Math.cos(eclipticLongitude),
  ) * DEG
  const declination = Math.asin(
    Math.sin(obliquity) * Math.sin(eclipticLongitude),
  ) * DEG

  const horizontal = horizontalCoordinates(date, latitude, longitude, normalizeDegrees(rightAscension), declination)
  return {
    ...horizontal,
    sunrise: null,
    sunset: null,
  }
}

export function lunarPosition(date: Date, latitude: number, longitude: number): LunarPosition {
  const d = daysSinceJ2000(date)
  const n = normalizeDegrees(125.1228 - 0.0529538083 * d)
  const i = 5.1454
  const w = normalizeDegrees(318.0634 + 0.1643573223 * d)
  const a = 60.2666
  const e = 0.0549
  const meanAnomaly = normalizeDegrees(115.3654 + 13.0649929509 * d)

  const mRad = meanAnomaly * RAD
  const eccentricAnomaly = (meanAnomaly + (e / RAD) * Math.sin(mRad) * (1 + e * Math.cos(mRad))) * RAD

  const xv = a * (Math.cos(eccentricAnomaly) - e)
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly))
  const trueAnomaly = Math.atan2(yv, xv) * DEG
  const distance = Math.sqrt(xv * xv + yv * yv)

  const nRad = n * RAD
  const iRad = i * RAD
  const argument = (trueAnomaly + w) * RAD
  const x = distance * (
    Math.cos(nRad) * Math.cos(argument)
      - Math.sin(nRad) * Math.sin(argument) * Math.cos(iRad)
  )
  const y = distance * (
    Math.sin(nRad) * Math.cos(argument)
      + Math.cos(nRad) * Math.sin(argument) * Math.cos(iRad)
  )
  const z = distance * Math.sin(argument) * Math.sin(iRad)

  const rawLongitude = Math.atan2(y, x) * DEG
  const rawLatitude = Math.atan2(z, Math.sqrt(x * x + y * y)) * DEG

  const sunLongitude = normalizeDegrees(280.460 + 0.9856474 * d)
  const sunAnomaly = normalizeDegrees(356.0470 + 0.9856002585 * d)
  const moonLongitude = normalizeDegrees(n + w + meanAnomaly)

  const ev = 1.2739 * Math.sin((2 * (moonLongitude - sunLongitude) - meanAnomaly) * RAD)
  const ae = 0.1858 * Math.sin(sunAnomaly * RAD)
  const a3 = 0.37 * Math.sin(sunAnomaly * RAD)
  const m3 = normalizeDegrees(meanAnomaly + ev - ae - a3)
  const ec = 6.2886 * Math.sin(m3 * RAD)
  const a4 = 0.214 * Math.sin(2 * m3 * RAD)
  const correctedLongitude = moonLongitude + ev + ec - ae + a4
  const v = 0.6583 * Math.sin(2 * (correctedLongitude - sunLongitude) * RAD)
  const eclipticLongitude = correctedLongitude + v
  const b3 = 5.1293 * Math.sin(m3 * RAD)
  const bc = 0.2806 * Math.sin(sunAnomaly * RAD)
  const eclipticLatitude = rawLatitude + b3 + bc

  const obliquity = 23.439 * RAD
  const lambda = eclipticLongitude * RAD
  const beta = eclipticLatitude * RAD

  const rightAscension = Math.atan2(
    Math.sin(lambda) * Math.cos(obliquity) - Math.tan(beta) * Math.sin(obliquity),
    Math.cos(lambda),
  ) * DEG
  const declination = Math.asin(
    Math.sin(beta) * Math.cos(obliquity)
      + Math.cos(beta) * Math.sin(obliquity) * Math.sin(lambda),
  ) * DEG

  const horizontal = horizontalCoordinates(date, latitude, longitude, normalizeDegrees(rightAscension), declination)
  const phase = normalizeDegrees(eclipticLongitude - sunLongitude)
  const illumination = (1 - Math.cos(phase * RAD)) / 2

  return {
    ...horizontal,
    phase,
    illumination,
  }
}

export function inferDayPhase(sun: SolarPosition, date = new Date()): DayPhase {
  const altitude = sun.altitude
  if (altitude <= -6) return 'night'
  if (altitude < 0) return normalizeDegrees(sun.azimuth) <= 180 ? 'dawn' : 'dusk'
  if (altitude < 8) return 'golden-hour'
  if (altitude < 25 && normalizeDegrees(sun.azimuth) < 180) return 'morning'
  return 'day'
}

export function fallbackSolarPosition(date = new Date()): SolarPosition {
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
  const daylightProgress = (hour - 6) / 12
  const normalized = clamp(daylightProgress, 0, 1)
  const altitude = hour >= 6 && hour <= 18
    ? Math.sin(normalized * Math.PI) * 58
    : -12
  const azimuth = hour < 6
    ? 70
    : hour > 18
      ? 290
      : 90 + normalized * 180

  return {
    altitude,
    azimuth,
    sunrise: null,
    sunset: null,
  }
}

export function fallbackLunarPosition(date = new Date()): LunarPosition {
  const hour = date.getHours() + date.getMinutes() / 60
  const nightProgress = hour >= 18 ? (hour - 18) / 12 : (hour + 6) / 12
  const normalized = clamp(nightProgress, 0, 1)
  return {
    altitude: Math.sin(normalized * Math.PI) * 45,
    azimuth: normalizeDegrees(270 + normalized * 180),
    phase: 90,
    illumination: 0.65,
  }
}
