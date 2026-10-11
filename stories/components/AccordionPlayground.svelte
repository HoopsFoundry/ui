<script lang="ts">
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';

  // Spielwiese für die Controls. `count` Bereiche, der erste offen (`firstOpen`), der zweite gesperrt (`lockSecond`).
  let {
    exclusive = false,
    variant = 'card',
    expandAll = false,
    nav = false,
    sticky = false,
    syncHash = false,
    titleAs = undefined,
    count = 4,
    firstOpen = true,
    lockSecond = false,
    meta = 'count',
  }: {
    exclusive?: boolean;
    variant?: 'card' | 'flat';
    expandAll?: boolean;
    nav?: boolean;
    sticky?: boolean;
    syncHash?: boolean;
    titleAs?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | '';
    count?: number;
    firstOpen?: boolean;
    lockSecond?: boolean;
    meta?: 'none' | 'count' | 'chip' | 'live';
  } = $props();

  const TITLES = ['Tabelle', 'Spielplan', 'Kader', 'Statistik', 'Hallen', 'Trainer', 'Presse', 'Archiv'];
  const BODY = [
    'Platz 3 von 12 in der Bayernliga Süd.',
    'Nächstes Spiel: Samstag, 19:30 Uhr in der Nordhain-Halle.',
    'Zehn Spieler, zwei Trainer und zwei Betreuer.',
    'Im Schnitt 82,4 Punkte pro Spiel.',
    'Drei Hallen im Stadtgebiet.',
    'Vier lizenzierte Trainer.',
    'Pressekontakt über die Geschäftsstelle.',
    'Alle Berichte seit 2019.',
  ];
  const n = $derived(Math.max(1, Math.min(8, Math.round(Number(count) || 1))));
</script>

{#snippet zaehler()}4 Einträge{/snippet}
{#snippet chip()}<span class="dss-chip dss-chip--amber dss-chip--mono">Neu</span>{/snippet}
{#snippet live()}<span class="dss-live"><span class="dss-live-dot" aria-hidden="true"></span>Live</span>{/snippet}

<Accordion {exclusive} {variant} {expandAll} {nav} {sticky} {syncHash} titleAs={titleAs || undefined}>
  {#each Array.from({ length: n }, (_, i) => i) as i (i)}
    <AccordionItem
      id={`sw-${i}`}
      title={TITLES[i]}
      open={firstOpen && i === 0}
      disabled={lockSecond && i === 1}
      meta={meta === 'count' ? zaehler : meta === 'chip' ? chip : meta === 'live' ? live : undefined}
    >
      {BODY[i]}
    </AccordionItem>
  {/each}
</Accordion>
