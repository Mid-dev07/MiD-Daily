import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from './AuthProvider'

type Mode = 'signin' | 'signup' | 'reset' | 'recovery'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function AuthView() {
  const { signInWithPassword, signUp, signInWithGoogle, resetPassword, updatePassword, session, recovery, clearRecovery } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (recovery && session) setMode('recovery')
  }, [recovery, session])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const normalizedEmail = normalizeEmail(email)

      if (mode === 'signin') {
        const reason = await signInWithPassword(normalizedEmail, password)
        if (reason) setError(reason)
        return
      }

      if (mode === 'signup') {
        const result = await signUp(normalizedEmail, password)
        if (result.error) setError(result.error)
        else setMessage(result.needsConfirmation ? 'Check your email to confirm the account.' : 'Account created.')
        return
      }

      if (mode === 'reset') {
        const reason = await resetPassword(normalizedEmail)
        if (reason) setError(reason)
        else setMessage('Password reset link sent. Check your email.')
        return
      }

      const reason = await updatePassword(newPassword)
      if (reason) setError(reason)
      else {
        setNewPassword('')
        setMessage('Password updated. You are signed in.')
        clearRecovery()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const continueWithGoogle = async () => {
    if (submitting) return
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      const reason = await signInWithGoogle()
      if (reason) setError(reason)
    } finally {
      setSubmitting(false)
    }
  }

  const title = mode === 'signin' ? 'Welcome back.' : mode === 'signup' ? 'Create your workspace.' : mode === 'reset' ? 'Reset your password.' : 'Choose a new password.'

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="brand-mark">M</span><div><strong>MiD-Daily</strong><span>Daily management workspace</span></div></div>
        <span className="section-kicker">ACCOUNT</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">Sign in to keep your Schedule, Tasks, Finance, and integrations tied to your account.</p>

        {mode !== 'recovery' && (
          <button className="secondary-button auth-google" disabled={submitting} type="button" onClick={() => void continueWithGoogle()}>Continue with Google</button>
        )}

        {mode !== 'recovery' && <div className="auth-divider"><span>or</span></div>}

        <form className="auth-form" onSubmit={submit}>
          {mode !== 'recovery' && (
            <label>Email<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          )}

          {(mode === 'signin' || mode === 'signup') && (
            <label>Password<input type="password" required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          )}

          {mode === 'recovery' && (
            <label>New password<input type="password" required minLength={8} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          )}

          <button className="primary-button" disabled={submitting} type="submit">{submitting ? 'Working…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Update password'}</button>
        </form>

        {error && <div className="form-error auth-message" role="alert">{error}</div>}
        {message && <div className="auth-message is-success" role="status">{message}</div>}

        {mode === 'signin' && <div className="auth-links"><button type="button" className="auth-link" disabled={submitting} onClick={() => setMode('signup')}>Create an account</button><button type="button" className="auth-link" disabled={submitting} onClick={() => setMode('reset')}>Forgot password?</button></div>}
        {mode === 'signup' && <button type="button" className="auth-link" disabled={submitting} onClick={() => setMode('signin')}>Back to sign in</button>}
        {mode === 'reset' && <button type="button" className="auth-link" onClick={() => setMode('signin')}>Back to sign in</button>}
      </section>
    </main>
  )
}
