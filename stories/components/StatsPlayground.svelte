<script lang="ts">
  import StatGrid from '../../svelte/StatGrid.svelte';
  import FormChips from '../../svelte/FormChips.svelte';

  // Spielwiese für die Controls: erfundene Kennzahlen; `count` zeigt die ersten Einträge, `missing` macht den letzten Wert leer.
  let { count = 4, compact = false, missing = false, variant = 'dots', formLength = 5 }: { count?: number; compact?: boolean; missing?: boolean; variant?: 'dots' | 'letters'; formLength?: number } = $props();

  const ALL = [
    { label: 'Siege', value: 12 },
    { label: 'Niederlagen', value: 3 },
    { label: 'Punkte pro Spiel', value: 82.4 },
    { label: 'Rebounds', value: 41.3 },
    { label: 'Assists', value: 18.7 },
    { label: 'Ballgewinne', value: 9.2 },
  ];
  const FORM = ['S', 'S', 'N', 'S', 'U', 'S', 'N'] as const;
  const items = $derived(ALL.slice(0, Math.max(1, Math.min(ALL.length, count))).map((s, i, list) => (missing && i === list.length - 1 ? { ...s, value: null } : s)));
  const form = $derived([...FORM].slice(-Math.max(0, formLength)));
</script>

<div style="display: grid; gap: 20px; max-width: 760px;">
  <StatGrid {items} {compact} />
  <p style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: var(--hoops-fs-body-sm); color: var(--hoops-page-fg, inherit);">
    Letzte Spiele <FormChips {form} {variant} />
  </p>
</div>
