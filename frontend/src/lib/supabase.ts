import { createClient } from '@supabase/supabase-js'

const configuredUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const configuredPublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? ''

// Production fallback keeps the hosted app functional even if its build environment
// was not attached correctly. The publishable key is intended for browser use;
// the backend secret key is never exposed here.
const SUPABASE_URL = configuredUrl || (import.meta.env.DEV ? '' : 'https://ywpvwxhfzgxwmxrwcfsf.supabase.co')
const SUPABASE_PUBLISHABLE_KEY = configuredPublishableKey || (import.meta.env.DEV ? '' : 'sb_publishable_WvWmz-EU2_N0OfrAp2xhBQ_1Y0lZuwH')

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

export const supabase = supabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
