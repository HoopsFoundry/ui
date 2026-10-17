# Internationalisierung I1: Infrastruktur und Inventar

Spec: `docs/superpowers/specs/2026-10-16-internationalisierung-design.md`. Dieses Paket ist I1 von I1 bis I4.

**Ziel:** Ein framework-freier i18n-Kern (`js/i18n/*`), vollständige Kataloge `en` und `de` für alle heute fest eingebauten Texte, ein Inventar, Prüfskript und Tests. **Keine sichtbare Änderung an Komponenten**: Svelte, React, `js/render/*` und die Vanilla-Module bleiben in I1 unverändert und liefern weiter deutsche Texte. Die Verdrahtung (und damit der Wechsel der Standardsprache auf Englisch) folgt in I2 (Vanilla/Render) und I3 (Svelte/React).

## Festlegungen (offener Punkt der Spec, hier entschieden)

- **Schlüsselschema:** `<baustein>.<bedeutung>` in Punktschreibweise, Kleinbuchstaben, Bausteine wie im Parity-Manifest (`map`, `modal`, `tabs`, `pagenav`, `backtop`, `theme`, `league`, `schedule`, `stats`, `form`, `venue`, `team`, `player`, `table`, `empty-state`, …), mehrteilige Bedeutung mit `.`, Wörter mit `-` (Beispiele: `map.load`, `map.error.tiles`, `modal.close`, `league.summary`, `form.win`). Gemeinsame Texte unter `common.*`.
- **Werte:** Zeichenketten mit Platzhaltern `{name}`. Mehrzahl: Objekt mit Kategorien von `Intl.PluralRules` (`one`/`other` Pflicht, `zero`/`two`/`few`/`many` optional), Platzhalter `{count}` ist die Zahl. Kein Markup in Werten.
- **Kern ohne Framework:** `js/i18n/index.js` hat keine Abhängigkeit von DOM, Svelte oder React und läuft in Node. Zustand ist ein Modul-Singleton (Sprache, Kataloge, globale Überschreibungen) mit `subscribe(fn)` → Abmeldefunktion, damit I2/I3 reagieren können (Event `hoops:localechange` und Svelte-/React-Anbindung gehören nicht zu I1).
- **Auslieferung:** `en` liegt im Kern (`js/i18n/en.js` wird von `index.js` importiert und ist immer registriert). `de` ist ein eigenes Modul `js/i18n/de.js` (exportiert den Katalog) und `js/i18n/de-register.js` (registriert beim Import, Nebeneffekt). `package.json` `exports`: `./i18n` → `js/i18n/index.js`, `./i18n/en`, `./i18n/de` (importiert und registriert). Das Vanilla-Bündel `hoops-i18n-de.js` kommt in I2.

## API (`js/i18n/index.js`, Typen in `index.d.ts`)

```js
t(key, params?, options?)      // → string
setLocale(code)                // global, Normalisierung 'de-AT' bleibt erhalten; Auflösung siehe Rückfallkette
getLocale()                    // aktuelle Sprache, Standard 'en'
registerLocale(code, catalog)  // fügt hinzu oder ersetzt; ruft Abonnenten
setTexts(overrides)            // globale Überschreibungen { schlüssel: text }, ersetzt die vorherigen; setTexts({}) löscht
subscribe(fn)                  // fn(locale) bei setLocale/registerLocale/setTexts; gibt Abmeldefunktion zurück
localeOf(options?)             // options.locale ?? getLocale()
availableLocales()             // registrierte Codes
```

- `options`: `{ locale?: string, texts?: Record<string,string|PluralObject> }`.
- **Rückfallkette** für `t`: `options.texts[key]` → `getTexts()[key]` → Katalog der Sprache (`de-AT`) → Basissprache (`de`) → `en`. Fehlt der Schlüssel auch in `en`: in der Entwicklung (`NODE_ENV !== 'production'`) `console.warn` einmal je Schlüssel, Rückgabe ist der Schlüssel selbst; Test erzwingt, dass das im Code nie vorkommt.
- **Platzhalter:** `{name}` wird durch `params.name` ersetzt (`String`, `null`/`undefined` → leere Zeichenkette ist ein Fehler im Test, im Betrieb bleibt der Platzhalter stehen). `{{`/`}}` sind nicht nötig (keine Escape-Regel, in Katalogen kommen keine geschweiften Klammern als Text vor; Test prüft das).
- **Mehrzahl:** hat der Wert die Form `{one, other, …}`, wählt `new Intl.PluralRules(locale).select(params.count)` die Kategorie; fehlt sie, gilt `other`. `params.count` muss eine Zahl sein.
- **Formatierung** (`js/i18n/format.js`): `formatNumber(n, options?, localeOptions?)`, `formatCoords(lat, lng, localeOptions?)` ohne festes Komma (Himmelsrichtungen aus dem Katalog `common.direction.n|e|s|w`), nutzen `Intl` mit `localeOf`.

