<template>
  <q-page class="enter-readings-page" data-test="enter-readings-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <q-spinner-dots size="50px" color="primary" />
      <p>Loading readings...</p>
    </div>

    <template v-else-if="meterData">
      <!-- Unified Header -->
      <div class="unified-header">
        <div class="header-top">
          <div class="logo-user">
            <span class="logo-text"><span class="logo-my">My</span><span class="logo-cities">Cities</span></span>
            <span class="user-label">User: {{ meterData.account?.name || 'Demo1 Residence' }}</span>
          </div>
          <span class="page-label">Readings</span>
        </div>
        <div class="header-divider"></div>
      </div>

      <!-- Title -->
      <div class="page-title">READINGS</div>
      <div class="period-text">Period: {{ periodStart }} to {{ periodEnd }}</div>

      <!-- Scrollable Content Area -->
      <div class="content-scroll" ref="contentScrollRef">
        <!-- Water Section -->
        <div v-if="meterData.water && meterData.water.enabled" class="meter-section" data-test="water-meter-section">
          <div class="meter-type-header">
            <q-icon name="water_drop" size="24px" class="meter-icon" />
            <span class="meter-type-name">Water</span>
          </div>

          <div class="meter-action-links">
            <a href="#" @click.prevent="activateWaterInput" 
               :class="{ active: activeMeter === 'water' }">Enter reading</a>
            <a href="#" @click.prevent="toggleDetails('water')">
              {{ showWaterDetails ? 'Hide Details' : 'Show Details' }}
            </a>
          </div>

          <div class="meter-number">Meter Number #{{ meterData.water.meter?.number }}</div>

          <!-- Reading History for this Period -->
          <div class="reading-history">
            <div class="history-header">Readings this Period</div>
            <div v-for="(reading, index) in meterData.water.readings" :key="reading.id" class="reading-row">
              <span class="reading-label">{{ formatDate(reading.date) }}</span>
              <span class="reading-value">{{ formatWaterReading(reading.value) }}</span>
              <q-btn 
                v-if="index === meterData.water.readings.length - 1 && reading.id"
                flat 
                dense 
                round 
                icon="delete" 
                color="negative" 
                size="sm"
                class="delete-reading-btn"
                @click="confirmDeleteReading(reading, 'water')"
              />
            </div>
            <div v-if="meterData.water.readings.length === 0" class="no-readings">
              No readings recorded yet
            </div>
          </div>

          <!-- Add New Reading Link (when not active) -->
          <div class="add-reading-link" v-if="activeMeter !== 'water'">
            <a href="#" @click.prevent="activateWaterInput">Add new reading</a>
          </div>

          <!-- Water Digit Input Display (when active) -->
          <div v-if="activeMeter === 'water'" class="digit-input-section" ref="waterDigitRef">
            <div class="digit-display-container">
              <!-- BLACK Group (Kiloliters - 5 digits) - Clickable - FIRST -->
              <div 
                class="digit-group black-group"
                :class="{ active: activeGroup === 'kiloliters' }"
                @click="setActiveGroup('kiloliters')"
                data-test="water-kiloliters-group"
              >
                <span class="digits black">{{ waterKiloliters || '00000' }}</span>
                <span v-if="activeGroup === 'kiloliters' && waterKiloliters === ''" class="cursor-blink">|</span>
              </div>
              
              <span class="digit-separator">-</span>
              
              <!-- RED Group (Liters - 2 digits) - Clickable - SECOND -->
              <div 
                class="digit-group red-group"
                :class="{ active: activeGroup === 'liters' }"
                @click="setActiveGroup('liters')"
                data-test="water-liters-group"
              >
                <span class="digits red">{{ waterLiters || '00' }}</span>
                <span v-if="activeGroup === 'liters' && waterLiters === ''" class="cursor-blink red">|</span>
              </div>
            </div>
            <div class="group-labels">
              <span class="group-label black">KILOLITERS</span>
              <span class="group-label red">LITERS</span>
            </div>
          </div>
        </div>

        <!-- Electricity Section -->
        <div v-if="meterData.electricity && meterData.electricity.enabled" class="meter-section" data-test="electricity-meter-section">
          <div class="meter-type-header electricity">
            <q-icon name="bolt" size="24px" class="meter-icon" />
            <span class="meter-type-name">Electricity</span>
          </div>

          <div class="meter-action-links">
            <a href="#" @click.prevent="activateElectricityInput"
               :class="{ active: activeMeter === 'electricity' }">Enter reading</a>
            <a href="#" @click.prevent="toggleDetails('electricity')">
              {{ showElectricityDetails ? 'Hide Details' : 'Show Details' }}
            </a>
          </div>

          <div class="meter-number">Meter Number #{{ meterData.electricity.meter?.number }}</div>

          <!-- Reading History for this Period -->
          <div class="reading-history">
            <div class="history-header">Readings this Period</div>
            <div v-for="(reading, index) in meterData.electricity.readings" :key="reading.id" class="reading-row">
              <span class="reading-label">{{ formatDate(reading.date) }}</span>
              <span class="reading-value">{{ reading.value }} kWh</span>
              <q-btn 
                v-if="index === meterData.electricity.readings.length - 1 && reading.id"
                flat 
                dense 
                round 
                icon="delete" 
                color="negative" 
                size="sm"
                class="delete-reading-btn"
                @click="confirmDeleteReading(reading, 'electricity')"
              />
            </div>
            <div v-if="meterData.electricity.readings.length === 0" class="no-readings">
              No readings recorded yet
            </div>
          </div>

          <!-- Add New Reading Link (when not active) -->
          <div class="add-reading-link" v-if="activeMeter !== 'electricity'">
            <a href="#" @click.prevent="activateElectricityInput">Add new reading</a>
          </div>

          <!-- Electricity Digit Input Display (when active) -->
          <div v-if="activeMeter === 'electricity'" class="digit-input-section" ref="electricityDigitRef">
            <div class="digit-display-container">
              <div 
                class="digit-group black-group single"
                :class="{ active: activeGroup === 'electricity' }"
                @click="setActiveGroup('electricity')"
                data-test="electricity-group"
              >
                <span class="digits black">{{ electricityReading || '000000' }}</span>
                <span v-if="activeGroup === 'electricity' && electricityReading === ''" class="cursor-blink">|</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Spacer for keypad -->
        <div class="keypad-spacer"></div>
      </div>

      <!-- Numeric Keypad (fixed at bottom when a meter is active) -->
      <div v-if="activeMeter" class="keypad-container" data-test="keypad">
        <div class="keypad-grid">
          <button 
            v-for="key in keypadKeys" 
            :key="key"
            class="keypad-btn"
            :data-test="`keypad-${key}`"
            @click="handleKeyPress(key)"
          >
            {{ key === 'backspace' ? '⌫' : key }}
          </button>
        </div>
        <div class="keypad-actions">
          <button class="action-btn cancel" @click="handleCancel" data-test="keypad-cancel">
            CANCEL
          </button>
          <button class="action-btn enter" @click="handleEnter" data-test="keypad-enter">
            ENTER
          </button>
        </div>
      </div>
    </template>

    <!-- Fixed Bottom Navigation (only shown when keypad not active) -->
    <div v-if="!activeMeter" class="fixed-nav-tabs">
      <button class="nav-tab" @click="goToHome">
        <q-icon name="home" size="22px" />
        <span>Home</span>
      </button>
      <button class="nav-tab" @click="goToDashboard">
        <q-icon name="dashboard" size="22px" />
        <span>Dashboard</span>
      </button>
      <button class="nav-tab active">
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
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();

