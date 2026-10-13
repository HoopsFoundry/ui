// Karte. Die Beispiele sind gegen die echten Komponenten geprüft (tests/map-code.test.ts): Svelte per Server-Rendering, React per TypeScript-Compiler,
// das Vanilla-Beispiel gegen die Funktionen aus js/map.js, die Kachel-Rezepte als echte Dateien (stories/examples/).
import kachelEndpunkt from './examples/kachel-endpunkt.ts?raw';
import nginxTiles from './examples/nginx-tiles.conf?raw';
import ohneBuildHtml from './examples/karte-ohne-build/index.html?raw';

export const kachelEndpunktTs = kachelEndpunkt;
export const nginxConf = nginxTiles;
export const ohneBuildSeite = ohneBuildHtml;

export const vanilla = `<!-- Vanilla: mountMap setzt das Markup der Karte in einen Behälter und startet das Verhalten (Zwei-Klick-Platzhalter, Zoom, Marker, Fehler).
     Leaflet und leaflet.css liefert deine Seite lokal aus (Abschnitt „Ohne Build einbinden“), nicht von unpkg. -->
<link rel="stylesheet" href="/dss/dss.css" />
<link rel="stylesheet" href="/vendor/leaflet/leaflet.css" />

<div id="karte"></div>

<script type="module">
  import { mountMap } from '/dss/dss-map.min.js';

  // dieselben Eigenschaften wie bei MapView (React) und Map (Svelte); ein Marker ohne href ist kein Link
  const halle = { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true };
  const props = {
    label: 'Karte der Sporthalle Nordhain',   // Pflicht: der Name der Region, je Karte verschieden
    markers: [halle],
    tileUrl: '/tiles/{z}/{x}/{y}.png',        // eigener Kachel-Proxy oder Kachelserver (Datenschutz und Kachelserver)
  };

  const karte = mountMap(document.querySelector('#karte'), props, {
    loadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js'),   // erst nach „Karte laden“: vorher kein Netzverkehr
    onError: (grund) => console.warn('Karte nicht geladen:', grund),   // tile-url, import, init, update oder tiles
  });

  // Später: Marker, Mitte, Zoom und Kachel-Adresse ändern (die Karte wird nicht neu gebaut; gleiche id, gleicher Marker)
  karte.update({ ...props, markers: [halle, { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg' }] });
  // karte.destroy();   // räumt Karte, Listener und Beobachter ab und stellt den Behälter wieder her

  // Als Zeichenkette (Server, Crawler): renderMap(props) liefert dasselbe Markup; initMap(el, props) macht vorhandenes Markup lebendig
</script>`;

export const leafletDirekt = `<!-- Leaflet direkt, ohne mountMap: die Klassen dss-map* (Rahmen, Zoom, Quellenangabe, Liste) und die reinen Funktionen aus map.js. Das ist der
     Weg, wenn du die Karte ganz selbst steuern willst; die Zwei-Klick-Lösung, die Zustände und die Fehlerfälle von mountMap hast du dann nicht.
     Leaflet und leaflet.css lädt die Seite selbst (npm install leaflet). -->
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


export const initMapBeispiel = `<!-- Markup vom Server (oder aus renderMap): initMap macht es lebendig. Die Eigenschaften sind dieselben wie bei renderMap;
     ohne markers weiß die Karte nicht, wo sie hinsoll. -->
<div id="karte">${'$'}{renderMap(props)}</div>

<script type="module">
  import { initMap } from '/dss/dss-map.min.js';

  const karte = initMap(document.querySelector('#karte'), {
    label: 'Karte der Sporthalle Nordhain',
    markers: [{ id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true }],
    tileUrl: '/tiles/{z}/{x}/{y}.png',
    loadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js'),
  });
  // karte.update(neueEigenschaften);  karte.destroy();   // destroy stellt das Markup vom Anfang wieder her
</script>`;

export const initAllKarte = `<!-- Ohne eigenes Skript je Karte: data-dss="map" und die Eigenschaften als JSON. Ein leerer Behälter wird zur Karte (mountMap),
     vorhandenes Markup von renderMap oder renderVenueCard(props, { init: true }) wird lebendig (initMap). -->
<div data-dss="map" data-dss-options='{"label":"Karte der Sporthalle Nordhain","markers":[{"id":"nordhain","lat":49.3,"lng":7.9,"label":"Sporthalle Nordhain"}],"tileUrl":"/tiles/{z}/{x}/{y}.png"}'></div>

