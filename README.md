# HoopsFoundry UI

**Komponenten-Library für Basketball-Apps**
Version 0.10 · WCAG 2.1 AAA · Framework-agnostisch · *Pre-release*

HoopsFoundry UI ist kein offizielles Designsystem eines Verbands. Die Marken BBV und DBB sind mitgelieferte Themes (Farben und Schriften), die sich durch eigene ersetzen lassen.

---

## Was ist drin

```
tokens/
  tokens.css            ← CSS Custom Properties (drop-in)
  tokens.json           ← Design Tokens Community Group format
  tailwind.preset.js    ← Tailwind v3/v4 preset
svelte/
  Button.svelte         ← Reference component
  TextInput.svelte      ← Reference component
  Modal.svelte          ← Reference component
  Card.svelte           ← v0.6
  Tabs.svelte           ← v0.6
  Accordion.svelte      ← Bereiche auf und zu klappen (mit AccordionItem.svelte, CSS in css/components.css); Table, ScheduleTable, ScheduleGrid und LeagueCard klappen mit `collapsible` ein (interner Baustein internal/CollapsibleFrame.svelte)
  Icon.svelte           ← v0.6 (67 Glyphen)
  Select.svelte         ← v0.7 · natives <select> im HoopsFoundry-UI-Look
  Banner.svelte         ← v0.7 · Inline-Hinweis
  Table.svelte          ← Tabelle mit Rahmenkopf (CSS jetzt in css/components.css)
  TopBar.svelte         ← App-Leiste (CSS jetzt in css/components.css)
  EmptyState.svelte     ← Leerzustand (CSS jetzt in css/components.css)
  Stepper.svelte        ← Schrittanzeige (CSS jetzt in css/components.css)
  AppNav.svelte         ← v0.8 · Hauptnavigation
  Checkbox.svelte       ← v0.8 · Kontrollkästchen
  BottomNav.svelte      ← v0.9 · Tab-Leiste für Mobile (CSS in css/components.css)
  Breadcrumbs.svelte    ← v0.9 · Brotkrumen (CSS in css/components.css)
  Skeleton.svelte       ← v0.9 · Lade-Platzhalter (CSS in css/components.css)
  MatchCard.svelte      ← v0.9 · Spielkarte (CSS in css/components.css)
  PlayerCard.svelte     ← v0.9 · Spielerkarte, optional mit Foto (CSS in css/components.css)
  TeamCard.svelte       ← Mannschaftskarte (CSS in css/components.css)
  LeagueCard.svelte     ← Ligencard: Mini-Tabelle mit Ausschnitt (CSS in css/components.css)
  Map.svelte            ← Karte mit Leaflet und OpenStreetMap (React: `MapView`; CSS in css/components.css; braucht optional `leaflet`)
  VenueCard.svelte      ← Hallenkarte: kleine Karte (Map), Adresse, Kontakt, nächste Spiele (CSS in css/components.css)
  PlayByPlay.svelte     ← v0.9 · Spielverlauf-Feed (CSS in css/components.css)
  CourtLines.svelte     ← v0.9 · Spielfeldlinien-Seitenhintergrund
react/                  ← v0.9 · React-Fassung aller Svelte-Komponenten (Button, TextInput, Select, Modal, Banner, Card, Tabs, Icon, Checkbox, Table, TopBar, EmptyState, Stepper, AppNav, BottomNav, Breadcrumbs, Skeleton, MatchCard, PlayerCard, TeamCard, LeagueCard, MapView, PlayByPlay, CourtLines)
js/
  appnav.js             ← v0.8 · Vanilla-Verhalten der AppNav
  accordion.js          ← Accordion: reine Funktionen und `initAccordion` für Vanilla (Button-Weg und natives details)
  periods.js            ← Spielabschnitte: „3. Viertel“, „5. Achtel“, „Verlängerung“ (`./periods.js`)
  team.js               ← Hilfsfunktionen der TeamCard (`./team.js`)
  map.js                ← Karte: `mapLinks`, `formatCoords`, `validTileUrl`, `boundsOf`, `isCoord` (`./map.js`); `map-leaflet.js` ist intern
  league.js             ← Ausschnitt, Untertitel, Form und Zonen der LeagueCard (`./league.js`)
  heading.js            ← Überschriftenebenen: `headingTag`, `nextLevel` (`./heading.js`)
  stats.js              ← Kennzahlen: `statItems` für `StatGrid` (`./stats.js`)
  pagenav.js            ← Seitennavigation „Auf dieser Seite“: `initPageNav` (`./pagenav.js`)
  backtop.js            ← Nach-oben-Knopf: `initBackToTop` (`./backtop.js`)
  theme.js              ← Dunkelmodus: `initTheme`, `themeBootScript` (`./theme.js`)
  tabs.js               ← Tabs: `initTabs`, `nextTab` (`./tabs.js`)
  modal.js              ← Modal: `initModal`, `openModal`, `closeModal` (`./modal.js`)
  vanilla-core.js       ← `initAll(scope)` über `data-hoops="accordion|pagenav|backtop|theme|tabs|modal|map"` (`./vanilla-core.js`)
  vanilla.js            ← Einstieg des gebündelten Pakets `dist/vanilla` (`./vanilla`)
  render/               ← `renderX`/`mountX` (Markup aus Daten, `./render.js`, `./render/*.js`); gebündelt `hoops-render.js` (`./vanilla-render`)
  map-vanilla.js        ← `renderMap`/`initMap`/`mountMap`: die Karte ohne Framework (`./map-vanilla.js`); gebündelt `hoops-map.js` (`./vanilla-map`)
  motion.js, url.js, lifecycle.js ← gemeinsame Grundlagen: `reducedMotion`, `safeHref`, das Muster `initX(root, options) → { destroy() }`
icons/
  sprite.ts             ← v0.7 · gemeinsamer Icon-Sprite für Svelte und React
css/
  components.css        ← Vanilla-CSS-Komponenten (einzige CSS-Quelle)
  courtlines/           ← v0.9 · court.svg, court-portrait.svg (Maske für CourtLines)
.storybook/             ← v0.6 · Storybook config
stories/                ← v0.6 · Stories für alle Komponenten + Foundation
docs/
  entwuerfe/            ← historische Design-Entwürfe (HTML, tweaks-panel.jsx); nicht gepflegt
```

---

## Quick Start

### Vanilla / Svelte / React (mit CSS Custom Properties)

```html
<link rel="stylesheet" href="fonts/fonts.css" />   <!-- selbst gehostete Schriften, optional -->
<link rel="stylesheet" href="tokens/tokens.css" />
```

Dann tokens benutzen:

```css
.button-primary {
  background: var(--hoops-ink-900);
  color: white;
  height: var(--hoops-touch-md);
  border-radius: var(--hoops-radius-md);
  font-family: var(--hoops-font-body);
}
```

### Tailwind

```js
// tailwind.config.js
import hoopsPreset from './tokens/tailwind.preset.js';

export default {
  presets: [hoopsPreset],
  content: ['./src/**/*.{html,svelte,ts,tsx}'],
};
```

```html
<button class="bg-ink-900 text-white h-touch-md rounded-md font-body">
  Korb erfassen
