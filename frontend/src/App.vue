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
  /* Dark Theme Colors
     Based on: #091428 (deep navy bg), #0E1C32 (secondary bg),
     #142640 (card bg), #c9984d (gold accent), #014f99 (blue),
     #f8e1a9 (light gold), #f9f2d5 (cream text) */
  --color-primary: #c9984d;
  --color-primary-hover: #f8e1a9;
  --color-secondary: #014f99;
  --color-secondary-hover: #0168c9;
  --color-text: #f9f2d5;
  --color-text-secondary: #f8e1a9;
  --color-text-muted: #7A8DA0;
  --color-background: #091428;
  --color-surface: #142640;
  --color-surface-hover: #1a3050;
  --color-border: #1e3a5a;
  --color-border-light: #162d4a;
  --color-success: #34d399;
  --color-error: #f87171;
  --color-error-bg: #1a0808;
  --color-error-border: #5c1a1a;
  --color-text-on-primary: #091428;
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
  background: linear-gradient(180deg, #0E1C32 0%, #091428 100%);
}
</style>
