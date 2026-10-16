<script lang="ts">
  import CourtLines from '../../svelte/CourtLines.svelte';

  let { example }: { example: string } = $props();
</script>

<!-- transform macht jeden Rahmen zum Bezugsrahmen, auch für position="fixed" -->
{#if example === 'do-inhalt' || example === 'dont-inhalt'}
  <!-- Deckkraft für beide Spalten angehoben (lokales CSS), damit der Unterschied auch im Dunkelmodus sichtbar ist -->
  <div class="frame" style="--hoops-court-opacity: 0.45;">
    <CourtLines position="absolute" />
    <!-- Falsch ist nur das fehlende position/z-index am Inhalt: das positionierte Linienfeld malt dann über dem Text -->
    <p class="text" class:above={example === 'do-inhalt'}>Heimspiel gegen Lindenberg Hawks, Samstag 17:30 Uhr in der Halle am Park.</p>
  </div>
{:else if example === 'do-dezent' || example === 'dont-dezent'}
  <!-- Falsch: Deckkraft des Tokens hochgesetzt (lokales CSS), die Linien liegen kräftig unter dem Text -->
  <div class="frame" style={example === 'dont-dezent' ? '--hoops-court-opacity: 1;' : ''}>
    <CourtLines position="absolute" />
    <p class="text above">Heimspiel gegen Lindenberg Hawks, Samstag 17:30 Uhr in der Halle am Park.</p>
  </div>
{:else if example === 'do-rahmen' || example === 'dont-rahmen'}
  <!-- Falsch: der Rahmen ist nicht positioniert, die Linien füllen den nächsten positionierten Vorfahren (hier der gestrichelte Außenrahmen) -->
  <div class="outer" style="--hoops-court-opacity: 0.45;">
    <div class="frame" class:plain={example === 'dont-rahmen'}>
      <CourtLines position="absolute" />
      <p class="text above">Die Linien gehören in diese Karte.</p>
    </div>
  </div>
{/if}

<style>
  .frame {
    position: relative; transform: translateZ(0);
    width: 100%; box-sizing: border-box; min-height: 160px; overflow: hidden;
    border: 1px solid var(--hoops-line); border-radius: 12px; background: var(--hoops-surface);
    padding: 24px;
  }
  .outer { position: relative; transform: translateZ(0); overflow: hidden; width: 100%; box-sizing: border-box; padding: 16px; border: 1px dashed var(--hoops-page-line); border-radius: 12px; }
  .frame.plain { position: static; transform: none; }
  /* Nur für die Vorschau: Maske verkleinert, damit in der kleinen Bühne mehrere Linien sichtbar sind (Standard: bis 1500 px breit) */
  .frame :global(.dss-courtlines), .outer :global(.dss-courtlines) {
    -webkit-mask-size: 560px auto; mask-size: 560px auto;
    -webkit-mask-position: center 30%; mask-position: center 30%;
  }
  .text { margin: 0; max-width: 40ch; color: var(--hoops-fg-soft); font-size: var(--hoops-fs-body); }
  .text.above { position: relative; z-index: 1; }
</style>
