import { useEffect, useState } from 'react'
import {
  createTelegramLink,
  disconnectTelegram,
  getTelegramStatus,
  type TelegramStatus,
} from '../../../integrations/telegramApi'

const initialStatus: TelegramStatus = {
  configured: false,
  connected: false,
  connectedAt: null,
  username: null,
}

export function TelegramIntegrationCard() {
  const [status, setStatus] = useState(initialStatus)
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getTelegramStatus()
      .then((next) => { if (active) setStatus(next) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Telegram status unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const connect = async () => {
    setLoading(true)
    setError('')
    try {
      const next = await createTelegramLink()
      setLink(next.deepLink)
      window.open(next.deepLink, '_blank', 'noopener,noreferrer')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create Telegram link.')
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setLoading(true)
    setError('')
    try {
      await disconnectTelegram()
      setStatus((current) => ({ ...current, connected: false, username: null, connectedAt: null }))
      setLink('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to disconnect Telegram.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="content-card integration-panel" aria-label="Telegram integration">
      <div className="card-heading">
        <div><span className="section-kicker">TELEGRAM</span><h3>{status.connected ? 'Telegram connected' : 'Telegram assistant'}</h3></div>
        <span className="integration-badge">{loading ? 'CHECKING' : status.connected ? 'CONNECTED' : status.configured ? 'READY' : 'NOT CONFIGURED'}</span>
      </div>
      <p className="integration-description">
        {error || (status.connected
          ? `Linked account${status.username ? ' @' + status.username : ''}. Use /task, /expense, /expenses, and /schedule in the private bot chat.`
          : status.configured
            ? 'Generate a one-time link to connect your Telegram private chat to this account.'
            : <>Telegram bot access is not configured yet. Add TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME, TELEGRAM_WEBHOOK_SECRET, and TELEGRAM_WEBHOOK_URL to the backend, then refresh this card.</>)}
      </p>
      {link && !status.connected && <button className="text-button integration-link-button" type="button" onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}>Open Telegram link again</button>}
      <div className="integration-actions">
        {status.connected
          ? <button className="secondary-button" disabled={loading} type="button" onClick={() => void disconnect()}>Disconnect</button>
          : status.configured
            ? <button className="secondary-button" disabled={loading} type="button" onClick={() => void connect()}>Connect Telegram</button>
            : <button className="secondary-button" disabled={loading} type="button" onClick={() => window.open('https://t.me/BotFather', '_blank', 'noopener,noreferrer')}>Open Telegram setup</button>}
      </div>
    </section>
  )
}
