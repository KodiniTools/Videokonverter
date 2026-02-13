<script setup lang="ts">
import { ref } from 'vue';
import { useConversionStore } from '@/stores/conversion';
import { useI18n } from '@/composables/useI18n';

const conversionStore = useConversionStore();
const { t } = useI18n();
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const error = ref<string | null>(null);

const acceptedFormats = '.mp4,.webm,.avi,.mov,.mkv,.flv,.wmv,.ts';
const acceptedExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'ts'];

function isVideoFile(file: File): boolean {
  // Prüfe MIME-Type
  if (file.type.startsWith('video/')) {
    return true;
  }
  // Fallback: Prüfe Dateiendung (für MOV, MKV etc. die manchmal nicht erkannt werden)
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension ? acceptedExtensions.includes(extension) : false;
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;

  const files = Array.from(e.dataTransfer?.files || []);
  await processFiles(files);
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const files = Array.from(target.files || []);
  processFiles(files);
}

async function processFiles(files: File[]) {
  error.value = null;
  uploading.value = true;

  for (const file of files) {
    if (!isVideoFile(file)) {
      error.value = `${file.name}: ${t('notVideoFile')}`;
      continue;
    }

    try {
      await conversionStore.uploadFile(file);
    } catch (err) {
      error.value = err instanceof Error ? err.message : t('uploadFailed');
    }
  }

  uploading.value = false;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <div class="uploader-container">
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging, 'uploading': uploading }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <div class="drop-zone-content">
        <div class="upload-button" :class="{ 'uploading': uploading }">
          <svg v-if="!uploading" class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <svg v-else class="upload-icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <h3>{{ uploading ? t('uploadingText') : t('dropFilesHere') }}</h3>
        <p>{{ t('orClickToBrowse') }}</p>
        <p class="formats">{{ t('supportedFormats') }}</p>
      </div>

      <input
        ref="fileInput"
        type="file"
        :accept="acceptedFormats"
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.uploader-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.drop-zone {
  border: 3px dashed var(--color-border);
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--color-surface);
}

.drop-zone:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.drop-zone.drag-over {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
  transform: scale(1.02);
}

.drop-zone.uploading {
  opacity: 0.7;
  cursor: wait;
}

.drop-zone-content {
  pointer-events: none;
}

.upload-button {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.drop-zone:hover .upload-button {
  background: var(--color-primary-hover);
  transform: scale(1.05);
}

.upload-button.uploading {
  background: var(--color-secondary);
}

.upload-icon {
  width: 36px;
  height: 36px;
  color: var(--color-text);
}

.upload-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

p {
  color: var(--color-text-secondary);
  margin: 4px 0;
}

.formats {
  font-size: 12px;
  margin-top: 12px;
  color: var(--color-text-muted);
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: 8px;
  color: var(--color-error);
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .drop-zone {
    padding: 40px 16px;
  }

  .upload-button {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
  }

  .upload-icon {
    width: 28px;
    height: 28px;
  }

  h3 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .drop-zone {
    padding: 32px 12px;
    border-width: 2px;
  }

  .upload-button {
    width: 56px;
    height: 56px;
    margin-bottom: 12px;
  }

  .upload-icon {
    width: 24px;
    height: 24px;
  }

  h3 {
    font-size: 16px;
  }

  p {
    font-size: 14px;
  }

  .formats {
    font-size: 11px;
  }

  .error-message {
    font-size: 13px;
    padding: 10px;
  }
}
</style>
