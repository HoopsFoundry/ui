<script lang="ts">
  // Testhilfe: eine Seite mit Überschriften, deren Text sich ändern lässt; die Seitennavigation läuft als Aktion darauf.
  import { initPageNav } from '../../js/pagenav.js';
  let names = $state(['A', 'B', 'C']);
  export function setNames(next: string[]) {
    names = next;
  }
  function nav(node: HTMLElement) {
    const handle = initPageNav(node);
    return { destroy: () => handle.destroy() };
  }
</script>

<main use:nav>
  {#each names as name, i (i)}<h2>{name}</h2>{/each}
</main>
