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

describe('Etappe 2: Werkzeugkopf', () => {
  for (const [name, source] of [
    ['Landingpage', landing],
    ['Werkzeug', converter],
  ]) {
    it(`${name} hat den gemeinsamen Kopf mit verstecktem Theme-Schalter`, () => {
      const header =
        source.match(/<header class="video-section-header">[\s\S]*?<\/header>/)?.[0] ?? '';
      assert.match(header, /<nav class="video-section-nav" aria-labelledby="video-section-name">/);
      assert.match(
        header,
        /<button class="video-theme-button" id="video-theme-button" type="button" hidden>/
      );
      assert.match(
        source,
        /<link rel="stylesheet" href="\/videokonverter\/css\/kodini-header-stage2\.css" \/>/
      );
    });

    it(`${name} lädt kodini-header.js nach i18n.js`, () => {
      const i18n = source.indexOf('/videokonverter/js/i18n.js');
      const header = source.indexOf('/videokonverter/js/kodini-header.js');
      assert.ok(i18n > -1 && header > i18n);
    });
  }
});

describe('Etappe 3: Bedienelemente', () => {
  const css = readFrontend('css/kodini-controls-stage3.css');
  const converterJs = readFrontend('js/converter.js');

  it('nur das Werkzeug lädt die Stylesheets aus Etappe 3 und 4', () => {
    for (const file of ['kodini-controls-stage3.css', 'kodini-workspace-stage4.css']) {
      assert.match(converter, new RegExp(`href="/videokonverter/css/${file.replace('.', '\\.')}"`));
      assert.doesNotMatch(landing, new RegExp(file.replace('.', '\\.')));
    }
  });

  it('Konvertieren und Herunterladen sind dunkelgold mit weisser Schrift', () => {
    const rule =
      css.match(/\.converter-page :is\(\.btn-convert, \.btn-download\) \{([^}]*)\}/)?.[1] ?? '';
    assert.match(rule, /background: var\(--video-gold\);/);
    assert.match(rule, /color: #fff;/);
  });

  it('Dunkelgold erreicht mit Weiss WCAG AA (4.5:1), auch im Hover', () => {
    const layout = readFrontend('css/kodini-layout-stage1.css');
    const luminance = (hex) => {
      const [r, g, b] = hex.match(/\w\w/g).map((c) => {
        const v = parseInt(c, 16) / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const name of ['--video-gold', '--video-gold-hover']) {
      const hex = layout.match(new RegExp(`${name}: (#[0-9a-f]{6});`, 'i'))?.[1];
      assert.ok(hex, name);
      assert.ok(1.05 / (luminance(hex) + 0.05) >= 4.5, `${name} ${hex}`);
    }
  });

  it('aktive Auswahl ist golden unterstrichen, Drag-over golden hervorgehoben', () => {
    assert.match(
      css,
      /\.format-buttons button\.active \{[^}]*box-shadow: inset 0 -2px var\(--video-highlight\);/
    );
    assert.match(css, /\.drop-zone\.drag-over \{[^}]*border-color: var\(--video-highlight\);/);
  });

  it('Buttons: mindestens 44 px hoch und sichtbarer Tastaturfokus', () => {
    assert.match(css, /min-height: max\(44px, var\(--ds-control-md\)\);/);
    assert.match(css, /button:focus-visible \{[^}]*outline: 2px solid var\(--video-highlight\);/);
  });

  it('Auswahlbuttons melden ihren Zustand (aria-pressed) und behalten den Fokus', () => {
    assert.equal((converterJs.match(/setAttribute\('aria-pressed'/g) ?? []).length, 2);
    assert.match(converterJs, /refocusSelection\(jobId, 'data-format', format\)/);
    assert.match(converterJs, /refocusSelection\(jobId, 'data-quality', quality\)/);
  });
});

describe('Etappe 4: Arbeitsbereich', () => {
  const css = readFrontend('css/kodini-workspace-stage4.css');

  it('Upload und Warteschlange teilen sich eine Breite', () => {
    assert.match(
      css,
      /:is\(\.uploader-container, \.conversion-queue\) \{[^}]*max-width: var\(--video-workspace-width\);/
    );
  });

  it('lange Dateinamen brechen um', () => {
    assert.match(css, /\.file-name \{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere;/);
  });

  it('Fortschrittsbalken ist 8 px hoch', () => {
    assert.match(css, /\.progress-bar \{[^}]*height: 8px;/);
  });
});
