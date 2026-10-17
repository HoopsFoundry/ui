# Internationalisierung I2: Vanilla und Render

Spec: `docs/superpowers/specs/2026-10-16-internationalisierung-design.md`. Vorgänger: I1 (Kern `js/i18n/*`, Kataloge `en`/`de`, Inventar `docs/superpowers/specs/2026-10-17-i18n-inventar.md`, Prüfskript `scripts/check-i18n.mjs`). Dieses Paket ist I2 von I1 bis I4.

**Ziel:** Die gemeinsame Logik in `js/*.js`, die Render-Funktionen `js/render/*`, die Vanilla-Module (`init*`, `mount*`, `initAll`) und die Karte lesen ihre Texte über `t(...)` aus den Katalogen. Die Standardsprache ist Englisch. Das deutsche Vanilla-Bündel `hoops-i18n-de.js` wird gebaut und ausgeliefert.

**Nicht Teil von I2:** `svelte/*.svelte` und `react/*.tsx` bleiben unverändert (I3). Die gemeinsame Logik in `js/*.js` wird auch von Svelte und React aufgerufen. Sie liefert ab I2 also die Texte der gewählten Sprache; die in den Svelte- und React-Dateien fest eingebauten Texte bleiben bis I3 deutsch. Das ist ein Zwischenzustand ohne Veröffentlichung (I2 und I3 gehören in dieselbe Version). Doku-Seiten und Storybook-Toolbar folgen in I4.

## Festlegungen

- **Zuordnung der Schlüssel zu Paketen:** `scripts/i18n-unused-allowlist.json` führt je Schlüssel `I2` oder `I3`. I2 verdrahtet alle Schlüssel, die im Quelltext von `js/`, `js/render/` oder in einem Vanilla-Modul vorkommen (Inventar, Spalte „Quelltext“). Schlüssel, die nur in `svelte/` und `react/` vorkommen, bleiben `I3`. Am Ende von I2 enthält die Zulassungsliste nur noch `I3`-Schlüssel; der Test erzwingt das.
- **Texte je Aufruf:** Jede `render*`-Funktion, jedes `init*` und `mount*` nimmt in `options` `locale` (Zeichenkette) und `texts` (Überschreibungen nach Katalogschlüssel) entgegen und reicht beides an `t` durch. **Bestehende Eigenschaften und Optionen, die heute Texte überschreiben (`mapText`, `seatLabel`, `label`, `linkLabel`, `gamesLabel`, `navLabel` …), behalten Vorrang** vor `options.texts` und Katalog. Reihenfolge: bestehende Option > `options.texts` > globale Überschreibung > Katalog (Rückfallkette des Kerns).
- **Sprache bei `render*`:** `options.locale` > globale Sprache (`getLocale()`) > `en`. `render*` laufen auch in Node mit mehreren Sprachen im selben Prozess und dürfen keinen globalen Zustand ändern.
- **Ereignis:** Das Vanilla-Paket (nicht der DOM-freie Kern) abonniert den Kern und sendet bei Änderung von Sprache, Katalog oder Überschreibungen auf `document` (falls vorhanden) das `CustomEvent` `hoops:localechange` (`detail: { locale }`). Gemountete Bausteine (`init*`, `mount*`) hören darauf und aktualisieren ihre Texte (Beschriftungen, `aria-label`, Statuszeilen) ohne Neuaufbau und ohne den Fokus oder Zustand zu verlieren; `destroy()` meldet sich ab. Es entstehen keine Listener-Lecks (Test: nach `destroy` und nach Wiederholung kein Zuwachs der Abonnenten; der Kern bietet dafür ein Prüf-Hilfsmittel `__subscriberCount()`, nur zum Testen, wie `__resetForTests`).
- **Öffentliche Vanilla-API:** `hoops.js` exportiert zusätzlich `setLocale`, `getLocale`, `registerLocale`, `setTexts`, `t`, `availableLocales` (Typen in `hoops.d.ts` bzw. `vanilla.d.ts`, wie die übrigen Exporte). `initAll` liest `data-hoops-locale` am Wurzelelement nicht; die Sprache ist global (Spec: keine `locale`-Option je Komponente).
- **`lang`-Attribut:** Weicht die globale Sprache (Basissprache, z. B. `de`) von `document.documentElement.lang` ab (nur wenn `documentElement.lang` nicht leer ist), setzen `render*` und `mount*` an der Wurzel des Bausteins `lang="<Sprache>"`; sonst kein `lang`. `render*` in Node setzen `lang` nur, wenn `options.documentLang` übergeben wird und abweicht (Node kennt kein `document`).
- **Bündel `hoops-i18n-de.js`:** eigenes, kleines ES-Modul in `dist/vanilla` (Min-Fassung `hoops-i18n-de.min.js`), das `js/i18n/de-register.js` bündelt und sich beim Import registriert. Es braucht weder `hoops.js` noch `hoops-render.js`, sondern importiert den Kern aus demselben Verzeichnis (gleiche Instanz wie `hoops.js`: Lösung zuerst klären, siehe Aufgabe 6). `sideEffects` in `package.json` führt die Datei (Lehre aus dem Review von I1: sonst verwerfen Bündler sie).
- **Tests und Standardsprache:** Weil die Standardsprache wechselt, würden die vielen bestehenden Tests, die deutsche Texte erwarten, rot. Lösung: Vitest-Setup `tests/setup-i18n.ts` (in `vitest.config` unter `setupFiles`) registriert `de` und setzt `setLocale('de')` für **alle bestehenden Tests**. Neue Tests für die Standardsprache und für Englisch setzen den Zustand selbst (`__resetForTests()`, danach ausdrücklich `en` oder `de`). Ein eigener Test beweist, dass **ohne** Setup (frischer Prozess, Node-Skript über `spawnSync` des Testwerkzeugs, nicht über `child_process`-Ausführung von Shell-Text) die Standardsprache `en` ist und `render*` englischen Text liefern. Das Setup ist im Plan und in ADR-012 als Testkonvention erwähnt.

