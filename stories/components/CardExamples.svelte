<script lang="ts">
  import Card from '../../svelte/Card.svelte';
  import Button from '../../svelte/Button.svelte';

  let { example }: { example: string } = $props();

  const noop = () => {};
  // Links in den Beispielen springen nicht
  const stay = (e: MouseEvent) => e.preventDefault();

  const variants = [
    { id: 'default', name: 'Default', text: '1 px Rand, Radius lg, Fläche 0. Standard für Detail-Rahmen und Listeneinträge.' },
    { id: 'elevated', name: 'Elevated', text: 'Schatten md, kein Rand. Für schwebende Listeneinträge und Live-Kacheln.' },
    { id: 'flat', name: 'Flat', text: 'Fläche 2, kein Rand, kein Schatten. Für hohe Dichte ohne visuelles Rauschen.' },
    { id: 'hoverable', name: 'Hoverable', text: 'Zeiger, Rand wird kräftiger, leichter Lift und Schatten. Nur für klickbare Karten.' },
  ] as const;

  const sizes = ['sm', 'md', 'lg'] as const;

  const rows = [
    { id: 'hoverable', name: 'hoverable' },
    { id: 'default', name: 'default' },
    { id: 'elevated', name: 'elevated' },
    { id: 'flat', name: 'flat' },
  ] as const;
  const cols = ['Standard', 'Hover', 'Fokus', 'Aktiv'] as const;
  const stateClass: Record<(typeof cols)[number], string> = {
    Standard: '',
    Hover: 'pseudo-hover',
    // Der Lift bei Fokus kommt von :focus-within, der Ring von :focus-visible
    Fokus: 'pseudo-focus-visible pseudo-focus-within',
    Aktiv: 'pseudo-hover pseudo-active',
  };
</script>

