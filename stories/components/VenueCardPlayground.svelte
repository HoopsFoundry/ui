<script lang="ts">
  import VenueCard from '../../svelte/VenueCard.svelte';
  import { demoTileUrl } from './mapData';
  import { demoGames } from './venueData';

  // Spielwiese für die Controls: alle Props der VenueCard. `tileUrl` "demo" lädt das lokale Bild (kein Netzverkehr zu OpenStreetMap),
  // `gameCount` baut die Demo-Spiele (Demo-Logos für vier Vereine), `games` überschreibt sie.
  let {
    gameCount = 4,
    games = undefined,
    tileUrl = 'demo',
    ...rest
  }: { gameCount?: number; games?: any[]; tileUrl?: string; [key: string]: any } = $props();

  const rows = $derived(Array.isArray(games) && games.length ? games : demoGames({ logos: true }).slice(0, Math.max(0, Math.min(4, gameCount))));
  const url = $derived(tileUrl === 'demo' ? demoTileUrl() : tileUrl && tileUrl !== 'osm' ? tileUrl : undefined);
</script>

<div style="max-width: 860px;">
  <VenueCard
    name={rest.name}
    address={rest.address}
    lat={Number.isFinite(rest.lat) ? rest.lat : undefined}
    lng={Number.isFinite(rest.lng) ? rest.lng : undefined}
    info={rest.info}
    contact={rest.contact}
    games={rows}
    limit={Number.isFinite(rest.limit) ? rest.limit : undefined}
    gamesLabel={rest.gamesLabel || undefined}
    href={rest.href || undefined}
    linkLabel={rest.linkLabel || undefined}
    names={rest.names}
    logos={rest.logos}
    size={rest.size}
    titleAs={rest.titleAs}
    load={rest.load}
    tileUrl={url}
    privacyNote={rest.privacyNote || undefined}
    mapHeight={Number.isFinite(rest.mapHeight) ? rest.mapHeight : undefined}
  />
</div>