## Aufgaben

### Aufgabe 1: Testgrundlage
**Dateien:** `tests/setup-i18n.ts`, `vitest.config.ts` (nur `setupFiles`), `tests/i18n-default.test.ts`
- [ ] Setup registriert `de` und setzt `de`; alle bestehenden Tests bleiben grün (`npm test` vor der Verdrahtung grün halten).
- [ ] `tests/i18n-default.test.ts`: ein frischer Node-Prozess (Skript im Scratchpad ist nicht erlaubt, nutze eine kleine Datei unter `tests/helpers/` und `spawnSync(process.execPath, [datei])`) lädt `js/render/index.js` ohne Setup und rendert eine Karte; Standardsprache `en`. Beginne mit dem Test (rot), er wird nach Aufgabe 2 grün.

### Aufgabe 2: Gemeinsame Logik und Render-Funktionen
**Dateien:** `js/*.js` (mit `.d.ts`), `js/render/*.js` (mit `.d.ts`), Tests je Modul
- [ ] Alle `I2`-Schlüssel (Inventar, Quelltext in `js/` und `js/render/`) über `t()` lesen; Ausgabe in `de` **Zeichen für Zeichen unverändert** (die bestehenden Tests mit Setup `de` sind der Beleg).
- [ ] `options.locale` und `options.texts` bei allen `render*`; bestehende Überschreib-Optionen behalten Vorrang; Typen (`.d.ts`) ergänzt.
- [ ] Je Modul ein Test mit `en` (kein Rohschlüssel im Text, keine deutschen Wörter aus einer Liste, Platzhalter ersetzt, Mehrzahl `one`/`other`), ein Test mit zwei Sprachen im selben Prozess (`options.locale`, ohne den globalen Zustand zu ändern), ein Test mit `options.texts`, ein Test für Vorrang der bestehenden Option. Mutationstests (Quelltext verfälschen: `options.locale` ignoriert, Vorrang vertauscht).
- [ ] Zahlen und Koordinaten (`formatCoords` aus `js/i18n/format.js`) ersetzen das feste Komma in `js/map.js`/`js/venue.js` (Inventar: „Zahl- und Koordinatenformate“); die deutsche Ausgabe bleibt gleich, die englische hat Dezimalpunkt und Himmelsrichtungen `N/E/S/W`.

