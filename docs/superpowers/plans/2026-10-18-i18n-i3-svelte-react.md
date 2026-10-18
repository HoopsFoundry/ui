# Internationalisierung I3: Svelte und React

Spec: `docs/superpowers/specs/2026-10-16-internationalisierung-design.md`. Vorgänger: I1 (Kern, Kataloge, Inventar), I2 (Vanilla, Render, Karte; gemergt als `817ada0`). Inventar: `docs/superpowers/specs/2026-10-17-i18n-inventar.md`. Pläne der Vorgänger: `2026-10-17-i18n-i1-infrastruktur.md`, `2026-10-17-i18n-i2-vanilla-render.md` (Konventionen dort gelten weiter). Dieses Paket ist I3 von I1 bis I4.

**Ziel:** Alle Svelte- und React-Komponenten lesen ihre eingebauten Texte über den Kern (`t()`), reagieren auf Sprachwechsel zur Laufzeit und liefern je Sprache dieselben Texte wie die Vanilla-Fassung. React bekommt `HoopsProvider` und `useLocale`. Danach gibt es im Quelltext von `svelte/` und `react/` keine festen deutschen Texte mehr.

**Nicht Teil von I3:** Doku-Seiten, Storybook-Toolbar „Sprache“, Übersetzungsleitfaden, Migrationstabelle (alles I4). Storybook bleibt bis I4 fest auf Deutsch (`.storybook/preview.ts`). Keine Veröffentlichung: I2 und I3 gehören in eine Version, Tag und `npm publish` nur mit ausdrücklichem Ja.

## Ausgangslage (gemessen)

- 134 feste Textstücke in `svelte/` und `react/` (Messung `scripts/i18n-scan.mjs`, `scanTree`); davon Svelte 69, React 65. Verteilung: LeagueCard 16, TeamCard 9, ScheduleGrid 10/7, ScheduleTable 7/5, PlayByPlay 6, Stepper 4, Accordion 3, Table 3/2 … je Datei in der Messung.
- 18 Schlüssel stehen für I3 in `scripts/i18n-unused-allowlist.json` (`modal.close`, `tabs.label`, `appnav.*`, `bottomnav.label`, `breadcrumbs.label`, `stepper.*`, `skeleton.loading`, `playbyplay.*`, `player.*`). Die übrigen Texte der Komponenten stehen schon im Katalog und werden von `js/*.js` geliefert; die Komponenten rufen diese Funktionen bereits auf.
- `statEmptyText` und `THEME_LABEL` sind noch als Live-Bindung exportiert (I2-Übergang), die Formbuchstaben S/N/U kommen noch aus CSS-`content`.

## Festlegungen

