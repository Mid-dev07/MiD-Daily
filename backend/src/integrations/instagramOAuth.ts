const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET ?? ''
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI ?? ''
const API_VERSION = process.env.INSTAGRAM_GRAPH_VERSION ?? ''
const GRAPH_HOST = process.env.INSTAGRAM_GRAPH_HOST ?? 'https://graph.instagram.com'

export const INSTAGRAM_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize'
export const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token'

export function isInstagramOAuthConfigured() {
  return Boolean(CLIENT_ID && CLIENT_SECRET && REDIRECT_URI && API_VERSION)
}

export function buildInstagramAuthorizationUrl(state: string) {
  if (!isInstagramOAuthConfigured()) throw new Error('Instagram OAuth is not configured.')

  const url = new URL(INSTAGRAM_AUTHORIZE_URL)
  url.searchParams.set('client_id', CLIENT_ID)
  url.searchParams.set('redirect_uri', REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'instagram_business_basic,instagram_business_manage_insights')
  url.searchParams.set('state', state)
  return url.toString()
}

async function readJson(response: Response) {
  const data = await response.json() as Record<string, unknown>
  if (!response.ok) {
    const error = data.error_message ?? data.error_description ?? data.error
    throw new Error(typeof error === 'string' ? error : 'Instagram OAuth request failed.')
  }
  return data
}

export async function exchangeInstagramCode(code: string) {
  if (!isInstagramOAuthConfigured()) throw new Error('Instagram OAuth is not configured.')

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code,
  })

  const response = await fetch(INSTAGRAM_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await readJson(response)

  if (typeof data.access_token !== 'string' || typeof data.user_id !== 'string') {
    throw new Error('Instagram OAuth returned an invalid access token response.')
  }

  return {
    accessToken: data.access_token,
    accountId: data.user_id,
    expiresIn: typeof data.expires_in === 'number' ? data.expires_in : 3600,
  }
}

export async function exchangeForLongLivedInstagramToken(shortLivedToken: string) {
  const url = new URL(GRAPH_HOST + '/' + API_VERSION.replace(/^\/+/, '') + '/access_token')
  url.searchParams.set('grant_type', 'ig_exchange_token')
  url.searchParams.set('client_secret', CLIENT_SECRET)
  url.searchParams.set('access_token', shortLivedToken)

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })
  const data = await readJson(response)

  if (typeof data.access_token !== 'string') {
    throw new Error('Instagram long-lived token exchange returned an invalid response.')
  }

  return {
    accessToken: data.access_token,
    expiresIn: typeof data.expires_in === 'number' ? data.expires_in : 0,
  }
}

export function instagramGraphBase() {
  return GRAPH_HOST
}

export function instagramGraphApiVersion() {
  return API_VERSION
}
