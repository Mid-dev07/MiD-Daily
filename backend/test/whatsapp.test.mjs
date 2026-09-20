import test from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'

process.env.WHATSAPP_APP_SECRET = 'test_app_secret'
process.env.WHATSAPP_VERIFY_TOKEN = 'verify-123'

const whatsapp = await import('../dist/integrations/whatsapp.js')

test('parseWhatsAppCommand parses slash commands', () => {
  assert.deepEqual(whatsapp.parseWhatsAppCommand('/task Finish report'), {
    command: 'task',
    args: 'Finish report',
  })
})

test('parseWhatsAppCommand accepts link code without slash', () => {
  assert.deepEqual(whatsapp.parseWhatsAppCommand('link abc123'), {
    command: 'link',
    args: 'abc123',
  })
})

test('webhook challenge verifies exact token', () => {
  assert.equal(whatsapp.verifyWebhookChallenge('subscribe', 'verify-123', 'challenge-1'), 'challenge-1')
  assert.equal(whatsapp.verifyWebhookChallenge('subscribe', 'wrong', 'challenge-1'), null)
})

test('webhook signature verifies HMAC SHA-256', () => {
  const body = JSON.stringify({ entry: [] })
  const signature = 'sha256=' + createHmac('sha256', 'test_app_secret').update(body, 'utf8').digest('hex')
  assert.equal(whatsapp.verifyWhatsAppSignature(body, signature), true)
  assert.equal(whatsapp.verifyWhatsAppSignature(body, signature.slice(0, -1) + '0'), false)
})