</button>
```

### Design Tokens (Style Dictionary, Theo, etc.)

```bash
npx style-dictionary build --tokens tokens/tokens.json
```

---

## Vanilla CSS (ohne Svelte)

Für Seiten ohne Build-Schritt gibt es `css/components.css` mit denselben Klassennamen wie die
Svelte-Komponenten (`hoops-btn`, `hoops-card`, `hoops-tabs`, `hoops-tbl`, `hoops-chip`, …):

```html
<html data-theme="light">
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />

<button class="hoops-btn hoops-btn--amber hoops-btn--lg">Suchen</button>
<span class="hoops-chip hoops-chip--sky">Männlich</span>
```

Farben laufen über die semantischen Variablen `--hoops-*`; Dark schaltet `data-theme="dark"` oder die
OS-Präferenz.

### Migration von den alten Namen (Bruch in 0.10.0)

Das System heißt jetzt HoopsFoundry UI (Paket `@hoopsfoundry/ui`, Präfix `hoops-`). Alles, was vorher `dss` hieß, ändert sich:

- Design-Tokens: `--dss-fg` → `--hoops-fg`; unpräfixierte wie `--n-0`, `--ring-w`, `--radius-md` → `--hoops-n-0` usw.
- CSS-Klassen: `dss-btn--sm` → `hoops-btn--sm` (Zustandsklassen wie `is-open` bleiben).
- Attribute und Ereignisse: `data-dss`, `data-dss-options` → `data-hoops`, `data-hoops-options`; `dss:tabchange` → `hoops:tabchange`.
- Speicherschlüssel `dss-theme` → `hoops-theme`; Dateien `dss.css`, `dss.min.js`, `dss-render.js`, `dss-map.js` → `hoops.css`, `hoops.min.js`, `hoops-render.js`, `hoops-map.js`; Paket `@bbv/dss-design-system` → `@hoopsfoundry/ui`; Befehl `dss-sync` → `hoops-sync`; Release `dss-vanilla-<version>.tgz` → `hoops-ui-<version>.tgz`.

Ein eigenes Projekt stellt man mit dem Migrationsskript um: im Repository-Checkout
`node scripts/migrate-from-dss.mjs <projektordner>`, mit dem installierten npm-Paket `npx hoops-migrate <projektordner>`. Der Probelauf ist
der Standard und schreibt nichts, `--write` schreibt (vorher Git-Stand sichern); `--stufen=T,D,K` wählt Stufen (T Tokens, D Attribute, Ereignisse,
Schlüssel und Dateinamen, K Klassen). Die Ersetzungstabelle steht im CHANGELOG und in `scripts/migration-table.mjs`, die Regeln in
`scripts/lib/name-rename.mjs`. Achtung: Die Regeln gelten für alle Dateien des Projekts; Namen, die zufällig genauso heißen wie unsere
(zum Beispiel eine eigene `--fs-h1` oder `--space-4`), werden mit umbenannt, Klassen mit fremdem Teilwort (`xdss-a`) nicht. Immer zuerst den Probelauf prüfen.

## React

```bash
npm install github:HoopsFoundry/ui#v0.10.0 react react-dom @radix-ui/react-dialog
```

```tsx
import '@hoopsfoundry/ui/tokens.css';
import '@hoopsfoundry/ui/components.css';
import { Button, TextInput, Select, Modal, Banner, AppNav, Checkbox, Table, BottomNav, Breadcrumbs, MatchCard, PlayerCard, TeamCard, LeagueCard, CourtLines } from '@hoopsfoundry/ui/react';

<Button variant="amber">Speichern</Button>
<TextInput label="Name" required />
<Modal open={open} onOpenChange={setOpen} title="Turnier löschen?" severity="danger">…</Modal>
```

Tailwind-Nutzer: `components.css` **nach** `@tailwind base` laden (Preflight setzt sonst Button-Hintergründe zurück).

### Sprache in Svelte und React

Die eingebauten Texte (Beschriftungen, `aria-label`, Statuszeilen) stehen in Katalogen. Die Standardsprache ist Englisch; für Deutsch einmal den Katalog laden und die Sprache setzen. Beide Fassungen lesen denselben Kern (`@hoopsfoundry/ui/i18n`) und rendern bei jedem Wechsel (`setLocale`, `registerLocale`, `setTexts`) neu, ohne Zustand, Fokus oder offene Bereiche zu verlieren.

```tsx
import '@hoopsfoundry/ui/i18n/de';                       // registriert den deutschen Katalog (steht unter sideEffects)
import { setLocale } from '@hoopsfoundry/ui/i18n';
import { HoopsProvider, useLocale, LeagueCard } from '@hoopsfoundry/ui/react';

setLocale('de');                                          // global, für die ganze Seite

// oder nur für einen Teilbaum (ändert den globalen Zustand nicht; geschachtelte Anbieter gelten innen):
<HoopsProvider locale="de" texts={{ 'league.link': 'Alle Tabellen' }} documentLang="en">
  <LeagueCard title="Liga" teams={teams} />               // einzelne Texte auch über `texts` an der Komponente
</HoopsProvider>
```

`useLocale()` liefert die wirksame Sprache an dieser Stelle des Baums. Vorrang eines Textes: Eigenschaft des Bausteins (`label`, `ariaLabel`, `linkLabel` …) vor `texts` des Bausteins (LeagueCard, TeamCard, MatchCard, ScheduleTable, ScheduleGrid, Table, VenueCard, MapView, FormChips, StatGrid) vor `texts` des Anbieters vor `setTexts` vor Katalog. Weicht die Sprache eines Bausteins von `document.documentElement.lang` ab, setzt er `lang` an der Wurzel; beim Server-Rendern entscheidet die Angabe `documentLang` des Anbieters (ohne sie bleibt das Attribut weg).

In Svelte genügt `setLocale`; für einen Teilbaum gibt es `provideI18n` (aus `@hoopsfoundry/ui/svelte/i18n`, einmal beim Initialisieren einer Komponente aufrufen) und für eigene Bausteine `useI18n`:

```svelte
<script>
  import { provideI18n } from '@hoopsfoundry/ui/svelte/i18n';
  provideI18n(() => ({ locale: 'de', texts: { 'league.link': 'Alle Tabellen' } }));
</script>
```

**Bruch gegenüber 0.10:** `statEmptyText` (js/stats.js) und `THEME_LABEL` (js/theme.js, Vanilla-Bündel) entfallen; stattdessen `statEmptyLabel(options)` und `t('theme.toggle')`. Die Buchstaben der Formleiste (`variant="letters"`) stehen im Attribut `data-letter` und kommen aus dem Katalog (deutsch S, N, U, englisch W, L, D); wer das Markup von Hand schreibt, setzt `data-letter` an `hoops-form-item`.

## AppNav ohne Framework

`css/components.css` + `js/appnav.js` genügen. Das Skript initialisiert alle `[data-hoops-appnav]`.

```html
<link rel="stylesheet" href="…/tokens/tokens.css" />
<link rel="stylesheet" href="…/css/components.css" />

