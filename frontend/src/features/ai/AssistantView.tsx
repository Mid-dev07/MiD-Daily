import { useEffect, useMemo, useState } from 'react'
import { sendAIMessage, type AIMessage } from '../../integrations/aiApi'
import {
  createTelegramLink,
  createWhatsAppLink,
  disconnectTelegram,
  disconnectWhatsApp,
  getIntegrationStatus,
  type IntegrationStatus,
} from '../../integrations/integrationsApi'

const starterMessages: AIMessage[] = [
  { role: 'assistant', content: 'Hi. I can read your MiD-Daily data and help you plan the day. Actions are off by default.' },
]

export function AssistantView() {
  const [messages, setMessages] = useState<AIMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [allowWrites, setAllowWrites] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastActions, setLastActions] = useState<Array<{ tool: string; ok: boolean }>>([])
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null)
  const [integrationLoading, setIntegrationLoading] = useState(true)
  const [integrationBusy, setIntegrationBusy] = useState<'telegram' | 'whatsapp' | null>(null)
  const [integrationError, setIntegrationError] = useState('')

  const refreshIntegrations = async () => {
    setIntegrationLoading(true)
    try {
      setIntegrations(await getIntegrationStatus())
      setIntegrationError('')
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to load integration status.'
      setIntegrations(null)
      setIntegrationError(message)
    } finally {
      setIntegrationLoading(false)
    }
  }

  useEffect(() => {
    void refreshIntegrations()
  }, [])

  const canSend = useMemo(() => input.trim().length > 0 && !loading && integrations?.ai.configured === true, [input, loading, integrations])

  const openConnectionLink = async (channel: 'telegram' | 'whatsapp') => {
    const popup = window.open('', '_blank')
    setIntegrationBusy(channel)
    setError('')
    try {
      const link = channel === 'telegram' ? await createTelegramLink() : await createWhatsAppLink()
      if (popup) {
        popup.location.href = link.deepLink
      } else {
        setError('The browser blocked the connection window. Allow pop-ups and try again.')
      }
    } catch (reason) {
      popup?.close()
      setError(reason instanceof Error ? reason.message : 'Unable to create the connection link.')
    } finally {
      setIntegrationBusy(null)
    }
  }

  const disconnect = async (channel: 'telegram' | 'whatsapp') => {
    if (!window.confirm('Disconnect ' + (channel === 'telegram' ? 'Telegram' : 'WhatsApp') + ' from MiD-Daily?')) return
    setIntegrationBusy(channel)
    setError('')
    try {
      if (channel === 'telegram') await disconnectTelegram()
      else await disconnectWhatsApp()
      await refreshIntegrations()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to disconnect channel.')
    } finally {
      setIntegrationBusy(null)
    }
  }

  const send = async () => {
    const content = input.trim()
    if (!content || loading) return

    const nextMessages = [...messages, { role: 'user' as const, content }]
    setMessages(nextMessages)
    setInput('')
    setError('')
    setLastActions([])
    setLoading(true)

    try {
      const result = await sendAIMessage(nextMessages.slice(-10), allowWrites)
      setMessages((current) => [...current, { role: 'assistant' as const, content: result.text }].slice(-10))
      setLastActions(result.actions)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Assistant request failed.')
    } finally {
      setLoading(false)
    }
  }

  const channelLabel = (configured: boolean | undefined, connected: boolean, identity: string) => {
    if (configured === undefined) return { title: 'Checking…', detail: 'Checking provider configuration.' }
    if (!configured) return { title: 'Not configured', detail: 'Provider credentials are not configured on this deployment.' }
    if (connected) return { title: 'Connected', detail: identity || 'Connected account' }
    return { title: 'Ready to connect', detail: 'Link this channel to send natural-language requests.' }
  }

  const telegram = channelLabel(
    integrations?.telegram.configured === true,
    integrations?.telegram.connected === true,
    integrations?.telegram.username ? '@' + integrations.telegram.username : '',
  )
  const whatsapp = channelLabel(
    integrations?.whatsapp.configured === true,
    integrations?.whatsapp.connected === true,
    integrations?.whatsapp.displayName || '',
  )

  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <div><span className="section-kicker">ASSISTANT</span><h2>Work with your day.</h2><p>One assistant layer for the web app, Telegram, and WhatsApp. Instagram stays isolated as read-only social analytics.</p></div>
      </div>

      <section className="content-card integration-panel assistant-channels-card">
        <div className="card-heading">
          <div><span className="section-kicker">CHANNELS</span><h3>Connect your assistant</h3></div>
          <button className="text-button" type="button" disabled={integrationLoading} onClick={() => void refreshIntegrations()}>{integrationLoading ? 'Checking…' : 'Refresh'}</button>
        </div>
        {integrationError && <div className="ai-availability-note" role="alert"><strong>Integration status could not be checked.</strong><span>{integrationError} Refresh the status before troubleshooting provider setup.</span></div>}

        <div className="assistant-channel-grid">
          <article className="assistant-channel-card">
            <div className="assistant-channel-copy">
              <span className="integration-label">Telegram</span>
              <strong>{telegram.title}</strong>
              <small>{telegram.detail}</small>
            </div>
            {integrations?.telegram.configured ? (
              <div className="integration-actions">
                {integrations.telegram.connected ? (
                  <button className="text-button danger" type="button" disabled={integrationBusy !== null} onClick={() => void disconnect('telegram')}>Disconnect</button>
                ) : (
                  <button className="secondary-button" type="button" disabled={integrationBusy !== null} onClick={() => void openConnectionLink('telegram')}>{integrationBusy === 'telegram' ? 'Opening…' : 'Connect'}</button>
                )}
              </div>
            ) : integrations && <button className="secondary-button" type="button" onClick={() => window.open('https://t.me/BotFather', '_blank', 'noopener,noreferrer')}>Open setup</button>}
          </article>

          <article className="assistant-channel-card">
            <div className="assistant-channel-copy">
              <span className="integration-label">WhatsApp</span>
              <strong>{whatsapp.title}</strong>
              <small>{whatsapp.detail}</small>
            </div>
            {integrations?.whatsapp.configured ? (
              <div className="integration-actions">
                {integrations.whatsapp.connected ? (
                  <button className="text-button danger" type="button" disabled={integrationBusy !== null} onClick={() => void disconnect('whatsapp')}>Disconnect</button>
                ) : (
                  <button className="secondary-button" type="button" disabled={integrationBusy !== null} onClick={() => void openConnectionLink('whatsapp')}>{integrationBusy === 'whatsapp' ? 'Opening…' : 'Connect'}</button>
                )}
              </div>
            ) : integrations && <button className="secondary-button" type="button" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer')}>Open setup</button>}
          </article>

          <article className="assistant-channel-card">
            <div className="assistant-channel-copy">
              <span className="integration-label">Instagram</span>
              <strong>{integrations?.instagram.configured ? 'Analytics configured' : 'Analytics foundation'}</strong>
              <small>Read-only social analytics. Provider OAuth/account mapping is kept separate from messaging.</small>
            </div>
            <span className="integration-badge">{integrations?.instagram.configured ? 'READY' : 'FOUNDATION'}</span>
          </article>
        </div>
      </section>

      <section className="content-card ai-shell-card">
        <div className="ai-toolbar">
          <label className="ai-action-toggle">
            <input
              type="checkbox"
              disabled={integrations?.ai.configured !== true}
              checked={allowWrites}
              onChange={(event) => {
                if (event.target.checked && !window.confirm('Allow MiD-Daily Assistant to create Tasks, Expenses, Activities, and Budgets only when you explicitly ask it to?')) {
                  return
                }
                setAllowWrites(event.target.checked)
              }}
            />
            <span>Allow actions</span>
          </label>
          <span className="card-meta">
            {integrationError
              ? 'AI service status unavailable'
              : integrations?.ai.configured === undefined
                ? 'Checking AI service…'
                : integrations.ai.configured
                ? (allowWrites ? 'Write actions enabled' : 'Read-only mode')
                : 'AI service not configured'}
          </span>
        </div>

        {integrations?.ai.configured === false && !integrationError && (
          <div className="ai-availability-note" role="status">
            <strong>Assistant is not configured on this deployment.</strong>
            <span>The core workspace remains fully usable without AI. The Assistant will activate when the Cloudflare Workers AI binding is available on this deployment.</span>
          </div>
        )}

        <div className="ai-message-list" aria-live="polite">
          {messages.map((message, index) => (
            <div className={'ai-message ' + message.role} key={index}>
              <span className="ai-message-role">{message.role === 'assistant' ? 'MiD' : 'You'}</span>
              <p>{message.content}</p>
            </div>
          ))}
          {loading && <div className="ai-message assistant"><span className="ai-message-role">MiD</span><p>Thinking…</p></div>}
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        {lastActions.length > 0 && (
          <div className="ai-action-summary" aria-label="Assistant action results">
            {lastActions.map((action, index) => (
              <span key={action.tool + index} className={action.ok ? 'ai-action-chip is-ok' : 'ai-action-chip is-error'}>
                {action.ok ? '✓' : '!'} {action.tool.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="ai-composer">
          <textarea disabled={!canSend} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }} rows={3} placeholder="Ask about schedule, tasks, expenses, budgets, or flexible plans…" aria-label="Message MiD-Daily Assistant" />
          <button className="primary-button" disabled={!canSend} type="button" onClick={() => void send()}>{loading ? 'Working…' : 'Send'}</button>
        </div>
      </section>
    </section>
  )
}
