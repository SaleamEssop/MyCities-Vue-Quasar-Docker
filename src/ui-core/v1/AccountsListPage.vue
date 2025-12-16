<template>
  <q-page class="accounts-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="50px" color="primary" />
      <p>Loading account history...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <q-icon name="error_outline" size="64px" color="negative" />
      <p>{{ error }}</p>
      <q-btn color="primary" label="Retry" @click="loadData" />
    </div>

    <!-- Content -->
    <div v-else class="page-content">
      <!-- Unified Header -->
      <div class="unified-header">
        <div class="header-top">
          <div class="logo-user">
            <span class="logo-text"><span class="logo-my">My</span><span class="logo-cities">Cities</span></span>
            <span class="user-label">User: {{ accountData.user_name }}</span>
            <span class="current-date">Current Date: {{ formatCurrentDate() }}</span>
          </div>
          <span class="page-label">Accounts</span>
        </div>
        <div class="header-divider"></div>
      </div>

      <!-- Payment Entry Section -->
      <div class="payment-section">
        <div class="payment-label">Click to enter a payment amount</div>
        <div class="payment-input-container" @click="focusPaymentInput">
          <input 
            ref="paymentInputRef"
            type="text" 
            v-model="paymentAmountDisplay"
            @input="handlePaymentInput"
            @focus="paymentFocused = true"
            @blur="paymentFocused = false"
            class="payment-input"
            inputmode="decimal"
          />
        </div>
        <q-btn 
          unelevated 
          color="primary" 
          label="Update" 
          class="update-btn"
          :loading="savingPayment"
          :disable="!paymentAmount || paymentAmount <= 0"
          @click="savePayment"
        />
      </div>

      <!-- Billing Periods - All payments shown inside their period -->
      <div class="periods-container">
        <div 
          v-for="(period, index) in accountData.periods" 
          :key="index" 
          class="period-card"
        >
          <!-- Period Header - Shows BALANCE (blue for latest closed period) -->
          <div class="period-header" :class="{ current: index === 0 }">
            <span class="period-dates">{{ formatPeriodDate(period.start_date) }} &gt; {{ formatPeriodDate(period.end_date) }}</span>
            <span class="period-amount">
              R{{ period.balance < 0 ? '-' : '' }}{{ formatAmount(Math.abs(period.balance)) }}
            </span>
          </div>

          <!-- Period Details -->
          <div class="period-details">
            <div class="detail-row">
              <span class="detail-label">Consumption - {{ period.days }} days</span>
              <span class="detail-value">R{{ formatAmount(period.consumption_charge) }}</span>
            </div>
            
            <div v-if="period.balance_bf !== 0" class="detail-row">
              <span class="detail-label">{{ period.balance_bf < 0 ? 'Credit B/F' : 'Balance B/F' }}</span>
              <span class="detail-value" :class="{ 'credit-value': period.balance_bf < 0 }">
                {{ period.balance_bf < 0 ? '-' : '' }}R{{ formatAmount(Math.abs(period.balance_bf)) }}
              </span>
            </div>

            <!-- Payments for this period -->
            <div v-for="payment in period.payments" :key="payment.id" class="detail-row payment-row">
              <span class="detail-label">Payment - {{ formatPaymentDate(payment.date) }}</span>
              <span class="detail-value">R{{ formatAmount(payment.amount) }}</span>
            </div>

            <!-- Balance -->
            <div class="detail-row balance-row">
              <span class="detail-label">Balance</span>
              <span class="detail-value" :class="{ 'credit-value': period.balance < 0 }">
                R{{ period.balance < 0 ? '-' : '' }}{{ formatAmount(Math.abs(period.balance)) }}
              </span>
            </div>
          </div>
        </div>

        <!-- No periods message -->
        <div v-if="!accountData.periods || accountData.periods.length === 0" class="no-periods">
          <q-icon name="receipt_long" size="48px" color="grey-5" />
          <p>No billing periods found</p>
        </div>
      </div>
    </div>

    <!-- Fixed Bottom Navigation -->
    <div class="fixed-nav-tabs">
      <button class="nav-tab" @click="goToHome">
        <q-icon name="home" size="22px" />
        <span>Home</span>
      </button>
      <button class="nav-tab" @click="goToDashboard">
        <q-icon name="dashboard" size="22px" />
        <span>Dashboard</span>
      </button>
      <button class="nav-tab" @click="goToReadings">
        <q-icon name="edit_note" size="22px" />
        <span>Readings</span>
      </button>
      <button class="nav-tab active">
        <q-icon name="account_circle" size="22px" />
        <span>Accounts</span>
      </button>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const router = useRouter();
const $q = useQuasar();

// State
const loading = ref(true);
const error = ref(null);
const savingPayment = ref(false);
const paymentFocused = ref(false);
const paymentInputRef = ref(null);

// Data
const accountData = ref({
  account_id: null,
  user_name: '',
  account_name: '',
  account_number: '',
  total_owing: 0,
  periods: []
});

// Payment input
const paymentAmount = ref(0);
const paymentAmountDisplay = computed({
  get() {
    if (paymentFocused.value && paymentAmount.value === 0) {
      return '';
    }
    return 'R' + formatAmount(paymentAmount.value);
  },
  set(val) {
    // Remove R prefix and non-numeric chars except decimal
    const numStr = val.replace(/[^0-9.]/g, '');
    paymentAmount.value = parseFloat(numStr) || 0;
  }
});

