import { readStorage, writeStorage } from './storage'

function scopedKey(baseKey: string, userId?: string) {
  return userId ? `${baseKey}:${userId}` : baseKey
}

export function readUserStorage<T>(baseKey: string, userId: string | undefined, fallback: T): T {
  const key = scopedKey(baseKey, userId)

  if (userId) {
    const rawScoped = localStorage.getItem(key)
    if (rawScoped) return readStorage(key, fallback)

    const legacy = localStorage.getItem(baseKey)
    if (legacy) {
      const migrated = readStorage(baseKey, fallback)
      writeStorage(key, migrated)
      localStorage.removeItem(baseKey)
      return migrated
    }
  }

  return readStorage(key, fallback)
}

export function writeUserStorage<T>(baseKey: string, userId: string | undefined, value: T) {
  writeStorage(scopedKey(baseKey, userId), value)
}
