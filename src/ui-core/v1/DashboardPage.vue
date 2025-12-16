<template>
  <q-page class="dashboard-page" data-test="dashboard-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="50px" color="primary" />
      <p>Loading dashboard...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <q-icon name="error" size="50px" color="negative" />
      <p>{{ error }}</p>
      <q-btn color="primary" label="Retry" @click="loadDashboardData" />
    </div>

    <!-- Dashboard Content -->
    <template v-else-if="dashboardData">
      <!-- HEADER SECTION - Matches mockup -->
      <div class="header-section">
        <!-- Top row: Logo + User + Dashboard -->
        <div class="header-top">
          <div class="logo-user">
            <span class="logo-text"><span class="logo-my">My</span><span class="logo-cities">Cities</span></span>
            <span class="user-label">User: {{ dashboardData.account?.name || '' }}</span>
          </div>
          <span class="dashboard-label">Dashboard</span>
        </div>
        
        <div class="header-divider"></div>

        <!-- Total Amount with Period Navigation -->
        <div class="total-amount-row">
          <button 
            class="nav-arrow" 
            :disabled="!canGoBack" 
            @click="goToPreviousPeriod"
          >
            ←
          </button>
          <div class="total-amount" data-test="total-amount">
            R{{ formatAmount(currentPeriodData?.totals?.grand_total || 0) }}
          </div>
          <button 
            class="nav-arrow" 
            :disabled="!canGoForward" 
            @click="goToNextPeriod"
          >
            →
          </button>
        </div>

        <!-- Period Display -->
        <div class="period-text" data-test="billing-period">
          Period: From {{ formatDateLong(currentPeriodData?.period?.start_date) }} to {{ formatDateLong(currentPeriodData?.period?.end_date) }}
        </div>

        <!-- View Only indicator for past periods -->
        <div v-if="isViewingPastPeriod" class="view-only-indicator">
          <q-icon name="history" size="16px" />
          <span>Viewing Past Period (Read Only)</span>
        </div>

        <!-- Past Period Summary (when viewing historical data) -->
        <div v-if="isViewingPastPeriod && currentPeriodData?.pastPeriodData" class="past-period-summary">
          <div class="summary-row">
            <span>Consumption ({{ currentPeriodData.pastPeriodData.days }} days)</span>
            <span>R{{ formatAmount(currentPeriodData.pastPeriodData.consumption_charge) }}</span>
          </div>
          <div v-if="currentPeriodData.pastPeriodData.balance_bf !== 0" class="summary-row">
            <span>{{ currentPeriodData.pastPeriodData.balance_bf < 0 ? 'Credit B/F' : 'Balance B/F' }}</span>
            <span :class="{ 'credit': currentPeriodData.pastPeriodData.balance_bf < 0 }">
              R{{ currentPeriodData.pastPeriodData.balance_bf < 0 ? '-' : '' }}{{ formatAmount(Math.abs(currentPeriodData.pastPeriodData.balance_bf)) }}
            </span>
          </div>
          <div v-for="payment in currentPeriodData.pastPeriodData.payments" :key="payment.id" class="summary-row payment">
            <span>Payment - {{ formatDate(payment.date) }}</span>
            <span class="payment-amount">R{{ formatAmount(payment.amount) }}</span>
          </div>
          <div class="summary-row balance">
            <span>Balance</span>
            <span :class="{ 'credit': currentPeriodData.pastPeriodData.balance < 0 }">
              R{{ currentPeriodData.pastPeriodData.balance < 0 ? '-' : '' }}{{ formatAmount(Math.abs(currentPeriodData.pastPeriodData.balance)) }}
            </span>
          </div>
        </div>

        <!-- View Only indicator for past periods -->
        <div v-if="isViewingPastPeriod" class="view-only-indicator">
          <q-icon name="history" size="16px" />
          <span>View Only - Past Period</span>
        </div>
      </div>

      <!-- WATER SECTION -->
      <div v-if="currentPeriodData?.tariff?.is_water && currentPeriodData?.water?.enabled" class="meter-section" data-test="water-section">
        <!-- Water Meter Header Bar -->
        <div class="meter-header water">
          <div class="meter-icon">
            <q-icon name="water_drop" size="24px" />
          </div>
          <div class="meter-stats">
            <div class="stat-item">
              <div class="stat-label">Daily Usage</div>
              <div class="stat-value">{{ currentPeriodData.water.daily_average_formatted || '0 L' }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Usage</div>
              <div class="stat-value">{{ currentPeriodData.water.consumption_kl || 0 }} KL</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Cost</div>
              <div class="stat-value">R {{ formatAmount(currentPeriodData.water.charges?.total) }}</div>
            </div>
          </div>
        </div>

        <!-- Water Billing Summary -->
        <div class="billing-summary">
          <!-- Consumption Total -->
          <div class="billing-row">
            <span class="billing-label"><strong>Consumption Total</strong></span>
            <span class="billing-amount">R {{ formatAmount(currentPeriodData.water.totals?.consumption_total) }}</span>
          </div>
          <div class="tier-label">{{ getWaterTierLabel() }}</div>

          <!-- VAT (only if > 0) -->
          <div v-if="currentPeriodData.water.totals && currentPeriodData.water.totals.vat_amount > 0" class="billing-row">
            <span class="billing-label"><strong>VAT ({{ currentPeriodData.water.totals.vat_rate }}%)</strong></span>
            <span class="billing-amount">R {{ formatAmount(currentPeriodData.water.totals.vat_amount) }}</span>
          </div>

          <!-- Period Total -->
          <div class="billing-divider"></div>
          <div class="billing-row period-total-row">
            <span class="period-total-label">Period Total</span>
            <span class="period-total-amount">R {{ formatAmount(currentPeriodData.water.totals?.period_total) }}</span>
          </div>
        </div>
      </div>

      <!-- ELECTRICITY SECTION -->
      <div v-if="currentPeriodData?.tariff?.is_electricity && currentPeriodData?.electricity?.enabled" class="meter-section" data-test="electricity-section">
        <!-- Electricity Meter Header Bar -->
        <div class="meter-header electricity">
          <div class="meter-icon">
            <q-icon name="bolt" size="24px" />
          </div>
          <div class="meter-stats">
            <div class="stat-item">
              <div class="stat-label">Daily Usage</div>
              <div class="stat-value">{{ currentPeriodData.electricity.daily_average_formatted || '0 kWh' }}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Usage</div>
              <div class="stat-value">{{ currentPeriodData.electricity.consumption_kwh || 0 }} kWh</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Total Cost</div>
              <div class="stat-value">R {{ formatAmount(currentPeriodData.electricity.charges?.total) }}</div>
            </div>
          </div>
        </div>

        <!-- Electricity Billing Summary -->
        <div class="billing-summary">
          <!-- Consumption Total -->
          <div class="billing-row">
            <span class="billing-label"><strong>Consumption Total</strong></span>
            <span class="billing-amount">R {{ formatAmount(currentPeriodData.electricity.totals?.consumption_total) }}</span>
          </div>

          <!-- VAT (only if > 0) -->
          <div v-if="currentPeriodData.electricity.totals && currentPeriodData.electricity.totals.vat_amount > 0" class="billing-row">
            <span class="billing-label"><strong>VAT ({{ currentPeriodData.electricity.totals.vat_rate }}%)</strong></span>
            <span class="billing-amount">R {{ formatAmount(currentPeriodData.electricity.totals.vat_amount) }}</span>
          </div>

          <!-- Period Total -->
          <div class="billing-divider"></div>
          <div class="billing-row period-total-row">
            <span class="period-total-label">Period Total</span>
            <span class="period-total-amount">R {{ formatAmount(currentPeriodData.electricity.totals?.period_total) }}</span>
          </div>
        </div>
      </div>

      <!-- Close Period Button - Only for current period -->
      <div v-if="!isViewingPastPeriod" class="close-period-section">
        <q-btn 
          label="Close Period" 
          class="close-period-btn"
          @click="handleClosePeriod"
          unelevated
        />
      </div>
    </template>

    <!-- Reading Required Modal -->
    <q-dialog v-model="showReadingRequiredDialog">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Reading Required</div>
        </q-card-section>
        <q-card-section>
          <p>Please update your reading before you can close the period.</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Fixed Bottom Navigation -->
    <div class="fixed-nav-tabs">
      <button class="nav-tab" @click="goToHome">
        <q-icon name="home" size="22px" />
        <span>Home</span>
      </button>
      <button class="nav-tab active">
        <q-icon name="dashboard" size="22px" />
        <span>Dashboard</span>
      </button>
      <button class="nav-tab" :class="{ disabled: isViewingPastPeriod }" :disabled="isViewingPastPeriod" @click="goToReadings">
        <q-icon name="edit_note" size="22px" />
        <span>Readings</span>
      </button>
      <button class="nav-tab" @click="goToAccounts">
        <q-icon name="account_circle" size="22px" />
        <span>Accounts</span>
      </button>
    </div>
  </q-page>
</template>

<script setup>
/**
 * DashboardPage - Main billing overview screen
 * 
 * Fetches ALL data from API - no hardcoded values.
 * Supports both Monthly and Date-to-Date billing types.
 */

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'src/boot/axios';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();

// State
const loading = ref(true);
const error = ref(null);
const dashboardData = ref(null);
const allPeriods = ref([]); // All periods for navigation
const currentPeriodIndex = ref(0); // 0 = current/latest period
const showWaterDetails = ref(true);
const showElectricityDetails = ref(false);
const showClosePeriodDialog = ref(false);
const showReadingRequiredDialog = ref(false);

// Computed
const currentDateFormatted = computed(() => {
  return new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
});

// Current period data based on navigation
const currentPeriodData = computed(() => {
  if (currentPeriodIndex.value === 0) {
    // Current/latest period from dashboard API
    return dashboardData.value;
  }
  // Past period from allPeriods array - convert to dashboard format
  const pastPeriod = allPeriods.value[currentPeriodIndex.value - 1];
  if (!pastPeriod) return dashboardData.value;
  
  // Map billing history format to dashboard format
  return {
    ...dashboardData.value,
    period: {
      start_date: pastPeriod.start_date,
      end_date: pastPeriod.end_date,
      days_in_period: pastPeriod.days,
    },
    totals: {
      grand_total: pastPeriod.consumption_charge,
      balance_due: pastPeriod.balance,
    },
    // Use the tariff info from current dashboard
    tariff: dashboardData.value?.tariff,
    // Past periods don't have detailed meter data
    water: { enabled: false },
    electricity: { enabled: false },
    // Store the full past period data for reference
    pastPeriodData: pastPeriod,
  };
});

// Navigation controls
const canGoBack = computed(() => {
  return currentPeriodIndex.value < allPeriods.value.length;
});

const canGoForward = computed(() => {
  return currentPeriodIndex.value > 0;
});

// Check if viewing a past (read-only) period
const isViewingPastPeriod = computed(() => {
  return currentPeriodIndex.value > 0;
});

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

const formatDateLong = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

// Navigation methods
const goToReadings = () => {
  router.push({ name: 'enter-readings' });
};

const goToHistory = () => {
  router.push({ name: 'billing-history' });
};

const goToAccounts = () => {
  router.push({ name: 'accounts-list' });
};

const goToHome = () => {
  router.push({ name: 'splash' });
};

const formatAmount = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return parseFloat(amount).toFixed(2);
};

