<template>
  <div class="tiptap-editor" :class="{ 'focused': isFocused }">
    <!-- Toolbar -->
    <div class="editor-toolbar" v-if="editor">
      <!-- Text Formatting -->
      <div class="toolbar-group">
        <button 
          type="button"
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          title="Bold"
        >
          <q-icon name="format_bold" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          title="Italic"
        >
          <q-icon name="format_italic" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().toggleUnderline().run()"
          :class="{ 'is-active': editor.isActive('underline') }"
          title="Underline"
        >
          <q-icon name="format_underlined" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          title="Strikethrough"
        >
          <q-icon name="strikethrough_s" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Headings -->
      <div class="toolbar-group">
        <button 
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          title="Heading 1"
        >
          H1
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          title="Heading 2"
        >
          H2
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Alignment -->
      <div class="toolbar-group">
        <button 
          type="button"
          @click="editor.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          title="Align Left"
        >
          <q-icon name="format_align_left" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          title="Align Center"
        >
          <q-icon name="format_align_center" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          title="Align Right"
        >
          <q-icon name="format_align_right" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Lists -->
      <div class="toolbar-group">
        <button 
          type="button"
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          title="Bullet List"
        >
          <q-icon name="format_list_bulleted" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          title="Numbered List"
        >
          <q-icon name="format_list_numbered" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Links & Media -->
      <div class="toolbar-group">
        <button 
          type="button"
          @click="setLink"
          :class="{ 'is-active': editor.isActive('link') }"
          title="Insert Link"
        >
          <q-icon name="link" />
        </button>
        <button 
          type="button"
          @click="addImage"
          title="Insert Image"
        >
          <q-icon name="image" />
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Undo/Redo -->
      <div class="toolbar-group">
        <button 
          type="button"
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          title="Undo"
        >
          <q-icon name="undo" />
        </button>
        <button 
          type="button"
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          title="Redo"
        >
          <q-icon name="redo" />
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <editor-content :editor="editor" class="editor-content" />

    <!-- Link Dialog -->
    <q-dialog v-model="showLinkDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Insert Link</div>
        </q-card-section>
        <q-card-section>
          <q-input 
            v-model="linkUrl" 
            label="URL" 
            placeholder="https://example.com"
            autofocus
            @keyup.enter="confirmLink"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Insert" @click="confirmLink" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Image Dialog -->
    <q-dialog v-model="showImageDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Insert Image</div>
        </q-card-section>
        <q-card-section>
          <q-tabs v-model="imageTab" class="q-mb-md">
            <q-tab name="url" label="URL" />
            <q-tab name="upload" label="Upload" />
          </q-tabs>

          <q-tab-panels v-model="imageTab">
            <q-tab-panel name="url">
              <q-input 
                v-model="imageUrl" 
                label="Image URL" 
                placeholder="https://example.com/image.jpg"
              />
            </q-tab-panel>
            <q-tab-panel name="upload">
              <q-file
                v-model="imageFile"
                label="Select Image"
                accept="image/*"
                filled
                @update:model-value="handleImageUpload"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
              <div v-if="uploadedImageUrl" class="q-mt-md">
                <img :src="uploadedImageUrl" class="preview-image" />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Insert" @click="confirmImage" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Start writing...',
  },
});

const emit = defineEmits(['update:modelValue']);

const isFocused = ref(false);
const showLinkDialog = ref(false);
const showImageDialog = ref(false);
const linkUrl = ref('');
const imageUrl = ref('');
const imageFile = ref(null);
const uploadedImageUrl = ref('');
const imageTab = ref('url');

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
  onFocus: () => {
    isFocused.value = true;
  },
  onBlur: () => {
    isFocused.value = false;
  },
});

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, false);
  }
});

// Link handling
function setLink() {
  const previousUrl = editor.value.getAttributes('link').href;
  linkUrl.value = previousUrl || '';
  showLinkDialog.value = true;
}

function confirmLink() {
  if (linkUrl.value) {
    editor.value
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl.value })
      .run();
  } else {
    editor.value.chain().focus().unsetLink().run();
  }
  showLinkDialog.value = false;
  linkUrl.value = '';
}

// Image handling
function addImage() {
  imageUrl.value = '';
  imageFile.value = null;
  uploadedImageUrl.value = '';
  imageTab.value = 'url';
  showImageDialog.value = true;
}

function handleImageUpload(file) {
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageUrl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function confirmImage() {
  const url = imageTab.value === 'url' ? imageUrl.value : uploadedImageUrl.value;
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run();
  }
  showImageDialog.value = false;
}

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
.tiptap-editor {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;

  &.focused {
    border-color: #3294B8;
  }
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  background: #ddd;
  margin: 0 8px;
}

.editor-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #555;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.15s;

  &:hover {
    background: #e0e0e0;
  }

  &.is-active {
    background: #3294B8;
    color: white;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.editor-content {
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;

  :deep(.ProseMirror) {
    outline: none;
    min-height: 168px;

    p {
      margin: 0 0 1em;
    }

    h1, h2, h3 {
      margin: 0 0 0.5em;
    }

    ul, ol {
      padding-left: 1.5em;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }

    a {
      color: #3294B8;
      text-decoration: underline;
    }

    .is-empty::before {
      content: attr(data-placeholder);
      float: left;
      color: #aaa;
      pointer-events: none;
      height: 0;
    }
  }
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
}
</style>






