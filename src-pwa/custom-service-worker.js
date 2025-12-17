/*
 * MyCities Custom Service Worker
 * This file is used when workboxPluginMode is set to 'InjectManifest'
 */

import { precacheAndRoute } from 'workbox-precaching'

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST)

// Skip waiting immediately when a new service worker is available
// This ensures users always get the latest version
self.addEventListener('install', () => {
  console.log('Service worker installing, skipping wait...')
  self.skipWaiting()
})

// Claim all clients immediately
self.addEventListener('activate', (event) => {
  console.log('Service worker activating, claiming clients...')
  event.waitUntil(self.clients.claim())
})

// Listen for SKIP_WAITING message from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Received SKIP_WAITING message, activating new service worker...')
    self.skipWaiting()
  }
})

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