{#if example === 'varianten'}
  <div class="grid4">
    {#each variants as v}
      <Card variant={v.id} onclick={v.id === 'hoverable' ? noop : undefined}>
        <p class="t">{v.name}</p>
        <p class="m">{v.text}</p>
      </Card>
    {/each}
  </div>
{:else if example === 'kopf-fuss'}
  <div class="narrow">
    <Card>
      {#snippet header()}
        <div class="head">
          <span>Roster · TSV Nordhain</span>
          <span class="mono">12 Spieler</span>
        </div>
      {/snippet}
      <ul class="list">
        <li>4 · Sandro Mauer</li>
        <li>7 · Lukas König</li>
        <li>14 · Daniel Reiß (C)</li>
        <li>23 · Max Bauer</li>
        <li>33 · Tom Lindner</li>
      </ul>
      {#snippet footer()}
        <span>Stand · 17. Spieltag</span>
        <span>BBL · Bayernliga Süd</span>
      {/snippet}
    </Card>
  </div>
{:else if example === 'abstand'}
  <div class="grid3">
    {#each sizes as p}
      <Card padding={p}>
        <p class="t">padding="{p}"</p>
        <p class="m">{p === 'sm' ? '12 px oben und unten, 14 px seitlich' : p === 'md' ? '18 px oben und unten, 20 px seitlich' : '24 px oben und unten, 28 px seitlich'}</p>
      </Card>
    {/each}
  </div>
{:else if example === 'klickbar'}
  <div class="grid3">
    <div>
      <div class="cap">Link: href</div>
      <Card variant="hoverable" href="#spiel" onclick={stay}>
        <p class="t">17. Spieltag</p>
        <p class="m">TSV Nordhain gegen Lindenberg Hawks</p>
      </Card>
    </div>
    <div>
      <div class="cap">Aktion: onclick</div>
      <Card variant="hoverable" onclick={noop}>
        <p class="t">Neues Spiel</p>
        <p class="m">Div mit role="button" und tabindex 0</p>
      </Card>
    </div>
    <div>
      <div class="cap">Nicht klickbar: as="article"</div>
      <Card as="article">
        <p class="t">Spielbericht</p>
        <p class="m">Reiner Inhalt, kein Ziel</p>
      </Card>
    </div>
  </div>
{:else if example === 'zustaende'}
  <!-- data-fixed-states: die Werkzeugleiste "Zustand" lässt diese Matrix in Ruhe -->
  <div class="matrix" data-fixed-states>
    <div class="surface" tabindex="0" role="region" aria-label="Zustände der Karte, seitlich scrollbar">
      <div class="states">
        <div class="colhead"></div>
        {#each cols as c}<div class="colhead">{c}</div>{/each}
        {#each rows as r}
          <div class="rowlabel">{r.name}</div>
          {#each cols as c}
            <div class="cell">
              {#if r.id === 'hoverable'}
                <Card variant="hoverable" padding="sm" onclick={noop} class={stateClass[c]}>
                  <p class="t">Spielbericht</p>
                </Card>
              {:else}
                <Card variant={r.id} padding="sm" href="#bericht" onclick={stay} class={stateClass[c]}>
                  <p class="t">Spielbericht</p>
                </Card>
              {/if}
            </div>
          {/each}
        {/each}
      </div>
    </div>
  </div>

<!-- Dos und Don'ts -->
{:else if example === 'do-klick'}
  <div class="narrow">
    <Card variant="hoverable" href="#spiel" onclick={stay}>
      <p class="t">17. Spieltag</p>
      <p class="m">TSV Nordhain gegen Lindenberg Hawks. Die ganze Karte öffnet das Spiel.</p>
    </Card>
  </div>
{:else if example === 'dont-klick'}
  <!-- Hoverable mit eigenen Buttons: zwei Ziele in einer Karte -->
  <div class="narrow">
    <Card variant="hoverable">
      <p class="t">17. Spieltag</p>
      <p class="m">TSV Nordhain gegen Lindenberg Hawks</p>
      <div class="actions">
        <Button size="sm" variant="secondary">Öffnen</Button>
        <Button size="sm" variant="ghost">Löschen</Button>
      </div>
    </Card>
  </div>
{:else if example === 'do-ziel'}
  <div class="narrow">
    <Card variant="hoverable" href="#team" onclick={stay}>
      <p class="t">TSV Nordhain</p>
      <p class="m">Zur Mannschaftsseite</p>
    </Card>
  </div>
{:else if example === 'dont-ziel'}
  <!-- Hoverable ohne Ziel: hier mit erzwungenem Hover, so hebt sich die Karte beim Überfahren -->
  <div class="narrow">
    <Card variant="hoverable" class="pseudo-hover">
      <p class="t">TSV Nordhain</p>
      <p class="m">Reine Information, aber mit Zeiger und Lift</p>
    </Card>
  </div>
{:else if example === 'do-hoehe'}
  <div class="pair">
    <Card as="article">
      <p class="t">Kurz</p>
      <p class="m">Eine Zeile.</p>
      {#snippet footer()}<span>17. Spieltag</span>{/snippet}
    </Card>
    <Card as="article">
      <p class="t">Länger</p>
      <p class="m">Mehr Text in dieser Karte, der über mehrere Zeilen läuft und sie höher macht.</p>
      {#snippet footer()}<span>16. Spieltag</span>{/snippet}
    </Card>
  </div>
{:else if example === 'dont-hoehe'}
  <!-- align-items: start hebt das Strecken auf: die Karten sind verschieden hoch und die Füße stehen nicht auf einer Linie -->
  <div class="pair pair--start">
    <Card as="article">
      <p class="t">Kurz</p>
      <p class="m">Eine Zeile.</p>
      {#snippet footer()}<span>17. Spieltag</span>{/snippet}
    </Card>
    <Card as="article">
      <p class="t">Länger</p>
      <p class="m">Mehr Text in dieser Karte, der über mehrere Zeilen läuft und sie höher macht.</p>
      {#snippet footer()}<span>16. Spieltag</span>{/snippet}
    </Card>
  </div>
{:else if example === 'do-flat'}
  <div class="narrow">
    <Card variant="flat">
      <p class="t">Notiz</p>
      <p class="m">Flat auf der Seitenfläche: die Karte hebt sich ab.</p>
    </Card>
  </div>
{:else if example === 'dont-flat'}
  <div class="narrow">
    <div class="panel">
      <Card variant="flat">
        <p class="t">Notiz</p>
        <p class="m">Flat auf Fläche 2: gleiche Farbe, kein Rand, kein Schatten, die Karte verschwindet.</p>
      </Card>
    </div>
  </div>
{/if}

<style>
  .grid4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 16px; }
  .grid3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 16px; }
  .narrow { width: 100%; max-width: 380px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; }
  .pair--start { align-items: start; }
  .panel { background: var(--hoops-surface-2); padding: 14px; border-radius: var(--hoops-radius-lg); }
  .t { margin: 0 0 6px; font-family: var(--hoops-font-display); font-weight: 600; color: var(--hoops-fg); }
  .m { margin: 0; font-size: var(--hoops-fs-body-sm); color: var(--hoops-fg-soft); }
  .head { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--hoops-page-line); }
  .mono { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); color: var(--hoops-page-mute); }
  .list { margin: 0; padding: 0; list-style: none; font-size: var(--hoops-fs-body-md); line-height: 2; color: var(--hoops-fg-soft); }
  .actions { display: flex; gap: 8px; margin-top: 12px; }
  .cap, .rowlabel { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cap { margin-bottom: 8px; }
  .matrix { display: flex; flex-direction: column; gap: 16px; }
  .surface { background: var(--hoops-page-bg); border: 1px solid var(--hoops-page-line); border-radius: var(--hoops-radius-lg); padding: 22px 24px; overflow-x: auto; }
  .states { display: grid; grid-template-columns: 80px repeat(4, minmax(150px, 1fr)); gap: 16px 20px; align-items: center; }
  .colhead { font-family: var(--hoops-font-mono); font-size: var(--hoops-fs-caption); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hoops-page-mute); }
  .cell { padding: 6px; }
</style>
