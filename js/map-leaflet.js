/**
 * DSS Map · Leaflet-Anbindung (intern, von Svelte und React gemeinsam genutzt)
 * --------------------------------------------------------------
 * Lädt Leaflet erst beim Erzeugen der Karte (`import('leaflet')`), nie beim Import dieses Moduls: kein Zugriff auf `window` oder
 * `document` auf der obersten Ebene, Apps ohne Karte zahlen nichts. Zoom-Schaltflächen, Quellenangabe, Platzhalter und Fehlerhinweis
 * gehören der Komponente (Markup), Leaflet liefert nur Kacheln, Marker und Gesten. Marker sind Inline-SVG (`L.divIcon`), erzeugt mit
 * DOM-Aufrufen, ohne Leaflets Standardbilder.
 */
import { DEFAULT_TILE_URL, MAX_ZOOM, MIN_ZOOM, initialView, mapItems, validTileUrl } from './map.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PIN_PATH = 'M18 1.5C9.4 1.5 2.5 8.2 2.5 16.4c0 10.8 15.5 27.6 15.5 27.6s15.5-16.8 15.5-27.6C33.5 8.2 26.6 1.5 18 1.5z';
const FIT_PADDING = [48, 48];

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

/** „Bewegung reduzieren“ (Systemeinstellung) oder `data-motion="reduce"` auf <html> (Pause-Schalter der App). */
export function reducedMotion() {
  if (typeof window === 'undefined') return false;
  const system = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return system || document.documentElement.dataset.motion === 'reduce';
}

const svgEl = (name, attrs) => {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};

/** Marker als SVG: Kontur und weißer Ring (sichtbar auf hellen und dunklen Kacheln), Füllung, Nummer oder Punkt. */
export function pinElement(item) {
  const svg = svgEl('svg', { viewBox: '0 0 36 46', width: '36', height: '46', class: 'dss-map-pin', 'aria-hidden': 'true', focusable: 'false' });
  svg.appendChild(svgEl('path', { d: PIN_PATH, class: 'dss-map-pin-edge' }));
  svg.appendChild(svgEl('path', { d: PIN_PATH, class: 'dss-map-pin-body' }));
  if (item.number === null || item.number === undefined) {
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
 * `hooks`: onReady(map), onError(reason), onZoom({ zoom, min, max }), onMarkerClick(item).
 * Gründe für `onError`: 'tile-url' (ungültige Adresse), 'import' (Leaflet fehlt oder lässt sich nicht laden), 'init' (Aufbau der Karte schlägt fehl), 'tiles' (alle sichtbaren Kacheln fehlgeschlagen).
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

  const fail = (reason, error) => {
    if (destroyed) return;
    devWarn(`[dss-map] Die Karte konnte nicht geladen werden (${reason}).`, error);
    hooks.onError?.(reason);
  };

  const emitZoom = () => {
    if (map) hooks.onZoom?.({ zoom: map.getZoom(), min: map.getMinZoom(), max: map.getMaxZoom() });
  };

  const markerIcon = (item) => L.divIcon({ html: pinElement(item), className: `dss-map-marker${item.own ? ' is-own' : ''}`, iconSize: [44, 46], iconAnchor: [22, 45] });

  const syncMarkers = (items) => {
    const keep = new Set(items.map((i) => i.id));
    for (const [id, entry] of entries) {
      if (!keep.has(id)) { entry.marker.remove(); entries.delete(id); }
    }
    for (const item of items) {
      const sig = JSON.stringify([item.label, item.number, item.own, item.href ?? '']);
      const entry = entries.get(item.id);
      if (entry && entry.sig === sig) {
        entry.item = item;
        if (entry.lat !== item.lat || entry.lng !== item.lng) { entry.marker.setLatLng([item.lat, item.lng]); entry.lat = item.lat; entry.lng = item.lng; }
        continue;
      }
      if (entry) entry.marker.remove();
      const marker = L.marker([item.lat, item.lng], { icon: markerIcon(item), title: item.label, alt: item.label, keyboard: true, riseOnHover: true });
      const next = { marker, sig, item, lat: item.lat, lng: item.lng };
      marker.on('click', () => {
        hooks.onMarkerClick?.(next.item);
        if (next.item.href) window.location.assign(next.item.href);
      });
      marker.addTo(map);
      const icon = marker.getElement?.();
      if (icon) icon.setAttribute('aria-label', item.label);
      entries.set(item.id, next);
    }
  };

  const setGestures = (interactive) => {
    for (const name of GESTURES) map[name]?.[interactive ? 'enable' : 'disable']?.();
  };

  const applyView = (items, first) => {
    const view = initialView({ markers: items, center: current.center, zoom: current.zoom });
    const animate = !first && !reducedMotion();
    if (view.bounds) map.fitBounds([view.bounds.sw, view.bounds.ne], { padding: FIT_PADDING, maxZoom: 17, animate });
    else map.setView(view.center, view.zoom, { animate });
  };

  const apply = (first) => {
    const items = mapItems(current.markers, current.appLinks);
    syncMarkers(items);
    setGestures(current.interactive !== false);
    const url = current.tileUrl ?? DEFAULT_TILE_URL;
    if (layer && layerUrl !== url) { tileOk = 0; tileBad = 0; layerUrl = url; layer.setUrl(url); }
    const viewKey = JSON.stringify([current.center ?? null, current.zoom ?? null]);
    const positions = JSON.stringify(items.map((i) => [i.id, i.lat, i.lng]));
    const hasCenter = Array.isArray(current.center);
    if (first || viewKey !== lastView || (!hasCenter && positions !== lastPositions)) applyView(items, first);
    lastView = viewKey;
    lastPositions = positions;
  };

  const start = async () => {
    const url = current.tileUrl ?? DEFAULT_TILE_URL;
    if (!validTileUrl(url)) return fail('tile-url', url);
    let mod;
    try {
      mod = await import('leaflet');
    } catch (error) {
      return fail('import', error);
    }
    if (destroyed) return;
    try {
      L = mod.default ?? mod;
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
      layer.on('tileload', () => { tileOk += 1; });
      layer.on('tileerror', () => { tileBad += 1; });
      // „load“ kommt, wenn alle sichtbaren Kacheln geladen oder fehlgeschlagen sind: keine einzige geladen heißt blockiert
      layer.on('load', () => { if (tileOk === 0 && tileBad > 0) fail('tiles'); });
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
      apply(false);
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
