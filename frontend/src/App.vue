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
  /* Light Theme Colors
     Based on: #c9984d (gold), #014f99 (blue), #003971 (navy),
     #f8e1a9 (light gold), #f9f2d5 (cream) */
  --color-primary: #014f99;
  --color-primary-hover: #003971;
  --color-secondary: #c9984d;
  --color-secondary-hover: #b58842;
  --color-text: #003971;
  --color-text-secondary: #4a6a8a;
  --color-text-muted: #6b7d92;
  --color-background: #F5F4D6;
  --color-surface: #ffffff;
  --color-surface-hover: #f9f2d5;
  --color-border: #c9984d;
  --color-border-light: #f8e1a9;
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-error-bg: #fee2e2;
  --color-error-border: #fecaca;
  --color-text-on-primary: #F5F4D6;
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
  --color-text-on-primary: #0C0C10;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(180deg, #ffffff 0%, var(--color-background) 100%);
  min-height: 100vh;
  color: var(--color-text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

[data-theme="dark"] body {
  background: var(--color-background);
}
</style>
