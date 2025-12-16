<template>
  <q-page class="splash-page">
    <!-- Header -->
    <div class="app-header">
      <div class="header-content">
        <!-- Logo Text -->
        <div class="logo-text">
          <span class="my">My</span><span class="cities">Cities</span>
        </div>
        
        <!-- Login/Dashboard Link -->
        <a v-if="isLoggedIn" href="#" class="login-link dashboard-link" @click.prevent="goToDashboard">
          <q-icon name="dashboard" size="18px" class="q-mr-xs" />
          Dashboard
        </a>
        <a v-else href="#" class="login-link" @click.prevent="goToLogin">Login</a>
      </div>
    </div>

    <!-- Divider -->
    <div class="header-divider"></div>

    <!-- Navigation Row - Hamburger + Tabs -->
    <div class="nav-row">
      <!-- Hamburger Menu Button -->
      <button 
        class="hamburger-btn"
        @click="showMenu = true"
        aria-label="Open menu"
      >
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
        <span class="hamburger-line"></span>
      </button>

      <!-- Navigation Tabs (horizontally scrollable) -->
      <div class="nav-tabs-container">
        <div class="nav-tabs">
          <button 
            v-for="tab in headerTabs" 
            :key="tab.id"
            class="nav-tab"
            :class="{ 'active': activeTab === tab.slug }"
            @click="selectTab(tab)"
          >
            {{ tab.title }}
          </button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="content-area">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <q-spinner-dots size="50px" color="primary" />
        <p>Loading content...</p>
      </div>

      <!-- Page Content -->
      <div v-else-if="currentPageContent" class="page-content-wrapper">
        <div class="page-content" v-html="currentPageContent"></div>
        
        <!-- Children Links (if parent page selected from menu) -->
        <div v-if="selectedPage?.children?.length > 0" class="children-section">
          <h3>In This Section</h3>
          <div class="children-grid">
            <div 
              v-for="child in selectedPage.children" 
              :key="child.id"
              class="child-card"
              @click="loadChildPage(child)"
            >
              <q-icon :name="getIcon(child.icon)" size="28px" color="primary" />
              <span>{{ child.title }}</span>
              <q-icon name="chevron_right" size="20px" class="arrow" />
            </div>
          </div>
        </div>
      </div>

      <!-- Fallback/Welcome Content (when no page content) -->
      <div v-else class="welcome-content">
        <div class="welcome-placeholder">
          <p>Content from the editor</p>
        </div>
      </div>
    </div>

    <!-- Hamburger Menu Drawer (for Menu Groups) -->
    <q-drawer
      v-model="showMenu"
      side="left"
      overlay
      behavior="mobile"
      elevated
      class="menu-drawer"
    >
      <div class="drawer-header">
        <div class="drawer-logo">
          <span class="my">My</span><span class="cities">Cities</span>
        </div>
        <q-btn flat round dense icon="close" @click="showMenu = false" />
      </div>
      
      <q-list>
        <template v-for="group in menuGroups" :key="group.id">
          <q-expansion-item
            :icon="getIcon(group.icon)"
            :label="group.title"
            header-class="menu-group-header"
            expand-icon-class="text-primary"
          >
            <q-list class="q-pl-md">
              <q-item 
                v-for="child in group.children" 
                :key="child.id"
                clickable 
                v-ripple
                @click="selectMenuChild(child)"
              >
                <q-item-section avatar>
                  <q-icon :name="getIcon(child.icon)" color="grey-7" />
                </q-item-section>
                <q-item-section>{{ child.title }}</q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" color="grey-5" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </template>
        
        <q-separator class="q-my-md" />
        
        <!-- Quick Links -->
        <q-item clickable v-ripple @click="openFacebook">
          <q-item-section avatar>
            <q-icon name="facebook" color="blue" />
          </q-item-section>
          <q-item-section>Facebook</q-item-section>
        </q-item>
        
        <q-item clickable v-ripple @click="openYoutube">
          <q-item-section avatar>
            <q-icon name="smart_display" color="red" />
          </q-item-section>
          <q-item-section>YouTube</q-item-section>
        </q-item>
        
        <q-separator class="q-my-md" />
        
        <!-- Dashboard link if logged in -->
        <template v-if="isLoggedIn">
          <q-item clickable v-ripple @click="goToDashboard" class="dashboard-item">
            <q-item-section avatar>
              <q-icon name="dashboard" color="primary" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>
          
          <q-item clickable v-ripple @click="handleLogout">
            <q-item-section avatar>
              <q-icon name="logout" color="grey" />
            </q-item-section>
            <q-item-section>Logout</q-item-section>
          </q-item>
        </template>
        
        <!-- Login/Register in drawer (if not logged in) -->
        <template v-else>
          <q-item clickable v-ripple @click="goToLogin">
            <q-item-section avatar>
              <q-icon name="login" color="primary" />
            </q-item-section>
            <q-item-section>Login</q-item-section>
          </q-item>
          
          <q-item clickable v-ripple @click="goToRegister">
            <q-item-section avatar>
              <q-icon name="person_add" color="primary" />
            </q-item-section>
            <q-item-section>Register</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useUserStore } from 'src/stores/user';

