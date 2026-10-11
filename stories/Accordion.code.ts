// Code-Beispiele der Seite „Accordion“. Die Tests (tests/accordion-code.test.ts) übersetzen das React-Beispiel mit dem
// TypeScript-Compiler, rendern das Svelte-Beispiel und vergleichen das Vanilla-Markup mit der Ausgabe der Komponenten.

const CHEVRON = `<svg class="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5"></path></svg>`;

/** Markup des Button-Wegs (zwei Bereiche, der erste offen); die Doku zeigt es und rendert es auch. */
export const buttonMarkup = `<div class="dss-acc dss-acc--card" data-dss-acc>
  <div class="dss-acc-item is-open" id="tabelle">
    <h3 class="dss-acc-title">
      <button type="button" class="dss-acc-trigger" id="tabelle-trigger" aria-expanded="true" aria-controls="tabelle-panel">
        <span class="dss-acc-label">Tabelle</span>
        ${CHEVRON}
      </button>
    </h3>
    <div class="dss-acc-panel" id="tabelle-panel">
      <div class="dss-acc-panel-inner"><div class="dss-acc-body">Platz 3 von 12 in der Bayernliga Süd.</div></div>
    </div>
  </div>
  <div class="dss-acc-item" id="spielplan">
    <h3 class="dss-acc-title">
      <button type="button" class="dss-acc-trigger" id="spielplan-trigger" aria-expanded="false" aria-controls="spielplan-panel">
        <span class="dss-acc-label">Spielplan<span class="dss-acc-sep">,</span></span>
        <span class="dss-acc-meta">12 Spiele</span>
        ${CHEVRON}
      </button>
    </h3>
    <div class="dss-acc-panel" id="spielplan-panel" hidden inert>
      <div class="dss-acc-panel-inner"><div class="dss-acc-body">Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle.</div></div>
    </div>
  </div>
</div>`;

export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />

<!-- Button-Weg: Überschrift mit Button (empfohlen für Inhaltsseiten). Jeder Bereich braucht eine id.
     Geschlossen: aria-expanded="false", Bereich mit hidden und inert. Das Skript schaltet um. -->
${buttonMarkup}

<script type="module">
  import { initAccordions } from '@bbv/dss-design-system/accordion.js';

  // Alle [data-dss-acc] auf der Seite; Optionen: exclusive, syncHash (Standard true), expandAll, nav, sticky
  initAccordions(document, { expandAll: true, nav: true });
</script>`;

/** Markup des nativen details-Wegs (drei Bereiche, „nur einer offen“ über das gemeinsame name). */
export const detailsMarkup = `<div class="dss-acc dss-acc--card">
  <details class="dss-acc-item" name="liga" id="d-tabelle" open>
    <summary class="dss-acc-trigger"><span class="dss-acc-label">Tabelle</span></summary>
    <div class="dss-acc-panel"><div class="dss-acc-panel-inner"><div class="dss-acc-body">Platz 3 von 12 in der Bayernliga Süd.</div></div></div>
  </details>
  <details class="dss-acc-item" name="liga" id="d-spielplan">
    <summary class="dss-acc-trigger"><span class="dss-acc-label">Spielplan<span class="dss-acc-sep">,</span></span>
        <span class="dss-acc-meta">12 Spiele</span></summary>
    <div class="dss-acc-panel"><div class="dss-acc-panel-inner"><div class="dss-acc-body">Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle.</div></div></div>
  </details>
  <details class="dss-acc-item" name="liga" id="d-kader">
    <summary class="dss-acc-trigger"><span class="dss-acc-label">Kader<span class="dss-acc-sep">,</span></span><span class="dss-acc-meta">14 Spieler</span></summary>
    <div class="dss-acc-panel"><div class="dss-acc-panel-inner"><div class="dss-acc-body">Zehn Spieler, vier Trainer und Betreuer.</div></div></div>
  </details>
</div>`;

export const detailsVanilla = `<!-- Natives details: funktioniert ohne Skript. Das gemeinsame name macht daraus „nur einer offen“
     (Chrome, Edge, Safari, Firefox). Für Inhaltsseiten besser den Button-Weg: Screenreader finden die
     Bereiche über die Überschriftennavigation nur dort. -->
${detailsMarkup}

