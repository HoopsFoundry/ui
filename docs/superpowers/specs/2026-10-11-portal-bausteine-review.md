# Review: Bausteine aus dem Vereinsregister, die dem DSS fehlen

Stand: 2026-10-11 · Quelle: `03-Vereinsregister/portal` (`dss/components.css`, `pagenav.js`, `theme.js`, `favorites.js`, `report.js`). Gelesen und bewertet, noch nichts übernommen. Grundlage für Paket V1 des Vanilla-Pakets (`2026-10-11-vanilla-paket-design.md`).

## Übersicht und Empfehlung
| Baustein im Portal | Im DSS? | Empfehlung |
|---|---|---|
| `dss-btn--danger` | ja (`--err-button`, Text `--base-0`) | nichts tun |
| `dss-stats`, `dss-stat--compact` | `dss-stat` ja, Gitter und kompakte Variante nein | übernehmen (nur CSS), auf Tokens umstellen |
| `dss-form` (letzte Spiele als Chips) | nein; LeagueCard hat eigene Formpunkte | übernehmen, mit LeagueCard-Form vereinheitlichen |
| `dss-row-meta`, `dss-row-teams`, `dss-rows`/`dss-row--match` | alte Zeilenform, ersetzt durch `ScheduleTable` (`dss-sch-*`) | **nicht** übernehmen; Portal wechselt auf `ScheduleTable` (Paket V2) |
| `dss-pagenav` + `pagenav.js` | nein (nur die Sprungleiste des Accordions) | übernehmen als `initPageNav`, verallgemeinert (siehe unten) |
| `dss-backtop` | nein | übernehmen als `initBackToTop`, mit Korrekturen |
| `theme.js` (`applyTheme`, `toggleTheme`) | nein | übernehmen als `initTheme`, neu geschrieben |
| `dss-map-pin--seat` | Map hat `own`-Marker, aber keinen Sitz-Marker | als Marker-Art `kind: 'seat'` in `MapView`, nicht als eigenes CSS |
| Dunkel-Filter der Kacheln (invertieren) | Map hat `dimInDark` (abdunkeln) | Option `darkTiles: 'dim' \| 'invert'` prüfen |
| `favorites.js` (Merken) | nein | später: `FavoriteButton` (Umschalter mit `aria-pressed`) plus reine Logik |
| `report.js` („Fehler melden“) | nein | eher Portal-eigen; als Link-Muster in der Doku, kein Baustein |

## Befunde je Baustein

### Stat-Gitter und Form-Chips (nur CSS)
- Die Werte sind feste Pixel (`26px`, `18px`, `10.5px`, `130px`); das DSS nutzt `--fs-h2`, `--fs-caption`. **Auf Tokens umstellen.**
- `.dss-form .dss-chip { min-height: 24px }` erfüllt WCAG 2.5.8 nur, weil die Chips nicht klickbar sind. Dokumentieren.
- Die Form darf nie nur Farbe sein: Das Portal hängt für Screenreader „Sieg“/„Niederlage“ an. Muss Teil des Bausteins werden (versteckter Text oder Buchstabe S/N), mit Test. LeagueCard nutzt dafür `formLabel` aus `js/league.js`; **eine** Form-Darstellung für beide Stellen.
- Doku-Seite: Foundation oder Abschnitt in TeamCard/LeagueCard, mit Dos/Don'ts.

### Seitennavigation (`pagenav.js`, `dss-pagenav`)
Gut: baut aus den Überschriften eine Liste, vergibt fehlende ids eindeutig (`slug` löst Umlaute auf), beobachtet Inhalt, der im Browser nachgeladen wird (debounced `MutationObserver`, Signatur gegen Neuaufbau), nutzt echte `nav`/`ul`/Links, beachtet `<base href>`, klappt `details` beim Sprung auf.

