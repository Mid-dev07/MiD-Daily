import { useEffect, useState } from 'react'
import { getInstagramInsights, type InstagramInsightsResponse } from '../../integrations/instagramApi'

function formatNumber(value: number | undefined) {
  return typeof value === 'number' ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value) : '—'
}

export function SocialAnalyticsView() {
  const [data, setData] = useState<InstagramInsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
            <span className="integration-badge">{loading ? 'CHECKING' : data ? 'LIVE READ' : 'SETUP NEEDED'}</span>
            <button className="text-button" type="button" disabled={loading} onClick={() => void refresh()}>
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
              <strong>Provider setup</strong>
              <span>MiD-Daily is ready for a server-side Instagram access token. Configure <code>INSTAGRAM_ACCESS_TOKEN</code>, <code>INSTAGRAM_GRAPH_VERSION</code>, and <code>INSTAGRAM_ACCOUNT_ID</code>.</span>
              <a href="https://developers.facebook.com/docs/instagram-platform/" target="_blank" rel="noreferrer">Open Meta Instagram Platform docs ↗</a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
