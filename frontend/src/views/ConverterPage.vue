<script setup lang="ts">
import { useConversionStore } from '@/stores/conversion';
import { useWebSocket } from '@/composables/useWebSocket';
import FileUploader from '@/components/FileUploader.vue';
import ConversionQueue from '@/components/ConversionQueue.vue';

const conversionStore = useConversionStore();

// WebSocket für Progress Updates
const { connected } = useWebSocket((update) => {
  conversionStore.handleProgressUpdate(update);
});
</script>

<template>
  <div class="converter-page">
    <main class="main">
      <div class="connection-status" :class="{ connected }">
        <span class="status-dot"></span>
        {{ connected ? 'Verbunden' : 'Getrennt' }}
      </div>
      <FileUploader />
      <ConversionQueue />
    </main>

    <footer class="footer">
      <p>Serverbasierte Videokonvertierung mit FFmpeg · Max. Dateigröße: 5 GB</p>
    </footer>
  </div>
</template>

<style scoped>
.converter-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 16px 32px;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 13px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* Responsive */
@media (max-width: 768px) {
  .main {
    padding: 32px 20px;
  }

  .footer {
    padding: 14px 20px;
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

  .footer {
    padding: 12px 16px;
    font-size: 12px;
  }
}
</style>
