// Karte. Die Beispiele sind gegen die echten Komponenten geprüft (tests/map-code.test.ts): Svelte per Server-Rendering, React per TypeScript-Compiler,
// das Vanilla-Beispiel gegen die Funktionen aus js/map.js, die Kachel-Rezepte als echte Dateien (stories/examples/).
import kachelEndpunkt from './examples/kachel-endpunkt.ts?raw';
import nginxTiles from './examples/nginx-tiles.conf?raw';

export const kachelEndpunktTs = kachelEndpunkt;
export const nginxConf = nginxTiles;

export const vanilla = `<!-- Vanilla: es gibt keine Karten-Komponente ohne Framework. Du nutzt Leaflet direkt, dazu die Klassen dss-map* (Rahmen, Zoom,
     Quellenangabe, Liste) und die reinen Funktionen aus map.js. Leaflet und leaflet.css lädt die Seite selbst (npm install leaflet). -->
<link rel="stylesheet" href="/node_modules/leaflet/dist/leaflet.css" />

<div class="dss-map" data-state="ready" data-dim="true" data-tiles="dim" style="--dss-map-h:320px">
  <div class="dss-map-frame" role="region" aria-label="Karte der Sporthalle Nordhain">
    <div class="dss-map-stage">
      <div class="dss-map-canvas" id="karte" role="group" aria-label="Kartenfläche. Pfeiltasten verschieben, Plus und Minus ändern den Maßstab."></div>
      <p class="dss-map-attr"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap-Mitwirkende</a></p>
    </div>
  </div>
  <div class="dss-map-text" id="karte-text">
    <ol class="dss-map-list" aria-label="Orte auf der Karte">
      <li class="dss-map-item">
        <div class="dss-map-item-body">
          <p class="dss-map-name"><span>Sporthalle Nordhain</span></p>
          <p class="dss-map-coords" id="karte-koordinaten"></p>
          <div class="dss-map-links"><a class="dss-link" id="karte-route" href="#">Route planen</a></div>
        </div>
      </li>
    </ol>
  </div>
</div>

<script type="module">
  import L from 'leaflet';
  import { formatCoords, mapLinks, validTileUrl } from '@bbv/dss-design-system/map.js';

  const halle = { lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain' };
  const kacheln = '/tiles/{z}/{x}/{y}.png'; // eigener Proxy, siehe Datenschutz und Kachelserver
  if (!validTileUrl(kacheln)) throw new Error('Ungültige Kachel-Adresse');

  // Eigene Zoom-Schaltflächen und Quellenangabe: Leaflets Standardsteuerung aus
  const karte = L.map('karte', { zoomControl: false, attributionControl: false, minZoom: 3, maxZoom: 19 }).setView([halle.lat, halle.lng], 15);
  L.tileLayer(kacheln, { className: 'dss-map-tiles', minZoom: 3, maxZoom: 19 }).addTo(karte);
  // Marker als Inline-SVG (L.divIcon): Leaflets Standard-Markerbilder brauchen Bildpfade, die Bundler nicht finden
  const pin = L.divIcon({
    className: 'dss-map-marker', iconSize: [44, 46], iconAnchor: [22, 45],
    html: '<svg class="dss-map-pin" viewBox="0 0 36 46" width="36" height="46" aria-hidden="true" focusable="false">'
      + '<path class="dss-map-pin-edge" d="M18 1.5C9.4 1.5 2.5 8.2 2.5 16.4c0 10.8 15.5 27.6 15.5 27.6s15.5-16.8 15.5-27.6C33.5 8.2 26.6 1.5 18 1.5z"/>'
      + '<path class="dss-map-pin-body" d="M18 1.5C9.4 1.5 2.5 8.2 2.5 16.4c0 10.8 15.5 27.6 15.5 27.6s15.5-16.8 15.5-27.6C33.5 8.2 26.6 1.5 18 1.5z"/>'
      + '<circle class="dss-map-pin-dot" cx="18" cy="16.5" r="5.5"/></svg>',
  });
  L.marker([halle.lat, halle.lng], { icon: pin, title: halle.label, keyboard: true }).addTo(karte);

  document.getElementById('karte-koordinaten').textContent = formatCoords(halle.lat, halle.lng); // '49,3000° N, 7,9000° O'
  document.getElementById('karte-route').href = mapLinks(halle).route;
</script>`;