Zu ändern:
1. **Fest verdrahtet:** `main.verein-main`, `#verein-content, #team-content`, nur `h2`, Texte „Auf dieser Seite“ und „Nach oben“. → Optionen `root`, `selector`, `container`, `label`, `backLabel`, `minHeadings`, `skipAttribute`.
2. **Nur `details`:** Der Sprung öffnet `details`, nicht die Accordion-Bereiche des DSS (Buttons, `inert`, Deep-Link). → Zusammenführen mit `hashTarget`/`ancestorsOf` aus `js/accordion.js`; ein Sprungleisten-Konzept statt zwei.
3. **Zwei `nav` „Auf dieser Seite“** (Seitennavigation plus Accordion-Sprungleiste) → `landmark-unique`; Namen konfigurierbar, Standard der Accordion-Leiste bleibt ihr eigener.
4. **UMD plus Auto-Start:** exportiert global `PageNav` und startet beim Laden von selbst. Eine Bibliothek darf das nicht. → ES-Modul, Start nur durch `initPageNav(...)`/`initAll`, `destroy()` (Observer, Listener entfernen).
5. **`innerHTML`** für das Pfeil-Symbol im Nach-oben-Knopf (fester Text, aber gegen unsere Regel). → SVG per `createElementNS`.
6. **Bewegung:** Scroll nutzt nur `prefers-reduced-motion`, nicht `data-motion="reduce"` des DSS. → gemeinsame Hilfe `reducedMotion()` (existiert in `js/map-leaflet.js`).
7. **Nach oben:** feste Position unten rechts, `z-index: 20` hart, kollidiert mit der festen `dss-bnav` (BottomNav) und Sicherheitsabständen; nicht im Druck ausgeblendet; 44 px stimmt (`--touch-sm`). → Token `--dss-backtop-offset`, `env(safe-area-inset-*)`, Druckregel, `z-index` über ein Token.
8. **Globale Selektoren:** `html { scroll-padding-bottom }` und `h2[id] { scroll-margin-top }` wirken auf die ganze App. → über Tokens (`--dss-scroll-offset`) und Opt-in-Klasse; muss mit `stickyOffset` des Accordions zusammenspielen.
9. Aussehen: Links als `dss-tabs--pills` + `dss-tab` ist akzeptabel (Liste von Links, kein `role=tab`), aber die Klassen gehören zu Tabs; eigene Klasse `dss-pagenav-link` oder Dokumentation der Absicht.
10. Fehlende Tests im DSS: Fokus nach „Nach oben“ (Überschrift mit `tabindex=-1`, ohne `h1` Rückfall auf `main`), Dynamik (Überschriften erscheinen später), doppelte Texte, `destroy`.

### Theme-Umschalter (`theme.js`)
- Globale Funktionen und Inline-`onclick`, feste Element-ids (`theme-icon-sun` …), Symbole per `style.display`. → `initTheme(button, options)` mit `destroy`, Symbole per CSS-Zustand (`[data-theme]`) oder `hidden`.
- Nur zwei Zustände. Das DSS-CSS folgt `prefers-color-scheme`, wenn kein `data-theme` gesetzt ist; ein dritter Zustand „System“ wäre ehrlicher, und spätere Änderungen der Systemeinstellung werden heute ignoriert. → `mode: 'light'|'dark'|'system'`, Änderungen hören.
- Speicherschlüssel `theme` ist zu allgemein → Standard `dss-theme`, konfigurierbar; Speicher blockiert → ohne Fehler (bereits so).
- **Flackern:** Der Anfangszustand muss vor dem ersten Zeichnen gesetzt werden. → kleines Inline-Skript `themeBootScript()` (Zeichenkette, CSP-Hinweis) für den `<head>`.
- Zugänglichkeit: Beschriftung wechselt („Zum Dark-Modus wechseln“): besser feste Beschriftung plus `aria-pressed`, deutsch einheitlich „Dunkelmodus“.

### Sitz-Marker und Karten-Dunkelmodus
- Portal-Pins sind 16 und 28 px (Leaflet-`divIcon`, Popups); die DSS-Marker sind 44 px große Buttons mit Namen. Den Sitz-Marker deshalb als Art (`kind: 'seat'`, Haus-Symbol) in `MapView`, nicht als CSS übernehmen. Kontrast des Symbols (≥ 3:1 gegen helle und dunkle Kacheln) wie bei den anderen Markern prüfen.
- Dunkle Kacheln: Das Portal invertiert (`invert hue-rotate brightness`), das DSS dunkelt nur ab. Beides hat Nachteile (Wasser/Straßenfarben wirken fremd bzw. Karte bleibt hell). → Option `darkTiles` mit beiden Verfahren, Standard bleibt `dim`; Kontrast der Attributionszeile messen.

### Favoriten und „Fehler melden“
- `favorites.js`: reine Logik (`parse`, `toggle`, `has`, Grenzen 50, defensives Einlesen) ist solide und testbar. Als DSS-Baustein sinnvoll: `FavoriteButton` (`aria-pressed`, Name „Merken: <Name>“, Zustand nicht nur Farbe) und `js/favorites.js` mit Speicher-Adapter. Entscheidung offen, weil Speicherung zur App gehört.
- `report.js`: Portal-eigen (feste Repository-URL, Vorlagenname). Als Doku-Beispiel für „Link, der extern öffnet“ (`rel=noopener`, versteckter Hinweis) reicht.

## Reihenfolge (Vorschlag für Paket V1)
1. Gemeinsame Grundlagen: `reducedMotion`, `safeHref`-Modul, Muster `init*/destroy`, `initAll`.
2. Stat-Gitter, kompakte Stats, Form (CSS und Doku), LeagueCard auf dieselbe Form.
3. `initPageNav` (mit Accordion-Anbindung), `initBackToTop`, `initTheme` + Boot-Skript; Tests, Docs-Seite, axe.
4. `kind: 'seat'` und `darkTiles` in `MapView`.
5. Danach Tabs, Modal, Bündelung (siehe Vanilla-Entwurf); Favoriten nach Entscheidung.
