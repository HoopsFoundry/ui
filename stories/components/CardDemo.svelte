<script>
  import Card from '../../svelte/Card.svelte';

  let {
    view = 'single',
    variant = 'default',
    padding = 'md',
  } = $props();
</script>

<div style="padding: 24px;">
  {#if view === 'single'}
    <div style="max-width: 360px;">
      <Card {variant} {padding}>
        <h4 style="margin:0 0 6px;font-family:var(--hoops-font-display);">{variant.charAt(0).toUpperCase() + variant.slice(1)}</h4>
        <p style="margin:0;color:var(--hoops-n-700);font-size:14px;">
          {#if variant === 'default'}1&nbsp;px Border, Radius&nbsp;lg, Surface-0. Standard für Detail-Frames und Listen-Items.
          {:else if variant === 'elevated'}Shadow-md, keine Border. Für schwebende Listen-Items und Live-Tiles.
          {:else if variant === 'flat'}Surface-2, keine Border, kein Schatten. Für hohe Dichte ohne visuelles Rauschen.
          {:else}Cursor wird Pointer, Border zieht auf Ink-300 an, leichter Lift &amp; Schatten.
          {/if}
        </p>
      </Card>
    </div>
  {:else if view === 'headerFooter'}
    <div style="max-width: 380px;">
      <Card {variant} {padding}>
        {#snippet header()}
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:8px;border-bottom:1px solid var(--hoops-page-line);">
            <span>Roster · TSV Nordhain</span>
            <span style="font-family:var(--hoops-font-mono);font-size:11px;color:var(--hoops-page-mute);">12 Spieler</span>
          </div>
        {/snippet}
        <ul style="margin:0;padding:0;list-style:none;font-size:14px;line-height:2;color:var(--hoops-fg-soft);">
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
  {:else}
    <div class="grid">
      <Card variant="default">
        <h4 style="margin:0 0 6px;font-family:var(--hoops-font-display);">Default</h4>
        <p style="margin:0;color:var(--hoops-n-700);font-size:13px;">Border · Surface-0</p>
      </Card>
      <Card variant="elevated">
        <h4 style="margin:0 0 6px;font-family:var(--hoops-font-display);">Elevated</h4>
        <p style="margin:0;color:var(--hoops-n-700);font-size:13px;">Shadow-md · borderless</p>
      </Card>
      <Card variant="flat">
        <h4 style="margin:0 0 6px;font-family:var(--hoops-font-display);">Flat</h4>
        <p style="margin:0;color:var(--hoops-n-700);font-size:13px;">Surface-2 · plain</p>
      </Card>
      <Card variant="hoverable">
        <h4 style="margin:0 0 6px;font-family:var(--hoops-font-display);">Hoverable</h4>
        <p style="margin:0;color:var(--hoops-n-700);font-size:13px;">Klick / Lift / Glow</p>
      </Card>
    </div>
  {/if}
</div>

<style>
  .grid { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 16px; max-width: 720px; }
</style>
