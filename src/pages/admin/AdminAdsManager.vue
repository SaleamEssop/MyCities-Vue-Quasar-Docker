<template>
  <q-page class="admin-ads-manager">
    <div class="page-header">
      <h1>Advertising Manager</h1>
      <p class="subtitle">Manage ad categories and advertisements for the splash screen</p>
    </div>

    <!-- Tabs for Categories vs Ads -->
    <q-tabs v-model="activeTab" class="main-tabs" align="left">
      <q-tab name="categories" label="Categories (Tabs)" icon="category" />
      <q-tab name="ads" label="Advertisements" icon="campaign" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated>
      <!-- Categories Panel -->
      <q-tab-panel name="categories">
        <div class="panel-header">
          <h2>Ad Categories</h2>
          <p>Categories appear as tabs on the splash screen</p>
          <q-btn 
            color="primary" 
            icon="add" 
            label="Add Category" 
            @click="openCategoryDialog()"
          />
        </div>

        <q-table
          :rows="categories"
          :columns="categoryColumns"
          row-key="id"
          :loading="loading"
          flat
          bordered
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="edit" color="primary" @click="openCategoryDialog(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" @click="confirmDeleteCategory(props.row)" />
            </q-td>
          </template>
          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">
              <q-toggle 
                :model-value="props.row.is_active" 
                @update:model-value="toggleCategoryActive(props.row)"
                color="positive"
              />
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>

      <!-- Ads Panel -->
      <q-tab-panel name="ads">
        <div class="panel-header">
          <h2>Advertisements</h2>
          <p>Individual ads shown within categories</p>
          <q-btn 
            color="primary" 
            icon="add" 
            label="Add Advertisement" 
            @click="openAdDialog()"
          />
        </div>

        <!-- Filter by category -->
        <div class="filter-bar q-mb-md">
          <q-select
            v-model="selectedCategoryFilter"
            :options="categoryFilterOptions"
            label="Filter by Category"
            outlined
            dense
            style="min-width: 200px"
          />
        </div>

        <q-table
          :rows="filteredAds"
          :columns="adColumns"
          row-key="id"
          :loading="loading"
          flat
          bordered
        >
          <template v-slot:body-cell-image="props">
            <q-td :props="props">
              <img 
                v-if="props.row.image" 
                :src="props.row.image" 
                class="ad-thumbnail"
              />
              <span v-else class="no-image">No image</span>
            </q-td>
          </template>
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="visibility" color="info" @click="previewAd(props.row)" />
              <q-btn flat round dense icon="edit" color="primary" @click="openAdDialog(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" @click="confirmDeleteAd(props.row)" />
            </q-td>
          </template>
          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">
              <q-toggle 
                :model-value="props.row.is_active" 
                @update:model-value="toggleAdActive(props.row)"
                color="positive"
              />
            </q-td>
          </template>
        </q-table>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Category Dialog -->
    <q-dialog v-model="showCategoryDialog" persistent>
      <q-card style="min-width: 500px">
        <q-card-section class="dialog-header">
          <div class="text-h6">{{ editingCategory ? 'Edit Category' : 'New Category' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveCategory" class="q-gutter-md">
            <q-input
              v-model="categoryForm.name"
              label="Category Name *"
              outlined
              :rules="[val => !!val || 'Name is required']"
            />
            <q-input
              v-model.number="categoryForm.order"
              label="Display Order"
              type="number"
              outlined
              hint="Lower numbers appear first"
            />
            <q-toggle
              v-model="categoryForm.is_active"
              label="Active"
              color="positive"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" @click="saveCategory" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Ad Dialog -->
    <q-dialog v-model="showAdDialog" persistent maximized>
      <q-card>
        <q-card-section class="dialog-header row items-center">
          <div class="text-h6">{{ editingAd ? 'Edit Advertisement' : 'New Advertisement' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="ad-form-content">
          <div class="row q-col-gutter-lg">
            <!-- Left Column: Form -->
            <div class="col-12 col-md-6">
              <q-form @submit="saveAd" class="q-gutter-md">
                <q-select
                  v-model="adForm.category_id"
                  :options="categoryOptions"
                  label="Category *"
                  outlined
                  emit-value
                  map-options
                  :rules="[val => !!val || 'Category is required']"
                />
                
                <q-input
                  v-model="adForm.name"
                  label="Ad Name/Title"
                  outlined
                />

                <q-input
                  v-model.number="adForm.price"
                  label="Price (R)"
                  type="number"
                  outlined
                  hint="Leave empty or 0 if not applicable"
                />

                <q-input
                  v-model="adForm.url"
                  label="Link URL"
                  outlined
                  placeholder="https://example.com"
                  hint="Where users go when they click the ad"
                />

                <div class="form-section">
                  <label class="section-label">Ad Image</label>
                  <q-file
                    v-model="adImageFile"
                    label="Upload Image"
                    outlined
                    accept="image/*"
                    @update:model-value="handleAdImageUpload"
                  >
                    <template v-slot:prepend>
                      <q-icon name="attach_file" />
                    </template>
                  </q-file>
                  <q-input
                    v-model="adForm.image"
                    label="Or enter Image URL"
                    outlined
                    class="q-mt-sm"
                    placeholder="https://example.com/image.jpg"
                  />
                  <div v-if="adForm.image" class="image-preview q-mt-sm">
                    <img :src="adForm.image" />
                  </div>
                </div>

                <q-input
                  v-model.number="adForm.order"
                  label="Display Order"
                  type="number"
                  outlined
                />

                <q-toggle
                  v-model="adForm.is_active"
                  label="Active"
                  color="positive"
                />
              </q-form>
            </div>

            <!-- Right Column: Description Editor -->
            <div class="col-12 col-md-6">
              <div class="form-section">
                <label class="section-label">Description / Content</label>
                <TipTapEditor 
                  v-model="adForm.description"
                  placeholder="Enter ad description or promotional content..."
                />
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="dialog-footer">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save Advertisement" @click="saveAd" :loading="saving" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Preview Dialog -->
    <q-dialog v-model="showPreviewDialog">
      <q-card style="min-width: 400px; max-width: 500px">
        <q-card-section class="dialog-header">
          <div class="text-h6">Ad Preview</div>
        </q-card-section>
        <q-card-section class="preview-content">
          <div v-if="previewingAd">
            <div v-if="previewingAd.description" v-html="previewingAd.description" class="ad-description"></div>
            <img v-if="previewingAd.image" :src="previewingAd.image" class="preview-image" />
            <div v-if="previewingAd.price > 0" class="ad-price">R {{ previewingAd.price }}</div>
            <div v-if="previewingAd.name" class="ad-name">{{ previewingAd.name }}</div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Confirm Delete</div>
        </q-card-section>
        <q-card-section>
          Are you sure you want to delete "{{ deleteItemName }}"? This action cannot be undone.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="negative" label="Delete" @click="confirmDelete" :loading="deleting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import TipTapEditor from 'src/components/TipTapEditor.vue';

const $q = useQuasar();

// State
const activeTab = ref('categories');
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);

const categories = ref([]);
const ads = ref([]);

// Category form
const showCategoryDialog = ref(false);
const editingCategory = ref(null);
const categoryForm = ref({
  name: '',
  order: 0,
  is_active: true,
});

// Ad form
const showAdDialog = ref(false);
const editingAd = ref(null);
const adForm = ref({
  category_id: null,
  name: '',
  description: '',
  image: '',
  url: '',
  price: 0,
  order: 0,
  is_active: true,
});
const adImageFile = ref(null);

// Filter
const selectedCategoryFilter = ref(null);

// Preview
const showPreviewDialog = ref(false);
const previewingAd = ref(null);

// Delete
const showDeleteDialog = ref(false);
const deleteItemName = ref('');
const deleteCallback = ref(null);

// Table columns
const categoryColumns = [
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
  { name: 'order', label: 'Order', field: 'order', sortable: true, align: 'center' },
  { name: 'adsCount', label: 'Ads', field: row => row.ads?.length || 0, align: 'center' },
  { name: 'isActive', label: 'Active', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
];

const adColumns = [
  { name: 'image', label: 'Image', field: 'image', align: 'center' },
  { name: 'name', label: 'Name', field: 'name', sortable: true, align: 'left' },
  { name: 'category', label: 'Category', field: row => row.category?.name || 'Unknown', sortable: true, align: 'left' },
  { name: 'price', label: 'Price', field: 'price', sortable: true, align: 'right', format: val => val > 0 ? `R ${val}` : '-' },
  { name: 'order', label: 'Order', field: 'order', sortable: true, align: 'center' },
  { name: 'isActive', label: 'Active', field: 'is_active', align: 'center' },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' },
];

// Computed
const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    label: cat.name,
    value: cat.id,
  }));
});

