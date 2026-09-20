const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? ''
const API_VERSION = process.env.INSTAGRAM_GRAPH_VERSION ?? ''
const ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID ?? ''
const HOST = process.env.INSTAGRAM_GRAPH_HOST ?? 'https://graph.instagram.com'

export interface InstagramInsightPoint {
  name: string
  values: Array<{ value: number; end_time?: string }>
}

async function getJson(path: string, query: Record<string, string>) {
  if (!ACCESS_TOKEN || !API_VERSION || !ACCOUNT_ID) throw new Error('Instagram Analytics is not configured.')

  const url = new URL(HOST + '/' + API_VERSION + '/' + path.replace(/^\//, ''))
  Object.entries({ ...query, access_token: ACCESS_TOKEN }).forEach(([key, value]) => url.searchParams.set(key, value))

  const response = await fetch(url)
  const data = await response.json() as { data?: InstagramInsightPoint[]; error?: { message?: string } }
  if (!response.ok) throw new Error(data.error?.message ?? 'Instagram Analytics request failed.')
  return data
}

export async function getAccountInsights() {
  return getJson(ACCOUNT_ID + '/insights', {
    metric: 'follower_count,reach,profile_views',
    period: 'day',
  })
}

export function isInstagramAnalyticsConfigured() {
  return Boolean(ACCESS_TOKEN && API_VERSION && ACCOUNT_ID)
}