## Aufgaben

### Aufgabe 1: Kern und Typen
**Dateien:** `js/i18n/index.js`, `js/i18n/index.d.ts`, `js/i18n/format.js`, `js/i18n/format.d.ts`, `tests/i18n-core.test.ts`
- [ ] Tests zuerst (rot): Standardsprache `en`; `setLocale('de')` + registrierter Katalog; Rückfallkette in jeder Stufe (Überschreibung je Aufruf, globale Überschreibung, Sprache, Basissprache `de-AT` → `de`, `en`); fehlender Schlüssel gibt den Schlüssel zurück und warnt genau einmal; Platzhalter (mehrfach, fehlender Parameter bleibt stehen); Mehrzahl für `en` (one/other), `de`, ein Katalog mit `few` (Polnisch `pl`), fehlende Kategorie → `other`; `subscribe`/Abmelden, Aufruf bei `setLocale`, `registerLocale`, `setTexts`; `localeOf`; `setTexts({})` löscht; Zustand in Tests per `__resetForTests()` (exportiert, nur zum Testen, dokumentiert) zurücksetzbar.
- [ ] Umsetzung, grün.
- [ ] Mutationstests nach dem Muster `tests/*-mutation.test.ts` (Quelltext verfälschen, Regel muss kippen): Rückfallkette (Basissprache entfernt, `en`-Rückfall entfernt), Mehrzahl (`other`-Rückfall), Überschreibung (Vorrang vertauscht), Standardsprache (`'en'` → `'de'`), Abmelden.

### Aufgabe 2: Inventar
**Dateien:** `docs/superpowers/specs/2026-10-17-i18n-inventar.md`
- [ ] Alle fest eingebauten, sichtbaren oder vorgelesenen Texte erfassen: `svelte/*.svelte`, `react/*.tsx`, `js/*.js`, `js/render/*.js`, Vanilla-Module (`modal`, `tabs`, `pagenav`, `backtop`, `theme`, `appnav`, `map-*`), CSS-`content` mit Text, `aria-label`, `title`, `alt`, Platzhalter, Statuszeilen, Fehlertexte, Himmelsrichtungen, Tausender-/Dezimaltrennzeichen, Wochentage/Monate falls fest eingebaut. Auszunehmen und im Inventar als solche geführt: Konsumentendaten (Namen, Daten), Entwickler-Warnungen in `console.*` (bleiben Deutsch, ausdrücklich eine Entscheidung im Dokument), Demo-Texte in `stories/`.
- [ ] Je Eintrag: Datei und Zeile, heutiger deutscher Text, Schlüssel, englischer Text, ob Mehrzahl/Platzhalter, ob das Prop-Überschreiben schon existiert (z. B. `mapText`, `seatLabel`). Gruppiert nach Baustein; Summen je Baustein am Anfang.
- [ ] Kurze Liste der Stellen, die nicht über einen Schlüssel lösbar sind (zusammengesetzte Sätze, Wortstellung), mit Vorschlag für I2/I3.

