# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Das Repository ist ein Design System für Basketball-Apps (`@hoopsfoundry/ui`, Version 0.10, Marken BBV und DBB). Sprache für Doku, Kommentare, Commit-Messages und Gespräche: **Deutsch** (Code-Bezeichner englisch/deutsch gemischt wie im Bestand).

## Befehle

```bash
npm test                          # vitest run (jsdom), alle Tests, ca. 1 Minute
npx vitest run tests/map.test.ts  # eine Datei; -t "Teil des Testnamens" für einen Test
npm run typecheck                 # tsc -p react/tsconfig.json --noEmit
npm run build:react               # tsup → dist/react
npm run build:vanilla             # scripts/build-vanilla.mjs → dist/vanilla (hoops.js, hoops.min.js, hoops.d.ts, hoops.css)
npm run build                     # beides; läuft auch als `prepare` bei npm install
node scripts/check-map-browser.mjs   # Browser-Prüfung der Karte ohne Build (Chromium/WebKit via Playwright; --browsers=, --only=); nicht Teil von npm test
node scripts/check-map-docs.mjs <ordner>  # axe auf den Karten-Seiten eines Storybook-Builds (npx storybook build -o <ordner>)
node scripts/release-vanilla.mjs --dry-run --allow-dirty --no-build   # Release-Ablauf prüfen (schreibt nichts); ohne --dry-run nach release/ (gitignored)
node scripts/check-portal-seite.mjs --browsers=chromium,webkit   # Beispiel-Portalseite im Browser (Release → portal-sync → strenge CSP, axe); nicht Teil von npm test
node scripts/check-browser-matrix.mjs --markdown   # Kernbausteine in Chromium, Firefox, WebKit (Accordion, Tabs, Modal/::backdrop, Karte, PageNav, Theme, Container, Bewegung); nicht Teil von npm test
node scripts/check-csp-boot.mjs     # Boot-Skript des Dunkelmodus unter echter CSP (Hash, meta, nonce, Gegenproben) in Chromium/Firefox/WebKit; nicht Teil von npm test
node scripts/check-docs-axe.mjs storybook-static --widths=1280,420   # axe- und Regressionsmatrix über alle Docs-Seiten (BBV/DBB × hell/dunkel); nach npm run build-storybook; Exit-Code für CI
node scripts/check-i18n-docs.mjs <ordner>  # axe und Sprachumschaltung auf der Seite Foundation/Internationalisierung eines Storybook-Builds (de/en, hell/dunkel)
node scripts/check-preview-docs.mjs storybook-static   # Vorschauen in Gerätebreite (Preview/StickyPreview) in Chromium und WebKit: Marke × Theme × Breite × Sprache, feststehend, automatischer Wechsel; --full für das volle Produkt
npm run storybook                 # Dev-Server, Port 6006
npm run build-storybook           # statischer Build nach storybook-static/ (gitignored)
```

Es gibt keinen Linter. `tests/no-dss.test.ts` verbietet den alten Namen (Präfix vor 0.10.0) im ganzen Bestand; erlaubt sind nur die begründete Allowlist (Migrationswerkzeuge, Historie). CI (`.github/workflows/deploy-storybook.yaml`) baut nur Storybook und deployt auf GitHub Pages bei jedem Push auf `main`; Tests laufen dort nicht, deshalb vor dem Push lokal `npm test`, `typecheck`, `build` und `build-storybook` ausführen.

## Architektur

**Eine CSS-Quelle, mehrere Fassungen.** Das Aussehen steckt ausschließlich in `css/components.css` (Klassen `hoops-*`, Tokens aus `tokens/tokens.css`). Jede Komponente existiert als Vanilla-CSS-Klassen, als `svelte/*.svelte` und als `react/*.tsx` (Export in `react/index.ts`; `Map` heißt in React `MapView`). Svelte-Dateien dürfen **keinen `<style>`-Block** haben. `parity.manifest.json` listet je Komponente Svelte-Datei, React-Datei, React-Exportnamen und CSS-Klassen; `tests/parity.test.ts` erzwingt Vollständigkeit. Neue Komponente = Eintrag im Manifest, Export in `react/index.ts`, `package.json`-`exports`, `README.md`, `CHANGELOG.md`.