const router = useRouter();
const userStore = useUserStore();

// Check if user is logged in
const isLoggedIn = computed(() => {
  return !!userStore.token || !!localStorage.getItem('token');
});

// State
const isLoading = ref(true);
const showMenu = ref(false);
const headerTabs = ref([]);
const menuGroups = ref([]);
const activeTab = ref(null);
const selectedPage = ref(null);
const currentPageContent = ref(null);

// Icon mapping (FontAwesome to Material)
const getIcon = (faIcon) => {
  if (!faIcon) return 'article';
  
  const iconMap = {
    'fas fa-home': 'home',
    'fas fa-info-circle': 'info',
    'fas fa-envelope': 'email',
    'fas fa-cogs': 'settings',
    'fas fa-tint': 'water_drop',
    'fas fa-bolt': 'bolt',
    'fas fa-file-invoice-dollar': 'receipt_long',
    'fas fa-question-circle': 'help',
    'fas fa-question': 'help_outline',
    'fas fa-play-circle': 'play_circle',
    'fas fa-chart-line': 'trending_up',
  };
  
  return iconMap[faIcon] || 'article';
};

// Fetch navigation pages
const fetchNavigation = async () => {
  try {
    console.log('[SplashPage] Fetching navigation...');
    const response = await api().get('/v1/pages/navigation');
    console.log('[SplashPage] Navigation response:', response);
    // api() interceptor returns response.data, so response IS the data
    if (response.status) {
      headerTabs.value = response.data.header_tabs || [];
      menuGroups.value = response.data.menu_groups || [];
      console.log('[SplashPage] Header tabs:', headerTabs.value);
      console.log('[SplashPage] Menu groups:', menuGroups.value);
      
      // Auto-select first header tab
      if (headerTabs.value.length > 0) {
        selectTab(headerTabs.value[0]);
      }
    }
  } catch (error) {
    console.error('[SplashPage] Error fetching navigation:', error);
  }
};

// Fetch page content by slug
const fetchPageContent = async (slug) => {
  try {
    console.log('[SplashPage] Fetching page:', slug);
    const response = await api().get(`/v1/pages/${slug}`);
    console.log('[SplashPage] Page response:', response);
    // api() interceptor returns response.data, so response IS the data
    if (response.status) {
      selectedPage.value = response.data;
      currentPageContent.value = response.data.content;
      console.log('[SplashPage] Content loaded:', currentPageContent.value?.substring(0, 100));
    }
  } catch (error) {
    console.error('[SplashPage] Error fetching page:', error);
    currentPageContent.value = null;
  }
};

// Tab selection
const selectTab = async (tab) => {
  activeTab.value = tab.slug;
  await fetchPageContent(tab.slug);
};

// Load child page from menu
const loadChildPage = async (child) => {
  await fetchPageContent(child.slug);
};

// Select menu child and close drawer
const selectMenuChild = async (child) => {
  showMenu.value = false;
  activeTab.value = null; // Deselect header tabs
  await fetchPageContent(child.slug);
};

// Navigation
const goToLogin = () => {
  showMenu.value = false;
  router.push({ name: 'login' });
};

