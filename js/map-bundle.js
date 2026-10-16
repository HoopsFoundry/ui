/**
 * HoopsFoundry UI Map · Einstieg des Karten-Bündels (dist/vanilla/hoops-map.js)
 * --------------------------------------------------------------
 * Die Karte für Seiten ohne Framework: `renderMap`, `initMap`, `mountMap` und `initMapBlock` (Anbindung für `initAll`). Leaflet gehört nicht
 * dazu: das Bündel lädt es erst nach dem Klick auf „Karte laden“ (oder bei `load: 'auto'`), standardmäßig per `import('leaflet')` (Bundler oder
 * importmap) oder über die Option `loadLeaflet` aus einer lokalen Datei. Beim Import passiert nichts (kein Zugriff auf `window`/`document`).
 * Typen: js/map-bundle.d.ts. Der Build (scripts/build-vanilla.mjs) setzt `__HOOPS_VERSION__` aus der package.json.
 */
export { renderMap, initMap, mountMap, initMapBlock } from './map-vanilla.js';

/** Version des Pakets, aus dem dieses Bündel gebaut wurde (im Quelltext ohne Build `dev`); sie muss zu `VERSION` von hoops.js und zu hoops.css passen. */
// eslint-disable-next-line no-undef
export const VERSION = typeof __HOOPS_VERSION__ === 'string' ? __HOOPS_VERSION__ : 'dev';