### Aufgabe 3: Vanilla-Verhalten
**Dateien:** `js/modal.js`, `js/tabs.js`, `js/pagenav.js`, `js/backtop.js`, `js/theme.js`, `js/appnav.js`, `js/accordion.js`, `js/vanilla-core.js`, `js/vanilla.js`, Typen, Tests
- [ ] Texte der Module über `t()`; vorhandene Optionen (`label`, `navLabel` …) behalten Vorrang.
- [ ] `hoops:localechange` wie oben: Abonnent im Vanilla-Paket, Aktualisierung gemounteter Bausteine ohne Neuaufbau (Fokus, offener Zustand, Auswahl bleiben); `destroy()` meldet ab; Test auf Abonnentenzahl nach `destroy`, nach 50-maligem Mounten und Zerstören.
- [ ] Neue Exporte (`setLocale` …) in `hoops.js`, `vanilla.d.ts`/`hoops.d.ts`, Bündelbudgets (`scripts/vanilla-budgets.mjs`) mit **gemessener** Anpassung und Begründung (Kern darf nur um Kern und englischen Katalog wachsen). Das Budget wird nicht großzügig erhöht: Gewicht messen, kleinste passende Grenze setzen, im ADR begründen.
- [ ] Test: Sprachwechsel zur Laufzeit (`en` → `de` → `en`) ändert `aria-label` und sichtbare Beschriftungen von Modal, Tabs, Seitennavigation, Nach-oben, Theme, Akkordeon ohne Neuladen; `lang`-Attribut wie oben (mit und ohne `documentElement.lang`).

### Aufgabe 4: Karte
**Dateien:** `js/map.js`, `js/map-vanilla.js`, `js/map-leaflet.js`, `js/map-bundle.js`, Typen, Tests
- [ ] Alle `map.*`-Schlüssel in den drei Dateien über `t()`; `mapText` behält Vorrang vor Katalog und `options.texts`; der Zwei-Klick-Platzhalter, Fehlertexte, „Erneut versuchen“, Legende, Koordinaten, Himmelsrichtungen und Links sprachabhängig.
- [ ] Karte aktualisiert bei `hoops:localechange` ihre Texte, ohne Leaflet neu zu laden oder die Ansicht zurückzusetzen (Test mit `tests/helpers/leaflet-mock.ts`; Zahl der Neuaufbauten bleibt 0).
- [ ] Bestehende Karten-Tests (`tests/map*.test.ts`, `tests/karten-ssr.test.ts`, `tests/map-vanilla-safety.test.ts`) bleiben mit Setup `de` grün; neue Tests für `en`.

### Aufgabe 5: Erzwingung und Zulassungsliste
**Dateien:** `scripts/i18n-unused-allowlist.json`, `tests/i18n-hardcoded.test.ts`, `tests/check-i18n.test.ts`, `scripts/check-i18n.mjs`
- [ ] Zulassungsliste enthält nur noch Schlüssel mit `I3`; Test: kein `I2`-Schlüssel mehr, jeder verwendete Schlüssel steht nicht mehr in der Liste.
- [ ] `tests/i18n-hardcoded.test.ts` erzwingt jetzt für `js/` und `js/render/` (Messung wird Regel): keine festen deutschen Texte mehr außer den ausdrücklich ausgenommenen (Entwickler-Warnungen, Eigennamen, Satzzeichen); für `svelte/` und `react/` bleibt es bei der Messung (I3). Mutationstest: neuer fester Text in `js/stats.js` lässt den Test kippen.
- [ ] `common.direction.*` (dynamisch gebildet) wird ausdrücklich verdrahtet und von der Verwendungsprüfung erkannt (Hinweis aus dem Review von I1).

