# Design: Vanilla-Paket (Verhalten und Markup-Bausteine ohne Framework)

Stand: 2026-10-11 · Auslöser: Analyse des Vereinsregisters (statisches Portal, Vanilla-JS, GitHub Pages; Mittelweg statt Wechsel auf Svelte/React).

## Entscheidungen des Auftraggebers
| Frage | Entscheidung |
|---|---|
| Umfang | **Verhalten und Markup-Bausteine**: Init-Funktionen für vorhandenes HTML und Render-Funktionen, die geprüftes, escaptes HTML erzeugen |
| Auslieferung | **Fertige Dateien ohne Build**: gebündeltes `dss.js` (ES-Modul, plus `.min.js`) und einzelne Module im Paket; Leaflet bleibt optional und wird erst nach Einwilligung geladen |

## Ausgangslage (Vereinsregister)
- Portal: rund 2.500 Zeilen eigenes JS, ca. 200 eigene CSS-Klassen, eine veraltete Kopie von `tokens.css`/`components.css` (v0.7) unter `portal/dss`.
- Seiten entstehen an zwei Stellen: im Browser (`team.js`, `verein.js`, `app.js`) und als statisches HTML im Node-Crawler (`crawler/seo.ts`). Beide bauen heute getrennt Markup mit `dss-*`-Klassen.
- Im DSS fehlen Bausteine, die das Portal schon selbst hat: Seitennavigation „Auf dieser Seite“, Nach-oben-Knopf, `dss-form`, `dss-row-meta`, `dss-row-teams`, `dss-stats`, `dss-stat--compact`, `dss-map-pin--seat`, `dss-btn--danger` (prüfen).

## Teil 1: Verhalten (`initX`) auf vorhandenem Markup
Ein einheitliches Muster: `initX(root, options)` → `{ destroy() }`, idempotent, nur `root` und Nachfahren, kein globaler Zustand, respektiert `data-motion="reduce"`/`prefers-reduced-motion`. Daneben `initAll(scope)`, das per `data-dss`-Attribut alles findet (`data-dss="accordion|tabs|modal|map|pagenav|backtop"`).
- **Accordion:** vorhanden (`initAccordion`, `initAccordions`), in das Muster einpassen (`destroy`).
- **Tabs:** Pfeiltasten/Home/End, `aria-selected`, Panel-Umschaltung, optional Deep-Link.
- **Modal:** `<dialog>`-basiert oder wie die Frameworks; Fokus holen und zurückgeben, Escape, `dismissOnBackdrop` (Standard aus).
- **Map/Hallenkarte:** `initMap(el, options)` auf Markup mit Platzhalter; nutzt `createMapController` (gemeinsam mit Svelte/React). Zwei-Klick-Platzhalter, `tileUrl`, Fehlerfälle wie die Komponenten.
- **Seitennavigation und Nach-oben:** aus dem Portal übernehmen (`pagenav.js`, `dss-pagenav`, `dss-backtop`), verallgemeinern (Überschriften-Ebenen wählbar, `data-pagenav-skip`, `<base href>`-sicher), mit Tests und Doku.
- **Theme-Umschalter** (hell/dunkel/System, `localStorage`, ohne Flackern): kleines Modul `initTheme`, weil das Portal es ebenfalls selbst hat.

## Teil 2: Markup-Bausteine (`renderX`)
- Reine Funktionen `renderLeagueCard(props)`, `renderTeamCard`, `renderVenueCard`, `renderScheduleTable`/`renderScheduleGrid`, `renderTable`, `renderMatchCard`, `renderEmptyState`, später weitere. Eingabe: dieselben Props wie die Svelte-/React-Komponenten, Ausgabe: HTML-**String** (läuft in Node im Crawler und im Browser) und `mountX(el, props)` setzt es per `createContextualFragment` ein (kein `innerHTML`).
- **Escaping zentral:** alle Texte und Attribute laufen durch `esc()`; URLs durch `safeHref` (aus `js/map.js`, in ein gemeinsames Modul verschoben); keine Rohstrings durch den Aufrufer. Tests mit `"><img onerror>` und `javascript:`.
- **Parität:** Die Ausgabe wird gegen `renderToStaticMarkup` der React-Komponente verglichen (normalisiert), wie bei der SSR-Parität Svelte↔React. Die Vanilla-Seite ist damit die dritte Fassung im `parity.manifest.json` (`vanilla: "renderLeagueCard"`).
- Gemeinsame reine Logik (`js/league.js`, `js/schedule.js`, `js/team.js`, `js/heading.js`, `js/map.js`) bleibt die eine Quelle; die Render-Funktionen rufen sie auf.
- Überschriftenebene: `titleAs`-Option (Standard `h3`); kein `HeadingLevel`-Kontext in Vanilla, die Ebene wird übergeben.

## Teil 3: Auslieferung
- `dist/vanilla/dss.js` (ES-Modul, ungebündelte Abhängigkeiten außer Leaflet), `dss.min.js`, `dss.css` (= `components.css` + `tokens.css` optional), Quellkarten; Export im `package.json`: `./vanilla` (Bundle), `./vanilla/*` (Einzelmodule), Typen (`.d.ts`).
- Leaflet: dynamischer Import erst bei Bedarf; im Bundle nicht enthalten. Die Doku zeigt, wie das Portal es mit kopiert (`_site/vendor/leaflet`), statt von unpkg zu laden.
- Build mit `tsup` oder `esbuild` (vorhanden: `tsup`); `npm run build:vanilla`; Test, dass das Bundle ohne Framework-Importe auskommt und in Node und Browser lädt; Größenbudget als Test (z. B. ≤ 40 KB min, gzip kleiner).
- Synchronisation für das Portal: ein kleines Skript im Portal-Repo kopiert `dist/vanilla` und `css/` aus dem installierten Paket nach `portal/dss`; die Doku beschreibt den Schritt. Das Portal ist kein Teil dieses Repositorys.

## Doku und Tests
- Neue Docs-Seite `Foundation/Vanilla` (Überblick, Einbindung ohne Build, `data-dss`, Init/Render, Sicherheit, Beispiel „Portal-Seite“) und je Komponentenseite der Code-Tab „Vanilla“ mit **ausführbaren** Beispielen (heute teils nur Hinweise).
- Tests: `init*` mit jsdom/Browser (Tastatur, ARIA, `destroy`, Idempotenz), `render*` Parität gegen React, Escaping-/Sicherheitstests, Bundle-Test, Mutationstests für die neuen Regeln, axe in Storybook mit den Vanilla-Beispielen.
- Unabhängiger Review, Merge, Push wie bei den früheren Paketen.

## Reihenfolge
1. Nach Map, **Paket B (einklappbare Rahmen)** und **Hallenkarte** (Render-Funktionen brauchen die fertigen Komponenten).
2. Paket V1: gemeinsame Grundlagen (`esc`, `safeHref`-Modul, `initAll`, Muster `destroy`), Pagenav, Backtop, Theme, Tabs, Modal, Bündelung und Auslieferung.
3. Paket V2: `render*` für LeagueCard, TeamCard, VenueCard, Spielplan, Table, MatchCard, EmptyState samt Map-Init.
4. Danach Umstellung im Portal (eigenes Repository), beginnend mit dem Ersetzen der Kopie in `portal/dss`.
