const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN ?? ''
const API_VERSION = process.env.INSTAGRAM_GRAPH_VERSION ?? ''
const ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID ?? ''
const HOST = process.env.INSTAGRAM_GRAPH_HOST ?? 'https://graph.instagram.com'

export interface InstagramInsightPoint {
  name: string
  values?: Array<{ value: number; end_time?: string }>
  total_value?: { value?: number }
}

export interface InstagramAccountProfile {
  id: string
  username?: string
  name?: string
  followers_count?: number
  media_count?: number
}

async function getJson<T>(path: string, query: Record<string, string>) {
  if (!ACCESS_TOKEN || !API_VERSION || !ACCOUNT_ID) throw new Error('Instagram Analytics is not configured.')

  const url = new URL(HOST + '/' + API_VERSION.replace(/^\/+/, '') + '/' + path.replace(/^\/+/, ''))
  Object.entries({ ...query, access_token: ACCESS_TOKEN }).forEach(([key, value]) => url.searchParams.set(key, value))

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  const data = await response.json() as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(data.error?.message ?? 'Instagram Analytics request failed.')
  return data
}

export async function getAccountProfile() {
  return getJson<InstagramAccountProfile>(ACCOUNT_ID, {
    fields: 'id,username,name,followers_count,media_count',
  })
}

export async function getAccountInsights() {
  return getJson<{ data?: InstagramInsightPoint[] }>(ACCOUNT_ID + '/insights', {
    metric: 'views,reach,accounts_engaged,total_interactions',
    metric_type: 'total_value',
    period: 'day',
  })
}

export function normalizeAccountInsights(profile: InstagramAccountProfile, insights: InstagramInsightPoint[]) {
  const values = new Map<string, number>()
  for (const item of insights) {
    const value = item.total_value?.value ?? item.values?.[item.values.length - 1]?.value
    if (typeof value === 'number' && Number.isFinite(value)) values.set(item.name, value)
  }

  return {
    provider: 'INSTAGRAM' as const,
    accountId: profile.id,
    username: profile.username,
    followers: profile.followers_count,
    views: values.get('views'),
    reach: values.get('reach'),
    accountsEngaged: values.get('accounts_engaged'),
    totalInteractions: values.get('total_interactions'),
    updatedAt: new Date().toISOString(),
  }
}

export function isInstagramAnalyticsConfigured() {
  return Boolean(ACCESS_TOKEN && API_VERSION && ACCOUNT_ID)
}