<!-- Optional, wenn Deep-Link (#id), Sprungleiste oder Alle öffnen/schließen gebraucht werden -->
<script type="module">
  import { initAccordion } from '@bbv/dss-design-system/accordion.js';

  initAccordion(document.querySelector('.dss-acc'), { exclusive: true });
</script>`;

export const svelte = `<script>
  import Accordion from '@bbv/dss-design-system/svelte/Accordion';
  import AccordionItem from '@bbv/dss-design-system/svelte/AccordionItem';

  let tabelleOffen = $state(true);
</script>

<!-- expandAll: „Alle öffnen/schließen“, nav: Sprungleiste. Beide entstehen im Browser. -->
<Accordion expandAll nav>
  <AccordionItem id="tabelle" title="Tabelle" bind:open={tabelleOffen}>
    Platz 3 von 12 in der Bayernliga Süd.
  </AccordionItem>

  <AccordionItem id="spielplan" title="Spielplan">
    {#snippet meta()}12 Spiele{/snippet}
    Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle.
  </AccordionItem>
</Accordion>`;

export const react = `import { useState } from 'react';
import { Accordion, AccordionItem } from '@bbv/dss-design-system/react';

export function LigaSeite() {
  const [tabelleOffen, setTabelleOffen] = useState(true);

  return (
    // expandAll: „Alle öffnen/schließen“, nav: Sprungleiste. Beide entstehen im Browser.
    <Accordion expandAll nav>
      <AccordionItem id="tabelle" title="Tabelle" open={tabelleOffen} onOpenChange={setTabelleOffen}>
        Platz 3 von 12 in der Bayernliga Süd.
      </AccordionItem>

      <AccordionItem id="spielplan" title="Spielplan" meta="12 Spiele">
        Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle.
      </AccordionItem>
    </Accordion>
  );
}`;

export const ebenenSvelte = `<script>
  import Accordion from '@bbv/dss-design-system/svelte/Accordion';
  import AccordionItem from '@bbv/dss-design-system/svelte/AccordionItem';
  import HeadingLevel from '@bbv/dss-design-system/svelte/HeadingLevel';
</script>

<h1>Verein</h1>

<!-- Die Seite hat h1 und Abschnitte als h2; die Bereiche darunter sind h3, ihr Inhalt h4 -->
<h2>Mannschaft</h2>
<HeadingLevel level={3}>
  <Accordion>
    <AccordionItem id="kader" title="Kader">
      <!-- Ein verschachteltes Accordion zählt automatisch hoch: h4 -->
      <Accordion>
        <AccordionItem id="heim" title="Heim">Nordhain-Halle</AccordionItem>
      </Accordion>
    </AccordionItem>

    <!-- titleAs gewinnt gegen HeadingLevel -->
    <AccordionItem id="stab" title="Trainerstab" titleAs="h5">Vier Trainer und Betreuer.</AccordionItem>
  </Accordion>
</HeadingLevel>`;

export const ebenenReact = `import { Accordion, AccordionItem, HeadingLevel } from '@bbv/dss-design-system/react';

export function Mannschaft() {
  return (
    <>
      <h1>Verein</h1>

      {/* Die Seite hat h1 und Abschnitte als h2; die Bereiche darunter sind h3, ihr Inhalt h4 */}
      <h2>Mannschaft</h2>
      <HeadingLevel level={3}>
        <Accordion>
          <AccordionItem id="kader" title="Kader">
            {/* Ein verschachteltes Accordion zählt automatisch hoch: h4 */}
            <Accordion>
              <AccordionItem id="heim" title="Heim">Nordhain-Halle</AccordionItem>
            </Accordion>
          </AccordionItem>

          {/* titleAs gewinnt gegen HeadingLevel */}
          <AccordionItem id="stab" title="Trainerstab" titleAs="h5">Vier Trainer und Betreuer.</AccordionItem>
        </Accordion>
      </HeadingLevel>
    </>
  );
}`;

export const tokensCss = `/* Alle Werte sind Rückfälle: ohne Angabe gilt der heutige Wert. Überschreibe sie in einem Container. */
.liga-seite {
  --dss-acc-gap: 8px;               /* Abstand zwischen den Karten */
  --dss-acc-pad: 14px 20px;         /* Innenabstand von Kopf und Bereich */
  --dss-acc-radius: var(--radius-xl);
  --dss-acc-title-size: var(--fs-body); /* sonst --dss-card-title-size, --dss-title-size, 18 px */
  --dss-acc-sticky-top: 56px;       /* Abstand zu einer festen Kopfzeile (Top-Bar) */
}`;

export const funktionenJs = `import { nextHeader, hashTarget, ancestorsOf, labelWithMeta, summaryText } from '@bbv/dss-design-system/accordion.js';

const koepfe = [{ disabled: false }, { disabled: true }, { disabled: false }];
nextHeader(0, 'ArrowDown', koepfe);  // 2 (der gesperrte Kopf wird übersprungen)
nextHeader(2, 'ArrowDown', koepfe);  // 2 (kein Umlauf am Ende)
nextHeader(2, 'Home', koepfe);       // 0

hashTarget('#kader', ['tabelle', 'kader']);      // 'kader'
hashTarget('#unbekannt', ['tabelle', 'kader']);  // null

const baum = [{ id: 'kader' }, { id: 'heim', parent: 'kader' }, { id: 'halle', parent: 'heim' }];
ancestorsOf('halle', baum);                      // ['kader', 'heim'] (Wurzel zuerst)

labelWithMeta('Kader', '14 Spieler');            // 'Kader, 14 Spieler'
summaryText(3, 5);                               // '3 von 5 Bereichen geöffnet'
summaryText(5, 5);                               // 'Alle Bereiche geöffnet'`;
