#!/usr/bin/env node
/**
 * Erzeugt die englischen Sprachfassungen frontend/index.en.html und
 * frontend/converter.en.html aus den deutschen Seiten.
 *
 * Das Frontend hat keinen Build-Schritt. Damit Crawler ohne JavaScript unter
 * ?lang=en schon im HTML Englisch sehen (englischer Titel, Description, Canonical,
 * <html lang="en">), liegen die englischen Fassungen als eigene Dateien im Repo;
 * nginx liefert sie für ?lang=en aus. Titel und Beschreibung kommen aus
 * frontend/js/i18n.js (einzige Quelle), der Rest der Seite bleibt unverändert.
 *
 * Aufruf nach Änderungen an index.html, converter.html oder den meta*-Texten:
 *   npm run build:en
 * Ein Test (frontend/tests/enPages.test.mjs) schlägt fehl, wenn die Dateien veraltet sind.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { localizeHtml } from './localizeHtml.mjs';

const FRONTEND = new URL('../frontend/', import.meta.url);
const SITE_URL = 'https://kodinitools.com/videokonverter/';

/** Seiten mit ihrer deutschen URL und den Schlüsseln in js/i18n.js. */
export const PAGES = [
  { file: 'index.html', url: SITE_URL, title: 'metaTitle', description: 'metaDescription' },
  {
    file: 'converter.html',
    url: `${SITE_URL}app/`,
    title: 'metaTitleConverter',
    description: 'metaDescriptionConverter',
  },
];

/** `index.html` -> `index.en.html` */
export const enFileName = (file) => file.replace(/\.html$/, '.en.html');

const read = (relative) => readFileSync(new URL(relative, FRONTEND), 'utf8');

/**
 * Liest einen Text aus dem Sprachblock von js/i18n.js (`en: { key: '…' }`).
 * @param {string} source Inhalt von js/i18n.js
 * @param {'de' | 'en'} locale
 * @param {string} key
 * @returns {string}
 */
export function readTranslation(source, locale, key) {
  const start = source.search(new RegExp(`\\n\\s*${locale}:\\s*\\{`));
  if (start < 0) throw new Error(`build-en-pages: Sprachblock ${locale} fehlt in js/i18n.js`);
  const match = source.slice(start).match(new RegExp(`\\n\\s*${key}:\\s*('(?:[^'\\\\]|\\\\.)*')`));
  if (!match) throw new Error(`build-en-pages: ${locale}.${key} fehlt in js/i18n.js`);
  // Das Literal stammt aus der eigenen Quelldatei; so werden – usw. aufgelöst.
  return new Function(`return ${match[1]}`)();
}

/**
 * Englische Fassung einer Seite.
 * @param {(typeof PAGES)[number]} page
 * @returns {string}
 */
export function buildEnPage(page) {
  const i18n = read('js/i18n.js');
  return localizeHtml(read(page.file), {
    lang: 'en',
    title: readTranslation(i18n, 'en', page.title),
    description: readTranslation(i18n, 'en', page.description),
    canonical: `${page.url}?lang=en`,
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const page of PAGES) {
    const target = enFileName(page.file);
    const english = buildEnPage(page);
    writeFileSync(new URL(target, FRONTEND), english);
    if (page.file === 'converter.html') {
      writeFileSync(new URL('app/index.html', FRONTEND), read(page.file));
      writeFileSync(new URL('app/index.en.html', FRONTEND), english);
    }
    console.log(`frontend/${target} geschrieben`);
  }
}
