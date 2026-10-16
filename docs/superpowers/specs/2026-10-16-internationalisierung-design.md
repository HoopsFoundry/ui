# Design: Internationalisierung der eingebauten Texte (i18n)

Stand: 2026-10-16 · Anlass: HoopsFoundry UI ist nicht spezifisch deutsch; internationale Vereine und Verbände sollen es mit eigenem Theme und eigener Sprache nutzen können.

## Entscheidungen des Auftraggebers
| Frage | Entscheidung |
|---|---|
| Standardsprache | **Englisch** (`en`), wenn nichts eingestellt ist |
| Wie wird die Sprache eingestellt | **Global** (eine Sprache pro Seite oder App) und **einzelne Texte überschreibbar**. Keine `locale`-Option je Komponente. Ausnahme: die Vanilla-`render*`-Funktionen (laufen auch in Node, mehrere Sprachen im selben Prozess) nehmen `options.locale` entgegen, wenn keine globale Sprache gesetzt ist |
| Sprachen im ersten Schritt | **Deutsch und Englisch**; weitere Sprachen ergänzt jede Anwendung als eigenen Katalog |
| Reihenfolge | Vor englischer Doku und Theme-Leitfaden. Technisch nach Stufe T der Umbenennung, weil beide dieselben Dateien berühren; Umsetzung auf den dann gültigen Namen |

## Ausgangslage
- Texte der Komponenten sind fest deutsch in Svelte, React und den Vanilla-Modulen (zum Beispiel „Karte laden“, „Nach oben“, „Dunkelmodus“, „vorläufig“, Statuszeilen, `aria-label`s wie „Schließen“, „Legende“, „Saison-Statistik“, Zusammenfassungen wie „12 Teams · 15 von 132 Spielen gespielt“, Formtexte „Sieg/Niederlage“, Himmelsrichtungen und Dezimalkomma in `formatCoords`).
- Einzelne Texte sind schon über Props überschreibbar (`mapText`, `seatLabel`, `label`, `linkLabel`, `gamesLabel`, …).
- Die Standardsprache ändert sich von Deutsch auf Englisch. Das ist ein Bruch für die internen Konsumenten (einmal `de` setzen); das Migrationsskript hilft dabei.

## Architektur
- **Kataloge:** flache Schlüssel je Baustein, zum Beispiel `map.load`, `map.error.tiles`, `modal.close`, `pagenav.label`, `backtop.label`, `theme.toggle`, `league.summary`, `form.win`. Werte sind Zeichenketten mit Platzhaltern `{name}`; Mehrzahl über `Intl.PluralRules` (Schlüssel mit `one`/`other`-Varianten, `zero`/`few`/… optional). Dateien `js/i18n/en.js` und `js/i18n/de.js` (reine ESM-Objekte, Typen in `.d.ts`).
- **API (`js/i18n/index.js`):** `t(key, params?, options?)`, `setLocale(code)`, `getLocale()`, `registerLocale(code, catalog)`, `localeOf(options)`; `options` erlaubt `locale` und `texts` (Überschreibungen). Rückfallkette: Überschreibung → Katalog der Sprache → Basissprache (`de-AT` → `de`) → `en`. Fehlender Schlüssel in `en` ist ein Fehler im Test, in der Entwicklung eine Warnung.
- **Formatierung:** Zahlen, Datum, Koordinaten über `Intl` mit der gewählten Sprache (zum Beispiel `formatCoords` nicht mehr mit festem Komma). Vom Konsumenten gelieferte Texte (Namen, Daten wie „Sa, 12.10.“) bleiben unverändert.
- **Einbindung je Fassung:**
  - Vanilla: globales `setLocale`; `initAll`/`mount*`/`init*` lesen die globale Sprache; `render*` nehmen `options.locale` als Rückfall; `setLocale` sendet `hoops:localechange`, mountete Bausteine aktualisieren sich.
  - Svelte: globaler reaktiver Zustand (Svelte-5-Runes im Modul), `setLocale` aktualisiert alle Komponenten.
  - React: Provider (`HoopsProvider locale`) und Hook `useLocale`; ohne Provider gilt die globale Sprache.
- **Überschreiben einzelner Texte:** bestehende Props bleiben; zusätzlich `texts` je Komponente (Schlüssel des Katalogs) und global `setTexts({...})`.
- **Auslieferung:** Englisch liegt im Kern; `de` als eigenes kleines Modul (`@hoopsfoundry/ui/i18n/de`, im Bündel `hoops-i18n-de.js`), das sich beim Import selbst registriert, damit der Kern nicht wächst; weitere Sprachen nach demselben Muster.
- **Zugänglichkeit:** wechselnde Sprache setzt `lang` an Wurzelelementen von Bausteinen, deren Sprache von der Seite abweicht (nur wenn `document.documentElement.lang` bekannt ist); Statuszeilen (`role=status`) bleiben korrekt vorgelesen.

## Umfang und Pakete
1. **I1 Infrastruktur und Inventar:** vollständiges Inventar aller fest eingebauten Texte (Svelte, React, `js/*`, `js/render/*`, Vanilla-Module, CSS-`content`), Katalogschema, `js/i18n/*`, Typen, Tests (Rückfallkette, Mehrzahl, Platzhalter, Überschreibung, fehlende Schlüssel), Prüfskript für fehlende Schlüssel je Sprache.
2. **I2 Vanilla und Render:** `init*`, `render*`, `mount*`, `initAll`, Karte (`map-vanilla`, `map-leaflet`), Seitennavigation, Nach-oben, Theme, Modal, Tabs.
3. **I3 Svelte und React:** alle Komponenten, `HoopsProvider`/`useLocale`, Parität (gleiche Texte in drei Fassungen, SSR-Vergleich pro Sprache).
4. **I4 Doku und Werkzeuge:** Storybook-Toolbar „Sprache“ (en/de), Seite `Foundation/Internationalisierung` (Einstellen, Überschreiben, Sprache ergänzen, Katalogformat, Übersetzungsleitfaden mit Glossar), Prüfskript, Doku-Beispiele, Migrationstabelle (Standardwechsel auf `en`, Hinweis `setLocale('de')`), ADR, CHANGELOG, README.

## Tests und Prüfung
- Jede Sprache rendert jede Komponente ohne Rohschlüssel (kein `map.load` im Text), SSR-Parität Svelte, React und Vanilla je Sprache, Schlüsselabdeckung (jeder im Code verwendete Schlüssel steht in `en` und `de`; Katalogschlüssel ohne Verwendung melden), Verbotstest gegen neue fest eingebaute Zeichenketten (Allowlist für Daten), Mutationstests (Rückfallkette, Mehrzahl, Überschreibung, `lang`, Standardsprache), Browser: axe pro Sprache, Sprachwechsel zur Laufzeit ohne Neuladen, Bündelbudgets (Kern darf nur um den englischen Katalog wachsen; Budgetanpassung begründen).
- Doku-Fakten (Schlüsselzahlen, Bündelgrößen) werden gemessen.

## Nicht Teil dieses Entwurfs
Rechts-nach-links-Sprachen, Übersetzung der Storybook-Doku (eigener Punkt), automatische Spracherkennung, Datumsformatierung von Texten, die der Konsument liefert.

## Offene Punkte
Die Wahl des Katalog-Schlüsselschemas wird im ersten Paket mit dem Inventar festgelegt; Französisch und Spanisch erst nach dem Start (Aufgabe für Beitragende, mit Prüfskript für fehlende Schlüssel).
