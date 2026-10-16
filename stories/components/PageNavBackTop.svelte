<script lang="ts">
  import { initBackToTop } from '../../js/backtop.js';
  import { initPageNav } from '../../js/pagenav.js';

  // Eigene Story im Rahmen (iframe): der Nach-oben-Knopf ist am Fenster befestigt und gehört nicht auf die Doku-Seite.
  // `bnav`: eine feste BottomNav am unteren Rand; der Knopf sitzt darüber.
  let { bnav = false }: { bnav?: boolean } = $props();

  function setup(node: HTMLElement) {
    const nav = initPageNav(node, { label: bnav ? 'Auf dieser Seite: mit BottomNav' : 'Auf dieser Seite: Nach oben', syncHash: false });
    const top = initBackToTop();
    return { destroy: () => { nav.destroy(); top.destroy(); } };
  }
  const SECTIONS = ['Tabelle', 'Spielplan', 'Kader', 'Statistik', 'Hallen', 'Berichte'];
</script>

<main use:setup class="demo" aria-label={bnav ? 'Beispielseite mit BottomNav' : 'Beispielseite für den Nach-oben-Knopf'}>
  <h1>Verein Nordhain</h1>
  {#each SECTIONS as name (name)}
    <section>
      <h2>{name}</h2>
      {#each [1, 2, 3] as n (n)}<p>{name}: Absatz {n}. Die Seite ist lang genug, damit der Nach-oben-Knopf erscheint, sobald man ein Stück gescrollt hat.</p>{/each}
    </section>
  {/each}
</main>
{#if bnav}
  <nav class="hoops-bnav bar" aria-label="Hauptnavigation des Beispiels">
    <a class="hoops-bnav-item" href="#start"><span class="hoops-bnav-lbl">Start</span></a>
    <a class="hoops-bnav-item" href="#spiele"><span class="hoops-bnav-lbl">Spiele</span></a>
    <a class="hoops-bnav-item" href="#tabelle"><span class="hoops-bnav-lbl">Tabelle</span></a>
  </nav>
{/if}

<style>
  .demo { padding: 16px 16px 96px; color: var(--hoops-page-fg); font-family: var(--hoops-font-body); }
  .demo h1 { margin: 0 0 8px; font-size: var(--hoops-fs-h2); }
  .demo h2 { margin: 24px 0 6px; font-size: var(--hoops-fs-h3); }
  .demo p { margin: 0 0 8px; font-size: var(--hoops-fs-body-md); color: var(--hoops-fg-soft); }
  .bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; }
</style>
