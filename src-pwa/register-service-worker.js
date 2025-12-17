import { register } from 'register-service-worker'

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready (registration) {
    console.log('MyCities service worker is active.')
    // Check for updates every 60 seconds
    setInterval(() => {
      registration.update()
    }, 60 * 1000)
  },

  registered (registration) {
    console.log('MyCities service worker has been registered.')
    // Check for updates immediately after registration
    registration.update()
  },

  cached (/* registration */) {
    console.log('MyCities content has been cached for offline use.')
  },

  updatefound (registration) {
    console.log('New MyCities content is downloading.')
    const installingWorker = registration.installing
    if (installingWorker) {
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New content available, auto-reload
          console.log('New content installed, reloading...')
          window.location.reload()
        }
      })
    }
  },

  updated (registration) {
    console.log('New MyCities content is available, refreshing...')
    // Skip waiting and activate new service worker immediately
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    // Force reload to get new content
    window.location.reload()
  },

  offline () {
    console.log('No internet connection found. MyCities is running in offline mode.')
  },

  error (err) {
    console.error('Error during MyCities service worker registration:', err)
  }
})







