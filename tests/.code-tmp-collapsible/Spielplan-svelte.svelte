<script>
  import Accordion from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/Accordion.svelte';
  import ScheduleGrid from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/ScheduleGrid.svelte';
  import ScheduleTable from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/ScheduleTable.svelte';

  const games = [
    { id: 'v1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } },
  ];
  const columns = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];
  const rasterGames = [
    { id: 'g1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } },
  ];
  let open = $state(true);
</script>

<!-- Einzeln: bind:open, id für den Deep-Link (…#spielplan) -->
<ScheduleTable collapsible id="spielplan" bind:open title="Spielplan" meta="Saison 2026/27" {games} caption="Heimspiele" />

<!-- In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“; auch das Zeitraster lässt sich einklappen -->
<Accordion nav navLabel="Bereiche des Spieltags" expandAll>
  <ScheduleTable collapsible id="heimspiele" title="Heimspiele" {games} caption="Heimspiele des Spieltags" />
  <ScheduleGrid collapsible id="hallen" title="Hallenbelegung" games={rasterGames} {columns} caption="Hallenbelegung am Samstag" />
</Accordion>