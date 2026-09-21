import type { SocialAccountSummary } from './social.types'

export function SocialAnalyticsView() {
  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <div><span className="section-kicker">SOCIAL ANALYTICS</span><h2>See the signal.</h2><p>Read-only analytics are isolated from the core productivity data and normalized per provider.</p></div>
      </div>

      <div className="content-card integration-panel social-foundation-card">
        <div className="card-heading">
          <div><span className="section-kicker">INSTAGRAM</span><h3>Professional account analytics</h3></div>
          <span className="integration-badge">FOUNDATION</span>
        </div>
        <p className="integration-description">The analytics adapter is ready for an authenticated Instagram Professional connection. Live values stay hidden until provider OAuth, account mapping, and the required permissions are configured.</p>

        <div className="social-foundation-grid">
          <div><span>Connection</span><strong>Not connected</strong><small>No provider account linked.</small></div>
          <div><span>Data mode</span><strong>Read-only</strong><small>Analytics never write to core data.</small></div>
          <div><span>Metrics</span><strong>Prepared</strong><small>Followers, reach, views, and engagement.</small></div>
        </div>
      </div>

      <div className="content-card empty-state social-empty-state">
        <strong>Live Instagram analytics are not enabled yet.</strong>
        <span>Configure the provider connection before showing real metrics here.</span>
      </div>
    </section>
  )
}
