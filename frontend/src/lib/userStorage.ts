import { readStorage, writeStorage } from './storage'

function scopedKey(baseKey: string, userId?: string) {
  return userId ? `${baseKey}:${userId}` : baseKey
}

function readRawStorage(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function removeStorage(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Storage can be unavailable in restricted contexts.
  }
}

export function readUserStorage<T>(baseKey: string, userId: string | undefined, fallback: T): T {
  const key = scopedKey(baseKey, userId)

  if (userId) {
    const rawScoped = readRawStorage(key)
    if (rawScoped) return readStorage(key, fallback)

    const legacy = readRawStorage(baseKey)
    if (legacy) {
      const migrated = readStorage(baseKey, fallback)
      writeStorage(key, migrated)
      removeStorage(baseKey)
      return migrated
    }
  }

  return readStorage(key, fallback)
}

export function writeUserStorage<T>(baseKey: string, userId: string | undefined, value: T) {
  writeStorage(scopedKey(baseKey, userId), value)
}

export function hasUserStorage(baseKey: string, userId?: string) {
  return Boolean(userId && readRawStorage(`${baseKey}:${userId}`))
}
