import { route } from 'quasar/wrappers';
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router';
import routes from './routes';
import { isAuthenticated, isAdmin } from 'src/services/authStorage';
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

  // Navigation Guards
  Router.beforeEach((to, from, next) => {
    const userStore = useUserStore();

    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
    const isGuestRoute = to.matched.some(record => record.meta.guest);
    const piniaUser = userStore.getUser;
    const piniaToken = userStore.getToken;
    const piniaAuthenticated = Boolean(piniaUser && piniaToken);
    const authenticated = piniaAuthenticated || isAuthenticated();
    const userIsAdmin = (piniaUser?.role === 'admin') || isAdmin();

    // If persisted user exists but token missing, clear to avoid redirect loops
    if (piniaUser && !piniaToken) {
      userStore.signOut();
      if (requiresAuth) {
        next({ name: 'login' });
        return;
      }
    }

    // Default route handling - redirect to login or account select
    if (to.path === '/' && !to.name) {
      if (authenticated) {
        next({ name: 'account-select' });
      } else {
        next({ name: 'login' });
      }
      return;
    }

    // If route requires auth and user is not authenticated
    if (requiresAuth && !authenticated) {
      // For admin routes, redirect to admin login
      if (requiresAdmin) {
        next({ name: 'admin-login' });
      } else {
        next({ name: 'login' });
      }
      return;
    }

    // If route requires admin and user is not admin
    if (requiresAdmin && !userIsAdmin) {
      next({ name: 'admin-login' });
      return;
    }

    // If user is authenticated and tries to access guest-only route (login, signup)
    if (isGuestRoute && authenticated) {
      // If admin, redirect to admin dashboard
      if (userIsAdmin && to.name !== 'admin-login') {
        next({ name: 'admin-dashboard' });
      } else {
        next({ name: 'account-select' });
      }
      return;
    }

    next();
  });

  return Router;
});
