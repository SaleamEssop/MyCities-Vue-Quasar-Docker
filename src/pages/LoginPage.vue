<template>
  <q-page class="login-page" data-test="login-page">
    <!-- Header Bar -->
    <div class="header-bar">
      <span>MyCities</span>
    </div>

    <div class="login-container">
      <!-- Logo Section -->
      <div class="logo-section">
        <div class="logo-icon">
          <q-icon name="water_drop" size="64px" />
        </div>
        <h1 class="app-title">MyCities</h1>
        <p class="app-subtitle">Water & Electricity Meter Reading</p>
      </div>

      <!-- Login Form -->
      <div class="login-form-container">
        <!-- Error Message -->
        <div v-if="errorMessage" class="error-banner" data-test="login-error">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Email -->
          <div class="form-field">
            <label class="field-label">Email</label>
            <input
              v-model="email"
              type="email"
              class="field-input"
              placeholder="Enter your email"
              data-test="login-email"
            />
          </div>

          <!-- Password -->
          <div class="form-field">
            <label class="field-label">Password</label>
            <div class="password-field">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                placeholder="Enter your password"
                data-test="login-password"
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" />
              </button>
            </div>
          </div>

          <!-- Login Button -->
          <button 
            type="submit" 
            class="btn-primary"
            :disabled="isLoading"
            data-test="login-submit"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Divider -->
        <div class="divider">
          <span>or</span>
        </div>

        <!-- Demo Login -->
        <button 
          class="btn-secondary"
          :disabled="isDemoLoading"
          @click="handleDemoLogin"
          data-test="login-demo"
        >
          {{ isDemoLoading ? 'Loading...' : 'Use Demo Account' }}
        </button>

        <!-- Forgot Password Link -->
        <div class="forgot-password">
          <a href="#" @click.prevent="goToForgotPassword" data-test="login-forgot-password">
            Forgot Password?
          </a>
        </div>

        <!-- Create Account Link -->
        <div class="create-account">
          <span>Don't have an account?</span>
          <a href="#" @click.prevent="goToRegister" data-test="login-create-account">
            Create Account
          </a>
        </div>
      </div>

      <!-- Demo Hint -->
      <div class="demo-hint">
        <p>Demo: demo@mycities.co.za / demo123</p>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useUserStore } from 'src/stores/user';
import { setSession } from 'src/services/authStorage';
import { userLogin } from 'boot/axios';

const router = useRouter();
const $q = useQuasar();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const isDemoLoading = ref(false);
const errorMessage = ref('');
const hasUser = computed(() => !!userStore.getUser);
const hasToken = computed(() => !!userStore.getToken);

// Email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Redirect if already authenticated
onMounted(() => {
  // Small delay to ensure stores are initialized
  setTimeout(() => {
    if (hasUser.value && hasToken.value) {
      console.log('[Login] Already authenticated, redirecting...');
      router.replace({ name: 'account-select' });
    } else if (hasUser.value && !hasToken.value) {
      // Clean up stale user without token to avoid guard loops
      console.warn('[Login] Stale user without token, clearing...');
      userStore.signOut();
      // Also clear authStorage
      setSession(null);
    }
  }, 50);
});

