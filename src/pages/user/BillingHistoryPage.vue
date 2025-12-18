<template>
  <q-page class="billing-history-page">
    <!-- Header -->
    <div class="page-header">
      <q-btn flat icon="arrow_back" @click="goBack" class="back-btn" />
      <h1>Billing History</h1>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="50px" color="primary" />
      <p>Loading billing history...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <q-icon name="error" size="50px" color="negative" />
      <p>{{ error }}</p>
      <q-btn color="primary" label="Retry" @click="loadBillingHistory" />
    </div>

    <!-- Billing Content -->
    <div v-else-if="billingData" class="billing-content">
      <!-- User Info Header -->
      <div class="user-header">
        <h2>{{ billingData.user_name }}</h2>
        <div class="current-date">{{ currentDateFormatted }}</div>
      </div>

      <!-- Total Outstanding -->
      <div class="total-section">
        <div class="total-label">Total Outstanding</div>
        <div class="total-amount" :class="{ credit: billingData.total_owing < 0 }">
          R{{ formatAmount(Math.abs(billingData.total_owing)) }}
          <span v-if="billingData.total_owing < 0" class="credit-label">(Credit)</span>
        </div>
      </div>

      <!-- Recent Payments -->
      <div v-if="billingData.recent_payments && billingData.recent_payments.length > 0" class="recent-payments">
        <div class="section-header">
          <q-icon name="schedule" size="18px" />
          <span>Recent Payments</span>
        </div>
        <div class="payment-list">
          <div v-for="payment in billingData.recent_payments" :key="payment.id" class="payment-item">
            <span>{{ formatDateShort(payment.date) }}</span>
            <span class="payment-amount">R{{ formatAmount(payment.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Billing Periods -->
      <div class="periods-container">
        <div v-for="(period, index) in billingData.periods" :key="index" class="period-card">
          <!-- Period Header -->
          <div class="period-header" :class="{ current: index === 0 }">
            <span class="period-dates">
              {{ formatDateShort(period.start_date) }} - {{ formatDateShort(period.end_date) }}
            </span>
            <span class="period-total">R{{ formatAmount(period.period_total) }}</span>
          </div>

          <!-- Period Details -->
          <div class="period-details">
            <!-- Reading Status Badge -->
            <div v-if="period.status" class="status-badge" :class="period.status.toLowerCase()">
              <q-icon :name="getStatusIcon(period.status)" size="14px" />
              {{ period.status }}
            </div>

            <!-- Usage Summary -->
            <div class="usage-summary">
              <div class="usage-item">
                <span class="usage-label">Total Used</span>
                <span class="usage-value">{{ period.total_used || 0 }} units</span>
              </div>
              <div class="usage-item">
                <span class="usage-label">Daily Average</span>
                <span class="usage-value">{{ period.daily_usage || 0 }} units/day</span>
              </div>
              <div class="usage-item">
                <span class="usage-label">Period</span>
                <span class="usage-value">{{ period.days }} days</span>
              </div>
            </div>

            <!-- Meter Breakdown -->
            <div v-if="period.meters && period.meters.length > 0" class="meter-breakdown">
              <div class="breakdown-header">Meter Details</div>
              <div v-for="meter in period.meters" :key="meter.meter_id" class="meter-row">
                <div class="meter-info">
                  <span class="meter-title">{{ meter.meter_title || 'Meter' }}</span>
                  <span class="meter-type">{{ meter.meter_type }}</span>
                </div>
                <div class="meter-readings">
                  <span class="reading">{{ meter.opening_reading }} â†’ {{ meter.closing_reading }}</span>
                  <span class="units">{{ meter.units_used }} units</span>
                </div>
                <div class="meter-charge">R{{ formatAmount(meter.charge) }}</div>
              </div>
            </div>

            <!-- Charges -->
            <div class="detail-row">
              <span class="label">Consumption ({{ period.days }} days)</span>
              <span class="value">R{{ formatAmount(period.consumption_charge) }}</span>
            </div>

            <!-- Adjustments -->
            <div v-if="period.adjustments && period.adjustments.length > 0" class="adjustments-section">
              <div v-for="adj in period.adjustments" :key="adj.id" class="detail-row adjustment" :class="adj.type.toLowerCase()">
                <span class="label">
                  <q-icon :name="adj.type === 'OWING' ? 'add_circle' : 'remove_circle'" size="14px" />
                  Adjustment ({{ formatDateShort(adj.billing_date) }})
                </span>
                <span class="value">
                  {{ adj.type === 'CREDIT' ? '-' : '+' }}R{{ formatAmount(adj.units) }}
                </span>
              </div>
            </div>

            <div v-if="period.balance_bf > 0" class="detail-row">
              <span class="label">Balance B/F</span>
              <span class="value">R{{ formatAmount(period.balance_bf) }}</span>
            </div>

            <div v-for="payment in period.payments" :key="payment.id" class="detail-row payment">
              <span class="label">Payment - {{ formatDateShort(payment.date) }}</span>
              <span class="value">-R{{ formatAmount(payment.amount) }}</span>
            </div>

            <div class="detail-row balance">
              <span class="label">Balance</span>
              <span class="value" :class="{ owing: period.balance > 0 }">
                R{{ formatAmount(period.balance) }}
              </span>
            </div>
          </div>
        </div>

        <!-- No Periods -->
        <div v-if="!billingData.periods || billingData.periods.length === 0" class="no-periods">
          <q-icon name="info" size="40px" color="grey-5" />
          <p>No billing periods found</p>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <BottomNavigation active="history" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import BottomNavigation from 'src/components/BottomNavigation.vue';

const router = useRouter();

// State
const loading = ref(true);
const error = ref(null);
const billingData = ref(null);

// Computed
const currentDateFormatted = computed(() => {
  const now = new Date();
  const day = now.getDate();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${day}${getOrdinal(day)} ${months[now.getMonth()]} ${now.getFullYear()}`;
});

// Methods
function getOrdinal(n) {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatAmount(value) {
  if (value === null || value === undefined) return '0.00';
  return parseFloat(value).toFixed(2);
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day}${getOrdinal(day)} ${months[date.getMonth()]}`;
}

function getStatusIcon(status) {
  switch (status) {
    case 'ACTUAL': return 'verified';
    case 'CALCULATED': return 'calculate';
    case 'ESTIMATED': return 'schedule';
    default: return 'info';
  }
}

async function loadBillingHistory() {
  loading.value = true;
  error.value = null;

  try {
    const response = await api().get('/v1/billing/history');
    
    if (response.data.success) {
      billingData.value = response.data.data;
    } else {
      error.value = response.data.message || 'Failed to load billing history';
    }
  } catch (err) {
    console.error('Error loading billing history:', err);
    error.value = 'Failed to load billing history. Please try again.';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

// Load on mount
onMounted(() => {
  loadBillingHistory();
});
</script>

<style lang="scss" scoped>
$primary: #4ECDC4;
$primary-dark: #44A08D;
$text-primary: #333;
$text-secondary: #666;
$border: #e0e0e0;

.billing-history-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 70px;
}

.page-header {
  background: linear-gradient(135deg, $primary, $primary-dark);
  color: white;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;

  .back-btn { color: white; }
  h1 { margin: 0; font-size: 20px; font-weight: 600; }
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  p { margin-top: 15px; color: $text-secondary; }
}

.billing-content { padding: 0; }

.user-header {
  background: white;
  padding: 20px;
  border-bottom: 1px solid $border;
  h2 { margin: 0 0 5px; font-size: 18px; font-weight: 600; color: $text-primary; }
  .current-date { font-size: 13px; color: $text-secondary; }
}

.total-section {
  background: white;
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid $border;
  .total-label { font-size: 13px; color: $text-secondary; margin-bottom: 8px; }
  .total-amount {
    font-size: 32px; font-weight: 700; color: #dc3545;
    &.credit { color: #28a745; }
    .credit-label { font-size: 14px; font-weight: normal; }
  }
}

.recent-payments {
  background: white;
  margin: 15px;
  border-radius: 12px;
  overflow: hidden;
  border-left: 4px solid #28a745;

  .section-header {
    background: #e8f5e9;
    padding: 12px 16px;
    font-weight: 600;
    color: #2e7d32;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .payment-list { padding: 10px 16px; }
  .payment-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid #f0f0f0;
    &:last-child { border-bottom: none; }
    .payment-amount { color: #28a745; font-weight: 600; }
  }
}

.periods-container { padding: 15px; }

.period-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 15px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #e8e8e8;

  &.current {
    background: linear-gradient(135deg, $primary, $primary-dark);
    color: white;
    .period-total { color: white; }
  }
  .period-dates { font-size: 15px; font-weight: 600; }
  .period-total { font-size: 18px; font-weight: 700; }
}

.period-details { padding: 12px 20px; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 12px;

  &.actual { background: #e8f5e9; color: #2e7d32; }
  &.calculated { background: #e3f2fd; color: #1565c0; }
  &.estimated { background: #fff3e0; color: #ef6c00; }
}

.usage-summary {
  display: flex;
  justify-content: space-between;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;

  .usage-item {
    text-align: center;
    flex: 1;
  }
  .usage-label {
    display: block;
    font-size: 10px;
    color: $text-secondary;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .usage-value {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }
}

.meter-breakdown {
  background: #fafafa;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 12px;

  .breakdown-header {
    font-size: 11px;
    font-weight: 600;
    color: $text-secondary;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .meter-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
    font-size: 12px;

    &:last-child { border-bottom: none; }

    .meter-info {
      flex: 1;
      .meter-title { display: block; font-weight: 500; }
      .meter-type { font-size: 10px; color: $text-secondary; }
    }
    .meter-readings {
      text-align: center;
      flex: 1;
      .reading { display: block; color: $text-secondary; }
      .units { font-weight: 600; color: $primary-dark; }
    }
    .meter-charge { font-weight: 600; }
  }
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;

  .label { color: $text-secondary; }
  .value {
    font-weight: 500;
    color: $text-primary;
    &.owing { color: #dc3545; }
  }

  &.payment .value { color: #28a745; }

  &.adjustment {
    background: #fff8e1;
    margin: 4px -10px;
    padding: 8px 10px;
    border-radius: 4px;

    &.credit {
      background: #e8f5e9;
      .value { color: #2e7d32; }
    }
    &.owing {
      background: #ffebee;
      .value { color: #c62828; }
    }
  }

  &.balance {
    border-top: 1px solid $border;
    margin-top: 5px;
    padding-top: 12px;
    .label { font-weight: 600; color: $text-primary; }
    .value { font-weight: 700; }
  }
}

.no-periods {
  text-align: center;
  padding: 40px 20px;
  color: $text-secondary;
  p { margin-top: 10px; }
}
</style>