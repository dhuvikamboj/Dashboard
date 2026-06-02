const CACHE = 'launchpad-v1'
const APP_SHELL = ['/', '/src/main.tsx', '/src/index.css']

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE).then(c => c.addAll(APP_SHELL).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', ev => {
  const url = new URL(ev.request.url)
  if (url.pathname.startsWith('/api/')) {
    ev.respondWith(fetch(ev.request))
    return
  }
  ev.respondWith(
    caches.match(ev.request).then(cached => {
      const net = fetch(ev.request).then(res => {
        if (res.ok) {
          const clone = res.clone()
          caches.open(CACHE).then(c => c.put(ev.request, clone))
        }
        return res
      })
      return cached || net
    })
  )
})
