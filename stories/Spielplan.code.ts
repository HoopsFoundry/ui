const imports = `<!-- Einmal im App-Root einbinden -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->
`;

// Mannschaftssicht (layout opponent), mit eigener Uhrzeit; das Ergebnis ist hier vorläufig (Tag unter der Zahl)
export const tableVanilla = imports + `
<div class="hoops-frame">
  <div class="hoops-frame-head">
    <h3 class="hoops-frame-title">Spielplan</h3>
    <div class="hoops-frame-meta"><span>Saison 2026/27</span></div>
  </div>
  <div class="hoops-table-scroll">
    <table role="table" class="hoops-tbl hoops-tbl--schedule hoops-tbl--touch hoops-sch--opponent">
      <caption class="hoops-sr-only">Spielplan der Mannschaft</caption>
      <thead role="rowgroup" class="hoops-sr-only">
        <tr role="row">
          <th scope="col" role="columnheader">Zeit</th>
          <th scope="col" role="columnheader">Heim oder Auswärts</th>
          <th scope="col" role="columnheader">Gegner</th>
          <th scope="col" role="columnheader">Ergebnis</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr role="row" class="hoops-sch-group"><th scope="colgroup" colspan="4">Spieltag 5</th></tr>
        <tr role="row" class="hoops-sch-row">
          <td role="cell" class="hoops-sch-when">
            <span class="hoops-sch-date">Sa, 26.09.2026</span>
            <span class="hoops-sch-time"><input type="text" value="17:30" aria-label="Anwurfzeit TSV Falken Auental" /></span>
          </td>
          <td role="cell" class="hoops-sch-ha">
            <span class="hoops-chip hoops-chip--mono hoops-chip--sky">vs.</span>
          </td>
          <td role="cell" class="hoops-sch-match">
            <span class="hoops-sch-opp">
              <span class="hoops-sch-logo" aria-hidden="true">TFA</span>
              <span class="hoops-sch-team"><a class="hoops-link" href="/teams/freising">TSV Falken Auental</a></span>
            </span>
          </td>
          <td role="cell" class="hoops-sch-res">
            <span class="hoops-sch-resbox">
              <span class="hoops-chip hoops-chip--mono hoops-chip--err" aria-hidden="true">N</span>
              <span class="hoops-sch-score" aria-hidden="true">65 : 108</span>
              <span class="hoops-sr-only">Eigene 65, Gegner 108, Niederlage, vorläufig</span>
              <small class="hoops-sch-prov" aria-hidden="true">vorläufig</small>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

export const tableReact = `import { ScheduleTable } from '@hoopsfoundry/ui/react';

<ScheduleTable
  games={games}
  caption="Spielplan der Mannschaft"
  title="Spielplan"
  meta="Saison 2026/27"
  renderLink={({ href, className, children }) => (
    <RouterLink to={href} className={className}>{children}</RouterLink>
  )}
  renderTime={(game) => <TimeInput game={game} />}
/>`;

export const tableSvelte = `<script>
  import ScheduleTable from '@hoopsfoundry/ui/svelte/ScheduleTable';
</script>