export const svelte = `<script lang="ts">
  import MapView from '@bbv/dss-design-system/svelte/Map';
  import 'leaflet/dist/leaflet.css';

  const hallen = [
    { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
    { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg', href: '/hallen/seeberg' },
  ];
  // {z}, {x}, {y} stehen in einer Konstante: in einem Svelte-Attribut wären sie Ausdrücke
  const kacheln = '/tiles/{z}/{x}/{y}.png';
</script>

<!-- Standard: Platzhalter mit „Karte laden“, Kacheln erst nach dem Klick (load="click"). Mit eigenem Proxy dürfen sie sofort laden. -->
<MapView
  label="Hallen im Kreis Nordhain"
  markers={hallen}
  tileUrl={kacheln}
  load="auto"
  appLinks={['osm', 'geo', 'route']}
  onload={(map) => console.log('Karte bereit', map)}
  onerror={(grund) => console.warn('Karte nicht geladen:', grund)}
/>

<!-- Ein Marker, feste Mitte, ohne Gesten (Tasten und Zoom-Schaltflächen bleiben) -->
<MapView label="Lage der Sporthalle Nordhain" markers={[hallen[0]]} zoom={16} interactive={false} height={240} showList={false} />`;

export const react = `import { MapView, type MapMarker } from '@bbv/dss-design-system/react';
import 'leaflet/dist/leaflet.css';

const hallen: MapMarker[] = [
  { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
  { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg', href: '/hallen/seeberg' },
];

{/* Standard: Platzhalter mit „Karte laden“, Kacheln erst nach dem Klick (load="click"). Mit eigenem Proxy dürfen sie sofort laden. */}
<MapView
  label="Hallen im Kreis Nordhain"
  markers={hallen}
  tileUrl="/tiles/{z}/{x}/{y}.png"
  load="auto"
  appLinks={['osm', 'geo', 'route']}
  onLoad={(map) => console.log('Karte bereit', map)}
  onError={(grund) => console.warn('Karte nicht geladen:', grund)}
/>

{/* Ein Marker, feste Mitte, ohne Gesten (Tasten und Zoom-Schaltflächen bleiben) */}
<MapView label="Lage der Sporthalle Nordhain" markers={[hallen[0]]} zoom={16} interactive={false} height={240} showList={false} />`;

export const funktionenJs = `import { boundsOf, formatCoords, isCoord, mapLinks, validTileUrl } from '@bbv/dss-design-system/map.js';

formatCoords(49.4875, 8.466); // '49,4875° N, 8,4660° O'
formatCoords(-33.8688, 151.2093); // '33,8688° S, 151,2093° O'
mapLinks({ lat: 49.3, lng: 7.9, label: 'Halle Süd & West' }).geo; // 'geo:49.3,7.9?q=49.3,7.9(Halle%20S%C3%BCd%20%26%20West)'
mapLinks({ lat: 49.3, lng: 7.9 }).route; // 'https://www.openstreetmap.org/directions?route=%3B49.3%2C7.9'
validTileUrl('/tiles/{z}/{x}/{y}.png'); // true
validTileUrl('http://tile.example.org/{z}/{x}/{y}.png'); // false: http nur für localhost
isCoord(91, 0); // false: Breite über 90
boundsOf([{ lat: 49.3, lng: 7.9 }, { lat: 49.31, lng: 7.92 }]); // { sw: [49.3, 7.9], ne: [49.31, 7.92] }`;

export const einbindungVite = `// Vite, SvelteKit, Next.js u. a.: leaflet installieren und das Stylesheet einmal laden. Die Karte lädt Leaflet selbst per import('leaflet')
// als eigenen Chunk, erst beim Laden der Karte. Seiten ohne Karte laden nichts.
//   npm install leaflet
import 'leaflet/dist/leaflet.css'; // Layout, Gesten, Ebenen; die Optik von Zoom, Marker und Quelle liefert components.css`;
