<script lang="ts">
  // Testhilfe: einzelner einklappbarer Rahmen im Bereich eines AccordionItem, in einer exklusiven Gruppe.
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import Table from '../../svelte/Table.svelte';
</script>

{#snippet rows()}<tr><td>x</td></tr>{/snippet}
{#snippet inner()}
  <Table collapsible id="k" title="Kind" columns={[{ key: 'a', label: 'A' }]} {rows} />
{/snippet}
{#snippet other()}Text{/snippet}

<Accordion exclusive syncHash={false}>
  <AccordionItem id="p" title="Eltern" open children={inner} />
  <AccordionItem id="q" title="Anderer" children={other} />
</Accordion>