**Gemeinsame Logik in `js/`** (reine Funktionen, ESM, mit `.d.ts`, einzeln über `package.json`-`exports` veröffentlicht): `schedule.js`, `league.js`, `team.js`, `venue.js`, `map.js`, `heading.js`, `periods.js`, `stats.js`, `accordion.js` … Svelte und React rufen dieselben Funktionen, damit beide Fassungen dasselbe Verhalten und Markup erzeugen. Verhalten für Vanilla-Seiten sind `initX(root, options) → { destroy() }`-Funktionen (`accordion`, `tabs`, `modal`, `pagenav`, `backtop`, `theme`, `vanilla-core.js` mit `initAll` über `data-hoops`); `npm run build:vanilla` bündelt sie nach `dist/vanilla` (Größenbudget als Test; `dist/` ist gitignored, Auslieferung per GitHub-Release, siehe `docs/superpowers/plans/2026-10-12-vanilla-v2-plan.md`), gemeinsame Hilfen in `lifecycle.js`, `motion.js`, `url.js` (`safeHref`).

**Überschriften:** Komponenten geben nie `h1` aus. Rangfolge der Ebene: `titleAs` > `HeadingLevel`-Kontext > `h3`. Größe hängt an Klassen/Tokens (`--hoops-title-size` …), nie am Elementnamen.

**Karte:** Leaflet ist optionale Peer-Abhängigkeit, wird per dynamischem `import('leaflet')` erst nach Klick geladen (Datenschutz: Zwei-Klick-Platzhalter, `tileUrl` für eigenen Kachel-Proxy). Controller `js/map-leaflet.js` wird von Svelte, React und Vanilla gemeinsam genutzt; in Tests ist `leaflet` auf `tests/helpers/leaflet-mock.ts` aliasiert. Vanilla: `js/map-vanilla.js` (`renderMap`, `initMap`, `mountMap`) im eigenen Bündel `dist/vanilla/hoops-map.js` ohne Leaflet; die Option `loadLeaflet` liefert Leaflet aus dem eigenen Projekt (ADR-003, ADR-007).

## Dokumentation (Storybook)

Docs sind MDX-Seiten je Komponente in `stories/` (`X.mdx`, `X.stories.ts`, `X.code.ts` mit Code je Fassung, `components/XExamples.svelte`), Blöcke in `stories/docs/blocks/` (`DosDonts`, `FrameworkCode`, `DocTable`, `CodeBlock`, `Preview`/`StickyPreview`/`PreviewStep` mit den Regeln in `preview-logic.ts`). Konventionen, die Tests und axe sonst brechen:

- Beispiel-Stories, die nur in der Doku erscheinen, tragen das **literale** `tags: ['!dev']` im Story-Objekt (der Indexer liest keine Tags aus Hilfsfunktionen).
- `remark-gfm` ist nicht installiert: Tabellen über `DocTable`, nicht Markdown-Tabellen.
- „Don't"-Beispiele in `DosDonts` sind `inert`; mehrere gleiche Komponenten auf einer Seite brauchen eindeutige Titel/Labels (axe `landmark-unique`); vor dem ersten Beispiel steht eine `##`-Überschrift (`heading-order`).
- Beispiele, die Media-Queries zeigen (Handy, Tablet), stehen als Vorschau in Gerätebreite: `<StickyPreview><PreviewStep of={X.Story} title="…">Text</PreviewStep></StickyPreview>` (eigener Iframe, Breite aus dem Global `breite`, Titel je Seite eindeutig, `height`/`minHeight` für Seiten, die im Iframe scrollen oder fest positioniert sind). Keine festen `<iframe>`, keine festen Themes in Adressen; hell und dunkel nebeneinander nur auf `Foundation/Dark Mode` (`<Preview globals={{ theme: 'Dark' }}>`). Beispiele dafür ohne Breitenbegrenzung (Klasse `device`).
- Neue Seiten in `stories/Introduction.mdx` und im `storySort` in `.storybook/preview.ts` eintragen. Toolbar-Globals: Marke (bringt die Schrift mit: `applyBrand` aus `.storybook/brand.ts` setzt `data-brand` und `data-type`; ein Global für die Schrift gibt es nicht), Breite (`breite`: `voll`, `handy` 390, `tablet` 768, `desktop` 1280; `.storybook/breite.ts`, wirkt auf die Vorschau-Iframes, weil das Viewport-Werkzeug von Storybook in der Docs-Ansicht nicht wirkt), Framework, Zustand (Hover/Fokus erzwingen), Bewegung, Sprache (`locale`: `de` Start, `en`; `applyLocale` aus `.storybook/locale.ts` läuft als `beforeEach` und ruft `setLocale`, `<html lang="de">`); Theme-Werte in URLs sind `Dark`/`Light`. Die Doku-Texte bleiben deutsch.
- Zahlen und Aussagen in der Doku werden gegen CSS/Browser gemessen und von Tests geprüft (`tests/*-docs.test.ts`, `*-code.test.ts` führen die Beispiele aus); nichts schätzen.

