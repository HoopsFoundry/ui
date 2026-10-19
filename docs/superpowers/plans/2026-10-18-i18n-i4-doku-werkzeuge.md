# Internationalisierung I4: Doku und Werkzeuge

Spec: `docs/superpowers/specs/2026-10-16-internationalisierung-design.md` (Abschnitt I4). Vorgänger: I1 bis I3 (gemergt, PR #6). Konventionen der Pläne `2026-10-17-i18n-i1-infrastruktur.md`, `...-i2-vanilla-render.md` und `2026-10-18-i18n-i3-svelte-react.md` gelten weiter. Ablauf: Pull Request, kein Merge durch den Entwickler.

**Ziel:** Die Internationalisierung ist dokumentiert und in Storybook bedienbar. Danach kann I2 bis I4 als eine Version erscheinen.

**Nicht Teil von I4:** Veröffentlichung (Tag, Release, `npm publish` nur mit ausdrücklichem Ja), englische Übersetzung der übrigen Doku, Theme-Leitfaden.

## Aufgaben

1. **Storybook-Toolbar „Sprache“** (`.storybook/preview.ts`): Global `locale` mit `en` und `de`, Start `de` (Doku bleibt deutsch). Der Decorator ruft `setLocale` mit dem gewählten Wert. Der englische Katalog ist eingebaut, `de` kommt über `js/i18n/de-register.js`. Die Umschaltung muss Svelte-Stories (über `subscribe`) und die als HTML ausgegebenen Vanilla-/Render-Beispiele neu darstellen (Story neu rendern, wenn nötig über `context.globals.locale` als Schlüssel). Der feste Aufruf `setLocale('de')` entfällt. Der Kommentar dazu wird angepasst.
2. **Seite `Foundation/Internationalisierung`** (`stories/Foundation/Internationalisierung.mdx`, `.stories.ts`, `.code.ts` nach dem Muster von `Vanilla.*`; eintragen in `stories/Introduction.mdx` und `storySort`): Abschnitte Sprache einstellen (Vanilla `setLocale`/Bündel `hoops-i18n-de.js`, Svelte `provideI18n`/`@hoopsfoundry/ui/svelte/i18n`, React `HoopsProvider`/`useLocale`), Texte überschreiben (`texts`, `setTexts`, Überschreib-Props haben Vorrang, Rückfallkette), Sprache ergänzen (`registerLocale`, Katalogformat, Basissprache), Ereignis `hoops:localechange`, Verhalten bei Auswahl einer unbekannten Sprache. Code je Fassung (Vanilla, Svelte, React) über `FrameworkCode`. Beispiele müssen laufen (Muster `tests/*-code.test.ts`).
3. **Übersetzungsleitfaden mit Glossar** (eigener Abschnitt auf der Seite oder `docs/`-Datei, im Storybook verlinkt): Schlüsselschema, Platzhalter, Plural/Zahlen, Länge der Texte, Glossar der Fachbegriffe Basketball (Foul, Freiwurf, Auszeit, Spielfrei, Wechsel …) mit Deutsch und Englisch aus den vorhandenen Katalogen `en` und `de`. Das Glossar wird aus den Katalogen abgeleitet oder per Test gegen sie geprüft, damit es nicht abweicht.
4. **Migrationstabelle**: Standardwechsel auf Englisch, Hinweis `setLocale('de')` plus Import des Bündels, entfernte Texte (`statEmptyText`, `THEME_LABEL`), Karte braucht `hoops.js` daneben, Formbuchstaben über `data-letter`. Auf der Seite und im CHANGELOG. Das Migrationsskript wird nur ergänzt, wenn es die Aufrufe schon behandelt, sonst steht in der Tabelle, was von Hand zu tun ist.
5. **Prüfskript und Tests**: `scripts/check-i18n.mjs` prüft weiter beide Kataloge auf gleiche Schlüssel. Neue Doku-Tests (`tests/i18n-docs.test.ts`) prüfen: Seite im `storySort` und in `Introduction.mdx`, Code-Beispiele laufen, Glossar passt zu den Katalogen, Toolbar-Global `locale` existiert mit `en`/`de`. Mutationsprobe: Test wird rot, wenn ein Glossarbegriff im Katalog geändert wird.
6. **Zugänglichkeit**: axe auf der neuen Seite (Muster `scripts/check-map-docs.mjs` oder der vorhandene Docs-Test), beide Sprachen, hell und dunkel.
7. **Doku und Architektur**: ADR-012 Status und Konsequenzen auf „umgesetzt“ nachführen (arc42 Kap. 09, ggf. 08), README (Abschnitt Internationalisierung, Verweis auf die Seite), CHANGELOG (Unveröffentlicht), `CLAUDE.md` nur, wenn sich Befehle oder Konventionen ändern (Toolbar-Globals ergänzen: Sprache). `docs/architecture/README.adoc` nie von Hand.

## Abnahme

`npm run build`, `npm run typecheck`, `npm test` (nie parallel) und `npm run build-storybook` grün. Toolbar-Umschaltung im Browser geprüft (Chromium), Seite in beiden Sprachen angesehen. Pull Request gegen `main`, kein Merge.
