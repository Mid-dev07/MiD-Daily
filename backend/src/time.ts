const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'Asia/Jakarta'

export function appTimeZone() {
  return APP_TIMEZONE
}

export function todayInAppTimeZone(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIMEZONE }).format(date)
}
