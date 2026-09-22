import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../types'

interface ProfileRow {
  user_id: string
  display_name: string
  username: string | null
  bio: string
  avatar_path: string | null
  created_at: string
  updated_at: string
}

export interface ProfileDraft {
  displayName: string
  username: string
  bio: string
}

function defaultDisplayName(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const candidate = metadata?.full_name ?? metadata?.name
  if (typeof candidate === 'string' && candidate.trim()) return candidate.trim().slice(0, 60)
  const emailName = user.email?.split('@')[0]?.trim()
  return emailName ? emailName.slice(0, 60) : 'MiD User'
}

function mapProfile(row: ProfileRow, avatarUrl: string | null): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    username: row.username ?? '',
    bio: row.bio,
    avatarPath: row.avatar_path,
    avatarUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function signedAvatarUrl(path: string | null) {
  if (!supabase || !path) return null
  const { data } = await supabase.storage.from('profile-avatars').createSignedUrl(path, 3600)
  return data?.signedUrl ?? null
}

export async function getProfile(user: User): Promise<Profile> {
  if (!supabase) throw new Error('Profile storage is not configured.')

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id,display_name,username,bio,avatar_path,created_at,updated_at')
    .eq('user_id', user.id)
    .maybeSingle<ProfileRow>()

  if (error) throw new Error('Unable to load profile: ' + error.message)

  if (!data) {
    const draft = {
      user_id: user.id,
      display_name: defaultDisplayName(user),
      username: null,
      bio: '',
      avatar_path: null,
    }
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .insert(draft)
      .select('user_id,display_name,username,bio,avatar_path,created_at,updated_at')
      .single<ProfileRow>()

    if (createError) throw new Error('Unable to initialize profile: ' + createError.message)
    return mapProfile(created, null)
  }

  return mapProfile(data, await signedAvatarUrl(data.avatar_path))
}

export async function saveProfile(userId: string, draft: ProfileDraft): Promise<Profile> {
  if (!supabase) throw new Error('Profile storage is not configured.')

  const displayName = draft.displayName.trim()
  const username = draft.username.trim().toLowerCase()
  const bio = draft.bio.trim()

  if (displayName.length < 1 || displayName.length > 60) throw new Error('Display name must be between 1 and 60 characters.')
  if (username && !/^[a-z0-9_]{3,24}$/.test(username)) {
    throw new Error('Username must be 3–24 characters using lowercase letters, numbers, or underscores.')
  }
  if (bio.length > 160) throw new Error('Bio must be 160 characters or less.')

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      display_name: displayName,
      username: username || null,
      bio,
    }, { onConflict: 'user_id' })
    .select('user_id,display_name,username,bio,avatar_path,created_at,updated_at')
    .single<ProfileRow>()

  if (error) {
    if (error.code === '23505') throw new Error('That username is already taken.')
    throw new Error('Unable to save profile: ' + error.message)
  }

  return mapProfile(data, await signedAvatarUrl(data.avatar_path))
}

export async function uploadProfileAvatar(userId: string, file: File): Promise<Profile> {
  if (!supabase) throw new Error('Profile storage is not configured.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Profile photo must be 5 MB or smaller.')

  const path = userId + '/avatar'
  const { error: uploadError } = await supabase.storage
    .from('profile-avatars')
    .upload(path, file, { contentType: file.type, upsert: true, cacheControl: '3600' })

  if (uploadError) throw new Error('Unable to upload profile photo: ' + uploadError.message)

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_path: path })
    .eq('user_id', userId)
    .select('user_id,display_name,username,bio,avatar_path,created_at,updated_at')
    .single<ProfileRow>()

  if (error) throw new Error('Unable to save profile photo: ' + error.message)
  return mapProfile(data, await signedAvatarUrl(data.avatar_path))
}

export async function removeProfileAvatar(userId: string, avatarPath: string | null): Promise<Profile> {
  if (!supabase) throw new Error('Profile storage is not configured.')

  if (avatarPath) {
    const { error: removeError } = await supabase.storage.from('profile-avatars').remove([avatarPath])
    if (removeError) throw new Error('Unable to remove profile photo: ' + removeError.message)
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_path: null })
    .eq('user_id', userId)
    .select('user_id,display_name,username,bio,avatar_path,created_at,updated_at')
    .single<ProfileRow>()

  if (error) throw new Error('Unable to update profile: ' + error.message)
  return mapProfile(data, null)
}
