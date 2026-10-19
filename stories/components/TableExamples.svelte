<script lang="ts">
  import { t } from '../../js/i18n/index.js';
  import Table from '../../svelte/Table.svelte';
  import Accordion from '../../svelte/Accordion.svelte';
  import { boxscore, roster, signClass } from './tableData';

  let { example }: { example: string } = $props();

  const kurz = boxscore.slice(0, 4);
  const stay = (e: MouseEvent) => e.preventDefault();

  // Zahlenspalte der Dos und Don'ts: Ziffern mit unterschiedlicher Breite zeigen den Unterschied
  const punkte = [
    { name: 'J. Tanner', pts: 118, reb: 11 },
    { name: 'M. Okafor', pts: 81, reb: 108 },
    { name: 'L. Brandt', pts: 8, reb: 1 },
    { name: 'K. Vogler', pts: 100, reb: 111 },
  ];

  // Einklappbare Tabellen: gemeinsame Spalten; jede Tabelle hat einen eigenen Titel (die Tabelle ist eine benannte Region, axe landmark-unique)
  const statCols = [
    { key: 'num', label: '#', width: '52px' },
    { key: 'name', label: 'Spieler' },
    { key: 'pts', label: 'PTS', align: 'right' as const },
    { key: 'reb', label: 'REB', align: 'right' as const },
  ];

  const stati = ['Aktiv', 'Bank', 'Aktiv', 'DNP'] as const;
  const statusClass: Record<(typeof stati)[number], string> = { Aktiv: 'on', Bank: '', DNP: 'dnp' };

  const stateCols = ['Standard', 'Hover', 'Fokus', 'Aktiv', 'Gesperrt'] as const;
  const stateClass: Record<(typeof stateCols)[number], string> = {
    Standard: '',
    Hover: 'pseudo-hover',
    Fokus: 'pseudo-focus-visible',
    Aktiv: 'pseudo-hover pseudo-active',
    Gesperrt: '',
  };

  // Erzwingt einen Zustand auf dem Scrollbereich der Tabelle (die Tabelle selbst nimmt keine Klasse dafür)
  function forceFocus(node: HTMLElement) {
    node.querySelector('.hoops-table-scroll')?.classList.add('pseudo-focus-visible');
  }
</script>

