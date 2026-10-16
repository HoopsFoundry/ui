<script lang="ts">
  /**
   * HoopsFoundry UI CourtLines · Svelte 5
   * --------------------------------------------------------------
   * Dezente Spielfeldlinien (FIBA 28 × 15 m) als Seitenhintergrund, rein dekorativ.
   * Nutzt nur Klassen aus css/components.css (SVG-Maske aus css/courtlines/).
   * Seiteninhalt braucht `position: relative; z-index: 1`.
   *
   *   position="fixed"    — füllt den Viewport (Standard)
   *   position="absolute" — füllt den nächsten positionierten Container
   */
  let { position = 'fixed' }: { position?: 'fixed' | 'absolute' } = $props();
</script>

<div class="hoops-courtbg" class:hoops-courtbg--absolute={position === 'absolute'} aria-hidden="true">
  <div class="hoops-courtlines"></div>
</div>
