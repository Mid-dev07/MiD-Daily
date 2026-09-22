import { useEffect, useState } from 'react'
import {
  createWhatsAppLink,
  disconnectWhatsApp,
  getWhatsAppStatus,
  type WhatsAppStatus,
} from '../../../integrations/whatsappApi'

const initialStatus: WhatsAppStatus = {
  configured: false,
  connected: false,
  connectedAt: null,
  displayName: null,
  businessPhoneNumber: null,
}

export function WhatsAppIntegrationCard() {
  const [status, setStatus] = useState(initialStatus)
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getWhatsAppStatus()
      .then((next) => { if (active) setStatus(next) })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'WhatsApp status unavailable.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const connect = async () => {
    setLoading(true)
    setError('')
    try {
      const next = await createWhatsAppLink()
      setLink(next.deepLink)
      window.open(next.deepLink, '_blank', 'noopener,noreferrer')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create WhatsApp link.')
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    setLoading(true)
    setError('')
    try {
      await disconnectWhatsApp()
      setStatus((current) => ({ ...current, connected: false, displayName: null, connectedAt: null }))
      setLink('')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to disconnect WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="content-card integration-panel" aria-label="WhatsApp integration">
      <div className="card-heading">
        <div><span className="section-kicker">WHATSAPP</span><h3>{status.connected ? 'WhatsApp connected' : 'WhatsApp assistant'}</h3></div>
        <span className="integration-badge">{loading ? 'CHECKING' : status.connected ? 'CONNECTED' : status.configured ? 'READY' : 'NOT CONFIGURED'}</span>
      </div>
      <p className="integration-description">
        {error || (status.connected
          ? `Linked account${status.displayName ? ' ' + status.displayName : ''}. Use /task, /expense, /expenses, and /schedule in the WhatsApp chat.`
          : status.configured
            ? 'Generate a one-time link to connect this WhatsApp account.'
            : <>WhatsApp Cloud API is not configured yet. Add the backend credentials, then refresh this card. <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer">Open Meta Developer Console ↗</a></>)}
      </p>
      {link && !status.connected && <button className="text-button integration-link-button" type="button" onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}>Open WhatsApp link again</button>}
      <div className="integration-actions">
        {status.connected
          ? <button className="secondary-button" disabled={loading} type="button" onClick={() => void disconnect()}>Disconnect</button>
          : status.configured
            ? <button className="secondary-button" disabled={loading} type="button" onClick={() => void connect()}>Connect WhatsApp</button>
            : <button className="secondary-button" disabled={loading} type="button" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer')}>Open WhatsApp setup</button>}
      </div>
    </section>
  )
}