// Methods
const loadData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api().get('/v1/billing/history');
    console.log('Billing history response:', response);
    
    if (response.success && response.data) {
      accountData.value = response.data;
      // Set initial payment amount to total owing
      paymentAmount.value = Math.max(0, response.data.total_owing || 0);
    } else {
      error.value = response.message || 'Failed to load billing history';
    }
  } catch (err) {
    console.error('Load billing history error:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to load billing history';
  } finally {
    loading.value = false;
  }
};

const handlePaymentInput = (event) => {
  // Get raw input, remove all non-numeric except decimal
  let val = event.target.value.replace(/[^0-9.]/g, '');
  // Ensure only one decimal point
  const parts = val.split('.');
  if (parts.length > 2) {
    val = parts[0] + '.' + parts.slice(1).join('');
  }
  // Limit decimal places
  if (parts.length === 2 && parts[1].length > 2) {
    val = parts[0] + '.' + parts[1].slice(0, 2);
  }
  paymentAmount.value = parseFloat(val) || 0;
  // Update display
  event.target.value = 'R' + (val || '0.00');
};

const focusPaymentInput = () => {
  paymentInputRef.value?.focus();
};

const savePayment = async () => {
  if (!paymentAmount.value || paymentAmount.value <= 0) {
    $q.notify({
      type: 'warning',
      message: 'Please enter a valid payment amount',
      position: 'top'
    });
    return;
  }

  if (!accountData.value.account_id) {
    $q.notify({
      type: 'negative',
      message: 'Account not found. Please refresh and try again.',
      position: 'top'
    });
    return;
  }

  savingPayment.value = true;
  
  try {
    const response = await api().post('/v1/billing/payments', {
      account_id: accountData.value.account_id,
      amount: paymentAmount.value,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference: 'Mobile Payment'
    });

    if (response.success) {
      $q.notify({
        type: 'positive',
        message: `Payment of R${formatAmount(paymentAmount.value)} recorded successfully`,
        position: 'top'
      });
      // Reload data to show updated history
      await loadData();
    } else {
      throw new Error(response.message || 'Failed to save payment');
    }
  } catch (err) {
    console.error('Save payment error:', err);
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || err.message || 'Failed to save payment',
      position: 'top'
    });
  } finally {
    savingPayment.value = false;
  }
};

const formatCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatPeriodDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
};

const formatPaymentDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toFixed(2);
};

const goToDashboard = () => {
  router.push({ name: 'home' });
};

const goToReadings = () => {
  router.push({ name: 'enter-readings' });
};

const goToHome = () => {
  router.push({ name: 'splash' });
};

onMounted(() => {
  loadData();
});
</script>

<style lang="scss" scoped>
$primary: #3294B8;
$white: #ffffff;
$grey-bg: #f5f5f5;
$text-dark: #000000;
$text-grey: #666666;
$border: #e0e0e0;

.accounts-page {
  background: $white;
  min-height: 100vh;
  padding-bottom: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  padding: 24px;
  
  p {
    color: $text-grey;
    font-size: 14px;
    text-align: center;
  }
}

.page-content {
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

// Unified Header
.unified-header {
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.logo-user {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.logo-text {
  font-size: 28px;
  font-style: italic;
}

.logo-my {
  color: #000;
  font-weight: 300;
}

.logo-cities {
  color: $primary;
  font-weight: 500;
}

.user-label {
  font-size: 14px;
  color: #000;
}

.current-date {
  font-size: 14px;
  color: $text-grey;
}

.page-label {
  font-size: 14px;
  color: #333;
}

.header-divider {
  height: 1px;
  background: #e0e0e0;
  margin-top: 12px;
}

// Payment Section
.payment-section {
  text-align: center;
  margin-bottom: 32px;
}

.payment-label {
  font-size: 16px;
  color: $text-grey;
  margin-bottom: 12px;
}

.payment-input-container {
  background: $grey-bg;
  border-radius: 8px;
  padding: 16px 24px;
  margin-bottom: 16px;
  cursor: text;
}

.payment-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 36px;
  font-weight: 700;
  color: $text-dark;
  text-align: center;
  outline: none;
  
  &::placeholder {
    color: #ccc;
  }
}

.update-btn {
  font-size: 18px;
  padding: 12px 48px;
  border-radius: 4px;
}

// Periods Container
.periods-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.period-card {
  background: $white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: $grey-bg;
  border-bottom: 1px solid $border;
  
  &.current {
    background: $primary;
    color: $white;
    
    .period-dates,
    .period-amount {
      color: $white;
    }
  }
  
  .period-dates {
    font-size: 17px;
    font-weight: 600;
    color: $text-dark;
  }
  
  .period-amount {
    font-size: 20px;
    font-weight: 700;
    color: $primary;
  }
}

.period-details {
  padding: 12px 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  
  &.payment-row {
    .detail-value {
      color: #4CAF50;
    }
  }
  
  &.balance-row {
    border-top: 1px solid $border;
    margin-top: 8px;
    padding-top: 12px;
  }
  
  .detail-label {
    font-size: 16px;
    color: $text-grey;
  }
  
  .detail-value {
    font-size: 16px;
    font-weight: 500;
    color: $text-dark;
    
    &.credit-value {
      color: #4CAF50;
    }
  }
}

.no-periods {
  text-align: center;
  padding: 48px 24px;
  
  p {
    color: $text-grey;
    margin-top: 16px;
  }
}

// Fixed Bottom Navigation
.fixed-nav-tabs {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid $border;
  padding: 8px 0;
  margin: 0 -16px;
  margin-top: auto;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.nav-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #666;
  font-size: 11px;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.2s;
  
  &:hover:not(:disabled) {
    color: $primary;
  }
  
  &.active {
    color: $primary;
  }
  
  span {
    font-weight: 500;
  }
}
</style>