const categoryFilterOptions = computed(() => {
  return [
    { label: 'All Categories', value: null },
    ...categories.value.map(cat => ({
      label: cat.name,
      value: cat.id,
    })),
  ];
});

const filteredAds = computed(() => {
  if (!selectedCategoryFilter.value) return ads.value;
  return ads.value.filter(ad => ad.category_id === selectedCategoryFilter.value);
});

// Load data
onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    // TODO: Replace with actual API calls
    // For now, load mock data or from existing API
    const { getAds } = await import('boot/axios');
    const response = await getAds();
    const data = response?.data || response;
    
    if (Array.isArray(data)) {
      categories.value = data.map((cat, index) => ({
        id: cat.id || index + 1,
        name: cat.name,
        order: cat.order || index,
        is_active: cat.is_active !== false,
        ads: cat.ads || [],
      }));
      
      // Flatten ads with category reference
      ads.value = data.flatMap(cat => 
        (cat.ads || []).map(ad => ({
          ...ad,
          category_id: cat.id,
          category: cat,
        }))
      );
    }
  } catch (error) {
    console.error('Failed to load ads:', error);
    // Load demo data
    loadDemoData();
  } finally {
    loading.value = false;
  }
}

function loadDemoData() {
  categories.value = [
    { id: 1, name: 'Home', order: 0, is_active: true, ads: [] },
    { id: 2, name: 'News', order: 1, is_active: true, ads: [] },
    { id: 3, name: 'Services', order: 2, is_active: true, ads: [] },
    { id: 4, name: 'LightsAndWater', order: 3, is_active: true, ads: [] },
  ];
  ads.value = [];
}

