<script lang="ts">
  /**
   * HoopsFoundry UI Skeleton · Svelte 5
   * --------------------------------------------------------------
   * Shimmer-Platzhalter für Ladezustände; Größen entsprechen dem späteren Inhalt.
   * Nutzt nur Klassen aus css/components.css. Die Platzhalter sind dekorativ
   * (aria-hidden), ein einzelner Status-Text (`label`) meldet das Laden.
   *
   *   line   — Textzeile (width passend zur echten Überschrift)
   *   block  — Rechteck (Karten, Bilder)
   *   circle — Avatar / Trikot
   *   row    — fertige Spieler-Zeile
   *   match  — fertige Spielkarte
   */
  let {
    variant = 'line',
    width = 'auto',
    height = 'auto',
    rounded = '6px',
    count = 1,
    label = 'Lädt …',
  }: {
    variant?: 'line' | 'block' | 'circle' | 'row' | 'match';
    width?: string;
    height?: string;
    rounded?: string;
    count?: number;
    label?: string;
  } = $props();
</script>

{#if variant === 'row'}
  {#each Array(count) as _, i (i)}
    <div class="hoops-skel-row" aria-hidden="true">
      <div class="hoops-skel hoops-skel--circle" style="width: 44px; height: 44px;"></div>
      <div class="hoops-skel-who">
        <div class="hoops-skel hoops-skel--line" style="width: 50%; height: 14px;"></div>
        <div class="hoops-skel hoops-skel--line" style="width: 30%; height: 10px; margin-top: 4px;"></div>
      </div>
      <div class="hoops-skel hoops-skel--line" style="width: 60px; height: 18px;"></div>
    </div>
  {/each}
{:else if variant === 'match'}
  <div class="hoops-skel-match" aria-hidden="true">
    <div class="hoops-skel-match-head">
      <div class="hoops-skel hoops-skel--line" style="width: 90px; height: 10px;"></div>
      <div class="hoops-skel hoops-skel--line" style="width: 70px; height: 10px;"></div>
    </div>
    {#each [0, 1] as row (row)}
      <div class="hoops-skel-match-row">
        <div class="hoops-skel hoops-skel--circle" style="width: 12px; height: 12px;"></div>
        <div class="hoops-skel hoops-skel--line" style="flex: 1; height: 18px;"></div>
        <div class="hoops-skel hoops-skel--line" style="width: 36px; height: 22px;"></div>
      </div>
    {/each}
  </div>
{:else}
  {#each Array(count) as _, i (i)}
    <div
      class={`hoops-skel hoops-skel--${variant}`}
      style={`width: ${width}; height: ${height}; border-radius: ${variant === 'circle' ? '50%' : rounded};`}
      aria-hidden="true"
    ></div>
  {/each}
{/if}
{#if label}<span role="status" class="hoops-sr-only">{label}</span>{/if}
