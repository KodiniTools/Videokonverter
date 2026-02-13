<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ConversionJob, VideoFormat, VideoQuality } from '@/types/conversion';
import { useConversionStore } from '@/stores/conversion';

const props = defineProps<{
  job: ConversionJob;
}>();

const conversionStore = useConversionStore();

// Lokale State für Format-Auswahl
const selectedFormat = ref<VideoFormat>(props.job.targetFormat);
const selectedQuality = ref<VideoQuality>(props.job.quality);
const isConverting = ref(false);

const formats: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV' },
  { value: 'mkv', label: 'MKV' },
  { value: 'ts', label: 'TS' }
];

const qualities: { value: VideoQuality; label: string }[] = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
  { value: 'ultra', label: 'Ultra' }
];

const statusText = computed(() => {
  switch (props.job.status) {
    case 'uploading': return `Hochladen... ${props.job.progress}%`;
    case 'uploaded': return 'Bereit zur Konvertierung';
    case 'pending': return 'Warten...';
    case 'processing': return `Konvertierung... ${props.job.progress}%`;
    case 'completed': return 'Fertig';
    case 'error': return 'Fehler';
    default: return '';
  }
});

const statusClass = computed(() => {
  return `status-${props.job.status}`;
});

const fileSizeMB = computed(() => {
  const gb = props.job.fileSize / 1024 / 1024 / 1024;
  return gb > 1
    ? `${gb.toFixed(2)} GB`
    : `${(props.job.fileSize / 1024 / 1024).toFixed(1)} MB`;
});

const convertedFileSizeMB = computed(() => {
  if (!props.job.convertedFileSize) return null;
  const gb = props.job.convertedFileSize / 1024 / 1024 / 1024;
  return gb > 1
    ? `${gb.toFixed(2)} GB`
    : `${(props.job.convertedFileSize / 1024 / 1024).toFixed(1)} MB`;
});

const convertedFileName = computed(() => {
  const baseName = props.job.fileName.replace(/\.[^.]+$/, '');
  return `${baseName}.${props.job.targetFormat}`;
});

const showProgress = computed(() => {
  return props.job.status === 'uploading' || props.job.status === 'pending' || props.job.status === 'processing';
});

async function handleStartConversion() {
  isConverting.value = true;
  try {
    await conversionStore.startConversion(props.job.id, selectedFormat.value, selectedQuality.value);
  } catch (err) {
    console.error('Konvertierung fehlgeschlagen:', err);
  } finally {
    isConverting.value = false;
  }
}

function handleDownload() {
  conversionStore.downloadFile(props.job);
}

function handleRemove() {
  conversionStore.removeJob(props.job.id);
}
</script>

<template>
  <div class="conversion-item">
    <div class="item-header">
      <div class="file-info">
        <div class="file-name">{{ job.status === 'completed' ? convertedFileName : job.fileName }}</div>
        <div class="file-meta">
          {{ job.status === 'completed' && convertedFileSizeMB ? convertedFileSizeMB : fileSizeMB }}
        </div>
      </div>

      <div class="status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <div v-if="showProgress" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
    </div>

    <!-- Format-Auswahl für hochgeladene Dateien -->
    <div v-if="job.status === 'uploaded'" class="format-selection">
      <div class="selector-row">
        <label>Format:</label>
        <div class="format-buttons">
          <button
            v-for="format in formats"
            :key="format.value"
            :class="{ active: selectedFormat === format.value }"
            @click="selectedFormat = format.value"
          >
            {{ format.label }}
          </button>
        </div>
      </div>

      <div class="selector-row">
        <label>Qualität:</label>
        <div class="format-buttons">
          <button
            v-for="quality in qualities"
            :key="quality.value"
            :class="{ active: selectedQuality === quality.value }"
            @click="selectedQuality = quality.value"
          >
            {{ quality.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="job.error" class="error-text">
      {{ job.error }}
    </div>

    <div class="item-actions">
      <!-- Konvertieren Button für hochgeladene Dateien -->
      <button
        v-if="job.status === 'uploaded'"
        class="btn-convert"
        :disabled="isConverting"
        @click="handleStartConversion"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ isConverting ? 'Wird gestartet...' : 'Konvertieren' }}
      </button>

      <button
        v-if="job.status === 'completed'"
        class="btn-download"
        @click="handleDownload"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Herunterladen
      </button>

      <button
        class="btn-remove"
        @click="handleRemove"
      >
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Entfernen
      </button>
    </div>
  </div>
</template>

<style scoped>
.conversion-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 16px;
  margin-bottom: 12px;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.status {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.status-uploading {
  color: var(--color-secondary);
}

.status-uploaded {
  color: var(--color-primary);
}

.status-pending {
  color: var(--color-secondary);
}

.status-processing {
  color: var(--color-primary);
}

.status-completed {
  color: var(--color-success);
}

.status-error {
  color: var(--color-error);
}

.progress-bar {
  height: 6px;
  background: var(--color-border-light);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

/* Format-Auswahl Styles */
.format-selection {
  background: var(--color-surface-hover);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.selector-row {
  margin-bottom: 10px;
}

.selector-row:last-child {
  margin-bottom: 0;
}

.selector-row label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.format-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.format-buttons button {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.format-buttons button:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.format-buttons button.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.error-text {
  color: var(--color-error);
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--color-error-bg);
  border-radius: 4px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-convert {
  background: var(--color-success);
  color: white;
}

.btn-convert:hover:not(:disabled) {
  background: #059669;
}

.btn-download {
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.btn-download:hover {
  background: var(--color-primary-hover);
}

.btn-remove {
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-remove:hover {
  background: var(--color-border-light);
}

/* Responsive */
@media (max-width: 768px) {
  .item-header {
    flex-direction: column;
    gap: 8px;
  }

  .status {
    font-size: 13px;
  }

  .item-actions {
    flex-wrap: wrap;
  }

  .item-actions button {
    flex: 1;
    min-width: 0;
    justify-content: center;
    padding: 10px 12px;
  }

  .format-buttons button {
    padding: 8px 10px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .conversion-item {
    padding: 12px;
  }

  .file-name {
    font-size: 14px;
  }

  .file-meta {
    font-size: 12px;
  }

  .item-actions {
    flex-direction: column;
  }

  .item-actions button {
    width: 100%;
    padding: 12px;
    font-size: 14px;
  }

  .format-selection {
    padding: 10px;
  }

  .format-buttons {
    gap: 4px;
  }

  .format-buttons button {
    padding: 6px 8px;
    font-size: 11px;
  }

  .error-text {
    font-size: 12px;
  }
}
</style>
