<script lang="ts">
  import CourtLines from '../../svelte/CourtLines.svelte';

  let { position = 'absolute' }: { position?: 'fixed' | 'absolute' } = $props();
</script>

<!-- transform macht den Rahmen zum Bezugsrahmen, auch für position="fixed" (sonst füllte es das ganze Fenster) -->
<div style="position: relative; transform: translateZ(0); min-height: 420px; overflow: hidden; border: 1px solid var(--hoops-line); border-radius: 12px; background: var(--hoops-surface);">
  <CourtLines {position} />
  <div style="position: relative; z-index: 1; padding: 32px;">
    <h2 style="margin: 0 0 8px; font-family: var(--hoops-font-display); color: var(--hoops-fg);">Seiteninhalt über den Spielfeldlinien</h2>
    <p style="margin: 0; max-width: 46ch; color: var(--hoops-fg-soft);">Die Linien bleiben dezent, damit auch gedämpfter Text lesbar bleibt. Der Inhalt braucht <code>position: relative; z-index: 1</code>.</p>
  </div>
</div>
