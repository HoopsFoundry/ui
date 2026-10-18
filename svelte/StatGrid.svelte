<script lang="ts">
  /**
   * HoopsFoundry UI StatGrid (Kennzahlen) · Svelte 5
   * --------------------------------------------------------------
   * Kennzahlen als Gitter von Kacheln (`hoops-stats` mit `hoops-stat`) oder mit `compact` ohne Kacheln in einer Zeile. Das Markup ist eine
   * Beschreibungsliste (`dl`): Beschriftung zuerst („Siege, 12“), optisch steht der Wert darüber. Ein fehlender Wert zeigt einen Gedankenstrich
   * mit verstecktem Text „keine Angabe“. Schriftgrößen aus Tokens. Nutzt nur Klassen aus css/components.css.
   */
  import { statEmptyLabel, statItems } from '../js/stats.js';
  import { useI18n } from './i18n.js';
  import type { CatalogValue } from '../js/i18n/index.js';
  import type { StatInput } from '../js/stats.js';

  let {
    items,
    compact = false,
    texts = undefined,
    class: klass = '',
  }: {
    /** Kennzahlen: `{ label, value }`; Zahlen bekommen das Dezimalkomma. */
    items: StatInput[];
    /** Ohne Kacheln, in einer Zeile (Seitenleiste, Kopf einer Karte). */
    compact?: boolean;
    /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters und `setTexts`. */
    texts?: Record<string, CatalogValue>;
    class?: string;
  } = $props();

  const i18n = useI18n(() => texts);
  const list = $derived(statItems(items, i18n.options));
</script>

{#if list.length}
  <dl class={`hoops-stats${compact ? ' hoops-stats--compact' : ''}${klass ? ` ${klass}` : ''}`} lang={i18n.lang}>
    {#each list as s, i (i)}
      <div class="hoops-stat">
        <dt class="hoops-stat-label">{s.label}</dt>
        <dd class="hoops-stat-value">{#if s.empty}<span aria-hidden="true">{s.value}</span><span class="hoops-sr-only">{statEmptyLabel(i18n.options)}</span>{:else}{s.value}{/if}</dd>
      </div>
    {/each}
  </dl>
{/if}
