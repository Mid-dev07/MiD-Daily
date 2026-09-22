import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { checkPasswordExposure } from '../../lib/api'

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  recovery: boolean
  clearRecovery: () => void
  signInWithPassword: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signInWithGoogle: () => Promise<string | null>
  resetPassword: (email: string) => Promise<string | null>
  updatePassword: (password: string) => Promise<string | null>
  signOut: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(supabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)
  const [recovery, setRecovery] = useState(() => new URLSearchParams(window.location.search).get('type') === 'recovery')

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    void supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false))

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const clearRecovery = () => {
    setRecovery(false)
    if (window.location.search.includes('type=recovery')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  const value = useMemo<AuthContextValue>(() => ({
    configured: supabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    recovery,
    clearRecovery,
    signInWithPassword: async (email, password) => {
      if (!supabase) return 'Authentication is not configured.'
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return error?.message ?? null
    },
    signUp: async (email, password) => {
      if (!supabase) return { error: 'Authentication is not configured.', needsConfirmation: false }
      try {
        await checkPasswordExposure(password)
      } catch (reason) {
        return { error: reason instanceof Error ? reason.message : 'Password security check is unavailable. Please try again.', needsConfirmation: false }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      return {
        error: error?.message ?? null,
        needsConfirmation: Boolean(!error && data.user && !data.session),
      }
    },
    signInWithGoogle: async () => {
      if (!supabase) return 'Authentication is not configured.'
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      return error?.message ?? null
    },
    resetPassword: async (email) => {
      if (!supabase) return 'Authentication is not configured.'
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      return error?.message ?? null
    },
    updatePassword: async (password) => {
      if (!supabase) return 'Authentication is not configured.'
      try {
        await checkPasswordExposure(password)
      } catch (reason) {
        return reason instanceof Error ? reason.message : 'Password security check is unavailable. Please try again.'
      }
      const { error } = await supabase.auth.updateUser({ password })
      return error?.message ?? null
    },
    signOut: async () => {
      if (!supabase) return null
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      return error?.message ?? null
    },
  }), [loading, session, recovery])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