<nav class="hoops-appnav hoops-appnav--light" data-hoops-appnav aria-label="Hauptnavigation">
  <div class="hoops-appnav-bar">
    <button type="button" class="hoops-appnav-toggle" data-appnav-toggle aria-expanded="false" aria-controls="nav-list">Menü</button>
    <ul class="hoops-appnav-list" id="nav-list">
      <li class="hoops-appnav-item"><a class="hoops-appnav-link is-active" aria-current="page" href="/">Start</a></li>
      <li class="hoops-appnav-item">
        <button type="button" class="hoops-appnav-group-btn" data-appnav-group aria-expanded="false" aria-controls="nav-g1">Gruppe</button>
        <ul class="hoops-appnav-panel" id="nav-g1" hidden>
          <li><a class="hoops-appnav-link" href="/a">Seite A</a></li>
        </ul>
      </li>
    </ul>
  </div>
</nav>

<script type="module" src="…/js/appnav.js"></script>
```

Gesperrte Einträge: `<span role="link" aria-disabled="true" class="hoops-appnav-link is-disabled" title="Hinweis">Label</span>`.

## Bausteine ohne Framework (Vanilla)

Verhalten für vorhandenes HTML liegt als ES-Module unter `js/`. Jeder Baustein folgt demselben Muster: `initX(root, options) → { destroy() }`, idempotent (ein zweiter Aufruf für dieselbe Wurzel ersetzt den ersten), nur `root` und seine Nachfahren, beim Import wird nichts ausgeführt. `initAll(scope)` aus `vanilla-core.js` findet alle Elemente mit `data-hoops="accordion|pagenav|backtop|theme|tabs|modal|map"` (die Karte startet über `options.map.start`, siehe unten); Optionen stehen in `initAll(document, { pagenav: { … } })` oder am Element als JSON in `data-hoops-options`.

```html
<body data-hoops="backtop">
  <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" data-hoops="theme" aria-label="Dunkelmodus" hidden></button>
  <main data-hoops="pagenav" data-hoops-options='{"label":"Auf dieser Seite"}'>
    <h1>Verein Nordhain</h1>
    <h2>Tabelle</h2> … <h2>Spielplan</h2> … <h2>Kader</h2> …
  </main>
  <script type="module">
    import { initAll } from '…/js/vanilla-core.js';
    initAll(document);
  </script>
