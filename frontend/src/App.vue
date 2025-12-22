<script setup lang="ts">
import { useThemeStore } from '@/stores/theme';

// Initialize theme store to apply saved theme on app load
useThemeStore();
</script>

<template>
  <router-view />
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
</style>