- **Ein Kern, kein zweiter Zustand.** Svelte und React lesen den Kern aus `js/i18n/index.js` (`t`, `getLocale`, `subscribe`). Keine eigene Sprachverwaltung je Fassung.
- **Svelte:** ein Modul `svelte/i18n.svelte.ts` (Name nach den Gepflogenheiten des Pakets klären) hält einen reaktiven Zähler (`$state`), der bei jeder Änderung des Kerns erhöht wird; die Hilfsfunktion `tr(key, params, options)` liest den Zähler, damit jede Komponente beim Sprachwechsel neu rendert. Abonnement erst im Browser und nur solange mindestens eine Komponente lebt (kein Leck, kein Abonnement beim Server-Rendern).
- **React:** `HoopsProvider` (`locale`, `texts`) und Hook `useLocale()` (liefert die wirksame Sprache); eine interne Hilfe `useT()` liest über `useSyncExternalStore` (mit `getServerSnapshot`) den Kern. Ohne Provider gilt die globale Sprache. Mit Provider gilt dessen `locale`/`texts` im Teilbaum, ohne den globalen Zustand zu ändern; geschachtelte Provider gelten innen. Exporte in `react/index.ts` und `package.json`-`exports`, Typen, Manifest `parity.manifest.json` soweit nötig.
- **Vorrang wie in I2:** bestehende Überschreib-Props (`label`, `seatLabel`, `mapText`, `gamesLabel` …) > `texts` der Komponente (Schlüssel des Katalogs, falls die Komponente es schon anbietet; neu nur dort, wo `render*` es in I2 schon anbot) > Provider-`texts` > globales `setTexts` > Katalog.
- **Parität:** Für jede Komponente und jede Sprache (`en`, `de`) liefern Svelte-SSR, React-SSR (`renderToString`) und Vanilla-`render*` denselben sichtbaren Text und dieselben `aria-label`. Die bestehenden Paritätstests laufen weiter; neu ist die Prüfung je Sprache.
- **`lang`:** Wie in I2 (Regel in `js/i18n/lang.js`, `langFor`): Weicht die Sprache von `document.documentElement.lang` ab (nur wenn nicht leer), setzen die Komponenten `lang` an der Wurzel. Beim Server-Rendern entscheidet eine ausdrückliche Angabe (`documentLang` am Provider bzw. Svelte-Kontext), sonst kein `lang`.
- **Aufräumen aus I2:** `statEmptyText` und `THEME_LABEL` als Live-Bindung entfernen (oder als gewöhnliche Funktion/Konstante ohne Sprachbezug), alle Verwender auf `t()` umstellen. Die Formbuchstaben S/N/U kommen aus dem Katalog (`form.*`), nicht mehr aus CSS-`content`; `css/components.css` darf dafür geändert werden, das Aussehen bleibt gleich (Test gegen die Klassen im Manifest). Falls das Aussehen sich nur mit Datenattribut lösen lässt, ist das in ADR-012 zu begründen.
- **Zugänglichkeit:** Statuszeilen (`role=status`, `aria-live`) behalten ihr Verhalten; ein Sprachwechsel darf keine Ansage auslösen und weder Fokus noch offene Zustände (Modal, Tabs, Akkordeon, Stepper) zurücksetzen.
- **Größe:** Gemessen und im ADR begründet; Budgets der Vanilla-Bündel ändern sich nicht (Svelte/React sind nicht Teil davon). Die React-Bündelgröße (`dist/react`) wird vor und nach gemessen und im Bericht genannt.

## Aufgaben

### Aufgabe 1: Grundlage in Svelte und React
**Dateien:** `svelte/i18n.svelte.ts` (oder passender Name), `react/i18n.tsx` (`HoopsProvider`, `useLocale`, interner `useT`), `react/index.ts`, `package.json` (`exports`, `sideEffects` prüfen), Typen, Tests (`react/i18n.test.tsx`, `tests/svelte-i18n.test.ts`)
- [ ] Zuerst Tests (rot): Sprachwechsel zur Laufzeit rendert neu (Svelte und React), Provider überschreibt im Teilbaum ohne globalen Zustand, Schachtelung, ohne Provider gilt global, Abonnentenzahl (`__subscriberCount`) nach Unmount wieder auf Ausgangswert, nach 50-maligem Mounten und Zerstören kein Zuwachs, SSR ohne Abonnement.
- [ ] Umsetzen; Mutationstests (Provider ignoriert `locale`, Abonnement nie abgemeldet, Zähler wird nicht erhöht).

### Aufgabe 2: Komponenten mit den 18 offenen Schlüsseln
**Dateien:** `svelte/{Modal,Tabs,AppNav,BottomNav,Breadcrumbs,Stepper,Skeleton,PlayByPlay,PlayerCard}.svelte`, `react/` gleichnamig, Tests
- [ ] Schlüssel aus `scripts/i18n-unused-allowlist.json` verdrahten und aus der Liste entfernen; am Ende ist die Liste leer (der Test erzwingt, dass kein Eintrag bleibt, der verwendet wird).
- [ ] Je Komponente: Test mit `en`, mit `de` (Zeichen für Zeichen wie vorher), mit Überschreib-Prop (Vorrang), Sprachwechsel zur Laufzeit ohne Zustandsverlust.