</body>
```

- **`initPageNav`** (`pagenav.js`): Seitennavigation „Auf dieser Seite“ aus den Überschriften; ein Sprung öffnet Accordion-Bereiche und `details`, setzt den Fokus auf das Ziel, beobachtet nachgeladene Überschriften. Optionen `selector`, `container`, `label`, `minHeadings`, `skipAttribute`, `observe`, `syncHash`.
- **`initBackToTop`** (`backtop.js`): Nach-oben-Knopf (44 px), über einer festen `hoops-bnav`, mit `--hoops-backtop-offset`, Sicherheitsabständen und Druckregel.
- **`initTheme`** und **`themeBootScript`** (`theme.js`): Umschalter hell/dunkel/System mit `aria-pressed`, Speicherschlüssel `hoops-theme`; das Boot-Skript gehört in den `<head>` und verhindert das Flackern.
- **`initTabs`** (`tabs.js`): Tab-Leiste mit Pfeiltasten, Pos1/Ende (roving `tabindex`, `aria-selected`), Panels über `aria-controls` (`hidden` und `inert`), `role="group"` mit `aria-pressed` als Mehrfachauswahl, optionaler Deep-Link (`hash`), manuelle Aktivierung, Ereignis `hoops:tabchange`. Dieselben Regeln wie die Svelte- und React-Tabs.
- **`initModal`**, **`openModal`**, **`closeModal`** (`modal.js`): natives `<dialog class="hoops-modal-dialog">` (`showModal`) oder Markup mit `hidden` (Rolle, `aria-modal`, inerte Seite); Fokus holen und an den Auslöser zurückgeben, Escape, Fokusfalle, `dismissOnBackdrop` (Standard aus), Scroll-Sperre mit Rückbau, Auslöser `data-hoops-modal-open="<id>"` und `data-hoops-modal-close`, Ereignisse `hoops:modalopen` und `hoops:modalclose`.

Scrollabstände laufen über `--hoops-scroll-offset` und die Opt-in-Klasse `hoops-scroll-pad`, nie über globale Regeln. Ausführlich in Storybook: `Components/PageNav`, `Components/Tabs`, `Components/Modal` und `Foundation/Dark Mode`.

### Markup aus Daten (`renderX`, `mountX`)

Für LeagueCard, TeamCard, VenueCard, ScheduleTable, ScheduleGrid, Table, MatchCard, EmptyState, StatGrid und FormChips erzeugen `renderLeagueCard(props)` & Co. dasselbe Markup wie die Svelte- und React-Komponenten als Zeichenkette (läuft in Node, etwa im Crawler); `mountLeagueCard(el, props, options)` setzt es per `createContextualFragment` ein und gibt `{ update(props), destroy() }` zurück. Alle Eingaben sind unvertraut: Texte durch `esc`, Ziele durch `safeHref`, kein Rohmarkup von außen. Die Hallenkarte liefert die Karte als Platzhalter (ohne Leaflet; „Karte laden“ ist gesperrt, bis `mountVenueCard(el, props, { initMap })` die Karte startet). `mountX` setzt die wenigen `style`-Attribute über das CSSOM (CSP `style-src 'self'`); das Ergebnis von `renderX` braucht dafür `style-src-attr 'unsafe-inline'`. Import `@hoopsfoundry/ui/render.js` (Einzelmodule `…/render/league-card.js` usw.) oder gebündelt `@hoopsfoundry/ui/vanilla-render` (`dist/vanilla/hoops-render.js`, importiert den Kern `hoops.js` aus demselben Ordner; rund 56,3 KiB min, gzip 18,3 KiB, eigenes Budget 57 KiB und 19 KiB; `VERSION` muss zu `hoops.js` und `hoops.css` passen). Doku: Storybook `Foundation/Vanilla`, Abschnitt „Markup erzeugen“, und der Vanilla-Code-Tab auf jeder Komponentenseite.

### Gebündelt, ohne Build (`dist/vanilla`)

`npm run build:vanilla` (läuft auch bei `npm install` aus Git über `prepare`; `npm run build:react` bleibt unverändert) schreibt nach `dist/vanilla`: `hoops.js` (ES-Modul), `hoops.min.js`, Quellkarten, `hoops.d.ts` (zusammengeführt), `hoops.css` (`tokens.css` plus `components.css`, setzt `--hoops-version`) und `courtlines/`. Export `@hoopsfoundry/ui/vanilla` (Bündel mit Typen), `…/vanilla/*` (die Dateien). Das Bündel hat keine Abhängigkeiten, enthält weder Framework noch Karte noch Leaflet und kein `innerHTML`; `hoops.min.js` ist rund 46,9 KiB groß (gzip 16,3 KiB, Budget 48 KiB und 17 KiB als Test; darin der Sprachkern und der englische Katalog). **Sprache:** Die Standardsprache ist Englisch. Für Deutsch einmal `import './hoops-i18n-de.min.js'` (liegt neben `hoops.min.js`) und `setLocale('de')` aus `hoops.min.js`; weitere API: `getLocale`, `registerLocale`, `setTexts`, `t`, Ereignis `hoops:localechange`. `hoops-render.js`, `hoops-map.js` und `hoops-i18n-de.js` importieren `hoops.js` aus demselben Ordner und brauchen es daneben; Svelte und React lesen denselben Kern (Abschnitt „Sprache in Svelte und React“).

#### Karte ohne Framework (`hoops-map.js`)

`renderMap(props)` liefert das Markup der Karte als Zeichenkette (dasselbe wie `MapView`, läuft in Node), `mountMap(el, props, options)` setzt es ein und startet das Verhalten, `initMap(el, props)` macht vorhandenes Markup lebendig; alle drei geben `{ update(props), destroy() }` zurück (idempotent, `destroy` räumt Karte, Listener und `ResizeObserver` ab). Zwei-Klick-Platzhalter (vor dem Klick kein Netzverkehr), `load: 'auto'`, `tileUrl`, `privacyNote`, Fehlerfälle (`tile-url`, `import`, `init`, `update`, `tiles`) mit Statuszeile, Vereinssitz, `darkTiles`. Das Bündel `dist/vanilla/hoops-map.js` (Export `@hoopsfoundry/ui/vanilla-map`, Einzelmodul `…/map-vanilla.js`; rund 25,0 KiB min, gzip 9,9 KiB, eigenes Budget 26 KiB und 10 KiB; braucht `hoops.js` im selben Ordner) enthält **kein Leaflet**: die Option `loadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js')` (oder eine importmap für `leaflet`, oder `window.L`) liefert es aus dem eigenen Projekt, erst nach dem Klick. `mountVenueCard(el, props, { initMap })` startet die eingebettete Karte der Hallenkarte; `initAll(document, { map: { start: initMapBlock } })` startet `data-hoops="map"` mit Optionen als JSON. Ohne Build einbinden, Kachel-Proxy, CSP: Storybook `Components/Map`, Abschnitt „Ohne Build einbinden“. Beim Import passiert nichts, es lädt auch in Node.

```html
<link rel="stylesheet" href="/hoops/hoops.css" />
<script type="module">
  import { initAll } from '/hoops/hoops.min.js';
  initAll(document);
</script>
```

`scripts/portal-sync.mjs` (Befehl `hoops-sync`) zeigt, wie ein Vanilla-Projekt `dist/vanilla` (und Leaflet, falls installiert) aus `node_modules` nach `_site/hoops` kopiert; das Ziel gehört dem Skript (Marker `.hoops-sync`, Ersetzen über einen temporären Ordner). Die Peer-Abhängigkeiten sind optional, React `^18 || ^19`; `npm install` im leeren Projekt braucht kein `--legacy-peer-deps`. ES-Module brauchen `http(s)`, nicht `file://`. `VERSION`, `cssVersion()` und `checkVersion()` vergleichen JavaScript und CSS. Alles Weitere (Liste der Exporte, CSP, Sicherheit, Größen, Versionsabgleich): Storybook `Foundation/Vanilla`.

**Auslieferung bis Version 1.0: GitHub-Release.** `npm run build` und `node scripts/release-vanilla.mjs` erzeugen in `release/` (nicht im Git) `hoops-ui-<version>.tgz` (`dist/vanilla`, `fonts/`, `version.json` unter `hoops-ui-<version>/`), `hoops-ui-<version>.sha256` (Format von `sha256sum`), `hoops-ui-<version>.tgz.sha256` (nur der Tarball), `manifest.json` (Dateien, Größen in KiB, Budgets, Abhängigkeiten, Leaflet-Hinweis) sowie `hoops-sync.mjs` mit `hoops-sync.mjs.sha256`; vorher prüft das Skript, dass `package.json`, `VERSION` in allen sechs Bündeldateien und `--hoops-version` in `hoops.css` übereinstimmen und jedes Bündel sein Größenbudget einhält (`--dry-run`, `--allow-dirty`, `--no-build`, `--no-sourcemaps`, `--expect-version=`, `--debug`). Der Tarball ist auf derselben Plattform und Node-Version byte-gleich (gzip-Kopf normiert); maßgeblich ist die veröffentlichte `.sha256`. Der Workflow `.github/workflows/release-vanilla.yml` macht dasselbe bei einem Tag `v*` und legt das Release an (bis zum ersten Tag ungetestet; `workflow_dispatch` mit `dry_run` lädt nur ein Artefakt hoch). Das Portal holt und prüft das Release mit `node hoops-sync.mjs --from-release 0.9.0` (Anhang `hoops-sync.mjs`, eine Datei, Node 18 oder neuer; im npm-Paket als Befehl `hoops-sync`; Alternativen `--from-package`, `--from-dir`); ab 1.0 ist `--from-package` mit dem npm-Paket die Quelle, der Aufbau von `dist/vanilla` bleibt. Eine komplette Beispielseite ohne Build (Vereins- und Teamseite aus einem JSON-Datensatz, relative Pfade): `stories/examples/portal-seite/`, geprüft mit `node scripts/check-portal-seite.mjs --browsers=chromium,webkit,firefox` (Chromium und WebKit bestanden; Firefox ist in der Entwicklungsumgebung nicht gelaufen, Ursache ungeklärt). Einbinden, Aktualisieren, Rollback und Kompatibilität: Storybook `Foundation/Vanilla`.

## Leisten mit begrenzter Inhaltsbreite

`TopBar` und `AppNav` laufen mit ihrem Hintergrund über die volle Breite. Mit `contained` richtet sich der Inhalt
an `--hoops-shell-max` (Standard `64rem`, entspricht Tailwind `max-w-5xl`) aus und fluchtet so mit einem zentrierten
Inhaltscontainer:

```tsx
<TopBar as="header" brand="Turnier-Manager" mark="T" contained />
<AppNav items={items} contained />
```

Vanilla: Klassen `hoops-topbar hoops-topbar--dark hoops-topbar--contained` bzw. `hoops-appnav hoops-appnav--contained`.
Die Breite lässt sich über `--hoops-shell-max` ändern.

## CourtLines

Dezente Spielfeldlinien (FIBA 28 × 15 m) als Seitenhintergrund, rein dekorativ (`aria-hidden`). Die Linien sind
eine SVG-Maske über `--hoops-line` (dark-sicher); auf dem Handy wird die Hochformat-Variante genutzt. Die SVGs liegen
unter `css/courtlines/`.

```tsx
<CourtLines />                      {/* füllt den Viewport (position: fixed) */}
<CourtLines position="absolute" />  {/* füllt den nächsten positionierten Container */}
```

Vanilla:

```html
<div class="hoops-courtbg" aria-hidden="true"><div class="hoops-courtlines"></div></div>
```

Der Seiteninhalt braucht `position: relative; z-index: 1`, damit er über dem Hintergrund liegt.
Die Linienfarbe kommt aus `--hoops-court-color` (BBV: schwaches Amber, DBB: Gold).

## Identitäts-Achsen

| Achse | Rolle | Anchor |
|---|---|---|
| **Ink** (Hue 60°) | Primary · Text · Buttons | `ink-800` |
| **Amber** (Hue 83°) | Signal · CTA · Spieluhr | `amber-400` |
| **Sky** (Hue 244°) | Atmosphäre · Heim · Info | `sky-400` |

### Marken-Rollen und DBB-Marke

Komponenten greifen nicht auf `ink-*`, `amber-*` oder `sky-*` zu, sondern auf Rollen-Tokens:

| Rolle | BBV (Standard) | DBB (`data-brand="dbb"`) |
|---|---|---|
| `--hoops-base-*` · Text, Flächen | `ink` | reine Grautöne; `base-900` = `#000`, `base-1000` = Anthrazit `#191919` |
| `--hoops-signal-*` · CTA, Highlight, Uhr | `amber` | `gold` (`gold-400` ≈ `#c9ae64`) |
| `--hoops-cool-*` · Links, Heim, Info | `sky` | Grautöne (kein Blau, Links erben die Textfarbe) |
| `--hoops-action-bg`, `--hoops-action-bg-2`, `--hoops-action-bg-hover` · primäre Buttons | `ink-900`, `ink-800`, `ink-700` | Anthrazit, Anthrazit, `n-700` |
| `--hoops-indicator` · aktiver Tab, Nav-Unterstrich | `amber-400` | `orange-600` ≈ `#eb6909` (3.2:1 auf Weiß); im Dark Mode `orange-500` ≈ `#ff9900` |

