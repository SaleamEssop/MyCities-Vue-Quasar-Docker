import { route } from 'quasar/wrappers';
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import routes from './routes';
import { isAuthenticated, isAdmin, getSession, logout } from 'src/services/authStorage';
import { useUserStore } from 'src/stores/user';

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition;
      }
      if (to.hash) {
        return {
          el: to.hash,
          behavior: 'smooth',
        };
      }
      return { left: 0, top: 0 };
    },
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  // Navigation Guards (Updated for Splash v2)
  Router.beforeEach(async (to, from, next) => {
    console.log('[Router] Nav v2:', { from: from.path, to: to.path, name: to.name, matched: to.matched.length });
    
    // In dev mode, wait longer for Pinia store to hydrate (hot-reload can delay it)
    const isDev = process.env.NODE_ENV === 'development' || process.env.DEV;
    const waitTime = isDev ? 100 : 0;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    const userStore = useUserStore();
    
    // In dev mode, wait for store to be ready (check if store instance exists)
    if (isDev) {
      let attempts = 0;
      while (!userStore.$state && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
    }
    
    const piniaUser = userStore.getUser;
    const piniaToken = userStore.getToken;
    const piniaAuthenticated = Boolean(piniaUser && piniaToken);
    
    console.log('[Router] Auth state:', { 
      hasUser: !!piniaUser, 
      hasToken: !!piniaToken, 
      authenticated: piniaAuthenticated,
      user: piniaUser ? { id: piniaUser.id, email: piniaUser.email } : null
    });

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
    const isGuestRoute = to.matched.some(record => record.meta.guest);
    const isPublicRoute = to.matched.some(record => record.meta.public);

    // Clean up stale state FIRST - before any checks
    if (piniaUser && !piniaToken) {
      console.warn('[Router] Stale user without token - clearing');
      userStore.signOut();
      const authStorageSession = getSession();
      if (authStorageSession) {
        logout();
      }
    }

    // Use ONLY Pinia for authentication check (simplified)
    const authenticated = piniaAuthenticated;
    const userIsAdmin = piniaUser?.role === 'admin' || piniaUser?.is_admin === 1;

    // Public routes are always accessible (splash page, etc.)
    if (isPublicRoute) {
      console.log('[Router] Public route - allowing access to:', to.path);
      next();
      return;
    }

    // Default route handling - let Vue Router decide based on routes config
    // The splash route with path "" should match by default
    if (to.path === '/' && to.name === 'splash') {
      console.log('[Router] Splash page - allowing');
      next();
      return;
    }

    // Protect auth-required routes
    if (requiresAuth && !authenticated) {
      // Special case: if we have a user (even without token), allow navigation to account-select
      // This handles timing issues where token hasn't persisted yet
      if (to.name === 'account-select' && piniaUser) {
        console.log('[Router] Allowing account-select - user exists (token may be delayed)');
        next();
        return;
      }
      
      // If navigating to account-select from login, check authStorage as fallback
      if (to.name === 'account-select' && from.name === 'login') {
        const authSession = getSession();
        if (authSession) {
          console.log('[Router] Allowing account-select - authStorage session exists');
          next();
          return;
        }
      }
      
      console.log('[Router] Auth required but not authenticated -> login');
      if (requiresAdmin) {
        next({ name: 'admin-login' });
      } else {
        next({ name: 'login' });
      }
      return;
    }

    // Protect admin routes
    if (requiresAdmin && !userIsAdmin) {
      console.log('[Router] Admin required but not admin -> admin-login');
      next({ name: 'admin-login' });
      return;
    }

    // Redirect authenticated users away from guest routes
    if (isGuestRoute && authenticated && to.name === 'login') {
      console.log('[Router] Authenticated user on login page -> account-select');
      next({ name: 'account-select' });
      return;
    }

    // Allow navigation - don't block if we get here
    console.log('[Router] Allowing navigation to:', to.path, 'authenticated:', authenticated);
    next();
  });

  return Router;
});