const loadDashboardData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Fetch current period dashboard data
    const response = await api().get('/v1/billing/dashboard');
    
    if (response.success) {
      dashboardData.value = response.data;
    } else {
      error.value = response.message || 'Failed to load dashboard data';
    }

    // Fetch all past periods for navigation
    const historyResponse = await api().get('/v1/billing/history');
    if (historyResponse.success && historyResponse.data?.periods) {
      allPeriods.value = historyResponse.data.periods;
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
    error.value = err.response?.data?.message || err.message || 'Failed to load dashboard data';
  } finally {
    loading.value = false;
  }
};

// Period navigation
const goToPreviousPeriod = () => {
  if (canGoBack.value) {
    currentPeriodIndex.value++;
  }
};

const goToNextPeriod = () => {
  if (canGoForward.value) {
    currentPeriodIndex.value--;
  }
};

const toggleWaterDetails = () => {
  showWaterDetails.value = !showWaterDetails.value;
};

const toggleElectricityDetails = () => {
  showElectricityDetails.value = !showElectricityDetails.value;
};

const enterWaterReading = () => {
  router.push({ name: 'enter-readings' });
};

const enterElectricityReading = () => {
  router.push({ name: 'enter-readings' });
};

const viewReadingsHistory = () => {
  router.push({ name: 'enter-readings' });
};