Die DBB-Werte stammen von basketball-bund.de (Theme `dbb21`, Stand 2026-10-08): Schwarz, Weiß, Anthrazit, Gold als
Markenfarbe, Orange für aktive Zustände.

Umschalten über ein Attribut auf `<html>`:

```html
<html data-brand="dbb">
```

Das Attribut muss auf `<html>` stehen, weil abgeleitete Tokens (`--hoops-team-heim`, `--hoops-page-fg`) am Root aufgelöst werden.
Gold und Orange haben pro Stufe ähnliche Helligkeit wie Amber, die AAA-Slots (`fill` / `text` / `deep`) bleiben daher
gleich. Gold und `#ff9900` taugen nicht als Text auf Weiß (je etwa 2.1:1); Text nutzt `signal-800` (≈ 8.5:1). Der Indikator nutzt auf hellem Grund das dunklere `orange-600`, damit er 3:1 erreicht.
Der Fokus-Ring (`--hoops-ring-color`) ist Gold/Amber (BBV `amber-600`, DBB `gold-600`) und gestrichelt (`--hoops-ring-style`), mit mindestens 3:1 auf Weiß und Anthrazit. Im Dunkelmodus und auf immer dunklen Flächen gilt der dezentere `--hoops-ring-color-on-dark` (BBV `amber-700`, DBB `gold-700`); eine Marke muss das einhalten.
Neue Komponenten verwenden nur die Rollen-Tokens und `--hoops-*`, keine Farbfamilien direkt. Im Storybook schaltet die
Toolbar zwischen beiden Marken um.

### Schrift (`data-type`)

Die Schrift ist unabhängig von der Farbmarke. Marke (`data-brand`) und Schrift (`data-type`) lassen sich frei kombinieren,
beide stehen auf `<html>`:

| `data-type` | Body | Display / Headings |
|---|---|---|
| *(leer)* | Manrope | Sora |
| `dbb` | Rubik (SIL OFL, frei) | Sucrose, Fallback Barlow Condensed |

`Sucrose` (Yellow Design Studio) ist lizenzpflichtig und deshalb **nicht** im Paket. Der DBB oder wer eine Lizenz hat, bindet
die Dateien selbst ein:

```css
@font-face { font-family: 'Sucrose'; font-weight: 700; font-display: swap; src: url('/fonts/Sucrose-Bold.woff2') format('woff2'); }
```

Ohne diese Datei greift der freie Fallback Barlow Condensed (OFL).

**Schriftdateien (selbst gehostet):** `fonts/fonts.css` bindet Sora, Manrope, JetBrains Mono, Rubik und Barlow Condensed
aus dem Paket ein (variable Schriften, Subsets latin und latin-ext, rund 290 KB, Lizenztexte in `fonts/licenses/`). Es
geht keine Anfrage an Google. Einbinden mit `@import "@hoopsfoundry/ui/fonts.css";` bzw. `import '@hoopsfoundry/ui/fonts.css'`.
Die Datei ist optional; wer eigene Schriften ausliefert, lässt sie weg. Im Storybook ist sie eingebunden.

### Type scale

13 Stufen, als CSS-Variablen (`--hoops-fs-*`, `--hoops-lh-*`, `--hoops-ls-*`, `--hoops-fw-*`) und als Klassen (`.hoops-t-*`):

| Stufe | Größe / Zeilenhöhe | Verwendung |
|---|---|---|
| `display` | 88 / 0.9 · 800 | Spielstand-Anzeige, Trikotnummer groß |
| `clock` | 64 / 1 · 700 · Mono | Spielzeit, 24-s-Uhr |
| `h1` · `hero` · `h2` · `h3` | 44 · 32 · 28 · 20 | Seitentitel, Name in Hero-Karten, Abschnitte, Karten-Titel |
| `stat` | 22 / 1.1 · 800 | Kennzahlen in Karten |
| `body-lg` · `body` | 18 · 15 | Einleitung, Standard-Fließtext |
| `body-md` | 14 | Kompakte UI: Tabellen, Listen |
| `body-sm` | 13 | Hilfetexte, Fußnoten |
| `label` | 12 · 600 · Versalien | Feld-Beschriftung, Tabellenkopf |
| `caption` | 11 · 600 · Mono · Versalien | Chips, Meta |

Auf dem Handy (≤ 640 px) nutzen die Klassen `.hoops-t-display`, `-clock`, `-h1` und `-h2` die kleineren Größen `--hoops-fs-display-sm` (56), `--hoops-fs-clock-sm` (48), `--hoops-fs-h1-sm` (32) und `--hoops-fs-h2-sm` (24). Komponenten mit fester Kachelgröße bleiben bei `--hoops-fs-*`. Alle Komponenten in `css/components.css` und `svelte/` setzen `font-size` ausschließlich über `--hoops-fs-*`. Zahlen in Spalten (Spielstand, Uhr,
Statistik) setzen `font-variant-numeric: tabular-nums` (`.hoops-tnum`, bei `display` und `clock` eingebaut). Fließtext begrenzt
`--hoops-measure` (65ch, `.hoops-measure`). Die DBB-Schrift setzt Display, H1 und H2 in Versalien und ohne negatives Tracking.
Das Storybook (`Foundation/Typography`) zeigt Skala, Familien, Zahlen und einen Seiten-Ausschnitt; der Reiter *Audit* zählt die
Schriftgrößen in den Komponenten gegen die Skala.

### Eigene Marke für einen anderen Verein

Das Design System ist darauf ausgelegt, dass Vereine eine eigene Marke ergänzen, ohne Komponenten anzufassen. Komponenten
lesen nur die Rollen-Tokens; eine Marke ist ein Block, der sie überschreibt (Vorlage: der DBB-Block in `tokens/tokens.css`):

