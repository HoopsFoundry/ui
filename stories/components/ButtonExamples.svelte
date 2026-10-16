<script>
  import Button from '../../svelte/Button.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();
  const variants = ['primary', 'amber', 'secondary', 'danger', 'ghost'];
  const stateNames = ['Standard', 'Hover', 'Fokus', 'Aktiv', 'Gesperrt'];
</script>

{#if example === 'anatomie'}
  <div class="row">
    <Button variant="primary">Primary</Button>
    <Button variant="amber">Amber</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
{:else if example === 'hierarchie'}
  <div class="grid2">
    <div>
      <div class="cap">Modal-Footer · Standard</div>
      <div class="row end"><Button variant="secondary">Abbrechen</Button><Button variant="primary">Freigeben</Button></div>
    </div>
    <div>
      <div class="cap">Modal-Footer · Destruktiv</div>
      <div class="row end"><Button variant="secondary">Behalten</Button><Button variant="danger">Verwerfen</Button></div>
    </div>
    <div>
      <div class="cap">Live-Scoring-Trigger · Touch</div>
      <Button variant="amber" touch>Live-Scoring starten</Button>
    </div>
    <div>
      <div class="cap">Toolbar · Quiet</div>
      <div class="row"><Button variant="ghost">Filter</Button><Button variant="ghost">Export</Button><Button variant="ghost">Mehr…</Button></div>
    </div>
  </div>
{:else if example === 'groessen'}
  <div class="row">
    <Button size="sm">Small · 44 px</Button>
    <Button size="md">Medium · 44 px</Button>
    <Button size="lg">Large · 56 px</Button>
    <Button touch>Touch · 64 px</Button>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each stateNames as s}<div class="head">{s}</div>{/each}
        {#each variants as v}
          <div class="rowlabel">{v}</div>
          <div><button type="button" class="dss-btn dss-btn--{v} dss-btn--md">{v}</button></div>
          <div><button type="button" class="dss-btn dss-btn--{v} dss-btn--md pseudo-hover">{v}</button></div>
          <div><button type="button" class="dss-btn dss-btn--{v} dss-btn--md pseudo-focus-visible">{v}</button></div>
          <div><button type="button" class="dss-btn dss-btn--{v} dss-btn--md pseudo-hover pseudo-active">{v}</button></div>
          <div><button type="button" class="dss-btn dss-btn--{v} dss-btn--md" disabled>{v}</button></div>
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-haupt'}
  <Button variant="amber">Spielbericht freigeben</Button><Button variant="secondary">Abbrechen</Button>
{:else if example === 'dont-haupt'}
  <Button variant="amber">Spielbericht freigeben</Button><Button variant="amber">Live-Scoring starten</Button>
{:else if example === 'do-verb'}
  <Button>Spielbericht freigeben</Button>
{:else if example === 'dont-verb'}
  <Button>OK</Button>
{:else if example === 'do-danger'}
  <Button variant="danger">Spiel verwerfen</Button>
{:else if example === 'dont-danger'}
  <Button variant="primary">Spiel verwerfen</Button>
{:else if example === 'do-touch'}
  <Button variant="amber" touch>2-Punkte buchen</Button>
{:else if example === 'dont-touch'}
  <Button variant="amber" size="md">2-Punkte buchen</Button>
{:else if example === 'do-grund'}
  <div class="reason">
    <button type="button" class="dss-btn dss-btn--primary dss-btn--md" disabled aria-describedby="btn-grund">Freigeben</button>
    <p id="btn-grund" class="hint">Freigabe erst, wenn beide Teams unterschrieben haben.</p>
  </div>
{:else if example === 'dont-grund'}
  <button type="button" class="dss-btn dss-btn--primary dss-btn--md" disabled>Freigeben</button>
{/if}

<style>
  .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .row.end { justify-content: flex-end; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 110px repeat(5, max-content); gap: 14px 24px; align-items: center; }
  .reason { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
  .hint { margin: 0; font-size: var(--hoops-fs-body-sm); color: var(--hoops-page-mute); }
</style>