const viewElectricityHistory = () => {
  router.push({ name: 'enter-readings' });
};

const closePeriod = async () => {
  showClosePeriodDialog.value = false;
  
  $q.notify({
    type: 'info',
    message: 'Period closure feature coming soon...',
    position: 'top',
  });
  
  // TODO: Implement period closure API call
  // await api().post('/billing/close-period', { account_id: dashboardData.value.account.id });
  // loadDashboardData();
};

// Handle close period - check if reading is up to date
const handleClosePeriod = () => {
  // Check if last reading date matches current date
  const today = new Date().toDateString();
  
  // Get the last reading date from water or electricity meter
  let lastReadingDate = null;
  if (dashboardData.value?.water?.last_reading_date) {
    lastReadingDate = new Date(dashboardData.value.water.last_reading_date).toDateString();
  } else if (dashboardData.value?.electricity?.last_reading_date) {
    lastReadingDate = new Date(dashboardData.value.electricity.last_reading_date).toDateString();
  }
  
  // If no reading today, show the modal
  if (lastReadingDate !== today) {
    showReadingRequiredDialog.value = true;
    return;
  }
  
  // Otherwise proceed with closing
  closePeriod();
};

// Get the applicable water tier label
const getWaterTierLabel = () => {
  if (!currentPeriodData.value?.water?.charges?.breakdown) return '';
  
  // Find the tier(s) with consumption
  const tiersWithUsage = currentPeriodData.value.water.charges.breakdown
    .filter(tier => tier.units > 0)
    .map(tier => `Tier ${tier.tier}`);
  
  return tiersWithUsage.length > 0 ? tiersWithUsage.join(', ') : '';
};

