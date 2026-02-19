import { ref, computed } from 'vue';

export type Locale = 'de' | 'en';

const translations = {
  de: {
    // Hero Section
    heroTitle: 'Video Converter',
    heroSubtitle: 'Konvertieren Sie Ihre Videos schnell und einfach in verschiedene Formate - direkt im Browser, kostenlos und ohne Installation.',
    heroCta: 'Jetzt starten',

    // Feature Cards
    feature1Title: 'Blitzschnelle Konvertierung',
    feature1Description: 'Unsere serverbasierte FFmpeg-Technologie konvertiert Videos in Rekordzeit. Unterstützt Dateien bis zu 5 GB mit Echtzeit-Fortschrittsanzeige.',

    feature2Title: 'Vielfältige Formate',
    feature2Description: 'Konvertieren Sie zwischen allen gängigen Formaten: MP4, WebM, AVI, MOV, MKV, FLV, WMV und TS. Vier Qualitätsstufen zur Auswahl.',

    feature3Title: 'Einfach & Sicher',
    feature3Description: 'Drag & Drop-Upload, intuitive Bedienung und automatische Löschung nach 2 Stunden. Keine Anmeldung erforderlich.',

    // Theme
    switchToLight: 'Zum Hellmodus wechseln',
    switchToDark: 'Zum Dunkelmodus wechseln',

    // Language
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',

    // Converter Page
    backToHome: 'Zur Startseite',
    connected: 'Verbunden',
    disconnected: 'Getrennt',

    // File Uploader
    notVideoFile: 'Keine Videodatei',
    uploadFailed: 'Hochladen fehlgeschlagen',
    uploadingText: 'Wird hochgeladen...',
    dropFilesHere: 'Videodateien hier ablegen',
    orClickToBrowse: 'oder klicken zum Durchsuchen',
    supportedFormats: 'Unterstützt: MP4, WebM, AVI, MOV, MKV, FLV, WMV, TS (Max: 5 GB)',

    // Conversion Status
    statusUploading: 'Hochladen...',
    statusUploaded: 'Bereit zur Konvertierung',
    statusPending: 'Warten...',
    statusProcessing: 'Konvertierung...',
    statusCompleted: 'Fertig',
    statusError: 'Fehler',

    // Conversion Item Labels
    formatLabel: 'Format:',
    qualityLabel: 'Qualität:',
    startingConversion: 'Wird gestartet...',
    convert: 'Konvertieren',
    download: 'Herunterladen',
    remove: 'Entfernen',

    // Quality Levels
    qualityLow: 'Niedrig',
    qualityMedium: 'Mittel',
    qualityHigh: 'Hoch',
    qualityUltra: 'Ultra',

    // Conversion Queue
    conversionQueue: 'Konvertierungswarteschlange',

    // Format Selector
    outputFormat: 'Ausgabeformat',
    quality: 'Qualität',

    // Store Errors
    fileTooLarge: 'Datei zu groß. Max: 5 GB',
    uploadFailedError: 'Upload fehlgeschlagen',
    uploadError: 'Upload-Fehler',
    uploadAborted: 'Upload abgebrochen',
    jobNotFound: 'Job nicht gefunden oder nicht bereit',
    conversionFailed: 'Konvertierung fehlgeschlagen',
  },
  en: {
    // Hero Section
    heroTitle: 'Video Converter',
    heroSubtitle: 'Convert your videos quickly and easily to various formats - directly in your browser, free and without installation.',
    heroCta: 'Get Started',

    // Feature Cards
    feature1Title: 'Lightning-Fast Conversion',
    feature1Description: 'Our server-based FFmpeg technology converts videos in record time. Supports files up to 5 GB with real-time progress tracking.',

    feature2Title: 'Multiple Formats',
    feature2Description: 'Convert between all common formats: MP4, WebM, AVI, MOV, MKV, FLV, WMV and TS. Four quality levels to choose from.',

    feature3Title: 'Simple & Secure',
    feature3Description: 'Drag & drop upload, intuitive interface and automatic deletion after 2 hours. No registration required.',

    // Theme
    switchToLight: 'Switch to light mode',
    switchToDark: 'Switch to dark mode',

    // Language
    language: 'Language',
    german: 'German',
    english: 'English',

    // Converter Page
    backToHome: 'Back to Home',
    connected: 'Connected',
    disconnected: 'Disconnected',

    // File Uploader
    notVideoFile: 'Not a video file',
    uploadFailed: 'Upload failed',
    uploadingText: 'Uploading...',
    dropFilesHere: 'Drop video files here',
    orClickToBrowse: 'or click to browse',
    supportedFormats: 'Supported: MP4, WebM, AVI, MOV, MKV, FLV, WMV, TS (Max: 5 GB)',

    // Conversion Status
    statusUploading: 'Uploading...',
    statusUploaded: 'Ready to convert',
    statusPending: 'Waiting...',
    statusProcessing: 'Converting...',
    statusCompleted: 'Completed',
    statusError: 'Error',

    // Conversion Item Labels
    formatLabel: 'Format:',
    qualityLabel: 'Quality:',
    startingConversion: 'Starting...',
    convert: 'Convert',
    download: 'Download',
    remove: 'Remove',

    // Quality Levels
    qualityLow: 'Low',
    qualityMedium: 'Medium',
    qualityHigh: 'High',
    qualityUltra: 'Ultra',

    // Conversion Queue
    conversionQueue: 'Conversion Queue',

    // Format Selector
    outputFormat: 'Output Format',
    quality: 'Quality',

    // Store Errors
    fileTooLarge: 'File too large. Max: 5 GB',
    uploadFailedError: 'Upload failed',
    uploadError: 'Upload error',
    uploadAborted: 'Upload aborted',
    jobNotFound: 'Job not found or not ready',
    conversionFailed: 'Conversion failed',
  }
};

const currentLocale = ref<Locale>((localStorage.getItem('locale') as Locale) || 'de');

// Listen for language changes from the SSI global navigation
window.addEventListener('language-changed', ((e: CustomEvent) => {
  const lang = e.detail?.lang;
  if (lang === 'de' || lang === 'en') {
    currentLocale.value = lang;
    localStorage.setItem('locale', lang);
    document.documentElement.lang = lang;
  }
}) as EventListener);

export function useI18n() {
  const locale = computed(() => currentLocale.value);

  const t = (key: keyof typeof translations.de): string => {
    return translations[currentLocale.value][key] || key;
  };

  const setLocale = (newLocale: Locale) => {
    currentLocale.value = newLocale;
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
  };

  const toggleLocale = () => {
    setLocale(currentLocale.value === 'de' ? 'en' : 'de');
  };

  return {
    locale,
    t,
    setLocale,
    toggleLocale,
  };
}