// Refs for scrolling
const contentScrollRef = ref(null);
const waterDigitRef = ref(null);
const electricityDigitRef = ref(null);

// State
const loading = ref(true);
const meterData = ref(null);
const activeMeter = ref(route.query.type || null);
const activeGroup = ref(null); // 'liters', 'kiloliters', or 'electricity'
const showWaterDetails = ref(false);
const showElectricityDetails = ref(false);

// Water meter input
const waterLiters = ref('');      // RED group - 2 digits
const waterKiloliters = ref('');  // BLACK group - 5 digits

// Electricity meter input
const electricityReading = ref('');

// Keypad
const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'];

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
});

const periodStart = computed(() => {
  if (!meterData.value?.period?.start_date) return '';
  return formatDate(meterData.value.period.start_date);
});

const periodEnd = computed(() => {
  if (!meterData.value?.period?.end_date) return '';
  return formatDate(meterData.value.period.end_date);
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

const formatWaterReading = (value) => {
  // Convert liters to KL-L format (e.g., 11050 -> 00011-05)
  const totalLiters = parseInt(value) || 0;
  const kiloliters = Math.floor(totalLiters / 1000);
  const liters = Math.floor((totalLiters % 1000) / 10); // Only show tens of liters
  return `${kiloliters.toString().padStart(5, '0')}-${liters.toString().padStart(2, '0')}`;
};

const loadMeterData = async () => {
  loading.value = true;
  
  try {
    const response = await api().get('/v1/billing/dashboard');
    
    if (response.success) {
      meterData.value = {
        water: response.data.water,
        electricity: response.data.electricity,
        period: response.data.period,
      };
    }
  } catch (err) {
    console.error('Failed to load meter data:', err);
    $q.notify({
      type: 'negative',
      message: 'Failed to load meter data',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
};

// Watch for active meter changes to scroll into view
watch(activeMeter, async (newVal) => {
  if (newVal) {
    await nextTick();
    scrollToActiveInput();
  }
});

const scrollToActiveInput = () => {
  const targetRef = activeMeter.value === 'water' ? waterDigitRef.value : electricityDigitRef.value;
  if (targetRef && contentScrollRef.value) {
    targetRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const goBack = () => {
  if (activeMeter.value) {
    activeMeter.value = null;
    activeGroup.value = null;
  } else {
    router.back();
  }
};

const goToDashboard = () => {
  router.push({ name: 'home' });
};

const goToAccounts = () => {
  router.push({ name: 'accounts-list' });
};

const goToHome = () => {
  router.push({ name: 'splash' });
};

const activateWaterInput = () => {
  activeMeter.value = 'water';
  activeGroup.value = 'kiloliters'; // Start with kiloliters group
};

const activateElectricityInput = () => {
  activeMeter.value = 'electricity';
  activeGroup.value = 'electricity';
};

const setActiveGroup = (group) => {
  activeGroup.value = group;
};

const toggleDetails = (type) => {
  if (type === 'water') {
    showWaterDetails.value = !showWaterDetails.value;
  } else {
    showElectricityDetails.value = !showElectricityDetails.value;
  }
};

const handleKeyPress = (key) => {
  if (!activeGroup.value) return;
  
  if (key === 'backspace') {
    handleBackspace();
  } else if (key === '.') {
    // Skip decimal for meter readings
    return;
  } else {
    handleDigitInput(key);
  }
};

const handleDigitInput = (digit) => {
  if (activeGroup.value === 'liters') {
    // RED group - max 2 digits
    if (waterLiters.value.length < 2) {
      waterLiters.value += digit;
    }
  } else if (activeGroup.value === 'kiloliters') {
    // BLACK group - max 5 digits
    if (waterKiloliters.value.length < 5) {
      waterKiloliters.value += digit;
    }
  } else if (activeGroup.value === 'electricity') {
    // Electricity - max 6 digits
    if (electricityReading.value.length < 6) {
      electricityReading.value += digit;
    }
  }
};

const handleBackspace = () => {
  if (activeGroup.value === 'liters') {
    waterLiters.value = waterLiters.value.slice(0, -1);
  } else if (activeGroup.value === 'kiloliters') {
    waterKiloliters.value = waterKiloliters.value.slice(0, -1);
  } else if (activeGroup.value === 'electricity') {
    electricityReading.value = electricityReading.value.slice(0, -1);
  }
};

const handleCancel = () => {
  // Reset values
  if (activeMeter.value === 'water') {
    waterLiters.value = '';
    waterKiloliters.value = '';
  } else {
    electricityReading.value = '';
  }
  activeMeter.value = null;
  activeGroup.value = null;
};

const handleEnter = async () => {
  // Validate and save the reading
  let readingValue = 0;
  let meterId = null;
  
  if (activeMeter.value === 'water') {
    const kl = parseInt(waterKiloliters.value) || 0;
    const l = parseInt(waterLiters.value) || 0;
    readingValue = (kl * 1000) + (l * 10); // Convert to liters
    meterId = meterData.value?.water?.meter?.id;
  } else {
    readingValue = parseInt(electricityReading.value) || 0;
    meterId = meterData.value?.electricity?.meter?.id;
  }
  
  if (!meterId) {
    $q.notify({
      type: 'negative',
      message: 'Meter not found',
      position: 'top',
    });
    return;
  }
  
  try {
    const response = await api().post('/v1/meter/add-readings', {
      meter_id: meterId,
      meter_reading: readingValue,
      meter_reading_date: new Date().toISOString().split('T')[0],
    });
    
    if (response.status || response.success) {
      $q.notify({
        type: 'positive',
        message: 'Reading saved successfully',
        position: 'top',
      });
      
      // Reload data
      await loadMeterData();
    } else {
      throw new Error(response.msg || response.message || 'Failed to save reading');
    }
  } catch (err) {
    console.error('Failed to save reading:', err);
    $q.notify({
      type: 'negative',
      message: err.response?.data?.msg || err.response?.data?.message || err.message || 'Failed to save reading',
      position: 'top',
    });
  }
  
  activeMeter.value = null;
  activeGroup.value = null;
};

const confirmDeleteReading = (reading, meterType) => {
  $q.dialog({
    title: 'Delete Reading',
    message: `Are you sure you want to delete this ${meterType} reading? This action cannot be undone.`,
    cancel: true,
    persistent: true,
    color: 'negative'
  }).onOk(() => {
    deleteReading(reading, meterType);
  });
};

const deleteReading = async (reading, meterType) => {
  try {
    const response = await api().post('/v1/meter/delete-readings', {
      reading_id: reading.id
    });
    
    if (response.status || response.success) {
      $q.notify({
        type: 'positive',
        message: 'Reading deleted successfully',
        position: 'top',
      });
      // Reload data
      await loadMeterData();
    } else {
      throw new Error(response.msg || response.message || 'Failed to delete reading');
    }
  } catch (err) {
    console.error('Delete reading error:', err);
    $q.notify({
      type: 'negative',
      message: err.response?.data?.msg || err.response?.data?.message || err.message || 'Failed to delete reading',
      position: 'top',
    });
  }
};

// Lifecycle
onMounted(() => {
  loadMeterData();
});
</script>

<style lang="scss" scoped>
$primary: #3294B8;
$primary-dark: #2a7a9a;
$success: #4CAF50;
$header-bg: #E0E0E0;
$border: #e0e0e0;
$text-secondary: #666666;
$red: #cc0000;
$black: #000000;

.enter-readings-page {
  background: #ffffff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 0;
  max-width: 480px;
  margin: 0 auto;
}

// Unified Header
.unified-header {
  padding: 16px;
  background: #fff;
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

.page-label {
  font-size: 14px;
  color: #333;
}

.header-divider {
  height: 1px;
  background: #e0e0e0;
  margin-top: 12px;
}

.nav-row {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $header-bg;
  padding: 8px 16px;
  gap: 12px;
}

.nav-arrow {
  background: none;
  border: none;
  color: $black;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  
  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
  
  .arrow-icon {
    font-size: 16px;
  }
}

.due-badge {
  background: $success;
  color: white;
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: $primary;
  text-align: center;
  padding: 16px 0 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: #fff;
}

.period-text {
  font-size: 14px;
  font-weight: 600;
  color: $primary;
  text-align: center;
  padding-bottom: 16px;
  background: #fff;
}

// Scrollable content area
.content-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.keypad-spacer {
  height: 280px; // Space for keypad
}

.meter-section {
  padding: 16px;
  border-bottom: 1px solid $border;
}

.meter-type-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
  
  .meter-icon {
    color: $primary;
  }
  
  .meter-type-name {
    font-size: 20px;
    font-weight: 600;
    color: $black;
  }
}

.meter-action-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;
  
  a {
    color: $primary;
    font-size: 16px;
    text-decoration: none;
    
    &:hover, &.active {
      text-decoration: underline;
    }
  }
}

.meter-number {
  text-align: center;
  font-size: 15px;
  color: $text-secondary;
  margin-bottom: 12px;
}

.reading-history {
  margin-bottom: 12px;
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
}

.history-header {
  font-size: 14px;
  font-weight: 600;
  color: $text-secondary;
  text-transform: uppercase;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid $border;
}

.reading-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 16px;
  gap: 8px;
  
  .reading-label {
    color: $text-secondary;
    flex: 1;
  }
  
  .reading-value {
    color: $black;
    font-weight: 500;
    font-family: 'Roboto Mono', monospace;
  }
  
  .delete-reading-btn {
    margin-left: 8px;
  }
}

.no-readings {
  font-size: 15px;
  color: $text-secondary;
  font-style: italic;
  text-align: center;
  padding: 8px 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
  
  p {
    color: $text-secondary;
    font-size: 16px;
  }
}

.add-reading-link {
  text-align: center;
  padding: 12px 0;
  
  a {
    color: $primary;
    font-size: 17px;
    font-weight: 500;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
}

// Digit Input Section
.digit-input-section {
  padding: 20px 0;
}

.digit-display-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.digit-group {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-width: 80px;
  text-align: center;
  
  &.active {
    border-color: $primary;
    background: rgba($primary, 0.05);
  }
  
  &:hover:not(.active) {
    background: #f5f5f5;
  }
}

.red-group {
  &.active {
    border-color: $red;
    background: rgba($red, 0.05);
  }
}

.digits {
  font-family: 'Roboto Mono', monospace;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 4px;
  
  &.red {
    color: $red;
  }
  
  &.black {
    color: $black;
  }
}

.cursor-blink {
  animation: blink 1s infinite;
  font-size: 32px;
  font-weight: 300;
  color: $black;
  
  &.red {
    color: $red;
  }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.digit-separator {
  font-size: 32px;
  font-weight: 600;
  color: $black;
  margin: 0 4px;
}

.group-labels {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 8px;
}

.group-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &.red {
    color: $red;
  }
  
  &.black {
    color: $text-secondary;
  }
}

// Keypad - fixed at bottom within phone container
.keypad-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.keypad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.keypad-btn {
  height: 52px;
  border: none;
  border-right: 1px solid $border;
  border-bottom: 1px solid $border;
  background: white;
  font-size: 22px;
  font-weight: 500;
  color: $black;
  cursor: pointer;
  
  &:nth-child(3n) {
    border-right: none;
  }
  
  &:active {
    background: #f0f0f0;
  }
}

.keypad-actions {
  display: flex;
}

.action-btn {
  flex: 1;
  height: 48px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  text-transform: uppercase;
  
  &.cancel {
    background: $primary-dark;
  }
  
  &.enter {
    background: $primary;
  }
  
  &:active {
    opacity: 0.9;
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
