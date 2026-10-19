# Storybook aufräumen: Implementierungsplan

Spec: `docs/superpowers/specs/2026-10-19-storybook-aufraeumen-design.md` (freigegeben). Ablauf: Pull Request, kein Merge durch den Entwickler. Konventionen der früheren Pläne und `CLAUDE.md` gelten (Docs-Konventionen, Editor-Hook-Verbote, ADR-013 zu Prüfskripten).

## Aufgaben
1. **Bestandsaufnahme** (kein Code): alle Seiten mit iframes, `.hoops-phone`, `theme:Dark`, `globals=...type:` auflisten (Tabelle im PR-Text); Tests, die davon abhängen (`tests/*-docs.test.ts`, `docs-inline-code.test.ts`, `storybook-state`, `check-*`-Skripte).
2. **Marke und Schrift koppeln** in `.storybook/preview.ts`: Global `type` entfällt, `data-type` folgt `brand`. Adressen, Skripte, Tests und `stories/Foundation/Typography` anpassen. Test: Decorator-Logik ausführen (Muster `.storybook/locale.ts`/`tests/i18n-docs.test.ts`), Mutationsprobe.
3. **Viewport**: Addon-Viewport mit Handy 390, Tablet 768, Desktop 1280, Vollbreite; Geräte als Global in der Leiste.
4. **Baustein `Preview`** (`stories/docs/blocks/`, React wie die anderen Blöcke): iframe der Story in voller Spaltenbreite, Breite aus dem Viewport-Global, Höhe automatisch (Mitteilung der Story, `ResizeObserver`), `loading="lazy"`, Titel/`title` eindeutig (axe), Globals (Marke, Theme, Sprache, Bewegung, Fassung) durchreichen.
5. **Feststehende Vorschau**: zweispaltiges Layout mit `position: sticky`, unter 1100 px oben mit begrenzter Höhe; automatischer Wechsel des Beispiels per IntersectionObserver, Liste als Rückfall; Tastatur, Fokus, reduzierte Bewegung. CSS in `stories/docs/blocks/blocks.css`.
6. **Seiten umstellen**: erst Pilot `Tabs` und `Accordion`, im Browser abnehmen, dann die übrigen 14 Seiten. Handy-Abschnitte entfernen, Inhalt in den Fließtext, feste Dunkel-Vorschauen entfernen (außer `Foundation/Dark Mode`).
7. **Prüfungen**: `scripts/check-docs-axe.mjs` um den Inhalt der iframes erweitern (Abdeckung darf nicht sinken); Seiten-Tests anpassen; Browser-Prüfung Marke × Theme × Breite × Sprache (Chromium, WebKit) ohne Konsolenfehler; Sichtprüfung der feststehenden Vorschau bei langem Text, 320 px, Zoom 200 %.
8. **Doku und Architektur**: ADR (Kapitel 9), Kapitel 8, `CLAUDE.md` (Toolbar-Globals: Schrift entfällt, Viewport neu), `stories/Introduction.mdx`, CHANGELOG. `docs/architecture/README.adoc` nie von Hand.

## Abnahme
build, typecheck, `npm test`, `build-storybook`, `check-docs-axe` grün; PR gegen main mit Bestandstabelle und Screenshots/Messungen.
