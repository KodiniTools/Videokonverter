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
    case 'pending': return 'Waiting...';
    case 'processing': return `Converting... ${props.job.progress}%`;
    case 'completed': return 'Done';
    case 'error': return 'Error';
    default: return '';
  }
});

const statusColor = computed(() => {
  switch (props.job.status) {
    case 'pending': return '#94a3b8';
    case 'processing': return '#3b82f6';
    case 'completed': return '#10b981';
    case 'error': return '#ef4444';
    default: return '#64748b';
  }
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
          {{ fileSizeMB }} · {{ job.sourceFormat.toUpperCase() }} → {{ job.targetFormat.toUpperCase() }}
        </div>
      </div>
      
      <div class="status" :style="{ color: statusColor }">
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
        Download
      </button>
      
      <button
        class="btn-remove"
        @click="handleRemove"
      >
        Remove
      </button>
    </div>
  </div>
</template>

<style scoped>
.conversion-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
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
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.status {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

.progress-bar {
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-bottom: 12px;
  padding: 8px;
  background: #fee2e2;
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
}

.btn-download {
  background: #3b82f6;
  color: white;
}

.btn-download:hover {
  background: #2563eb;
}

.btn-remove {
  background: #f1f5f9;
  color: #64748b;
}

.btn-remove:hover {
  background: #e2e8f0;
}
</style>
