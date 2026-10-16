export const vanilla = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Dichte: hoops-tbl--touch | --compact | --dense (ohne Angabe 48 px). Dunkel: hoops-frame--dark. Streifen: hoops-tbl--striped -->
<div class="hoops-frame">
  <div class="hoops-frame-head">
    <h3 class="hoops-frame-title">Spieler-Statistiken</h3>
    <div class="hoops-frame-meta">
      <span>Stand · 4. Viertel</span>
      <!-- nur bei laufendem Spiel -->
      <span class="hoops-crumb"><span class="hoops-crumb-dot" aria-hidden="true"></span> Live</span>
    </div>
  </div>
  <!-- Scrollbereich: Region mit Namen, per Tastatur erreichbar -->
  <div class="hoops-table-scroll" role="region" tabindex="0" aria-label="Spieler-Statistiken">
    <table class="hoops-tbl hoops-tbl--compact">
      <thead>
        <tr>
          <th scope="col">Spieler</th>
          <th scope="col" class="right sortable">MIN</th>
          <th scope="col" class="right sortable sort-desc" aria-sort="descending">PTS</th>
          <th scope="col" class="right">+/−</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><div class="hoops-player"><div class="hoops-player-info"><span class="hoops-player-name">J. Tanner</span></div></div></td>
          <td class="num">32:14</td>
          <td class="num lead">22</td>
          <td class="num plus">+18</td>
        </tr>
        <tr class="is-own">
          <td><div class="hoops-player"><div class="hoops-player-info"><span class="hoops-player-name">M. Okafor</span></div></div></td>
          <td class="num">29:45</td>
          <td class="num lead">19</td>
          <td class="num minus">−4</td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td>Team</td><td class="num">—</td><td class="num">41</td><td class="num plus">+14</td></tr>
      </tfoot>
    </table>
  </div>
</div>`;

export const svelte = `<script>
  import Table from '@hoopsfoundry/ui/svelte/Table';

  const spieler = [
    { name: 'J. Tanner', min: '32:14', pts: 22, pm: '+18' },
    { name: 'M. Okafor', min: '29:45', pts: 19, pm: '−4' },
  ];
</script>

<Table
  title="Spieler-Statistiken"
  meta="Stand · 4. Viertel"
  live
  density="compact"
  columns={[
    { key: 'name', label: 'Spieler' },
    { key: 'min', label: 'MIN', align: 'right', sortable: true },
    { key: 'pts', label: 'PTS', align: 'right', sortable: true, sort: 'desc' },
    { key: 'pm', label: '+/−', align: 'right' },
  ]}
