# Changelog

Alle nennenswerten Änderungen an diesem Design System werden hier dokumentiert.
Versionierung folgt [Semantic Versioning](https://semver.org/).

## [Unveröffentlicht]

### Geändert (Bruch)

- **Standardsprache Englisch für Vanilla und die gemeinsame Logik (`js/*.js`, `render*`, `init*`, `mount*`, Karte):** Wer deutsche Texte will, importiert einmal `hoops-i18n-de.js` (bzw. `@hoopsfoundry/ui/i18n/de`) und ruft `setLocale('de')` auf. Svelte und React folgen (I3); bis dahin bleiben ihre fest eingebauten Texte deutsch, die der gemeinsamen Logik folgen der gewählten Sprache.
- **`hoops-map.js` und `hoops-render.js` importieren den Sprachkern aus `hoops.js`** desselben Ordners; die Karte braucht `hoops.js` daneben. Bündelgrößen (min): Kern 48 155 B (vorher 37 164 B), Render 57 396 B (51 312 B), Karte 25 496 B (22 053 B).

### Hinzugefügt

- **Sprache in Vanilla:** `setLocale`, `getLocale`, `registerLocale`, `setTexts`, `t`, `availableLocales` in `hoops.js`; Ereignis `hoops:localechange`; Optionen `locale` und `texts` bei `render*`, `init*`, `mount*`; `lang` an der Wurzel bei abweichender Sprache; Bündel `hoops-i18n-de.js` (6 633 B min).

- **Internationalisierung, Infrastruktur (noch ohne Wirkung auf die Komponenten):** `@hoopsfoundry/ui/i18n` (Kern mit `t`, `setLocale`, `registerLocale`, `setTexts`, `subscribe`), `@hoopsfoundry/ui/i18n/format` (`formatNumber`, `formatCoords`), die Kataloge `@hoopsfoundry/ui/i18n/en` und `@hoopsfoundry/ui/i18n/de` (168 Schlüssel je Sprache; `de` registriert sich beim Import), das Prüfskript `scripts/check-i18n.mjs` und das Inventar der festen Texte. Die Komponenten bleiben in dieser Fassung deutsch und unverändert; die Verdrahtung und der Wechsel der Standardsprache auf Englisch folgen später. Siehe ADR-012.
- **Deploy:** Bei geändertem SSH-Host-Schlüssel des Webspace gibt `deploy-webspace.yml` eine Anleitung aus (Fingerprint prüfen, Secret `DEPLOY_KNOWN_HOSTS` erneuern); die strenge Prüfung bleibt.

### Geändert

- **TopBar:** Der Standardtext der Marke (`brand`) ist jetzt „Hoops“ statt „HoopsFoundry UI“ (Svelte und React); die TopBar bleibt schmaler. Wer den alten Text will, übergibt `brand="HoopsFoundry UI"`.
- **Deploy:** Die Content-Security-Policy der Doku-Seite ist scharf (`Content-Security-Policy` statt `Report-Only`, gleicher Inhalt); alle 588 Storybook-Einträge laden in Chromium ohne Verstoß. Die Kartenkacheln (`tile.openstreetmap.org`) sind in `img-src` ausdrücklich erlaubt, weil der Platzhalter `*.tile…` den Host ohne Unterdomäne nicht abdeckt.
- Doku: Beschreibende Sätze in Button, Tabelle und Kartenbibliothek sprechen nicht mehr vom „Spielbericht“.

## [0.10.0] — 2026-10-17 — Umbenennung auf HoopsFoundry UI, Marken-Rollen und DBB-Marke

### Hinzugefügt

- **Auslieferung:** Workflow `deploy-webspace.yml` (Storybook per rsync auf den Webspace, bei Push auf `main`, manuell mit Probelauf als Standard), `deploy/htaccess` (HTTPS, Header, CSP als Report-Only), Workflow `publish-npm.yml` (npm per Trusted Publishing beim Push eines Tags `v*`: gestuft bereitstellen, Freigabe mit 2FA auf npmjs.com, ohne Token). GitHub Pages (`deploy-storybook.yaml`) ist nur noch der manuelle Rückfall. Siehe ADR-009.
- **Projektkonfiguration:** `project.config.json` als eine Quelle für Repo, Domain, Release-Adresse und Paketname; `hoops-sync` liest die Release-Adresse aus `--base-url`, der Variablen `HOOPS_UI_BASE_URL` oder dem eingebauten Wert. Siehe ADR-010.

### Behoben

- `safeHref` lehnt protokoll-relative Ziele ab (`//host`, `/\\host`); sie führten auf einen fremden Host. Wer so ein Ziel braucht, gibt den vollen `https://`-Link an.
- **Welle 1 des Lückenplans (Verhaltensparität):** Das **Svelte-Modal** startet `initModal`: Fokus ins Modal, Fokusfalle, Fokusrückgabe an den Auslöser, Seite dahinter `inert`, Scroll-Sperre; das Schließen-Symbol ist `aria-hidden`. Das **React-Modal** gibt den Fokus beim Schließen an das Element zurück, das ihn beim Öffnen hatte. **Tabs** in Svelte und React: Pos1/Ende über die gemeinsame `nextTab`-Logik. **MatchCard:** der Trikotpunkt hat einen Rand in `--hoops-mute` (im Dunkelmodus vorher 1,57:1 bis 2,66:1 gegen die Fläche). **Karte:** Schaltfläche „Erneut versuchen“ nach Ladefehlern (`hoops-map-retry`, alle drei Fassungen; `role="status"` bleibt; `load` wird weiter nur beim Start gelesen, dokumentiert), bei `interactive={false}` entfallen die Zoom-Schaltflächen (der Tastaturzoom bleibt, die Hallenkarte hat keine Tab-Stopps mehr in der Karte). **VenueCard:** Kurznamen folgen der Kartenbreite (Container-Abfrage) statt der Fensterbreite. **Storybook:** die Select-Stories zeigten „e.subscribe is not a function“, weil die Prop `state` in `SelectDemo.svelte` die Rune `$state` zum Store-Zugriff machte (umbenannt, Regressionstest). Siehe ADR-011; ersetzt die Zeile „Bekannte Lücken der Framework-Modals“ weiter unten.

- `package-lock.json` ergänzt um `@emnapi/core` und `@emnapi/runtime` (npm lässt sie auf macOS aus, `npm ci` auf Linux brach in GitHub Actions ab).

### Geändert (Bruch)

- **Umbenennung des Systems: aus DSS wird HoopsFoundry UI.** Paket `@bbv/dss-design-system` → `@hoopsfoundry/ui` (Version 0.10.0), Repository `HoopsFoundry/ui`, Doku `ui.hoopsfoundry.com`. Alle Bezeichner wechseln das Präfix von `dss` auf `hoops` (ohne Kompatibilitätsschicht):
  - **Klassen (Stufe K):** Familienregel `dss-<name>` → `hoops-<name>`, zum Beispiel `dss-btn--sm` → `hoops-btn--sm`, `dss-acc-trigger` → `hoops-acc-trigger`, `dss-sr-only` → `hoops-sr-only`. Zustandsklassen (`is-open`, `is-active`) bleiben. Auch zusammengesetzte Namen (`dss-${x}`) und Selektoren in Skripten sind betroffen.
  - **Attribute, Ereignisse, Schlüssel, Dateien (Stufe D):** `data-dss` → `data-hoops`, `data-dss-options` → `data-hoops-options`, `data-dss-acc` → `data-hoops-acc`, `data-dss-modal-open/-close/-focus` → `data-hoops-modal-open/-close/-focus`; Ereignisse `dss:tabchange`, `dss:modalopen`, `dss:modalclose` → `hoops:…`; Speicherschlüssel `dss-theme` → `hoops-theme`; `Symbol.for('dss.registry')` → `hoops.registry`; Dateien `dss.js`, `dss.min.js`, `dss.d.ts`, `dss.css`, `dss-render.*`, `dss-map.*` → `hoops.*`, `hoops-render.*`, `hoops-map.*`; Befehl `dss-sync` → `hoops-sync` (Release-Anhang `hoops-sync.mjs`); Marker `.dss-sync`, `.dss-release` → `.hoops-sync`, `.hoops-release`; Release-Tarball `dss-vanilla-<version>.tgz` → `hoops-ui-<version>.tgz`; Zielordner des Portals `_site/dss` → `_site/hoops`.
  - **Marke (Stufe M):** Texte, Doku, arc42 und Storybook sprechen von „HoopsFoundry UI“; die Abkürzung DSS entfällt. Die historischen Design-Entwürfe liegen unverändert in `docs/entwuerfe/`. Neu: `LICENSE` (MIT).
- **Migration:** `hoops-migrate` (`node scripts/migrate-from-dss.mjs <projektordner>`) kennt jetzt die Stufen T, D und K (`--stufen=T,D,K`, Standard alle); Probelauf ist der Standard. Neue Prüfungen: `tests/no-dss.test.ts` (kein alter Name im Bestand außer begründeter Allowlist), `tests/codemod-names.test.ts`; Werkzeuge: `scripts/codemod-names.mjs`, `scripts/lib/name-rename.mjs`.

- **Umbenennung der Design-Tokens, Stufe T von DSS auf HoopsFoundry UI:** Alle eigenen CSS-Custom-Properties tragen jetzt das Präfix `--hoops-`. `--dss-foo` wird `--hoops-foo` (auch `--_dss-foo` zu `--_hoops-foo`), bisher unpräfixierte Tokens wie `--n-0`, `--ink-600`, `--ring-w`, `--radius-md`, `--fs-h3`, `--font-display`, `--amber-500` werden `--hoops-n-0`, `--hoops-ink-600`, `--hoops-ring-w` usw. Eine Kompatibilitätsschicht gibt es nicht. Werte, Markup und Darstellung bleiben gleich (nachgewiesen mit `scripts/check-style-parity.mjs`: berechnete Stile und Rechtecke aller Stories, Marken BBV und DBB, hell und dunkel, 1280 und 420 px). Klassen (`dss-*`), data-Attribute, Dateinamen und Paketname ändern sich erst in den folgenden Stufen.
- **Ersetzungstabelle (Auszug, vollständig in `scripts/migration-table.mjs`, 302 Namen):**
  - Regel `--dss-<name>` → `--hoops-<name>`: `--dss-fg` → `--hoops-fg`, `--dss-surface-2` → `--hoops-surface-2`, `--dss-chip-ok-fg` → `--hoops-chip-ok-fg`, `--dss-map-h` → `--hoops-map-h`, `--dss-title-size` → `--hoops-title-size`, `--dss-acc-gap` → `--hoops-acc-gap`, `--dss-version` → `--hoops-version`.
  - Regel `--<name>` → `--hoops-<name>`: `--ink-0` … `--ink-1000`, `--amber-*`, `--sky-*`, `--gold-*`, `--orange-*`, `--n-0` … `--n-1000`, `--base-*`, `--signal-*`, `--cool-*`, `--action-*`, `--indicator`, `--ok-fill` u. a., `--ring-w`, `--ring-style`, `--ring-color`, `--radius-sm` … `--radius-full`, `--shadow-sm` … `--shadow-xl`, `--space-*`, `--fs-*`, `--lh-*`, `--ls-*`, `--fw-*`, `--font-display`, `--font-body`, `--font-mono`, `--page-bg`, `--page-fg`, `--page-line`, `--live-fill`, `--league-zone`.
  - Kollision aufgelöst: `--surface-0`, `--surface-1`, `--surface-2` (Seitenflächen) → `--hoops-page-surface-0` bis `-2`, weil `--dss-surface-2` (Komponentenfläche, im Dunkelmodus anderer Wert) bereits `--hoops-surface-2` wird.
  - Unverändert bleiben fremde Variablen (Leaflet, Tailwind `--tw-*`, Storybook). Namen der Konsumenten bleiben nur, wenn sie anders heißen als unsere: ein eigener Name, der zufällig genauso lautet (zum Beispiel `--fs-h1` oder `--space-4`), wird vom Migrationsskript mit umbenannt. Deshalb immer zuerst den Probelauf prüfen. Die Variable `--d` (nur in einer Story) steht nicht in der Tabelle. Tailwind-Farbnamen (`ink`, `amber` …) im Preset bleiben, die Werte verweisen auf `var(--hoops-…)`.
- **Migration für Konsumenten:** `node scripts/migrate-from-dss.mjs <projektordner>` (im npm-Paket als Befehl `hoops-migrate`) meldet im Probelauf (Standard) die Treffer je Datei, `--write` schreibt (CSS, SCSS, HTML, JS, TS, JSX, TSX, Svelte, Vue, MDX, Markdown; ignoriert `node_modules`, `.git`, `dist`, `build`). Dateien, die kein gültiges UTF-8 sind (zum Beispiel Latin-1), Symlinks, Binär- und Dateien über 5 MiB werden nie verändert, sondern in der Ausgabe genannt; unbekannte Optionen ergeben einen Fehler. Vorher den Git-Stand sichern; zurücknehmen mit `git restore .`. Ein zweiter Lauf findet nichts mehr. Spätere Stufen erweitern die Tabellen in `scripts/migration-table.mjs`.
- **Neue Prüfungen:** `tests/token-prefix.test.ts` verbietet unpräfixierte und alte (`--dss-`) Custom-Properties in CSS, Svelte, React, JS, Doku und Tests (begründete Allowlist für Fremdes); `tests/codemod-tokens.test.ts` und `tests/migrate-from-dss.test.ts` sichern Codemod und Migrationsskript mit Mutationstests. `scripts/check-style-parity.mjs` ist für die späteren Stufen wiederverwendbar. Architektur: ADR-008.

### Neu

- **Vanilla-Paket V3, Auslieferung und Abschluss:** `scripts/release-vanilla.mjs` erzeugt aus `dist/vanilla` das Release (`release/dss-vanilla-<version>.tgz` mit `fonts/` und `version.json`, `.sha256` und `.tgz.sha256` im Format von `sha256sum`, `manifest.json` mit Größen in KiB, Budgets, Abhängigkeiten und Leaflet-Hinweis, dazu `dss-sync.mjs` mit `dss-sync.mjs.sha256`); es prüft vorher, dass `package.json`, `VERSION` in allen sechs Bündeldateien und `--dss-version` in `dss.css` gleich sind und jedes Bündel sein Budget einhält (`--dry-run`, `--allow-dirty`, `--no-build`, `--no-sourcemaps`, `--expect-version`, `--debug`), räumt bei Fehlern auf und ersetzt ein vorhandenes Ausgabeverzeichnis nur mit Marker `.dss-release` oder wenn es leer ist. Der Tarball ist auf derselben Plattform und Node-Version byte-gleich (feste Reihenfolge, Zeitstempel 0, gzip-Kopf mit Betriebssystem-Byte 3); andere zlib-Versionen können abweichen, maßgeblich ist die veröffentlichte `.sha256`. Die Größenbudgets stehen jetzt an einer Stelle (`scripts/vanilla-budgets.mjs`). Neuer Workflow `.github/workflows/release-vanilla.yml` (Tag `v*` oder manuell mit `dry_run`; strenge Versionsprüfung, Tag-Commit auf `main`, Aktionen mit Schreibrecht auf Commits festgelegt, Zeitlimits; bis zum ersten Tag ungetestet; Build-Provenance als Kommentar vorbereitet). `portal-sync.mjs` ist jetzt Teil des Produkts (`scripts/portal-sync.mjs`, Hilfen in `scripts/lib/`, Befehl `dss-sync`, Export `./portal-sync.mjs`, Release-Anhang `dss-sync.mjs` als gebündelte Einzeldatei) mit den Quellen `--from-release <version>` (https, Weiterleitungen nur auf denselben Host, Stromzählung ab 32 MiB, Zeitgrenzen, SHA-256 des Tarballs und jeder Datei, Version, Archivinhalt gegen `..`, absolute und Windows-Pfade, Verknüpfungen und doppelte Einträge), `--from-package` und `--from-dir`; das Ziel bleibt bei jedem Fehler unverändert (altes Ziel zurückrollen, Sperrdatei gegen gleichzeitige Läufe), Systemfehler erscheinen auf Deutsch (`--debug` zeigt den Stack), Node 18 oder neuer (geprüft mit 18.20.8, 20.20.2 und 22.21.0); ab Version 1.0 ist npm nur ein weiteres `--from-package`. Neue Beispielseite `stories/examples/portal-seite/` (Vereins- und Teamseite aus einem JSON-Datensatz, nur `dist/vanilla`, `dss.css` und lokales Leaflet, relative Pfade, `noscript`) mit `scripts/check-portal-seite.mjs` (Release → `dss-sync.mjs` → strenge CSP, Tastatur, 320 px, Unterpfad, ohne JavaScript, axe in BBV/DBB × hell/dunkel × 1280/420 px; Chromium und WebKit bestanden, Firefox nicht gelaufen). Doku: `Foundation/Vanilla` um „Einbinden aus dem Release“, „Aktualisieren“, „Kompatibilität“ und „Wechsel auf npm ab 1.0“ ergänzt.
- **Segmentierte Tabs (`dss-tabs--segmented`) brechen bei schmalem Raum um** (`flex-wrap: wrap; max-width: 100%`): bei 320 px Breite waren drei Schalter mit Zähler 337,6 px breit und verbreiterten die Seite (Teamseite der Beispiel-Portalseite: `scrollWidth` 354 bei 320 px, WCAG 1.4.10). Bei 1280 und 420 px sind alle Tabs-Varianten unverändert (Rechtecke gemessen).
- **`initPageNav`: Beschriftung ohne versteckte Teile:** `labelOf` lässt Teile mit `aria-hidden="true"` weg (Kurzname neben dem vollen Namen in Mannschaftsüberschriften); vorher stand „TSV Nordhain 1920Nordhain“ in der Navigation.

- **Vanilla-Paket V2b, Karte ohne Framework (`renderMap`, `initMap`, `mountMap`):** `js/map-vanilla.js` (Export `./map-vanilla.js`, Typen `map-vanilla.d.ts`) und das Bündel `dist/vanilla/dss-map.js` (`dss-map.min.js`, Quellkarten, `dss-map.d.ts`, Export `./vanilla-map`) bedienen die Karte und die Hallenkarte auf einer reinen HTML-Seite ohne Build. `renderMap(props, options?)` liefert dasselbe Markup wie `MapView` und `Map` im Server-Rendering (Parität in 20 Fällen gegen React und Svelte, „Karte laden“ bedienbar); `initMap(el, options) → { update(props), destroy() }` macht vorhandenes Markup lebendig (Zwei-Klick-Platzhalter, `load: 'auto'`, `tileUrl`, `privacyNote`, Fehlergründe `tile-url`, `import`, `init`, `update`, `tiles` mit Statuszeile, `seatLabel`, `darkTiles`, `interactive`, Zoom-Schaltflächen mit `aria-disabled`, Fokus auf die Kartenfläche nach dem Klick); `mountMap(el, props, options?)` setzt `renderMap` ein (Styles über das CSSOM, `style-src 'self'` genügt) und startet `initMap`. `update` hält die Marker-Identität über die `id`, gleiche Liste ersetzt nichts und der Fokus in der Liste bleibt; `destroy` räumt die Leaflet-Karte (`map.remove()`), den Klick-Listener und den `ResizeObserver` ab und stellt Markup und Attribute wieder her; mehrfaches `init` für dasselbe Element ersetzt das erste (`createRegistry('map')`); der Import greift nicht auf `window` oder `document` zu (Node, SSR). **Leaflet bleibt außerhalb des Bündels:** Option `loadLeaflet: () => Promise<Leaflet>` (neu auch in `createMapController`, Hook `loadLeaflet`); Standard `import('leaflet')` (Bundler oder importmap); ein Lader, der etwas anderes als Leaflet liefert, ergibt den Grund `import`. **Hallenkarte:** `mountVenueCard(el, props, { initMap, loadLeaflet, onLoad, onError, onMarkerClick })` startet die eingebettete Karte (nicht interaktiv, ohne Liste wie die Komponente), `update` lässt die laufende Karte stehen, solange Koordinaten und Name gleich bleiben, `destroy` räumt sie auf; ohne `initMap` bleibt „Karte laden“ gesperrt; `renderVenueCard(props, { init: true })` markiert die Karte mit `data-dss="map"` und JSON-Optionen für `initAll`. **`initAll`:** `data-dss="map"` (sieben Bausteine); die Karte gehört nicht zum Kern, `initAll(document, { map: { start: initMapBlock } })` bindet sie an (ein leerer Behälter wird per `mountMap` zur Karte, vorhandenes Markup per `initMap`; Optionen aus `data-dss-options`, Prototyp-Schlüssel gefiltert). **Sicherheit:** Props nie roh in Markup, Klassen oder Objekt-Lookups (Aufzählungen `load`, `darkTiles`, `kind`, `appLinks` gegen feste Listen, Texte als `textContent` oder durch `esc`/`attr`, Ziele durch `safeHref`, `className` nur als Klassen-Tokens); neue gemeinsame Datei `js/render/dom.js` (CSSOM-Styles, eindeutige ids) ohne Abhängigkeit vom Accordion. **Bündel:** `dss-map.min.js` 21,7 KiB, gzip 8,9 KiB (Budget 24 KiB und 10 KiB als Test, eigenes Bündel, weil Karte und Leaflet-Anbindung das Render-Budget gesprengt hätten); Render-Bündel 50,2 KiB und 17,1 KiB (Budget 52 KiB und 18 KiB), Kern 36,3 KiB und 12,9 KiB (Budget 40 KiB und 15 KiB). **Tests:** Parität gegen React-SSR und Svelte-SSR, die gemeinsamen Karten-Szenarien laufen jetzt auch gegen Vanilla, jsdom-Verhalten (Klick, Fehler, `destroy`, `update`, Mehrfach-`init`, Unmount während des Imports, Listener, Beobachter, CSSOM), Sicherheit am lebenden DOM, 34 Mutationen, Bündel; `scripts/check-map-browser.mjs` prüft in Chromium und WebKit: Platzhalter ohne Netzverkehr (keine Anfragen an Leaflet oder Kachelserver, keine Cookies, kein Storage, kein Prefetch), Klick, Tastatur (Pfeile, Plus/Minus, Marker, Tab verlässt die Karte), mehrere Karten, Karten in geschlossenem Accordion, Tabs und Dialog (`invalidateSize`), Lader (importmap, `window.L`, 404), Aufbau und Abbau 5 gegen 45 Zyklen (Knoten, Listener, Heap stabil), axe in BBV/DBB × hell/dunkel × 1280/420 px und der Vergleich der Rechtecke und Stile mit der React-Fassung. **Doku:** `Components/Map`: Abschnitt „Ohne Build einbinden“ (Leaflet lokal statt unpkg, drei Wege, ganze Seite, Kachel-Proxy mit Verweis auf ADR-003, Handy-Vorschauen, ein neues Do/Don't), `Components/VenueCard`: Hallenkarte mit lebendiger Karte, `Foundation/Vanilla`: Abschnitt „Karte“; Beispielseite `stories/examples/karte-ohne-build/index.html`.

- **Vanilla-Paket V2a, Markup aus Daten (`renderX`, `mountX`):** für LeagueCard, TeamCard, VenueCard, ScheduleTable, ScheduleGrid, Table, MatchCard, EmptyState, StatGrid und FormChips gibt es Funktionen, die dasselbe Markup wie die Svelte- und React-Komponenten erzeugen: `renderX(props, options?) → string` (läuft in Node und im Browser) und `mountX(el, props, options?) → { update(props), destroy() }` (Einsetzen per `createContextualFragment`, nie über eine HTML-Eigenschaft; Accordion-Verhalten bei `collapsible`; `update` hält Fokus und Zustand offen/zu; `destroy` stellt den früheren Inhalt wieder her). Module `js/render/{escape,core,mount,stats,empty-state,table,league-card,schedule,match-card,team-card,venue-card,index}.js` mit Typen, Exporte `./render.js` und `./render/*.js`. **Sicherheit:** alle Texte durch `esc`, Attribute durch `attr`, Ziele und Logos durch `safeHref`, Aufzählungen nur mit bekannten Werten, Zahlen nur endlich (die Komponenten zeigen sonst „NaN“), kein Rohmarkup von außen (`actions`, `extra`, `time`, `notice` sind Daten oder Text), Spaltenbreiten nur als Länge. Die Logik kommt aus `league.js`, `schedule.js`, `team.js`, `venue.js`, `periods.js`, `stats.js`, `heading.js` und `map.js`; Unterschiede zu den Komponenten sind benannt: kein `HeadingLevel`-Kontext (`titleAs`, Standard h3), `renderTable` nimmt Zeilen als Daten statt Snippets, EmptyState-`icon` ist die Sprite-ID wie in Svelte (`i-calendar`). **Hallenkarte:** `renderVenueCard` liefert die Karte als Platzhalter-Markup (Region, Hinweis, „Karte laden“ gesperrt, Statuszeile, Ortsliste, Links) ohne Leaflet und ohne Netzverkehr; lebendig wird sie mit `initMap` (V2b: `mountVenueCard(el, props, { initMap })`, `options.mapActive` gibt die Schaltfläche ohne Anbindung frei). **CSP:** `mountX` wendet die `style`-Attribute der Render-Funktionen über das CSSOM an (`style-src 'self'` genügt); wer `renderX` selbst einsetzt, braucht `style-src-attr 'unsafe-inline'`. **Review:** `outcome` des letzten Spiels der TeamCard nur als S, N oder U (XSS behoben), Fokus im Shadow DOM, Scrollposition, gleiches Markup ersetzt nichts, ids aus der gesamten Eingabe mit seitenweitem Zähler, `initAccordion` über `createRegistry('accordion')` (Kopien teilen das Register), `VERSION` im Render-Bündel, `mapHeight` höchstens 2000. **Bündel:** neue Datei `dist/vanilla/dss-render.js` (und `.min.js`, Quellkarten, `dss-render.d.ts`, Export `./vanilla-render`) mit eigenem Budget (gemessen 50,2 KiB min, 17,1 KiB gzip; Budget 52 KiB und 18 KiB als Test); sie importiert das Accordion-Verhalten aus `dss.js` bzw. `dss.min.js` im selben Ordner, der Kern bleibt unverändert (36,3 KiB, 12,9 KiB gzip, Budget 40 KiB und 15 KiB). `parity.manifest.json`: Eintrag `vanilla` für die zehn Komponenten. **Tests:** Parität je Komponente gegen Svelte-SSR und React-SSR (mindestens neun Fälle, normalisiert über `tests/helpers/render-normalize.ts`), Sicherheit (Schadtext, `javascript:`, Steuerzeichen, 100 000 Zeichen, Prototyp-Schlüssel in jedem Feld am geparsten DOM), `mountX` unter jsdom (Fokus, Zustand, Accordion, Listener), Mutationstests für Escaping, `safeHref`, Grenzen, Filter und Fensterregel. **Doku:** Abschnitt „Markup erzeugen“ auf `Foundation/Vanilla`, ausführbarer Vanilla-Code-Tab „… aus Daten“ auf den Seiten LeagueCard, TeamCard, VenueCard, Spielplan, Table, Card Library, EmptyState und Kennzahlen (die Beispiele laufen im Test gegen die Komponenten).

- **Review V1b:** Das späte native `close`-Ereignis eines Dialogs zählt nicht mehr, wenn das Modal inzwischen wieder offen ist (`open, close, open` im selben Tick; ebenso `open()` auf ein extern per `showModal` geöffnetes Dialog). Gestapelte Modals ohne `<dialog>` funktionieren: geschlossene Modal-Wurzeln werden nicht inert, das zweite bekommt den Fokus, das Schließen des obersten gibt das darunter frei (ein vorhandenes `inert` an der eigenen Wurzel wird beim Öffnen entfernt und danach wiederhergestellt). Ist der Auslöser beim Schließen entfernt oder verborgen, bekommt die Fläche des darunter offenen Modals den Fokus, sonst `main`. Die Fokusfalle führt Tab und Umschalt+Tab selbst (in WebKit sprang der Fokus aus dem Dialog; Tab von der Fläche geht auf das erste, Umschalt+Tab auf das letzte Element). Warnung in der Konsole für ein Modal ohne zugänglichen Namen; `touchstart` ist passiv; im Druck gilt die Scroll-Sperre nicht. `initTabs` mit `hash` öffnet umgebende Accordion-Bereiche, einklappbare Rahmen und `<details>` (`revealAround`). Die Register der Bausteine (`createRegistry(name)`) teilen sich über `Symbol.for('dss.registry')` alle Kopien auf einer Seite, ein zweites `init` ersetzt also auch das einer anderen Kopie. `checkVersion({ warn: true })` meldet eine Abweichung mit `console.warn`. `package.json`: `sideEffects: ["**/*.css"]` (ein Test prüft, dass kein Modul beim Import etwas ändert) und die React-Peers `^18.0.0 || ^19.0.0` (im leeren Projekt behebt das den `ERESOLVE` bei `npm install` mit Radix und React 19; Rauchtest mit React 19.3). `portal-sync.mjs`: baut in einem temporären Nachbarordner und benennt um, schreibt die Marker-Datei `.dss-sync`, löscht nie ein fremdes, nicht leeres Ziel, nie das Projekt-Root, einen Elternordner oder `node_modules`, kopiert Leaflet nur, wenn es installiert ist (`leaflet: 'auto'`), und setzt beim Direktaufruf einen Fehlercode statt eines halben Ziels. Doku: `file://` braucht einen Server, Budget-Polster, das Bündel teilt sich V2, das Zielverzeichnis gehört dem Paket.

- **Vanilla-Paket V1b, Tabs und Modal:** `initTabs(root, options)` (`@bbv/dss-design-system/tabs.js`, Typen `tabs.d.ts`) und `initModal(root, options)`, `openModal(el)`, `closeModal(el)` (`…/modal.js`) für vorhandenes Markup, beide nach dem Muster `{ destroy() }`, idempotent, ohne `innerHTML`. **Tabs:** dieselben Tastaturregeln wie die Svelte- und React-Tabs (Pfeile in Richtung der Leiste wählen sofort, gesperrte übersprungen, Umlauf am Rand, roving `tabindex`; ein Test vergleicht die Tastenfolgen aller drei Fassungen), dazu Pos1/Ende, `activation: 'manual'`, RTL, senkrechte Leiste, Panels über `aria-controls` (`hidden` und `inert`, fehlende Rollen und ids werden ergänzt), `role="group"` mit `aria-pressed` als Mehrfachauswahl, Deep-Link `hash` (Tab, Panel oder Element im Panel), Ereignis `dss:tabchange`; die reine Funktion `nextTab` gibt es einzeln. **Modal:** natives `<dialog class="dss-modal-dialog">` (`showModal`; CSS `dialog.dss-modal-dialog` und `::backdrop` in `components.css`) oder Markup mit `hidden` (Rolle `dialog`, `aria-modal`, Geschwister `inert`); Fokus auf `data-dss-modal-focus`, sonst die Fläche, und beim Schließen zurück an den Auslöser; Escape (außer `closable: false`); Fokusfalle (Tab und Umschalt+Tab); `dismissOnBackdrop` (Standard aus, Mausdruck im Modal und Loslassen außen schließt nicht); Scroll-Sperre mit Rückbau (zählend bei mehreren Modals); gestapelte Modals (nur das oberste reagiert); Auslöser `data-dss-modal-open="<id>"` und `data-dss-modal-close`; Ereignisse `dss:modalopen`, `dss:modalclose`; fehlende Beschriftung (`aria-labelledby`) wird aus dem Titel ergänzt. `snapshotAttributes` in `js/lifecycle.js` stellt beim `destroy()` geänderte Attribute wieder her.
- **`initAll` und `data-dss` kennen `tabs` und `modal`** (sechs Bausteine, mehrere Elemente je Baustein, Optionen je Element); `DSS_BLOCKS` und die Typen sind erweitert.
- **Bündelung und Auslieferung:** `npm run build:vanilla` (`scripts/build-vanilla.mjs`, tsup) schreibt `dist/vanilla/dss.js` (ES-Modul), `dss.min.js`, Quellkarten, `dss.d.ts` (zusammengeführt), `dss.css` (`tokens.css` plus `components.css`, mit `--dss-version`) und `courtlines/`. Export `./vanilla` (Bündel mit Typen), `./vanilla/*` (Dateien), `./tabs.js`, `./modal.js`; `prepare` ruft `npm run build` (`build:react` plus `build:vanilla`), `build:react` ist unverändert. Das Bündel hat keine Abhängigkeiten und enthält weder Framework noch Leaflet noch die Karte; `VERSION`, `cssVersion()` und `checkVersion()` gleichen JavaScript und CSS ab. Gemessen: `dss.min.js` 36,1 KB (gzip 12,9 KB), Budget als Test 40 KB und 15 KB. Beispiel `stories/examples/portal-sync.mjs` (kopiert `dist/vanilla`, Schriften und Leaflet nach `_site`; im Portal-Repository ist nichts geändert).
- **Doku:** neue Seite `Foundation/Vanilla` (Einbindung ohne Build, `data-dss`, Muster, Sicherheit, CSP, Größen, Kopieren, Versionsabgleich, Exportliste); `Components/Tabs` und `Components/Modal` haben ausführbare Vanilla-Code-Tabs (Markup gegen die Ausgabe der Komponenten geprüft), Abschnitte „Ohne Framework“, Handy-Vorschauen und je ein neues Do/Don't. Die Tabelle „Verhalten je Fassung“ des Modals hat eine Vanilla-Spalte.
- **Bekannte Lücken der Framework-Modals (überholt: mit Welle 1 geschlossen, siehe „Behoben“ oben; ursprünglicher Stand):** Das Svelte-Modal holt den Fokus nicht in das Modal, hat keine Fokusfalle, gibt den Fokus beim Schließen nicht zurück, schaltet die Seite dahinter nicht ab und sperrt das Scrollen nicht; das React-Modal (Radix) holt den Fokus und hat Falle, Abschaltung und Sperre, gibt den Fokus beim Schließen aber nicht an den Auslöser zurück (kein Radix-Trigger, der Fokus fällt auf `body`). Pos1/Ende gibt es in den Svelte- und React-Tabs nicht. Das Symbol im Schließen-Knopf des Svelte-Modals hat kein `aria-hidden` (der Knopf hat einen Namen, kein Befund). Ein Angleichen ist eine eigene Entscheidung.
- **Vorgemerkt für V2:** `initMap(el, options)` (Platzhalter-Markup, `createMapController`, Zwei-Klick, `tileUrl`, Fehlerfälle wie `MapView`) wurde nicht gebaut: die Karte hat Markup mit Zoom, Liste, App-Links und Statuszeilen, das ein eigenes Paket wert ist; Leaflet bleibt ein dynamischer Import in `js/map-leaflet.js`.
- **Vanilla-Paket V1a, Grundlagen:** gemeinsame Hilfen für Bausteine ohne Framework. `reducedMotion()` (jetzt in `js/motion.js`, `@bbv/dss-design-system/motion.js`; `map-leaflet.js` exportiert sie weiter), `safeHref` (jetzt in `js/url.js`, `@bbv/dss-design-system/url.js`; `map.js` exportiert sie weiter), das Muster `initX(root, options) → { destroy() }` mit Hilfen in `js/lifecycle.js` (`createHandle`, `createRegistry`, `listen`) und `initAll(scope, options)` in `js/vanilla-core.js` (`@bbv/dss-design-system/vanilla-core.js`), das alle Elemente mit `data-dss="accordion|pagenav|backtop|theme"` startet (Optionen je Baustein oder als JSON in `data-dss-options`, Aufruf ersetzt die frühere Fassung). `initAccordion` und `initAccordions` geben weiter eine Funktion zurück, die jetzt auch `.destroy()` trägt (kein Verhalten geändert); neu im Accordion: `revealAround(target)` und `isAccordionItem(el)`, `scrollToElement(el, { behavior })`.
- **`initPageNav` und `initBackToTop`** (`@bbv/dss-design-system/pagenav.js`, `…/backtop.js` mit Typen; aus dem Vereinsregister übernommen und verallgemeinert, siehe `docs/superpowers/specs/2026-10-11-portal-bausteine-review.md`): Seitennavigation „Auf dieser Seite“ aus den Überschriften (Optionen `selector`, `container`, `label`, `minHeadings`, `skipAttribute`, `observe`, `syncHash`; ids mit Umlauten aufgelöst und eindeutig; Name über `aria-labelledby`, damit mehrere Navigationen verschieden heißen können; ES-Modul ohne Auto-Start, `destroy()`, entprellter `MutationObserver` mit Signatur, kein `innerHTML`) und Nach-oben-Knopf (44 px, SVG per `createElementNS`, Fokus auf `h1`, sonst `main`, sanft außer bei `data-motion="reduce"`/„Bewegung reduzieren“, über einer festen `dss-bnav`, Tokens `--dss-backtop-offset`, `--dss-backtop-gap`, `--dss-z-backtop`, `env(safe-area-inset-*)`, im Druck ausgeblendet). Ein Sprung öffnet die umgebenden Accordion-Bereiche, einklappbaren Rahmen und `details` (`revealAround`). Die globalen Portal-Regeln `html { scroll-padding-bottom }` und `h2[id] { scroll-margin-top }` sind **nicht** übernommen: Abstände über `--dss-scroll-offset` (Rückfall `--dss-acc-sticky-top`) auf `.dss-pagenav-target` und die Opt-in-Klasse `.dss-scroll-pad`. CSS `dss-pagenav`, `dss-pagenav-list`, `dss-pagenav-link`, `dss-backtop`. Doku `Components/PageNav`.
- **`initTheme` und `themeBootScript`** (`@bbv/dss-design-system/theme.js` mit Typen): Umschalter für hell, dunkel und System (`prefers-color-scheme` wird gehört), Speicherschlüssel `dss-theme` (konfigurierbar, blockierter Speicher bleibt ohne Fehler), feste Beschriftung „Dunkelmodus“ mit `aria-pressed`, Symbole über `data-theme-state`, Abgleich zwischen Tabs, kein Inline-`onclick`, kein globaler Zustand. `themeBootScript()` liefert eine kleine Zeichenkette für den `<head>` gegen Flackern (Werte maskiert; mit Content-Security-Policy ein `nonce` oder Hash). Doku `Foundation/Dark Mode`.
- **`MapView`: Marker-Art `kind: 'seat'`** (Vereinssitz): derselbe Pin wie die anderen (44 px breit, Kontur und Ring) mit einem Haus statt Nummer, ohne Nummer und ohne Zählung in der Nummerierung der übrigen Orte; Name für Hilfstechnik „Name, Vereinssitz“, in der Liste ein Haus-Badge und der Chip „Vereinssitz“. **`darkTiles: 'dim' | 'invert'`** (Standard `dim`): im Dunkelmodus die Kacheln abdunkeln oder invertieren und umfärben (nur Kachelebene, nur mit `dimInDark`, Token `--dss-map-invert-filter`). `markerName` und `tilesMode` in `map.js`. Das Attribut `data-tiles` steht am Wurzelelement der Karte (im Vanilla-Markup `data-tiles="dim"`).
- **Review V1a:** `initPageNav` scrollt und fokussiert nach dem `transitionend` des aufklappenden Bereichs noch einmal (Svelte und React; Rückfall nach Dauer plus Puffer), beobachtet geänderten Text und `data-pagenav`/`data-pagenav-skip` und hat eine Höchstwartezeit von einer Sekunde; mehrere `initTheme`-Umschalter teilen den Modus über ein Fenster-Ereignis; `initTheme` kennt `defaultMode` (gemerkte Wahl, dann `defaultMode`, dann System; die Wahl „System“ wird bei anderem Standard gemerkt, das Boot-Skript kennt den Eintrag `system`); der Name nummerierter Karten-Marker beginnt mit der sichtbaren Nummer („1, Sporthalle Nordhain“, WCAG 2.5.3, behebt `label-content-name-mismatch`); `seatLabel` ändert den Text „Vereinssitz“ (`mapItems(markers, appLinks, { seat })`); der Nach-oben-Knopf nutzt `inset-inline-end` (RTL).
- **Kennzahlen und Form** (`dss-stats`, `dss-stats--compact`, `dss-stat--compact`, `dss-form`): Kennzahlen-Gitter als Beschreibungsliste (Wert optisch über der Beschriftung, Schriftgrößen aus Tokens `--fs-h2`, `--fs-h3`, `--fs-caption`, fehlender Wert mit Text „keine Angabe“) und die Form der letzten Spiele als Punkte (Sieg gefüllt, Niederlage Quadrat, Unentschieden Ring) oder Marken mit S, N, U, mit Screenreader-Text aus `formLabel`. Komponenten `StatGrid` und `FormChips` in Svelte (`svelte/StatGrid`, `svelte/FormChips`) und React, reine Funktion `statItems` (`@bbv/dss-design-system/stats.js`). **Geändert:** Die Spalte „Form“ der `LeagueCard` nutzt jetzt `FormChips` (`dss-form`); die Klassen `dss-league-dots` und `dss-league-dot*` entfallen (gleiches Aussehen und gleiche Maße). Doku `Components/Kennzahlen`.
- **`VenueCard` (Hallenkarte)** in Svelte (`@bbv/dss-design-system/svelte/VenueCard`) und React (`VenueCard`, Typen `VenueCardProps`, `VenueAddress`, `VenueContact` aus `/react`): links eine kleine Karte (die `Map`, nicht interaktiv, Zwei-Klick-Platzhalter, Links „Größere Karte“ und „Route planen“), rechts Name (Überschrift, `titleAs`/`HeadingLevel`), Adresse als `<address>`, Kurzinfo, Kontakt als Definitionsliste mit `tel:`/`mailto:`-Links (nur bei gültiger Form, sonst Text), die nächsten Spiele in der Halle (`games`, `limit` Standard 2, höchstens 5, ohne beendete und spielfreie, `names`/`logos`) und Link zur Hallenseite. Ohne `lat`/`lng` keine Karte, `size="compact"` ohne Spiele. Das Layout schaltet über eine Container-Abfrage bei 640 px Kartenbreite (Karte oben, 16:9). Reine Funktionen in `@bbv/dss-design-system/venue.js` (`telHref`, `mailHref`, `contactInfo`, `venueGames`, `addressLines` …). Doku-Seite `Components/VenueCard`.
- **`Map` (Karte)** in Svelte (`@bbv/dss-design-system/svelte/Map`, Datei `Map.svelte`) und React (`MapView`, Typen `MapViewProps`, `MapMarker` aus `/react`; der React-Name vermeidet das JS-Global `Map`): interaktive Karte mit Leaflet und OpenStreetMap-Kacheln. Ein oder mehrere Marker (`markers`: `id`, `lat`, `lng`, `label`, `href`, `number`, `own`; Marker als Inline-SVG über `L.divIcon`, keine Leaflet-Standardbilder), Zoom und Ausschnitt (`center`, `zoom`, ohne beides `fitBounds` über alle Marker, `minZoom` 3, `maxZoom` 19), `interactive` (aus: keine Gesten, Tasten bleiben), `height`, `appLinks`, `showList`, `dimInDark`, `attribution`, `privacyNote`, `onload`/`onLoad`, `onerror`/`onError`, `onmarkerclick`/`onMarkerClick`. **Datenschutz:** Zwei-Klick-Lösung (Platzhalter mit Hinweis und „Karte laden“; kein Netzverkehr, Leaflet wird nicht geladen), `load="auto"` lädt sofort, `tileUrl` für einen eigenen Kachel-Proxy; Standard ist `tile.openstreetmap.org` (Demo). **Textalternative** immer vorhanden (nummerierte Liste mit Koordinaten im deutschen Format, Links „In OpenStreetMap öffnen“, „In Karten-App öffnen“ (`geo:`), „Route planen“), Sprungmarke „Karte überspringen“, Region mit Namen, Leaflet-Tastatur, eigene Zoom-Schaltflächen (44 px, `aria-disabled` an den Grenzen), Marker fokussierbar, Quellenangabe immer sichtbar (kein Prop zum Ausblenden). Fehlerfall (Leaflet fehlt, ungültige `tileUrl`, alle Kacheln blockiert): Hinweis mit `role="status"`, Liste bleibt. Dunkelmodus (Kacheln abgedunkelt, Marker mit Ring), Druck (nur die Liste), „Bewegung reduzieren“ (Leaflet-Animationen aus). CSS `dss-map*`.
- **`map.js`** (Export `@bbv/dss-design-system/map.js` mit Typen): reine Funktionen `mapLinks`, `formatCoords`, `validTileUrl`, `boundsOf`, `isCoord` (plus `mapItems`, `initialView`, `placeholderPins`).
- **Karte, Härtung nach Review:** Marker-`href` läuft durch `safeHref` (nur `http:`, `https:`, `mailto:`, `tel:`, Pfade, `#`-Ziele; `javascript:` und Co. entfallen, in Liste und Marker); doppelte oder fehlende Marker-ids werden eindeutig gemacht (kein `each_key_duplicate` in Svelte); der Fehlerzustand `tiles` tritt nur ein, solange noch nie eine Kachel ankam; Fehler in `update` führen zum Fehlerhinweis (Grund `update`); `validTileUrl` lehnt Steuerzeichen, Längen über 2048, `{z}`/`{x}`/`{y}` im Host und ungültige Ports ab und liest das Schema ohne Rücksicht auf Groß-/Kleinschreibung; nginx-Rezept mit begrenztem Pfadmuster, Endpunkt verwirft die Antwort bei Fehlern.
- **Neue optionale Abhängigkeit:** `leaflet` (BSD-2-Clause) als optionale Peer-Abhängigkeit (`peerDependenciesMeta`), dazu `leaflet` und `@types/leaflet` als Dev-Abhängigkeiten. Die App lädt `leaflet/dist/leaflet.css`; das Paket lädt Leaflet nur bei Bedarf per `import('leaflet')`. Kein Serverteil im Paket.
- **Doku:** Seite `Components/Map` mit Aufbau, Datenschutz (Zwei-Klick), Abschnitt „Datenschutz und Kachelserver“ (Proxy-Variante, Pflichten der OSM Tile Usage Policy, nginx-Rezept, SvelteKit-Endpunkt), Zoom, Tastatur, Textalternative, Karten-App-Links, Fehlerfall, Dunkelmodus, Druck, Zuständen, Code und Dos/Don'ts.
- **`LeagueCard` (Ligencard)** in Svelte und React (`@bbv/dss-design-system/svelte/LeagueCard`, `LeagueCard` und die Typen `LeagueTeam`, `LeagueColumn` aus `/react`): Mini-Tabelle einer Liga in einer Karte (Titel, Untertitel „12 Teams · 66 von 132 Spielen gespielt“, Tabelle `#`, `Mannschaft`, `SP`, `PKT`, Link „Komplette Tabelle und Spielplan“). Zeigt einen **Ausschnitt**: mit eigener Mannschaft (`own: true`) zwei davor, die eigene, eine dahinter (an den Rändern verschoben, immer vier Zeilen), sonst die ersten `limit` (Standard 3). Optional `columns` (`won`, `lost`, `diff`, `form`; bis 640 px ausgeblendet), `zone` je Team (Aufstieg, Relegation, Abstieg mit Streifen, verstecktem Text und Legende), `live` (Tag „Live“ und „n Spiele laufen“), `logos` und `names="short"` wie im Spielplan, `size="compact"` (Zeilen 40 px, kein Untertitel), `titleAs` (Ebene wie die anderen Titelkomponenten, Größe über `--dss-card-title-size`). Zugänglichkeit: echte `table` mit `caption` („Plätze 5 bis 8 von 12“), Scrollbereich als benannte Region, eigene Zeile, Zonen, Form und Diff auch als Text, eindeutiger Link-Name. CSS `dss-league*`.
- **`league.js`** (Export `@bbv/dss-design-system/league.js` mit Typen): reine Funktionen `leagueWindow`, `leagueSummary`, `formLabel`, `formEntries`, `windowLabel`, `diffText`, `zoneLegend`, `liveInfo` für eigene Darstellungen.
- **Doku:** Seite `Components/LeagueCard` mit Ausschnitt-Regeln, Spalten, Logos, Auf-/Abstieg, Live, Zuständen, Handy, Code (Vanilla, Svelte, React) und Dos/Don'ts.

### Geändert
- **Fix Accordion, natives `<details>`: gleiche Maße wie der Button-Weg.** `.dss-acc-trigger` hat jetzt `box-sizing: border-box` und `font: inherit` (ein `<summary>` blieb content-box: Kopf 68 statt 47 px, Seitenscroll). Button-Weg und `details` messen mit gleichem Inhalt pixelgleich (20 Fälle: 5 Varianten × hell/BBV und dunkel/DBB × 1280/420 px).
- **Fix Vanilla-Sprungleiste:** Der Linktext ist der Titel, ohne das unsichtbare Komma des Kopfes („Bereich 0“ statt „Bereich 0,“).
- **Fix Accordion `sticky` mit verschachteltem Ziel:** Ein Deep-Link oder Sprungleisten-Klick auf einen verschachtelten Bereich scrollt unter den klebenden Kopf des äußeren Bereichs (Abstand aus der gemessenen Kopfhöhe, in Svelte, React und Vanilla gleich; neue Hilfe `stickyOffset`).
- **Fix React `exclusive` mit Anker:** Bei `exclusive`, einem beim Start offenen Bereich und einem Anker auf einen anderen bleibt jetzt der Anker-Bereich offen (React ließ den ersten offen), auch wenn der Anker auf einen schon offenen Bereich zeigt (Svelte und React).
- **Accordion: Fokus bleibt erhalten**, wenn der Bereich, in dem er liegt, sich schließt (zum Beispiel bei `exclusive` per Anker): er geht auf den Kopf dieses Bereichs statt auf `<body>`.
- **Accordion: kein Layout-Sprung nach dem Hydrieren.** Das Server-Markup reserviert den Platz für „Alle öffnen/schließen“ und die Sprungleiste (`dss-acc-tools--pending`, 44 px, unter 640 px mit beidem 100 px); Sprunglinks und -schalter sind `border-box` (genau 44 px).
- **Accordion: Zugänglicher Name mit Zusatzinfo „Titel, 14 Spieler“:** Das Komma hängt als `.dss-acc-sep` (Schriftgröße 0) am Titel und ist unabhängig vom Leerraum im Markup (vorher in Chromium „Titel , 14 Spieler“).
- **Accordion `exclusive`: beim Start bleibt nur der erste offene Bereich offen** (in Dokumentreihenfolge), in Svelte, React und im Vanilla-Skript gleich (vorher ließen Svelte und React mehrere offene Bereiche stehen); gilt auch, wenn `exclusive` später eingeschaltet wird.
- **Fix Svelte `HeadingLevel`: `by` ist reaktiv.** Ein inneres `<HeadingLevel by={…}>` folgt jetzt einem Wechsel des äußeren `level` (vorher blieb es auf dem Wert vom Start stehen). `level` darf auch eine Ziffern-Zeichenkette sein (`level="4"`, Typ `HeadingLevelInput`).
- **`titleAs` an allen Titelkomponenten ist `'h2'` bis `'h6'`** (vorher `'h2' | 'h3' | 'h4'`; ScheduleTable, ScheduleGrid, Table, PlayerCard, EmptyState, PlayByPlay, TeamCard; Svelte und React). Ohne `titleAs` gilt die Ebene aus einem umgebenden `HeadingLevel`, sonst weiter `h3`. Ein ungültiges `titleAs` (etwa `'h1'`) fällt auf diese Ebene zurück.
- **Modal: Titel mit `titleAs` wählbar** (Standard weiter `h2`); Titelkomponenten im Inhalt und im Fuß bekommen automatisch die nächste Ebene (`h2` ergibt `h3`), auch im Radix-Portal.
- **Größe der Komponentenüberschriften über Tokens:** Sie hängt an Klassen, nie am Elementnamen (Test: kein `h1` bis `h6`-Selektor mit Größe). Ohne Eingriff bleibt jede Größe, jedes Gewicht und jede Zeilenhöhe gleich (im Browser gemessen).
- **Svelte-`TeamCard`: `onclick` hängt auch am Link**, wenn `href` gesetzt ist (wie React `onClick`), zum Beispiel für einen SPA-Router; die Karte bleibt ein Link. Die Svelte-`MatchCard` tat das schon.
- **Spielkarte, Kopf der Live-Karte:** bricht bei langem Abschnitt plus Spieltag („Live · 4. Viertel 02:14“) um; Kopf angesetzter und beendeter Karten bleibt einzeilig und unverändert. Das Trikot-Badge der compact-Spielerzeile mit Foto ist kleiner (16 px) und liegt weiter außen.
- **`quarter` ist veraltet** (`MatchCard`, `PlayByPlay`-Ereignis): bestehender Code läuft weiter, ohne `period` wird der Text unverändert angezeigt; mit `period` gewinnt `period`. Demo-Daten, Beispiele und Code-Beispiele in der Doku nutzen `period`. `MatchCard` zeigt bei `period` „4. Viertel“ statt „Q4“; die Live-Zeile ist jetzt „Live · Abschnitt Uhr“ ohne doppelte Leerzeichen.
- **Live-Stil durchgängig grün:** Spielplan (Zeile und Zeitraster), Spielkarte (`live`), PlayByPlay, TopBar und Breadcrumb-Punkt zeigen „live“ mit denselben Tokens und derselben Animation. **Bewusste Änderung der Live-Farbe: die TopBar-Marke „Live“ ist jetzt grün (vorher rot, `--err-fill`)**; Rot bleibt für Fehler, Fouls und Abgesagt. Ergebniszahlen laufender Spiele sind grün und pulsieren sanft; das Wort „Live“ bzw. der Screenreader-Text „läuft“ bleibt (nie nur Farbe). Neue Tokens `--live-fill`, `--dss-live-fg`, `--dss-live-fg-on-dark` (Text ≥ 7:1, Punkt ≥ 3:1), zwei Keyframe-Animationen statt der Einzel-Animationen `dss-mc-pulse`, `dss-pbp-pulse`, `dss-tb-pulse` und `dss-pulse`: `dss-live-pulse` für Punkte (Deckkraft 1 → 0,35 → 1) und `dss-live-pulse-text` für Ergebniszahlen (1 → 0,8 → 1, Kontrast im Puls-Tal mindestens 4,5:1), beide 1,6 s. Aus bei „Bewegung reduzieren“ **und** mit dem neuen **Pause-Schalter `data-motion="reduce"` auf `<html>`** (WCAG 2.2.2); in Storybook die Werkzeugleiste „Bewegung“. Hilfsklassen `.dss-live`, `.dss-live-dot`, `.dss-live-pulse`.
- **Spielplan: „vorläufig“ steht unter der Ergebniszahl** (kleines Tag in der Beschriftungsschrift) statt dahinter, in allen Layouts, auf der Handy-Karte und im Zeitraster. Die Zahl behält ihre Ausrichtung, die Zeilenhöhen der Dichten (60/48/40 px) bleiben gleich. Neues Markup `.dss-sch-resbox` und `.dss-sch-prov` (Svelte, React und Vanilla-Beispiele angepasst).
- **Zeitraster: Das Live-Kennzeichen steht neben dem Ergebnis** (ohne Stand neben der Paarung) und bricht erst um, wenn die Zelle zu schmal wird.
- **Chips: Text vertikal mittig.** Mono-Chips (`dss-chip--mono`, z. B. Feld „F1“, „vs.“, S/N) saßen etwa 1 px zu hoch, der Feld-Chip im Layout `columns` bis zu 6 px; jetzt höchstens 0,4 px Abweichung (BBV und DBB, beide Schriften; ausgenommen der „@“-Chip, dessen Glyphenform 0,9 bis 1,4 px Versatz zeigt). Der Link-Chip bleibt 44 px hoch.
- **Spielplan auf dem Handy, Layout `opponent`:** Datum und Uhrzeit stehen in der ersten Zeile der Karte, „vs.“/„@“ steht vor dem Gegner (vorher rechts oben).
- **Demo-Daten: nur noch erfundene Namen.** Spieler, Personen, Vereine und Hallen in Stories, Beispielen, Code-Beispielen, README und Tests wirken nicht mehr wie echte (z. B. `TSV Nordhain`, `Lindenberg Hawks`, `BG Seeberg`, `J. Tanner`, `M. Okafor`); Längen bleiben ähnlich, Logo-Initialen und Avatar-Initialen sind angepasst. Ligabezeichnungen und Paketnamen unverändert.
- **Storybook-Seitenleiste: eine Gruppe `Components/Spielplan`** mit der Docs-Seite und den Untergruppen `Tabelle` (vorher `ScheduleTable`), `Zeitraster` (vorher `ScheduleGrid`) und `Spielwiese` (vorher `Spielplan Spielwiese`). Die Story-IDs ändern sich (`components-spielplan-tabelle--…`, `…-zeitraster--…`, `…-spielwiese--…`); Verweise in Handy-Vorschauen, Einführung und `scripts/visual-compare.mjs` sind angepasst.
- **Modal:** Ein Klick auf den Hintergrund schließt das Modal nicht mehr. Die Prop `dismissOnBackdrop` hat jetzt in React den Standard `false` (vorher `true`) und gibt es auch in Svelte; mit `true` schließt der Klick wieder. Wer sich auf das alte Verhalten verlassen hat, setzt `dismissOnBackdrop`.
- **Spielplan-Seite:** `Components/Spielplan` zeigt die Tabellen jetzt mit den echten DSS-Abständen (die Doku-CSS überschrieb zuvor Padding und Kopfhöhe von `dss-tbl--schedule` und `dss-sgrid`); die Seite ist dadurch etwa 300 px kürzer.
- **Table: Scrollbereich ist eine benannte, fokussierbare Region** (`role="region"`, `tabindex="0"`, Name aus `caption`, sonst `title`, sonst „Tabelle“), mit gestricheltem Fokus-Ring innen (`.dss-table-scroll:focus-visible`, auch für ScheduleTable und ScheduleGrid; vorher Browser-Standard-Ring). Svelte-Table bekommt `caption` und `titleAs` wie React.
- **Table: Fokus-Ring für Link, Schalter und Eingaben in Zellen** sowie für fokussierbare Zeilen (gestrichelt, Gold/Amber); im Dunkelmodus auf der eigenen Zeile (`is-own`) in Chip-Textfarbe (vorher 2,5 bis 2,8:1).
- **Positionsmarken (`.dss-pos`) und Status-Pillen (`.dss-pill-s`) im Dunkelmodus:** nutzen die Chip-Tokens statt `--ok/err/warn/info-text` mit `-soft` (Dunkelmodus 8,1 bis 14:1, Hellmodus Pixel für Pixel unverändert). Neue Tokens `--dss-chip-info-*` und `--dss-chip-neutral-*`.
- **Table: Plus/Minus-Spalten** über `td.num.plus` und `td.num.minus` (Chip-Farben, auf `dss-frame--dark` helle Töne) statt Inline-Farbe mit `--ok-text`/`--err-text` (2,3 bis 2,5:1 auf dunklen Flächen).
- **Table `striped` mit `is-own`:** die eigene Zeile bleibt auf geraden Zeilen markiert (der Streifen überdeckte sie vorher).
- **Storybook:** Fließtext-Tabellen-Regeln der Doku-Seiten (`blocks.css`) und Überschriften-Farbe überschreiben keine DSS-Tabellen und Rahmentitel in Stories mehr.

- **Klickbare Karte hat einen Fokus-Ring** (gestrichelt, Gold/Amber): `.dss-card` als Link, `button` oder `role="button"` (vorher der Browser-Standard-Ring).
- **Svelte-Card:** ein `div` mit `onclick` löst auch bei Enter und Leertaste aus (wie die React-Fassung; vorher nur per Maus).
- **Spielkarte:** Zusatztext (Spieltag) ohne `opacity` (vorher 3,0:1), Liga in Textfarbe; **Skeleton-Spielkarte** und **Hero-Spielerkarte** laufen auf schmalen Bildschirmen nicht mehr über (Skeleton `min-width: min(320px, 100%)`, Hero in einer Spalte unter 560 px mit kleineren Kennzahlen).
- **EmptyState `action`/`error` im Dunkelmodus:** Fokus-Ring des Buttons in der Chip-Textfarbe (vorher 2,4 bis 2,7:1 auf der getönten Fläche).
- **Svelte-Tabs mit `multi` wie in React:** alle Schalter sind per Tab erreichbar (vorher war nur ein gewählter Schalter erreichbar, ohne Auswahl keiner), die Pfeiltasten tun bei `multi` nichts, und `aria-orientation` steht nicht mehr an der Gruppe.
- **Stepper-Schaltfläche** (mit `onstep`/`onStep`) trägt die sichtbare Nummer im Namen („3. Kampfgericht“, WCAG 2.5.3); vorher las sie nur das Label.
- **AAA-Kontrast (7:1) für Text nachgezogen** (axe `color-contrast-enhanced` auf allen Docs-Seiten): **TopBar „Live“** (inzwischen grün, siehe Live-Stil: `--dss-live-fg-on-dark`, 11,6:1 auf Anthrazit `#191919`, 13,9:1 auf Schwarz); **TopBar-Avatar** (BBV) `--cool-700` (7,5:1, vorher `--cool-600` 4,6:1); **Amber-Button im Hover** (DBB) mit schwarzem Text (7,6:1, vorher 6,3:1; neues Token `--dss-cta-fg-hover`, BBV unverändert); **eigene Spielplan-Zeile im Dunkelmodus** mit gedämpftem Text in `--n-300` (9,6:1, vorher 5,5:1; neues Token `--dss-mute-on-selected`, Hellmodus unverändert); **Gast-Trikotmarke** `.dss-tn.gast` mit 10 % Schwarz im Hintergrund (7,5:1, vorher 6,0:1; bleibt rot); Doku: Kapitän-Chip in der Tabellen-Seite (die Story-Klasse `.cap` überschrieb die Chip-Farbe, 5,1:1 → 7:1 und mehr) und Beschriftung auf dunkler Fläche in „Focus & Hover“ (`--n-300`).
- Beispiel-Icon `i-board` (gibt es im Sprite nicht) in Demo und Kommentar durch `i-edit`/`i-calendar` ersetzt.
- **Modal-Fuß** (`.dss-m-footer`) bricht auf schmalen Bildschirmen um, statt Buttons abzuschneiden. Peer-Abhängigkeit `svelte` auf `^5.20.0` (das Svelte-Modal nutzt `$props.id()`).
- **Fokus-Ring jetzt Gold/Amber und gestrichelt, im Dunkelmodus dezenter** (BBV Amber 600 → 700, DBB Gold 600 → 700). Neue Tokens
  `--ring-style` (`dashed`) und `--ring-color-on-dark` (für immer dunkle Flächen wie AppNav dunkel, Frame dunkel, TopBar dunkel).
  Die Eingabegruppe malt den Ring jetzt als Outline statt als `box-shadow`, damit er gestrichelt sein kann.
- **Hilfetext und Pflicht-Sternchen der Eingabefelder im Dunkelmodus lesbar** (vorher 2,3:1 auf Schwarz): `.dss-field-help--err/--ok/--warn` und `.req` nutzen jetzt die Chip-Tokens `--dss-chip-*-fg`, die einen Dunkelmodus haben; im Hellmodus unverändert.
- **Spielplan-Tabelle:** Dichte compact misst jetzt wirklich 40 px (vorher 45 px).
- **Banner-Link: Fokus-Ring ergänzt** (gestrichelt, Gold/Amber); im Dunkelmodus in Textfarbe, weil der dezente Dunkel-Ring auf dem getönten Banner nur 2,2 bis 2,7:1 hatte.
- **Svelte-Modal:** eindeutige Titel-id je Modal (vorher überall `dss-modal-title`, doppelt bei mehreren Modals) und der Titel ist eine `h2` (wie in der React-Fassung, vorher `h4`).

### Neu
- **Accordion (Paket A):** `Accordion` und `AccordionItem` (Svelte `svelte/Accordion`, `svelte/AccordionItem`; React `Accordion`, `AccordionItem`). Kopf als Überschrift mit Button (`aria-expanded`, `aria-controls`), Bereich mit `hidden` und `inert`, Höhenanimation 200 ms (aus bei „Bewegung reduzieren“ und `data-motion="reduce"`), im Druck alle Bereiche offen. Gruppe: `exclusive`, `variant` (`card`, `flat`), `expandAll` (mit Ansage), `nav` (Sprungleiste, unter 640 px einklappbar), `syncHash` (Deep-Link, Standard an), `sticky` (Token `--dss-acc-sticky-top`), `titleAs`. Bereich: `id`, `title`, `open`/`bind:open`, `defaultOpen`, `onOpenChange`, `disabled`, `meta`, `titleAs`. Pfeiltasten, Pos1 und Ende zwischen den Köpfen. Der Inhalt bekommt die Überschriftenebene darunter, verschachtelte Gruppen zählen hoch. `role="region"` nur bei höchstens 6 Bereichen. Tokens `--dss-acc-gap`, `--dss-acc-pad`, `--dss-acc-radius`, `--dss-acc-title-size` (nicht vorbelegt). Vanilla: Klassen `dss-acc*`, Skript `js/accordion.js` (Export `./accordion.js`: `initAccordion`, `initAccordions`, `nextHeader`, `hashTarget`, `ancestorsOf`, `labelWithMeta`, `summaryText`) und natives `<details class="dss-acc-item">` ohne Skript. Neue Seite **Components/Accordion**.
- **Einklappbare Tabellenrahmen (Accordion Paket B):** `Table`, `ScheduleTable`, `ScheduleGrid` und `LeagueCard` (Svelte und React) haben `collapsible` (Standard aus), `open` (Svelte `bind:open`, React `open` mit `onOpenChange`), `defaultOpen` (React) und `id` (Deep-Link). Der Rahmenkopf wird zum Accordion-Kopf: Titel als Überschrift mit Button (`aria-expanded`, `aria-controls`), `meta`, Live-Marke bzw. Untertitel und Live-Tag der Karte im Namen des Buttons, Pfeil rechts; die Tabelle ist der Bereich (`hidden`, `inert`, Animation, Druck, `data-motion` wie beim Accordion). Titelgröße und Kopfhöhe bleiben wie ohne `collapsible` (im Browser gemessen), die Accordion-Tokens gelten dort nicht. Geschlossen zeigt der Rahmen nur den Kopf ohne doppelten Strich. Der Bereich trägt keine zweite Region (der Scrollbereich der Tabelle bleibt die benannte Region). Innerhalb einer `Accordion`-Gruppe melden sich die Rahmen selbst an (Sprungleiste, „Alle öffnen/schließen“, `exclusive`, Deep-Link, Pfeiltasten, auch gemischt mit `AccordionItem`); ein Rahmen direkt im Bereich eines `AccordionItem` bleibt einzeln. Der Inhalt bekommt die Ebene unter dem Titel. Ohne `title` ist `collapsible` wirkungslos (Warnung nur in der Entwicklung). Neu im Skript `initAccordion`: Rahmen mit `is-collapsible` als Bereiche. Gemeinsamer Baustein `createCollapsible` (`js/accordion.js`) für `AccordionItem` und die Rahmen; interne Bausteine `CollapsibleFrame` (nicht Teil der Exporte). Doku: Abschnitt „Tabellen einklappen“ auf Table, Spielplan und LeagueCard, Liga-Seite auf der Accordion-Seite mit einklappbaren Rahmen.
- **Accordion: `navLabel`** (Svelte, React, `initAccordion`) benennt die Sprungleiste (`aria-label` und Text des Handy-Schalters, Standard „Bereiche“); mehrere Sprungleisten auf einer Seite brauchen verschiedene Namen (axe `landmark-unique`).
- **Überschriftenebenen: `HeadingLevel`** (React `HeadingLevel` und Hook `useHeadingLevel`, Svelte `svelte/HeadingLevel`) gibt den Titelkomponenten im Inhalt eine Ebene vor (`level` absolut, `by` relativ, ohne Vorfahr von Ebene 2 aus). Rangfolge: `titleAs` vor `HeadingLevel` vor `h3`. Reine Funktionen `headingTag`, `nextLevel`, `headingLevel`, `levelOfTag`, `resolveHeading` in `js/heading.js` (Export `./heading.js`, mit Typen); Ebenen werden auf 2 bis 6 begrenzt, Zeichenketten aus Ziffern gelten wie Zahlen. Neue Foundation-Seite **Headings**.
- **Tokens für Überschriften:** `--dss-title-size`, `--dss-title-weight`, `--dss-title-leading` (alle Komponentenüberschriften), `--dss-frame-title-size` (Table, ScheduleTable, ScheduleGrid, PlayByPlay) und `--dss-card-title-size` (PlayerCard, TeamCard, EmptyState); bewusst nicht vorbelegt, ohne Wert gelten die bisherigen Größen.
- **`ScheduleTable` und `ScheduleGrid` (Svelte): Prop `titleAs`** (`'h2' | 'h3' | 'h4'`, inzwischen `'h2'` bis `'h6'`, Standard `'h3'`), wie in der React-Fassung; vorher war die Überschrift in Svelte fest `h3`.
- **`TeamCard`: `last.outcome`** (`'S' | 'N' | 'U'`, Svelte, React, Typ in `js/team.d.ts`): überschreibt die aus den Punkten berechnete Bewertung (Forfait, Wertung gegen die Zahlen) wie `ScheduleGame.outcome`; Chip und Screenreader-Text folgen der Wertung. Ungültige Zahlen (negativ, gebrochen) in `record` und `squad` blenden die Angabe aus.
- **`TeamCard`** (Svelte, React `TeamCard`, Vanilla `dss-team*`; Export `./svelte/TeamCard`): Mannschaftskarte mit Kopf (Logo 48 px oder Initialen, Name als Überschrift, Liga, Saison), Bilanz (`record`: S–N bzw. S–U–N), Tabellenplatz (`rank`, `rankOf`), `points`, Zeilen „Nächstes Spiel“ und „Letztes Spiel“ (vs./@, Ergebnis mit S/N/U-Chip, Screenreader-Text wie im Spielplan), Kader-Kurzliste (`squad`) und optionaler Saison-Statistik (`stats`: 2PP %, 3PP %, TRB, TO; nur übergebene Felder, ohne Daten entfällt der Block). Größen `standard` und `compact` (Listenzeile); klickbar mit `href` (Link) oder `onclick`/`onClick` (Button): der Name in der Überschrift ist die Aktion, ihre Fläche deckt die Karte ab (ein Tab-Stopp je Karte, gestrichelter Fokus-Ring um die Karte). Hilfsfunktionen in `js/team.js` (Export `./team.js`, Zahlenformat ohne `Intl`). Daten: `name`, `short`, `logo` wie `ScheduleTeam`. Eigene Doku-Seite `Components/TeamCard` (Beispiele, Zustände, Handy hell und dunkel, Code, Props, Dos und Don'ts); verlinkt von Card Library und Einführung.
- **`PlayerCard` mit Foto:** neue Props `photo` (URL) und `photoAlt` (Standard leer, dekorativ) in `compact` (Avatar 32 px rund, Trikotnummer als Badge, Zeilenhöhe unverändert), `standard` (Kopfbild 64 px) und `hero` (Porträt links mit Verlauf; unter 560 px als Banner, der Name über dem dunklen Verlauf, ≥ 7:1). Ohne `photo`, mit leerem `photo` oder bei Ladefehler (`onerror`) bleibt die Trikotmarke (Markup ohne `photo` unverändert). Neue Klassen `dss-pc-av`, `dss-pc-img`, `dss-tn--badge`, `dss-pc-hero--photo`. Hinweis: Fotos von Minderjährigen nur mit Einwilligung. Demo-Fotos von Unsplash (`stories/assets/players/`, nur Storybook, mit `CREDITS.md`; zeigen reale Personen, die Namen sind erfunden).
- **Spielabschnitte `period` und `periods`** an `MatchCard` und `PlayByPlay` (Svelte, React): `period` ab 1, `periods` `4` (Standard) oder `8` (Mini-Basketball). `MatchCard` zeigt „3. Viertel“, „5. Achtel“, „Verlängerung“, „2. Verlängerung“; der `PlayByPlay`-Chip zeigt „V1“ bis „V4“, „A1“ bis „A8“, „VL“, „VL2“, Screenreader lesen den vollen Text. Ungültige Werte (0, negativ, Kommazahl, NaN) zeigen keinen Abschnitt. Gemeinsame Funktionen in `js/periods.js` (Export `./periods.js`: `periodLabel`, `periodShort`, `resolvePeriod`).
- **Kurznamen und Logos in `ScheduleTable`, `ScheduleGrid` und `MatchCard`** (Svelte, React, Vanilla-Klassen): neue Props `names?: 'full' | 'short'` (Standard `full`) und `logos?: boolean` (Standard `false`), neues Feld `short?` an `ScheduleTeam` und am Team der `MatchCard` (dort auch `logo?`). Bis 640 px Fensterbreite erscheint der Kurzname automatisch, wo ein Team einen hat (CSS, beide Texte im Markup, ohne JavaScript, auch beim Rendern auf dem Server). Der Kurzname ist `aria-hidden`, der volle Name bleibt im `dss-sr-only`-Muster für Hilfstechnik lesbar (der Name wird einmal gelesen). Logos: Bild mit `alt=""` und `loading="lazy"` in einer Kachel (`--dss-surface-2`) oder Initialen im Kreis (≥ 7:1), 28 px, in `compact` 20 px; Zeilenhöhen 60/48/40 px unverändert; Platzhalter ohne Logo. Im Layout `opponent` bleiben die Logos wie bisher an, solange `logos` nicht ausdrücklich `false` ist. Auf dem Handy stehen Teams mit Logo untereinander. Neue Klassen `dss-team-name`, `dss-team-name--short`, `dss-name-full`, `dss-name-short`, `dss-team-logo`, `dss-team-logo--initials`, `dss-sch-team--logo`, `dss-match--logos`; neue Hilfsfunktion `shortName` und Parameter `max` bei `initials` in `js/schedule.js`. Der sichtbare Kurzname trägt den vollen Namen als `title` (Tooltip, `aria-hidden`, der Name wird nicht doppelt gelesen); der versteckte volle Name ist nicht markierbar (`user-select: none`), Kopieren liefert nur den sichtbaren Namen; Freilos-Zeilen und -Zellen („… hat Freilos“) in Tabelle und Zeitraster zeigen den Namen mit Kurzname und Logo (vorher reiner Text mit vollem Namen). Doku: Abschnitte „Namen und Logos“ (Spielplan) und „Kurznamen und Logos“ (Card Library), Controls in den Spielwiesen, erfundene Demo-Logos unter `stories/assets/logos/` (nur Storybook).
- **Dokumentation: alle Komponenten als MDX-Seiten** (neu in diesem Schritt: `Components/Icon` mit Sprite, Größen, Farbe, Barrierefreiheit und Galerie aller 67 Symbole, `Components/CourtLines` mit Einbau, Markenfarben und gemessenem Kontrast, `Foundation/Colors` (neu mit Rollen-Tokens), `Foundation/Typography`, `Foundation/Focus & Hover` und die Einstiegsseite `Introduction` mit Inhaltsverzeichnis); die manuellen `Docs/*`-Seiten und `_SpecPage`/`_CodeSwitch` entfallen, ebenso alle automatischen Doku-Seiten (`autodocs`). Die README beschreibt die Konventionen für neue Komponentenseiten.
- **Tabellen-Doku als MDX-Seiten** `Components/Table` (Dichten mit gemessenen Höhen, Boxscore, dunkle Fläche, Zellbausteine, Zahlen, Sortierung, Streifen, Zustands-Matrix, Props, Dos und Don'ts) und `Components/PlayByPlay` (Eintrag, Ereignisarten, Live-Betrieb nach Code- und Browser-Beleg, Zustände, Dos und Don'ts) mit Code-Beispielen je Fassung; die Seite `Docs/Tables & Live-Scoring` und die automatischen Doku-Seiten entfallen (Gruppe `Docs` ist leer und aus der Sortierung entfernt).
- **Karten-Doku als MDX-Seiten** `Components/Card`, `Components/Card Library` (Spielkarte, Spielerkarte, Ladezustand) und `Components/EmptyState` mit Zustands-Matrizen, Spielwiesen für die Props, Code-Beispielen je Fassung und Dos und Don'ts; die Seite `Docs/Cards & Lists` und die automatischen Doku-Seiten der drei Komponenten entfallen.
- **Navigations-Doku als MDX-Seiten** `Components/Tabs`, `Components/Navigation` (TopBar, BottomNav, Breadcrumbs, Stepper) und `Components/AppNav` mit Zustands-Matrizen, bedienbaren Beispielen, Tastatur-Tabellen (gegen den Code belegt), Mobil-Vorschau der AppNav, Code-Beispielen je Fassung und Dos und Don'ts; die Seite `Docs/Navigation` und die automatischen Doku-Seiten der drei Komponenten entfallen.
- **Overlay-Doku als MDX-Seiten** `Components/Modal` und `Components/Banner` mit Anatomie, Schweregraden, Größen, bedienbarem Beispiel, Zustands-Matrix, Code-Beispielen je Fassung (Fokusverhalten von Svelte und React gegen den Code belegt) und Dos und Don'ts; die automatischen Doku-Seiten dieser beiden Komponenten entfallen.
- **Eingabe-Doku als MDX-Seiten** `Components/TextInput`, `Components/Select` und `Components/Checkbox` mit Zustands-Matrix, Code-Beispielen je Fassung und Dos und Don'ts; die Seite `Docs/Forms` und die automatischen Doku-Seiten dieser drei Komponenten entfallen.
- **Spielplan-Doku als MDX-Seite** `Components/Spielplan` (mit Auto-Docs-Texten von ScheduleTable/ScheduleGrid); die Seite `Docs/Spielplan` entfällt.
- **Storybook: Werkzeugleiste „Zustand“** (Normal, Hover, Fokus, Aktiv) erzwingt den Zustand auf allen bedienbaren Elementen der gezeigten Stories. **Button-Doku als MDX-Seite** (`Components/Button`) mit Zustands-Matrix, Code-Beispielen je Fassung und Dos und Don'ts; die alte Seite `Docs/Button` entfällt.
- **Spielplan:** `ScheduleTable` (Tabelle mit den Layouts `versus`, `opponent`, `columns`) und `ScheduleGrid` (Zeitraster) in
  Vanilla-CSS, Svelte und React, mit gemeinsamem Datenmodell `ScheduleGame` und Hilfsfunktionen in `js/schedule.js`.
  Zustände geplant, live, beendet, abgesagt, verlegt, Freilos; Handy-Karten; Ergebnis für Screenreader als unsichtbarer
  Text, abgesagte und verschobene Spiele mit zusätzlichem Text „abgesagt“/„verschoben“. Erweiterung für bearbeitbare Zeit
  und Konflikt-Hinweis: Svelte über die Snippets `time` und `notice`, React über `renderTime`, `renderNotice`, `renderLink`.
  Stories unter `Components/ScheduleTable` und `Components/ScheduleGrid`.
- **Storybook: Zustände fest sichtbar.** Die Button-Seite (`Components/Button`, Abschnitt *Zustände*) zeigt eine Matrix Variante × Zustand (Default, Hover, Focus,
  Active, Disabled) und den Fokus-Ring auf hellem und dunklem Grund. Neue Story `Foundation/Focus & Hover` mit Button, Link,
  Eingabefeld, Select, Tabs, Karte und Checkbox. Dafür legt `.storybook/pseudo-states.ts` Kopien aller `:hover`-,
  `:focus-visible`-, `:focus-within`- und `:active`-Regeln als Klassen `.pseudo-*` an (nur Storybook, nicht im Paket).
- **Schriften selbst gehostet:** `fonts/fonts.css` (Export `@bbv/dss-design-system/fonts.css`) mit Sora, Manrope, JetBrains Mono,
  Rubik und Barlow Condensed als woff2 (latin, latin-ext, SIL OFL, Lizenztexte in `fonts/licenses/`). Das Storybook lädt sie
  daraus und nichts mehr von Google; ein Test prüft Dateien, Lizenzen und Export.
- **DBB-Marke** (nach basketball-bund.de: Schwarz · Weiß · Anthrazit `#191919` · Gold `#c9ae64` · Orange `#ff9900`) als
  zweite Farbwelt neben BBV (Ink · Amber · Sky). Aktivierung mit `<html data-brand="dbb">`; Skalen `--gold-*` und
  `--orange-*` in `tokens/tokens.css`. Die DBB-Marke hat kein Blau.
- **Rollen-Tokens** `--base-*`, `--signal-*`, `--cool-*`, `--action-bg*` und `--indicator` als Schicht zwischen
  Marken-Skalen und Komponenten. Hue-Variablen `--h-cool` und `--h-signal` für Chips und Fokus-Ring, `--c-cool` für
  die Chroma der cool-Chips im Dark Mode.
- CourtLines: Token `--dss-court-color`; in BBV schwaches Amber (hell `amber-200`, dunkel `amber-700`), in der DBB-Marke golden (hell `gold-200`, dunkel `gold-700`,
  gedämpfter Text darüber bleibt ≥ 7:1).
- **Schrift-Achse** `data-type="dbb"`, unabhängig von `data-brand`: Rubik (Body) und Sucrose (Display) wie auf
  basketball-bund.de. Sucrose ist lizenzpflichtig und nicht im Paket; Fallback ist Barlow Condensed.
- **Type scale** als CSS-Variablen und Klassen: `--fs-*`, `--lh-*`, `--ls-*`, `--fw-*`, `.dss-t-*`, `.dss-tnum`,
  `.dss-measure`. Neu gegenüber `tokens.json` bisher: `body-md` (14 px, kompakte UI), `caption` (11 px, Mono),
  `stat` (22 px, Kennzahlen) und `hero` (32 px, Name in Hero-Karten); Handy-Größen `--fs-*-sm` (≤ 640 px).
- Storybook: `Foundation/Typography` (Skala, Familien und Gewichte, Zahlen und Mono, Im Einsatz, Audit).
- README: Anleitung, eine eigene Marke für einen anderen Verein anzulegen.
- Storybook: Toolbar-Umschalter für Marke und Schrift; Schriften werden über `.storybook/preview-head.html` geladen.

### Geändert
- **AppNav: gesperrter Zustand sichtbar.** Gesperrte Einträge waren kaum von normalen zu unterscheiden (nur ein etwas helleres
  Grau). Jetzt sind sie abgedunkelt (55 %), tragen ein Schloss-Symbol und reagieren nicht auf Hover; im dunklen Ton ebenso.
  Neu: auch eine ganze Gruppe lässt sich sperren (`disabled` und `hint` an der Gruppe, Svelte und React); sie erscheint als
  deaktivierter Button ohne Dropdown. Vanilla: `is-disabled` auf Link oder Gruppen-Button.
- **AppNav-Bugfix:** Die Links im Dropdown-Panel und in der mobilen Navigation waren mit `width: 100%` plus Padding 24 px zu
  breit (ohne `box-sizing: border-box`) und ragten bei Hover und aktivem Zustand über das Panel hinaus. Ein Test sichert das ab.
- **Fokus-Ring** erreicht jetzt 3:1 (vorher 1.7:1 auf Weiß): `--ring-color` ist ein mittlerer Ton (BBV `oklch(0.62 0.15 244)`,
  DBB dunkles Orange), gemessen mindestens 3.3:1 auf Weiß, Grau, Anthrazit und Schwarz in Hell und Dunkel.
- **Svelte nutzt wie React und Vanilla nur noch `css/components.css`:** `Button`, `Card`, `Modal`, `Tabs`, `TextInput` und `Icon`
  hatten eigene Scoped-Styles, die von der gemeinsamen CSS abwichen (kein Dark Mode: Text blieb dunkel auf dunkler Fläche;
  Primärbutton eine Stufe dunkler). Die Blöcke sind gelöscht; ein Test sorgt dafür, dass keine neue Svelte-Komponente einen
  `<style>`-Block bekommt. `TextInput` verwendet jetzt die `dss-*`-Klassen und die Struktur der React-Fassung und hat neue
  Props `density` (touch · default · compact), `id` und `name`; das Label ist mit dem Feld verknüpft (`for`), `required` und
  `aria-invalid`/`aria-describedby` werden gesetzt.
- **Alle Schriftgrößen** in `css/components.css` und `svelte/` laufen über `--fs-*` (108 Angaben). Abweichungen zur Skala wurden
  gerundet: 10 und 10,5 → 11; 12,5 → 13; 13,5 → 14; 14,5 und 16 → 15; 17 und 19 → 18; 26 → 28; 48 → 44.
- `css/components.css`, alle Svelte-Komponenten und Stories nutzen die Rollen-Tokens statt `ink-*`, `amber-*`, `sky-*`.
  Aktive Tab-/Nav-Unterstriche laufen über `--indicator` (DBB: `orange-600` auf hell, `orange-500` auf dunkel). BBV sieht unverändert aus (visueller Vergleich aller Stories:
  keine Abweichungen).
- Das alte "DBB-Compat-Preset" (Schwarz/Weiß/Gold/Hellblau per Hue-Werte) entfällt.

## [0.9.0] — BottomNav, Breadcrumbs, Skeleton, MatchCard, PlayerCard, PlayByPlay

Die letzten sechs Svelte-Komponenten gibt es jetzt auch als React-Version; alle Svelte-Komponenten haben
Svelte-, Vanilla-CSS- und React-Fassung (die Paritätsliste `PENDING_REACT` ist entfallen). Das Scoped-CSS liegt in
`css/components.css`, die Svelte-Dateien nutzen nur noch `dss-*`-Klassen.

### Neu
- **React:** `BottomNav` (Buttons oder Links, FAB, Badge, kontrolliert/unkontrolliert), `Breadcrumbs`
  (plain · tagged · chip, `aria-current="page"`), `Skeleton` (line · block · circle · row · match, Status-Text für
  Screenreader), `MatchCard` (Link, Button oder div), `PlayerCard` (compact · standard · hero), `PlayByPlay`
  (`role="log"`, per Tastatur scrollbar, Mannschaft und Spielstand für Screenreader).
- **CourtLines** (Svelte, Vanilla-CSS, React): Spielfeldlinien (FIBA 28 × 15 m) als dezenter Seitenhintergrund, aus dem
  Vereinsregister übernommen. SVG-Maske über `--dss-line` (dark-sicher), Hochformat-Variante auf dem Handy, SVGs
  unter `css/courtlines/`. Seiteninhalt braucht `position: relative; z-index: 1`.
- `TopBar` und `AppNav`: Prop `contained` begrenzt den Inhalt auf `--dss-shell-max` (Standard `64rem`), die Leiste
  bleibt voll breit.
- AppNav: offenes Dropdown schließt, wenn der Fokus auf ein Ziel außerhalb der Navigation wechselt (React, Svelte,
  Vanilla; bei `relatedTarget` null bleibt es offen, wegen Safari); Panel-IDs werden auch bei Sonderzeichen in der
  Gruppen-ID gültig gebildet.

### Geändert
- `.dss-tn` und `.dss-pos` gehören jetzt Table UND PlayerCard gemeinsam (eine Definition in `components.css`):
  `.dss-tn` hat `flex-shrink: 0` und die Größen `large`/`hero`; `.dss-pos` hat `min-width` + Padding statt fester
  Breite, `.dss-pos.sf` ist Amber (Table-Farbe; PlayerCard zeigte vorher Grün).
- `.dss-pos` hat `box-sizing: border-box` und `min-width: 22px` mit Padding (statt fester Breite); die PlayerCard
  behält über einen Override die etwas größere Marke (26 px, 10,5 px Schrift).
- MatchCard/PlayerCard-Zeile (div/a) haben `box-sizing: border-box`.
- Svelte `BottomNav`: eigene Klassen `dss-bnav-*` für Innenelemente, Einträge mit `href` werden Links, neue Prop
  `ariaLabel`, Badge nutzt `--err-button` (AAA mit weißem Text).
- Svelte `Breadcrumbs`: `aria-current="page"` am letzten Element, Einträge ohne `href` sind Text (statt Link `#`),
  Innenklassen `dss-crumbs-*`.
- Svelte `Skeleton`: Platzhalter `aria-hidden`, ein Status-Text (`label`) meldet das Laden.
- Svelte `MatchCard`/`PlayerCard` (compact): Link, Button oder div statt immer Button; innen nur `span`.
- Svelte `PlayByPlay`: Feed ist `role="log"` und fokussierbar, Innenklassen `dss-pbp-*` vollständig präfixiert,
  `PbpEvent` wird aus dem `module`-Skript exportiert.
- `Table`: `columns` hat Vorrang vor `head` (kein doppeltes `<thead>`).
- BottomNav: Der FAB ändert die Auswahl nicht mehr, er meldet sich über das neue `onAction` (React) bzw. `onaction` (Svelte).
- PlayByPlay: Spielstand wird für Screenreader als „Spielstand 87 zu 64“ vorgelesen; PlayerCard (compact): Positionsmarke `aria-hidden`.

### Hinweise
- React `PlayerCard`: Props heißen `heightCm` und `playerRole` (Svelte: `height_cm`, `role`).
- Svelte-Komponenten haben weiterhin keine Unit-Tests; abgesichert sind sie durch den Screenshot-Vergleich
  (`npm run visual:before|after|compare`).
- Skeleton: Mehrere Skeletons auf einer Seite erzeugen mehrere Status-Texte; bei Bedarf `label=""` übergeben (lässt den Status-Text weg) und den Container mit `aria-busy` kennzeichnen.

## [0.8.0] — Table, TopBar, EmptyState, Stepper, AppNav, Checkbox

Sechs weitere Komponenten in allen drei Varianten (Svelte, Vanilla-CSS, React). Das Scoped-CSS von
Table, TopBar, EmptyState und Stepper liegt jetzt in `css/components.css`; die Svelte-Dateien nutzen nur
noch `dss-*`-Klassen. Bereits vom Vereinsregister genutzte Klassen (`.dss-tbl`, `.dss-frame`,
`.dss-topbar`, `.dss-empty`) wurden nur ergänzt, nicht verändert.

### Neu
- **AppNav** (`svelte/AppNav.svelte`, `react/AppNav.tsx`, `js/appnav.js`): Hauptnavigation mit
  Gruppen-Dropdowns (Disclosure), gesperrten Einträgen (nicht fokussierbar, mit Hinweis), `aria-current`,
  Esc/Klick-außerhalb, Hamburger-Menü unter 720 px, Tonalität hell/dunkel, Kontext-Slot, `renderLink` für
  Router-Links (React). Export `@bbv/dss-design-system/appnav.js`.
- **Checkbox** (`dss-check*`): natives Kontrollkästchen, ganze Label-Fläche klickbar (44 px, kompakt 36 px),
  Hinweistext per `aria-describedby`.
- **Table** (React): Rahmenkopf mit Titel/Meta/Live, Dichten, Sortier-Pfeil mit `aria-sort`, Footer,
  dunkle Fläche, `caption` für Screenreader.
- **TopBar** (React): dunkle App-Leiste (`dss-topbar--dark`), Kontexte default/live/admin, Slots, optional
  als `header`-Landmark.
- **EmptyState** (React): Tonalitäten neutral/action/error, CTA oder freie `actions`, Überschriftenebene
  wählbar.
- **Stepper** (React): horizontal/kompakt/vertikal, `aria-current="step"`, Zustand per Screenreader-Text.
- Storybook: Stories für EmptyState, Checkbox, AppNav; `npm run visual:before|after|compare` für den
  Screenshot-Vergleich der Svelte-Stories.
- Hinweis: Table-Frame, -Kopf, -Footer und Striping nutzen jetzt die `--dss-*`-Aliase (leichte
  Farbnuance gegenüber den Roh-Tokens, dafür dark-sicher).

### Hinweise
- Svelte `AppNav` hat `context` (Snippet), aber kein `renderLink`-Pendant (Svelte-Nutzer verwenden normale Links).
- React `Checkbox`: `className` geht an das `input`, nicht an den Wrapper.
- `Table`: sortierbare Spaltenköpfe sind nur gestaltet und per `aria-sort` ausgezeichnet; die Sortier-Interaktion liefert die Anwendung.

### Geändert
- Svelte `EmptyState`: CTA nutzt `dss-btn`, Titel standardmäßig `h3` (vorher `h4`, per `titleAs`),
  neue Props `titleAs` und `actions`.
- Svelte `Stepper`: der Schritt-Punkt ist nur noch ein Button, wenn `onstep` gesetzt ist und der Schritt
  nicht `pending` ist; Zustand wird per Screenreader-Text angesagt, neue Prop `ariaLabel`.
- Svelte `Stepper`: die grüne Verbindungslinie hinter dem aktuellen Schritt entfällt (war ein Fehler der
  alten Selektorregel `.state-done + .step .line`).
- Svelte `Table`/`TopBar`: Innen-Klassen heißen jetzt `dss-frame-*` bzw. `dss-topbar-*`.

## [0.7.0] — React-Paket + Vanilla-CSS

Framework-freie Umsetzung der Komponenten (`css/components.css`), entstanden im Vereinsregister
(Basketball Vereinsregister Deutschland), das das DSS ohne Svelte und ohne Build-Schritt nutzt.

### Neu
- `css/components.css` mit denselben Klassennamen wie die Svelte-Komponenten: `dss-btn` (primary · amber ·
  secondary · ghost, Größen sm/md/lg, Icon), `dss-card` (default · elevated · flat · hoverable),
  `dss-tabs` (underline · segmented · pills, auch per `aria-pressed`/`aria-selected`), `dss-frame` +
  `dss-tbl` (Tabelle mit `num`/`lead`-Spalten, `is-own`-Zeile, compact), Eingabe (`dss-input-group`,
  `dss-input`, `dss-select`).
- Neue Bausteine: `dss-chip` (neutral · sky · amber · ok · warn · err · mono · link), `dss-stat`
  (Kennzahl-Kachel), `dss-rows`/`dss-row` (Listenzeile für Spielpläne), `dss-topbar`, `dss-empty`,
  `dss-eyebrow`, `dss-link`, `dss-sr-only`.
- Semantische Aliase `--dss-*` (Text, Linien, Flächen, Link, Akzent, Button, Chips) mit Light- und
  Dark-Werten. Komponenten verwenden nur diese Aliase, daher funktioniert Dark ohne Overrides.
- Dark-Theme: Primär-Button wechselt auf helle Fläche mit dunklem Text (ink-900 wäre auf dunklem
  Hintergrund unsichtbar).
- `dss-btn--danger`, `dss-btn.is-touch`; Feld-Bausteine `dss-field-help*`, Zustände `is-error|ok|warn`,
  Dichte `dss-input--default|compact`, `dss-select--compact`, `dss-addon--right`.
- `dss-banner*` (info · ok · warn · danger) und `dss-modal*` (aus `svelte/Modal.svelte` extrahiert,
  dark-sicher über die `--dss-*`-Aliase).
- Tabs: Größen `sm|lg`, Variante `vertical`, `dss-tab-count`, `dss-tab-ic`; `dss-icon`.
- Svelte: neue Komponenten `Select` (natives `<select>`) und `Banner`, beide nur mit `dss-*`-Klassen.
- Storybook lädt jetzt `css/components.css`; Stories für Select und Banner.
- Tests: `tests/components-css.test.ts` (Vitest) prüft die benötigten Klassen.
- **React-Paket** (`@bbv/dss-design-system/react`): `Button`, `TextInput`, `Select` (nativ), `Modal` (Radix Dialog),
  `Banner`, `Card`, `Tabs`, `Icon`. Rendert nur `dss-*`-Klassen aus `css/components.css`
  (`@bbv/dss-design-system/components.css`). `react`, `react-dom` und `@radix-ui/react-dialog` sind optionale
  `peerDependencies`; das Paket baut sich per `prepare` (tsup) selbst, auch als Git-Dependency.
- `Modal`: Prop `dismissOnBackdrop` (Standard `true`) für Dialoge, die nicht per Klick außerhalb schließen sollen.
- Gemeinsamer Icon-Sprite (`icons/sprite.ts`) für Svelte und React.
- Paritäts-Test (`parity.manifest.json`, `tests/parity.test.ts`): neue Komponenten brauchen Svelte + CSS + React.
- Tests: Vitest + Testing Library + axe-core für alle React-Komponenten.

### Geprüft
- Im Vereinsregister läuft ein axe-core-Test (WCAG 2.2 AA als Gate, AAA-Kontrast 7:1 und 44-px-Ziele
  als Ratchet): alle Seiten bestehen in Light und Dark ohne offene AAA-Verstöße.

### Bekannt / Follow-up
- `Tabs` (React) lässt im Multi-Modus alle Buttons per Tab erreichbar; `svelte/Tabs.svelte` setzt dort noch
  `tabindex="-1"` auf inaktive Einträge.
- Die Svelte-Komponenten Button, TextInput, Modal, Card und Tabs enthalten weiterhin eigene Scoped-Styles, die
  `css/components.css` doppeln.
- `css/`, `icons/` und `dist/` sind jetzt in `files` des Pakets (zuvor fehlte `css/`).
- `Card` (React) fängt Enter/Space nicht mehr von interaktiven Kindern ab; `svelte/Card.svelte` setzt bei
  klickbarem `div` zwar `role="button"` und `tabindex="0"`, hat aber keinen Tastatur-Handler.

## [0.6.0] — 2026-05 · App-Shell-Pack

Drei Komponenten-Specs, die das Foundation-Set zu einem produktionstauglichen App-Shell-Pack
ausbauen. Ergänzt bestehende Tokens, ohne Breaking Changes.

### Neue Svelte-Komponenten
- **Card** (`svelte/Card.svelte`) — Default · Elevated · Flat · Hoverable, mit Header/Footer-Slots.
- **Tabs** (`svelte/Tabs.svelte`) — alle 4 Varianten der Navigation-Spec (Underline · Segmented ·
  Pills mit Multi-Select · Vertical), Tastatur-Navigation, optionale Icons & Counts.
- **Icon** (`svelte/Icon.svelte`) — zentraler Sprite-Renderer für die 54 Glyphen, lazy-injizierter
  Sprite, currentColor, `IconName`-Typ für Autocomplete.

### Storybook
- Erstes lauffähiges Storybook-Setup (`.storybook/` + `stories/`).
- Light/Dark-Toggle via `addon-themes` (schreibt `data-theme` auf `<html>`).
- A11y-Addon aktiv (Kontrast-Checks gegen WCAG AAA).
- Stories für alle 6 Komponenten + Foundation/Colors mit allen Hue-Ramps.
- Scripts `npm run storybook` / `npm run build-storybook`.

### Neue Spec-Dokumente
- **Navigation** (`DSS Design System - Navigation.html`)
  App-Shell, Top-Bar (3 Varianten: Web · Live-Scoring · Admin), Sidebar (collapsed + expanded),
  Tabs (Underline · Segmented · Pills · Vertical), Breadcrumbs (Standard · Tagged · Invert),
  Bottom-Nav (5-Item · mit zentralem FAB), Stepper (Horizontal · Vertical · Dots),
  Sub-Nav / Filter-Strip.
- **Cards & Lists** (`DSS Design System - Cards & Lists.html`)
  Card-Anatomie (Default · Elevated · Flat · Hoverable), Match-Cards (Scheduled · Live · Finished
  + Compact List-Row), Player-Cards (Compact · Standard · Hero), Standings mit Form-Sequenz und
  Movement-Pfeil, Crew &amp; Team-People, Empty / Skeleton / Error-States.
- **Icons** (`DSS Design System - Icons.html`)
  Basketball-Icon-Set in 7 Familien: 13 Spielaktionen (2P · 3P · Freiwurf · Foul P/T/U/D ·
  Rebound · Assist · Steal · Block · Turnover · Wechsel), 6 Court-Elemente, 5 Rollen
  (Schiri · Anschreiber · Coach · Captain · DNP), 6 Status-Marker, 7 System-Glyphen plus
  30 UI-Core-Icons. Alle 24×24, Stroke 1.75, `currentColor`. Live-Suche &amp; Click-to-Copy
  im Dokument.

### Tokens / Foundation
- Keine Änderungen — Pack baut konsequent auf v0.5 Tokens auf.
- Token-Sync-Slider in jedem Tweaks-Panel (Ink · Amber · Sky Hue).

### Cross-File-Konsistenz
- Topstrip, Hero, Section-Header und Frame-Anatomie sind 1:1 mit Tables / Forms / Modals.
- Light + Dark in jedem relevanten Pattern.
- Touch-Targets respektieren weiterhin die 44 / 56 / 64-Stufung.

---

## [0.5.0] — 2026-05 · Pre-release

Foundation steht. Wird im Feldeinsatz mit den ersten Apps gehärtet, bevor v1.0 deklariert wird.

### Foundation
- **Color System:** Drei-Achsen-Identität (Ink · Amber · Sky) mit je 10–13 Stufen, oklch-basiert
- **AAA-konform:** Alle Text-Token-Paare validiert gegen WCAG 2.1 AAA (≥ 7:1 für Body, ≥ 4.5:1 für Large Text)
- **DBB-Compat-Preset:** 1-Hue-Swap umschaltbar auf DBB-Branding (Schwarz · Weiß · Gold · Hellblau)
- **Typografie:** Sora + Manrope + JetBrains Mono (alle Google Fonts, frei nutzbar)
- **Spacing:** 4 px Basis-Grid
- **Themes:** Light + Dark (auto via `prefers-color-scheme` oder explizit via `data-theme`)

### Komponenten
- **Buttons:** Primary · Amber · Secondary · Danger · Ghost · in 3 Größen
- **Forms:** Text · Number · Stepper · Select · Combobox · Date · Time · Textarea · Upload · Checkbox · Radio · Toggle · Segmented
- **Tables:** 4 Density-Stufen · Roster · Boxscore · Play-by-Play · Comparison · Crew
- **Modals:** Confirm-Dialog · Bottom-Sheet · Drawer · Toast · Banner · Popover
- **Live Scoring:** Split-Screen-UI mit Team-Config (Trikotfarbe, Logo) + Spielrichtungspfeil

### Touch Targets
- 44 px (WCAG-Min) · 56 px (Default) · 64 px (Hallen-Tisch)

### Validation
- **FIBA-Trikotnummer-Regex** als shared Token: `^(0|00|0?[1-9]|[1-9][0-9])$`
- 0, 00, 1–9, 01–09, 10–99 als unterschiedliche, eindeutige Nummern

### Distribution
- `tokens.css` (Drop-in)
- `tokens.json` (Design Tokens CG Format)
- `tailwind.preset.js` (Tailwind v3/v4)
- Svelte 5 Referenz-Komponenten (Button · TextInput · Modal)

---

## [Roadmap]

### v0.6 — v0.9 (Feldhärtung)
- Erste produktive Integration im Spielbericht (Tauri + Svelte 5)
- Token-Feinjustierung basierend auf Hallen-Tests
- Fixes aus Live-Einsatz

### v1.0 (Produktiv-Freigabe)
- Stabil im Feldeinsatz validiert
- ~~Navigation-Komponenten (Top-Bar · Tabs · Bottom-Nav)~~ ✅ v0.6
- ~~Cards & Lists~~ ✅ v0.6
- ~~Icon-Library~~ ✅ v0.6 (54 Glyphen, basketball-spezifisch)
- ~~Storybook~~ ✅ v0.6

### v1.x (Content-Komponenten)
Damit das System auch für Verbands-Website, Vereins-Portale und News-Bereiche taugt:
- **Images** — responsive `<picture>`-Wrapper mit Aspect-Ratio-Tokens, Lazy-Loading-Patterns, Fallback-Placeholder
- **Hero-Teaser** — drei Varianten: Image-Background (Bundesliga-Highlights), Split-Layout (Mannschafts-Portrait), Text-Only (Ankündigungen)
- **Artikel-Formate** — Standard-Artikel, Match-Report (mit eingebettetem Endbericht), Spieler-Porträt, Interview, Liveticker-Archiv
- **Foto-Galerien** — Masonry-Grid, Lightbox-Overlay, Karussell, Mannschafts-Porträt-Grid
- **Video-Embed** — Highlights, Pressekonferenzen, Schiedsrichter-Schulungen
- **Quotes & Pull-Quotes** — Trainer-Zitate, Spieler-Statements
- **Sponsoren-Logos** — Logo-Wand, Carousel
- **Newsletter-Modul** — Sign-up, Archive

### v1.x (Domain-spezifische Module)
Spezialisierte Komponenten für basketball-typische Daten und Strukturen:
- **Icon-Library** — basketball-spezifisches Icon-Set als zentrales Sub-Modul:
  - Game-Aktionen: 2P · 3P · Freiwurf · Foul (P/T/U/D) · Rebound · Assist · Steal · Block · Turnover
  - Spielfeld-Elemente: Korb · Backboard · Zone · 3-Punkte-Linie · Mittellinie · Shot Clock
  - Rollen: Schiedsrichter (Pfeife) · Anschreiber · Trainer (Clipboard) · Captain · DNP
  - Status: Live · Auszeit · Halbzeit · Disqualifikation · Foul-Out · Bonus
  - System: Sync · Offline · Validiert · Druck · Signatur
  - Format: 24×24 outlined (default), 16×16 (inline), 32×32 (touch); SVG mit `currentColor`
  - Stroke-Width tokenisiert; passt zu Sora-Headlines visuell
- **Map-Integration** — Hallen-Standorte fürs Vereinsarchiv: Marker-Cluster, Custom-Pin-Design in Team-Farben, Halle-Detail-Popover, Anreise-Button. Provider-agnostisch (Leaflet / MapLibre / Mapbox-kompatibel) — Token-basiertes Custom-Styling für Karten-Tiles in Ink/Sky-Tonalität.
- **Tournament Brackets** — K.O.-Spielbäume für Playoffs, Pokal, Turniere:
  - Single-Elimination (klassischer Cup-Tree)
  - Double-Elimination (Winner- + Loser-Bracket)
  - Round-Robin → K.O. (Gruppenphase + Playoffs)
  - Match-Knoten mit Team-Kacheln, Score, Live-Status, Sieger-Markierung
  - Horizontale (Desktop) und vertikale (Mobile) Darstellung
  - Tabellen-Cross-References zu Spielbericht/Endbericht-Modal

### v2.0 (mittelfristig)
- DBB-Compat als getrennter Preset-Build
- React-Komponenten parallel zu Svelte
- Animations-Tokens (Spring-Konfigurationen für Live-Scoring-Interaktionen)
