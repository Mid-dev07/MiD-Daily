import type { SocialAccountSummary } from './social.types'

const demoSummary: SocialAccountSummary = {
  provider: 'INSTAGRAM',
  accountId: 'demo',
  username: 'demo_account',
  followers: 0,
  reach: 0,
  impressions: 0,
  profileViews: 0,
  engagementRate: 0,
  updatedAt: new Date().toISOString(),
}

export function SocialAnalyticsView() {
  const summary = demoSummary

  return (
    <section className="workspace page-enter">
      <div className="page-intro">
        <div><span className="section-kicker">SOCIAL ANALYTICS</span><h2>See the signal.</h2><p>Read-only analytics are isolated from the core productivity data and normalized per provider.</p></div>
      </div>

      <div className="content-card integration-panel">
        <div className="card-heading"><div><span className="section-kicker">INSTAGRAM</span><h3>Professional account analytics</h3></div><span className="integration-badge">FOUNDATION</span></div>
        <p className="integration-description">The analytics layer is ready for an authenticated Instagram Professional connection. Live values remain disabled until provider OAuth and permissions are configured.</p>
      </div>

      <div className="stat-row">
        <article className="stat-card"><span>Followers</span><strong>{summary.followers}</strong><small>provider metric</small></article>
        <article className="stat-card"><span>Reach</span><strong>{summary.reach}</strong><small>provider metric</small></article>
        <article className="stat-card"><span>Profile views</span><strong>{summary.profileViews}</strong><small>provider metric</small></article>
      </div>
    </section>
  )
}
