/**
 * DSS Map · Leaflet-Anbindung (intern, von Svelte und React gemeinsam genutzt)
 * --------------------------------------------------------------
 * Lädt Leaflet erst beim Erzeugen der Karte (`import('leaflet')`), nie beim Import dieses Moduls: kein Zugriff auf `window` oder
 * `document` auf der obersten Ebene, Apps ohne Karte zahlen nichts. Zoom-Schaltflächen, Quellenangabe, Platzhalter und Fehlerhinweis
 * gehören der Komponente (Markup), Leaflet liefert nur Kacheln, Marker und Gesten. Marker sind Inline-SVG (`L.divIcon`), erzeugt mit
 * DOM-Aufrufen, ohne Leaflets Standardbilder.
 */
import { DEFAULT_TILE_URL, MAX_ZOOM, MIN_ZOOM, initialView, mapItems, markerName, validTileUrl } from './map.js';
import { safeHref } from './url.js';
import { reducedMotion } from './motion.js';

// Abwärtskompatibel: `reducedMotion` stand früher hier; die Funktion lebt jetzt in js/motion.js
export { reducedMotion };

const SVG_NS = 'http://www.w3.org/2000/svg';
// Haus für den Sitzmarker (Mitte bei 18/16,5 wie Punkt und Nummer): Dach, Wände und Tür als eine Fläche
const HOUSE_PATH = 'M18 9.5 25.5 15.8V23h-5.1v-4.6h-4.8V23h-5.1v-7.2z';
const PIN_PATH = 'M18 1.5C9.4 1.5 2.5 8.2 2.5 16.4c0 10.8 15.5 27.6 15.5 27.6s15.5-16.8 15.5-27.6C33.5 8.2 26.6 1.5 18 1.5z';
// Rand beim Einpassen: oben Platz für die Pin-Spitze samt Pin (46 px), rechts für die Zoom-Schaltflächen, unten für die Quellenangabe
const FIT_OPTIONS = { paddingTopLeft: [56, 64], paddingBottomRight: [84, 52], maxZoom: 17 };

/** Gesten, die `interactive={false}` abschaltet (die Tastatur bleibt). */
const GESTURES = ['dragging', 'touchZoom', 'scrollWheelZoom', 'doubleClickZoom', 'boxZoom'];

/** Hinweis nur in der Entwicklung (nicht in Produktionsbauten). */
export function devWarn(message, detail) {
  if (isDev()) console.warn(message, detail ?? '');
}

const isDev = () => {
  try {
    return process.env.NODE_ENV !== 'production';
  } catch {
    return false;
  }
};

const svgEl = (name, attrs) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

