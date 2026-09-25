import { useEffect, useState } from 'react'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  disconnectInstagram,
  getInstagramInsights,
  startInstagramAuthentication,
  type InstagramInsightsResponse,
} from '../../integrations/instagramApi'
import { getIntegrationStatus, type IntegrationStatus } from '../../integrations/integrationsApi'

function formatNumber(value: number | undefined) {
  return typeof value === 'number' ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value) : '—'
}

export function SocialAnalyticsView() {
  const [data, setData] = useState<InstagramInsightsResponse | null>(null)
  const [integration, setIntegration] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const [nextIntegration, nextData] = await Promise.all([
        getIntegrationStatus(),
        getInstagramInsights().catch(() => null),
      ])
      setIntegration(nextIntegration)
      setData(nextData)
      setError('')
    } catch (reason) {
      setData(null)
      setError(reason instanceof Error ? reason.message : 'Instagram analytics unavailable.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('instagram')
    if (result === 'connected') setNotice('Instagram connected. Live analytics are now scoped to your account.')
    if (result === 'error') setError('Instagram connection could not be completed. Please try again.')
    if (result) window.history.replaceState({}, '', window.location.pathname)
    void refresh()
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const result = await startInstagramAuthentication()
      window.location.assign(result.authorizationUrl)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to start Instagram connection.')
      setConnecting(false)
    }
  }

  const requestDisconnect = () => {
    setConfirmDisconnect(true)
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    setError('')
    try {
      await disconnectInstagram()
      setNotice('Instagram disconnected.')
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to disconnect Instagram.')
    } finally {
      setDisconnecting(false)
    }
  }

  const userConnected = data?.scope === 'user' || integration?.instagram.state === 'CONNECTED'
  const connectable = integration?.instagram.connectable === true

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="005"
        kicker="DIGITAL PULSE"
        title="See the signal."
        description="Read-only Instagram Professional analytics, kept separate from your Tasks, Finance, and Schedule data."
      />

      {notice && <div className="ai-availability-note" role="status"><strong>{notice}</strong><span>You can disconnect the account at any time from this workspace.</span></div>}
      {error && <div className="form-error" role="alert">{error}</div>}

      <div className="content-card integration-panel social-foundation-card" data-spatial-role="primary">
        <div className="card-heading">
          <div>
            <span className="section-kicker">INSTAGRAM</span>
            <h3>{data?.username ? '@' + data.username : 'Professional account analytics'}</h3>
          </div>
          <div className="integration-actions">
            <span className="integration-badge">
              {loading ? 'CHECKING' : userConnected ? 'CONNECTED' : data?.scope === 'deployment' ? 'DEPLOYMENT READ' : connectable ? 'READY TO CONNECT' : 'SETUP NEEDED'}
            </span>
            {userConnected ? (
              <button className="text-button danger" type="button" disabled={loading || disconnecting} onClick={requestDisconnect}>
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            ) : connectable ? (
              <button className="secondary-button" type="button" disabled={loading || connecting} onClick={() => void handleConnect()}>
                {connecting ? 'Opening…' : 'Connect Instagram'}
              </button>
            ) : null}
            <button className="text-button" type="button" disabled={loading || connecting || disconnecting} onClick={() => void refresh()}>
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
            <small className="social-updated">
              {data.scope === 'user' ? 'Connected to your Instagram account · ' : 'Deployment analytics · '}
              Updated {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.updatedAt))}
            </small>
          </>
        ) : (
          <div className="social-setup-panel">
            <strong>{connectable ? 'Connect your Instagram Professional account' : 'Instagram analytics needs provider setup'}</strong>
            <span>
              {connectable
                ? 'MiD will send you to Instagram to authorize access. Provider tokens remain server-side and are encrypted before storage.'
                : error || 'Live analytics are not available until Instagram credentials are configured on this deployment.'}
            </span>
            <div className="integration-actions">
              {connectable && (
                <button className="primary-button" type="button" disabled={connecting} onClick={() => void handleConnect()}>
                  {connecting ? 'Opening…' : 'Connect Instagram'}
                </button>
              )}
              {!connectable && (
                <button className="secondary-button" type="button" onClick={() => window.open('https://developers.facebook.com/apps/', '_blank', 'noopener,noreferrer')}>Open provider setup</button>
              )}
              <a href="https://developers.facebook.com/docs/instagram-platform/" target="_blank" rel="noreferrer">Read Meta Instagram Platform docs ↗</a>
            </div>
            {!connectable && (
              <details className="provider-details">
                <summary>Developer setup details</summary>
                <span>Instagram OAuth requires INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET, INSTAGRAM_REDIRECT_URI, and INSTAGRAM_GRAPH_VERSION. Deployment analytics can still use the legacy INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID fallback.</span>
              </details>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmDisconnect}
        eyebrow="INSTAGRAM"
        title="Disconnect Instagram?"
        description="MiD will remove the current Instagram connection. Your saved workspace data will remain untouched."
        confirmLabel="Disconnect"
        tone="danger"
        busy={disconnecting}
        onCancel={() => setConfirmDisconnect(false)}
        onConfirm={async () => {
          await handleDisconnect()
          setConfirmDisconnect(false)
        }}
      />

    </section>
  )
}