<ScheduleTable {games} caption="Spielplan der Mannschaft" title="Spielplan" meta="Saison 2026/27">
  {#snippet time(game)}
    <input type="text" value={game.time} aria-label="Anwurfzeit {game.opponent.name}" />
  {/snippet}
</ScheduleTable>`;

// Gegenüberstellung (layout versus), eine Zeile ohne Zusatzspalte
export const versusVanilla = `<div class="hoops-frame">
  <div class="hoops-table-scroll">
    <table role="table" class="hoops-tbl hoops-tbl--schedule hoops-tbl--default hoops-sch--versus">
      <caption class="hoops-sr-only">Heimspiele</caption>
      <thead role="rowgroup" class="hoops-sr-only">
        <tr role="row">
          <th scope="col" role="columnheader">Zeit</th>
          <th scope="col" role="columnheader">Spiel</th>
          <th scope="col" role="columnheader">Ergebnis</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr role="row" class="hoops-sch-row">
          <td role="cell" class="hoops-sch-when"><span class="hoops-sch-time">19:00</span></td>
          <td role="cell" class="hoops-sch-match">
            <span class="hoops-sch-team">Team A</span>
            <span class="hoops-sch-sep" aria-hidden="true"> – </span>
            <span class="hoops-sr-only"> gegen </span>
            <span class="hoops-sch-team is-loser">Team B</span>
          </td>
          <td role="cell" class="hoops-sch-res">
            <span class="hoops-sch-resbox">
              <span class="hoops-sch-score" aria-hidden="true">72 : 65</span>
              <span class="hoops-sr-only">Heim 72, Gast 65</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

export const versusReact = `import { ScheduleTable } from '@hoopsfoundry/ui/react';

const games = [
  { id: 'v1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } },
];

<ScheduleTable games={games} caption="Heimspiele" />`;

export const versusSvelte = `<script>
  import ScheduleTable from '@hoopsfoundry/ui/svelte/ScheduleTable';
  const games = [
    { id: 'v1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } },
  ];
</script>

<ScheduleTable {games} caption="Heimspiele" />`;

// Zeitraster: eine Zeile, Halle 1 belegt, Halle 2 frei
export const gridVanilla = `<div class="hoops-frame">
  <div class="hoops-table-scroll">
    <table role="table" class="hoops-tbl hoops-sgrid hoops-tbl--default">
      <caption class="hoops-sr-only">Hallenbelegung</caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader" class="hoops-sg-time">Zeit</th>
          <th scope="col" role="columnheader">Halle 1</th>
          <th scope="col" role="columnheader">Halle 2</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        <tr role="row">
          <th scope="row" role="rowheader" class="hoops-sg-time">09:00</th>
          <td role="cell" class="hoops-sg-cell" data-label="Halle 1">
            <div class="hoops-sg-game">
              <div class="hoops-sg-teams">
                <span class="hoops-sch-team">Team A</span>
                <span class="hoops-sch-sep" aria-hidden="true"> – </span>
                <span class="hoops-sr-only"> gegen </span>
                <span class="hoops-sch-team">Team B</span>
              </div>
            </div>
          </td>
          <td role="cell" class="hoops-sg-cell is-empty" data-label="Halle 2">
            <span class="hoops-sg-empty">frei</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;

const gridData = `const columns = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];
const slots = ['09:00'];
const games = [
  { id: 'g1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } },
];`;

export const gridReact = `import { ScheduleGrid } from '@hoopsfoundry/ui/react';

${gridData}

<ScheduleGrid games={games} columns={columns} slots={slots} caption="Hallenbelegung" />`;

export const gridSvelte = `<script>
  import ScheduleGrid from '@hoopsfoundry/ui/svelte/ScheduleGrid';
  ${gridData.replaceAll('\n', '\n  ')}
</script>

<ScheduleGrid {games} {columns} {slots} caption="Hallenbelegung" />`;

// Datenbeispiel: für alle Fassungen gleich
export const codeGame = `const games = [{
  id: '1', state: 'finished', section: 'Spieltag 5',
  date: 'Sa, 26.09.2026', time: '17:30',
  at: 'heim',
  opponent: { name: 'TSV Falken Auental', href: '/teams/freising', score: 108 },
  ownScore: 65,
}];`;


// Namen und Logos: ein Team mit Logo (Initialen, weil keine Logo-URL) und Kurzname
export const namesVanilla = `<!-- names="short": zusätzlich hoops-team-name--short am Namens-Span. Ohne die Klasse erscheint der Kurzname nur bis 640 px Breite. -->
<span class="hoops-sch-team hoops-sch-team--logo">
  <span class="hoops-team-logo hoops-team-logo--initials" aria-hidden="true">LH</span>
  <a class="hoops-link" href="/teams/hawks">
    <span class="hoops-team-name hoops-team-name--short"><span class="hoops-name-full">Lindenberg Hawks</span><span class="hoops-name-short" aria-hidden="true">Hawks</span></span>
  </a>
</span>

<!-- mit Logo-Datei statt Initialen: alt bleibt leer, der Name steht daneben -->
<span class="hoops-team-logo" aria-hidden="true"><img src="/logos/hawks.svg" alt="" loading="lazy" /></span>`;

const namesData = `const games = [{
  id: '1', state: 'finished', date: 'Sa, 10.10.2026', time: '15:00',
  heim: { name: 'TSV Nordhain 1920', short: 'TSV N.', logo: '/logos/nordhain.svg', score: 87 },
  gast: { name: 'Lindenberg Hawks', short: 'Hawks', logo: '/logos/hawks.svg', score: 64 },
}];
const columns = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];
const gridGames = [
  { id: 'g1', state: 'scheduled', time: '09:00', column: 'h1',
    heim: { name: 'TSV Nordhain 1920', short: 'TSV N.', logo: '/logos/nordhain.svg' },
    gast: { name: 'Lindenberg Hawks', short: 'Hawks', logo: '/logos/hawks.svg' } },
  { id: 'g2', state: 'scheduled', time: '09:00', column: 'h2',
    heim: { name: 'BG Seeberg', short: 'Seeberg' }, gast: { name: 'SV Kiefernau', short: 'Kiefernau' } },
];`;

const namesDataReact = namesData.replaceAll("state: 'scheduled'", "state: 'scheduled' as const").replace("state: 'finished'", "state: 'finished' as const");

export const namesReact = `import { ScheduleTable, ScheduleGrid } from '@hoopsfoundry/ui/react';

