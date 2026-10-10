# Plan: Ligencard (LeagueCard, Paket 6)

Spec: `docs/superpowers/specs/2026-10-10-ligencard-design.md`. Branch `feat/ligencard`, abgezweigt von `feat/ueberschriften` (die Karte nutzt `HeadingLevel`, `titleAs` h2 bis h6 und die Größen-Tokens).

## Teil A: Reine Funktionen
- `js/league.js` (+ `.d.ts`, Export `./league.js`): `leagueWindow`, `leagueSummary`, `formLabel`, `formEntries`, `windowLabel`, `diffText`, `cellNumber`, `zoneInfo`, `zoneLegend`, `liveInfo`. Tabellentests in `tests/league.test.ts`.

## Teil B: Komponente
- `svelte/LeagueCard.svelte` (kein `<style>`), `react/LeagueCard.tsx`, `dss-league*` in `css/components.css`, Manifest, `package.json`, `react/index.ts`.
- Tabelle `dss-tbl` (Dichte touch 60 px bzw. compact 40 px), optionale Spalten per Klasse `dss-league-opt` (auf dem Handy aus), Zonen als Streifen links plus Text, eigene Zeile mit Balken, Live-Tag, Logos/Kurznamen aus Paket 3.
- Tests: `tests/league-card.test.tsx` (React, axe), `tests/league-ssr.test.ts` (Parität), `tests/league-css.test.ts` (Quelltext, Kontraste), Mutationstests.

## Teil C: Doku
- `Components/LeagueCard` (`LeagueCard.mdx`, `.stories.ts`, `.code.ts`, `components/LeagueCardExamples.svelte`, `LeagueCardPlayground.svelte`), Einführung, `storySort`, README, CHANGELOG, `tests/league-code.test.ts`.

## Prüfung
Tests (3x), Typecheck, Storybook-Build, Index, Link-Check, Browser (Marken, Hell/Dunkel, 1280/420, reduzierte Bewegung), axe, Zugänglichkeitsbaum, Messungen, Screenshots, Regression, Mutationstests. Vor dem Abschluss `git merge feat/ueberschriften`.