// Lifecycle
onMounted(() => {
  loadDashboardData();
});
</script>

<style lang="scss" scoped>
// Design tokens - matching mockup
$primary: #3294B8;
$white: #ffffff;
$border: #e0e0e0;
$text-primary: #000000;
$text-secondary: #666666;

.dashboard-page {
  background: $white;
  min-height: 100vh;
  padding: 16px;
  padding-bottom: 0;
  max-width: 480px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

// Loading & Error States
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  
  p {
    color: $text-secondary;
    font-size: 14px;
  }
}

// Header Section - matches mockup
.header-section {
  background: $white;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
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
  color: $text-primary;
}

.dashboard-label {
  font-size: 14px;
  color: $text-primary;
}

.header-divider {
  height: 1px;
  background: $border;
  margin: 12px 0;
}

// Total Amount with Navigation Arrows
.total-amount-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 0;
}

.nav-arrow {
  background: none;
  border: none;
  font-size: 32px;
  color: $text-primary;
  cursor: pointer;
  padding: 8px 16px;
  transition: opacity 0.2s;
  
  &:hover:not(:disabled) {
    opacity: 0.7;
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.total-amount {
  font-size: 36px;
  font-weight: 700;
  color: $primary;
  text-align: center;
}

.period-text {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  text-align: center;
  padding: 8px 0;
}

// Past Period Summary
.past-period-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 15px;
    
    &.payment {
      .payment-amount {
        color: #4CAF50;
      }
    }
    
    &.balance {
      border-top: 1px solid $border;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: 600;
    }
    
    .credit {
      color: #4CAF50;
    }
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
  
  &.disabled,
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  span {
    font-weight: 500;
  }
}

.view-only-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  color: #999;
  font-size: 14px;
  font-style: italic;
}

// Meter Section with Header Bar
.meter-section {
  margin-bottom: 16px;
}

.meter-header {
  display: flex;
  align-items: center;
  background: $primary;
  color: $white;
  padding: 12px 16px;
  gap: 12px;
  border-radius: 4px 4px 0 0;
  
  &.water {
    background: $primary;
  }
  
  &.electricity {
    background: #FF9800;
  }
}

.meter-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meter-stats {
  display: flex;
  flex: 1;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
  
  .stat-label {
    font-size: 10px;
    opacity: 0.9;
    margin-bottom: 2px;
  }
  
  .stat-value {
    font-size: 14px;
    font-weight: 600;
  }
}

// Billing Summary (within meter section)
.billing-summary {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 0 0 4px 4px;
}

.billing-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.billing-label {
  font-size: 15px;
  color: $text-primary;
}

