import { defineStore } from 'pinia';
import { ref } from 'vue';

export type Theme = 'light' | 'dark';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>(getInitialTheme());

  function getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(newTheme: Theme) {
    theme.value = newTheme;
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }

  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
  }

  // Apply theme on initialization
  applyTheme(theme.value);

  // Listen for theme changes from the SSI global navigation
  window.addEventListener('theme-changed', ((e: CustomEvent) => {
    const newTheme = e.detail?.theme;
    if (newTheme === 'light' || newTheme === 'dark') {
      theme.value = newTheme;
      applyTheme(newTheme);
    }
  }) as EventListener);

  // Watch for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });

  return {
    theme,
    setTheme,
    toggleTheme
  };
});
