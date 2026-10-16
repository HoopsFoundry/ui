<script lang="ts">
  // Alle Stellen, die „live“ zeigen, nebeneinander: dieselbe grüne Sprache, derselbe sanfte Puls.
  // Marke und Hell/Dunkel in der Werkzeugleiste umschalten; „Bewegung reduzieren“ im Betriebssystem stoppt den Puls.
  import ScheduleTable from '../../svelte/ScheduleTable.svelte';
  import ScheduleGrid from '../../svelte/ScheduleGrid.svelte';
  import MatchCard from '../../svelte/MatchCard.svelte';
  import PlayByPlay from '../../svelte/PlayByPlay.svelte';
  import TopBar from '../../svelte/TopBar.svelte';
  import { initialEvents } from '../components/pbpData';
  import type { ScheduleGame } from '../../js/schedule.js';

  let { mode = 'alle' }: { mode?: 'alle' | 'ohne-stand' } = $props();

  const zeile: ScheduleGame[] = [
    { id: 'z1', state: 'live', date: 'So, 04.10.2026', time: '15:45', heim: { name: 'TuSpo Hellenthal', score: 52 }, gast: { name: 'TSV Hollbach 2', score: 48 } },
  ];
  const raster: ScheduleGame[] = [
    { id: 'r1', state: 'live', time: '09:00', column: 'h1', heim: { name: 'SV Kiefernau', score: 12 }, gast: { name: 'MTV Bergfeld', score: 10 } },
  ];
  const hallen = [{ id: 'h1', label: 'Halle 1' }];
  // Live ohne Stand: das Tag steht hinter der Paarung (Zelle in Mindestbreite, 180 px)
  const ohneStand: ScheduleGame[] = [
    { id: 'o1', state: 'live', time: '09:00', column: 'h1', heim: { name: 'SV Kiefernau' }, gast: { name: 'MTV Bergfeld' } },
  ];
</script>

{#if mode === 'ohne-stand'}
  <div class="wrap narrow">
    <ScheduleGrid games={ohneStand} columns={hallen} caption="Live ohne Stand im Zeitraster" />
  </div>
{:else}
<div class="wrap">
  <div class="grid">
    <div class="cell wide">
      <div class="cap">Spielplan · Zeile (ScheduleTable)</div>
      <ScheduleTable games={zeile} layout="versus" caption="Live-Zeile im Spielplan" />
    </div>

    <div class="cell">
      <div class="cap">Spielplan · Zelle (ScheduleGrid)</div>
      <ScheduleGrid games={raster} columns={hallen} caption="Live-Zelle im Zeitraster" />
    </div>

    <div class="cell">
      <div class="cap">Spielkarte (MatchCard)</div>
      <MatchCard state="live" league="Bayernliga Süd" matchday="17. Spieltag" period={4} clock="02:14" venue="Nordhain-Halle" heim={{ name: 'TSV Nordhain', score: 87 }} gast={{ name: 'Lindenberg Hawks', score: 64 }} />
    </div>

    <div class="cell">
      <div class="cap">Play-by-Play · Kopf</div>
      <PlayByPlay title="Play-by-Play" meta="4. Viertel" events={initialEvents.slice(0, 2)} />
    </div>

    <div class="cell wide">
      <div class="cap">TopBar · immer dunkel</div>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen den scrollbaren Bereich erreichen -->
      <div class="scroll" role="region" tabindex="0" aria-label="TopBar mit Live-Kontext, seitlich scrollbar">
        <div class="scroll-in"><TopBar brand="DSS" mark="D" context="live" matchLabel="BBL · 17. Spieltag" score="87 : 64" clock="4. Viertel · 02:14" /></div>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Brotkrumen-Punkt · Tabellenkopf</div>
      <div class="dss-frame">
        <div class="dss-frame-head">
          <h3 class="dss-frame-title">Tabelle</h3>
          <div class="dss-frame-meta"><span>Spieltag 17</span><span class="dss-crumb"><span class="dss-crumb-dot" aria-hidden="true"></span> Live</span></div>
        </div>
      </div>
    </div>

    <div class="cell">
      <div class="cap">Bausteine · .dss-live und .dss-live-dot</div>
      <div class="tags">
        <span class="dss-live"><span class="dss-live-dot" aria-hidden="true"></span> Live</span>
        <span class="dss-live"><span class="dss-live-dot" aria-hidden="true"></span> Läuft</span>
      </div>
    </div>
  </div>
</div>
{/if}

<style>
  .wrap { font-family: var(--hoops-font-body); color: var(--hoops-page-fg); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(420px, 100%), 1fr)); gap: 16px; }
  .cell { padding: 20px 22px 26px; border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); background: var(--hoops-page-surface-0); min-width: 0; }
  .cell.wide { grid-column: 1 / -1; }
  .cap { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); margin-bottom: 16px; }
  .scroll { overflow-x: auto; }
  .scroll-in { min-width: 560px; }
  .narrow { max-width: 320px; }
  .tags { display: flex; flex-wrap: wrap; gap: 24px; }
</style>
