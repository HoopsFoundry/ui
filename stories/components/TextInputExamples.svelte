<script>
  import TextInput from '../../svelte/TextInput.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();
  const cols = ['Standard', 'Fokus', 'Gesperrt'];
  const rows = [
    { name: 'Standard', tone: '', value: 'Frank Müller', compact: false },
    { name: 'Fehler', tone: 'error', value: '107', compact: false },
    { name: 'OK', tone: 'ok', value: 'Frank Müller', compact: false },
    { name: 'Warnung', tone: 'warn', value: '21:45', compact: false },
    { name: 'Kompakt', tone: '', value: 'Frank Müller', compact: true },
  ];
</script>

{#snippet cell(row, col)}
  <div class="dss-field {row.tone ? `is-${row.tone}` : ''}">
    <div class="dss-input-group {col === 'Fokus' ? 'pseudo-focus-within' : ''}">
      <input
        class="dss-input dss-input--{row.compact ? 'compact' : 'default'}"
        type="text"
        value={row.value}
        disabled={col === 'Gesperrt'}
        aria-label="{row.name}, {col}"
        aria-invalid={row.tone === 'error' ? 'true' : undefined}
      />
    </div>
  </div>
{/snippet}

{#if example === 'anatomie'}
  <div class="grid2">
    <div>
      <div class="cap">Standard · mit Hilfetext</div>
      <TextInput label="Trikotnummer" placeholder="0 · 00 · 1–99" help="FIBA: 0, 00, einstellig (1–9), zweistellig (01–99)." required />
    </div>
    <div>
      <div class="cap">Optional · ohne Sternchen</div>
      <TextInput label="Zweitname" optional="Optional" placeholder="z.B. Sandro" help="Wird auf dem Spielbericht nicht abgedruckt." />
    </div>
  </div>
{:else if example === 'tonalitaeten'}
  <div class="grid2">
    <TextInput label="Standard" placeholder="Eingabe…" help="Hinweistext" />
    <TextInput label="Erfolg" value="Frank Müller" state="ok" help="Spieler bestätigt" />
    <TextInput label="Warnung" value="21:45" state="warn" help="Späte Anwurfzeit: Hallen-Schließung prüfen." />
    <TextInput label="Fehler" value="107" state="error" help="Ungültig: Nummern müssen FIBA-konform sein (max. 99)." required />
  </div>
{:else if example === 'gesperrt'}
  <div class="grid2">
    <TextInput label="Spieler-ID" value="BBV-91842" disabled help="Automatisch zugewiesen, nicht editierbar." />
    <TextInput label="Lizenz-Code" value="SR-2025-1834" disabled help="Generiert beim Speichern." />
  </div>
{:else if example === 'dichten'}
  <div class="grid2">
    <div>
      <div class="cap">Touch · 56 px</div>
      <div class="dss-field">
        <label class="dss-field-label" for="ti-touch">Spielstand Heim</label>
        <div class="dss-input-group"><input id="ti-touch" class="dss-input" type="text" inputmode="numeric" value="68" /></div>
      </div>
    </div>
    <div>
      <div class="cap">Standard · 44 px</div>
      <TextInput label="Trikotnummer" value="23" />
    </div>
    <div>
      <div class="cap">Kompakt · 36 px</div>
      <TextInput label="Trikotnummer" value="23" density="compact" />
    </div>
    <div>
      <div class="cap">Zusätze links und rechts</div>
      <TextInput label="Startgeld" value="40" inputmode="decimal">
        {#snippet prefix()}€{/snippet}
        {#snippet suffix()}pro Team{/snippet}
      </TextInput>
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
  <div class="narrow"><TextInput label="Trikotnummer" placeholder="0 · 00 · 1–99" /></div>
{:else if example === 'dont-label'}
  <!-- Platzhalter ohne Label: verschwindet beim Tippen, kein Klickziel, kein Name für Screenreader -->
  <div class="narrow">
    <div class="dss-field"><div class="dss-input-group"><input class="dss-input dss-input--default" type="text" placeholder="Trikotnummer" aria-label="Trikotnummer" /></div></div>
  </div>
{:else if example === 'do-fehler'}
  <div class="narrow"><TextInput label="Trikotnummer" value="107" state="error" help="Ungültig: Nummern müssen FIBA-konform sein (max. 99)." /></div>
{:else if example === 'dont-fehler'}
  <div class="narrow"><TextInput label="Trikotnummer" value="107" state="error" /></div>
{:else if example === 'do-format'}
  <div class="narrow"><TextInput label="Trikotnummer" placeholder="0 · 00 · 1–99" help="FIBA: 0, 00, einstellig (1–9), zweistellig (01–99)." /></div>
{:else if example === 'dont-format'}
  <div class="narrow"><TextInput label="Trikotnummer" placeholder="0 · 00 · 1–99" /></div>
{:else if example === 'do-warnung'}
  <div class="narrow"><TextInput label="Beginn" value="21:45" state="warn" help="Spätes Spiel: Hallen-Schließung beachten." /></div>
{:else if example === 'dont-warnung'}
  <div class="narrow"><TextInput label="Beginn" value="21:45" state="error" help="Spätes Spiel: Hallen-Schließung beachten." /></div>
{:else if example === 'do-gesperrt'}
  <div class="narrow"><TextInput label="Spieler-ID" value="BBV-91842" disabled help="Automatisch zugewiesen, nicht editierbar." /></div>
{:else if example === 'dont-gesperrt'}
  <div class="narrow"><TextInput label="Spieler-ID" value="BBV-91842" disabled /></div>
{/if}

<style>
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  .narrow { width: 100%; max-width: 320px; }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 90px repeat(3, minmax(190px, 1fr)); gap: 14px 24px; align-items: center; }
</style>
