<script>
  import Accordion from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/Accordion.svelte';
  import Table from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/Table.svelte';

  let open = $state(true);
</script>

<!-- Einzeln: bind:open, id für den Deep-Link (…#boxscore) -->
<Table
  collapsible
  id="boxscore"
  title="Spieler-Statistiken"
  meta="Stand · 4. Viertel"
  bind:open
  density="compact"
  columns={[
    { key: 'name', label: 'Spieler' },
    { key: 'pts', label: 'PTS', align: 'right' },
  ]}
>
  {#snippet rows()}
    <tr><td>J. Tanner</td><td class="num lead">22</td></tr>
    <tr><td>M. Okafor</td><td class="num lead">19</td></tr>
  {/snippet}
</Table>

<!-- In einer Gruppe: Sprungleiste und „Alle öffnen/schließen“ -->
<Accordion nav navLabel="Tabellen der Spielseite" expandAll>
  <Table collapsible id="heim" title="Boxscore Heim" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
    {#snippet rows()}
      <tr><td>J. Tanner</td></tr>
    {/snippet}
  </Table>
  <Table collapsible id="gast" title="Boxscore Gast" density="compact" columns={[{ key: 'name', label: 'Spieler' }]}>
    {#snippet rows()}
      <tr><td>P. Kessel</td></tr>
    {/snippet}
  </Table>
</Accordion>