${namesDataReact}

// Kurznamen und Logos; bis 640 px Breite erscheinen die Kurznamen auch bei names="full"
<ScheduleTable games={games} layout="versus" names="short" logos caption="Spieltag" />
<ScheduleGrid games={gridGames} columns={columns} names="short" logos caption="Hallenbelegung" />`;

export const namesSvelte = `<script>
  import ScheduleTable from '@hoopsfoundry/ui/svelte/ScheduleTable';
  import ScheduleGrid from '@hoopsfoundry/ui/svelte/ScheduleGrid';
  ${namesData.replaceAll('\n', '\n  ')}
</script>

<!-- Kurznamen und Logos; bis 640 px Breite erscheinen die Kurznamen auch bei names="full" -->
<ScheduleTable {games} layout="versus" names="short" logos caption="Spieltag" />
<ScheduleGrid games={gridGames} {columns} names="short" logos caption="Hallenbelegung" />`;

// ── Tabellen einklappen (Spielplan.mdx, Abschnitt „Tabellen einklappen“). Die Tests (tests/collapsible-code.test.ts) übersetzen die
// React-Beispiele mit dem TypeScript-Compiler, rendern die Svelte-Beispiele und vergleichen das Vanilla-Markup mit der Ausgabe der Komponenten.

const CHEVRON = `<svg class="hoops-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5"></path></svg>`;

/** Markup eines einklappbaren Spielplans (ScheduleTable, geöffnet, mit Zusatzinfo); die Doku zeigt es und prüft es gegen die Komponente. */
export const collapsibleMarkup = `<div class="hoops-acc" data-hoops-acc>
  <div class="hoops-frame is-collapsible is-open" id="spielplan">
    <div class="hoops-frame-head hoops-frame-head--acc">
      <h3 class="hoops-frame-title">
        <button type="button" class="hoops-acc-trigger" id="spielplan-trigger" aria-expanded="true" aria-controls="spielplan-panel">
          <span class="hoops-acc-label">Spielplan<span class="hoops-acc-sep">,</span></span>
          <span class="hoops-frame-meta"><span>Saison 2026/27</span></span>
          ${CHEVRON}
        </button>
      </h3>
    </div>
    <div class="hoops-acc-panel" id="spielplan-panel">
      <div class="hoops-acc-panel-inner">
        <div class="hoops-table-scroll" role="region" tabindex="0" aria-label="Heimspiele">
          <table role="table" class="hoops-tbl hoops-tbl--schedule hoops-tbl--touch hoops-sch--versus">
            <caption class="hoops-sr-only">Heimspiele</caption>
            <thead role="rowgroup" class="hoops-sr-only">
              <tr role="row">
                <th scope="col" role="columnheader">Zeit</th>
                <th scope="col" role="columnheader">Spiel</th>
                <th scope="col" role="columnheader">Ergebnis</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              <tr role="row" class="hoops-sch-row">
                <td role="cell" class="hoops-sch-when"><span class="hoops-sch-time">19:00</span></td>
                <td role="cell" class="hoops-sch-match">
                  <span class="hoops-sch-team">Team A</span><span class="hoops-sch-sep" aria-hidden="true"> – </span><span class="hoops-sr-only"> gegen </span><span class="hoops-sch-team is-loser">Team B</span>
                </td>
                <td role="cell" class="hoops-sch-res">
                  <span class="hoops-sch-resbox"><span class="hoops-sch-score" aria-hidden="true">72 : 65</span><span class="hoops-sr-only">Heim 72, Gast 65</span></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>`;

export const collapsibleVanilla = `<!-- Wie der normale Spielplan (siehe oben), aber der Kopf ist der Accordion-Kopf: Überschrift mit Button, der Rahmen trägt
     is-collapsible (und is-open, wenn er offen ist), die Tabelle steht in einem Bereich (hoops-acc-panel). Das Zeitraster (hoops-sgrid)
     wird genauso eingeklappt. Geschlossen: aria-expanded="false", Bereich mit hidden und inert.
     Steht der Rahmen im Panel eines Bereichs (hoops-acc-item), braucht er einen eigenen Container (div.hoops-acc mit data-hoops-acc) und einen eigenen
     initAccordion-Aufruf; initAccordions startet jeden data-hoops-acc-Container einzeln. -->
