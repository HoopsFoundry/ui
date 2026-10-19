<script lang="ts">
  import { initPageNav } from '../../js/pagenav.js';

  // Spielwiese für die Controls: eine Beispielseite mit `sections` Abschnitten; die Optionen gehen an initPageNav.
  // Jede Änderung baut die Navigation neu (zweiter Aufruf ersetzt den ersten).
  let { sections = 5, label = undefined, minHeadings = 3, skipSecond = false, blockWithoutHeading = false, observe = true }:
    { sections?: number; label?: string; minHeadings?: number; skipSecond?: boolean; blockWithoutHeading?: boolean; observe?: boolean } = $props();

  const NAMES = ['Tabelle', 'Spielplan', 'Kader', 'Statistik', 'Hallen', 'Berichte', 'Termine', 'Kontakt'];
  const list = $derived(NAMES.slice(0, Math.max(1, Math.min(NAMES.length, sections))));
  let host = $state<HTMLElement>();

  $effect(() => {
    if (!host) return;
    const handle = initPageNav(host, { selector: 'h3, [data-pagenav]', label, minHeadings, observe, syncHash: false });
    return () => handle.destroy();
  });
</script>

<div class="page" bind:this={host}>
  {#each list as name, i (name)}
    <h3 data-pagenav-skip={skipSecond && i === 1 ? '' : undefined}>{name}</h3>
    <p>Abschnitt {name} mit etwas Text. Ein Klick auf den Eintrag der Navigation springt hierher.</p>
  {/each}
  {#if blockWithoutHeading}<div data-pagenav="Kalender-Abo"><p>Block ohne Überschrift, benannt über data-pagenav.</p></div>{/if}
</div>

<style>
  .page { box-sizing: border-box; max-width: 640px; padding: 14px 18px; background: var(--hoops-surface); border: 1px solid var(--hoops-line); border-radius: var(--hoops-radius-lg); color: var(--hoops-fg); }
  .page :global(h3) { margin: 18px 0 6px; font-size: var(--hoops-fs-h3); line-height: var(--hoops-lh-h3); }
  .page :global(p) { margin: 0 0 8px; font-size: var(--hoops-fs-body-md); color: var(--hoops-fg-soft); }
  .page :global(.hoops-pagenav) { margin: 0 0 14px; }
</style>
