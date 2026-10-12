# Plan: Vanilla-Paket abschließen (V1b-Merge, V2a Render-Funktionen, V2b Karte, Auslieferung)

> **Für Umsetzende:** Gesamtentwurf `docs/superpowers/specs/2026-10-11-vanilla-paket-design.md` (Teil 2 und 3), Review der Portal-Bausteine `2026-10-11-portal-bausteine-review.md`, Lückenplan `2026-10-12-luecken-plan.md`. Vorgehen je Paket wie bisher: Worktree, Umsetzung (TDD), unabhängiger Review, Fixes, Merge, Push.

**Ziel:** Das Vanilla-Paket ist fertig, wenn ein statisches Projekt ohne Framework und ohne eigenes Markup-Handwerk alle Bausteine des Portals (Karten, Tabellen, Spielplan, Hallenkarte, Karte) mit dem DSS erzeugen und bedienen kann, mit derselben Optik und denselben Prüfungen wie Svelte/React.

## Stand
- Fertig und gemergt: V1a (Grundlagen, `initAll`, PageNav, BackToTop, Theme, Kennzahlen/Form, Sitz-Marker, `darkTiles`).
- Fertig, im Review: V1b (`initTabs`, `initModal`, Bündel `dist/vanilla`, Doku `Foundation/Vanilla`).
- Offen: V2a, V2b, Auslieferung (Entscheidung), Abschluss.

## Reihenfolge
1. **V1b abschließen:** Review-Befunde beheben, mergen, pushen.
2. **V2a: Render-Funktionen.**
3. **V2b: Karte in Vanilla.**
4. **V3: Auslieferung und Abschluss.**

---

## V2a: `render*` und `mount*`

**Dateien (neu):** `js/render/escape.js` (`esc`, `attr`), `js/render/core.js` (gemeinsame Bausteine: Teamzeile mit Logo/Kurzname, Titel mit Ebene, Form, Live-Tag), `js/render/league-card.js`, `team-card.js`, `venue-card.js`, `schedule.js` (Tabelle und Raster), `table.js`, `match-card.js`, `empty-state.js`, `stats.js`, `index.js` (Sammelexport), je mit `.d.ts`; `js/render/mount.js` (`mount(el, html)` mit `createContextualFragment`, kein `innerHTML`).

**API-Regeln**
- `renderX(props, options?) → string`, gleiche Props wie React/Svelte (Namen, Standardwerte, Grenzen wie `limit`, `titleAs`, `names`, `logos`, `collapsible`, `id`, `open`).
- `mountX(el, props, options?) → { update(props), destroy() }`: setzt das Markup, startet bei Bedarf das Verhalten (`initAccordion` für `collapsible`), `update` ersetzt Inhalt ohne Fokusverlust, soweit möglich.
- Eingaben sind unvertraut: alle Texte laufen durch `esc`, alle URLs durch `safeHref`, Zahlen durch dieselben Prüfungen wie in `js/*.js`; kein Rohmarkup von außen.
- Logik nicht duplizieren: `leagueWindow`, `leagueSummary`, `formLabel`, `venueGames`, `gameKeys`, `scheduleGroups` usw. aus den vorhandenen Modulen.
- Keine Überschrift-Ebene aus dem Kontext (kein `HeadingLevel` in Vanilla): Option `titleAs`, Standard `h3`.

**Aufgaben (in dieser Reihenfolge, je kleine Commits)**
1. Grundlage: `esc`, `attr`, `mount`, Test-Helfer `normalize(html)` (ids, Leerraum, Entitäten) für den Paritätsvergleich gegen `renderToStaticMarkup`.
2. `renderStats`/`renderFormChips` (kleinster Fall, zeigt das Muster), dann `renderEmptyState`, `renderTable`.
3. `renderLeagueCard` (Fenster, Spalten, Zonen, Live, Form, `collapsible`).
4. `renderScheduleTable`/`renderScheduleGrid` (Namen, Logos, vorläufig, Live, Dichten, `collapsible`).
5. `renderMatchCard`, `renderTeamCard`.
6. `renderVenueCard` (Karte als Platzhalter-Markup, das V2b startet; bis dahin Platzhalter mit Adresse und Links).
7. Docs: auf jeder Komponentenseite der Vanilla-Code-Tab mit ausführbarem `renderX`-Beispiel (Markup gegen Svelte und React getestet), Foundation/Vanilla um „Markup erzeugen" erweitern.
8. Bündel: `dist/vanilla` exportiert alle `render*`/`mount*`; Größenbudget prüfen (neues Budget begründen; Bündel in Kern und `render` teilen, falls es zu groß wird: `dss.js` und `dss-render.js`).

**Tests**
- Parität: je Komponente mindestens 8 Fälle (minimal, voll, kompakt, leer, ungültige Zahlen, lange Texte, `titleAs`, `collapsible`), `renderX` gegen `renderToStaticMarkup` der React-Komponente.
- Sicherheit: `"><img onerror>`, `javascript:`, `</script>`, Steuerzeichen, 100 000 Zeichen in jedem Textfeld und jeder URL.
- Verhalten: `mount`/`update`/`destroy` unter jsdom; Accordion-Anbindung; keine Listener übrig.
- Mutationen: mindestens 3 je Funktion (Escaping weglassen, `safeHref` weglassen, Grenze `limit`, Filter `finished`, Fenster-Regel).
- Browser: axe auf den Docs-Seiten, Regression gegen die Svelte/React-Stories (Rechtecke, Stile), Matrix BBV/DBB × hell/dunkel × 1280/420.

