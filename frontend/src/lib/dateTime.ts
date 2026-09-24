const configuredTimeZone = (import.meta.env.VITE_APP_TIMEZONE ?? '').trim()

export const APP_TIMEZONE = configuredTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export function getToday(timeZone: string = APP_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

export function formatTime(value: Date, timeZone: string = APP_TIMEZONE) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(value)
}

export function formatDate(value: Date, timeZone: string = APP_TIMEZONE) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value)
}