```css
:root[data-brand="mein-verein"] {
  /* Skalen mit gleicher Helligkeits-Staffelung wie die Standard-Skalen (AAA-Slots bleiben gleich):
     50–900 für signal und cool, 0–1000 für base */
  --hoops-base-0: …;  /* … bis --hoops-base-1000 */
  --hoops-signal-50: …;  /* … bis --hoops-signal-900 · CTA, Highlight, Uhr */
  --hoops-cool-50: …;    /* … bis --hoops-cool-900 · Links, Heim-Team, Info */
  --hoops-action-bg: …;  --hoops-action-bg-2: …;  --hoops-action-bg-hover: …;  /* primäre Buttons */
  --hoops-indicator: …;  /* aktiver Tab / Nav-Unterstrich, auf Weiß ≥ 3:1 */
  --hoops-h-cool: …;  --hoops-h-signal: …;  --hoops-c-cool: …;  /* Hue/Chroma für Chips und Fokus-Ring */
  --hoops-ring-color: …;  --hoops-ring-color-on-dark: …;  /* Gold/Amber, ≥ 3:1 auf Weiß bzw. auf Anthrazit */
  --hoops-court-color: …;  --hoops-court-opacity: …;  /* Courtlines, Text darüber ≥ 7:1 */
}
```

Dazu optional ein `data-type`-Block mit `--hoops-font-display`, `--hoops-font-heading` und `--hoops-font-body`. Nach dem Anlegen:
Kontraste messen (Text ≥ 7:1, UI-Elemente ≥ 3:1) und im Storybook alle Stories in der neuen Marke durchsehen.

---

## Spielplan

Zwei Bausteine für Spielpläne (Vanilla-Klassen, Svelte, React), gemeinsames Datenmodell `ScheduleGame`
(Typen in `js/schedule.d.ts`, Hilfsfunktionen in `js/schedule.js`, Export `@hoopsfoundry/ui/schedule.js`).

- **`ScheduleTable`:** Tabelle, eine Zeile pro Spiel, nach `section` gruppiert. Layouts: `versus` (Heim – Gast, Liga,
  Halle), `opponent` (Perspektive einer Mannschaft mit Chip vs./@, Logo, S/N-Chip, Ergebnis *eigene : Gegner*),
  `columns` (Turnier mit Nr, Zeit, Feld, Heim, Ergebnis, Gast). `columns` und `versus` brauchen `heim` und `gast`;
  ein Spiel nur mit `opponent` zeigt dort „?“ und kein Ergebnis. Dichten wie bei `Table`: `touch` 60 px (Standard bei
  `opponent` oder mit `league`-Unterzeile), `default` 48 px (sonst), `compact` 40 px.
  Erweiterung: Svelte über die Snippets `time` und `notice`, React über `renderTime`, `renderNotice` und `renderLink`.
- **`ScheduleGrid`:** Zeitraster, Anwurfzeiten als Zeilen, Hallen oder Felder als Spalten; nur die Gegenüberstellung
  (`heim`/`gast`), keine Perspektive. Empfohlen höchstens drei Spalten je Raster; `column` eines Spiels muss zu einer
  `columns[].id` passen, sonst (und ohne `time`) erscheint das Spiel nicht. `breaks` für Pausen; Snippet bzw. Prop
  `notice` je Spiel.
- Der Scrollbereich beider Bausteine ist eine fokussierbare Region (`role="region"`, `tabindex="0"`), benannt nach `caption`, sonst nach einem Text-`title`, sonst „Spielplan“ bzw. „Zeitraster“; so lässt er sich mit der Tastatur scrollen.
- Zustände: `scheduled`, `live` (grünes Live-Tag mit pulsierendem Punkt hinter der Uhrzeit, grüne Ergebniszahlen), `finished`, `cancelled`, `postponed`, `bye`;
  `provisional` für vorläufige Ergebnisse. Texte (Datum, Zeit) kommen fertig formatiert von der App.
- Screenreader: Das Ergebnis wird als unsichtbarer Text gesprochen; abgesagte und verschobene Spiele tragen zusätzlich
  den Text „abgesagt“ bzw. „verschoben“ (nicht nur über Farbe oder Durchstreichung erkennbar).
- Unter 640 px werden Zeilen zu Karten (Tabelle) bzw. Anwurfzeiten zu Blöcken (Raster).
- Kurznamen und Logos (auch an `MatchCard`): `ScheduleTeam.short` und `logo`; Prop `names="full" | "short"` (Standard `full`; bis 640 px Breite erscheint der Kurzname automatisch, per CSS) und `logos` (Standard aus; Logo-Bild mit leerem Alternativtext oder Initialen; im Layout `opponent` an, solange nicht `false`). Der volle Name bleibt für Screenreader lesbar.
- Kein dunkler Rahmen (`hoops-frame--dark`); der seitenweite Dark Mode wirkt über die `--hoops-*`-Variablen.

```tsx
<ScheduleTable
  games={[{ id: '1', state: 'finished', date: 'Sa, 26.09.2026', time: '17:30', at: 'heim',
            opponent: { name: 'TSV Falken Auental', href: '/teams/freising', score: 108 }, ownScore: 65 }]}
/>
```

Zuordnung Turnier-Manager: `Game` wird zu `ScheduleGame` mit `nr: '#' + gameNumber`, `time: scheduledStart + '–' + scheduledEnd`,
`field: 'F' + field`, `heim`/`gast` aus den Teams (Platzhalter über `homeLabel`/`awayLabel` mit `placeholder: true`),
`state: 'bye'` bei `byeTeamId`, `state: 'cancelled'` bei `cancelledReason`.

---

## Karten

- **`PlayerCard`** in drei Größen (`compact`, `standard`, `hero`); mit `photo` (URL) zeigt sie ein Foto statt der Trikotmarke (die Trikotnummer bleibt als Badge). `photoAlt` ist standardmäßig leer: das Foto ist dekorativ, weil der Name danebensteht. Ohne `photo`, mit leerem `photo` oder bei Ladefehler erscheint die Trikotmarke. **Datenschutz:** Fotos von Minderjährigen nur mit Einwilligung der Erziehungsberechtigten verwenden. Die Demo-Fotos in Storybook stammen von Unsplash (`stories/assets/players/CREDITS.md`), zeigen reale Personen und gehören nicht zum npm-Paket. Die Unsplash-Lizenz enthält kein Model Release (keine Einwilligung der abgebildeten Personen); die Demo-Fotos sind nur für Demonstrationen im Storybook gedacht und nicht für eigene Produkte oder mit Bezug zu echten Personen zu übernehmen.
- **`MatchCard`** zeigt den Spielabschnitt mit `period` (ab 1) und `periods` (`4` Viertel, Standard, oder `8` Achtel): „3. Viertel“, „5. Achtel“, darüber „Verlängerung“, „2. Verlängerung“. `PlayByPlay` nimmt `period` je Ereignis und `periods` an der Komponente (Chip „V3“, „A5“, „VL“; Screenreader lesen den vollen Text). `quarter` ist veraltet und wird ohne `period` unverändert angezeigt.
- **`TeamCard`**: Mannschaft mit Logo, Liga, Bilanz, Tabellenplatz, nächstem und letztem Spiel, Kader und optionaler Saison-Statistik (`stats`: nur übergebene Felder). Alles außer `name` ist optional; `size="compact"` ist die Listenzeile; mit `href` oder `onclick` ist die Karte klickbar.
- **`LeagueCard`** (Ligencard): Mini-Tabelle einer Liga in einer Karte mit Titel, Untertitel („12 Teams · 66 von 132 Spielen gespielt“), `#`, `Mannschaft`, `SP`, `PKT` und einem Link zur kompletten Tabelle. Sie zeigt nur einen **Ausschnitt**: mit einer eigenen Mannschaft (`own: true`) zwei Teams davor, die eigene und eins dahinter, sonst die ersten `limit` (Standard 3). `columns` schaltet `won`, `lost`, `diff` (Korbdifferenz) und `form` zu (bis 640 px aus); `zone` (`up`, `playoff`, `down`) markiert Auf- und Abstieg mit Streifen, Text und Legende; `live` zeigt „Live“ (mit Zahl „2 Spiele laufen“); `logos` und `names="short"` wie im Spielplan; `size="compact"` für Seitenleisten; `titleAs` wählt die Überschriftenebene. Die Regeln liegen als reine Funktionen in `league.js`.

