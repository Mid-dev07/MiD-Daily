import { setTelegramWebhook } from './telegram.js'

setTelegramWebhook()
  .then(() => {
    console.log('Telegram webhook configured.')
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Telegram webhook setup failed.')
    process.exitCode = 1
  })
