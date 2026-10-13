<script>
  import StatGrid from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/StatGrid.svelte';
  import FormChips from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/FormChips.svelte';

  const stats = [
    { label: 'Siege', value: 12 },
    { label: 'Niederlagen', value: 3 },
    { label: 'Punkte pro Spiel', value: 82.4 },
    { label: 'Rebounds', value: null }, // fehlender Wert: Gedankenstrich mit Text „keine Angabe“
  ];
</script>

<StatGrid items={stats} />
<StatGrid items={stats.slice(0, 3)} compact />

<!-- Höchstens die letzten fünf Einträge, neueste zuletzt -->
<FormChips form={['S', 'S', 'N', 'S', 'U']} />
<FormChips form={['S', 'N', 'U']} variant="letters" />