### Aufgabe 6: Bündel `hoops-i18n-de.js`
**Dateien:** `scripts/build-vanilla.mjs`, `scripts/vanilla-budgets.mjs`, `scripts/release-vanilla.mjs` (Dateiliste, Manifest), `scripts/portal-sync.mjs` (Dateiliste), `package.json` (`sideEffects`, `exports` falls nötig), Tests
- [ ] **Klären, wie das deutsche Bündel dieselbe Kern-Instanz teilt wie `hoops.js`** (zwei Kopien des Zustands wären ein Fehler: `de` würde in einer anderen Kopie registriert und `hoops.js` bliebe englisch). Vorbild: `hoops-render.js` importiert `./hoops.js` statisch; entsprechend importiert `hoops-i18n-de.js` den Kern aus `./hoops.js` (Export von `registerLocale`). Test: nach `import './hoops.js'; import './hoops-i18n-de.js'; setLocale('de')` liefert `t('modal.close')` „Schließen“, mit esbuild-Bündelung eines Beispielprojekts und im Browser-Prüfskript.
- [ ] Bündel in `dist/vanilla` (`hoops-i18n-de.js`, `.min.js`, `.d.ts`), Budget, Release-Dateiliste (tgz, `.sha256`, `manifest.json`), `portal-sync` kopiert es mit (Dateiliste und Test), `npm pack`-Test (`tests/release-vanilla.test.ts`), `sideEffects`-Test.
- [ ] Die Beispiel-Portalseite (`stories/examples/portal-seite`) bleibt funktionsfähig: sie soll Deutsch bleiben und importiert dazu das deutsche Bündel und setzt `setLocale('de')` (strenge CSP, keine Inline-Skripte; `node scripts/check-portal-seite.mjs --browsers=chromium` muss grün sein, wenn Playwright vorhanden ist).

### Aufgabe 7: Dokumentation
**Dateien:** `docs/architecture/sections/05-building-block-view.adoc`, `07-deployment-view.adoc`, `08-crosscutting-concepts.adoc`, `09-architecture-decisions.adoc` (ADR-012 fortschreiben, kein neuer ADR nötig), `CHANGELOG.md`, `tests/*docs*.test.ts` soweit betroffen
- [ ] arc42: Bündel `hoops-i18n-de.js` (Kapitel 5 und 7), Querschnittskonzept (Ereignis, `lang`, Rangfolge der Überschreibungen), ADR-012 (Entscheidungen von I2: Vorrang der bestehenden Optionen, `render*` ohne globalen Zustand, gemeinsamer Kern über `hoops.js`, Testkonvention Setup `de`). Keine Planstände in arc42.
- [ ] CHANGELOG „Geändert (Bruch)“: Standardsprache Englisch für Vanilla und gemeinsame Logik (einmal `import './hoops-i18n-de.js'` und `setLocale('de')`); „Hinzugefügt“: Sprach-API, Ereignis, Bündel. Hinweis, dass Svelte und React folgen.
- [ ] Doku-Beispiele (`stories/Foundation/Vanilla.mdx`, `*.code.ts`) laufen weiter (Tests führen sie aus); wo die Seite die Standardsprache betrifft, ein knapper Satz; die ausführliche Seite `Foundation/Internationalisierung` ist I4.

## Abnahme

- `npm run build`, `npm test` (nie parallel), `npm run typecheck` grün; `node scripts/check-i18n.mjs --unused` grün; Bündelbudgets eingehalten (Anpassungen gemessen und begründet).
- Kein Diff in `svelte/`, `react/`, `css/`.
- Die Ausgabe von `render*` und der Vanilla-Module ist mit Setup `de` unverändert (alle bestehenden Tests grün ohne Änderung ihrer Erwartungen; Änderungen an bestehenden Tests nur, wo ein Test die Standardsprache selbst festlegte, jeweils begründet im Bericht).
- Ohne Setup liefern `render*` englischen Text (Test mit frischem Prozess).
- `node scripts/check-portal-seite.mjs --browsers=chromium` und `node scripts/check-map-browser.mjs --browsers=chromium` laufen grün (falls Playwright vorhanden; sonst im Bericht ausdrücklich als nicht gelaufen nennen).
