export type FinancePeriod = 'today' | 'week' | 'month' | 'all'

function todayValue() {
  return new Intl.DateTimeFormat('sv-SE').format(new Date())
}

function startOfWeek(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const weekday = date.getUTCDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  date.setUTCDate(date.getUTCDate() + mondayOffset)
  return date.toISOString().slice(0, 10)
}

export function getFinancePeriodStart(period: FinancePeriod, reference = todayValue()) {
  if (period === 'today') return reference
  if (period === 'week') return startOfWeek(reference)
  if (period === 'month') return reference.slice(0, 7) + '-01'
  return '0000-00-00'
}

export function isInFinancePeriod(date: string, period: FinancePeriod, reference = todayValue()) {
  if (period === 'all') return true
  if (period === 'today') return date === reference
  if (period === 'month') return date.startsWith(reference.slice(0, 7))
  const start = getFinancePeriodStart('week', reference)
  return date >= start && date <= reference
}