>
  {#snippet rows()}
    {#each spieler as s}
      <tr>
        <td>{s.name}</td>
        <td class="num">{s.min}</td>
        <td class="num lead">{s.pts}</td>
        <td class={s.pm.startsWith('+') ? 'num plus' : 'num minus'}>{s.pm}</td>
      </tr>
    {/each}
  {/snippet}
  {#snippet foot()}
    <tr><td>Team</td><td class="num">—</td><td class="num">41</td><td class="num plus">+14</td></tr>
  {/snippet}
</Table>`;

export const react = `import { Table } from '@hoopsfoundry/ui/react';

const spieler = [
  { name: 'J. Tanner', min: '32:14', pts: 22, pm: '+18' },
  { name: 'M. Okafor', min: '29:45', pts: 19, pm: '−4' },
];

<Table
  title="Spieler-Statistiken"
  meta="Stand · 4. Viertel"
  live
  density="compact"
  columns={[
    { key: 'name', label: 'Spieler' },
    { key: 'min', label: 'MIN', align: 'right', sortable: true },
    { key: 'pts', label: 'PTS', align: 'right', sortable: true, sort: 'desc' },
    { key: 'pm', label: '+/−', align: 'right' },
  ]}
  foot={
    <tr>
      <td>Team</td><td className="num">—</td><td className="num">41</td><td className="num plus">+14</td>
    </tr>
  }
>
  {spieler.map((s) => (
    <tr key={s.name}>
      <td>{s.name}</td>
      <td className="num">{s.min}</td>
      <td className="num lead">{s.pts}</td>
      <td className={s.pm.startsWith('+') ? 'num plus' : 'num minus'}>{s.pm}</td>
    </tr>
  ))}
</Table>`;

// ── Tabellen einklappen (Table.mdx, Abschnitt „Tabellen einklappen“). Die Tests (tests/collapsible-code.test.ts) übersetzen das
// React-Beispiel mit dem TypeScript-Compiler, rendern das Svelte-Beispiel und vergleichen das Vanilla-Markup mit der Ausgabe der Komponente.

const CHEVRON = `<svg class="hoops-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5"></path></svg>`;

/** Markup eines einklappbaren Tabellenrahmens (geöffnet, mit Zusatzinfo); die Doku zeigt es und prüft es gegen die Komponente. */
export const collapsibleMarkup = `<div class="hoops-acc" data-hoops-acc>
  <div class="hoops-frame is-collapsible is-open" id="boxscore">
    <div class="hoops-frame-head hoops-frame-head--acc">
      <h3 class="hoops-frame-title">
        <button type="button" class="hoops-acc-trigger" id="boxscore-trigger" aria-expanded="true" aria-controls="boxscore-panel">
          <span class="hoops-acc-label">Spieler-Statistiken<span class="hoops-acc-sep">,</span></span>
          <span class="hoops-frame-meta"><span>Stand · 4. Viertel</span></span>
          ${CHEVRON}
        </button>
      </h3>
    </div>
    <div class="hoops-acc-panel" id="boxscore-panel">
      <div class="hoops-acc-panel-inner">
        <div class="hoops-table-scroll" role="region" tabindex="0" aria-label="Spieler-Statistiken">
          <table class="hoops-tbl hoops-tbl--compact">
            <thead><tr><th scope="col" class="left">Spieler</th><th scope="col" class="right">PTS</th></tr></thead>
            <tbody>
              <tr><td>J. Tanner</td><td class="num lead">22</td></tr>
              <tr><td>M. Okafor</td><td class="num lead">19</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>`;

export const collapsibleVanilla = `<!-- Wie die normale Tabelle (siehe oben), aber der Kopf ist der Accordion-Kopf: Überschrift mit Button, der Rahmen trägt
     is-collapsible (und is-open, wenn er offen ist), die Tabelle steht in einem Bereich (hoops-acc-panel). Geschlossen: aria-expanded="false",
     Bereich mit hidden und inert. Der Container mit data-hoops-acc macht ihn bedienbar; mehrere Rahmen in einem Container bilden eine Gruppe.
     Steht der Rahmen im Panel eines Bereichs (hoops-acc-item), braucht er einen eigenen Container (div.hoops-acc mit data-hoops-acc) und einen eigenen
     initAccordion-Aufruf; initAccordions startet jeden data-hoops-acc-Container einzeln. -->
${collapsibleMarkup}

<script type="module">
  import { initAccordions } from '@hoopsfoundry/ui/accordion.js';

  // Optionen wie beim Accordion: exclusive, syncHash (Standard true), expandAll, nav, sticky
  initAccordions(document, { nav: true });
</script>`;

export const collapsibleSvelte = `<script>
  import Accordion from '@hoopsfoundry/ui/svelte/Accordion';
  import Table from '@hoopsfoundry/ui/svelte/Table';

  let open = $state(true);
</script>

<!-- Einzeln: bind:open, id für den Deep-Link (…#boxscore) -->
<Table
  collapsible
  id="boxscore"
  title="Spieler-Statistiken"
  meta="Stand · 4. Viertel"
  bind:open
  density="compact"
  columns={[
    { key: 'name', label: 'Spieler' },
    { key: 'pts', label: 'PTS', align: 'right' },
  ]}
>
  {#snippet rows()}
    <tr><td>J. Tanner</td><td class="num lead">22</td></tr>
    <tr><td>M. Okafor</td><td class="num lead">19</td></tr>
  {/snippet}
</Table>

<!-- In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“ -->
<Accordion nav navLabel="Tabellen der Spielseite" expandAll>
  <Table collapsible id="heim" title="Boxscore Heim" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
    {#snippet rows()}
      <tr><td>J. Tanner</td></tr>
    {/snippet}
  </Table>
  <Table collapsible id="gast" title="Boxscore Gast" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
    {#snippet rows()}
      <tr><td>P. Kessel</td></tr>
    {/snippet}
  </Table>
</Accordion>`;

export const collapsibleReact = `import { useState } from 'react';
import { Accordion, Table } from '@hoopsfoundry/ui/react';

export function Spielseite() {
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* Einzeln: open + onOpenChange (oder defaultOpen), id für den Deep-Link (…#boxscore) */}
      <Table
        collapsible
        id="boxscore"
        title="Spieler-Statistiken"
        meta="Stand · 4. Viertel"
        open={open}
        onOpenChange={setOpen}
        density="compact"
        columns={[
          { key: 'name', label: 'Spieler' },
          { key: 'pts', label: 'PTS', align: 'right' },
        ]}
      >
        <tr><td>J. Tanner</td><td className="num lead">22</td></tr>
        <tr><td>M. Okafor</td><td className="num lead">19</td></tr>
      </Table>

      {/* In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“ */}
      <Accordion nav navLabel="Tabellen der Spielseite" expandAll>
        <Table collapsible id="heim" title="Boxscore Heim" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
          <tr><td>J. Tanner</td></tr>
        </Table>
        <Table collapsible id="gast" title="Boxscore Gast" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
          <tr><td>P. Kessel</td></tr>
        </Table>
      </Accordion>
    </>
  );
}`;
