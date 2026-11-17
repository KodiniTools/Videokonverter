/**
 * Englische Sprachfassungen (index.en.html, converter.en.html): nginx liefert sie
 * für ?lang=en aus, damit Crawler ohne JavaScript schon im HTML Englisch sehen.
 * Die Dateien werden mit `npm run build:en` aus den deutschen Seiten erzeugt und
 * dürfen nicht von Hand geändert werden; dieser Test hält sie aktuell.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFrontend } from './tokenTestUtils.mjs';
import { PAGES, buildEnPage, enFileName, readTranslation } from '../../scripts/build-en-pages.mjs';
import { escapeHtml, localizeHtml } from '../../scripts/localizeHtml.mjs';

const i18nJs = readFrontend('js/i18n.js');
const unescape = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const pick = (source, pattern) => unescape(source.match(pattern)?.[1] ?? '');
const headOf = (source) => source.slice(0, source.search(/<\/head>/i));
const title = (source) => pick(headOf(source), /<title[^>]*>([\s\S]*?)<\/title>/i);
const lang = (source) => pick(source, /<html\b[^>]*\slang="([^"]*)"/i);
const meta = (source, name) =>
  pick(
    headOf(source).match(
      new RegExp(`<meta\\b[^>]*\\s(?:name|property)="${name}"[^>]*>`, 'i')
    )?.[0] ?? '',
    /\scontent="([^"]*)"/i
  );
const canonical = (source) =>
  pick(
    headOf(source).match(/<link\b[^>]*\srel="canonical"[^>]*>/i)?.[0] ?? '',
    /\shref="([^"]*)"/i
  );
const hreflangs = (source) => headOf(source).match(/<link\b[^>]*\shreflang="[^"]*"[^>]*>/gi) ?? [];
const includes = (source) => source.match(/<!--\s*#include [^>]*-->/g) ?? [];

for (const page of PAGES) {
  const enFile = enFileName(page.file);
  const de = readFrontend(page.file);
  const en = readFrontend(enFile);
  const enUrl = `${page.url}?lang=en`;

  describe(enFile, () => {
    it('ist aktuell (sonst: npm run build:en)', () => {
      assert.equal(en, buildEnPage(page));
    });

    it('hat lang, Titel, Description und Canonical auf Englisch', () => {
      assert.equal(lang(en), 'en');
      assert.equal(title(en), readTranslation(i18nJs, 'en', page.title));
      assert.equal(meta(en, 'description'), readTranslation(i18nJs, 'en', page.description));
      assert.equal(canonical(en), enUrl);
      assert.equal(meta(en, 'og:url'), enUrl);
      assert.equal(meta(en, 'og:locale'), 'en_US');
      assert.equal(meta(en, 'og:title'), title(en));
    });

    it('lässt hreflang, Body und SSI-Includes unverändert', () => {
      assert.equal(hreflangs(de).length, 3);
      assert.deepEqual(hreflangs(en), hreflangs(de));
      assert.equal(en.slice(en.search(/<\/head>/i)), de.slice(de.search(/<\/head>/i)));
      assert.deepEqual(includes(en), includes(de));
    });

    it('der deutsche Head der Quelldatei stimmt mit js/i18n.js überein', () => {
      assert.equal(lang(de), 'de');
      assert.equal(title(de), readTranslation(i18nJs, 'de', page.title));
      assert.equal(meta(de, 'description'), readTranslation(i18nJs, 'de', page.description));
      assert.equal(canonical(de), page.url);
    });
  });
}

describe('localizeHtml Randfälle', () => {
  const url = PAGES[0].url;
  const minimal = (extra = '') =>
    `<!doctype html><html lang="de"><head><title>T</title>` +
    `<meta name="description" content="D"><link rel="canonical" href="${url}">${extra}` +
    `</head><body><svg><title>Icon</title></svg></body></html>`;
  const head = { lang: 'en', title: 'A & "B" <C>', description: 'x > y & z', canonical: url };

  it('maskiert Sonderzeichen, <title> im Body bleibt unberührt', () => {
    const out = localizeHtml(minimal(), head);
    assert.ok(out.includes('<title>A &amp; &quot;B&quot; &lt;C&gt;</title>'));
    assert.ok(out.includes('content="x &gt; y &amp; z"'));
    assert.ok(out.includes('<svg><title>Icon</title></svg>'));
    assert.equal(escapeHtml('$&'), '$&amp;');
  });

  it('bricht bei fehlendem oder doppeltem Pflicht-Tag ab', () => {
    assert.throws(() => localizeHtml(minimal().replace(/<link[^>]*>/, ''), head), /canonical/);
    assert.throws(
      () => localizeHtml(minimal('<meta name="description" content="E">'), head),
      /description/
    );
    assert.throws(() => localizeHtml('<html lang="de"><title>x</title>', head), /head/);
  });
});