- **`StatGrid`** und **`FormChips`** (Kennzahlen und Form): Kennzahlen-Gitter (`hoops-stats`, `compact` ohne Kacheln) als Beschreibungsliste und die Form der letzten Spiele (`hoops-form`: Punkte oder Buchstaben, höchstens fünf, mit Screenreader-Text „Form: Sieg, …“). Dieselbe Form zeigt die Spalte „Form“ der `LeagueCard`. Import: `svelte/StatGrid`, `svelte/FormChips` bzw. aus `/react`; reine Funktion `statItems` in `@hoopsfoundry/ui/stats.js`.
- **`VenueCard`** (Hallenkarte): links eine kleine Karte (die Map, nicht interaktiv, Zwei-Klick-Platzhalter), rechts `name`, `address` (`<address>`), `info`, `contact` (`tel:`/`mailto:`-Links nur bei gültiger Form), die nächsten Spiele in der Halle (`games`, höchstens `limit`, Standard 2) und der Link zur Hallenseite (`href`, `linkLabel`). Ohne `lat`/`lng` keine Karte; `size="compact"` ohne Spiele; schmal (Karte bis 640 px breit) steht die Karte oben (16:9). Funktionen in `@hoopsfoundry/ui/venue.js`. Import: `svelte/VenueCard` bzw. `VenueCard` aus `/react`.

