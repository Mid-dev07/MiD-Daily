export async function registerBrowserServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null

  try {
    return await navigator.serviceWorker.register('/sw.js')
  } catch {
    return null
  }
}
