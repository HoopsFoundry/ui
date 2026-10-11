# Plan: Accordion (Paket A, allgemein)

Spec: `docs/superpowers/specs/2026-10-10-accordion-design.md`. Branch `feat/accordion`. Paket B (einklappbare Tabellenrahmen) ist nicht Teil dieses Plans; `Table`, `ScheduleTable`, `ScheduleGrid`, `LeagueCard` bleiben unverändert.

## Schritte (kleine Commits)
1. `js/accordion.js` + `.d.ts`: reine Funktionen `nextHeader`, `hashTarget`, `ancestorsOf`, `labelWithMeta`, `summaryText` (Tabellentests inkl. Randfälle).
2. `initAccordion(root, opts)` im selben Modul: Button-Weg `[data-dss-acc]` und natives `<details class="dss-acc-item">`; ESM, SSR-sicher, `destroy()`; jsdom-Tests.
3. CSS `dss-acc*` (Karte, flach, verschachtelt, Meta, Nav, Alle-öffnen-Leiste, sticky, Animation, Druck, details) + CSS-Tests.
4. Komponenten Svelte (`Accordion`, `AccordionItem`, `accordion-context.js`) und React (`Accordion.tsx`), Export, Parität, Tests, SSR-Parität.
5. Doku: `Components/Accordion` (MDX, Stories, Code, Beispiele), Introduction, storySort, README, CHANGELOG; Doku-Tests.
6. Mutationstests, Browser-Prüfung, Merge von `main`.

## Entscheidungen
- Ebene: `titleAs` > `HeadingLevel` > h3; Inhalt eines Bereichs bekommt Titelebene + 1 (Kontext), verschachtelte Gruppen zählen so hoch.
- `role="region"` nur bei höchstens 6 Bereichen je Gruppe.
- Geschlossene Panels: `hidden` + `inert`; Animation über `grid-template-rows`, aus bei reduced-motion und `data-motion="reduce"`; Druck: alle Panels offen.
- Zusatzinfo: Name des Buttons einmal gelesen (Messung im Zugänglichkeitsbaum entscheidet zwischen `aria-hidden` am Meta + `aria-label` und sichtbarem Text).
