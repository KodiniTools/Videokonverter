(function () {
  'use strict';

  function getInitialTheme() {
    var stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Apply immediately
  applyTheme(getInitialTheme());

  // Listen for theme changes from the SSI global navigation
  window.addEventListener('theme-changed', function (e) {
    var newTheme = e.detail && e.detail.theme;
    if (newTheme === 'light' || newTheme === 'dark') {
      applyTheme(newTheme);
    }
  });

  // Watch for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!localStorage.getItem('theme')) {
      var theme = e.matches ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      applyTheme(theme);
    }
  });
})();
