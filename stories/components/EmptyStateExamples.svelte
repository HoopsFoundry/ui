<script lang="ts">
  import EmptyState from '../../svelte/EmptyState.svelte';
  import Button from '../../svelte/Button.svelte';
  import PlayerCard from '../../svelte/PlayerCard.svelte';
  import Skeleton from '../../svelte/Skeleton.svelte';

  let { example }: { example: string } = $props();

  const noop = () => {};

  // Erzwingt einen Zustand auf dem Button der Zelle (EmptyState hat keine class-Prop für den CTA)
  function mark(node: HTMLElement, cls: string) {
    const target = node.querySelector<HTMLElement>('.hoops-btn');
    if (cls && target) target.classList.add(...cls.split(' '));
  }

  const tones = [
    { id: 'neutral', variant: 'primary' },
    { id: 'action', variant: 'amber' },
    { id: 'error', variant: 'danger' },
  ] as const;
  const cols = ['Standard', 'Hover', 'Fokus', 'Aktiv'] as const;
  const stateClass: Record<(typeof cols)[number], string> = {
    Standard: '',
    Hover: 'pseudo-hover',
    Fokus: 'pseudo-focus-visible',
    Aktiv: 'pseudo-hover pseudo-active',
  };
</script>

{#if example === 'tonalitaeten'}
  <div class="grid3">
    <EmptyState tone="neutral" title="Noch keine Spiele angesetzt" body="Sobald Spiele für den aktuellen Spieltag eingetragen sind, erscheinen sie hier." cta="Spielplan öffnen" onclick={noop} />
    <EmptyState tone="action" title="Schiri-Lizenz fehlt" body="Für die Freigabe wird die Lizenz des Hauptschiedsrichters benötigt." cta="Lizenz hinzufügen" onclick={noop} />
    <EmptyState tone="error" title="Verbindung fehlgeschlagen" body="Wir konnten die Spielberichte nicht synchronisieren." cta="Erneut versuchen" onclick={noop} />
  </div>
{:else if example === 'aktionen'}
  <div class="grid2">
    <div>
      <div class="cap">cta: ein einfacher Button</div>
      <EmptyState tone="neutral" title="Noch keine Mannschaft" body="Lege die erste Mannschaft an, um Spieler zu erfassen." cta="Mannschaft anlegen" onclick={noop} />
    </div>
    <div>
      <div class="cap">actions und Zusatztext</div>
      <EmptyState tone="neutral" title="Noch keine Mannschaft" body="Lege die erste Mannschaft an oder übernimm eine aus der Vorsaison.">
        {#snippet actions()}
          <Button variant="primary" onclick={noop}>Mannschaft anlegen</Button>
          <Button variant="ghost" onclick={noop}>Aus Vorsaison übernehmen</Button>
        {/snippet}
        Fragen? Die Hilfe erklärt den Ablauf.
      </EmptyState>
    </div>
  </div>
{:else if example === 'liste'}
  <div class="grid2">
    <div>
      <div class="cap">Lädt</div>
      <Skeleton variant="row" count={3} />
    </div>
    <div>
      <div class="cap">Leer</div>
      <EmptyState tone="neutral" title="Noch keine Spieler" body="Sobald Spieler gemeldet sind, erscheinen sie hier." cta="Spieler melden" onclick={noop} />
    </div>
    <div>
      <div class="cap">Fehler</div>
      <EmptyState tone="error" title="Spieler nicht geladen" body="Die Verbindung wurde unterbrochen." cta="Erneut versuchen" onclick={noop} />
    </div>
    <div>
      <div class="cap">Gefüllt</div>
      <div class="list">
        <PlayerCard size="compact" jersey="4" name="J. Tanner" position="PG" team="heim" captain stat={22} statLabel="PTS" />
        <PlayerCard size="compact" jersey="7" name="M. Okafor" position="SG" team="heim" stat={19} statLabel="PTS" />
        <PlayerCard size="compact" jersey="13" name="K. Vogler" position="PF" team="heim" stat={12} statLabel="PTS" />
      </div>
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface" tabindex="0" role="region" aria-label="Zustände des Buttons im Leerzustand, seitlich scrollbar">
      <div class="states">
        <div class="colhead"></div>
        {#each cols as c}<div class="colhead">{c}</div>{/each}
        {#each tones as t}
          <div class="rowlabel">{t.id}</div>
          {#each cols as c}
            <!-- Fläche und Rand der Tonalität wie im EmptyState, nur mit kleinerem Innenabstand -->
            <div class="hoops-empty hoops-empty--{t.id} cell" use:mark={stateClass[c]}>
              <Button variant={t.variant} onclick={noop}>Aktion</Button>
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-schritt'}
  <EmptyState tone="neutral" title="Noch keine Spiele" body="Sobald Spiele eingetragen sind, erscheinen sie hier." cta="Spielplan öffnen" onclick={noop} />
{:else if example === 'dont-schritt'}
  <EmptyState tone="neutral" title="Keine Daten" />
{:else if example === 'do-ton'}
  <EmptyState tone="neutral" title="Noch keine Spiele" body="Sobald Spiele eingetragen sind, erscheinen sie hier." cta="Spielplan öffnen" onclick={noop} />
{:else if example === 'dont-ton'}
  <EmptyState tone="error" title="Noch keine Spiele" body="Sobald Spiele eingetragen sind, erscheinen sie hier." cta="Spielplan öffnen" onclick={noop} />
{:else if example === 'do-aktion'}
  <EmptyState tone="neutral" title="Noch keine Spiele" body="Sobald Spiele eingetragen sind, erscheinen sie hier.">
    {#snippet actions()}
      <Button variant="primary" onclick={noop}>Spielplan öffnen</Button>
      <Button variant="ghost" onclick={noop}>Hilfe</Button>
    {/snippet}
  </EmptyState>
{:else if example === 'dont-aktion'}
  <EmptyState tone="neutral" title="Noch keine Spiele" body="Sobald Spiele eingetragen sind, erscheinen sie hier.">
    {#snippet actions()}
      <Button variant="primary" onclick={noop}>Spielplan öffnen</Button>
      <Button variant="primary" onclick={noop}>Hilfe</Button>
    {/snippet}
  </EmptyState>
{/if}

<style>
  .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr)); gap: 18px; align-items: start; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 24px; align-items: start; }
  .list { display: flex; flex-direction: column; gap: 8px; }
  .cap, .colhead, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 10px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 70px repeat(4, minmax(130px, 1fr)); gap: 14px 16px; align-items: center; }
  .states :global(.cell) { max-width: none; margin: 0; padding: 20px 12px; }
</style>
