<script lang="ts">
  import Icon from '../../svelte/Icon.svelte';

  let { example }: { example: string } = $props();

  const families = [
    { title: 'Spielaktionen', ids: ['2p', '3p', 'ft', 'foul-p', 'foul-t', 'foul-u', 'foul-d', 'rebound', 'assist', 'steal', 'block', 'turnover', 'sub'] },
    { title: 'Court',         ids: ['hoop', 'backboard', 'zone', '3line', 'center', 'shotclock'] },
    { title: 'Rollen',        ids: ['whistle', 'scorer', 'coach', 'captain', 'dnp'] },
    { title: 'Status',        ids: ['live', 'timeout', 'half', 'dq', 'foulout', 'bonus'] },
    { title: 'System',        ids: ['sync', 'offline', 'valid', 'print', 'signature', 'cloud', 'lock'] },
    { title: 'UI · Navigation', ids: ['home', 'search', 'bell', 'cog', 'menu', 'more-h', 'chevron-r', 'chevron-d', 'chevron-l', 'chevron-u', 'arr-r'] },
    { title: 'UI · Aktionen',   ids: ['plus', 'minus', 'check', 'x', 'edit', 'trash', 'filter', 'sort', 'export', 'import', 'share'] },
    { title: 'UI · Content',    ids: ['calendar', 'roster', 'stats', 'trophy', 'folder', 'question', 'info', 'warn'] },
  ] as const;
</script>

{#if example === 'groessen'}
  <div class="row base">
    {#each [16, 24, 32, 48, 64] as s}
      <div class="tile"><Icon name="whistle" size={s} /><div class="lbl">{s}</div></div>
    {/each}
  </div>
{:else if example === 'farbe'}
  <div class="row">
    <span class="tint" style="color: var(--hoops-chip-warn-fg);"><Icon name="live" /> Live</span>
    <span class="tint" style="color: var(--hoops-chip-err-fg);"><Icon name="foul-d" /> Disqualifiziert</span>
    <span class="tint" style="color: var(--hoops-chip-ok-fg);"><Icon name="valid" /> Validiert</span>
    <span class="tint" style="color: var(--hoops-chip-info-fg);"><Icon name="whistle" /> Schiri</span>
  </div>
{:else if example === 'barrierefreiheit'}
  <div class="row top">
    <div class="a11y">
      <div class="lbl">dekorativ, ohne title</div>
      <span class="tint"><Icon name="live" /> Live</span>
      <div class="lbl">Der Text trägt die Bedeutung, das Icon ist <code>aria-hidden</code>.</div>
    </div>
    <div class="a11y">
      <div class="lbl">beschriftet, mit title</div>
      <span class="tint"><Icon name="trash" title="Löschen" /></span>
      <div class="lbl">Das Icon steht allein: <code>role="img"</code> und <code>aria-label</code> kommen von <code>title</code>.</div>
    </div>
  </div>
{:else if example === 'galerie'}
  <div class="stack">
    {#each families as fam}
      <section>
        <h3 class="hdr">{fam.title} · {fam.ids.length}</h3>
        <ul class="row list">
          {#each fam.ids as n}
            <li class="tile">
              <Icon name={n} size={28} />
              <span class="lbl">{n}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>

{:else if example === 'do-beschriftung'}
  <div class="tile"><Icon name="trash" size={28} title="Löschen" /><span class="lbl">title="Löschen"</span></div>
{:else if example === 'dont-beschriftung'}
  <div class="tile"><Icon name="trash" size={28} /><span class="lbl">ohne title, allein</span></div>
{:else if example === 'do-groesse'}
  <p class="line"><Icon name="calendar" size={16} /> Samstag, 17:30 Uhr</p>
{:else if example === 'dont-groesse'}
  <p class="line"><Icon name="calendar" size={48} /> Samstag, 17:30 Uhr</p>
{:else if example === 'do-farbe'}
  <div class="col">
    <span class="tint" style="color: var(--hoops-chip-ok-fg);"><Icon name="valid" /> Validiert</span>
    <span class="tint" style="color: var(--hoops-chip-err-fg);"><Icon name="lock" /> Gesperrt</span>
  </div>
{:else if example === 'dont-farbe'}
  <div class="row">
    <span class="tint" style="color: var(--hoops-chip-ok-fg);"><Icon name="live" size={28} /></span>
    <span class="tint" style="color: var(--hoops-chip-err-fg);"><Icon name="live" size={28} /></span>
  </div>
{:else if example === 'do-currentcolor'}
  <span class="tint"><Icon name="info" size={28} /> Folgt der Textfarbe</span>
{:else if example === 'dont-currentcolor'}
  <!-- Falsch: feste Farbe am Icon, im Dunkelmodus unsichtbar -->
  <span class="tint"><span style="color: #191919;"><Icon name="info" size={28} /></span> Feste Farbe</span>
{/if}

<style>
  .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .row.base { align-items: flex-end; padding: 12px; }
  .row.top { align-items: flex-start; gap: 20px; }
  .row.list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }
  .row.list .tile { width: auto; }
  .col { display: flex; flex-direction: column; gap: 10px; }
  .stack { display: flex; flex-direction: column; gap: 18px; }
  .hdr {
    font-family: var(--hoops-font-mono); font-size: 11px; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: var(--hoops-page-mute); margin: 0 0 8px;
  }
  .tile {
    width: 88px; min-height: 84px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 8px;
    background: var(--hoops-page-surface-0);
    border: 1px solid var(--hoops-page-line);
    border-radius: var(--hoops-radius-md);
    padding: 10px 6px;
    color: var(--hoops-page-fg);
    box-sizing: border-box;
  }
  .base .tile { width: auto; min-width: 56px; padding: 10px 12px; }
  .stack { padding: 4px; }
  .lbl {
    font-family: var(--hoops-font-mono); font-size: 10.5px;
    color: var(--hoops-page-mute);
    text-align: center; max-width: 100%;
    overflow: hidden; text-overflow: ellipsis;
  }
  .a11y { flex: 1 1 200px; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
  .a11y .lbl { text-align: left; overflow: visible; font-size: 11px; }
  .a11y code { font-family: var(--hoops-font-mono); }
  .tint { display: inline-flex; align-items: center; gap: 6px; color: var(--hoops-page-fg); font-size: var(--hoops-fs-body); }
  .line { display: flex; align-items: center; gap: 8px; margin: 0; font-size: var(--hoops-fs-body); color: var(--hoops-page-fg); }
</style>
