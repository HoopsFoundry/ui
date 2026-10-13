# Changelog

Alle nennenswerten Änderungen an diesem Design System werden hier dokumentiert.
Versionierung folgt [Semantic Versioning](https://semver.org/).

## [Unveröffentlicht] — Marken-Rollen und DBB-Marke

### Neu

- **Review V1b:** Das späte native `close`-Ereignis eines Dialogs zählt nicht mehr, wenn das Modal inzwischen wieder offen ist (`open, close, open` im selben Tick; ebenso `open()` auf ein extern per `showModal` geöffnetes Dialog). Gestapelte Modals ohne `<dialog>` funktionieren: geschlossene Modal-Wurzeln werden nicht inert, das zweite bekommt den Fokus, das Schließen des obersten gibt das darunter frei (ein vorhandenes `inert` an der eigenen Wurzel wird beim Öffnen entfernt und danach wiederhergestellt). Ist der Auslöser beim Schließen entfernt oder verborgen, bekommt die Fläche des darunter offenen Modals den Fokus, sonst `main`. Warnung in der Konsole für ein Modal ohne zugänglichen Namen; `touchstart` ist passiv; im Druck gilt die Scroll-Sperre nicht. `initTabs` mit `hash` öffnet umgebende Accordion-Bereiche, einklappbare Rahmen und `<details>` (`revealAround`). Die Register der Bausteine (`createRegistry(name)`) teilen sich über `Symbol.for('dss.registry')` alle Kopien auf einer Seite, ein zweites `init` ersetzt also auch das einer anderen Kopie. `checkVersion({ warn: true })` meldet eine Abweichung mit `console.warn`. `package.json`: `sideEffects: ["**/*.css"]` (ein Test prüft, dass kein Modul beim Import etwas ändert) und die React-Peers `^18.0.0 || ^19.0.0` (im leeren Projekt behebt das den `ERESOLVE` bei `npm install` mit Radix und React 19; Rauchtest mit React 19.3). `portal-sync.mjs`: baut in einem temporären Nachbarordner und benennt um, schreibt die Marker-Datei `.dss-sync`, löscht nie ein fremdes, nicht leeres Ziel, nie das Projekt-Root, einen Elternordner oder `node_modules`, kopiert Leaflet nur, wenn es installiert ist (`leaflet: 'auto'`), und setzt beim Direktaufruf einen Fehlercode statt eines halben Ziels. Doku: `file://` braucht einen Server, Budget-Polster, das Bündel teilt sich V2, das Zielverzeichnis gehört dem Paket.

- **Vanilla-Paket V1b, Tabs und Modal:** `initTabs(root, options)` (`@bbv/dss-design-system/tabs.js`, Typen `tabs.d.ts`) und `initModal(root, options)`, `openModal(el)`, `closeModal(el)` (`…/modal.js`) für vorhandenes Markup, beide nach dem Muster `{ destroy() }`, idempotent, ohne `innerHTML`. **Tabs:** dieselben Tastaturregeln wie die Svelte- und React-Tabs (Pfeile in Richtung der Leiste wählen sofort, gesperrte übersprungen, Umlauf am Rand, roving `tabindex`; ein Test vergleicht die Tastenfolgen aller drei Fassungen), dazu Pos1/Ende, `activation: 'manual'`, RTL, senkrechte Leiste, Panels über `aria-controls` (`hidden` und `inert`, fehlende Rollen und ids werden ergänzt), `role="group"` mit `aria-pressed` als Mehrfachauswahl, Deep-Link `hash` (Tab, Panel oder Element im Panel), Ereignis `dss:tabchange`; die reine Funktion `nextTab` gibt es einzeln. **Modal:** natives `<dialog class="dss-modal-dialog">` (`showModal`; CSS `dialog.dss-modal-dialog` und `::backdrop` in `components.css`) oder Markup mit `hidden` (Rolle `dialog`, `aria-modal`, Geschwister `inert`); Fokus auf `data-dss-modal-focus`, sonst die Fläche, und beim Schließen zurück an den Auslöser; Escape (außer `closable: false`); Fokusfalle (Tab und Umschalt+Tab); `dismissOnBackdrop` (Standard aus, Mausdruck im Modal und Loslassen außen schließt nicht); Scroll-Sperre mit Rückbau (zählend bei mehreren Modals); gestapelte Modals (nur das oberste reagiert); Auslöser `data-dss-modal-open="<id>"` und `data-dss-modal-close`; Ereignisse `dss:modalopen`, `dss:modalclose`; fehlende Beschriftung (`aria-labelledby`) wird aus dem Titel ergänzt. `snapshotAttributes` in `js/lifecycle.js` stellt beim `destroy()` geänderte Attribute wieder her.
- **`initAll` und `data-dss` kennen `tabs` und `modal`** (sechs Bausteine, mehrere Elemente je Baustein, Optionen je Element); `DSS_BLOCKS` und die Typen sind erweitert.
- **Bündelung und Auslieferung:** `npm run build:vanilla` (`scripts/build-vanilla.mjs`, tsup) schreibt `dist/vanilla/dss.js` (ES-Modul), `dss.min.js`, Quellkarten, `dss.d.ts` (zusammengeführt), `dss.css` (`tokens.css` plus `components.css`, mit `--dss-version`) und `courtlines/`. Export `./vanilla` (Bündel mit Typen), `./vanilla/*` (Dateien), `./tabs.js`, `./modal.js`; `prepare` ruft `npm run build` (`build:react` plus `build:vanilla`), `build:react` ist unverändert. Das Bündel hat keine Abhängigkeiten und enthält weder Framework noch Leaflet noch die Karte; `VERSION`, `cssVersion()` und `checkVersion()` gleichen JavaScript und CSS ab. Gemessen: `dss.min.js` 36,1 KB (gzip 12,9 KB), Budget als Test 40 KB und 15 KB. Beispiel `stories/examples/portal-sync.mjs` (kopiert `dist/vanilla`, Schriften und Leaflet nach `_site`; im Portal-Repository ist nichts geändert).
- **Doku:** neue Seite `Foundation/Vanilla` (Einbindung ohne Build, `data-dss`, Muster, Sicherheit, CSP, Größen, Kopieren, Versionsabgleich, Exportliste); `Components/Tabs` und `Components/Modal` haben ausführbare Vanilla-Code-Tabs (Markup gegen die Ausgabe der Komponenten geprüft), Abschnitte „Ohne Framework“, Handy-Vorschauen und je ein neues Do/Don't. Die Tabelle „Verhalten je Fassung“ des Modals hat eine Vanilla-Spalte.
- **Bekannte Lücken der Framework-Modals (nicht geändert, die Vanilla-Fassung schließt sie):** Das Svelte-Modal holt den Fokus nicht in das Modal, hat keine Fokusfalle, gibt den Fokus beim Schließen nicht zurück, schaltet die Seite dahinter nicht ab und sperrt das Scrollen nicht; das React-Modal (Radix) holt den Fokus und hat Falle, Abschaltung und Sperre, gibt den Fokus beim Schließen aber nicht an den Auslöser zurück (kein Radix-Trigger, der Fokus fällt auf `body`). Pos1/Ende gibt es in den Svelte- und React-Tabs nicht. Das Symbol im Schließen-Knopf des Svelte-Modals hat kein `aria-hidden` (der Knopf hat einen Namen, kein Befund). Ein Angleichen ist eine eigene Entscheidung.
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
