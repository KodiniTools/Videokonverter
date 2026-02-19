<script setup lang="ts">
import { useConversionStore } from '@/stores/conversion';
import { useWebSocket } from '@/composables/useWebSocket';
import { useI18n } from '@/composables/useI18n';
import { RouterLink } from 'vue-router';
import FileUploader from '@/components/FileUploader.vue';
import ConversionQueue from '@/components/ConversionQueue.vue';

const conversionStore = useConversionStore();
const { t } = useI18n();

// WebSocket für Progress Updates
const { connected } = useWebSocket((update) => {
  conversionStore.handleProgressUpdate(update);
});
</script>

<template>
  <div class="converter-page">
    <main class="main">
      <RouterLink to="/" class="home-link" :title="t('backToHome')">
        <svg class="home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span class="home-link-text">{{ t('backToHome') }}</span>
        <svg class="home-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </RouterLink>
      <div class="connection-status" :class="{ connected }">
        <span class="status-dot"></span>
        {{ connected ? t('connected') : t('disconnected') }}
      </div>
      <FileUploader />
      <ConversionQueue />
    </main>
  </div>
</template>

<style scoped>
.converter-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.home-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  margin-bottom: 16px;
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.home-link:hover {
  color: var(--color-primary);
  background: var(--color-surface);
}

.home-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.home-arrow {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.home-link:hover .home-arrow {
  transform: translateX(-3px);
}

.home-link-text {
  line-height: 1;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 24px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-error);
}

.connection-status.connected .status-dot {
  background: var(--color-success);
}

.main {
  flex: 1;
  padding: 48px 32px;
}

/* Responsive */
@media (max-width: 768px) {
  .main {
    padding: 32px 20px;
  }

}

@media (max-width: 480px) {
  .main {
    padding: 24px 16px;
  }

  .connection-status {
    font-size: 12px;
    margin-bottom: 16px;
  }
}
</style>
