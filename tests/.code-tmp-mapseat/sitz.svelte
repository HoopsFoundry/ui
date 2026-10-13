<script>
  import MapView from '/Users/oliver-marcuseder/01-vibe-coding/00-Basektball/dss-design-system/.worktrees/vanilla-v1b/svelte/Map.svelte';

  const orte = [
    // kind: 'seat' – der Vereinssitz: Haus-Symbol statt Nummer, ohne Nummer, zählt in der Nummerierung nicht mit
    { id: 'sitz', lat: 49.2962, lng: 7.9105, label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' },
    { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
    { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg' },
  ];
</script>

<!-- darkTiles: im Dunkelmodus die Kacheln abdunkeln ('dim', Standard) oder invertieren und umfärben ('invert'); wirkt nur mit dimInDark -->
<MapView label="Vereinssitz und Hallen" markers={orte} darkTiles="invert" />