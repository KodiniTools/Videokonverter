<script setup lang="ts">
import { computed } from 'vue';
import { useConversionStore } from '@/stores/conversion';
import { useI18n } from '@/composables/useI18n';
import type { VideoFormat, VideoQuality } from '@/types/conversion';

const conversionStore = useConversionStore();
const { t } = useI18n();

const formats: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4 (H.264)' },
  { value: 'webm', label: 'WebM (VP9)' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV (QuickTime)' },
  { value: 'mkv', label: 'MKV (Matroska)' },
  { value: 'ts', label: 'TS (MPEG-TS)' }
];

const qualities = computed(() => [
  { value: 'low' as VideoQuality, label: t('qualityLow'), bitrate: '~500 kbps' },
  { value: 'medium' as VideoQuality, label: t('qualityMedium'), bitrate: '~1 Mbps' },
  { value: 'high' as VideoQuality, label: t('qualityHigh'), bitrate: '~2,5 Mbps' },
  { value: 'ultra' as VideoQuality, label: t('qualityUltra'), bitrate: '~5 Mbps' }
]);

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
      <label>{{ t('outputFormat') }}</label>
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
      <label>{{ t('quality') }}</label>
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
}

button:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

button.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.quality-label {
  font-weight: 600;
}

.quality-bitrate {
  font-size: 11px;
  opacity: 0.8;
}

/* Responsive */
@media (max-width: 768px) {
  .format-selector {
    margin-bottom: 24px;
  }

  .selector-group {
    margin-bottom: 20px;
  }

  button {
    min-width: 80px;
    padding: 10px 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .button-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  button {
    min-width: 0;
    padding: 10px 8px;
    font-size: 12px;
  }

  .quality-bitrate {
    font-size: 10px;
  }

  label {
    font-size: 13px;
    margin-bottom: 8px;
  }
}
</style>
