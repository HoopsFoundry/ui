<script>
  import { t } from '../../js/i18n/index.js';
  import Table from '../../svelte/Table.svelte';
  import { roster, boxscore, crew, signClass } from './tableData';

  let { preset = 'boxscore', density = 'compact', dark = false, collapsible = false, open = true, id = '' } = $props();
</script>

<div style="padding: 24px;">

{#if preset === 'roster'}
  <Table
    title="TSV Nordhain 1920"
    meta="10 Spieler · Touch · 60 px"
    density="touch"
    {dark}
    {collapsible}
    {open}
    id={id || undefined}
    columns={[
      { key: 'check', label: '✓', width: '52px', align: 'center' },
      { key: 'num', label: '#', width: '64px', align: 'center' },
      { key: 'name', label: 'Spieler' },
      { key: 'pos', label: 'Position', width: '90px', align: 'center' },
      { key: 'status', label: 'Status', width: '100px', align: 'center' },
    ]}
  >
    {#snippet rows()}
      {#each roster as r}
        <tr>
          <td class="center"><input type="checkbox" class="hoops-check-input" checked={r.status === 'on'} aria-label={`${r.name} im Spielbericht`} /></td>
          <td class="center"><span class={`hoops-tn heim ${r.cap ? 'captain' : ''}`}>{r.num}</span></td>
          <td>
            <div class={`hoops-player ${r.status === 'bench' ? 'bench' : ''} ${r.status === 'dnp' ? 'dnp' : ''}`}>
              <div class="hoops-player-info">
                <span class="hoops-player-name">{r.name}{r.cap ? ' (C)' : ''}</span>
                {#if r.cap}<span class="hoops-player-meta">{t('player.captain')}</span>{/if}
              </div>
            </div>
          </td>
          <td class="center"><span class={`hoops-pos ${r.pos.toLowerCase()}`}>{r.pos}</span></td>
          <td class="center">
            <span class={`hoops-pill-s ${r.status === 'on' ? 'on' : ''} ${r.status === 'dnp' ? 'dnp' : ''} ${r.cap ? 'cap' : ''}`}>
              {r.status === 'on' ? 'Aktiv' : r.status === 'bench' ? 'Bank' : 'DNP'}
            </span>
          </td>
        </tr>
      {/each}
    {/snippet}
  </Table>

{:else if preset === 'boxscore'}
  <Table
    title={dark ? 'Lindenberg Hawks · Live Statistik' : 'Spieler-Statistiken Q1 – Q4'}
    meta={dark ? 'Q4 · 02:14' : 'Stand · 4. Viertel · 02:14'}
    live={dark}
    {density}
    {dark}
    {collapsible}
    {open}
    id={id || undefined}
    columns={[
      { key: 'num',  label: '#',   width: '52px' },
      { key: 'name', label: 'Spieler' },
      { key: 'pos',  label: 'Pos', width: '50px', align: 'center' },
      { key: 'min',  label: 'MIN', width: '60px', align: 'right', sortable: true },
      { key: 'pts',  label: 'PTS', width: '60px', align: 'right', sortable: true, sort: 'desc' },
      { key: 'p2',   label: '2P',  width: '70px', align: 'right', sortable: true },
      { key: 'p3',   label: '3P',  width: '70px', align: 'right', sortable: true },
      { key: 'ft',   label: 'FT',  width: '70px', align: 'right', sortable: true },
      { key: 'reb',  label: 'REB', width: '56px', align: 'right', sortable: true },
      { key: 'ast',  label: 'AST', width: '56px', align: 'right', sortable: true },
      { key: 'foul', label: 'F',   width: '50px', align: 'right', sortable: true },
      { key: 'pm',   label: '+/−', width: '64px', align: 'right', sortable: true },
    ]}
  >
    {#snippet rows()}
      {#each boxscore as p}
        <tr>
          <td><span class="hoops-tn heim small">{p.num}</span></td>
          <td><div class="hoops-player"><div class="hoops-player-info"><span class="hoops-player-name">{p.name}</span></div></div></td>
          <td class="center"><span class={`hoops-pos ${p.pos}`}>{p.pos.toUpperCase()}</span></td>
          <td class="num">{p.min}</td>
          <td class="num lead">{p.pts}</td>
          <td class="num">{p.p2}</td>
          <td class="num">{p.p3}</td>
          <td class="num">{p.ft}</td>
          <td class="num">{p.reb}</td>
          <td class="num">{p.ast}</td>
          <td class="num">{p.foul}</td>
          <td class={`num ${signClass(p.pm)}`}>{p.pm}</td>
        </tr>
      {/each}
    {/snippet}
    {#snippet foot()}
      <tr>
        <td colspan="3" style="text-align: left; font-family: var(--hoops-font-mono); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">Team Total</td>
        <td class="num">—</td>
        <td class="num" style="font-size: 15px;">87</td>
        <td class="num">27/52</td>
        <td class="num">6/19</td>
        <td class="num">15/19</td>
        <td class="num">37</td>
        <td class="num">20</td>
        <td class="num">16</td>
        <td class="num plus">+23</td>
      </tr>
    {/snippet}
  </Table>

{:else if preset === 'crew'}
  <Table
    title="Kampfgericht & Schiedsrichter"
    meta="5 Personen · Spielbericht-Setup"
    density="default"
    {dark}
    {collapsible}
    {open}
    id={id || undefined}
    columns={[
      { key: 'role', label: 'Rolle' },
      { key: 'name', label: 'Person' },
      { key: 'lic',  label: 'Lizenz', width: '180px' },
      { key: 'status', label: 'Status', width: '120px', align: 'center' },
    ]}
  >
    {#snippet rows()}
      {#each crew as c}
        <tr>
          <td>{c.role}</td>
          <td><div class="hoops-player"><div class="hoops-player-info"><span class="hoops-player-name">{c.name}</span></div></div></td>
          <td style="font-family: var(--hoops-font-mono); font-size: 12px;">{c.license}</td>
          <td class="center"><span class="hoops-pill-s on">Bestätigt</span></td>
        </tr>
      {/each}
    {/snippet}
  </Table>

{:else if preset === 'density'}
  <div style="display: flex; flex-direction: column; gap: 24px;">
    {#each ['touch', 'default', 'compact', 'dense'] as d}
      <div>
        <div style="font-family: var(--hoops-font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hoops-page-mute); margin-bottom: 8px;">
          Dichte · {d} · {d === 'touch' ? '60' : d === 'default' ? '48' : d === 'compact' ? '40' : '32'} px
        </div>
        <Table density={d} {dark} {collapsible} {open} title={collapsible ? `Dichte ${d}` : undefined} caption={`Dichte ${d}`} columns={[
          { key: 'num', label: '#', width: '52px' },
          { key: 'name', label: 'Spieler' },
          { key: 'pts', label: 'PTS', width: '70px', align: 'right' },
          { key: 'reb', label: 'REB', width: '70px', align: 'right' },
          { key: 'ast', label: 'AST', width: '70px', align: 'right' },
        ]}>
          {#snippet rows()}
            {#each boxscore.slice(0, 4) as p}
              <tr>
                <td><span class="hoops-tn heim small">{p.num}</span></td>
                <td><div class="hoops-player"><div class="hoops-player-info"><span class="hoops-player-name">{p.name}</span></div></div></td>
                <td class="num lead">{p.pts}</td>
                <td class="num">{p.reb}</td>
                <td class="num">{p.ast}</td>
              </tr>
            {/each}
          {/snippet}
        </Table>
      </div>
    {/each}
  </div>
{/if}

</div>