## Qualitätsregeln (WCAG 2.2 AAA als Ziel)

Text mindestens 7:1 (`color-contrast-enhanced`), Zielgrößen ≥ 24 px (AA) bzw. 44 px für Hauptbedienelemente, gestrichelter Fokus-Ring über `--hoops-ring-*`-Tokens, Bewegung respektiert `prefers-reduced-motion` und `data-motion="reduce"`, nichts nur über Farbe. Neue Regeln werden mit Mutationstests abgesichert (Test muss rot werden, wenn die Regel im Quelltext verfälscht wird).

## Arbeitsweise im Projekt

- **Architektur dokumentieren:** Jede Architekturänderung und jede Architekturentscheidung (neue Bausteine oder Module, Änderungen an öffentlichen Schnittstellen/`exports`, Auslieferung, Abhängigkeiten, Querschnittsregeln wie Sicherheit, Datenschutz, Zugänglichkeit) muss in der arc42-Dokumentation `docs/architecture/` festgehalten werden: betroffene Kapitel unter `sections/` anpassen und Entscheidungen als ADR in `sections/09-architecture-decisions.adoc` mit Kontext, Entscheidung, Status, Konsequenzen und Quellen (Specs/Pläne) ergänzen. `docs/architecture/README.adoc` wird per Workflow erzeugt und nicht von Hand bearbeitet. Eine Änderung ohne diesen Eintrag gilt als unvollständig; Planstände gehören nicht dorthin, sondern in `docs/superpowers/plans/`.
- Spezifikationen und Pläne liegen in `docs/superpowers/specs/` und `docs/superpowers/plans/` (Datum im Dateinamen); größere Pakete: Spec → Plan → Worktree unter `.worktrees/<paket>` (gitignored, Branch `feat/<paket>`) → Umsetzung → unabhängiger Review → Fixes → `git merge --no-ff` nach `main` → Push → Worktree entfernen. Der Nutzer hat Merge und Push auf `main` für diese Pakete freigegeben.
- `images/` (Stockfotos) ist gitignored und wird nie referenziert; Demo-Fotos sind verkleinerte Kopien in `stories/assets/players/` (mit `CREDITS.md`). Demo-Daten sind erfunden (keine echten Personen, Adressen, Telefonnummern).
- Vitest-Dateien, die Dateien über `new URL(...)` lesen, brauchen `// @vitest-environment node` in der ersten Zeile.
- Ein Editor-Hook blockiert Dateiinhalte, in denen HTML-Zuweisung per Element-Eigenschaft oder die Regex-Methode zum Ausführen vorkommen: stattdessen `createContextualFragment`, `String.match` und DOM-APIs verwenden, auch in Kommentaren und Plänen.
- Die statischen Design-HTMLs und `tweaks-panel.jsx` unter `docs/entwuerfe/` sind historische Entwürfe (Ideen für später) und werden nicht gepflegt.
