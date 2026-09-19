(function () {
  'use strict';

  var translations = {
    de: {
      heroTitle: 'Video Converter',
      heroSubtitle: 'Konvertieren Sie Ihre Videos schnell und einfach in verschiedene Formate - direkt im Browser, kostenlos und ohne Installation.',
      heroCta: 'Jetzt starten',
      feature1Title: 'Blitzschnelle Konvertierung',
      feature1Description: 'Unsere serverbasierte FFmpeg-Technologie konvertiert Videos in Rekordzeit. Unterstützt Dateien bis zu 5 GB mit Echtzeit-Fortschrittsanzeige.',
      feature2Title: 'Vielfältige Formate',
      feature2Description: 'Konvertieren Sie zwischen allen gängigen Formaten: MP4, WebM, AVI, MOV, MKV, FLV, WMV und TS. Vier Qualitätsstufen zur Auswahl.',
      feature3Title: 'Einfach & Sicher',
      feature3Description: 'Drag & Drop-Upload, intuitive Bedienung und automatische Löschung nach 2 Stunden. Keine Anmeldung erforderlich.',
      backToHome: 'Zur Startseite',
      connected: 'Verbunden',
      disconnected: 'Getrennt',
      notVideoFile: 'Keine Videodatei',
      uploadFailed: 'Hochladen fehlgeschlagen',
      uploadingText: 'Wird hochgeladen...',
      dropFilesHere: 'Videodateien hier ablegen',
      orClickToBrowse: 'oder klicken zum Durchsuchen',
      supportedFormats: 'Unterstützt: MP4, WebM, AVI, MOV, MKV, FLV, WMV, TS (Max: 5 GB)',
      statusUploading: 'Hochladen...',
      statusUploaded: 'Bereit zur Konvertierung',
      statusPending: 'Warten...',
      statusProcessing: 'Konvertierung...',
      statusCompleted: 'Fertig',
      statusError: 'Fehler',
      formatLabel: 'Format:',
      qualityLabel: 'Qualität:',
      startingConversion: 'Wird gestartet...',
      convert: 'Konvertieren',
      download: 'Herunterladen',
      remove: 'Entfernen',
      qualityLow: 'Niedrig',
      qualityMedium: 'Mittel',
      qualityHigh: 'Hoch',
      qualityUltra: 'Ultra',
      conversionQueue: 'Konvertierungswarteschlange',
      fileTooLarge: 'Datei zu groß. Max: 5 GB',
      uploadFailedError: 'Upload fehlgeschlagen',
      uploadError: 'Upload-Fehler',
      uploadAborted: 'Upload abgebrochen',
      jobNotFound: 'Job nicht gefunden oder nicht bereit',
      conversionFailed: 'Konvertierung fehlgeschlagen',
      downloadError: 'Download fehlgeschlagen',
      videoFileType: 'Videodatei',

      // SEO Meta
      metaTitle: 'Kostenloser Video Converter Online \u2013 MP4, WebM, AVI, MOV, MKV konvertieren',
      metaDescription: 'Videos kostenlos online konvertieren: MP4, WebM, AVI, MOV, MKV, FLV, WMV, TS. Bis zu 5 GB, direkt im Browser, ohne Installation. Schnell, sicher und datenschutzfreundlich.',
      metaTitleConverter: 'Video konvertieren \u2013 Kostenloser Online Video Converter',
      metaDescriptionConverter: 'Video jetzt konvertieren: Datei hochladen, Format und Qualit\u00e4t w\u00e4hlen, fertig. MP4, WebM, AVI, MOV, MKV, TS. Bis zu 5 GB, kostenlos und ohne Anmeldung.'
    },
    en: {
      heroTitle: 'Video Converter',
      heroSubtitle: 'Convert your videos quickly and easily to various formats - directly in your browser, free and without installation.',
      heroCta: 'Get Started',
      feature1Title: 'Lightning-Fast Conversion',
      feature1Description: 'Our server-based FFmpeg technology converts videos in record time. Supports files up to 5 GB with real-time progress tracking.',
      feature2Title: 'Multiple Formats',
      feature2Description: 'Convert between all common formats: MP4, WebM, AVI, MOV, MKV, FLV, WMV and TS. Four quality levels to choose from.',
      feature3Title: 'Simple & Secure',
      feature3Description: 'Drag & drop upload, intuitive interface and automatic deletion after 2 hours. No registration required.',
      backToHome: 'Back to Home',
      connected: 'Connected',
      disconnected: 'Disconnected',
      notVideoFile: 'Not a video file',
      uploadFailed: 'Upload failed',
      uploadingText: 'Uploading...',
      dropFilesHere: 'Drop video files here',
      orClickToBrowse: 'or click to browse',
      supportedFormats: 'Supported: MP4, WebM, AVI, MOV, MKV, FLV, WMV, TS (Max: 5 GB)',
      statusUploading: 'Uploading...',
      statusUploaded: 'Ready to convert',
      statusPending: 'Waiting...',
      statusProcessing: 'Converting...',
      statusCompleted: 'Completed',
      statusError: 'Error',
      formatLabel: 'Format:',
      qualityLabel: 'Quality:',
      startingConversion: 'Starting...',
      convert: 'Convert',
      download: 'Download',
      remove: 'Remove',
      qualityLow: 'Low',
      qualityMedium: 'Medium',
      qualityHigh: 'High',
      qualityUltra: 'Ultra',
      conversionQueue: 'Conversion Queue',
      fileTooLarge: 'File too large. Max: 5 GB',
      uploadFailedError: 'Upload failed',
      uploadError: 'Upload error',
      uploadAborted: 'Upload aborted',
      jobNotFound: 'Job not found or not ready',
      conversionFailed: 'Conversion failed',
      downloadError: 'Download failed',
      videoFileType: 'Video file',

      // SEO Meta
      metaTitle: 'Free Online Video Converter \u2013 Convert MP4, WebM, AVI, MOV, MKV',
      metaDescription: 'Convert videos for free online: MP4, WebM, AVI, MOV, MKV, FLV, WMV, TS. Up to 5 GB, directly in your browser, no installation required. Fast, secure and privacy-friendly.',
      metaTitleConverter: 'Convert Video \u2013 Free Online Video Converter',
      metaDescriptionConverter: 'Convert your video now: upload file, choose format and quality, done. MP4, WebM, AVI, MOV, MKV, TS. Up to 5 GB, free and no registration.'
    }
  };

  var currentLocale = localStorage.getItem('locale') || 'de';
  if (currentLocale !== 'de' && currentLocale !== 'en') {
    currentLocale = 'de';
  }

  function t(key) {
    return (translations[currentLocale] && translations[currentLocale][key]) || key;
  }

  function applyTranslations() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
      var key = elements[i].getAttribute('data-i18n');
      elements[i].textContent = t(key);
    }
    var titleElements = document.querySelectorAll('[data-i18n-title]');
    for (var j = 0; j < titleElements.length; j++) {
      var titleKey = titleElements[j].getAttribute('data-i18n-title');
      titleElements[j].setAttribute('title', t(titleKey));
    }
    document.documentElement.lang = currentLocale;

    // Update <title> and <meta> tags for SEO i18n sync
    var isConverterPage = location.pathname.indexOf('converter') !== -1;
    document.title = t(isConverterPage ? 'metaTitleConverter' : 'metaTitle');

    var descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', t(isConverterPage ? 'metaDescriptionConverter' : 'metaDescription'));
    }

    // Update Open Graph tags if present
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', t('metaTitle'));
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', t('metaDescription'));
    var ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', currentLocale === 'de' ? 'de_DE' : 'en_US');

    // Update Twitter tags if present
    var twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', t('metaTitle'));
    var twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', t('metaDescription'));

    // Notify dynamically rendered UI (e.g. the conversion queue) so it can
    // re-render its texts in the new locale.
    window.dispatchEvent(new CustomEvent('i18n-applied', { detail: { locale: currentLocale } }));
  }

  function setLocale(lang) {
    if (lang === 'de' || lang === 'en') {
      currentLocale = lang;
      localStorage.setItem('locale', lang);
      applyTranslations();
    }
  }

  // Listen for language changes from the SSI global navigation
  window.addEventListener('locale-changed', function (e) {
    var lang = e.detail && e.detail.locale;
    setLocale(lang);
  });

  // Apply on load
  applyTranslations();

  // Expose for converter.js
  window.AppI18n = {
    t: t,
    getLocale: function () { return currentLocale; },
    setLocale: setLocale,
    applyTranslations: applyTranslations
  };
})();
