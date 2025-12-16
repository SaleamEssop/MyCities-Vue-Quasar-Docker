import { defineStore, getActivePinia } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    authToken: null,
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.authToken,
  },

  actions: {
    setUser(_user, _authToken) {
      this.user = _user;
      this.authToken = _authToken;
    },
    signOut() {
      // Get active Pinia instance at call time, not module load time
      // This prevents stale reference issues with HMR in dev mode
      const pinia = getActivePinia();
      if (pinia && pinia._s) {
        pinia._s.forEach((store) => store.$reset());
      } else {
        // Fallback: reset this store directly
        this.user = null;
        this.authToken = null;
      }
    },
  },
  persist: true,
});
