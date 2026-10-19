# Übergabe: Storybook-Reflow (Branch fix/storybook-reflow, Befunde des Reviews zu PR #13)

Stand: Arbeit abgebrochen (Budget), Branch gepusht, kein PR. Fortsetzung ab Donnerstag.

## Befunde

- **B1 (Vorschau verdeckt Text bei 400 % Zoom): im Code erledigt, Commit 1ff9e38 (Skript 834b1b6).** `previewPinned`, `PIN_MAX_SHARE` 0,7, `PIN_MIN_VIEWPORT` 360 in `stories/docs/blocks/preview-logic.ts`; `StickyPreview` setzt `data-pinned`, CSS `position: static` bei `false` (`blocks.css`). Gemessen (Chromium, Build /tmp/sb-after): bei 320x256 und 320x225 und 640x225 ist die Vorschau nicht mehr fest, Text sichtbar (103 bis 242 px); 640x450 und 320x568 bleiben fest. Tests mit Mutationsproben in `tests/storybook-preview.test.tsx` (46 grün). `check-preview-docs.mjs`: SIZES/COMBOS um 320x568, 320x256, 320x225, 640x225 erweitert, `data-pinned` aus Messwerten nachgerechnet. Lauf `--filter=components-pagenav` (Chromium+WebKit, alle 10 Kombinationen): OK.
- **B2 (check-docs-axe prüft Seitenüberlauf schwächer): halb.** Erledigt (1ff9e38): `overflow-wrap: anywhere` für Doku-Überschriften (h1 bis h4) in `blocks.css`; gemessen: PageNav-Seite bei 320 px hat scrollWidth 320 statt 336. Nicht begonnen: `pageOverflow` (scrollWidth minus clientWidth, ohne erlaubte Ausnahmen) in `scripts/check-docs-axe.mjs` wieder prüfen und Mutationsprobe als Test (`tests/docs-axe-script.test.ts`).
- **B3 (Iframe bei Vollbreite 240 px, Tabs, Ausnahmelisten): teilweise.** Erledigt: `MIN_FULL_WIDTH` 320 (Iframe sieht 320 px, bei schmaler Spalte per transform verkleinert, 1ff9e38); Tabs `flex-wrap: wrap` für `.hoops-tabs--underline` mit Test und Mutationsproben (682dbdd). Nicht begonnen: Überläufe Kennzahlen/Map/Vanilla/Tabs nach der Änderung messen (Iframe jetzt 320 px); `KNOWN_CANVAS_OVERFLOW` und `isKnownScrollable` in `check-docs-axe.mjs` eng fassen (nach Selektor, mit Messwert), nicht gemessene Einträge (Accordion 320 px, AppNav 900 px) messen oder streichen; arc42 Kapitel 11 (Befund 4, "etwa 280 px" ist falsch: Iframe war 240 px breit, jetzt 320) und ADR-014 anpassen; Screenshot-Vergleich Tabs im Normalfall (Optik unverändert) fehlt. Screenshots vor/nach: Skript im Scratchpad `serve-measure.mjs`, Ausgabe `shots-before`/`shots-after` (nur lokal, nicht im Repo).
- **B4 (Wackler bei pagenav durch loading="lazy"): im Code erledigt (1ff9e38, 834b1b6), Abnahme offen.** Iframe in der Spalte lädt `eager`; Preview gleicht Höhenänderungen der Spalte per `window.scrollBy` aus (nur untereinander, wenn die Spalte oben steht); `.hoops-sp { overflow-anchor: none }`; Skript lädt vor der Messung alle Iframes (`loadAllFrames`). Noch nicht gelaufen: 10 Läufe von `check-preview-docs --filter=components-pagenav`. Ein Vergleichslauf (altes vs. neues Build ohne `loadAllFrames`) wurde gestartet und abgebrochen, ohne Ergebnis.
- **Kleinkram:** Kopfkommentar in `check-preview-docs.mjs` (Obergrenze 50/60 vh, gemessen bis 66 %, Mindesthöhe 160 px) erledigt (834b1b6). `aria-modal="true"` in `stories/components/ModalExamples.svelte:47` (`staticModal`): nicht begonnen. CHANGELOG-Eintrag (knapp, am Ende): nicht begonnen.

## Noch nicht gelaufen

`npm run typecheck`, `npm test` (komplett; nur `tests/storybook-preview.test.tsx` und `tests/tabs-narrow-css.test.ts` einzeln grün), `npm run build-storybook` (zuletzt nur `storybook build -o /tmp/sb-after`, erfolgreich), `check-docs-axe.mjs` (Standard und `--reflow`, alle Marken/Themes), `check-preview-docs.mjs` auf allen Seiten, Screenshots 320x256 / 640x450 / 320x568 nach der Änderung für alle vier Seiten (Messwerte oben vorhanden), `npm run build` nach den letzten Änderungen.

## Stolperstellen

- `node_modules` im Worktree ist ein Symlink (nicht committen). `npm test` nie parallel; im Worktree `.worktrees/logo-intro` arbeitet ein anderer Agent (Logo, Introduction, `manager.ts`: nicht anfassen).
- jsdom-Tests: `getBoundingClientRect` liefert 0; `matchMedia` ist per `wideMq` steuerbar, `window.innerHeight` wird in `afterEach` auf 768 zurückgesetzt.
- Höhenausgleich per `scrollBy` darf nicht mit dem Scroll-Anker des Browsers doppelt wirken (deshalb `overflow-anchor: none`); in WebKit nicht separat auf Doppelwirkung geprüft außer dem grünen Pagenav-Lauf.
- Editor-Hook: keine HTML-Zuweisung per Element-Eigenschaft, keine Regex-Ausführmethode in Dateiinhalten.
- Abnahme-Befehle siehe Auftrag: keine Befunde außer eng belegten Ausnahmen; PR-Titel "Storybook-Reflow: Zoom 400 %, Tabs umbrechen, Vorschau ohne Layoutsprung".
