import test from 'node:test'
import assert from 'node:assert/strict'

process.env.INSTAGRAM_CLIENT_ID = 'client-123'
process.env.INSTAGRAM_CLIENT_SECRET = 'secret-123'
process.env.INSTAGRAM_REDIRECT_URI = 'http://localhost:8787/auth/instagram/callback'
process.env.INSTAGRAM_GRAPH_VERSION = 'v25.0'

const {
  buildInstagramAuthorizationUrl,
  isInstagramOAuthConfigured,
} = await import('../dist/integrations/instagramOAuth.js')

test('Instagram OAuth configuration is recognized', () => {
  assert.equal(isInstagramOAuthConfigured(), true)
})

test('authorization URL uses Business Login scopes and state', () => {
  const url = new URL(buildInstagramAuthorizationUrl('state-abc'))

  assert.equal(url.origin, 'https://www.instagram.com')
  assert.equal(url.pathname, '/oauth/authorize')
  assert.equal(url.searchParams.get('client_id'), 'client-123')
  assert.equal(url.searchParams.get('redirect_uri'), 'http://localhost:8787/auth/instagram/callback')
  assert.equal(url.searchParams.get('response_type'), 'code')
  assert.equal(url.searchParams.get('state'), 'state-abc')
  assert.equal(
    url.searchParams.get('scope'),
    'instagram_business_basic,instagram_business_manage_insights',
  )
})
