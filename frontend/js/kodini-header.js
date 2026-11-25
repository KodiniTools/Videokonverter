(function () {
  'use strict';

  var links = document.querySelectorAll('.video-section-nav a, .landing .hero-cta');

  function updateLinks() {
    var english = window.AppI18n.getLocale() === 'en';
    links.forEach(function (link) {
      var url = new URL(link.href);
      if (english) {
        url.searchParams.set('lang', 'en');
      } else {
        url.searchParams.delete('lang');
      }
      link.href = url.href;
    });
  }

  updateLinks();
  window.addEventListener('i18n-applied', updateLinks);

  // Beim direkten Test des statischen Frontends wird das SSI-Partial nicht eingebunden.
  if (document.querySelector('.global-nav-theme-toggle')) return;

  var button = document.getElementById('video-theme-button');
  var label = document.getElementById('video-theme-label');
  var root = document.documentElement;

  function updateThemeLabel() {
    var dark = root.getAttribute('data-theme') === 'dark';
    var english = window.AppI18n.getLocale() === 'en';
    if (english) {
      label.textContent = dark ? 'Light mode' : 'Dark mode';
    } else {
      label.textContent = dark ? 'Hellmodus' : 'Dunkelmodus';
    }
  }

  button.addEventListener('click', function () {
    window.AppTheme.toggleTheme();
    updateThemeLabel();
  });
  window.addEventListener('i18n-applied', updateThemeLabel);
  new MutationObserver(updateThemeLabel).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
  updateThemeLabel();
  button.hidden = false;
})();
