<script lang="ts">
  // Testhilfe: ein einzelner Bereich ohne Accordion-Gruppe.
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  let { open = false }: { open?: boolean } = $props();
</script>

<AccordionItem id="solo" title="Allein" {open}>Text</AccordionItem>
