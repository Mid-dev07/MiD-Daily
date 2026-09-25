import test, { after } from 'node:test'
import assert from 'node:assert/strict'

process.env.PORT = '0'
process.env.FRONTEND_URL = 'https://mid-manager.xyz'
process.env.COOKIE_SECURE = 'false'
process.env.SUPABASE_URL = ''
process.env.SUPABASE_SECRET_KEY = ''

const { server } = await import('../dist/server.js')

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(0, '127.0.0.1', resolve)
})

const address = server.address()
if (!address || typeof address === 'string') throw new Error('Test server did not bind to a TCP port.')
const baseUrl = 'http://127.0.0.1:' + address.port

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('workspace bootstrap rejects unauthenticated requests', async () => {
  const response = await fetch(baseUrl + '/api/workspace/bootstrap')
  assert.equal(response.status, 401)
})

test('AI status rejects unauthenticated requests', async () => {
  const response = await fetch(baseUrl + '/api/ai/status')
  assert.equal(response.status, 401)
})

test('AI chat rejects unauthenticated requests before processing input', async () => {
  const response = await fetch(baseUrl + '/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [], allowWrites: true }),
  })
  assert.equal(response.status, 401)
})

test('Telegram integration status rejects unauthenticated requests', async () => {
  const response = await fetch(baseUrl + '/api/integrations/telegram/status')
  assert.equal(response.status, 401)
})

test('CORS allows the canonical custom domain', async () => {
  const response = await fetch(baseUrl + '/api/ai/status', {
    headers: { Origin: 'https://mid-manager.xyz' },
  })
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://mid-manager.xyz')
})

test('CORS keeps the legacy frontend Worker origin working during migration', async () => {
  const response = await fetch(baseUrl + '/api/ai/status', {
    headers: { Origin: 'https://mid-daily.e41262272.workers.dev' },
  })
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://mid-daily.e41262272.workers.dev')
})

test('CORS does not echo an untrusted origin', async () => {
  const response = await fetch(baseUrl + '/api/ai/status', {
    headers: { Origin: 'https://evil.example.com' },
  })
  assert.equal(response.headers.get('access-control-allow-origin'), process.env.FRONTEND_URL)
})

test('CORS preflight is handled', async () => {
  const response = await fetch(baseUrl + '/api/integrations/google-calendar/status', {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://mid-manager.xyz',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization',
    },
  })
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://mid-manager.xyz')
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true')
})
