/*
 * Theme-Mechanik (übernommen aus dem Collage Maker, src/stores/settings.ts):
 * - html[data-theme="light" | "dark"] schaltet die Design-Tokens (--ds-*) und
 *   die globale SSI-Navigation,
 * - body.light-theme hält Parität zum Playlist Generator,
 * - html.dark bleibt als Altbestand für externe Skripte erhalten.
 * Standard ist Light. Ein Inline-Skript im <head> setzt data-theme schon vor
 * dem ersten Paint aus localStorage.theme; diese Datei übernimmt danach.
 */
(function () {
  'use strict';

  var ignoreMutation = false;
  var currentTheme = null;

  function normalizeTheme(value) {
    return value === 'dark' ? 'dark' : 'light';
  }

  function readStoredTheme() {
    try {
      return normalizeTheme(localStorage.getItem('theme'));
    } catch (e) {
      return 'light';
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      /* Speicher gesperrt (privater Modus): Theme gilt nur für diese Seite */
    }
  }

  function applyTheme(theme) {
    var next = normalizeTheme(theme);
    currentTheme = next;
    storeTheme(next);

    // MutationObserver unterdrücken, solange wir das Attribut selbst setzen
    ignoreMutation = true;
    var root = document.documentElement;
    root.classList.toggle('dark', next === 'dark');
    root.setAttribute('data-theme', next);
    if (document.body) {
      document.body.classList.toggle('light-theme', next === 'light');
    }
    ignoreMutation = false;

    // Theme-Icons der SSI-Navigation synchron halten (Mond/Sonne)
    var icons = document.querySelectorAll('.global-nav-theme-icon');
    for (var i = 0; i < icons.length; i++) {
      icons[i].textContent = next === 'light' ? '🌙' : '☀️';
    }
  }

  function toggleTheme() {
    applyTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  // Sofort anwenden
  applyTheme(readStoredTheme());

  // Theme-Wechsel aus der globalen SSI-Navigation (Event)
  window.addEventListener('theme-changed', function (e) {
    var newTheme = e.detail && e.detail.theme;
    if (newTheme === 'light' || newTheme === 'dark') {
      applyTheme(newTheme);
    }
  });

  // Theme-Wechsel aus der SSI-Navigation, die data-theme direkt setzt
  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function (mutations) {
      if (ignoreMutation) return;
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          var newTheme = document.documentElement.getAttribute('data-theme');
          if ((newTheme === 'light' || newTheme === 'dark') && newTheme !== currentTheme) {
            applyTheme(newTheme);
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  window.AppTheme = {
    getTheme: function () { return currentTheme; },
    setTheme: applyTheme,
    toggleTheme: toggleTheme
  };
})();
