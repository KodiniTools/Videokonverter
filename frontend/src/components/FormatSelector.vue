<script setup lang="ts">
import { useConversionStore } from '@/stores/conversion';
import type { VideoFormat, VideoQuality } from '@/types/conversion';

const conversionStore = useConversionStore();

const formats: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'mp4 (h.264)' },
  { value: 'webm', label: 'webm (vp9)' },
  { value: 'avi', label: 'avi' },
  { value: 'mov', label: 'mov (quicktime)' },
  { value: 'mkv', label: 'mkv (matroska)' },
  { value: 'ts', label: 'ts (mpeg-ts)' }
];

const qualities: { value: VideoQuality; label: string; bitrate: string }[] = [
  { value: 'low', label: 'low', bitrate: '~500 kbps' },
  { value: 'medium', label: 'medium', bitrate: '~1 mbps' },
  { value: 'high', label: 'high', bitrate: '~2.5 mbps' },
  { value: 'ultra', label: 'ultra', bitrate: '~5 mbps' }
];

function updateFormat(format: VideoFormat) {
  conversionStore.setSettings({ targetFormat: format });
}

function updateQuality(quality: VideoQuality) {
  conversionStore.setSettings({ quality });
}
</script>

<template>
  <div class="format-selector">
    <div class="selector-group">
      <label>output format</label>
      <div class="button-group">
        <button
          v-for="format in formats"
          :key="format.value"
          :class="{ active: conversionStore.settings.targetFormat === format.value }"
          @click="updateFormat(format.value)"
        >
          {{ format.label }}
        </button>
      </div>
    </div>

    <div class="selector-group">
      <label>quality</label>
      <div class="button-group">
        <button
          v-for="quality in qualities"
          :key="quality.value"
          :class="{ active: conversionStore.settings.quality === quality.value }"
          @click="updateQuality(quality.value)"
        >
          <span class="quality-label">{{ quality.label }}</span>
          <span class="quality-bitrate">{{ quality.bitrate }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.format-selector {
  width: 100%;
  max-width: 600px;
  margin: 0 auto 32px;
}

.selector-group {
  margin-bottom: 24px;
}

label {
  display: block;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: lowercase;
}

.button-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  flex: 1;
  min-width: 100px;
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-transform: lowercase;
}

button:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

button.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text);
}

.quality-label {
  font-weight: 600;
}

.quality-bitrate {
  font-size: 11px;
  opacity: 0.8;
}
</style>
