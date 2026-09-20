import type { PropsWithChildren } from 'react'
import { AuthView } from './AuthView'
import { useAuth } from './AuthProvider'

export function AuthGate({ children }: PropsWithChildren) {
  const { configured, loading, user } = useAuth()
  const recovery = new URLSearchParams(window.location.search).get('type') === 'recovery'

  if (!configured) return children
  if (loading) {
    return <main className="auth-shell"><section className="auth-card"><span className="section-kicker">ACCOUNT</span><h1>Loading MiD-Daily…</h1><p className="auth-subtitle">Restoring your session.</p></section></main>
  }
  if (recovery || !user) return <AuthView />
  return children
}
