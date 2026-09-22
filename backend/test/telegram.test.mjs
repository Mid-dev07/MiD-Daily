import test from 'node:test'
import assert from 'node:assert/strict'

process.env.TELEGRAM_WEBHOOK_SECRET = 'test_secret-123'
const telegram = await import('../dist/integrations/telegram.js')

test('parseCommand parses bot commands and arguments', () => {
  assert.deepEqual(telegram.parseCommand('/task Finish report'), {
    command: 'task',
    args: 'Finish report',
  })
})

test('parseCommand accepts bot username suffix', () => {
  assert.deepEqual(telegram.parseCommand('/expenses@mid_daily_bot'), {
    command: 'expenses',
    args: '',
  })
})

test('parseCommand supports the AI command', () => {
  assert.deepEqual(telegram.parseCommand('/ai What do I have today?'), {
    command: 'ai',
    args: 'What do I have today?',
  })
})

test('parseCommand rejects ordinary text', () => {
  assert.equal(telegram.parseCommand('hello'), null)
})

test('webhook secret verification is exact', () => {
  assert.equal(telegram.verifyWebhookSecret('test_secret-123'), true)
  assert.equal(telegram.verifyWebhookSecret('test_secret-124'), false)
  assert.equal(telegram.verifyWebhookSecret(undefined), false)
})
