const SYNC_MARKER_PREFIX = 'mid-daily.remote-sync'

function markerKey(baseKey: string, userId: string) {
  return `${SYNC_MARKER_PREFIX}:${baseKey}:${userId}`
}

export function hasCompletedRemoteSync(baseKey: string, userId: string) {
  return localStorage.getItem(markerKey(baseKey, userId)) === '1'
}

export function markRemoteSyncComplete(baseKey: string, userId: string) {
  localStorage.setItem(markerKey(baseKey, userId), '1')
}
