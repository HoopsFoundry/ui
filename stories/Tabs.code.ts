/** Eine Leiste im Aufbau der Komponenten (Einzelauswahl), mit Verbindung zu den Panels über `aria-controls`; die Doku zeigt sie und führt sie aus. */
export const barMarkup = `<div class="dss-tabs dss-tabs--underline dss-tabs--md" role="tablist" aria-label="Spielansicht" data-dss="tabs">
  <button type="button" class="dss-tab is-active" role="tab" id="spiel-uebersicht" aria-selected="true" aria-controls="spiel-uebersicht-panel" tabindex="0">
    <span class="dss-tab-label">Übersicht</span>
  </button>
  <button type="button" class="dss-tab" role="tab" id="spiel-aufstellung" aria-selected="false" aria-controls="spiel-aufstellung-panel" tabindex="-1">
    <span class="dss-tab-label">Aufstellung</span>
    <span class="dss-tab-count">12</span>
  </button>
  <button type="button" class="dss-tab is-disabled" role="tab" id="spiel-boxscore" aria-selected="false" aria-controls="spiel-boxscore-panel" tabindex="-1" disabled>
    <span class="dss-tab-label">Boxscore</span>
  </button>
</div>
<!-- Panel ohne fokussierbaren Inhalt: tabindex="0", damit die Tastatur dorthin kommt -->
<div id="spiel-uebersicht-panel" role="tabpanel" aria-labelledby="spiel-uebersicht" tabindex="0"><p>Zusammenfassung des Spiels.</p></div>
<div id="spiel-aufstellung-panel" role="tabpanel" aria-labelledby="spiel-aufstellung" tabindex="0" hidden inert><p>Aufstellung beider Mannschaften.</p></div>
<div id="spiel-boxscore-panel" role="tabpanel" aria-labelledby="spiel-boxscore" tabindex="0" hidden inert><p>Boxscore mit allen Werten.</p></div>`;

/** Das Register-Beispiel: Umschalter Alle/Heim/Auswärts und Liga/Pokal, je Leiste eine Gruppe von Panels (erfundene Daten). */
export const registerMarkup = `<div class="dss-tabs dss-tabs--segmented dss-tabs--md" role="tablist" aria-label="Spiele nach Spielort" data-dss="tabs">
  <button type="button" class="dss-tab is-active" role="tab" id="ort-alle" aria-selected="true" aria-controls="ort-alle-panel" tabindex="0"><span class="dss-tab-label">Alle</span></button>
  <button type="button" class="dss-tab" role="tab" id="ort-heim" aria-selected="false" aria-controls="ort-heim-panel" tabindex="-1"><span class="dss-tab-label">Heim</span></button>
  <button type="button" class="dss-tab" role="tab" id="ort-auswaerts" aria-selected="false" aria-controls="ort-auswaerts-panel" tabindex="-1"><span class="dss-tab-label">Auswärts</span></button>
</div>
<div id="ort-alle-panel" role="tabpanel" aria-labelledby="ort-alle" tabindex="0"><p>Alle 12 Spiele der Saison.</p></div>
<div id="ort-heim-panel" role="tabpanel" aria-labelledby="ort-heim" tabindex="0" hidden inert><p>6 Heimspiele in der Nordhain-Halle.</p></div>
<div id="ort-auswaerts-panel" role="tabpanel" aria-labelledby="ort-auswaerts" tabindex="0" hidden inert><p>6 Auswärtsspiele, das nächste in Lindenberg.</p></div>

<div class="dss-tabs dss-tabs--pills dss-tabs--md" role="tablist" aria-label="Wettbewerb" data-dss="tabs">
  <button type="button" class="dss-tab is-active" role="tab" id="wb-liga" aria-selected="true" aria-controls="wb-liga-panel" tabindex="0"><span class="dss-tab-label">Liga</span><span class="dss-tab-count">10</span></button>
  <button type="button" class="dss-tab" role="tab" id="wb-pokal" aria-selected="false" aria-controls="wb-pokal-panel" tabindex="-1"><span class="dss-tab-label">Pokal</span><span class="dss-tab-count">2</span></button>
</div>
<div id="wb-liga-panel" role="tabpanel" aria-labelledby="wb-liga" tabindex="0"><p>Zehn Ligaspiele, Platz 3 von 12.</p></div>
<div id="wb-pokal-panel" role="tabpanel" aria-labelledby="wb-pokal" tabindex="0" hidden inert><p>Zwei Pokalspiele, Achtelfinale am 24. Januar.</p></div>`;

/** Filter mit Mehrfachauswahl (Pills): `role="group"` und `aria-pressed`, keine Panels; die Seite reagiert auf `dss:tabchange`. */
export const filterMarkup = `<div class="dss-tabs dss-tabs--pills dss-tabs--md" role="group" aria-label="Ligen filtern" data-dss="tabs">
  <button type="button" class="dss-tab is-active" id="f-a" aria-pressed="true"><span class="dss-tab-label">Bayernliga Süd</span></button>
  <button type="button" class="dss-tab" id="f-b" aria-pressed="false"><span class="dss-tab-label">Regionalliga</span></button>
  <button type="button" class="dss-tab is-active" id="f-c" aria-pressed="true"><span class="dss-tab-label">Pokal</span></button>
</div>`;

