# Plan: alle bekannten Lücken schließen

Stand: 2026-10-12 · Quelle: Reviews und Berichte der Pakete Map, Accordion A/B, Hallenkarte, Vanilla V1a/V1b, Analyse des Vereinsregisters. Noch offen: Befunde des Reviews von V1b (werden nach dem Merge ergänzt).

Aufwand: S = unter einem halben Tag, M = bis ein Tag, L = mehrere Tage. Jedes Paket läuft wie bisher: Worktree, Umsetzung, unabhängiger Review, Fixes, Merge, Push.

## Welle 1: Fehler und Sicherheit in vorhandenen Komponenten (zuerst)
| # | Lücke | Wo | Plan | Aufwand |
|---|---|---|---|---|
| 1.1 | Svelte-Modal: kein Fokus ins Modal, keine Falle, keine Fokusrückgabe, Seite nicht abgeschaltet, Scrollen nicht gesperrt, Schließen-Symbol ohne `aria-hidden` | `svelte/Modal.svelte` | Verhalten aus `js/modal.js` (V1b) als gemeinsame Logik nutzen oder nachbauen; Tests wie beim Vanilla-Modal; Parität mit React | M |
| 1.2 | React-Modal (Radix): Fokus geht beim Schließen nicht an den Auslöser zurück | `react/Modal.tsx` | `onCloseAutoFocus` bzw. Auslöser merken; Test | S |
| 1.3 | `safeHref` lässt protokoll-relative Ziele (`//evil.example/x`) durch | `js/url.js` | Entscheidung: ablehnen (Standard) oder Option `allowProtocolRelative`; Tabellentest; Map, Venue, PageNav prüfen | S |
| 1.4 | Tabs: Pos1/Ende nur in Vanilla, Svelte/React „nicht belegt" | `svelte/Tabs.svelte`, `react/Tabs.tsx` | Home/End nachrüsten (gemeinsame `nextTab`-Logik); Paritätstest erweitern; Doku-Tabelle aktualisieren | S |
| 1.5 | MatchCard: Trikotpunkt im Dunkelmodus kaum sichtbar (`--team-heim`, 1,57:1 bis 2,66:1) | `css/components.css` (MatchCard, ggf. ScheduleGrid) | gleicher Rand in `--dss-mute` wie bei VenueCard; Kontrasttest hell/dunkel × BBV/DBB | S |
| 1.6 | Map: Speicherzuwachs beim Ein-/Aushängen (Reviewer ja, Entwickler nein) | `js/map-leaflet.js`, Komponenten | Gegenprobe mit dem Messaufbau des Reviewers (Storybook-Seite, CDP-Metriken, 5→45 Zyklen); Ergebnis dokumentieren, ggf. Ursache beheben | M |
| 1.7 | Map: kein „Erneut versuchen" nach Fehlern; `load` wird nur beim Start gelesen | `Map`, `js/map-leaflet.js` | Knopf „Erneut versuchen" im Fehlerhinweis (`role=status` bleibt); Prop-Wechsel `load` auswerten oder dokumentieren | S |
| 1.8 | Map: Zoom-Schaltflächen erscheinen bei `interactive={false}` (VenueCard: viele Tab-Stopps) | `Map`, `VenueCard` | Option `controls: false` bzw. bei `interactive=false` ausblenden (Tastaturzoom bleibt); VenueCard nutzt es; Tests | S |
| 1.9 | VenueCard: `names="short"` folgt der Fensterbreite, nicht der Container-Abfrage | CSS | Container-Abfrage für Kurznamen auch in der Hallenkarte | S |
| 1.10 | Doku/Rezepte: Node-Endpunkt ohne Rate-Limit (nur Hinweis); OSM-Routenlink gegen echte Seite nicht geprüft | `stories/examples/kachel-endpunkt.ts`, `Map.mdx` | Rate-Limit-Beispiel ergänzen; Routenlink einmal im Browser prüfen | S |

## Welle 2: Prüflücken schließen (nichts bauen, nur belegen)
| # | Lücke | Plan | Aufwand |
|---|---|---|---|
| 2.1 | Nur Chromium getestet (alle Pakete) | Playwright-Firefox und -WebKit für die Kern-Matrix (Accordion, Tabs, Modal, Map-Platzhalter, PageNav, Theme, `dialog`/`::backdrop`, Container-Abfragen); Ergebnisse als Tabelle in der Doku | M |
| 2.2 | Boot-Skript nicht gegen echte CSP getestet | Testseite mit `script-src 'nonce-…'` und mit Hash; Doku-Rezept verifizieren | S |
| 2.3 | Browser-Matrix nach Fixes nicht voll wiederholt (VenueCard; Docs Kennzahlen/PageNav/Dark Mode; Map-Docs) | Einmal eine vollständige axe- und Regressionsmatrix über alle Docs-Seiten als wiederverwendbares Skript (liegt im Scratchpad verstreut) ins Repo (`scripts/`), CI-fähig | M |
| 2.4 | Deploy-Workflow nach den letzten Pushes nicht angesehen | `gh run list` prüfen, Fehler beheben | S |
| 2.5 | Storybook-Oberfläche verletzt `region`, `landmark-one-main`, Link-Kontrast im Dunkelmodus (AA) | Eigenes Manager-/Docs-Theme prüfen: Link- und Button-Farben in `.storybook/storybook.css`/Theme anpassen | M |

