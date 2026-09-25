import { useEffect, useMemo, useState } from 'react'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { executeAIProposals, getAIStatus, sendAIMessage, type AIMessage, type AIProposal } from '../../integrations/aiApi'
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
  const [pendingProposals, setPendingProposals] = useState<AIProposal[]>([])
  const [confirming, setConfirming] = useState(false)
  const [integrations, setIntegrations] = useState<IntegrationStatus | null>(null)
  const [integrationLoading, setIntegrationLoading] = useState(true)
  const [integrationBusy, setIntegrationBusy] = useState<'telegram' | 'whatsapp' | null>(null)
  const [integrationError, setIntegrationError] = useState('')
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const [aiStatusError, setAiStatusError] = useState('')
  const [confirmRequest, setConfirmRequest] = useState<{ kind: 'disconnect'; channel: 'telegram' | 'whatsapp' } | { kind: 'allow-writes' }>()

  const refreshIntegrations = async () => {
    setIntegrationLoading(true)
    setAiStatusError('')
    try {
      const [nextIntegrations, nextAi] = await Promise.all([
        getIntegrationStatus(),
        getAIStatus(),
      ])
      setIntegrations(nextIntegrations)
      setIntegrationError('')
      setAiConfigured(nextAi.configured)
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Unable to load integration status.'
      setIntegrations(null)
      setIntegrationError(message)
      // Integration status and AI status are logically independent. A
      // connector failure must never disable the assistant composer.
      try {
        const nextAi = await getAIStatus()
        setAiConfigured(nextAi.configured)
      } catch (aiReason) {
        setAiConfigured(null)
        setAiStatusError(aiReason instanceof Error ? aiReason.message : 'Unable to load AI status.')
      }
    } finally {
      setIntegrationLoading(false)
    }
  }

  useEffect(() => {
    void refreshIntegrations()
  }, [])

  const canSend = useMemo(() => input.trim().length > 0 && !loading && aiConfigured === true, [input, loading, aiConfigured])

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

  const requestDisconnect = (channel: 'telegram' | 'whatsapp') => {
    setConfirmRequest({ kind: 'disconnect', channel })
  }

  const disconnect = async (channel: 'telegram' | 'whatsapp') => {
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
    setPendingProposals([])
    setLoading(true)

    try {
      const result = await sendAIMessage(nextMessages.slice(-10), allowWrites, allowWrites ? 'preview' : 'execute')
      setMessages((current) => [...current, { role: 'assistant' as const, content: result.text }].slice(-10))
      setLastActions(result.actions)
      setPendingProposals(result.proposals ?? [])
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Assistant request failed.')
    } finally {
      setLoading(false)
    }
  }

  const confirmProposals = async () => {
    if (!pendingProposals.length || confirming) return

    setConfirming(true)
    setError('')
    try {
      const result = await executeAIProposals(pendingProposals)
      setPendingProposals([])
      setLastActions(result.actions)
      setMessages((current) => [...current, { role: 'assistant' as const, content: 'Confirmed. The proposed changes have been applied to your MiD workspace.' }].slice(-10))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to execute the proposed actions.')
    } finally {
      setConfirming(false)
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

  const integrationSummary = integrations ? [
    ['Telegram', integrations.telegram.state],
    ['WhatsApp', integrations.whatsapp.state],
    ['AI', integrations.ai.state],
  ] as const : []

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="006"
        kicker="GUIDANCE"
        title="Work with your day."
        description="One assistant layer for the web app, Telegram, and WhatsApp. Read-only Instagram analytics live in Social."
      />

      <section className="content-card integration-panel assistant-channels-card">
        <div className="card-heading">
          <div><span className="section-kicker">CHANNELS</span><h3>Connect your assistant</h3></div>
          <button className="text-button" type="button" disabled={integrationLoading} onClick={() => void refreshIntegrations()}>{integrationLoading ? 'Checking…' : 'Refresh'}</button>
        </div>
        {integrationError && <div className="ai-availability-note" role="alert"><strong>Integration status could not be checked.</strong><span>{integrationError} Refresh the status before troubleshooting provider setup.</span></div>}

        <div className="assistant-health-strip" aria-label="Integration health">
          {integrationSummary.map(([label, state]) => (
            <span key={label}><b>{label}</b><small>{state.replaceAll('_', ' ')}</small></span>
          ))}
        </div>

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
                  <button className="text-button danger" type="button" disabled={integrationBusy !== null} onClick={() => requestDisconnect('telegram')}>Disconnect</button>
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
                  <button className="text-button danger" type="button" disabled={integrationBusy !== null} onClick={() => requestDisconnect('whatsapp')}>Disconnect</button>
                ) : (
                  <button className="secondary-button" type="button" disabled={integrationBusy !== null} onClick={() => void openConnectionLink('whatsapp')}>{integrationBusy === 'whatsapp' ? 'Opening…' : 'Connect'}</button>
                )}
              </div>
            ) : integrations && <button className="secondary-button" type="button" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer')}>Open setup</button>}
          </article>

        </div>
      </section>

      <section className="content-card planner-shortcuts-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">PLANNER</span>
            <h3>Start with a planning brief</h3>
          </div>
          <span className="card-meta">read-only until you enable actions</span>
        </div>
        <div className="planner-shortcuts">
          <button className="planner-shortcut" type="button" onClick={() => setInput('Plan my day using my schedule, open tasks, deadlines, and flexible plans. Suggest a realistic order and point out conflicts.')}>
            <strong>Plan today</strong>
            <span>Build a practical focus sequence.</span>
          </button>
          <button className="planner-shortcut" type="button" onClick={() => setInput('Plan tomorrow using my existing calendar, open tasks, deadlines, and flexible plans. Suggest time blocks without creating anything yet.')}>
            <strong>Plan tomorrow</strong>
            <span>Prepare before the next day starts.</span>
          </button>
          <button className="planner-shortcut" type="button" onClick={() => setInput('Find the best available focus block in my next 3 days for the most urgent open task. Do not create anything.')}>
            <strong>Find a focus block</strong>
            <span>Use existing schedule constraints.</span>
          </button>
        </div>
      </section>

      <section className="content-card ai-shell-card">
        <div className="ai-toolbar">
          <label className="ai-action-toggle">
            <input
              type="checkbox"
              disabled={aiConfigured !== true}
              checked={allowWrites}
              onChange={(event) => {
                if (event.target.checked) {
                  setConfirmRequest({ kind: 'allow-writes' })
                  return
                }
                setAllowWrites(false)
              }}
            />
            <span>Allow actions</span>
          </label>
          <span className="card-meta">
            {aiStatusError
              ? 'AI status unavailable'
              : aiConfigured === null
                ? 'Checking AI service…'
                : aiConfigured
                  ? (allowWrites ? 'Write actions enabled' : 'Read-only mode')
                  : 'AI service not configured'}
          </span>
        </div>

        {integrations?.instagram.state === 'DEPLOYMENT_ACCOUNT' && (
          <div className="ai-availability-note" role="status">
            <strong>Instagram analytics is deployment-scoped.</strong>
            <span>This account can be read from the current deployment, but per-user Connect is not enabled yet. It will remain separate from your personal Tasks, Finance, and Schedule data.</span>
          </div>
        )}

        {aiConfigured === false && !aiStatusError && (
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

        {pendingProposals.length > 0 && (
          <div className="ai-proposal-panel" aria-label="Proposed MiD actions">
            <div className="ai-proposal-heading">
              <div>
                <span className="section-kicker">ACTION REVIEW</span>
                <strong>Review before MiD changes your workspace</strong>
              </div>
              <span className="card-meta">{pendingProposals.length} proposed</span>
            </div>
            <div className="ai-proposal-list">
              {pendingProposals.map((proposal, index) => (
                <div className="ai-proposal-item" key={proposal.tool + index}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{proposal.tool.replace(/_/g, ' ')}</strong>
                    <small>{Object.entries(proposal.arguments).filter(([, value]) => value !== null && value !== '').slice(0, 3).map(([key, value]) => key + ': ' + String(value)).join(' · ')}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="ai-proposal-actions">
              <button className="secondary-button" type="button" disabled={confirming} onClick={() => setPendingProposals([])}>Keep draft</button>
              <button className="primary-button" type="button" disabled={confirming} onClick={() => void confirmProposals()}>{confirming ? 'Applying…' : 'Confirm & apply'}</button>
            </div>
          </div>
        )}

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
          <textarea
            disabled={loading}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (canSend) void send()
              }
            }}
            rows={3}
            placeholder={aiConfigured === false ? 'AI is unavailable right now. You can still draft a message.' : 'Ask about schedule, tasks, expenses, budgets, or flexible plans…'}
            aria-label="Message MiD-Daily Assistant"
          />
          <button className="primary-button" disabled={!canSend} type="button" onClick={() => void send()}>{loading ? 'Working…' : 'Send'}</button>
        </div>
      </section>
      <ConfirmDialog
        open={Boolean(confirmRequest)}
        eyebrow={confirmRequest?.kind === 'disconnect' ? 'CONNECTION' : 'ASSISTANT'}
        title={confirmRequest?.kind === 'disconnect' ? 'Disconnect this channel?' : 'Enable write actions?'}
        description={
          confirmRequest?.kind === 'disconnect'
            ? 'MiD will remove the active link for this channel. You can connect it again later.'
            : 'The Assistant can propose changes first and only apply Tasks, Expenses, Activities, and Budgets when you explicitly confirm them.'
        }
        confirmLabel={confirmRequest?.kind === 'disconnect' ? 'Disconnect' : 'Enable actions'}
        tone={confirmRequest?.kind === 'disconnect' ? 'danger' : 'default'}
        busy={confirmRequest?.kind === 'disconnect' && integrationBusy !== null}
        onCancel={() => setConfirmRequest(undefined)}
        onConfirm={async () => {
          if (!confirmRequest) return
          if (confirmRequest.kind === 'disconnect') {
            const channel = confirmRequest.channel
            setConfirmRequest(undefined)
            await disconnect(channel)
            return
          }
          setAllowWrites(true)
          setConfirmRequest(undefined)
        }}
      />
    </section>
  )
}
