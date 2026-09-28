import { useEffect, useState } from 'react'
import { getProfile } from './profileApi'
import type { Profile } from '../../types'
import type { User } from '@supabase/supabase-js'

interface UseWorkspaceProfileOptions {
  user: User | null
  onError?: (message: string) => void
}

export function useWorkspaceProfile({ user, onError }: UseWorkspaceProfileOptions) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(Boolean(user))

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfile(null)
    setProfileLoading(true)

    void getProfile(user)
      .then((next) => {
        if (active) setProfile(next)
      })
      .catch((reason) => {
        if (active) onError?.(reason instanceof Error ? reason.message : 'Unable to load profile.')
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })

    return () => { active = false }
  }, [user, onError])

  return { profile, setProfile, profileLoading }
}