.billing-amount {
  font-size: 15px;
  color: $text-primary;
  font-weight: 500;
}

.tier-label {
  font-size: 12px;
  color: $text-secondary;
  padding-left: 0;
  padding-bottom: 12px;
}

.billing-divider {
  height: 1px;
  background: $border;
  margin: 8px 0;
}

.period-total-row {
  padding-top: 12px;
}

.period-total-label {
  font-size: 18px;
  font-weight: 700;
  color: $primary;
}

.period-total-amount {
  font-size: 18px;
  font-weight: 700;
  color: $primary;
}

// Close Period Button
.close-period-section {
  padding: 24px 0;
  text-align: center;
}

.close-period-btn {
  background: #e0e0e0 !important;
  color: $text-primary !important;
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
}

// Legacy styles for compatibility
.summary-section {
  padding: 16px;
  background: #f8f9fa;
  border-top: 1px solid $border;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  
  .summary-label {
    color: $text-secondary;
  }
  
  .summary-value {
    color: $text-primary;
    font-weight: 500;
  }
  
  &.subtotal {
    border-top: 1px solid $border;
    padding-top: 12px;
    margin-top: 8px;
    
    .summary-label {
      font-weight: 600;
      color: $text-primary;
    }
    
    .summary-value {
      font-weight: 600;
    }
  }
  
  &.total {
    border-top: 2px solid $border;
    padding-top: 12px;
    margin-top: 8px;
    
    .summary-label {
      font-size: 18px;
      font-weight: 700;
      color: $primary;
    }
    
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: $primary;
    }
  }
  
  &.period-total {
    border-top: 2px solid $border;
    padding-top: 12px;
    margin-top: 8px;
    
    .summary-label {
      font-size: 18px;
      font-weight: 700;
      color: $primary;
      text-decoration: underline;
    }
    
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      color: $primary;
      text-decoration: underline;
    }
  }
}

// Payments Section
.payments-section {
  padding: 16px;
  background: #fff;
  border-top: 1px solid $border;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }
    
    .payment-count {
      font-size: 12px;
      color: $text-secondary;
      background: #e8e8e8;
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
  
  .payments-list {
    margin-bottom: 16px;
  }
  
  .payment-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 8px;
    
    .payment-info {
      display: flex;
      gap: 12px;
      font-size: 13px;
      
      .payment-date {
        color: $text-primary;
        font-weight: 500;
      }
      
      .payment-method {
        color: $text-secondary;
      }
      
      .payment-ref {
        color: $primary;
        font-size: 11px;
      }
    }
    
    .payment-amount {
      font-weight: 600;
      color: #4CAF50;
    }
  }
  
  .no-payments {
    text-align: center;
    padding: 16px;
    color: $text-secondary;
    font-size: 13px;
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 16px;
    
    p {
      margin: 0;
    }
  }
  
  .balance-section {
    border-top: 1px solid $border;
    padding-top: 12px;
  }

  .history-link {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid $border;
  }
  
  .balance-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    
    .balance-label {
      color: $text-secondary;
    }
    
    .balance-value {
      font-weight: 500;
    }
    
    &.paid {
      .balance-value {
        color: #4CAF50;
      }
    }
    
    &.owing {
      background: #fff3e0;
      padding: 12px;
      margin: 8px -16px -16px;
      border-radius: 0 0 0 0;
      
      .balance-label {
        font-weight: 700;
        color: #e65100;
        font-size: 16px;
      }
      
      .balance-value {
        font-weight: 700;
        color: #e65100;
        font-size: 16px;
      }
    }
    
    &.credit {
      background: #e8f5e9;
      padding: 12px;
      margin: 8px -16px -16px;
      
      .balance-label {
        font-weight: 700;
        color: #2e7d32;
        font-size: 16px;
      }
      
      .balance-value {
        font-weight: 700;
        color: #2e7d32;
        font-size: 16px;
      }
    }
  }
}

// Close Period Section
.close-period-section {
  padding: 20px 16px;
  text-align: center;
  background: #fff8e1;
  border-top: 1px solid #ffe082;
  
  .close-period-btn {
    margin-bottom: 8px;
  }
  
  .close-period-info {
    font-size: 12px;
    color: $text-secondary;
    margin: 0;
  }
}

// Transitions
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>

