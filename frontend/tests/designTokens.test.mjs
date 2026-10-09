/**
 * Regressionsschutz für die Oberfläche (portiert aus dem Collage Maker,
 * src/tests/designTokens.spec.ts, angepasst an Vanilla-CSS statt Tailwind/Vue).
 *
 * app.css läuft auf den gemeinsamen KodiniTools-Tokens (--ds-*). Diese Tests
 * verhindern die Rückkehr der alten Palette (--color-*), fester Farbwerte,
 * von Gradients, Blur, Karten-Schatten und Hover-Bewegung und stellen sicher,
 * dass Supreme in allen genutzten Gewichten geladen und die Theme-Mechanik
 * wie im Collage Maker verdrahtet ist.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { FRONTEND_DIR, parseBlock, readFrontend, stripComments } from './tokenTestUtils.mjs';

const appCss = readFrontend('css/app.css');
const appCssCode = stripComments(appCss);
const tokensCss = readFrontend('css/tokens-v2.css');
const themeJs = readFrontend('js/theme.js');
const converterJs = readFrontend('js/converter.js');
const PAGES = ['index.html', 'converter.html'];
const definedVars = new Set(Object.keys(parseBlock(tokensCss, ':root')));

/** Liefert alle Zeilen (Zeilennummer: Inhalt), in denen das Muster vorkommt. */
function findLines(source, pattern) {
  return source
    .split('\n')
    .flatMap((line, index) => (pattern.test(line) ? [`${index + 1}: ${line.trim()}`] : []));
}

