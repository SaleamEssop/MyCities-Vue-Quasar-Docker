/*
 * MyCities Custom Service Worker
 * This file is used when workboxPluginMode is set to 'InjectManifest'
 */

import { precacheAndRoute } from 'workbox-precaching'

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST)

// Custom caching strategies can be added here
// For example, cache API responses:
/*
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
)
*/

// Handle offline fallback
self.addEventListener('fetch', (event) => {
  // Let Workbox handle most requests
  // Add custom offline handling here if needed
})

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from MyCities',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-128x128.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('MyCities', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})