// Category CRUD
function openCategoryDialog(category = null) {
  editingCategory.value = category;
  if (category) {
    categoryForm.value = { ...category };
  } else {
    categoryForm.value = {
      name: '',
      order: categories.value.length,
      is_active: true,
    };
  }
  showCategoryDialog.value = true;
}

async function saveCategory() {
  if (!categoryForm.value.name) {
    $q.notify({ type: 'warning', message: 'Category name is required' });
    return;
  }
  
  saving.value = true;
  try {
    // TODO: Replace with actual API call
    if (editingCategory.value) {
      const index = categories.value.findIndex(c => c.id === editingCategory.value.id);
      if (index !== -1) {
        categories.value[index] = { ...categories.value[index], ...categoryForm.value };
      }
    } else {
      categories.value.push({
        ...categoryForm.value,
        id: Date.now(),
        ads: [],
      });
    }
    
    showCategoryDialog.value = false;
    $q.notify({ type: 'positive', message: 'Category saved successfully' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save category' });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteCategory(category) {
  deleteItemName.value = category.name;
  deleteCallback.value = () => deleteCategory(category);
  showDeleteDialog.value = true;
}

async function deleteCategory(category) {
  deleting.value = true;
  try {
    // TODO: Replace with actual API call
    categories.value = categories.value.filter(c => c.id !== category.id);
    ads.value = ads.value.filter(a => a.category_id !== category.id);
    showDeleteDialog.value = false;
    $q.notify({ type: 'positive', message: 'Category deleted' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to delete category' });
  } finally {
    deleting.value = false;
  }
}

function toggleCategoryActive(category) {
  category.is_active = !category.is_active;
  // TODO: API call to update
}

// Ad CRUD
function openAdDialog(ad = null) {
  editingAd.value = ad;
  adImageFile.value = null;
  if (ad) {
    adForm.value = { ...ad };
  } else {
    adForm.value = {
      category_id: categories.value[0]?.id || null,
      name: '',
      description: '',
      image: '',
      url: '',
      price: 0,
      order: ads.value.length,
      is_active: true,
    };
  }
  showAdDialog.value = true;
}

function handleAdImageUpload(file) {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      adForm.value.image = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

async function saveAd() {
  if (!adForm.value.category_id) {
    $q.notify({ type: 'warning', message: 'Please select a category' });
    return;
  }
  
  saving.value = true;
  try {
    // TODO: Replace with actual API call
    const category = categories.value.find(c => c.id === adForm.value.category_id);
    
    if (editingAd.value) {
      const index = ads.value.findIndex(a => a.id === editingAd.value.id);
      if (index !== -1) {
        ads.value[index] = { 
          ...ads.value[index], 
          ...adForm.value,
          category,
        };
      }
    } else {
      ads.value.push({
        ...adForm.value,
        id: Date.now(),
        category,
      });
    }
    
    showAdDialog.value = false;
    $q.notify({ type: 'positive', message: 'Advertisement saved successfully' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to save advertisement' });
  } finally {
    saving.value = false;
  }
}

function previewAd(ad) {
  previewingAd.value = ad;
  showPreviewDialog.value = true;
}

function confirmDeleteAd(ad) {
  deleteItemName.value = ad.name || 'this advertisement';
  deleteCallback.value = () => deleteAd(ad);
  showDeleteDialog.value = true;
}

async function deleteAd(ad) {
  deleting.value = true;
  try {
    // TODO: Replace with actual API call
    ads.value = ads.value.filter(a => a.id !== ad.id);
    showDeleteDialog.value = false;
    $q.notify({ type: 'positive', message: 'Advertisement deleted' });
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Failed to delete advertisement' });
  } finally {
    deleting.value = false;
  }
}

function toggleAdActive(ad) {
  ad.is_active = !ad.is_active;
  // TODO: API call to update
}

function confirmDelete() {
  if (deleteCallback.value) {
    deleteCallback.value();
  }
}
</script>

<style lang="scss" scoped>
.admin-ads-manager {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin: 0 0 8px;
    color: #333;
  }

  .subtitle {
    color: #666;
    margin: 0;
  }
}

.main-tabs {
  margin-bottom: 0;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-top: 16px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
  }

  p {
    color: #666;
    margin: 0;
    flex: 1;
  }
}

.filter-bar {
  display: flex;
  gap: 16px;
}

.ad-thumbnail {
  width: 60px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  color: #999;
  font-size: 12px;
}

.dialog-header {
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.dialog-footer {
  border-top: 1px solid #e0e0e0;
  padding: 16px;
}

.ad-form-content {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
}

.form-section {
  margin-bottom: 16px;

  .section-label {
    display: block;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
}

.image-preview {
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    border: 1px solid #e0e0e0;
  }
}

.preview-content {
  .ad-description {
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .preview-image {
    width: 100%;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .ad-price {
    display: inline-block;
    background: #e7e7e7;
    padding: 6px 14px;
    border-radius: 6px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .ad-name {
    color: #555;
  }
}
</style>






