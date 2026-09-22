import { useState } from 'react'
import { getAIStatus, sendAIMessage } from '../../../integrations/aiApi'

export function QuickCapture() {
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [actions, setActions] = useState<Array<{ tool: string; ok: boolean }>>([])

  const capture = async () => {
    const value = input.trim()
    if (!value || busy) return

    setBusy(true)
    setMessage('')
    setActions([])

    try {
      const status = await getAIStatus()
      if (!status.configured) {
        setMessage('Assistant is unavailable. Open Tasks, Finance, or Schedule to capture manually.')
        return
      }

      const result = await sendAIMessage([
        {
          role: 'user',
          content: [
            'Quick Capture request.',
            'The user explicitly wants this information captured into MiD-Daily.',
            'Classify the request as a Task, Expense, or Schedule activity.',
            'Create only what the user explicitly asked to capture.',
            'If the request is ambiguous or missing required information, do not create data; explain what is missing.',
            'User text: ' + value,
          ].join('\n'),
        },
      ], true)

      setActions(result.actions)
      setMessage(result.text)
      if (result.actions.some((action) => action.ok)) setInput('')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Unable to capture this item.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="content-card quick-capture-card">
      <div className="card-heading">
        <div>
          <span className="section-kicker">QUICK CAPTURE</span>
          <h3>Capture without leaving Today</h3>
        </div>
        <span className="card-meta">task · expense · schedule</span>
      </div>

      <div className="quick-capture-row">
        <textarea
          rows={2}
          value={input}
          disabled={busy}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void capture()
            }
          }}
          placeholder="e.g. Kumpulkan laporan Jumat jam 17.00"
          aria-label="Quick capture"
        />
        <button className="primary-button" type="button" disabled={busy || !input.trim()} onClick={() => void capture()}>
          {busy ? 'Capturing…' : 'Capture'}
        </button>
      </div>

      {message && <p className="quick-capture-message" role="status">{message}</p>}
      {actions.length > 0 && (
        <div className="ai-action-summary">
          {actions.map((action, index) => (
            <span key={action.tool + index} className={action.ok ? 'ai-action-chip is-ok' : 'ai-action-chip is-error'}>
              {action.ok ? '✓' : '!'} {action.tool.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