const goToRegister = () => {
  showMenu.value = false;
  router.push({ name: 'register' });
};

const goToDashboard = () => {
  showMenu.value = false;
  router.push({ name: 'home' });
};

const handleLogout = async () => {
  showMenu.value = false;
  await userStore.signOut();
  // Stay on splash page after logout
};

// External links
const openFacebook = () => {
  window.open('https://www.facebook.com/groups/982841062697878', '_blank');
};

const openYoutube = () => {
  window.open('https://www.youtube.com/@mycity3924', '_blank');
};

// Initialize
onMounted(async () => {
  await fetchNavigation();
  isLoading.value = false;
});
</script>

<style lang="scss" scoped>
$primary: #3294B8;
$primary-dark: #2a7a9a;

.splash-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #ffffff;
}

/* Header */
.app-header {
  background: #ffffff;
  padding: 16px 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-text {
  font-size: 28px;
  font-style: italic;
  
  .my {
    color: #000000;
    font-weight: 300;
  }
  
  .cities {
    color: $primary;
    font-weight: 500;
  }
}

.login-link {
  color: #333;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  
  &:hover {
    color: $primary;
  }
  
  &.dashboard-link {
    display: flex;
    align-items: center;
    color: $primary;
    font-weight: 600;
  }
}

/* Divider */
.header-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0 20px;
}

/* Navigation Row */
.nav-row {
  display: flex;
  align-items: center;
  padding: 0 0 0 12px;
  background: #ffffff;
}

/* Hamburger Button */
.hamburger-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 36px;
  height: 36px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  
  .hamburger-line {
    width: 22px;
    height: 3px;
    background: #000000;
    border-radius: 2px;
  }
}

/* Navigation Tabs */
.nav-tabs-container {
  flex: 1;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-tabs {
  display: flex;
  padding: 0 4px;
  gap: 0;
  min-width: max-content;
}

.nav-tab {
  padding: 14px 16px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  
  &.active {
    color: $primary;
  }
  
  &:hover:not(.active) {
    color: #333;
  }
}

/* Content Area */
.content-area {
  flex: 1;
  margin: 16px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #666;
  background: #e8e8e8;
  border-radius: 8px;
  min-height: 400px;
  
  p {
    margin-top: 15px;
  }
}

/* Page Content */
.page-content-wrapper {
  background: #e8e8e8;
  border-radius: 8px;
  min-height: 400px;
}

.page-content {
  padding: 24px;
  
  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  
  :deep(h1) {
    font-size: 24px;
    color: #2c3e50;
  }
  
  :deep(h2) {
    font-size: 20px;
    color: #34495e;
  }
  
  :deep(p) {
    line-height: 1.7;
    color: #555;
  }
  
  :deep(a) {
    color: $primary;
  }
}

.children-section {
  padding: 20px;
  background: #f0f0f0;
  border-top: 1px solid #ddd;
  
  h3 {
    font-size: 16px;
    color: #2c3e50;
    margin-bottom: 15px;
  }
}

.children-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.child-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateX(5px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  span {
    flex: 1;
    font-weight: 500;
    color: #333;
  }
  
  .arrow {
    color: #bbb;
  }
}

/* Welcome Content (Fallback) */
.welcome-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.welcome-placeholder {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 24px;
  background: #e8e8e8;
  border-radius: 8px;
  min-height: 400px;
  
  p {
    color: #333;
    font-size: 18px;
    font-weight: 500;
    margin: 0;
  }
}

/* Menu Drawer */
.menu-drawer {
  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
    background: #ffffff;
  }
  
  .drawer-logo {
    font-size: 24px;
    font-style: italic;
    
    .my {
      color: #000000;
      font-weight: 300;
    }
    
    .cities {
      color: $primary;
      font-weight: 500;
    }
  }
}

.menu-group-header {
  font-weight: 600;
  color: #333;
}

/* Responsive */
@media (min-width: 600px) {
  .logo-text {
    font-size: 32px;
  }
  
  .nav-tab {
    padding: 16px 24px;
    font-size: 16px;
  }
  
  .page-content {
    padding: 32px;
  }
}
</style>
