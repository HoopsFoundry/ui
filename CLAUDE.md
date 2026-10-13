# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Das Repository ist ein Design System für Basketball-Apps (`@bbv/dss-design-system`, Version 0.9, Marken BBV und DBB). Sprache für Doku, Kommentare, Commit-Messages und Gespräche: **Deutsch** (Code-Bezeichner englisch/deutsch gemischt wie im Bestand).

## Befehle

```bash
npm test                          # vitest run (jsdom), alle Tests, ca. 1 Minute
npx vitest run tests/map.test.ts  # eine Datei; -t "Teil des Testnamens" für einen Test
npm run typecheck                 # tsc -p react/tsconfig.json --noEmit
npm run build:react               # tsup → dist/react (läuft auch als `prepare` bei npm install)
npm run storybook                 # Dev-Server, Port 6006
npm run build-storybook           # statischer Build nach storybook-static/ (gitignored)
```

Es gibt keinen Linter. CI (`.github/workflows/deploy-storybook.yaml`) baut nur Storybook und deployt auf GitHub Pages bei jedem Push auf `main`; Tests laufen dort nicht, deshalb vor dem Push lokal `npm test`, `typecheck`, `build:react` und `build-storybook` ausführen.

## Architektur

**Eine CSS-Quelle, mehrere Fassungen.** Das Aussehen steckt ausschließlich in `css/components.css` (Klassen `dss-*`, Tokens aus `tokens/tokens.css`). Jede Komponente existiert als Vanilla-CSS-Klassen, als `svelte/*.svelte` und als `react/*.tsx` (Export in `react/index.ts`; `Map` heißt in React `MapView`). Svelte-Dateien dürfen **keinen `<style>`-Block** haben. `parity.manifest.json` listet je Komponente Svelte-Datei, React-Datei, React-Exportnamen und CSS-Klassen; `tests/parity.test.ts` erzwingt Vollständigkeit. Neue Komponente = Eintrag im Manifest, Export in `react/index.ts`, `package.json`-`exports`, `README.md`, `CHANGELOG.md`.

**Gemeinsame Logik in `js/`** (reine Funktionen, ESM, mit `.d.ts`, einzeln über `package.json`-`exports` veröffentlicht): `schedule.js`, `league.js`, `team.js`, `venue.js`, `map.js`, `heading.js`, `periods.js`, `stats.js`, `accordion.js` … Svelte und React rufen dieselben Funktionen, damit beide Fassungen dasselbe Verhalten und Markup erzeugen. Verhalten für Vanilla-Seiten sind `initX(root, options) → { destroy() }`-Funktionen (`pagenav`, `backtop`, `theme`, `accordion`, `vanilla-core.js` mit `initAll` über `data-dss`), gemeinsame Hilfen in `lifecycle.js`, `motion.js`, `url.js` (`safeHref`).

**Überschriften:** Komponenten geben nie `h1` aus. Rangfolge der Ebene: `titleAs` > `HeadingLevel`-Kontext > `h3`. Größe hängt an Klassen/Tokens (`--dss-title-size` …), nie am Elementnamen.

**Karte:** Leaflet ist optionale Peer-Abhängigkeit, wird per dynamischem `import('leaflet')` erst nach Klick geladen (Datenschutz: Zwei-Klick-Platzhalter, `tileUrl` für eigenen Kachel-Proxy). Controller `js/map-leaflet.js` wird von Svelte und React gemeinsam genutzt; in Tests ist `leaflet` auf `tests/helpers/leaflet-mock.ts` aliasiert.

## Dokumentation (Storybook)

Docs sind MDX-Seiten je Komponente in `stories/` (`X.mdx`, `X.stories.ts`, `X.code.ts` mit Code je Fassung, `components/XExamples.svelte`), Blöcke in `stories/docs/blocks/` (`DosDonts`, `FrameworkCode`, `DocTable`, `CodeBlock`). Konventionen, die Tests und axe sonst brechen:

- Beispiel-Stories, die nur in der Doku erscheinen, tragen das **literale** `tags: ['!dev']` im Story-Objekt (der Indexer liest keine Tags aus Hilfsfunktionen).
- `remark-gfm` ist nicht installiert: Tabellen über `DocTable`, nicht Markdown-Tabellen.
- „Don't"-Beispiele in `DosDonts` sind `inert`; mehrere gleiche Komponenten auf einer Seite brauchen eindeutige Titel/Labels (axe `landmark-unique`); vor dem ersten Beispiel steht eine `##`-Überschrift (`heading-order`).
- Neue Seiten in `stories/Introduction.mdx` und im `storySort` in `.storybook/preview.ts` eintragen. Toolbar-Globals: Marke, Typ (`dbb`), Framework, Zustand (Hover/Fokus erzwingen), Bewegung; Theme-Werte in URLs sind `Dark`/`Light`.
- Zahlen und Aussagen in der Doku werden gegen CSS/Browser gemessen und von Tests geprüft (`tests/*-docs.test.ts`, `*-code.test.ts` führen die Beispiele aus); nichts schätzen.

## Qualitätsregeln (WCAG 2.2 AAA als Ziel)

Text mindestens 7:1 (`color-contrast-enhanced`), Zielgrößen ≥ 24 px (AA) bzw. 44 px für Hauptbedienelemente, gestrichelter Fokus-Ring über `--ring-*`-Tokens, Bewegung respektiert `prefers-reduced-motion` und `data-motion="reduce"`, nichts nur über Farbe. Neue Regeln werden mit Mutationstests abgesichert (Test muss rot werden, wenn die Regel im Quelltext verfälscht wird).

## Arbeitsweise im Projekt

- Spezifikationen und Pläne liegen in `docs/superpowers/specs/` und `docs/superpowers/plans/` (Datum im Dateinamen); größere Pakete: Spec → Plan → Worktree unter `.worktrees/<paket>` (gitignored, Branch `feat/<paket>`) → Umsetzung → unabhängiger Review → Fixes → `git merge --no-ff` nach `main` → Push → Worktree entfernen. Der Nutzer hat Merge und Push auf `main` für diese Pakete freigegeben.
- `images/` (Stockfotos) ist gitignored und wird nie referenziert; Demo-Fotos sind verkleinerte Kopien in `stories/assets/players/` (mit `CREDITS.md`). Demo-Daten sind erfunden (keine echten Personen, Adressen, Telefonnummern).
- Vitest-Dateien, die Dateien über `new URL(...)` lesen, brauchen `// @vitest-environment node` in der ersten Zeile.
- Ein Editor-Hook blockiert Dateiinhalte, in denen HTML-Zuweisung per Element-Eigenschaft oder die Regex-Methode zum Ausführen vorkommen: stattdessen `createContextualFragment`, `String.match` und DOM-APIs verwenden, auch in Kommentaren und Plänen.
- Die statischen Design-HTMLs im Wurzelordner (`DSS Design System - *.html`, `tweaks-panel.jsx`) sind historisch und werden nicht gepflegt.