<script type="module">
  import { initAll } from '/dss/dss.min.js';
  import { initMapBlock } from '/dss/dss-map.min.js';

  // Die Karte gehört nicht zum Kern: initAll startet sie über start (initMapBlock aus dem Karten-Bündel). Gemeinsame Optionen
  // (loadLeaflet, tileUrl …) stehen daneben und gelten für jede Karte; data-dss-options überschreibt sie je Element.
  initAll(document, {
    map: { start: initMapBlock, loadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js') },
  });
</script>`;

export const importmapVariante = `<!-- Variante 1: eine importmap. Das Karten-Bündel lädt Leaflet per import('leaflet'); der Browser löst den Namen über die Karte auf.
     Die importmap muss vor dem ersten Modul stehen. -->
<script type="importmap">
  { "imports": { "leaflet": "/vendor/leaflet/leaflet-src.esm.js" } }
</script>
<script type="module">
  import { mountMap } from '/dss/dss-map.min.js';
  mountMap(document.querySelector('#karte'), { label: 'Karte der Sporthalle Nordhain', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain' }], tileUrl: '/tiles/{z}/{x}/{y}.png' });
</script>`;

export const globalVariante = `<!-- Variante 3: das klassische leaflet.js (UMD, setzt window.L), erst nach dem Klick als Skript nachgeladen -->
<script type="module">
  import { mountMap } from '/dss/dss-map.min.js';

  const loadLeaflet = () => window.L
    ? Promise.resolve(window.L)
    : new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/vendor/leaflet/leaflet.js';
        script.onload = () => resolve(window.L);
        script.onerror = () => reject(new Error('leaflet.js nicht geladen'));
        document.head.append(script);
      });

  mountMap(document.querySelector('#karte'), { label: 'Karte der Sporthalle Nordhain', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain' }], tileUrl: '/tiles/{z}/{x}/{y}.png' }, { loadLeaflet });
</script>`;

export const kopieren = `# Einmal beim Bau der Seite (oder per portal-sync.mjs, siehe Foundation/Vanilla): die Dateien liegen danach im eigenen Projekt
cp node_modules/@bbv/dss-design-system/dist/vanilla/dss.css            _site/dss/
cp -r node_modules/@bbv/dss-design-system/dist/vanilla/courtlines      _site/dss/                # nur, wenn deine Seiten die Court-Linien nutzen
cp node_modules/@bbv/dss-design-system/dist/vanilla/dss-map.min.js     _site/dss/
cp node_modules/@bbv/dss-design-system/dist/vanilla/dss-render.min.js  _site/dss/                # nur für die Hallenkarte aus Daten ...
cp node_modules/@bbv/dss-design-system/dist/vanilla/dss.min.js         _site/dss/                # ... und der Kern, den dss-render.min.js einbindet (sonst 404)
cp node_modules/leaflet/dist/leaflet.css                                _site/vendor/leaflet/
cp node_modules/leaflet/dist/leaflet-src.esm.js                         _site/vendor/leaflet/   # als ES-Modul (Variante 1 und 2)
cp node_modules/leaflet/dist/leaflet.js                                 _site/vendor/leaflet/   # nur für Variante 3 (window.L)
cp -r node_modules/leaflet/dist/images                                  _site/vendor/leaflet/   # nur, wenn du Leaflets eigene Bilder brauchst (die Marker der Karte sind SVG)`;


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

export const sitzSvelte = `<script>
  import MapView from '@bbv/dss-design-system/svelte/Map';

  const orte = [
    // kind: 'seat' – der Vereinssitz: Haus-Symbol statt Nummer, ohne Nummer, zählt in der Nummerierung nicht mit
    { id: 'sitz', lat: 49.2962, lng: 7.9105, label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' },
    { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
    { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg' },
  ];
</script>

<!-- darkTiles: im Dunkelmodus die Kacheln abdunkeln ('dim', Standard) oder invertieren und umfärben ('invert'); wirkt nur mit dimInDark -->
<MapView label="Vereinssitz und Hallen" markers={orte} darkTiles="invert" />`;

export const sitzReact = `import { MapView, type MapMarker } from '@bbv/dss-design-system/react';

const orte: MapMarker[] = [
  // kind: 'seat' – der Vereinssitz: Haus-Symbol statt Nummer, ohne Nummer, zählt in der Nummerierung nicht mit
  { id: 'sitz', lat: 49.2962, lng: 7.9105, label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' },
  { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
  { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg' },
];

{/* darkTiles: im Dunkelmodus die Kacheln abdunkeln ('dim', Standard) oder invertieren und umfärben ('invert'); wirkt nur mit dimInDark */}
<MapView label="Vereinssitz und Hallen" markers={orte} darkTiles="invert" />`;

export const sitzVanilla = `<!-- Vanilla: Kacheln im Dunkelmodus invertieren statt abdunkeln – ein Attribut am Wurzelelement (und data-dim="true") -->
<div class="dss-map" data-state="ready" data-dim="true" data-tiles="invert" style="--dss-map-h:320px">…</div>

<!-- Vereinssitz in der Liste: Haus-Badge ohne Zahl (aria-hidden) und der Chip „Vereinssitz“ -->
<li class="dss-map-item">
  <span class="dss-map-num is-seat" aria-hidden="true"></span>
  <div class="dss-map-item-body">
    <p class="dss-map-name"><span>Geschäftsstelle TSV Nordhain</span><span class="dss-chip">Vereinssitz</span></p>
    <p class="dss-map-coords">49,2962° N, 7,9105° O</p>
  </div>
</li>

<script type="module">
  import { markerName, tilesMode, mapItems } from '@bbv/dss-design-system/map.js';

  markerName({ label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' });  // 'Geschäftsstelle TSV Nordhain, Vereinssitz'
  tilesMode('invert');                                                  // 'invert' (alles andere ergibt 'dim')
  mapItems([{ id: 's', lat: 49.3, lng: 7.9, label: 'Sitz', kind: 'seat' }, { id: 'a', lat: 49.31, lng: 7.91, label: 'A' }, { id: 'b', lat: 49.32, lng: 7.92, label: 'B' }])
    .map((i) => i.number);                                              // [null, 1, 2]
</script>`;
