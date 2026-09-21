import test from 'node:test'
import assert from 'node:assert/strict'
import { channelAllowsWrites } from '../dist/integrations/gateway.js'
import { parseCommand, verifyWebhookSecret } from '../dist/integrations/telegram.js'
import { parseWhatsAppCommand } from '../dist/integrations/whatsapp.js'

test('natural-language channel writes require explicit imperative intent', () => {
  assert.equal(channelAllowsWrites('tambah tugas laporan praktikum'), true)
  assert.equal(channelAllowsWrites('catat pengeluaran 20000 makan'), true)
  assert.equal(channelAllowsWrites('berapa jadwalku besok?'), false)
  assert.equal(channelAllowsWrites('apa pengeluaran hari ini?'), false)
})

test('Telegram command parser keeps command and arguments deterministic', () => {
  assert.deepEqual(parseCommand('/schedule tomorrow'), { command: 'schedule', args: 'tomorrow' })
  assert.deepEqual(parseCommand('/task@midbot laporan'), { command: 'task', args: 'laporan' })
  assert.equal(parseCommand('lihat jadwal'), null)
})

test('Telegram webhook secret comparison rejects missing or wrong values', () => {
  const previous = process.env.TELEGRAM_WEBHOOK_SECRET
  process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret'
  try {
    assert.equal(verifyWebhookSecret('test-secret'), true)
    assert.equal(verifyWebhookSecret('wrong-secret'), false)
    assert.equal(verifyWebhookSecret(undefined), false)
  } finally {
    if (previous === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET
    else process.env.TELEGRAM_WEBHOOK_SECRET = previous
  }
})

test('WhatsApp parser supports link and slash commands', () => {
  assert.deepEqual(parseWhatsAppCommand('link abc123'), { command: 'link', args: 'abc123' })
  assert.deepEqual(parseWhatsAppCommand('/expense 20000 food lunch'), { command: 'expense', args: '20000 food lunch' })
  assert.equal(parseWhatsAppCommand('how much did I spend?'), null)
})
