<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';
import { useConversionStore } from '@/stores/conversion';
import { useWebSocket } from '@/composables/useWebSocket';
import { useI18n } from '@/composables/useI18n';
import { RouterLink } from 'vue-router';
import FileUploader from '@/components/FileUploader.vue';
import ConversionQueue from '@/components/ConversionQueue.vue';

const conversionStore = useConversionStore();
const themeStore = useThemeStore();
const { t, locale, toggleLocale } = useI18n();

// WebSocket für Progress Updates
const { connected } = useWebSocket((update) => {
  conversionStore.handleProgressUpdate(update);
});
</script>

<template>
  <div class="converter-page">
    <header class="header">
      <div class="header-left">
        <RouterLink to="/" class="home-link" title="Zur Startseite">
          <svg class="home-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
            <polyline points="9 22 9 12 15 12 15 22" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </RouterLink>
        <h1>Video Converter</h1>
      </div>
      <div class="header-controls">
        <button
          class="lang-toggle"
          @click="toggleLocale"
          :title="locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'"
        >
          {{ locale === 'de' ? 'EN' : 'DE' }}
        </button>
        <button class="theme-toggle" @click="themeStore.toggleTheme" :title="themeStore.theme === 'light' ? t('switchToDark') : t('switchToLight')">
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

<style scoped>
.converter-page {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.home-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  text-decoration: none;
  transition: all 0.2s ease;
}

.home-link:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
}

.home-icon {
  width: 20px;
  height: 20px;
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

.lang-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-toggle:hover {
  border-color: var(--color-primary);
  background: var(--color-surface-hover);
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
