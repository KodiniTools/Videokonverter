<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';
import { useConversionStore } from '@/stores/conversion';
import { useWebSocket } from '@/composables/useWebSocket';
import FileUploader from '@/components/FileUploader.vue';
import ConversionQueue from '@/components/ConversionQueue.vue';

const conversionStore = useConversionStore();
const themeStore = useThemeStore();

// WebSocket für Progress Updates
const { connected } = useWebSocket((update) => {
  conversionStore.handleProgressUpdate(update);
});
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Video Converter</h1>
      <div class="header-controls">
        <button class="theme-toggle" @click="themeStore.toggleTheme" :title="themeStore.theme === 'light' ? 'Zum Dunkelmodus wechseln' : 'Zum Hellmodus wechseln'">
          <svg v-if="themeStore.theme === 'light'" class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="5" stroke-width="2"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="connection-status" :class="{ connected }">
          <span class="status-dot"></span>
          {{ connected ? 'Verbunden' : 'Getrennt' }}
        </div>
      </div>
    </header>

    <main class="main">
      <FileUploader />
      <ConversionQueue />
    </main>

    <footer class="footer">
      <p>Serverbasierte Videokonvertierung mit FFmpeg · Max. Dateigröße: 50 GB</p>
    </footer>
  </div>
</template>

<style>
:root {
  /* Light Theme Colors */
  --color-primary: #F2E28E;
  --color-primary-hover: #e6d67a;
  --color-secondary: #A28680;
  --color-secondary-hover: #8f746e;
  --color-text: #0C0C10;
  --color-text-secondary: #5E5F69;
  --color-text-muted: #AEAFB7;
  --color-background: #f5f5f7;
  --color-surface: #ffffff;
  --color-surface-hover: #faf9f5;
  --color-border: #AEAFB7;
  --color-border-light: #d4d4d8;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-error-bg: #fee2e2;
  --color-error-border: #fecaca;
}

[data-theme="dark"] {
  --color-primary: #F2E28E;
  --color-primary-hover: #fff4a3;
  --color-secondary: #A28680;
  --color-secondary-hover: #b89d96;
  --color-text: #AEAFB7;
  --color-text-secondary: #8a8b94;
  --color-text-muted: #5E5F69;
  --color-background: #0C0C10;
  --color-surface: #1a1a1f;
  --color-surface-hover: #252529;
  --color-border: #5E5F69;
  --color-border-light: #3a3a40;
  --color-success: #34d399;
  --color-error: #f87171;
  --color-error-bg: #450a0a;
  --color-error-border: #7f1d1d;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--color-background);
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.theme-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text);
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
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
</style>