describe('app.css auf Tokens v2', () => {
  it('nutzt keine Variablen der alten Palette (--color-*)', () => {
    assert.deepEqual(findLines(appCssCode, /--color-/), []);
  });

  it('referenziert nur Variablen, die tokens-v2.css definiert', () => {
    const used = new Set([...appCssCode.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
    assert.ok(used.size > 40, `nur ${used.size} Variablen genutzt`);
    assert.deepEqual([...used].filter((variable) => !definedVars.has(variable)), []);
  });

  it('enthält keine festen Farbwerte (hex, rgb, Farbnamen außer transparent/currentColor)', () => {
    assert.deepEqual(findLines(appCssCode, /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/), []);
    assert.deepEqual(findLines(appCssCode, /:\s*(?:white|black)\b/), []);
  });

  it('nutzt keine Gradients, Blur oder Hover-Bewegung', () => {
    assert.deepEqual(findLines(appCssCode, /gradient\(|blur\(|backdrop-filter/), []);
    const hoverBlocks = appCssCode.match(/[^{}]*:hover[^{]*\{[^}]*\}/g) ?? [];
    assert.deepEqual(hoverBlocks.filter((block) => /transform|box-shadow|scale/.test(block)), []);
  });

  it('setzt Schatten nur über die Fokus-/Overlay-Tokens', () => {
    const shadows = findLines(appCssCode, /box-shadow:/);
    assert.deepEqual(
      shadows.filter((line) => !/var\(--ds-(?:focus-ring|shadow-overlay)\)/.test(line)),
      []
    );
  });

  it('nutzt nur die Token-Radien', () => {
    const radii = findLines(appCssCode, /border-radius:/);
    assert.deepEqual(radii.filter((line) => !/var\(--ds-radius-(?:sm|md|lg|full)\)/.test(line)), []);
  });

  it('nutzt nur Token-Schriftgrade und -gewichte', () => {
    assert.deepEqual(
      findLines(appCssCode, /font-size:/).filter((line) => !/var\(--ds-text-(?:xs|sm|md|lg|xl|2xl|3xl)\)/.test(line)),
      []
    );
    assert.deepEqual(
      findLines(appCssCode, /font-weight:/).filter((line) => !/var\(--ds-weight-\w+\)|font-weight:\s*(?:400|500|700);/.test(line)),
      []
    );
  });

  it('animiert Übergänge mit den Token-Dauern', () => {
    const transitions = appCssCode.match(/transition:[^;]*;/g) ?? [];
    assert.deepEqual(
      transitions.filter((t) => t !== 'transition: none;' && !/var\(--ds-duration(?:-slow)?\)/.test(t)),
      []
    );
  });

  it('setzt die Grundgröße des Body auf --ds-text-lg und die Schrift auf --ds-font-sans', () => {
    assert.match(appCssCode, /body \{[^}]*font-size: var\(--ds-text-lg\)/);
    assert.match(appCssCode, /body \{[^}]*font-family: var\(--ds-font-sans\)/);
  });

  it('setzt den Fokus über --ds-focus-ring', () => {
    assert.match(appCssCode, /:focus-visible[^{]*\{[^}]*box-shadow: var\(--ds-focus-ring\)/);
  });

  it('folgt mit color-scheme dem Theme', () => {
    assert.match(appCssCode, /:root\[data-theme='dark'\] \{\s*color-scheme: dark;/);
    assert.match(appCssCode, /:root\[data-theme='light'\] \{\s*color-scheme: light;/);
  });
});

describe('UI-Schrift Supreme', () => {
  for (const [weight, file] of [[400, 'Regular'], [500, 'Medium'], [700, 'Bold']]) {
    it(`deklariert @font-face für Gewicht ${weight}`, () => {
      const faces = appCssCode.match(/@font-face\s*{[^}]*}/g) ?? [];
      const match = faces.find(
        (face) => /font-family:\s*'Supreme'/.test(face) && new RegExp(`font-weight:\\s*${weight}\\b`).test(face)
      );
      assert.ok(match, `Kein @font-face für Supreme ${weight}`);
      assert.match(match, new RegExp(`url\\('\\.\\./fonts/Supreme-${file}\\.woff2'\\)`));
      assert.ok(existsSync(join(FRONTEND_DIR, 'fonts', `Supreme-${file}.woff2`)), `fonts/Supreme-${file}.woff2 fehlt`);
    });
  }

  it('wird vom Deploy mit veröffentlicht', () => {
    const deploy = readFrontend('../deploy.sh');
    assert.match(deploy, /^PUBLISH=\([^)]*\bfonts\b[^)]*\)/m);
  });
});

describe('SSI-Partials', () => {
  it('macht Partial-Hintergründe transparent und nimmt #app und Cookie-Banner aus', () => {
    assert.match(appCssCode, /body > :not\(#app\):not\(script\):not\(\.cookie-banner\)/);
  });

  it('färbt Partial-Text und Links aus den Tokens', () => {
    assert.match(appCssCode, /color: var\(--ds-text\) !important/);
    assert.match(appCssCode, /color: var\(--ds-link\) !important/);
    assert.match(appCssCode, /color: var\(--ds-accent\) !important/);
  });

  for (const page of PAGES) {
    it(`${page}: App-Wurzel trägt id="app" und Partials liegen außerhalb`, () => {
      const html = readFrontend(page);
      assert.equal((html.match(/id="app"/g) ?? []).length, 1);
      const appIndex = html.indexOf('id="app"');
      assert.ok(html.indexOf('/partials/nav.html') < appIndex);
      assert.ok(html.indexOf('/partials/footer.html') > appIndex);
    });
  }
});

describe('Theme-Mechanik', () => {
  for (const page of PAGES) {
    it(`${page}: setzt data-theme vor dem ersten Paint und lädt Tokens vor app.css`, () => {
      const html = readFrontend(page);
      const head = html.slice(0, html.indexOf('</head>'));
      assert.match(head, /<script>[\s\S]*setAttribute\('data-theme'[\s\S]*<\/script>/);
      const tokensIndex = head.indexOf('/videokonverter/css/tokens-v2.css');
      const appIndex = head.indexOf('/videokonverter/css/app.css');
      assert.ok(tokensIndex > 0 && appIndex > tokensIndex, 'tokens-v2.css muss vor app.css stehen');
      assert.doesNotMatch(head, /#0066cc/);
    });
  }

  it('theme.js setzt data-theme, body.light-theme und html.dark', () => {
    assert.match(themeJs, /setAttribute\('data-theme', next\)/);
    assert.match(themeJs, /body\.classList\.toggle\('light-theme', next === 'light'\)/);
    assert.match(themeJs, /classList\.toggle\('dark', next === 'dark'\)/);
  });

  it('theme.js folgt der SSI-Navigation (Event und data-theme-Mutation)', () => {
    assert.match(themeJs, /addEventListener\('theme-changed'/);
    assert.match(themeJs, /attributeFilter: \['data-theme'\]/);
  });
});

describe('Ikonografie', () => {
  it('zeichnet Icons im Lucide-Stil mit Strichstärke 1,75', () => {
    for (const source of [converterJs, ...PAGES.map(readFrontend)]) {
      assert.deepEqual(findLines(source, /stroke-width[="',\s]+2['"]/), []);
    }
  });
});
