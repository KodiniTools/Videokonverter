/**
 * Etappe 1: Landingpage unter /videokonverter/, Werkzeug unter /videokonverter/app/.
 * Die alten Werkzeugadressen (converter.html, converter.en.html) bleiben bestehen
 * und liefern dieselbe Oberfläche wie app/index.html bzw. app/index.en.html.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFrontend } from './tokenTestUtils.mjs';

const landing = readFrontend('index.html');
const converter = readFrontend('converter.html');
const i18nJs = readFrontend('js/i18n.js');

describe('App-Einstiegsdateien', () => {
  it('app/index.html entspricht converter.html (sonst: npm run build:en)', () => {
    assert.equal(readFrontend('app/index.html'), converter);
  });

  it('app/index.en.html entspricht converter.en.html (sonst: npm run build:en)', () => {
    assert.equal(readFrontend('app/index.en.html'), readFrontend('converter.en.html'));
  });

  it('lädt Skripte und Styles nur über absolute Pfade (funktioniert unter /app/)', () => {
    const relative = converter.match(/\s(?:src|href)="(?!\/|https?:|#|mailto:)[^"]+"/g) ?? [];
    assert.deepEqual(relative, []);
  });
});

describe('Interne Navigation', () => {
  for (const [name, source, current] of [
    ['Landingpage', landing, '/videokonverter/'],
    ['Werkzeug', converter, '/videokonverter/app/'],
  ]) {
    it(`${name} verlinkt Startseite und Konverter`, () => {
      const nav = source.match(/<nav class="video-section-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
      assert.match(nav, /href="\/videokonverter\/"/);
      assert.match(nav, /href="\/videokonverter\/app\/"/);
      assert.match(nav, new RegExp(`href="${current.replace(/\//g, '\\/')}" aria-current="page"`));
    });
  }

  it('Startbutton führt zur App', () => {
    assert.match(landing, /<a href="\/videokonverter\/app\/" class="hero-cta">/);
  });
});

describe('Titelbild', () => {
  it('ist ein WebP mit 1120 × 630 px', () => {
    const buf = readFileSync(new URL('../images/video-konverter-hero.webp', import.meta.url));
    assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
    assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
    const chunk = buf.toString('ascii', 12, 16);
    let width;
    let height;
    if (chunk === 'VP8X') {
      width = 1 + buf.readUIntLE(24, 3);
      height = 1 + buf.readUIntLE(27, 3);
    } else if (chunk === 'VP8 ') {
      width = buf.readUInt16LE(26) & 0x3fff;
      height = buf.readUInt16LE(28) & 0x3fff;
    } else {
      const bits = buf.readUInt32LE(21);
      width = (bits & 0x3fff) + 1;
      height = ((bits >> 14) & 0x3fff) + 1;
    }
    assert.deepEqual([width, height], [1120, 630]);
    assert.match(
      landing,
      /src="\/videokonverter\/images\/video-konverter-hero\.webp"\s+width="1120" height="630"/
    );
  });
});

describe('Übersetzungen', () => {
  const keys = [
    ...new Set(
      [landing, converter].flatMap((s) =>
        [...s.matchAll(/data-i18n(?:-alt|-title)?="([^"]+)"/g)].map((m) => m[1])
      )
    ),
  ];
  for (const locale of ['de', 'en']) {
    it(`alle verwendeten Schlüssel existieren in ${locale}`, () => {
      const block =
        i18nJs.match(new RegExp(`\\n\\s{4}${locale}: \\{([\\s\\S]*?)\\n\\s{4}\\}`))?.[1] ?? '';
      const missing = keys.filter((k) => !new RegExp(`\\b${k}:`).test(block));
      assert.deepEqual(missing, []);
    });
  }
});
