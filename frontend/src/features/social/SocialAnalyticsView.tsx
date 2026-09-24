import { useEffect, useState } from 'react'
import { disconnectInstagram, getInstagramInsights, type InstagramInsightsResponse } from '../../integrations/instagramApi'

function formatNumber(value: number | undefined) {
  return typeof value === 'number' ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value) : '—'
}

export function SocialAnalyticsView() {
  const [data, setData] = useState<InstagramInsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [disconnecting, setDisconnecting] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      setData(await getInstagramInsights())
      setError('')
    } catch (reason) {
      setData(null)
      setError(reason instanceof Error ? reason.message : 'Instagram analytics unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Instagram from MiD-Daily?')) return
    setDisconnecting(true)
    setError('')
    try {
      await disconnectInstagram()
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to disconnect Instagram.')
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <div>
          <span className="section-kicker">SOCIAL ANALYTICS</span>
          <h2>See the signal.</h2>
          <p>Read-only Instagram Professional account analytics, kept separate from your Tasks, Finance, and Schedule data.</p>
        </div>
      </div>

      <div className="content-card integration-panel social-foundation-card">
        <div className="card-heading">
          <div>
            <span className="section-kicker">INSTAGRAM</span>
            <h3>{data?.username ? '@' + data.username : 'Professional account analytics'}</h3>
          </div>
          <div className="integration-actions">
            <span className="integration-badge">{loading ? 'CHECKING' : data ? (data.scope === 'user' ? 'CONNECTED' : 'DEPLOYMENT READ') : 'SETUP NEEDED'}</span>
            {data?.scope === 'user' && (
              <button className="text-button danger" type="button" disabled={loading || disconnecting} onClick={() => void handleDisconnect()}>
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            )}
            <button className="text-button" type="button" disabled={loading || disconnecting} onClick={() => void refresh()}>
              {loading ? 'Checking…' : 'Refresh'}
            </button>
          </div>
        </div>

        {data ? (
          <>
            <div className="social-foundation-grid">
              <div><span>Followers</span><strong>{formatNumber(data.followers)}</strong><small>Current profile count.</small></div>
              <div><span>Views</span><strong>{formatNumber(data.views)}</strong><small>Today's aggregated views.</small></div>
              <div><span>Reach</span><strong>{formatNumber(data.reach)}</strong><small>Today's aggregated reach.</small></div>
              <div><span>Engaged</span><strong>{formatNumber(data.accountsEngaged)}</strong><small>Accounts engaged today.</small></div>
              <div><span>Interactions</span><strong>{formatNumber(data.totalInteractions)}</strong><small>Total interactions today.</small></div>
            </div>
            <small className="social-updated">Updated {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.updatedAt))}</small>
          </>
        ) : (
          <>
            <p className="integration-description">
              {error || 'Connect an Instagram Professional account to load live analytics.'}
            </p>
            <div className="social-setup-panel">
              <strong>Connect a Professional account</strong>
              <span>MiD-Daily is ready to read your Instagram analytics. Provider credentials are configured on the deployment, not entered into this page.</span>
              <div className="integration-actions">
                <button className="secondary-button" type="button" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer')}>Open provider setup</button>
                <a href="https://developers.facebook.com/docs/instagram-platform/" target="_blank" rel="noreferrer">Read Meta Instagram Platform docs ↗</a>
              </div>
              <details className="provider-details">
                <summary>Developer setup details</summary>
                <span>Server configuration uses INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_GRAPH_VERSION, and INSTAGRAM_ACCOUNT_ID. These values stay out of the user-facing form.</span>
              </details>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