const handleLogin = async () => {
  errorMessage.value = '';
  
  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }
  
  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Please enter a valid email address';
    return;
  }
  
  isLoading.value = true;
  
  try {
    const response = await userLogin({ email: email.value, password: password.value });
    
    console.log('[Login] Login response:', response);
    
    // Handle different response formats
    let userData = null;
    let token = null;
    
    if (response.status) {
      // Format: { status: true, data: {...}, token: "..." }
      userData = response.data;
      token = response.token;
    } else if (response.user || response.data) {
      // Format: { user: {...}, token: "..." } or { data: {...}, token: "..." }
      userData = response.user || response.data;
      token = response.token || response.access_token;
    }
    
    if (userData && token) {
      // CRITICAL: Clear ALL previous user data before setting new user
      // This ensures complete data isolation between users
      console.log('[Login] Clearing previous user data for isolation...');
      userStore.signOut();
      
      // Also clear any persisted Pinia stores from localStorage
      // This is a safety net for complete user isolation
      const piniaKeys = Object.keys(localStorage).filter(key => key.startsWith('pinia-'));
      piniaKeys.forEach(key => {
        console.log('[Login] Clearing localStorage key:', key);
        localStorage.removeItem(key);
      });
      
      // Clear legacy session data
      localStorage.removeItem('mycities_session');
      localStorage.removeItem('session');
      
      // Store user and token in Pinia store
      userStore.setUser(userData, token);

      // Write compatible session for legacy guards/readers
      setSession({
        accountId: userData.id,
        email: userData.email,
        fullName: userData.name || userData.fullName || userData.email,
        role: userData.role || (userData.is_admin ? 'admin' : 'user'),
        loginAt: new Date().toISOString(),
      });
      
      console.log('[Login] User stored:', userStore.getUser);
      console.log('[Login] Token stored:', !!userStore.getToken);
      
      // Wait for Pinia persistence - longer in dev mode
      await nextTick();
      const isDev = process.env.NODE_ENV === 'development' || process.env.DEV;
      const waitTime = isDev ? 500 : 200; // Longer wait in dev mode
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Verify state before navigation
      const verifyUser = userStore.getUser;
      const verifyToken = userStore.getToken;
      console.log('[Login] Pre-navigation verify:', { hasUser: !!verifyUser, hasToken: !!verifyToken, isDev });
      
      if (!verifyUser || !verifyToken) {
        console.error('[Login] State lost before navigation!');
        errorMessage.value = 'Authentication state error. Please try again.';
        return;
      }
      
      $q.notify({
        type: 'positive',
        message: 'Welcome back!',
        position: 'top',
      });
      
      // Navigate using router.push with additional delay in dev mode
      console.log('[Login] Attempting navigation to account-select...');
      console.log('[Login] Current route:', router.currentRoute.value.path);
      
      // Use router.push with delay - longer in dev mode
      setTimeout(() => {
        console.log('[Login] Executing router.push...');
        router.push({ name: 'account-select' }).then(() => {
          console.log('[Login] Navigation successful');
        }).catch(err => {
          console.error('[Login] Router.push failed:', err);
          // Fallback to hash navigation
          window.location.hash = '#/select-account';
        });
      }, isDev ? 200 : 100);
    } else {
      console.error('[Login] Invalid response format:', response);
      errorMessage.value = response.msg || 'Login failed - invalid response';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = error.response?.data?.msg || error.message || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

const handleDemoLogin = () => {
  // Populate the form fields with demo credentials
  email.value = 'demo@mycities.co.za';
  password.value = 'demo123';
  errorMessage.value = '';
  
  $q.notify({
    type: 'info',
    message: 'Demo credentials filled. Click Sign In to continue.',
    position: 'top',
    timeout: 2000,
  });
};

const goToRegister = () => {
  router.push({ name: 'register' });
};

const goToForgotPassword = () => {
  router.push({ name: 'forgot-password' });
};
</script>

<style lang="scss" scoped>
// Theme colors - easily customizable
// TODO: Update $primary to light green when hex code is provided
$primary: #3294B8;
$primary-dark: #2a7a9a;
$dark-bg: #1a1a1a;
$border: #e0e0e0;
$text-secondary: #666666;

.login-page {
  background: linear-gradient(180deg, $primary 0%, $primary-dark 100%);
  min-height: 100vh;
}

.header-bar {
  background: #E0E0E0;
  color: #000000;
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.login-container {
  padding: 24px 16px;
  max-width: 420px;
  margin: 0 auto;
}

.logo-section {
  text-align: center;
  padding: 32px 0;
  color: white;
}

.logo-icon {
  margin-bottom: 16px;
}

.app-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.app-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.login-form-container {
  background: white;
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.error-banner {
  background: #ffebee;
  color: #c62828;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 15px;
  font-weight: 500;
}

.form-field {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.field-input {
  width: 100%;
  padding: 16px 18px;
  border: 2px solid $border;
  border-radius: 10px;
  font-size: 17px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }
  
  &::placeholder {
    color: #999;
    font-size: 16px;
  }
}

.password-field {
  position: relative;
  
  .field-input {
    padding-right: 52px;
  }
  
  .toggle-password {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 6px;
    font-size: 20px;
  }
}

.btn-primary {
  width: 100%;
  padding: 16px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  
  &:hover:not(:disabled) {
    background: $primary-dark;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: $border;
  }
  
  span {
    padding: 0 16px;
    color: #999;
    font-size: 14px;
    font-weight: 500;
  }
}

.btn-secondary {
  width: 100%;
  padding: 16px;
  background: white;
  color: $primary;
  border: 2px solid $primary;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: rgba($primary, 0.05);
  }
  
  &:active:not(:disabled) {
    transform: scale(0.98);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.forgot-password {
  text-align: center;
  margin-top: 20px;
  
  a {
    color: $primary;
    text-decoration: none;
    font-size: 15px;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.create-account {
  text-align: center;
  margin-top: 16px;
  font-size: 15px;
  
  span {
    color: #666;
  }
  
  a {
    color: $primary;
    text-decoration: none;
    font-weight: 600;
    margin-left: 4px;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

.demo-hint {
  text-align: center;
  margin-top: 28px;
  
  p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin: 0;
    font-weight: 500;
  }
}
</style>
