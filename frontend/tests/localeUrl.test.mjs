/**
 * Englische Fassung unter ?lang=en: js/i18n.js liest den Parameter vor der
 * gespeicherten Sprache, speichert ihn für die SSI-Navigation und setzt
 * Canonical/og:url je Sprache. hreflang steht statisch im HTML.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readFrontend } from './tokenTestUtils.mjs';

const i18nJs = readFrontend('js/i18n.js');
const PAGES = {
  'index.html': 'https://kodinitools.com/videokonverter/',
  'converter.html': 'https://kodinitools.com/videokonverter/converter.html',
};

/** Minimaler Browser-Kontext: nur was i18n.js anfasst. */
function runI18n({ search = '', stored = null, pathname = '/videokonverter/' } = {}) {
  const el = (attrs = {}) => ({
    attrs,
    getAttribute: (k) => attrs[k] ?? null,
    setAttribute: (k, v) => (attrs[k] = String(v)),
  });
  const head = {
    'link[rel="canonical"]': el({ href: PAGES['index.html'] }),
    'meta[property="og:url"]': el({ content: PAGES['index.html'] }),
  };
  const storage = new Map(stored ? [['locale', stored]] : []);
  const document = {
    title: '',
    documentElement: { lang: 'de' },
    querySelector: (sel) => head[sel] ?? null,
    querySelectorAll: () => [],
  };
  const context = {
    document,
    location: { search, pathname },
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
    },
    URLSearchParams,
    CustomEvent: class {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
    window: { addEventListener() {}, dispatchEvent() {} },
  };
  runInNewContext(i18nJs, context);
  return { document, head, storage, AppI18n: context.window.AppI18n };
}

describe('Sprach-URL ?lang', () => {
  it('?lang=en hat Vorrang, wird gespeichert und setzt Canonical/og:url', () => {
    const { document, head, storage, AppI18n } = runI18n({ search: '?lang=en', stored: 'de' });
    assert.equal(AppI18n.getLocale(), 'en');
    assert.equal(storage.get('locale'), 'en');
    assert.equal(document.documentElement.lang, 'en');
    assert.match(document.title, /^Free Online Video Converter/);
    assert.equal(head['link[rel="canonical"]'].attrs.href, `${PAGES['index.html']}?lang=en`);
    assert.equal(head['meta[property="og:url"]'].attrs.content, `${PAGES['index.html']}?lang=en`);
  });

  it('ohne Parameter: gespeicherte Sprache, sonst Deutsch mit Canonical ohne Parameter', () => {
    assert.equal(runI18n({ stored: 'en' }).AppI18n.getLocale(), 'en');
    const { AppI18n, head } = runI18n({ search: '?lang=fr' });
    assert.equal(AppI18n.getLocale(), 'de');
    assert.equal(head['link[rel="canonical"]'].attrs.href, PAGES['index.html']);
  });

  it('Sprachwechsel setzt das Canonical um', () => {
    const { AppI18n, head } = runI18n();
    AppI18n.setLocale('en');
    assert.equal(head['link[rel="canonical"]'].attrs.href, `${PAGES['index.html']}?lang=en`);
    AppI18n.setLocale('de');
    assert.equal(head['link[rel="canonical"]'].attrs.href, PAGES['index.html']);
  });
});

describe('hreflang im HTML', () => {
  for (const [file, url] of Object.entries(PAGES)) {
    it(`${file}: de, en (?lang=en) und x-default ohne Dubletten`, () => {
      const html = readFrontend(file);
      const links = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)];
      assert.deepEqual(
        links.map((m) => [m[1], m[2]]),
        [
          ['de', url],
          ['en', `${url}?lang=en`],
          ['x-default', url],
        ]
      );
    });
  }
});