{#snippet spieler(name: string)}
  <div class="hoops-player"><div class="hoops-player-info"><span class="hoops-player-name">{name}</span></div></div>
{/snippet}

{#snippet statRows(list: typeof boxscore)}
  {#each list as p}
    <tr><td><span class="hoops-tn heim small">{p.num}</span></td><td>{@render spieler(p.name)}</td><td class="num lead">{p.pts}</td><td class="num">{p.reb}</td></tr>
  {/each}
{/snippet}

{#if example === 'zellen'}
  <div class="gallery">
    <div>
      <div class="bez">Trikotnummer · hoops-tn</div>
      <div class="row">
        <span class="hoops-tn">4</span>
        <span class="hoops-tn heim">7</span>
        <span class="hoops-tn gast">11</span>
        <span class="hoops-tn heim captain">13</span>
        <span class="hoops-tn heim small">15</span>
        <span class="hoops-tn gast large">21</span>
      </div>
    </div>
    <div>
      <div class="bez">Position · hoops-pos</div>
      <div class="row">
        <span class="hoops-pos">?</span>
        <span class="hoops-pos pg">PG</span>
        <span class="hoops-pos sg">SG</span>
        <span class="hoops-pos sf">SF</span>
        <span class="hoops-pos pf">PF</span>
        <span class="hoops-pos c">C</span>
      </div>
    </div>
    <div>
      <div class="bez">Status · hoops-pill-s</div>
      <div class="row">
        <span class="hoops-pill-s">Bank</span>
        <span class="hoops-pill-s on">Aktiv</span>
        <span class="hoops-pill-s cap">{t('player.captain')}</span>
        <span class="hoops-pill-s dnp">DNP</span>
      </div>
    </div>
    <div>
      <div class="bez">Spieler · hoops-player</div>
      <div class="row row--col">
        {@render spieler('J. Tanner')}
        <div class="hoops-player bench"><div class="hoops-player-info"><span class="hoops-player-name">P. Kessel</span></div></div>
        <div class="hoops-player dnp"><div class="hoops-player-info"><span class="hoops-player-name">C. Fenwick</span><span class="hoops-player-meta">nicht eingesetzt</span></div></div>
      </div>
    </div>
  </div>
{:else if example === 'zahlen'}
  <div class="wide">
    <Table title="Zahlenspalten" meta="Compact" density="compact" caption="Beispiel für Zahlenzellen"
      columns={[
        { key: 'name', label: 'Spieler' },
        { key: 'min', label: 'MIN', align: 'right' },
        { key: 'pts', label: 'PTS', align: 'right' },
        { key: 'reb', label: 'REB', align: 'right' },
        { key: 'pm', label: '+/−', align: 'right' },
      ]}>
      {#snippet rows()}
        <tr><td>{@render spieler('J. Tanner')}</td><td class="num">32:14</td><td class="num lead">22</td><td class="num dim">4</td><td class="num plus">+18</td></tr>
        <tr><td>{@render spieler('M. Okafor')}</td><td class="num">29:45</td><td class="num lead">19</td><td class="num dim">3</td><td class="num plus">+15</td></tr>
        <tr><td>{@render spieler('P. Kessel')}</td><td class="num">12:08</td><td class="num lead">6</td><td class="num dim">1</td><td class="num minus">−4</td></tr>
      {/snippet}
    </Table>
  </div>
{:else if example === 'sortierung'}
  <div class="wide">
    <Table title="Sortierung" meta="Pfeil und aria-sort" density="compact"
      columns={[
        { key: 'name', label: 'Spieler' },
        { key: 'min', label: 'MIN (sortierbar)', align: 'right', sortable: true },
        { key: 'pts', label: 'PTS (absteigend)', align: 'right', sortable: true, sort: 'desc' },
        { key: 'reb', label: 'REB (aufsteigend)', align: 'right', sortable: true, sort: 'asc' },
      ]}>
      {#snippet rows()}
        {#each kurz.slice(0, 3) as p}
          <tr><td>{@render spieler(p.name)}</td><td class="num">{p.min}</td><td class="num lead">{p.pts}</td><td class="num">{p.reb}</td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'streifen'}
  <div class="wide">
    <Table title="Streifen und eigene Zeile" meta="striped · is-own" density="compact" striped
      columns={[
        { key: 'num', label: '#', width: '52px' },
        { key: 'name', label: 'Spieler' },
        { key: 'pts', label: 'PTS', align: 'right' },
      ]}>
      {#snippet rows()}
        {#each kurz as p, i}
          <tr class={i === 1 ? 'is-own' : ''}><td><span class="hoops-tn heim small">{p.num}</span></td><td>{@render spieler(p.name)}</td><td class="num lead">{p.pts}</td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'sticky'}
  <div class="wide sticky">
    <Table title="Kopf bleibt stehen" meta="Scrollbereich 200 px hoch" density="compact"
      columns={[
        { key: 'num', label: '#', width: '52px' },
        { key: 'name', label: 'Spieler' },
        { key: 'pts', label: 'PTS', align: 'right' },
        { key: 'reb', label: 'REB', align: 'right' },
      ]}>
      {#snippet rows()}
        {#each [...boxscore, ...boxscore] as p}
          <tr><td><span class="hoops-tn heim small">{p.num}</span></td><td>{@render spieler(p.name)}</td><td class="num lead">{p.pts}</td><td class="num">{p.reb}</td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <Table title="Zeile, Link, Schalter, Kontrollkästchen" meta="Zustände je Zeile" density="default" caption="Zustände der Bedienelemente in einer Tabelle"
      columns={[
        { key: 'zustand', label: 'Zustand', width: '120px' },
        { key: 'link', label: 'Link' },
        { key: 'btn', label: 'Schalter' },
        { key: 'chk', label: 'Kontrollkästchen', align: 'center' },
      ]}>
      {#snippet rows()}
        {#each stateCols as s}
          {@const c = stateClass[s]}
          <tr class={s === 'Hover' || s === 'Aktiv' ? 'pseudo-hover' : ''}>
            <td><b>{s}</b></td>
            <td>
              {#if s === 'Gesperrt'}
                <span class="mute">kein Link</span>
              {:else}
                <a class={`hoops-link ${c}`} href="#spieler" onclick={stay}>J. Tanner</a>
              {/if}
            </td>
            <td><button type="button" class={`hoops-btn hoops-btn--secondary hoops-btn--sm ${c}`} disabled={s === 'Gesperrt'}>Öffnen</button></td>
            <td class="center"><input type="checkbox" class={`hoops-check-input ${c}`} checked disabled={s === 'Gesperrt'} style={s === 'Gesperrt' ? 'opacity: 0.5; cursor: not-allowed;' : undefined} aria-label={`Kontrollkästchen, ${s}`} /></td>
          </tr>
        {/each}
      {/snippet}
    </Table>
    <div class="bez">Scrollbereich der Tabelle, fokussiert</div>
    <div class="narrow" use:forceFocus>
      <Table title="Boxscore" density="compact" caption="Boxscore, seitlich scrollbar"
        columns={[
          { key: 'name', label: 'Spieler', width: '220px' },
          { key: 'a', label: 'PTS', align: 'right', width: '120px' },
          { key: 'b', label: 'REB', align: 'right', width: '120px' },
        ]}>
        {#snippet rows()}
          {#each kurz.slice(0, 2) as p}
            <tr><td>{@render spieler(p.name)}</td><td class="num lead">{p.pts}</td><td class="num">{p.reb}</td></tr>
          {/each}
        {/snippet}
      </Table>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-zahlen' || example === 'dont-zahlen'}
  <!-- Don't: lokales CSS stellt Zahlen nach, wie sie ohne die Klasse num aussähen (linksbündig, Proportionalschrift, ohne tabellarische Ziffern) -->
  <div class={`wide ${example === 'dont-zahlen' ? 'prop' : ''}`}>
    <Table density="compact" caption="Zahlenspalten"
      columns={[
        { key: 'name', label: 'Spieler' },
        { key: 'pts', label: 'PTS', align: 'right' },
        { key: 'reb', label: 'REB', align: 'right' },
      ]}>
      {#snippet rows()}
        {#each punkte as p}
          <tr><td>{@render spieler(p.name)}</td><td class="num">{p.pts}</td><td class="num">{p.reb}</td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'do-dichte' || example === 'dont-dichte'}
  <div class="wide">
    <Table density={example === 'do-dichte' ? 'touch' : 'dense'} caption="Spieler wählen"
      columns={[
        { key: 'name', label: 'Spieler' },
        { key: 'st', label: 'Status', align: 'center' },
      ]}>
      {#snippet rows()}
        {#each kurz.slice(0, 3) as p, i}
          <tr><td>{@render spieler(p.name)}</td><td class="center"><span class={`hoops-pill-s ${i === 2 ? '' : 'on'}`}>{i === 2 ? 'Bank' : 'Aktiv'}</span></td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'do-spalten' || example === 'dont-spalten'}
  <div class="phone">
    {#if example === 'do-spalten'}
      <Table density="compact" caption="Boxscore, wichtigste Spalten zuerst"
        columns={[
          { key: 'num', label: '#', width: '52px' },
          { key: 'name', label: 'Spieler' },
          { key: 'pts', label: 'PTS', align: 'right' },
          { key: 'min', label: 'MIN', align: 'right' },
          { key: 'p2', label: '2P', align: 'right' },
          { key: 'p3', label: '3P', align: 'right' },
          { key: 'ft', label: 'FT', align: 'right' },
          { key: 'reb', label: 'REB', align: 'right' },
        ]}>
        {#snippet rows()}
          {#each kurz.slice(0, 3) as p}
            <tr><td><span class="hoops-tn heim small">{p.num}</span></td><td>{@render spieler(p.name)}</td><td class="num lead">{p.pts}</td><td class="num">{p.min}</td><td class="num">{p.p2}</td><td class="num">{p.p3}</td><td class="num">{p.ft}</td><td class="num">{p.reb}</td></tr>
          {/each}
        {/snippet}
      </Table>
    {:else}
      <Table density="compact" caption="Boxscore, wichtigste Spalte zuletzt"
        columns={[
          { key: 'num', label: '#', width: '52px' },
          { key: 'name', label: 'Spieler' },
          { key: 'min', label: 'MIN', align: 'right' },
          { key: 'p2', label: '2P', align: 'right' },
          { key: 'p3', label: '3P', align: 'right' },
          { key: 'ft', label: 'FT', align: 'right' },
          { key: 'reb', label: 'REB', align: 'right' },
          { key: 'pts', label: 'PTS', align: 'right' },
        ]}>
        {#snippet rows()}
          {#each kurz.slice(0, 3) as p}
            <tr><td><span class="hoops-tn heim small">{p.num}</span></td><td>{@render spieler(p.name)}</td><td class="num">{p.min}</td><td class="num">{p.p2}</td><td class="num">{p.p3}</td><td class="num">{p.ft}</td><td class="num">{p.reb}</td><td class="num lead">{p.pts}</td></tr>
          {/each}
        {/snippet}
      </Table>
    {/if}
  </div>
{:else if example === 'do-sort' || example === 'dont-sort'}
  <div class="wide">
    <Table density="compact" caption="Sortiert nach Punkten"
      columns={[
        { key: 'name', label: 'Spieler' },
        { key: 'min', label: 'MIN', align: 'right', sortable: true },
        example === 'do-sort'
          ? { key: 'pts', label: 'PTS', align: 'right', sortable: true, sort: 'desc' }
          : { key: 'pts', label: 'PTS ▼', align: 'right' },
      ]}>
      {#snippet rows()}
        {#each kurz.slice(0, 3) as p}
          <tr><td>{@render spieler(p.name)}</td><td class="num">{p.min}</td><td class="num lead">{p.pts}</td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'do-farbe' || example === 'dont-farbe'}
  <!-- Don't: lokales CSS reduziert die Pille auf einen Farbpunkt ohne Text -->
  <div class={`wide ${example === 'dont-farbe' ? 'dots' : ''}`}>
    <Table density="default" caption="Status der Spieler"
      columns={[
        { key: 'name', label: 'Spieler' },
        { key: 'st', label: 'Status', align: 'center' },
      ]}>
      {#snippet rows()}
        {#each kurz as p, i}
          <tr><td>{@render spieler(p.name)}</td><td class="center"><span class={`hoops-pill-s ${statusClass[stati[i]]}`}>{stati[i]}</span></td></tr>
        {/each}
      {/snippet}
    </Table>
  </div>
{:else if example === 'einklappbar'}
  <div class="stack">
    <Table collapsible open title="Heimteam im 4. Viertel" meta="Stand · 4. Viertel" live density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
    <Table collapsible title="Gastteam im 4. Viertel" meta="4. Viertel" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
  </div>
{:else if example === 'einklappbar-id'}
  <div class="stack">
    <p class="links">
      Direkt springen: <a class="hoops-link" href="#tab-gast">Statistik Lindenberg Hawks</a>
    </p>
    <Table collapsible id="tab-heim" title="Statistik TSV Nordhain" meta="Stand · 4. Viertel" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
    <Table collapsible id="tab-gast" title="Statistik Lindenberg Hawks" meta="4. Viertel" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
  </div>
{:else if example === 'einklappbar-gruppe'}
  <Accordion syncHash={false} nav navLabel="Tabellen der Spielseite" expandAll>
    <Table collapsible id="gr-heim" title="Boxscore Nordhain" meta="4. Viertel" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
    <Table collapsible id="gr-gast" title="Boxscore Hawks" meta="4. Viertel" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
    <Table collapsible id="gr-kader" title="Kader Nordhain" meta="10 Spieler" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
  </Accordion>
{:else if example === 'do-offen'}
  <div class="stack">
    <Table collapsible open title="Live: Nordhain gegen Seeberg" meta="4. Viertel" live density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
    <Table collapsible title="Kader Seeberg" meta="10 Spieler" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
  </div>
{:else if example === 'dont-zu'}
  <div class="stack">
    <Table collapsible title="Live: Elbach gegen Kiefernau" meta="4. Viertel" live density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
    <Table collapsible title="Kader Kiefernau" meta="10 Spieler" density="compact" columns={statCols}>
      {#snippet rows()}{@render statRows(kurz)}{/snippet}
    </Table>
  </div>
{/if}

<style>
  .stack { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .links { margin: 0; font-size: var(--hoops-fs-body-sm); color: var(--hoops-page-fg); }
  .wide { width: 100%; }
  .narrow { width: 100%; max-width: 360px; }
  .phone { width: 100%; max-width: 340px; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 24px; }
  .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .row--col { flex-direction: column; align-items: flex-start; gap: 8px; }
  .bez { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .mute { color: var(--hoops-mute); }
  /* Sticky Kopf wirkt erst, wenn der Scrollbereich eine Höhe hat */
  .sticky :global(.hoops-table-scroll) { max-height: 200px; overflow-y: auto; }
  /* Don't-Nachbildung: Zahlen wie ohne die Klasse num */
  .prop :global(.hoops-tbl td.num), .prop :global(.hoops-tbl th.right) {
    text-align: left; font-family: var(--hoops-font-body); font-variant-numeric: normal; font-weight: 400;
  }
  .prop :global(.hoops-tbl th.right) { font-family: var(--hoops-font-mono); font-weight: 600; }
  /* Don't-Nachbildung: Status nur als Farbfläche, ohne Text */
  .dots :global(.hoops-pill-s) { width: 14px; height: 14px; padding: 0; border-radius: 50%; font-size: 0; gap: 0; }
</style>