- **`MapView`** (Svelte: `svelte/Map`): **Karte** mit [Leaflet](https://leafletjs.com) und OpenStreetMap-Kacheln für einen oder mehrere Orte (`markers`: `id`, `lat`, `lng`, `label`, `href?`, `number?`, `own?`). Standard ist die **Zwei-Klick-Lösung**: erst ein Platzhalter mit Hinweis und „Karte laden“ (kein Netzverkehr, Leaflet wird nicht geladen), `load="auto"` lädt sofort. `tileUrl` setzt einen **eigenen Kachel-Proxy** (`/tiles/{z}/{x}/{y}.png`); der Standard `tile.openstreetmap.org` ist für Demo und Entwicklung. Die **Textalternative** (nummerierte Liste mit Koordinaten, Links „In OpenStreetMap öffnen“, „In Karten-App öffnen“ (`geo:`), „Route planen“) ist immer da; die **Quellenangabe** „© OpenStreetMap-Mitwirkende“ lässt sich nicht ausblenden. Zoom-Schaltflächen, Tastatur, Fehlerfall, Dunkelmodus (Kacheln abgedunkelt), Druck (nur die Liste) und „Bewegung reduzieren“ sind eingebaut. **Leaflet ist eine optionale Peer-Abhängigkeit** (BSD-2-Clause): `npm install leaflet` und `leaflet/dist/leaflet.css` in der App laden; die Komponente lädt Leaflet erst bei Bedarf per `import('leaflet')`. Die reinen Funktionen liegen in `map.js`; die Doku enthält Rezepte für einen Kachel-Proxy (nginx, SvelteKit-Endpunkt) und die Pflichten der OSM Tile Usage Policy. Es gibt keinen Serverteil im Paket.

```tsx
<TeamCard name="TSV Nordhain 1920" short="Nordhain" league="Bayernliga Süd" record={{ w: 12, l: 3 }} rank={3} rankOf={12} href="/teams/nordhain" />
<LeagueCard title="Oberliga Nordhain Männer" teams={teams} teamCount={12} played={66} total={132} columns={['diff', 'form']} href="/liga/tabelle" />
<MatchCard state="live" period={5} periods={8} clock="03:10" heim={{ name: 'TSV Nordhain', score: 24 }} gast={{ name: 'Lindenberg Hawks', score: 22 }} />
```

## Überschriften

Komponenten mit Titel (Table, ScheduleTable, ScheduleGrid, PlayerCard, TeamCard, LeagueCard, EmptyState, PlayByPlay, Modal) geben nie eine `h1` aus; die gehört der App. Die **Ebene** (`h2` bis `h6`) wählst du mit `titleAs` an der Komponente oder für einen ganzen Abschnitt mit `HeadingLevel` (React: `@hoopsfoundry/ui/react`, Svelte: `@hoopsfoundry/ui/svelte/HeadingLevel`). Rangfolge: `titleAs` vor `HeadingLevel` vor dem Standard `h3`. Das Modal hat `titleAs` (Standard `h2`) und gibt seinem Inhalt die nächste Ebene weiter. In Vanilla-HTML schreibst du das Element selbst. Die **Größe** hängt nie an der Ebene, sondern an Tokens: `--hoops-title-size`, `--hoops-title-weight`, `--hoops-title-leading`, `--hoops-frame-title-size` (Tabellen, Spielplan, PlayByPlay) und `--hoops-card-title-size` (Karten, EmptyState); ohne Wert gelten die bisherigen Größen.

```tsx
<h1>Mannschaft</h1>
<section>
  <h2>Kader</h2>
  <HeadingLevel level={3}>
    <PlayerCard jersey="4" name="J. Tanner" />   {/* h3 */}
  </HeadingLevel>
</section>
```

## Accessibility

- **WCAG 2.1 AAA** durchgehend validiert (siehe Identity Overview · Section 01 · Audit-Tabelle).
- Body Text auf Surface: **≥ 7:1**.
- Large Text und Komponenten: **≥ 4.5:1 / 3:1**.
- Fokus-Ringe: **3 px gestrichelt, Gold/Amber** (im Dunkelmodus dezenter), ≥ 3:1 Kontrast.
- Touch-Targets: **44 / 56 / 64 px** je nach Surface (Web / Tablet / Hallen-Tisch).

---

## Themes

Tokens unterstützen Light und Dark out-of-the-box:

```html
<!-- Auto via OS-Präferenz -->
<html>

<!-- Force light -->
<html data-theme="light">

<!-- Force dark (Kampfgericht-Tablet, TV-Scoreboard) -->
<html data-theme="dark">
```

Einen Umschalter (hell, dunkel, System) liefert `initTheme` aus `theme.js`; `themeBootScript()` setzt die gemerkte Wahl im `<head>` vor dem ersten Zeichnen. Wer einen anderen Standard als „System“ will, übergibt `defaultMode` an **beide**: `themeBootScript({ defaultMode: 'dark' })` und `initTheme(button, { defaultMode: 'dark' })` (gemerkte Wahl vor `defaultMode` vor System). Mehrere Umschalter auf einer Seite bleiben synchron:

```html
<script>/* Ergebnis von themeBootScript(), mit CSP als nonce oder Hash */</script>
<button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" data-hoops="theme" hidden></button>
<script type="module">import { initAll } from '…/js/vanilla-core.js'; initAll(document);</script>
```

---

## Komponenten-Referenzen

| File | Inhalt |
|---|---|
| **Identity Overview** | Color · Type · Spacing · Buttons · AAA-Audit |
| **Tables** | Roster · Boxscore · Play-by-Play · Comparison · Crew |
| **Forms** | Inputs · States · Setup · Live Scoring · Team-Config |
| **Modals** | Confirm · Sheet · Drawer · Toast · Banner · Popover |
| **Navigation** *(v0.6)* | App-Shell · Top-Bar · Sidebar · Tabs · Breadcrumbs · Bottom-Nav · Stepper · Sub-Nav |
| **Cards & Lists** *(v0.6)* | Match-Cards · Player-Cards · Standings · Crew · Empty / Loading / Error |
| **Icons** *(v0.6)* | 67 Glyphen: Aktionen · Court · Rollen · Status · System · UI-Core |

Jede HTML-Datei ist ein eigenständiges, scrollbares Dokument zum Live-Anschauen.

---

## Storybook

Alle Komponenten und die Foundation-Seiten sind in Storybook live anschaubar
und durchklickbar, inkl. Hell/Dunkel, A11y-Checks und Code-Beispielen in drei Fassungen.

```bash
npm install
npm run storybook       # dev server auf http://localhost:6006
npm run build-storybook # statische Site nach storybook-static/
```

Was drin ist:

- **Introduction** (Startseite): Überblick, Werkzeugleiste, Inhaltsverzeichnis aller Seiten
- **Foundation:** Colors, Typography, Focus & Hover
- **Components:** je eine MDX-Seite pro Komponente oder Komponentengruppe (Button, TextInput, Select, Checkbox, Modal, Banner, Card, Card Library, TeamCard, LeagueCard, Map, VenueCard, Tabs, Accordion, Navigation, AppNav, Table, Spielplan, EmptyState, PlayByPlay, Icon, CourtLines) und die Spielwiese zum Spielplan

Die Werkzeugleiste schaltet **Marke** (BBV/DBB), **Schrift**, Hell/Dunkel, **Fassung** (Vanilla, Svelte oder React für alle
Code-Beispiele) und **Zustand** (erzwingt Hover, Fokus oder Aktiv auf den Vorschauen der Seite) um.

### Dokumentation schreiben

Eine Komponentenseite besteht aus vier Dateien in `stories/`:

- `<Name>.stories.ts`: Meta mit `argTypes` (beschriftet, für `<Controls>`) und die Demo-Story; **kein** `tags: ['autodocs']`.
- `<Name>.mdx`: die Seite (`<Meta of=…>`, Beschreibung, `<Canvas of=…>`, Zustände, `<FrameworkCode>`, `<Controls>`, `<DosDonts>`).
- `<Name>.code.ts`: die Code-Beispiele (`vanilla`, `svelte`, `react`), gegen die echten Komponenten geprüft.
- `components/<Name>Examples.svelte`: die Beispiele als Svelte-Komponente, gewählt über ein `example`-Prop.

Beispiel-Stories, die nur der Doku dienen (Zustände, Dos und Don'ts), stehen in der Stories-Datei mit `tags: ['!dev']` **als Literal**
am Story-Objekt (der Indexer liest keine Tags aus Funktionsrückgaben); so bleiben sie aus der Seitenleiste heraus. Dos und Don'ts
laufen über den Baustein `DosDonts` (`stories/docs/blocks/`), falsche Beispiele sind darin `inert`. Eine Zustände-Story
(`Zustaende`) gehört zu jeder Komponente mit bedienbaren Elementen. Die Bausteine (`DosDonts`, `FrameworkCode`, `DocTable`) liegen in
`stories/docs/blocks/`; manuelle `Docs/*`-Seiten gibt es nicht mehr.

Stories liegen unter `stories/`, geschrieben in [Svelte CSF](https://github.com/storybookjs/addon-svelte-csf).

---

## FIBA-Regel-Notizen

**Trikotnummern** (im Token-File als `validation.trikotnummer` definiert):

- Erlaubt: `0`, `00`, einstellig `1–9`, zweistellig `01–09` und `10–99`
- `7` und `07` sind **unterschiedliche Nummern**
- Eindeutig pro Mannschaft

```regex
^(0|00|0?[1-9]|[1-9][0-9])$
```

---

## Auf GitHub veröffentlichen

### Variante A · Einfach (privates Repo)

1. **Auf github.com:** Neues Repo erstellen, z. B. `hoopsfoundry-ui` — privat oder public
2. **Lokal:** Projekt herunterladen (alle Dateien aus diesem Workspace)
3. Terminal im Projekt-Ordner:
   ```bash
   git init
   git add .
   git commit -m "HoopsFoundry UI v1.0"
   git branch -M main
   git remote add origin https://github.com/<dein-user>/hoopsfoundry-ui.git
   git push -u origin main
   ```

### Variante B · Als npm-Package

Damit eure App-Repos das System via `npm install` einbinden können:

1. `package.json` im Repo-Root anlegen:
   ```json
   {
     "name": "@hoopsfoundry/ui",
     "version": "1.0.0",
     "description": "HoopsFoundry UI for Basketball Apps",
     "main": "tokens/tokens.css",
     "exports": {
       "./tokens.css":    "./tokens/tokens.css",
       "./tokens.json":   "./tokens/tokens.json",
       "./tailwind":      "./tokens/tailwind.preset.js",
       "./svelte/*":      "./svelte/*.svelte"
     },
     "files": ["tokens/", "svelte/", "README.md"],
     "license": "MIT"
   }
   ```
2. In den App-Repos:
   ```bash
   # Wenn das Repo public ist:
   npm install <github-user>/<repo>

   # Wenn private:
   # GitHub Packages oder als git+ssh URL
   npm install git+ssh://git@github.com:<user>/<repo>.git
   ```

### Variante C · GitHub Pages (Docs live hosten)

Die HTML-Dokumente werden automatisch öffentlich anschaubar:

1. Im Repo: **Settings → Pages**
2. Source: `main` Branch, Ordner `/` (root) oder `/docs`
3. Save → nach ~2 Minuten ist die Library erreichbar unter:
   ```
   https://<user>.github.io/<repo>/
   ```

### GitHub-Setup-Checkliste

- [ ] GitHub-Account hast du bereits
- [ ] Repo erstellt (public oder private, Lizenz wählen — MIT für freie Nutzung)
- [ ] `.gitignore` mit `node_modules/`, `.DS_Store`, etc.
- [ ] README.md (dieses Dokument)
- [ ] CHANGELOG.md (für Versionierung)
- [ ] Tag für v0.5 (Pre-release):
  ```bash
  git tag -a v0.5.0 -m "Pre-release · Foundation complete"
  git push --tags
  ```

---

## Nächste Schritte (optional)

- **Visual Regression Tests** mit Playwright + Percy
- **Figma Tokens** Export via Tokens Studio Plugin (tokens.json kompatibel)
- **Icon-Library** als eigenes Sub-Package

---

## Lizenz

MIT · Frei für Vereins-, Verbands- und kommerzielle Nutzung im Basketball-Kontext.

---

*Maintained for the Basketball-Apps ecosystem · v0.6 (Pre-release) · Mai 2026*
