<template>
  <q-page class="page-view">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <q-spinner-dots size="60px" color="primary" />
      <p>Loading content...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <q-icon name="error_outline" size="60px" color="negative" />
      <h3>Page Not Found</h3>
      <p>{{ error }}</p>
      <q-btn color="primary" label="Go Back" @click="$router.back()" />
    </div>

    <!-- Page Content -->
    <div v-else-if="page" class="page-content">
      <!-- Breadcrumbs -->
      <div v-if="page.parent" class="breadcrumbs">
        <router-link to="/" class="breadcrumb-link">
          <q-icon name="home" size="18px" />
        </router-link>
        <q-icon name="chevron_right" size="18px" class="separator" />
        <router-link :to="'/page/' + page.parent.slug" class="breadcrumb-link">
          {{ page.parent.title }}
        </router-link>
        <q-icon name="chevron_right" size="18px" class="separator" />
        <span class="current">{{ page.title }}</span>
      </div>

      <!-- Main Content -->
      <div class="content-wrapper" v-html="page.content"></div>

      <!-- Child Pages Navigation (if parent page) -->
      <div v-if="page.children && page.children.length > 0" class="children-nav">
        <h3><q-icon name="list" class="q-mr-sm" />In This Section</h3>
        <div class="children-grid">
          <router-link 
            v-for="child in page.children" 
            :key="child.id"
            :to="'/page/' + child.slug"
            class="child-card"
          >
            <q-icon :name="getIcon(child.icon)" size="32px" color="primary" />
            <span>{{ child.title }}</span>
            <q-icon name="arrow_forward" size="20px" class="arrow" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Action Buttons (for guest users) -->
    <div v-if="!isAuthenticated" class="action-buttons">
      <q-btn 
        label="Sign In" 
        color="primary" 
        rounded 
        class="action-btn" 
        @click="$router.push({ name: 'login' })"
      />
      <q-btn 
        label="Register" 
        color="secondary" 
        rounded 
        outline 
        class="action-btn" 
        @click="$router.push({ name: 'register' })"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from 'stores/user';
import { api } from 'boot/axios';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const page = ref(null);
const isLoading = ref(true);
const error = ref(null);

const isAuthenticated = computed(() => {
  return userStore.getUser && userStore.getToken;
});

// Convert FontAwesome icon to Material icon (fallback)
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
  };
  
  return iconMap[faIcon] || 'article';
};

const fetchPage = async (slug) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await api.get(`/v1/pages/${slug}`);
    if (response.data.status) {
      page.value = response.data.data;
    } else {
      error.value = response.data.msg || 'Page not found';
    }
  } catch (err) {
    console.error('Error fetching page:', err);
    error.value = 'Failed to load page content';
  } finally {
    isLoading.value = false;
  }
};

// Watch for route changes
watch(() => route.params.slug, (newSlug) => {
  if (newSlug) {
    fetchPage(newSlug);
  }
}, { immediate: true });

onMounted(() => {
  if (route.params.slug) {
    fetchPage(route.params.slug);
  }
});
</script>

<style scoped>
.page-view {
  background: #f8f9fa;
  min-height: 100vh;
  padding-bottom: 100px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 40px 20px;
}

.loading-container p,
.error-container p {
  color: #666;
  margin-top: 20px;
  font-size: 16px;
}

.error-container h3 {
  color: #333;
  margin: 20px 0 10px;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  font-size: 14px;
}

.breadcrumb-link {
  color: #3498db;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.separator {
  color: #bbb;
}

.current {
  color: #666;
}

.content-wrapper {
  background: white;
  padding: 20px;
  margin: 0;
}

.content-wrapper :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.content-wrapper :deep(h1),
.content-wrapper :deep(h2),
.content-wrapper :deep(h3) {
  color: #2c3e50;
}

.content-wrapper :deep(p) {
  line-height: 1.7;
}

.content-wrapper :deep(a) {
  color: #3498db;
}

.children-nav {
  background: white;
  margin-top: 2px;
  padding: 25px 20px;
}

.children-nav h3 {
  color: #2c3e50;
  font-size: 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.children-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 18px;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s;
}

.child-card:hover {
  background: #e3f2fd;
  transform: translateX(5px);
}

.child-card span {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
}

.child-card .arrow {
  color: #bbb;
  transition: color 0.2s;
}

.child-card:hover .arrow {
  color: #3498db;
}

.action-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 15px 20px;
  background: linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0));
  z-index: 10;
}

.action-btn {
  flex: 1;
  max-width: 160px;
  font-size: 15px;
  padding: 12px 20px;
}

/* Responsive */
@media (min-width: 768px) {
  .content-wrapper {
    padding: 30px 40px;
  }
  
  .children-nav {
    padding: 30px 40px;
  }
}
</style>






