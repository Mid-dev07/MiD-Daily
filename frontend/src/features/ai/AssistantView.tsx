import { useEffect, useMemo, useState } from 'react'
import { getAIStatus, sendAIMessage, type AIMessage } from '../../integrations/aiApi'

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
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    void getAIStatus()
      .then((status) => { if (active) setAiAvailable(status.configured) })
      .catch(() => { if (active) setAiAvailable(false) })
    return () => { active = false }
  }, [])

  const canSend = useMemo(() => input.trim().length > 0 && !loading && aiAvailable === true, [input, loading, aiAvailable])

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

  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <div><span className="section-kicker">ASSISTANT</span><h2>Work with your day.</h2><p>MiD-Daily Assistant reads only scoped tools. It cannot query the database directly.</p></div>
      </div>

      <section className="content-card ai-shell-card">
        <div className="ai-toolbar">
          <label className="ai-action-toggle">
            <input
              type="checkbox"
              disabled={aiAvailable !== true}
              checked={allowWrites}
              onChange={(event) => {
                if (event.target.checked && !window.confirm('Allow MiD-Daily Assistant to create Tasks and Expenses only when you explicitly ask it to?')) {
                  return
                }
                setAllowWrites(event.target.checked)
              }}
            />
            <span>Allow actions</span>
          </label>
          <span className="card-meta">{aiAvailable === null ? 'Checking AI service…' : aiAvailable ? (allowWrites ? 'Task and expense creation enabled' : 'Read-only mode') : 'AI service not configured'}</span>
        </div>

        {aiAvailable === false && (
          <div className="ai-availability-note" role="status">
            <strong>Assistant is not configured on this deployment.</strong>
            <span>The core MiD-Daily workspace remains fully usable without AI. Add the server-side OpenAI configuration to enable this module.</span>
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
                {action.ok ? '✓' : '!' } {action.tool.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        <div className="ai-composer">
          <textarea disabled={aiAvailable !== true} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }} rows={3} placeholder="Ask about today's schedule, open tasks, or expenses…" aria-label="Message MiD-Daily Assistant" />
          <button className="primary-button" disabled={!canSend} type="button" onClick={() => void send()}>{loading ? 'Working…' : 'Send'}</button>
        </div>
      </section>
    </section>
  )
}
