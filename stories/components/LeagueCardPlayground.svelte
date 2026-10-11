<script lang="ts">
  import LeagueCard from '../../svelte/LeagueCard.svelte';
  import { demoTable } from './leagueData';

  // Spielwiese für die Controls: alle Props der LeagueCard. `ownRank` und `zones` bauen die Demo-Tabelle um (Nordhain auf diesen Platz, Zonen setzen).
  let { ownRank = 0, zones = false, teams = undefined, ...rest }: { ownRank?: number; zones?: boolean; teams?: any[]; [key: string]: any } = $props();

  const table = $derived.by(() => {
    const base = Array.isArray(teams) && teams.length ? teams : demoTable(0, { links: true });
    return base.map((t) => ({
      ...t,
      ...(ownRank >= 1 ? { own: t.rank === ownRank } : {}),
      ...(zones ? { zone: t.rank === 1 ? 'up' : t.rank === 10 ? 'playoff' : t.rank >= 11 ? 'down' : undefined } : {}),
    }));
  });
</script>

<div style="max-width: 640px;">
  <LeagueCard
    title={rest.title}
    teams={table}
    teamCount={rest.teamCount}
    played={rest.played}
    total={rest.total}
    columns={rest.columns}
    limit={rest.limit}
    href={rest.href || undefined}
    linkLabel={rest.linkLabel || undefined}
    live={rest.live}
    names={rest.names}
    logos={rest.logos}
    size={rest.size}
    titleAs={rest.titleAs}
    collapsible={rest.collapsible}
    open={rest.open}
    id={rest.id || undefined}
  />
</div>
