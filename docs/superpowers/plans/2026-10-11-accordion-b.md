# Plan: Accordion Paket B (einklappbare Tabellenrahmen)

Spec: `docs/superpowers/specs/2026-10-10-accordion-design.md`, Abschnitt „Paket B“. Branch `feat/accordion-b`, Basis `main` (Paket A ist gemergt).

## Schritte (kleine Commits)
1. Gemeinsamer Baustein: `createCollapsible(host)` in `js/accordion.js` (öffnen/schließen mit exclusive, Fokus, Hash, `reveal`, Eintrag für die Gruppe, Hash-Prüfung). `AccordionItem` (Svelte, React) nutzt ihn; öffentliches Verhalten unverändert (bestehende Tests bleiben grün).
2. Interne Rahmen-Bausteine `svelte/internal/CollapsibleFrame.svelte` und `react/internal/CollapsibleFrame.tsx` (Kopf als Überschrift mit Button, Panel, Kontext, Gruppenteilnahme). Nicht im Paket-Export, nicht in `react/index.ts` (die Parität prüft ein eigener Test).
3. CSS „Einklappbare Rahmen“ (nach dem Accordion-Block): Kopf von `dss-frame` und `dss-league` als Accordion-Kopf, Titelgröße über die Rahmen-/Karten-Tokens, geschlossen ohne doppelten Strich, Fokus innen, dunkler Rahmen, Sticky (`overflow: clip`), Druck.
4. `Table`, `ScheduleTable`, `ScheduleGrid`, `LeagueCard` (Svelte, React): `collapsible`, `open`/`defaultOpen`/`onOpenChange`, `id`.
5. Gruppe: `anchor` im Eintrag (ohne `id` keine Sprungleiste), `moveFocus` ignoriert Köpfe in Panels (einzelne Rahmen in einem Bereich).
6. Tests: Baustein, React je Komponente, Svelte-Verhalten, SSR-Parität (30+ Fälle), CSS, Doku-Beispiele, Mutationstests.
7. Doku: „Tabellen einklappen“ auf Table, Spielplan, LeagueCard; Beispielseite auf `Accordion.mdx` auf einklappbare Rahmen umgestellt; Controls, Spielwiesen; README, CHANGELOG.
8. Prüfung (Tests, Typen, Storybook-Build, Browser, axe, Messungen), `git merge main`.

## Entscheidungen
- **Panel ohne `role="region"`**: Der Rahmeninhalt trägt schon eine benannte Region (der Scrollbereich: Titel, `caption` bzw. „Tabelle: Titel“). Eine zweite Region mit dem Namen des Kopfes wäre eine Doppelung (`landmark-unique`). Das Panel bleibt eine anonyme Hülle; `aria-controls` zeigt auf sie.
- **Titelgröße**: Der Button erbt die Schrift vom Rahmentitel (`font: inherit`), die Accordion-Tokens gelten dort nicht.
- **Teilnahme an der Gruppe**: Ein Rahmen meldet sich bei der Gruppe an, die er im Kontext findet. Steht er direkt im Panel eines `AccordionItem` (ohne eigene verschachtelte Gruppe), bleibt er einzeln (sonst schlösse `exclusive` seinen Elternbereich). Ohne `id` kein Anker: keine Sprungleiste, kein Hash.
- **Ebene**: `titleAs` > `titleAs` der Gruppe > `HeadingLevel` > h3; der Inhalt bekommt Titelebene + 1.
- **Standard**: `collapsible` aus, `open` aus (wie `AccordionItem`). Ohne `title` wirkungslos (Warnung nur in der Entwicklung).
