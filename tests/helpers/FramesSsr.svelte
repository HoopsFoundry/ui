<script lang="ts">
  // Testhilfe: baut aus einer Beschreibung (JSON) einklappbare Rahmen, einzeln oder in einer Accordion-Gruppe; dieselbe Beschreibung baut die React-Fassung im Test.
  import Accordion from '../../svelte/Accordion.svelte';
  import AccordionItem from '../../svelte/AccordionItem.svelte';
  import HeadingLevel from '../../svelte/HeadingLevel.svelte';
  import Table from '../../svelte/Table.svelte';
  import ScheduleTable from '../../svelte/ScheduleTable.svelte';
  import ScheduleGrid from '../../svelte/ScheduleGrid.svelte';
  import LeagueCard from '../../svelte/LeagueCard.svelte';

  type Comp = 'Table' | 'ScheduleTable' | 'ScheduleGrid' | 'LeagueCard';
  type Cfg = { comp: Comp; props?: Record<string, any>; open?: boolean; inItem?: { id: string; title: string; open?: boolean } };
  type Root = { group?: Record<string, any>; items: Cfg[]; wrap?: { level?: any; by?: number }[] };
  let { cfg }: { cfg: Root } = $props();

  const games = [
    { id: 'g1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } },
    { id: 'g2', state: 'scheduled', time: '20:30', heim: { name: 'Team C' }, gast: { name: 'Team D' } },
  ] as any[];
  const columns = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];
  const rasterGames = [{ id: 'r1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } }] as any[];
  const teams = [
    { rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20, zone: 'up' },
    { rank: 2, name: 'BG Seeberg', played: 11, points: 18, own: true },
    { rank: 3, name: 'TSV Elbach', played: 11, points: 14 },
  ] as any[];
  const tableColumns = [{ key: 'name', label: 'Spieler' }, { key: 'pts', label: 'PTS', align: 'right' as const }];
</script>

{#snippet rows()}<tr><td>J. Tanner</td><td class="num">22</td></tr>{/snippet}

{#snippet frame(c: Cfg)}
  {#if c.comp === 'Table'}
    <Table collapsible {...c.props} open={c.open ?? false} columns={tableColumns} {rows} />
  {:else if c.comp === 'ScheduleTable'}
    <ScheduleTable collapsible {...c.props} open={c.open ?? false} {games} />
  {:else if c.comp === 'ScheduleGrid'}
    <ScheduleGrid collapsible {...c.props} open={c.open ?? false} games={rasterGames} {columns} />
  {:else}
    <LeagueCard collapsible {...c.props} open={c.open ?? false} {teams} />
  {/if}
{/snippet}

{#snippet entry(c: Cfg)}
  {#if c.inItem}
    {#snippet body()}{@render frame(c)}{/snippet}
    <AccordionItem id={c.inItem.id} title={c.inItem.title} open={c.inItem.open ?? false} children={body} />
  {:else}
    {@render frame(c)}
  {/if}
{/snippet}

{#snippet content()}
  {#if cfg.group}
    <Accordion {...cfg.group}>
      {#each cfg.items as c, i (i)}{@render entry(c)}{/each}
    </Accordion>
  {:else}
    {#each cfg.items as c, i (i)}{@render entry(c)}{/each}
  {/if}
{/snippet}

{#snippet wrapped(i: number)}
  {#if i >= (cfg.wrap?.length ?? 0)}
    {@render content()}
  {:else}
    <HeadingLevel level={cfg.wrap![i].level} by={cfg.wrap![i].by}>{@render wrapped(i + 1)}</HeadingLevel>
  {/if}
{/snippet}
{@render wrapped(0)}
