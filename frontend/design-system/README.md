# Design-System · Tokens v2

Der Videokonverter nutzt dieselben Design-Tokens wie Collage Maker und Playlist Generator
(`KodiniTools/Collage-Maker`, `src/design-system/`, Stand `9dc4eca`). Werte werden dort gepflegt und
hierher übernommen, nicht lokal geändert.

## Dateien

| Datei                              | Zweck                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `css/tokens-v2.css`                | **Laufzeit-Quelle.** `--ds-*`, Dark auf `:root`, Light auf `.light-theme` und `:root[data-theme='light']`. |
| `design-system/tokens-v2.json`     | Maschinenlesbare Fassung (wird nicht deployt), `$extensions.css` nennt die Variable.                    |
| `css/app.css`                      | Alle Styles der Seiten, ausschließlich über `--ds-*`; Supreme-`@font-face`, SSI-Partial-Angleichung.    |
| `fonts/Supreme-{Regular,Medium,Bold}.woff2` | UI-Schrift in 400/500/700 (600 fällt auf Bold), wird über `deploy.sh` mit veröffentlicht.       |
| `js/theme.js`                      | Theme-Mechanik (siehe unten).                                                                           |
| `tests/*.test.mjs`                 | Konsistenz JSON ↔ CSS, Kontrast (WCAG AA), Regressionsschutz für `app.css`, HTML und Theme.            |

Tests: `npm run test:frontend` (Node `node:test`, keine Abhängigkeiten); `npm test` führt Backend und Frontend aus.

## Theme-Mechanik

Wie im Collage Maker: Ein Inline-Skript im `<head>` setzt `html[data-theme]` vor dem ersten Paint aus
`localStorage.theme` (Standard **Light**). `js/theme.js` setzt danach `html[data-theme]` (Tokens und
SSI-Partials), `body.light-theme` (Parität zum Playlist Generator) und `html.dark` (Altbestand für
externe Skripte), folgt der SSI-Navigation über das Event `theme-changed` und einen MutationObserver
auf `data-theme` und hält die Theme-Icons der Navigation synchron. `color-scheme` folgt dem Theme.

## SSI-Partials

Nav, Footer und Cookie-Banner liegen außerhalb von `#app` (`.landing` bzw. `.converter-page`).
`app.css` macht ihre Hintergründe transparent (Cookie-Banner ausgenommen), gibt Dropdowns wieder
`--ds-surface-1`, färbt Text, Links und Hover aus `--ds-text`, `--ds-link`, `--ds-accent` und hält den
Cookie-Banner auf `z-index: 10000`.

## Regeln

- **Eine Goldfläche pro Aktion:** `--ds-accent` füllt nur Primäraktionen (Jetzt starten, Konvertieren,
  Herunterladen). Auswahl (Format/Qualität, Dropzone beim Ziehen) = `--ds-accent-soft` + 1-px-Rahmen in
  `--ds-accent`, Text bleibt `--ds-text`.
- **Destruktiv ist textbasiert:** Entfernen und Fehlertexte in `--ds-danger` auf neutraler Fläche.
- **Ein Rahmen, drei Radien, Schatten nur für Overlays.** Hover ändert Farbe, nie Größe; Übergänge
  mit `--ds-duration`/`--ds-ease`. Fokus über `--ds-focus-ring`.
- **Icons im Lucide-Stil:** `stroke="currentColor"`, `stroke-width="1.75"`, runde Enden.
