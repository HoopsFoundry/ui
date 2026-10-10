<script lang="ts">
  // Testhilfe: ein Accordion mit zur Laufzeit änderbaren Werten, gebundenem `open` am ersten Bereich und einer verschachtelten Gruppe.
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';
  import EmptyState from '../../svelte/EmptyState.svelte';

  let exclusive = $state(false);
  let expandAll = $state(false);
  let nav = $state(false);
  let syncHash = $state(false);
  let sticky = $state(false);
  let variant = $state<'card' | 'flat'>('card');
  let titleAs = $state<any>(undefined);
  let itemAs = $state<any>(undefined);
  let level = $state<any>(undefined);
  let lockB = $state(true);
  let extra = $state(0);
  let openA = $state(false);
  let metaOn = $state(true);

  export function set(values: Record<string, unknown>) {
    if ('exclusive' in values) exclusive = values.exclusive as boolean;
    if ('expandAll' in values) expandAll = values.expandAll as boolean;
    if ('nav' in values) nav = values.nav as boolean;
    if ('syncHash' in values) syncHash = values.syncHash as boolean;
    if ('sticky' in values) sticky = values.sticky as boolean;
    if ('variant' in values) variant = values.variant as 'card' | 'flat';
    if ('titleAs' in values) titleAs = values.titleAs;
    if ('itemAs' in values) itemAs = values.itemAs;
    if ('level' in values) level = values.level;
    if ('lockB' in values) lockB = values.lockB as boolean;
    if ('extra' in values) extra = values.extra as number;
    if ('openA' in values) openA = values.openA as boolean;
    if ('metaOn' in values) metaOn = values.metaOn as boolean;
  }
  export function get() {
    return { openA };
  }
</script>

{#snippet counter()}14 Spieler{/snippet}

<HeadingLevel {level}>
  <Accordion {exclusive} {expandAll} {nav} {syncHash} {sticky} {variant} {titleAs}>
    <AccordionItem id="a" title="Tabelle" bind:open={openA} titleAs={itemAs} meta={metaOn ? counter : undefined}>Inhalt A</AccordionItem>
    <AccordionItem id="b" title="Spielplan" disabled={lockB}>Inhalt B</AccordionItem>
    <AccordionItem id="c" title="Kader">
      <EmptyState title="leer" />
      <Accordion {syncHash}>
        <AccordionItem id="c1" title="Heim"><EmptyState title="innen" /></AccordionItem>
        <AccordionItem id="c2" title="Gast">Gast</AccordionItem>
      </Accordion>
    </AccordionItem>
    {#each Array.from({ length: extra }, (_, i) => i) as i (i)}
      <AccordionItem id={`x${i}`} title={`Extra ${i}`}>x</AccordionItem>
    {/each}
  </Accordion>
</HeadingLevel>
