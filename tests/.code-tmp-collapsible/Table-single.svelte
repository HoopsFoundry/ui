<script>
  import Table from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/Table.svelte';
</script>
<Table collapsible open id="boxscore" title="Spieler-Statistiken" meta="Stand · 4. Viertel" density="compact" columns={[{ key: 'name', label: 'Spieler' }, { key: 'pts', label: 'PTS', align: 'right' }]}>
  {#snippet rows()}
    <tr><td>J. Tanner</td><td class="num lead">22</td></tr>
    <tr><td>M. Okafor</td><td class="num lead">19</td></tr>
  {/snippet}
</Table>