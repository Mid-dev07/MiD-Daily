import { useEffect, useState } from 'react'
import { WorkspaceHeader } from '../../components/ui/WorkspaceHeader'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../types'
import { removeProfileAvatar, saveProfile, uploadProfileAvatar } from './profileApi'

interface ProfileViewProps {
  user: User
  profile: Profile
  onProfileChange: (profile: Profile) => void
  onToast: (message: string) => void
}

export function ProfileView({ user, profile, onProfileChange, onToast }: ProfileViewProps) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  useEffect(() => {
    setDisplayName(profile.displayName)
    setUsername(profile.username)
    setBio(profile.bio)
  }, [profile])

  const initials = displayName.trim().slice(0, 2).toUpperCase() || 'M'

  const handleSave = async () => {
    setSaving(true)
    try {
      const next = await saveProfile(user.id, { displayName, username, bio })
      onProfileChange(next)
      onToast('Profile updated')
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return
    setPhotoBusy(true)
    try {
      const next = await uploadProfileAvatar(user.id, file)
      onProfileChange(next)
      onToast('Profile photo updated')
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : 'Unable to update profile photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const handlePhotoRemove = async () => {
    setPhotoBusy(true)
    try {
      const next = await removeProfileAvatar(user.id, profile.avatarPath)
      onProfileChange(next)
      onToast('Profile photo removed')
    } catch (reason) {
      onToast(reason instanceof Error ? reason.message : 'Unable to remove profile photo.')
    } finally {
      setPhotoBusy(false)
    }
  }

  return (
    <section className="workspace page-enter">
      <WorkspaceHeader
        index="007"
        kicker="ACCOUNT"
        title="Your profile"
        description="Make your account feel like yours with a photo, display name, username, and bio."
      />

      <div className="profile-layout">
        <section className="content-card profile-hero-card">
          <div className="profile-avatar-large-wrap">
            {profile.avatarUrl ? (
              <img className="profile-avatar-large" src={profile.avatarUrl} alt={displayName + ' profile'} />
            ) : (
              <div className="profile-avatar-large profile-avatar-fallback" aria-hidden="true">{initials}</div>
            )}
          </div>
          <div className="profile-hero-copy">
            <span className="section-kicker">PROFILE PHOTO</span>
            <h3>{displayName || 'MiD User'}</h3>
            <p>{username ? '@' + username : 'Add a username to make your profile easier to recognize.'}</p>
            <div className="profile-photo-actions">
              <label className="secondary-button" aria-disabled={photoBusy}>
                {photoBusy ? 'Uploading…' : 'Change photo'}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={photoBusy}
                  onChange={(event) => void handlePhotoChange(event.target.files?.[0])}
                />
              </label>
              {profile.avatarPath && (
                <button className="text-button danger" type="button" disabled={photoBusy} onClick={() => void handlePhotoRemove()}>
                  Remove
                </button>
              )}
            </div>
            <span className="profile-photo-hint">JPG, PNG, or WebP · max 5 MB</span>
          </div>
        </section>

        <section className="content-card profile-form-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">PERSONAL INFO</span>
              <h3>Profile details</h3>
            </div>
          </div>

          <div className="profile-form">
            <label>
              Display name
              <input value={displayName} maxLength={60} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" />
              <span className="profile-counter">{displayName.length}/60</span>
            </label>

            <label>
              Username
              <div className="profile-input-prefix">
                <span>@</span>
                <input value={username} maxLength={24} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s+/g, '_'))} placeholder="your_username" />
              </div>
              <span className="profile-field-hint">3–24 characters · lowercase letters, numbers, underscores.</span>
            </label>

            <label>
              Bio
              <textarea value={bio} maxLength={160} rows={5} onChange={(event) => setBio(event.target.value)} placeholder="Tell a little about yourself." />
              <span className="profile-counter">{bio.length}/160</span>
            </label>

            <div className="profile-form-section">
              <span className="section-kicker">ACCOUNT</span>
              <div className="profile-account-row">
                <div>
                  <strong>{user.email ?? 'Email account'}</strong>
                  <span>Email is managed by your authentication provider.</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="primary-button" type="button" disabled={saving} onClick={() => void handleSave()}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}