## Welle 3: Vanilla-Paket fertigstellen (V2) und Portal
| # | Lücke | Plan | Aufwand |
|---|---|---|---|
| 3.1 | `render*`-Funktionen fehlen (LeagueCard, TeamCard, VenueCard, Spielplan, Table, MatchCard, EmptyState) | Paket V2a: `js/render/*.js`, Parität gegen React-Ausgabe, Escaping-/Sicherheitstests, `mount*` ohne `innerHTML`, Doku-Tab „Vanilla" ausführbar | L |
| 3.2 | `initMap` fehlt (Karte/Hallenkarte in Vanilla) | Paket V2b: Platzhalter, Zwei-Klick, Liste, App-Links, Statuszeilen; nutzt `createMapController` | L |
| 3.3 | `dist/` nicht im Git: Portal braucht Git-Dependency mit `prepare` oder eigenes Bauen (Review V1b prüft, ob `prepare` ohne devDependencies scheitert) | Entscheiden: Release-Archiv/Tag mit `dist/vanilla` (GitHub Release) oder npm-Veröffentlichung; `prepare` robust machen | M |
| 3.4 | Portal-Umstellung (eigenes Repo): alte Kopie `portal/dss` ersetzen, Klassen tauschen, Leaflet lokal statt unpkg, Kachel-Proxy | Eigener Plan im Portal-Repo nach 3.1–3.3; zuerst Kopie ersetzen und A11y-Tests laufen lassen | L |
| 3.5 | Entscheidung `FavoriteButton` (Merken) im DSS | Rückfrage an dich; wenn ja: Komponente `aria-pressed` + `js/favorites.js` mit Speicher-Adapter | M |
| 3.6 | Seitenkopf/Hero des Portals als DSS-Bausteine (`PageHeader`, `Hero`) | Nur wenn mehrere Seiten sie brauchen; Bedarf mit dir klären | M |

## Welle 4: Projekt-Pflege und Release
| # | Lücke | Plan | Aufwand |
|---|---|---|---|
| 4.1 | Version/Tag: `package.json` steht auf 0.9.0, CHANGELOG „Unveröffentlicht" sehr groß | Release 0.10.0 oder 1.0.0 festlegen (mit dir), CHANGELOG gliedern, Tag, GitHub Release mit `dist/vanilla` | S |
| 4.2 | Echte Namen in den statischen Design-HTMLs im Wurzelordner | Ersetzen durch erfundene Namen (Angebot steht seit langem) | S |
| 4.3 | Alte lokale Branches (`feat/dss-css-modal-banner-select`, `feat/react-package`) | prüfen, ob gemergt; löschen | S |
| 4.4 | Lockfile: Svelte-Peer-Bereich und `peer`-Flags durch npm verändert | beobachten; bei nächstem `npm install` prüfen | S |
| 4.5 | Print/PDF-Baukasten (nicht begonnen) | Brainstorming mit dir (Spielbericht, Tabellen, Spielplan als PDF? Papierformat, Schrift, Kopf/Fuß); dann Spec | L |

## Reihenfolge
1. Welle 1 in drei Paketen: (a) Modal 1.1 + 1.2 (zusammen, gleiche Dateien), (b) kleine Korrekturen 1.3–1.5 und 1.8–1.10, (c) Map-Speicher und Retry 1.6 + 1.7.
2. Welle 2.4 sofort (kostet nichts), danach 2.1–2.3, 2.5 parallel zu Welle 1 möglich, weil sie nur lesen.
3. Welle 3.3 vor 3.1/3.2 klären (Auslieferung), dann V2a und V2b, dann Portal-Umstellung.
4. Welle 4.1 nach V2; 4.2–4.4 jederzeit nebenbei.

## Entscheidungen, die ich von dir brauche
1. `safeHref` und `//host/pfad`: ablehnen (empfohlen) oder zulassen?
2. Auslieferung für das Portal: GitHub-Release/Tag mit `dist/vanilla`, npm-Paket oder Git-Dependency mit `prepare`?
3. `FavoriteButton` und `PageHeader`/`Hero` ins DSS: ja oder im Portal lassen?
4. Release-Nummer (0.10.0 oder 1.0.0) und ob 1.0.0 an die Vanilla-Auslieferung gekoppelt wird.
5. Print/PDF-Baukasten: jetzt starten oder zurückstellen?