**Abnahme:** Jede Komponente, die es in Svelte und React gibt und im Portal vorkommt, hat eine Vanilla-Fassung mit gleicher Ausgabe; Doku zeigt jeweils ein lauffähiges Beispiel.

---

## V2b: `initMap` / `mountMap`

**Aufgaben**
1. `js/map-vanilla.js`: `initMap(el, options) → { update, destroy }` und `renderMap(props)` (Markup wie `MapView`: Region, Sprunglink, Platzhalter, Liste, App-Links, Statuszeile, Zoom-Schaltflächen); nutzt `createMapController`, `mapItems`, `mapLinks`, `validTileUrl`, `safeHref`.
2. Zwei-Klick-Platzhalter, `load="auto"`, `tileUrl`, `privacyNote`, Fehlerfälle (`import`, `init`, `tiles`, `update`), `seatLabel`, `darkTiles`, `interactive`, Hallenkarte (`VenueCard` mit eingebetteter Karte über `renderVenueCard` + `initMap`).
3. Leaflet bleibt ein dynamischer Import (`import('leaflet')`) bzw. wird über eine Option `loadLeaflet: () => Promise<Leaflet>` geladen, damit das Portal Leaflet lokal ausliefert (kein unpkg); Doku-Rezept dazu inklusive `leaflet.css`.
4. `initAll`: `data-dss="map"` mit `data-dss-options` (JSON) für Marker.
5. Doku: Map.mdx und VenueCard.mdx bekommen ausführbare Vanilla-Beispiele (mit Kachel-Route im Test), Datenschutz-Hinweis unverändert.
6. Tests: Parität des Markups (Platzhalter) gegen `MapView` (SSR), jsdom mit Leaflet-Mock (Klick, Fehler, `destroy`), Browser mit lokaler Kachel (Fokus, Tastatur, Marker, Seat, `invert`), axe, Mutationen (Datenschutz: kein Netz vor dem Klick; `validTileUrl`; Aufräumen).

**Abnahme:** Die Hallenkarte und die Karte laufen in einer reinen HTML-Seite ohne Build (`<script type="module">` + lokale Leaflet-Dateien) und erzeugen vor dem Klick keinen Netzverkehr.

---

## V3: Auslieferung und Abschluss

**Entschieden am 2026-10-12: A (GitHub-Release mit `dist/vanilla`). Ab Version 1.0 wechselt die Auslieferung auf npm (B);** das Release-Skript und `portal-sync` werden so gebaut, dass der Wechsel nur die Quelle ändert (Release-Anhang → npm-Paket), nicht den Aufbau von `dist/vanilla`. Ursprüngliche Optionen:
- **A: GitHub-Release/Tag mit `dist/vanilla`** (Tarball oder Dateien), das Portal lädt eine feste Version herunter (Skript `portal-sync`). Kein npm-Konto nötig, `dist` muss nicht im Git sein. *(meine Empfehlung)*
- **B: npm-Paket.** Sauberste Installation, braucht Veröffentlichung und Namen.
- **C: Git-Dependency mit `prepare`.** Bauen im Portal (braucht `tsup`/`esbuild` als Abhängigkeit, schwächer).

**Aufgaben**
1. `prepare`/`build` robust machen (Review V1b prüft, ob `prepare` bei Git-Dependency ohne devDependencies scheitert).
2. Release-Ablauf: `npm run build`, Prüfsummen, `dist/vanilla` als Release-Anhang (A) bzw. `npm publish --dry-run` (B); Skript `scripts/release.mjs`; Versionsnummer `VERSION` im Bündel stimmt mit `package.json` und `dss.css` überein (Test).
3. `portal-sync.mjs` auf die gewählte Auslieferung ausrichten und gegen ein Beispielprojekt laufen lassen.
4. Foundation/Vanilla: „Einbinden", „Aktualisieren", Versionsabgleich, CSP, Datenschutz (Leaflet lokal).
5. Abschluss-Review über das ganze Vanilla-Paket: Größen, Exportliste (Snapshot), alle Docs-Seiten (axe), Firefox/WebKit-Probe für Bündel und Kernbausteine (aus Lückenplan 2.1), Beispiel-Portalseite als End-to-End-Test (reines HTML mit allen Bausteinen), CHANGELOG, README.

**Abnahme (Vanilla-Paket abgeschlossen):** Eine Beispielseite im Repo (`stories/examples/portal-seite/`) baut Vereinsseite und Teamseite nur mit `dist/vanilla` und `dss.css` nach (Ligakarte, Teamkarte, Spielplan, Hallenkarte, Seitennavigation, Tabs, Theme); axe ist sauber; sie läuft in Chromium, Firefox und WebKit; die Auslieferung nach Entscheidung A/B/C ist dokumentiert und einmal real getestet.

## Risiken
- **Bündelgröße:** `render*` + `initMap` können das Budget (40 KB min) sprengen → Aufteilung in Kern und Render-Bündel, Budget je Datei.
- **Parität zu drei Fassungen:** jede Änderung an Svelte/React/Vanilla muss in allen dreien landen → Paritätstests sind Pflicht, nicht optional.
- **Zeit/Limits:** Lange Pakete laufen in die API-Limits; Fortsetzung per `SendMessage` hat bisher alle Stände erhalten.
