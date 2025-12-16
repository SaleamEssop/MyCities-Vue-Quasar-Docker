<template>
  <q-page class="forgot-password-page">
    <div class="forgot-container">
      <!-- Header -->
      <div class="header-section">
        <q-btn
          flat
          round
          icon="arrow_back"
          color="white"
          @click="goBack"
          data-test="forgot-back"
        />
        <h1 class="page-title">Reset Password</h1>
        <div style="width: 40px"></div>
      </div>

      <!-- Form Card -->
      <q-card class="forgot-card">
        <q-card-section>
          <!-- Icon -->
          <div class="icon-section">
            <q-icon name="lock_reset" size="64px" color="primary" />
          </div>

          <h2 class="form-title">Forgot your password?</h2>
          <p class="form-subtitle">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <!-- Success Message -->
          <q-banner 
            v-if="successMessage" 
            class="bg-positive text-white q-mb-md"
            rounded
            data-test="forgot-success"
          >
            <template v-slot:avatar>
              <q-icon name="check_circle" />
            </template>
            {{ successMessage }}
          </q-banner>

          <!-- Error Message -->
          <q-banner 
            v-if="errorMessage" 
            class="bg-negative text-white q-mb-md"
            rounded
            data-test="forgot-error"
          >
            {{ errorMessage }}
          </q-banner>

          <q-form @submit.prevent="handleSubmit" class="forgot-form" v-if="!emailSent">
            <!-- Email -->
            <q-input
              v-model="email"
              type="email"
              label="Email Address *"
              outlined
              :rules="[val => !!val || 'Email is required', val => isValidEmail(val) || 'Invalid email format']"
              data-test="forgot-email"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="email" />
              </template>
            </q-input>

            <!-- Submit Button -->
            <q-btn
              type="submit"
              color="primary"
              label="Send Reset Link"
              class="full-width q-mb-md"
              :loading="isLoading"
              data-test="forgot-submit"
            />

            <!-- Back to Login -->
            <div class="back-link">
              <router-link :to="{ name: 'login' }" class="link">
                <q-icon name="arrow_back" size="16px" class="q-mr-xs" />
                Back to Sign In
              </router-link>
            </div>
          </q-form>

          <!-- Email Sent State -->
          <div v-else class="email-sent">
            <q-btn
              color="primary"
              label="Back to Sign In"
              class="full-width"
              :to="{ name: 'login' }"
              data-test="forgot-back-to-login"
            />

            <div class="resend-link q-mt-md">
              Didn't receive the email?
              <a href="#" @click.prevent="resendEmail" class="link">Resend</a>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
/**
 * ForgotPasswordPage.vue
 * 
 * Password reset request screen for MyCities app.
 * User enters email to receive password reset instructions via email.
 * 
 * data-test attributes provided for e2e testing.
 */

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { forgotPasswordVerification } from 'boot/axios';

const router = useRouter();
const $q = useQuasar();

// State
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const emailSent = ref(false);

// Email validation
const isValidEmail = (emailStr) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr);
};

// Handle form submission
async function handleSubmit() {
  errorMessage.value = '';
  successMessage.value = '';
  
  if (!email.value) {
    errorMessage.value = 'Please enter your email address';
    return;
  }
  
  if (!isValidEmail(email.value)) {
    errorMessage.value = 'Please enter a valid email address';
    return;
  }
  
  isLoading.value = true;
  
  try {
    // Call API to send password reset email
    const response = await forgotPasswordVerification({ email: email.value });
    
    console.log('[ForgotPassword] Response:', response);
    
    if (response.status) {
      // Show success state
      successMessage.value = `Password reset instructions have been sent to ${email.value}`;
      emailSent.value = true;
      
      $q.notify({
        type: 'positive',
        message: 'Reset email sent! Check your inbox.',
        position: 'top',
      });
    } else {
      // For security, don't reveal if email exists or not
      // Just show success message anyway
      successMessage.value = `If an account exists with ${email.value}, you will receive password reset instructions.`;
      emailSent.value = true;
      
      $q.notify({
        type: 'info',
        message: 'If the email exists, reset instructions have been sent.',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('[ForgotPassword] Error:', error);
    // For security, show generic success even on error
    // This prevents email enumeration attacks
    successMessage.value = `If an account exists with ${email.value}, you will receive password reset instructions.`;
    emailSent.value = true;
    
    $q.notify({
      type: 'info',
      message: 'If the email exists, reset instructions have been sent.',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
}

// Resend email
async function resendEmail() {
  isLoading.value = true;
  
  try {
    // Call API again
    await forgotPasswordVerification({ email: email.value });
    
    $q.notify({
      type: 'positive',
      message: 'Reset email resent! Check your inbox.',
      position: 'top',
    });
  } catch (error) {
    $q.notify({
      type: 'info',
      message: 'If the email exists, reset instructions have been sent.',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
}

// Navigate back
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push({ name: 'login' });
  }
}
</script>

<style scoped>
/* Theme color - update when hex code is provided */
.forgot-password-page {
  background: linear-gradient(135deg, #3294B8 0%, #1a5a6e 100%);
  min-height: 100vh;
}

.forgot-container {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  color: white;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

.forgot-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.icon-section {
  text-align: center;
  margin-bottom: 16px;
}

.form-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin: 0 0 12px 0;
}

.form-subtitle {
  font-size: 16px;
  color: #666;
  text-align: center;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.forgot-form {
  padding: 8px 0;
}

/* Increase font sizes for form inputs */
.forgot-form :deep(.q-field__label) {
  font-size: 15px;
  font-weight: 600;
}

.forgot-form :deep(.q-field__native) {
  font-size: 17px;
  padding: 12px 0;
}

.forgot-form :deep(.q-field__control) {
  min-height: 56px;
}

.forgot-form :deep(.q-field--outlined .q-field__control) {
  border-radius: 10px;
}

.forgot-form :deep(.q-btn) {
  font-size: 17px;
  padding: 14px 24px;
  border-radius: 10px;
}

.back-link {
  text-align: center;
  font-size: 15px;
}

.back-link .link {
  color: #3294B8;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-weight: 500;
}

.back-link .link:hover {
  text-decoration: underline;
}

.email-sent {
  text-align: center;
}

.email-sent :deep(.q-btn) {
  font-size: 17px;
  padding: 14px 24px;
  border-radius: 10px;
}

.resend-link {
  font-size: 15px;
  color: #666;
}

.resend-link .link {
  color: #3294B8;
  text-decoration: none;
  font-weight: 600;
  cursor: pointer;
}

.resend-link .link:hover {
  text-decoration: underline;
}
</style>

