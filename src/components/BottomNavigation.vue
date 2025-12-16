<template>
  <div class="bottom-nav">
    <q-btn flat class="nav-btn" :class="{ active: active === 'dashboard' }" @click="goTo('home')">
      <q-icon name="dashboard" size="22px" />
      <span>Dashboard</span>
    </q-btn>
    <q-btn flat class="nav-btn" :class="{ active: active === 'readings' }" @click="goTo('enter-readings')">
      <q-icon name="speed" size="22px" />
      <span>Readings</span>
    </q-btn>
    <q-btn flat class="nav-btn" :class="{ active: active === 'accounts' }" @click="goTo('accounts-list')">
      <q-icon name="account_circle" size="22px" />
      <span>Accounts</span>
    </q-btn>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

defineProps({
  active: {
    type: String,
    default: 'dashboard'
  }
});

const router = useRouter();

const goTo = (routeName) => {
  router.push({ name: routeName });
};
</script>

<style lang="scss" scoped>
$primary: #4ECDC4;
$text-secondary: #666;
$border: #e0e0e0;

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 6px 0;
  border-top: 1px solid $border;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .nav-btn {
    flex-direction: column;
    font-size: 10px;
    color: $text-secondary;
    padding: 4px 12px;
    min-width: 60px;

    &.active {
      color: $primary;
    }

    span {
      margin-top: 2px;
    }
  }
}
</style>





