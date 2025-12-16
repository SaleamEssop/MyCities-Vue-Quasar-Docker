import { register } from 'register-service-worker'

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready (/* registration */) {
    console.log('MyCities service worker is active.')
  },

  registered (/* registration */) {
    console.log('MyCities service worker has been registered.')
  },

  cached (/* registration */) {
    console.log('MyCities content has been cached for offline use.')
  },

  updatefound (/* registration */) {
    console.log('New MyCities content is downloading.')
  },

  updated (/* registration */) {
    console.log('New MyCities content is available; please refresh.')
  },

  offline () {
    console.log('No internet connection found. MyCities is running in offline mode.')
  },

  error (err) {
    console.error('Error during MyCities service worker registration:', err)
  }
})







