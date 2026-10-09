/**
 * Konsistenz und Kontrast der Tokens v2 (portiert aus dem Collage Maker,
 * src/design-system/__tests__/tokens-v2.spec.ts).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  collectTokens,
  contrastRatio,
  normalize,
  parseBlock,
  readFrontend,
  themeColors,
} from './tokenTestUtils.mjs';

const tokens = JSON.parse(readFrontend('design-system/tokens-v2.json'));
const v2Css = readFrontend('css/tokens-v2.css');

const rootBlock = parseBlock(v2Css, ':root', 'tokens-v2.css');
const lightBlock = parseBlock(v2Css, '.light-theme', 'tokens-v2.css');
const dataThemeLightBlock = parseBlock(v2Css, ":root[data-theme='light']", 'tokens-v2.css');
const withCss = collectTokens(tokens).filter((token) => token.cssVar !== undefined);

const THEMES = ['dark', 'light'];
const TEXT_TOKENS = ['text', 'text2', 'text3'];
const SURFACE_TOKENS = ['surface0', 'surface1', 'surface2'];
const STATUS_TOKENS = ['success', 'warning', 'danger', 'info', 'link'];
const AA = 4.5;

describe('tokens-v2.json ↔ tokens-v2.css', () => {
  it('definiert jedes Token mit CSS-Variable im passenden Block mit identischem Wert', () => {
    assert.ok(withCss.length > 80, `nur ${withCss.length} Tokens`);
    const mismatches = withCss.flatMap((token) => {
      const block = token.path.includes('light') ? lightBlock : rootBlock;
      const actual = block[token.cssVar];
      const expected = normalize(token.value);
      return actual === expected ? [] : [`${token.path} (${token.cssVar}): css=${actual} json=${expected}`];
    });
    assert.deepEqual(mismatches, []);
  });

  it('hat in :root keine Variable ohne JSON-Eintrag', () => {
    const declared = new Set(withCss.map((token) => token.cssVar));
    assert.deepEqual(Object.keys(rootBlock).filter((variable) => !declared.has(variable)), []);
  });

  it('hat für Dark und Light dieselben Farb- und Effekt-Tokens', () => {
    assert.deepEqual(Object.keys(tokens.color.light).sort(), Object.keys(tokens.color.dark).sort());
    assert.deepEqual(Object.keys(tokens.effect.light).sort(), Object.keys(tokens.effect.dark).sort());
  });

  it('spiegelt html[data-theme=light] vollständig aus .light-theme', () => {
    assert.deepEqual(dataThemeLightBlock, lightBlock);
  });

  it('deklariert Composite-Tokens mit var(--ds-…) auch in .light-theme', () => {
    const composites = Object.entries(rootBlock).filter(([, value]) => value.includes('var(--ds-'));
    assert.ok(composites.length > 0);
    assert.deepEqual(
      composites.filter(([variable]) => lightBlock[variable] === undefined).map(([v]) => v),
      []
    );
  });

  it('nutzt ausschließlich --ds-* Variablen', () => {
    const variables = [...Object.keys(rootBlock), ...Object.keys(lightBlock)];
    assert.deepEqual(variables.filter((variable) => !variable.startsWith('--ds-')), []);
  });
});

describe('Kontrast (WCAG AA, mindestens 4.5:1)', () => {
  for (const theme of THEMES) {
    const colors = themeColors(tokens, theme);

    it(`${theme}: Text 1–3 auf Fläche 0–2`, () => {
      const failures = TEXT_TOKENS.flatMap((text) =>
        SURFACE_TOKENS.flatMap((surface) => {
          const ratio = contrastRatio(colors[text], colors[surface]);
          return ratio >= AA ? [] : [`${text} auf ${surface}: ${ratio.toFixed(2)}`];
        })
      );
      assert.deepEqual(failures, []);
    });

    it(`${theme}: Text auf Akzent und Akzent-Hover`, () => {
      assert.ok(contrastRatio(colors.onAccent, colors.accent) >= AA);
      assert.ok(contrastRatio(colors.onAccent, colors.accentHover) >= AA);
    });

    it(`${theme}: Status- und Linkfarben als Text auf Panel und Eingabefläche`, () => {
      // Der Videokonverter setzt Fehlertexte auf surface-2 (error-message, error-text)
      const failures = STATUS_TOKENS.flatMap((status) =>
        ['surface1', 'surface2'].flatMap((surface) => {
          const ratio = contrastRatio(colors[status], colors[surface]);
          return ratio >= 4.3 ? [] : [`${status} auf ${surface}: ${ratio.toFixed(2)}`];
        })
      );
      assert.deepEqual(failures, []);
    });
  }
});