export const vanilla = `<!-- Einmal im App-Root einbinden (oder dss.css aus dem Vanilla-Bündel) -->
<link rel="stylesheet" href="tokens/tokens.css" />
<link rel="stylesheet" href="css/components.css" />
<!-- optional: <link rel="stylesheet" href="fonts/fonts.css" /> -->

<!-- Eine Leiste mit Panels. Stile: dss-tabs--underline | --segmented | --pills | --vertical, Größen: --sm | --md | --lg.
     Gewählt ist der Tab mit .is-active und aria-selected="true"; jeder Tab zeigt mit aria-controls auf sein Panel.
     Das Skript schaltet um (Klick, Pfeiltasten, Pos1/Ende), setzt aria-selected, tabindex, hidden und inert. -->
${barMarkup}

<script type="module">
  import { initAll } from '@bbv/dss-design-system/vanilla-core.js';

  // Startet jede Leiste mit data-dss="tabs" (und alle anderen Bausteine mit data-dss)
  const dss = initAll(document);
  // dss.destroy() baut alles wieder ab; das Markup ist danach wie vorher
</script>

<!-- Oder einzeln, mit Optionen -->
<script type="module">
  import { initTabs } from '@bbv/dss-design-system/tabs.js';

  const leiste = initTabs(document.querySelector('.dss-tabs'), {
    activation: 'auto',   // 'manual': Pfeiltasten bewegen nur den Fokus, Enter/Leertaste wählt
    hash: true,           // Deep-Link: #spiel-aufstellung-panel wählt den Tab; eine Wahl schreibt den Anker
    // value: 'spiel-aufstellung',  // Anfangstab (id, data-tab oder Index)
    onChange: ({ id, panel }) => console.log('gewählt:', id, panel),
  });

  // Auch als Ereignis, es blubbert bis zum Dokument:
  document.addEventListener('dss:tabchange', (e) => console.log(e.detail.id, e.detail.source));

  leiste.select('spiel-aufstellung'); // aus dem Code wählen (Index, id/data-tab oder Element)
  // leiste.getValue(); leiste.destroy();
</script>

<!-- Filter mit Mehrfachauswahl (Pills): role="group" und aria-pressed statt role="tab", keine Panels.
     Ein Klick schaltet um, jeder Schalter ist per Tab-Taste erreichbar, dss:tabchange meldet pressed und ids. -->
${filterMarkup}`;

export const svelte = `<script>
  import Tabs from '@bbv/dss-design-system/svelte/Tabs';

  const ansichten = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'roster', label: 'Aufstellung', count: 12 },
    { id: 'box', label: 'Boxscore' },
  ];
  const ligen = [
    { id: 'a', label: 'Bayernliga Süd' },
    { id: 'b', label: 'Regionalliga' },
    { id: 'c', label: 'Saison 25/26' },
  ];

  let ansicht = $state('overview');
  let aktiv = $state(['a']);
</script>

<!-- Einzelauswahl: Pfeiltasten wählen und fokussieren -->
<Tabs bind:value={ansicht} items={ansichten} ariaLabel="Spielansicht" />

<!-- Das Panel rendert die App selbst -->
{#if ansicht === 'overview'}
  <p>Zusammenfassung des Spiels.</p>
{:else if ansicht === 'roster'}
  <p>Aufstellung beider Mannschaften.</p>
{/if}

<!-- Mehrfachauswahl: Pills als Filter -->
<Tabs bind:activeIds={aktiv} items={ligen} variant="pills" multi ariaLabel="Ligen filtern" />`;

export const react = `import { useState } from 'react';
import { Tabs, type TabItem } from '@bbv/dss-design-system/react';

const ansichten: TabItem[] = [
  { id: 'overview', label: 'Übersicht' },
  { id: 'roster', label: 'Aufstellung', count: 12 },
  { id: 'box', label: 'Boxscore' },
];
const ligen: TabItem[] = [
  { id: 'a', label: 'Bayernliga Süd' },
  { id: 'b', label: 'Regionalliga' },
  { id: 'c', label: 'Saison 25/26' },
];

export function Spielansicht() {
  const [ansicht, setAnsicht] = useState('overview');
  const [aktiv, setAktiv] = useState<string[]>(['a']);
  return (
    <>
      {/* Einzelauswahl: Pfeiltasten wählen und fokussieren */}
      <Tabs items={ansichten} value={ansicht} onValueChange={setAnsicht} ariaLabel="Spielansicht" />

      {/* Das Panel rendert die App selbst */}
      {ansicht === 'overview' && <p>Zusammenfassung des Spiels.</p>}
      {ansicht === 'roster' && <p>Aufstellung beider Mannschaften.</p>}

      {/* Mehrfachauswahl: Pills als Filter */}
      <Tabs items={ligen} variant="pills" multi activeIds={aktiv} onActiveIdsChange={setAktiv} ariaLabel="Ligen filtern" />
    </>
  );
}`;
