# Design: Ligencard (LeagueCard)

Stand: 2026-10-10 · Vorlage: Entwurf des Auftraggebers aus dem Vereinsregister (Titel „Oberliga Baden Männer“, Untertitel „12 Teams · 15 von 132 Spielen gespielt“, Mini-Tabelle mit #, MANNSCHAFT, SP, PKT für die ersten drei, Link „Komplette Tabelle und Spielplan“).

## Entscheidungen des Auftraggebers
| Frage | Entscheidung |
|---|---|
| Spalten | Standard wie im Entwurf: `#`, `Mannschaft`, `SP`, `PKT`. Optional zuschaltbar: `S`/`N` (Siege, Niederlagen), Korbdifferenz, Form (letzte fünf Spiele als Punktreihe) |
| Wenn die Liga mehr Teams hat als Zeilen | **Fester Ausschnitt um die eigene Mannschaft:** zwei Teams davor, die eigene, eins dahinter (an den Tabellenrändern verschoben, immer die gleiche Zeilenzahl). Ohne eigene Mannschaft: die ersten N (Standard 3, wie im Entwurf) |
| Zusätze (alle optional) | Logos und Kurznamen (Props `names`, `logos` wie bei Spielplan und Karten), eigene Mannschaft hervorheben (`is-own`), Live-Hinweis (grüne Live-Sprache aus Paket 2), Auf- und Abstiegsmarkierung |

## Aufbau (Standard)
1. **Kopf:** Titel (Liganame, Überschrift; Ebene über `titleAs` bzw. `HeadingLevel`, Standard `h3`; Größe über die Überschriften-Tokens), darunter eine Zeile „12 Teams · 15 von 132 Spielen gespielt“ (aus `teams.length`/`teamCount`, `played`, `total`; fehlt eine Angabe, entfällt der Teil; Plural/Singular korrekt, deutsche Tausenderpunkte nicht nötig). Optional Live-Tag („Live“, wenn `live` gesetzt, z. B. „2 Spiele laufen“ als Text).
2. **Tabelle:** echte `table` (Kopfzellen `th scope`, `caption` unsichtbar, `role="region"` mit `tabindex="0"` und `aria-label` falls horizontal scrollbar wie `Table`), Spalten `#` (Platz, fett), `Mannschaft` (Name als Link wenn `href`, mit Logo/Kurzname), `SP`, `PKT` (fett, `tabular-nums`, rechtsbündig). Optional `S`, `N`, `Diff` (mit `td.num.plus`/`.minus`-Farben), `Form` (fünf kleine Punkte S = grün, N = rot, U = neutral, mit Text für Screenreader „Form: Sieg, Sieg, Niederlage …“). Auf dem Handy (≤ 640 px) werden die optionalen Spalten ausgeblendet (S, N, Diff, Form); Standardspalten bleiben.
3. **Ausschnitt:** Ohne eigene Mannschaft die ersten `limit` (Standard 3). Mit eigener Mannschaft (`own: true` an einem Team): Fenster aus 2 davor, eigene, 1 dahinter (4 Zeilen), an den Rändern verschoben (Platz 1: Plätze 1–4; letzter Platz: letzte vier). Liegt das Fenster nicht am Tabellenanfang/-ende, entsteht keine Lücke-Zeile (der Rang in der Spalte `#` zeigt die Position). Eine Zeilen-Zusammenfassung wie „Plätze 5 bis 8 von 12“ steht für Screenreader in der `caption`.
4. **Fuß:** Link „Komplette Tabelle und Spielplan“ (`href`, Text per `linkLabel` änderbar), unterstrichen wie im Entwurf.
5. **Eigene Mannschaft:** Zeile mit Balken links und leichtem Hintergrund (Muster `is-own` aus Table/ScheduleTable), nicht nur Farbe (der Screenreader hört „eigene Mannschaft“ als versteckten Text).
6. **Auf-/Abstieg:** Optionales Feld je Team `zone?: 'up' | 'playoff' | 'down'` → farbiger Streifen am Zeilenrand plus kleiner Text/Symbol für Screenreader („Aufstiegsplatz“, „Relegation“, „Abstiegsplatz“); die Bedeutung steht in einer Legende unter der Tabelle, wenn mindestens eine Zone vorkommt (Text, nicht nur Farbe).

## Datenmodell
```ts
type LeagueTeam = {
  rank: number;            // Platz
  name: string;            // wie ScheduleTeam
  short?: string; logo?: string; href?: string;
  played: number;          // SP
  points: number;          // PKT
  won?: number; lost?: number;     // S, N
  diff?: number;           // Korbdifferenz (positiv/negativ)
  form?: ('S' | 'N' | 'U')[];      // letzte Spiele, neueste zuletzt, höchstens 5
  own?: boolean;
  zone?: 'up' | 'playoff' | 'down';
};
```
Props: `title`, `teams`, `teamCount?` (falls die Liste nur einen Ausschnitt enthält), `played?` und `total?` (Spiele gespielt/gesamt), `columns?: ('won' | 'lost' | 'diff' | 'form')[]` (optionale Spalten), `limit?` (Standard 3), `href?`, `linkLabel?` (Standard „Komplette Tabelle und Spielplan“), `live?: number | boolean` (laufende Spiele), `names?`, `logos?`, `titleAs?`, `class`. Die Funktion für den Ausschnitt ist eine reine Funktion in `js/league.js` (+ `.d.ts`, Export `./league.js`): `leagueWindow(teams, { limit })`, dazu `leagueSummary({ teamCount, played, total })` für die Untertitelzeile und `formLabel(form)` für den Screenreader-Text. Svelte und React nutzen sie gemeinsam.

## Technik
- Komponente in Svelte (`svelte/LeagueCard.svelte`), React (`react/LeagueCard.tsx`, Export im `react/index.ts`), Vanilla-CSS (`dss-league*` in `css/components.css`), `parity.manifest.json`-Eintrag, `package.json` exports (`./svelte/LeagueCard`, `./league.js`). Nutzt die vorhandenen Bausteine: `dss-tbl`-Optik der Tabellen (Dichte `default`/`compact`), Logo-/Namen-Mechanik aus Paket 3 (`dss-team-name`, `dss-team-logo`), Live-Tokens aus Paket 2, Überschriften-Ebene und -Größe aus dem Überschriften-Paket (nach dessen Merge).
- Größen: `size="standard"` (wie Entwurf) und `size="compact"` (kleinere Zeilen, ohne Untertitel; für Seitenleisten).
- Zugänglichkeit: Tabelle mit `caption`, `th scope`, `aria-sort` nicht nötig (feste Reihenfolge), Link-Name eindeutig (z. B. „Komplette Tabelle und Spielplan, Oberliga Baden Männer“ per versteckter Ergänzung), Fokus-Ringe gestrichelt, Kontraste ≥ 7:1 hell/dunkel beide Marken, kein Zustand nur über Farbe (eigene Zeile, Zonen, Form, Plus/Minus alle mit Text).
- Karte: gleiche Karten-Optik wie `dss-card` (Rand, Radius, Innenabstand wie im Entwurf), `box-shadow` je nach Kartenvariante der anderen Karten.

## Doku und Tests
- Eigene Docs-Seite `Components/LeagueCard` (Datei `stories/LeagueCard.mdx` + `LeagueCard.stories.ts`, `LeagueCard.code.ts`, `components/LeagueCardExamples.svelte`, Spielwiese mit Controls): Aufbau, Spalten, Ausschnitt-Regel mit Beispielen (Platz 1, Mitte, letzter Platz, ohne eigene Mannschaft), Logos/Kurznamen, Auf-/Abstieg, Live, Zustände (Link Hover/Fokus), Handy, Props (Controls und DocTable, Datenmodell), Code (Vanilla, Svelte, React), Dos/Don'ts (3 bis 4 Paare, belegt: Ausschnitt um die eigene Mannschaft statt nur Top N; Zonen nur mit Legende; keine Form ohne Text; nicht mehr als 5 Zeilen in der Card, sonst die komplette Tabelle), Inhaltsverzeichnis in `Introduction.mdx`, `storySort`, README, CHANGELOG.
- Tests: reine Funktionen (Tabellentests inkl. Ränder, ein Team, weniger Teams als `limit`, doppelte Plätze, leere Liste, ungültige Zahlen), React-Tests (Rendering, Spalten, Ausschnitt, eigene Zeile, Zonen+Legende, Form-Text, Link, axe), Svelte-Quelltext-/SSR-Parität (Vite-SSR gegen `renderToStaticMarkup`), CSS-Tests (Klassen, Handy-Ausblendung, Kontrast), Doku-Beispiele (React per TypeScript-Compiler, Svelte per SSR, Vanilla-Markup gegen Komponentenausgabe), Mutationstests.
- Prüfung wie in den früheren Paketen: Browser BBV/DBB × Hell/Dunkel × 1280/420 px, axe inkl. `color-contrast-enhanced`, Zugänglichkeitsbaum, Messwerte (Zeilenhöhen, Spaltenbreiten, Kontraste), Regression aller Docs-Seiten, unabhängiger Review, Merge, Push.

## Reihenfolge
Nach dem Überschriften-Paket (`HeadingLevel`, Größen-Tokens), weil die Ligencard dessen Bausteine nutzt.
