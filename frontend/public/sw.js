const CACHE_VERSION = 'mid-daily-v3'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => key.startsWith('mid-daily-') && key !== CACHE_VERSION ? caches.delete(key) : undefined)))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // Never let the service worker cache the SPA shell or API responses.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.startsWith('/api/')) {
    return
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          return
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
      return undefined
    }),
  )
})
