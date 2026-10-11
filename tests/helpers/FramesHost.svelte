<script lang="ts">
  // Testhilfe: einklappbare Rahmen in einer Gruppe mit gebundenem `open` am ersten Rahmen.
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';
  import EmptyState from '../../svelte/EmptyState.svelte';
  import Table from '../../svelte/Table.svelte';
  import ScheduleTable from '../../svelte/ScheduleTable.svelte';
  import ScheduleGrid from '../../svelte/ScheduleGrid.svelte';
  import LeagueCard from '../../svelte/LeagueCard.svelte';

  let { grouped = true, exclusive = false, nav = false, expandAll = false, syncHash = false, level = undefined as any, titleAs = undefined as any } = $props();
  let openT = $state(false);
  const teams = [{ rank: 1, name: 'Hawks', played: 1, points: 2 }] as any[];
  const games = [{ id: 'g1', state: 'scheduled', time: '19:00', heim: { name: 'Team A' }, gast: { name: 'Team B' } }] as any[];
  const raster = [{ id: 'r1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } }] as any[];

  export function get() {
    return { openT };
  }
  export function set(v: boolean) {
    openT = v;
  }
</script>

{#snippet rows()}<tr><td><EmptyState title="leer" /></td></tr>{/snippet}
{#snippet text()}Text{/snippet}

{#snippet frames()}
  <Table collapsible id="t1" title="Eins" bind:open={openT} columns={[{ key: 'a', label: 'A' }]} {rows} />
  <LeagueCard collapsible id="t2" title="Zwei" {teams} />
  <AccordionItem id="t3" title="Drei" children={text} />
  <ScheduleGrid collapsible title="Vier ohne id" games={raster} columns={[{ id: 'h1', label: 'Halle 1' }]} />
  <ScheduleTable collapsible id="t5" title="Fünf" {games} />
{/snippet}

<HeadingLevel {level}>
  {#if grouped}
    <Accordion {exclusive} {nav} {expandAll} {syncHash} {titleAs}>{@render frames()}</Accordion>
  {:else}
    {@render frames()}
  {/if}
</HeadingLevel>
