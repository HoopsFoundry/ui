<script lang="ts">
  import MapView from '../../svelte/Map.svelte';
  import { HALLEN, SITZ, demoTileUrl } from './mapData';

  // Spielwiese für die Controls: alle Props der Karte. `count` und `ownFirst` bauen die Demo-Marker, `tileUrl` "demo" nutzt das lokale Demo-Bild.
  let {
    label = 'Karte der Sporthalle Nordhain',
    count = 1,
    ownFirst = true,
    zoom = undefined,
    height = 320,
    interactive = true,
    load = 'click',
    tileUrl = 'demo',
    attribution = '',
    privacyNote = '',
    appLinks = ['osm', 'route'],
    showList = true,
    dimInDark = true,
    darkTiles = 'dim',
    seat = false,
  }: {
    label?: string;
    count?: number;
    ownFirst?: boolean;
    zoom?: number;
    height?: number;
    interactive?: boolean;
    load?: 'click' | 'auto';
    tileUrl?: string;
    attribution?: string;
    privacyNote?: string;
    appLinks?: ('osm' | 'geo' | 'route')[];
    showList?: boolean;
    dimInDark?: boolean;
    darkTiles?: 'dim' | 'invert';
    seat?: boolean;
  } = $props();

  const markers = $derived([
    ...HALLEN.slice(0, Math.max(1, Math.min(HALLEN.length, count))).map((m, i) => ({ ...m, own: ownFirst && i === 0 })),
    ...(seat ? [SITZ] : []),
  ]);
  // Die Doku erzeugt keinen Netzverkehr zu OpenStreetMap: "demo" lädt das lokale Bild; "osm" oder leer nimmt den Standard der Komponente
  const url = $derived(tileUrl === 'demo' ? demoTileUrl() : tileUrl && tileUrl !== 'osm' ? tileUrl : undefined);
</script>

<div style="max-width: 720px;">
  <MapView
    {label}
    {markers}
    zoom={Number.isFinite(zoom) ? zoom : undefined}
    {height}
    {interactive}
    {load}
    tileUrl={url}
    attribution={attribution || undefined}
    privacyNote={privacyNote || undefined}
    {appLinks}
    {showList}
    {dimInDark}
    {darkTiles}
  />
</div>
