<script setup lang="ts">
import { ref } from 'vue';
import { useConversionStore } from '@/stores/conversion';

const conversionStore = useConversionStore();
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);
const error = ref<string | null>(null);

const acceptedFormats = '.mp4,.webm,.avi,.mov,.mkv,.flv,.wmv';

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
    if (!file.type.startsWith('video/')) {
      error.value = `${file.name}: Not a video file`;
      continue;
    }

    try {
      await conversionStore.uploadAndConvert(file);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed';
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
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-width="2" stroke-linecap="round"/>
        </svg>
        
        <h3>{{ uploading ? 'Uploading...' : 'Drop video files here' }}</h3>
        <p>or click to browse</p>
        <p class="formats">Supported: MP4, WebM, AVI, MOV, MKV, FLV, WMV (Max: 50GB)</p>
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
  border: 3px dashed #cbd5e1;
  border-radius: 12px;
  padding: 60px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8fafc;
}

.drop-zone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.drop-zone.drag-over {
  border-color: #3b82f6;
  background: #dbeafe;
  transform: scale(1.02);
}

.drop-zone.uploading {
  opacity: 0.6;
  cursor: wait;
}

.drop-zone-content {
  pointer-events: none;
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  color: #3b82f6;
}

h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
}

p {
  color: #64748b;
  margin: 4px 0;
}

.formats {
  font-size: 12px;
  margin-top: 12px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
}
</style>
