<script>
  import Banner from '../../svelte/Banner.svelte';
  import TextInput from '../../svelte/TextInput.svelte';

  /** @type {{ example: string }} */
  let { example } = $props();

  const rows = [
    { severity: 'info', name: 'info', title: 'Hinweis', body: 'Geschätzte Gesamtdauer: 180 Minuten.' },
    { severity: 'ok', name: 'ok', title: 'Aufstellung bestätigt', body: '5 Start-Spieler, 7 Bank-Spieler. Das Spiel kann beginnen.' },
    { severity: 'warn', name: 'warn', title: 'Hallenzeit knapp', body: 'Das passt nur mit weniger Runden in die verfügbare Hallenzeit.' },
    { severity: 'danger', name: 'danger', title: 'Export fehlgeschlagen', body: 'Bitte erneut versuchen.' },
  ];
  const cols = ['Standard', 'Fokus'];
</script>

{#if example === 'schweregrade'}
  <div class="stack">
    {#each rows as r}
      <div>
        <div class="cap">{r.name}</div>
        <Banner severity={r.severity} title={r.title}>{r.body}</Banner>
      </div>
    {/each}
  </div>
{:else if example === 'aufbau'}
  <div class="stack">
    <div>
      <div class="cap">Symbol, Titel und Text</div>
      <Banner severity="warn" title="Lizenz läuft ab">Julia Krause · 24-Sekunden · gültig bis 30.06.2026.</Banner>
    </div>
    <div>
      <div class="cap">Symbol und Text</div>
      <Banner>Geschätzte Gesamtdauer: 180 Minuten.</Banner>
    </div>
    <div>
      <div class="cap">Titel und Text, ohne Symbol</div>
      <Banner severity="warn" title="Lizenz läuft ab" icon={false}>Julia Krause · 24-Sekunden · gültig bis 30.06.2026.</Banner>
    </div>
    <div>
      <div class="cap">Nur Text, ohne Symbol</div>
      <Banner icon={false}>Geschätzte Gesamtdauer: 180 Minuten.</Banner>
    </div>
  </div>
{:else if example === 'link'}
  <div class="stack">
    <Banner severity="danger" title="Trikotnummer doppelt vergeben">
      #7 ist bei M. Okafor und H. Drake hinterlegt. <a href="#aufstellung">Zur Aufstellung</a>
    </Banner>
    <Banner severity="warn" title="Lizenz läuft ab">
      Julia Krause · gültig bis 30.06.2026. <a href="#erinnerung">Erinnerung setzen</a>
    </Banner>
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
          {#each cols as c}
            <div>
              <Banner severity={r.severity}>
                Text mit <a href="#beispiel" class={c === 'Fokus' ? 'pseudo-focus-visible' : ''}>Link</a>
              </Banner>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-text'}
  <Banner severity="danger" title="Export fehlgeschlagen">Die Verbindung wurde unterbrochen. Prüfe das Netz und versuche es erneut.</Banner>
{:else if example === 'dont-text'}
  <Banner severity="danger">Fehler 500.</Banner>
{:else if example === 'do-schwere'}
  <Banner severity="warn" title="Hallenzeit knapp">Das passt nur mit weniger Runden in die verfügbare Hallenzeit.</Banner>
{:else if example === 'dont-schwere'}
  <Banner severity="danger" title="Hallenzeit knapp">Das passt nur mit weniger Runden in die verfügbare Hallenzeit.</Banner>
{:else if example === 'do-farbe'}
  <Banner severity="warn" title="Lizenz läuft ab">Gültig bis 30.06.2026.</Banner>
{:else if example === 'dont-farbe'}
  <Banner severity="warn" icon={false}>Gültig bis 30.06.2026.</Banner>
{:else if example === 'do-feld'}
  <div class="narrow">
    <TextInput label="Trikotnummer" value="107" state="error" help="Ungültig: Nummern müssen FIBA-konform sein (max. 99)." />
  </div>
{:else if example === 'dont-feld'}
  <!-- Banner statt Feldfehler: das Feld selbst bleibt unmarkiert -->
  <div class="narrow">
    <Banner severity="danger">Die Trikotnummer ist ungültig.</Banner>
    <div class="gap"><TextInput label="Trikotnummer" value="107" /></div>
  </div>
{/if}

<style>
  .stack { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
  .narrow { width: 100%; max-width: 360px; }
  .gap { margin-top: 12px; }
  .cap, .head, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 70px repeat(2, minmax(220px, 1fr)); gap: 14px 24px; align-items: center; }
</style>