${collapsibleMarkup}

<script type="module">
  import { initAccordions } from '@hoopsfoundry/ui/accordion.js';

  initAccordions(document, { nav: true });
</script>`;

const collapsibleGames = `const games = [
  { id: 'v1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } },
];
const columns = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];
const rasterGames = [
  { id: 'g1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } },
];`;

export const collapsibleSvelte = `<script>
  import Accordion from '@hoopsfoundry/ui/svelte/Accordion';
  import ScheduleGrid from '@hoopsfoundry/ui/svelte/ScheduleGrid';
  import ScheduleTable from '@hoopsfoundry/ui/svelte/ScheduleTable';

  ${collapsibleGames.replaceAll('\n', '\n  ')}
  let open = $state(true);
</script>

<!-- Einzeln: bind:open, id für den Deep-Link (…#spielplan) -->
<ScheduleTable collapsible id="spielplan" bind:open title="Spielplan" meta="Saison 2026/27" {games} caption="Heimspiele" />

<!-- In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“; auch das Zeitraster lässt sich einklappen -->
<Accordion nav navLabel="Bereiche des Spieltags" expandAll>
  <ScheduleTable collapsible id="heimspiele" title="Heimspiele" {games} caption="Heimspiele des Spieltags" />
  <ScheduleGrid collapsible id="hallen" title="Hallenbelegung" games={rasterGames} {columns} caption="Hallenbelegung am Samstag" />
</Accordion>`;

export const collapsibleReact = `import { useState } from 'react';
import { Accordion, ScheduleGrid, ScheduleTable } from '@hoopsfoundry/ui/react';
import type { ScheduleGame } from '@hoopsfoundry/ui/react';

${collapsibleGames.replace('const games = [', 'const games: ScheduleGame[] = [').replace('const rasterGames = [', 'const rasterGames: ScheduleGame[] = [')}

export function Spieltag() {
  const [open, setOpen] = useState(true);
  return (
    <>
      {/* Einzeln: open + onOpenChange (oder defaultOpen), id für den Deep-Link (…#spielplan) */}
      <ScheduleTable collapsible id="spielplan" open={open} onOpenChange={setOpen} title="Spielplan" meta="Saison 2026/27" games={games} caption="Heimspiele" />

      {/* In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“; auch das Zeitraster lässt sich einklappen */}
      <Accordion nav navLabel="Bereiche des Spieltags" expandAll>
        <ScheduleTable collapsible id="heimspiele" title="Heimspiele" games={games} caption="Heimspiele des Spieltags" />
        <ScheduleGrid collapsible id="hallen" title="Hallenbelegung" games={rasterGames} columns={columns} caption="Hallenbelegung am Samstag" />
      </Accordion>
    </>
  );
}`;