### Aufgabe 3: Kataloge
**Dateien:** `js/i18n/en.js`, `js/i18n/de.js`, `js/i18n/de-register.js`, `js/i18n/catalog.d.ts`, `tests/i18n-catalog.test.ts`
- [ ] Alle Inventarschlüssel in `en` und `de`. Das deutsche Wort bleibt Wort für Wort der heutige Text (Verhaltensgleichheit in I2/I3); der englische ist eine natürliche Übersetzung mit denselben Platzhaltern. Einheitliche Begriffe (Glossar am Ende des Inventars).
- [ ] Tests: gleiche Schlüsselmenge in `en` und `de`; gleiche Platzhalter je Schlüssel und Sprache; Mehrzahlobjekte haben `one` und `other` und dieselben Platzhalter in allen Formen; keine leeren Werte; keine HTML-Zeichen `<`/`>` in Werten; Schlüssel entsprechen dem Schema (Regex); keine geschweiften Klammern außer Platzhaltern.
- [ ] Test „heutige Texte": für eine Stichprobe von mindestens 25 Schlüsseln (aus verschiedenen Bausteinen, inklusive Mehrzahl und Platzhalter) steht der deutsche Katalogtext identisch im heutigen Quelltext (liest die Quelldatei, prüft Vorkommen); so wird die Behauptung „Wort für Wort" belegt.

### Aufgabe 4: Prüfskript
**Dateien:** `scripts/check-i18n.mjs`, `tests/check-i18n.test.ts`
- [ ] `node scripts/check-i18n.mjs [--locale=xx]`: meldet je Sprache fehlende und überzählige Schlüssel gegenüber `en`, abweichende Platzhalter, fehlende Mehrzahlformen (nach `Intl.PluralRules` der Sprache, mit Hinweis auf Pflichtkategorien), und mit `--unused` Katalogschlüssel ohne Verwendung in `svelte/`, `react/`, `js/`. Exit 1 bei Fehlern, deutsche Meldungen. Ohne Argument alle registrierten Kataloge unter `js/i18n/`.
- [ ] In I1 sind noch alle Schlüssel „unbenutzt": Test und Skript führen eine Allowlist `scripts/i18n-unused-allowlist.json` (Schlüssel → Paket, in dem sie verdrahtet werden, `I2` oder `I3`); der Test schlägt fehl, wenn ein Schlüssel verwendet wird, der noch in der Allowlist steht (Allowlist schrumpft, nie unbemerkt).
- [ ] Tests mit künstlichen Katalogen (fehlender Schlüssel, Platzhalter vertauscht, Mehrzahl unvollständig) und Mutationstest.
- [ ] Verbotstest `tests/i18n-hardcoded.test.ts` als **Messung, noch nicht erzwingend**: zählt feste deutsche Texte in den Quellen und vergleicht mit dem Inventar (Zahl der Inventareinträge deckt die Funde); die Erzwingung kommt, wenn I2/I3 die Texte verdrahtet haben.

### Aufgabe 5: Veröffentlichung und Dokumentation
**Dateien:** `package.json` (`exports`, `files` falls nötig), `docs/architecture/sections/05-building-block-view.adoc`, `docs/architecture/sections/08-crosscutting-concepts.adoc`, `docs/architecture/sections/09-architecture-decisions.adoc` (ADR-012), `CHANGELOG.md`, `tests/` (Exports-Test, falls vorhanden anpassen)
- [ ] `exports` für `./i18n`, `./i18n/en`, `./i18n/de` (siehe oben), `.d.ts` für die Katalogmodule. Der vorhandene Test für `exports` und `npm pack` (`tests/release-vanilla.test.ts`) muss grün bleiben und enthält die neuen Dateien.
- [ ] arc42: Baustein i18n (Kapitel 5), Querschnittskonzept „Texte und Sprachen“ (Kapitel 8), ADR-012 mit Kontext, Entscheidung (global plus Überschreibungen, `render*`-Option, Englisch Standard, `de` als eigenes Modul, Schlüsselschema), Status „angenommen, I1 umgesetzt; Verdrahtung in I2 und I3“, Konsequenzen (Bruch bei Standardwechsel erst mit I2/I3), Quellen (Spec, Plan). Keine Planstände im Text von arc42.
- [ ] CHANGELOG „Hinzugefügt“: i18n-Kern und Kataloge (noch ohne Wirkung auf die Komponenten).

## Abnahme

- `npm test` (nie parallel), `npm run typecheck`, `npm run build` grün; Bündelbudgets unverändert (der Kern wird in I1 in keines der Vanilla-Bündel eingebunden).
- Kein Diff in `svelte/`, `react/`, `js/render/`, `css/` außer neuen Dateien unter `js/i18n/`.
- Inventar vollständig: Stichprobe des Reviewers (mindestens 30 zufällige feste Texte aus den Quellen stehen im Inventar).
- `node scripts/check-i18n.mjs` meldet für `en` und `de` keine Fehler.