/** Marker als SVG: Kontur und weißer Ring (sichtbar auf hellen und dunklen Kacheln), Füllung, Nummer, Punkt oder (Sitzmarker) Haus. */
export function pinElement(item) {
  const svg = svgEl('svg', { viewBox: '0 0 36 46', width: '36', height: '46', class: 'dss-map-pin', 'aria-hidden': 'true', focusable: 'false' });
  svg.appendChild(svgEl('path', { d: PIN_PATH, class: 'dss-map-pin-edge' }));
  svg.appendChild(svgEl('path', { d: PIN_PATH, class: 'dss-map-pin-body' }));
  if (item.kind === 'seat') {
    svg.appendChild(svgEl('path', { d: HOUSE_PATH, class: 'dss-map-pin-house' }));
  } else if (item.number === null || item.number === undefined) {
    svg.appendChild(svgEl('circle', { cx: '18', cy: '16.5', r: '5.5', class: 'dss-map-pin-dot' }));
  } else {
    const text = svgEl('text', { x: '18', y: '16.5', class: `dss-map-pin-num${String(item.number).length > 2 ? ' is-small' : ''}`, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    text.textContent = String(item.number);
    svg.appendChild(text);
  }
  return svg;
}

/**
 * Erzeugt die Karte in `el`. `opts`: markers, appLinks, center, zoom, interactive, tileUrl (alles wie die Props der Komponente).
 * `hooks`: onReady(map), onError(reason), onZoom({ zoom, min, max }), onMarkerClick(item), loadLeaflet() (liefert Leaflet als Promise; ohne
 * Angabe `import('leaflet')`: so kann eine Seite ohne Bundler Leaflet aus einer lokalen Datei laden).
 * Gründe für `onError`: 'tile-url' (ungültige Adresse), 'import' (Leaflet fehlt oder lässt sich nicht laden), 'init' (Aufbau der Karte schlägt fehl), 'update' (Aktualisierung wirft), 'tiles' (die ersten sichtbaren Kacheln alle fehlgeschlagen; eine Karte, die schon Kacheln zeigte, kippt nicht mehr).
 * Rückgabe: `update(opts)`, `zoomIn()`, `zoomOut()`, `destroy()` (ruft `map.remove()`; auch während des Ladens sicher).
 */
export function createMapController(el, opts, hooks = {}) {
  let current = opts;
  let destroyed = false;
  let map = null;
  let layer = null;
  let layerUrl = '';
  let observer = null;
  let L = null;
  const entries = new Map();
  let lastView = '';
  let lastPositions = '';
  let tileOk = 0;
  let tileBad = 0;
  // Ob je eine Kachel ankam: erst dann ist die Karte „lebendig“, spätere Kachelfehler (404, 429) kippen sie nicht mehr in den Fehlerzustand
  let everLoaded = false;

  const fail = (reason, error) => {
    if (destroyed) return;
    devWarn(`[dss-map] Die Karte konnte nicht geladen werden (${reason}).`, error);
    hooks.onError?.(reason);
  };

  const emitZoom = () => {
    if (map) hooks.onZoom?.({ zoom: map.getZoom(), min: map.getMinZoom(), max: map.getMaxZoom() });
  };

  const markerIcon = (item) => L.divIcon({ html: pinElement(item), className: `dss-map-marker${item.own ? ' is-own' : ''}${item.kind === 'seat' ? ' is-seat' : ''}`, iconSize: [44, 46], iconAnchor: [22, 45] });

  const syncMarkers = (items) => {
    const keep = new Set(items.map((i) => i.id));
    for (const [id, entry] of entries) {
      if (!keep.has(id)) { entry.marker.remove(); entries.delete(id); }
    }
    for (const item of items) {
      const sig = JSON.stringify([item.label, item.number, item.own, item.kind, item.seatText, item.href ?? '']);
      const entry = entries.get(item.id);
      if (entry && entry.sig === sig) {
        entry.item = item;
        if (entry.lat !== item.lat || entry.lng !== item.lng) { entry.marker.setLatLng([item.lat, item.lng]); entry.lat = item.lat; entry.lng = item.lng; }
        continue;
      }
      if (entry) entry.marker.remove();
      const marker = L.marker([item.lat, item.lng], { icon: markerIcon(item), title: markerName(item), alt: markerName(item), keyboard: true, riseOnHover: true });
      const next = { marker, sig, item, lat: item.lat, lng: item.lng };
      const activate = () => {
        hooks.onMarkerClick?.(next.item);
        // mapItems filtert schon; hier gilt dieselbe Regel noch einmal, damit nie ein javascript:-Ziel an location geht
        const target = safeHref(next.item.href);
        if (target) window.location.assign(target);
      };
      marker.on('click', activate);
      // Leaflet 1.9 löst bei Tasten keinen Klick aus (nur `keypress`): Enter und Leertaste öffnen wie ein Button
      marker.on('keypress', (e) => {
        const key = e?.originalEvent?.keyCode;
        if (key !== 13 && key !== 32) return;
        e.originalEvent.preventDefault?.();
        activate();
      });
      // Das Icon entsteht erst, wenn die Karte einen Ausschnitt hat: Name für Hilfstechnik beim Hinzufügen setzen
      const name = () => marker.getElement?.()?.setAttribute('aria-label', markerName(next.item));
      marker.on('add', name);
      marker.addTo(map);
      name();
      entries.set(item.id, next);
    }
  };

  const setGestures = (interactive) => {
    for (const name of GESTURES) map[name]?.[interactive ? 'enable' : 'disable']?.();
  };

  const applyView = (items, first) => {
    const view = initialView({ markers: items, center: current.center, zoom: current.zoom });
    const animate = !first && !reducedMotion();
    if (view.bounds) map.fitBounds([view.bounds.sw, view.bounds.ne], { ...FIT_OPTIONS, animate });
    else map.setView(view.center, view.zoom, { animate });
  };

  const apply = (first) => {
    const items = mapItems(current.markers, current.appLinks, { seat: current.seatLabel });
    setGestures(current.interactive !== false);
    const url = current.tileUrl ?? DEFAULT_TILE_URL;
    if (layer && layerUrl !== url) { tileOk = 0; tileBad = 0; everLoaded = false; layerUrl = url; layer.setUrl(url); }
    const viewKey = JSON.stringify([current.center ?? null, current.zoom ?? null]);
    const positions = JSON.stringify(items.map((i) => [i.id, i.lat, i.lng]));
    const hasCenter = Array.isArray(current.center);
    // Zuerst der Ausschnitt, dann die Marker: Leaflet legt Marker-Icons erst an, wenn die Karte eine Mitte hat
    if (first || viewKey !== lastView || (!hasCenter && positions !== lastPositions)) applyView(items, first);
    lastView = viewKey;
    lastPositions = positions;
    syncMarkers(items);
  };

  const start = async () => {
    const url = current.tileUrl ?? DEFAULT_TILE_URL;
    if (!validTileUrl(url)) return fail('tile-url', url);
    let mod;
    try {
      mod = await (typeof hooks.loadLeaflet === 'function' ? hooks.loadLeaflet() : import('leaflet'));
    } catch (error) {
      return fail('import', error);
    }
    if (destroyed) return;
    try {
      L = mod?.default && typeof mod.default.map === 'function' ? mod.default : mod;
      // Ein Lader, der etwas anderes als Leaflet liefert (undefined, ein Modul ohne `map`), ist ein Importfehler, kein Fehler im Aufbau
      if (!L || typeof L.map !== 'function' || typeof L.tileLayer !== 'function') return fail('import', new Error('Leaflet fehlt: `map` oder `tileLayer` nicht gefunden'));
      const calm = reducedMotion();
      map = L.map(el, {
        zoomControl: false, attributionControl: false, minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM,
        zoomAnimation: !calm, fadeAnimation: !calm, markerZoomAnimation: !calm, inertia: !calm,
        keyboard: true, dragging: current.interactive !== false, scrollWheelZoom: current.interactive !== false,
        doubleClickZoom: current.interactive !== false, touchZoom: current.interactive !== false, boxZoom: current.interactive !== false,
      });
      layerUrl = url;
      layer = L.tileLayer(url, { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, className: 'dss-map-tiles' });
      layer.on('loading', () => { tileOk = 0; tileBad = 0; });
      layer.on('tileload', () => { tileOk += 1; everLoaded = true; });
      layer.on('tileerror', () => { tileBad += 1; });
      // „load“ kommt, wenn alle sichtbaren Kacheln geladen oder fehlgeschlagen sind: keine einzige geladen heißt blockiert
      layer.on('load', () => { if (!everLoaded && tileOk === 0 && tileBad > 0) fail('tiles'); });
      layer.addTo(map);
      map.on('zoomend', emitZoom);
      apply(true);
      if (typeof ResizeObserver === 'function') {
        observer = new ResizeObserver(() => map?.invalidateSize());
        observer.observe(el);
      }
      emitZoom();
      hooks.onReady?.(map);
    } catch (error) {
      fail('init', error);
    }
  };
  const started = start();

  return {
    started,
    update(next) {
      current = next;
      if (!map || destroyed) return;
      if (!validTileUrl(current.tileUrl ?? DEFAULT_TILE_URL)) return fail('tile-url', current.tileUrl);
      try {
        apply(false);
      } catch (error) {
        fail('update', error);
      }
    },
    zoomIn() { map?.zoomIn(1, { animate: !reducedMotion() }); },
    zoomOut() { map?.zoomOut(1, { animate: !reducedMotion() }); },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      entries.clear();
      if (map) {
        try { map.remove(); } catch { /* Karte war schon abgebaut */ }
        map = null;
      }
    },
  };
}
