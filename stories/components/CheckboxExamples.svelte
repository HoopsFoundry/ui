<script>
  import Checkbox from '../../svelte/Checkbox.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();
  const cols = ['Standard', 'Fokus', 'Gesperrt'];
  const rows = [
    { name: 'Aus', checked: false, compact: false },
    { name: 'An', checked: true, compact: false },
    { name: 'Kompakt', checked: true, compact: true },
  ];
  const uid = (r, c) => `cb-zst-${r}-${c}`;
</script>

{#snippet cell(row, col, ri, ci)}
  <label class="hoops-check {row.compact ? 'hoops-check--compact' : ''} {col === 'Gesperrt' ? 'is-disabled' : ''}" for={uid(ri, ci)}>
    <input
      id={uid(ri, ci)}
      type="checkbox"
      class="hoops-check-input {col === 'Fokus' ? 'pseudo-focus-visible' : ''}"
      checked={row.checked}
      disabled={col === 'Gesperrt'}
    />
    <span class="hoops-check-text"><span class="hoops-check-label">Mit Rückspiel</span></span>
  </label>
{/snippet}

{#if example === 'anatomie'}
  <div class="stack">
    <Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt." checked />
    <Checkbox label="Teams setzen" />
  </div>
{:else if example === 'dichten'}
  <div class="grid2">
    <div>
      <div class="cap">Standard · 44 px</div>
      <Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt." checked />
    </div>
    <div>
      <div class="cap">Kompakt · 36 px</div>
      <Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt." checked density="compact" />
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}
        {#each rows as r, ri}
          <div class="rowlabel">{r.name}</div>
          {#each cols as c, ci}<div>{@render cell(r, c, ri, ci)}</div>{/each}
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-label'}
  <Checkbox label="Mit Rückspiel" />
{:else if example === 'dont-label'}
  <!-- Text neben der Box, aber nicht mit ihr verknüpft: nur die 22-px-Box ist klickbar -->
  <div class="loose">
    <input type="checkbox" class="hoops-check-input" aria-label="Mit Rückspiel" />
    <span>Mit Rückspiel</span>
  </div>
{:else if example === 'do-hint'}
  <Checkbox label="Mit Rückspiel" hint="Jede Paarung wird zweimal gespielt." />
{:else if example === 'dont-hint'}
  <Checkbox label="Mit Rückspiel: jede Paarung wird zweimal gespielt" />
{:else if example === 'do-dichte'}
  <Checkbox label="Mit Rückspiel" />
{:else if example === 'dont-dichte'}
  <Checkbox label="Mit Rückspiel" density="compact" />
{:else if example === 'do-gesperrt'}
  <Checkbox label="Teams setzen" hint="Erst möglich, wenn alle Teams gemeldet sind." disabled />
{:else if example === 'dont-gesperrt'}
  <Checkbox label="Teams setzen" disabled />
{/if}

<style>
  .stack { display: flex; flex-direction: column; gap: 8px; max-width: 420px; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .loose { display: inline-flex; align-items: center; gap: 10px; font-family: var(--hoops-font-body); font-size: var(--hoops-fs-body-md); color: var(--hoops-fg); }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 90px repeat(3, minmax(170px, 1fr)); gap: 14px 24px; align-items: center; }
</style>
