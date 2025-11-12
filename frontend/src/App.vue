<script setup lang="ts">
import { useConversionStore } from '@/stores/conversion';
import { useWebSocket } from '@/composables/useWebSocket';
import FileUploader from '@/components/FileUploader.vue';
import FormatSelector from '@/components/FormatSelector.vue';
import ConversionQueue from '@/components/ConversionQueue.vue';

const conversionStore = useConversionStore();

// WebSocket für Progress Updates
const { connected } = useWebSocket((update) => {
  conversionStore.handleProgressUpdate(update);
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Video Converter</h1>
      <div class="connection-status" :class="{ connected }">
        <span class="status-dot"></span>
        {{ connected ? 'Connected' : 'Disconnected' }}
      </div>
    </header>

    <main class="main">
      <FormatSelector />
      <FileUploader />
      <ConversionQueue />
    </main>

    <footer class="footer">
      <p>Server-based video conversion with FFmpeg · Max file size: 50GB</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f8fafc;
  color: #1e293b;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.connection-status.connected .status-dot {
  background: #10b981;
}

.main {
  flex: 1;
  padding: 48px 32px;
}

.footer {
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 32px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
}
</style>
