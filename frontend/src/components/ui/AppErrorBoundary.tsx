import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react'

interface AppErrorBoundaryState {
  hasError: boolean
  message: string
}

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MiD-Daily runtime error', error, info)
  }

  private reload = () => window.location.reload()

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="auth-shell">
        <section className="auth-card">
          <span className="section-kicker">RECOVERY</span>
          <h1>MiD-Daily hit a runtime error.</h1>
          <p className="auth-subtitle">Your saved remote data is not deleted. Reload the app to restore the workspace.</p>
          <button className="primary-button" type="button" onClick={this.reload}>Reload MiD-Daily</button>
        </section>
      </main>
    )
  }
}
