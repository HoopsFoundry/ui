<script>
  import Select from '../../svelte/Select.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();
  const options = [
    { value: 'round-robin', label: 'Jeder gegen Jeden' },
    { value: 'round-robin+finals', label: 'Gruppenphase + Endrunde' },
    { value: 'swiss', label: 'Einstufungsturnier (Schweizer System)' },
  ];
  const cols = ['Standard', 'Fokus', 'Gesperrt'];
  const rows = [
    { name: 'Standard', tone: '', compact: false },
    { name: 'Fehler', tone: 'error', compact: false },
    { name: 'OK', tone: 'ok', compact: false },
    { name: 'Warnung', tone: 'warn', compact: false },
    { name: 'Kompakt', tone: '', compact: true },
  ];
</script>

{#snippet cell(row, col)}
  <div class="hoops-field {row.tone ? `is-${row.tone}` : ''}">
    <select
      class="hoops-select {row.compact ? 'hoops-select--compact' : ''} {col === 'Fokus' ? 'pseudo-focus-visible' : ''}"
      disabled={col === 'Gesperrt'}
      aria-label="{row.name}, {col}"
      aria-invalid={row.tone === 'error' ? 'true' : undefined}
    >
      {#each options as o}<option value={o.value}>{o.label}</option>{/each}
    </select>
  </div>
{/snippet}

{#if example === 'varianten'}
  <div class="grid2">
    <div>
      <div class="cap">Standard · 44 px</div>
      <Select label="Turniermodus" {options} value="round-robin" />
    </div>
    <div>
      <div class="cap">Pflichtfeld</div>
      <Select label="Turniermodus" {options} value="round-robin" required />
    </div>
    <div>
      <div class="cap">Kompakt · 36 px</div>
      <Select label="Turniermodus" {options} value="round-robin" density="compact" />
    </div>
    <div>
      <div class="cap">Fehler</div>
      <Select label="Turniermodus" {options} value="round-robin" required state="error" help="Bitte einen Modus wählen." />
    </div>
    <div>
      <div class="cap">Erfolg</div>
      <Select label="Turniermodus" {options} value="swiss" state="ok" help="Modus passt zur Teamzahl." />
    </div>
    <div>
      <div class="cap">Warnung</div>
      <Select label="Turniermodus" {options} value="round-robin" state="warn" help="Bei mehr als 8 Teams wird das Turnier lang." />
    </div>
    <div>
      <div class="cap">Gesperrt</div>
      <Select label="Turniermodus" {options} value="round-robin" disabled help="Nach Turnierstart nicht mehr änderbar." />
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface">
      <div class="states">
        <div class="head"></div>
        {#each cols as c}<div class="head">{c}</div>{/each}
        {#each rows as r}
          <div class="rowlabel">{r.name}</div>
          {#each cols as c}<div>{@render cell(r, c)}</div>{/each}
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-label'}
  <div class="narrow"><Select label="Turniermodus" {options} value="round-robin" /></div>
{:else if example === 'dont-label'}
  <div class="narrow">
    <div class="hoops-field"><select class="hoops-select" aria-label="Turniermodus">{#each options as o}<option value={o.value}>{o.label}</option>{/each}</select></div>
  </div>
{:else if example === 'do-fehler'}
  <div class="narrow"><Select label="Turniermodus" {options} required state="error" help="Bitte einen Modus wählen." /></div>
{:else if example === 'dont-fehler'}
  <div class="narrow"><Select label="Turniermodus" {options} required state="error" /></div>
{:else if example === 'do-dichte'}
  <div class="narrow"><Select label="Turniermodus" {options} value="round-robin" /></div>
{:else if example === 'dont-dichte'}
  <div class="narrow"><Select label="Turniermodus" {options} value="round-robin" density="compact" /></div>
{:else if example === 'do-gesperrt'}
  <div class="narrow"><Select label="Turniermodus" {options} value="round-robin" disabled help="Nach Turnierstart nicht mehr änderbar." /></div>
{:else if example === 'dont-gesperrt'}
  <div class="narrow"><Select label="Turniermodus" {options} value="round-robin" disabled /></div>
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .narrow { width: 100%; max-width: 320px; }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 90px repeat(3, minmax(0, 1fr)); gap: 14px 24px; align-items: center; }
</style>
