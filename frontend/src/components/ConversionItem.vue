<script setup lang="ts">
import { computed } from 'vue';
import type { ConversionJob } from '@/types/conversion';
import { useConversionStore } from '@/stores/conversion';

const props = defineProps<{
  job: ConversionJob;
}>();

const conversionStore = useConversionStore();

const statusText = computed(() => {
  switch (props.job.status) {
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
        <div class="file-name">{{ job.fileName }}</div>
        <div class="file-meta">
          {{ fileSizeMB }} · {{ job.sourceFormat.toLowerCase() }} → {{ job.targetFormat.toLowerCase() }}
        </div>
      </div>

      <div class="status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <div v-if="job.status === 'processing'" class="progress-bar">
      <div class="progress-fill" :style="{ width: `${job.progress}%` }"></div>
    </div>

    <div v-if="job.error" class="error-text">
      {{ job.error }}
    </div>

    <div class="item-actions">
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

.status-pending {
  color: var(--color-text-muted);
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

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-download {
  background: var(--color-primary);
  color: var(--color-text);
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
</style>