### Aufgabe 3: Übrige Komponenten und Texte
**Dateien:** alle weiteren Dateien aus der Messung (LeagueCard, TeamCard, ScheduleGrid, ScheduleTable, ScheduleParts, MatchCard, Accordion, Table, TopBar …), Tests
- [ ] Jeden der 134 Treffer verdrahten, Quelle ist der vorhandene Katalog; fehlt ein Schlüssel, in `en` und `de` ergänzen (Schlüsselschema `baustein.bedeutung`, Platzhalter, Mehrzahl) und `scripts/check-i18n.mjs` grün halten. Kein Rohschlüssel im Text, keine deutschen Wörter in der englischen Ausgabe (Wortliste im Test).
- [ ] Bestehende Tests laufen mit dem Setup `tests/setup-i18n.ts` (de) unverändert grün; deutsche Ausgabe bleibt Zeichen für Zeichen gleich.

### Aufgabe 4: Parität je Sprache
**Dateien:** `tests/parity-i18n.test.ts` (neu), Hilfen in `tests/helpers/`
- [ ] Für jede Komponente aus `parity.manifest.json` und für `en` und `de`: Svelte-SSR, React-SSR und Vanilla-`render*` (soweit es eine gibt) ergeben denselben normalisierten Text und dieselben `aria-label`; Abweichungen sind Fehler. Der Test nennt Komponente und Sprache im Fehler.
- [ ] Mutationstest: ein Text in nur einer Fassung geändert lässt den Test kippen.

### Aufgabe 5: Aufräumen und Erzwingung
**Dateien:** `js/stats.js`/`js/theme.js` (und deren `.d.ts`) für `statEmptyText`/`THEME_LABEL`, `css/components.css` (Formbuchstaben), `tests/i18n-hardcoded.test.ts`, `scripts/i18n-scan.mjs`, `scripts/i18n-unused-allowlist.json`, Inventar
- [ ] `tests/i18n-hardcoded.test.ts` erzwingt jetzt auch für `svelte/`, `svelte/internal`, `react/`, `react/internal`: keine festen deutschen Texte (Messung wird Regel). Mutationstest: neuer fester Text in `svelte/Banner.svelte` und in `react/Banner.tsx` lässt den Test kippen.
- [ ] Live-Bindungen entfernen, Formbuchstaben aus dem Katalog; Inventar auf „0 feste Textstücke“ nachführen (Zahlen messen, nicht schätzen).

### Aufgabe 6: Browser-Prüfung
- [ ] Skript oder Erweiterung eines vorhandenen Browser-Prüfskripts (nicht Teil von `npm test`): Storybook-Build bzw. Demo-Seite in `en` und `de`, axe ohne Verstöße, Sprachwechsel zur Laufzeit ohne Neuladen verändert Beschriftungen von Modal, Tabs, Stepper, Akkordeon und behält Fokus und offenen Zustand. Chromium und, wenn vorhanden, WebKit; was nicht lief, wird im Bericht genannt.

### Aufgabe 7: Dokumentation
**Dateien:** `docs/architecture/sections/05-building-block-view.adoc`, `08-crosscutting-concepts.adoc`, `09-architecture-decisions.adoc` (ADR-012 fortschreiben: Svelte-Zustand, Provider, Vorrang, Formbuchstaben, Größe), `CHANGELOG.md` (`[Unveröffentlicht]`), `README.md` (kurzer Abschnitt `HoopsProvider`/`useLocale`, Svelte), `tests/*docs*.test.ts` soweit betroffen
- [ ] Keine Planstände in arc42; `docs/architecture/README.adoc` nicht von Hand ändern.
- [ ] Gemessene Zahlen (Schlüssel, Komponenten, Größen) nennen.

## Abnahme

- `npm test` (nie parallel), `npm run typecheck`, `npm run build`, `node scripts/check-i18n.mjs --unused`, `npx storybook build` ohne Fehler; Ergebnisse im Bericht mit Zahlen.
- Unabhängiger Review durch einen separaten Reviewer-Subagenten; alle Befunde fixen („erst alles fixen“).
- Branch `feat/i18n-i3` wird nach jedem größeren Zwischenstand nach `origin` gepusht (Sicherung). Zusammenführen **nur per Pull Request** und erst nach ausdrücklichem Ja des Nutzers; kein Merge auf `main` durch den Entwickler, kein Tag, kein `npm publish`.
