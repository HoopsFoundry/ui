# Storybook aufräumen: Marke und Schrift, Hell/Dunkel, Breite, feststehende Vorschau

Stand: freigegeben vom Nutzer am 2026-10-19 (Entscheidungen unten). Auslöser: Nutzerwunsch in der Sitzung vom 2026-10-19.

## Ziele (vom Nutzer)
1. **Marke und Schrift koppeln.** Statt der Umschalter „Marke“ und „Schrift“ gibt es einen: BBV bringt Sora und Manrope, DBB bringt Rubik und Sucrose mit.
2. **Hell und Dunkel über die Storybook-Leiste (Addon-Themes).** Seiten zeigen nicht mehr beide Varianten nebeneinander. Beides gleichzeitig zeigt nur die Seite `Foundation/Dark Mode`.
3. **Breite im oberen Menü einstellen** (Handy, Tablet, Desktop) statt fester 390-px-Vorschauen je Seite. Die Beispiele laufen immer in voller verfügbarer Breite.
4. **Das Beispiel bleibt im sichtbaren Bereich.** Wenn der Doku-Text durch die schmalere Breite länger wird und das Beispiel nach unten schieben würde, steht die Vorschau fest (sticky), während der Text daneben oder darunter scrollt.

## Bestand (gemessen am 2026-10-19)
- Marke und Schrift sind zwei Toolbar-Globals (`.storybook/preview.ts`), die Attribute `data-brand` und `data-type` auf `<html>` setzen.
- Hell/Dunkel kommt schon aus dem Addon `@storybook/addon-themes` (`withThemeByDataAttribute`). Zusätzlich zeigen Seiten eigene Dunkel-Varianten über feste iframes mit `globals=...;theme:Dark` (u. a. `Foundation/Dark Mode`, `Foundation/Vanilla`).
- 14 Seiten betten 1 bis 5 iframes mit fester Breite 390 px ein (`.hoops-phone iframe` in `stories/docs/blocks/blocks.css`), ca. 36 iframes. Sie zeigen Media-Query-Verhalten, das nur bei echter Fensterbreite greift.
- CSS-Responsivität: 14 `@media`-Regeln, 1 `@container`-Regel in `css/components.css`. Media-Queries reagieren auf die Breite des Dokuments, in dem sie laufen. Inline-Stories in der Docs-Seite sehen deshalb immer die Breite der Doku, nie die gewählte Gerätebreite.
- Das Viewport-Addon von Storybook wirkt im Docs-Modus nur auf Stories, die als iframe (`inline: false`) laufen.

## Entwurf

### 1. Marke und Schrift
- Ein Global `brand` mit `bbv` und `dbb`; `data-type` wird daraus abgeleitet (`dbb` → `data-type="dbb"`). Das Global `type` entfällt.
- Alte URLs mit `globals=type:dbb` werden nicht weiter ausgewertet; die Seiten und Tests, die `type` setzen, werden angepasst.
- Entschieden: DBB mit Standardschrift ist nicht mehr einstellbar; die Seite `Foundation/Typography` zeigt beide Schriften fest nebeneinander.

### 2. Hell und Dunkel
- Quelle der Wahrheit ist die Theme-Auswahl der Leiste. Alle Beispiele (auch in iframes) übernehmen sie über die Globals in der Adresse (`globals=theme:Dark`).
- Feste Dunkel-Vorschauen entfallen mit Ausnahme von `Foundation/Dark Mode` (Erklärseite) und den dortigen Dos/Don'ts.
- Tests, die Hell und Dunkel auf Seiten prüfen, laufen weiter über die axe-Matrix (`scripts/check-docs-axe.mjs`, 8 Kombinationen) und bleiben unverändert.

### 3. Breite
- Neuer Doku-Baustein `Preview` (`stories/docs/blocks/`) bettet eine Story als iframe ein (`iframe.html?viewMode=story&id=...&globals=...`), Breite 100 % der Doku-Spalte, Höhe automatisch (Nachricht `postMessage` der Story an die Seite oder `ResizeObserver` im iframe).
- Das Global `viewport` (Addon `storybook/viewport`, Geräte: Handy 390, Tablet 768, Desktop 1280, Vollbreite) setzt die Breite des iframes. Vorschau schmaler als die Spalte wird zentriert.
- Media-Queries greifen so echt, weil der iframe wirklich schmal ist. Ein Umbau auf `@container` ist nicht Teil dieses Pakets.
- Die festen Handy-Abschnitte (`## Handy · 390 px Breite`, `.hoops-phone`) entfallen. Inhalte, die nur dort erklärt wurden, wandern in den Fließtext der Seite.

### 4. Feststehende Vorschau
- Auf Seiten mit Vorschau: zweispaltige Doku (Text links, Vorschau rechts, `position: sticky; top: <Höhe der Leiste>`), unter 1100 px untereinander mit sticky Vorschau am oberen Rand und begrenzter Höhe (z. B. 50 vh).
- Mehrere Beispiele einer Seite: Entschieden ist der automatische Wechsel. Die Vorschau zeigt das Beispiel des Abschnitts, der gerade im Blick ist (IntersectionObserver); der Text kennzeichnet das aktive Beispiel. Ohne JavaScript und bei `prefers-reduced-motion` bleibt das erste Beispiel stehen und die Beispiele sind über eine Liste wählbar.
- Bedienbar per Tastatur (Fokus-Reihenfolge Text → Vorschau), keine Fokusfalle, `prefers-reduced-motion` ohne Übergänge.

## Nicht Teil
Umbau der Komponenten-CSS auf `@container`, Reaktivierung eines React-Storybooks, Änderungen an Komponenten.

## Risiken
- iframe-pro-Beispiel macht Seiten langsamer (Lazy-Loading, `loading="lazy"`, Höhe nachziehen).
- Die axe-Matrix prüft den Inhalt des Docs-Dokuments, nicht den Inhalt der iframes; sie braucht eine Erweiterung auf die iframes, sonst sinkt die Abdeckung (ADR-013 beachten).
- Code-Tests, die Story-Markup in jsdom prüfen (`*-code.test.ts`), bleiben unberührt; die Seiten-Tests (`*-docs.test.ts`) zählen heute iframes und `.hoops-phone` und müssen angepasst werden.

## Abnahme
Build und Tests grün; Browser-Prüfung (Chromium, WebKit) aller Seiten mit Umschaltung Marke, Hell/Dunkel und Breite ohne Konsolenfehler; axe-Matrix inklusive iframes ohne Befund; Sichtprüfung der feststehenden Vorschau bei langem Text, schmaler Breite und Zoom 200 %; ADR (Kapitel 9) und Kapitel 8 nachgeführt.
