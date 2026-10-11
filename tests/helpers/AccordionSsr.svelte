<script lang="ts">
  // Testhilfe: baut aus einer Beschreibung (JSON) ein Accordion; dieselbe Beschreibung baut die React-Fassung im Test.
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';

  type ItemCfg = { id: string; title: string; open?: boolean; disabled?: boolean; meta?: string; titleAs?: any; body?: string; nested?: GroupCfg };
  type GroupCfg = { props?: Record<string, any>; items: ItemCfg[]; wrap?: { level?: any; by?: number }[] };
  let { cfg }: { cfg: GroupCfg } = $props();
</script>

{#snippet group(g: GroupCfg)}
  <Accordion {...g.props ?? {}}>
    {#each g.items as item (item.id)}
      {#snippet meta()}{item.meta}{/snippet}
      {#snippet body()}{item.body ?? ''}{#if item.nested}{@render group(item.nested)}{/if}{/snippet}
      <AccordionItem id={item.id} title={item.title} open={item.open ?? false} disabled={item.disabled ?? false} titleAs={item.titleAs} meta={item.meta ? meta : undefined} children={body} />
    {/each}
  </Accordion>
{/snippet}

{#snippet wrapped(g: GroupCfg, i: number)}
  {#if i >= (g.wrap?.length ?? 0)}
    {@render group(g)}
  {:else}
    <HeadingLevel level={g.wrap![i].level} by={g.wrap![i].by}>{@render wrapped(g, i + 1)}</HeadingLevel>
  {/if}
{/snippet}
{@render wrapped(cfg, 0)}
