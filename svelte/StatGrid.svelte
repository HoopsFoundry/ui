<script lang="ts">
  /**
   * DSS StatGrid (Kennzahlen) · Svelte 5
   * --------------------------------------------------------------
   * Kennzahlen als Gitter von Kacheln (`dss-stats` mit `dss-stat`) oder mit `compact` ohne Kacheln in einer Zeile. Das Markup ist eine
   * Beschreibungsliste (`dl`): Beschriftung zuerst („Siege, 12“), optisch steht der Wert darüber. Ein fehlender Wert zeigt einen Gedankenstrich
   * mit verstecktem Text „keine Angabe“. Schriftgrößen aus Tokens. Nutzt nur Klassen aus css/components.css.
   */
  import { statEmptyText, statItems } from '../js/stats.js';
  import type { StatInput } from '../js/stats.js';

  let {
    items,
    compact = false,
    class: klass = '',
  }: {
    /** Kennzahlen: `{ label, value }`; Zahlen bekommen das Dezimalkomma. */
    items: StatInput[];
    /** Ohne Kacheln, in einer Zeile (Seitenleiste, Kopf einer Karte). */
    compact?: boolean;
    class?: string;
  } = $props();

  const list = $derived(statItems(items));
</script>

{#if list.length}
  <dl class={`dss-stats${compact ? ' dss-stats--compact' : ''}${klass ? ` ${klass}` : ''}`}>
    {#each list as s, i (i)}
      <div class="dss-stat">
        <dt class="dss-stat-label">{s.label}</dt>
        <dd class="dss-stat-value">{#if s.empty}<span aria-hidden="true">{s.value}</span><span class="dss-sr-only">{statEmptyText}</span>{:else}{s.value}{/if}</dd>
      </div>
    {/each}
  </dl>
{/if}
