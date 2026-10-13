// Gespieltes Leaflet für Tests ohne Netz: protokolliert Aufrufe, baut ein Minimum an DOM (Container, Marker mit Icon) und lässt
// Tests Ereignisse auslösen (tileload, tileerror, load, zoomend, click). vitest.config.ts setzt diese Datei als Alias für 'leaflet':
// `import('leaflet')` liefert in allen Tests dieses Modul (gleichzeitige Importe über vi.mock lieferten in Vitest teils das echte Modul).
type Listener = (...args: unknown[]) => void;

class Evented {
  listeners: Record<string, Listener[]> = {};
  on(name: string, fn: Listener) {
    for (const n of name.split(' ')) (this.listeners[n] ??= []).push(fn);
    return this;
  }
  off(name: string, fn?: Listener) {
    this.listeners[name] = fn ? (this.listeners[name] ?? []).filter((f) => f !== fn) : [];
    return this;
  }
  fire(name: string, ...args: unknown[]) {
    for (const fn of this.listeners[name] ?? []) fn(...args);
    return this;
  }
}

export const state = {
  maps: [] as FakeMap[],
  layers: [] as FakeTileLayer[],
  markers: [] as FakeMarker[],
  removed: 0,
  /** Wird gesetzt, um beim nächsten Aufbau einen Fehler zu werfen */
  throwOnMap: false,
  /** Zahl der Aufbauversuche in einem abgehängten Behälter */
  detached: 0,
  /** Wird gesetzt, damit setView und fitBounds (Aktualisierung) werfen */
  throwOnView: false,
};
export const reset = () => {
  state.maps = []; state.layers = []; state.markers = []; state.removed = 0; state.detached = 0; state.throwOnMap = false; state.throwOnView = false;
};

class Handler {
  enabled: boolean;
  constructor(enabled: boolean) { this.enabled = enabled; }
  enable() { this.enabled = true; }
  disable() { this.enabled = false; }
}

export class FakeMap extends Evented {
  el: HTMLElement;
  options: Record<string, any>;
  zoom = 15;
  view: { center?: unknown; zoom?: number; bounds?: unknown; options?: unknown }[] = [];
  isRemoved = false;
  dragging: Handler; touchZoom: Handler; scrollWheelZoom: Handler; doubleClickZoom: Handler; boxZoom: Handler;
  constructor(target: HTMLElement | string, options: Record<string, any>) {
    super();
    // wie Leaflet: ein Element oder die id eines Elements
    const el = typeof target === 'string' ? document.getElementById(target)! : target;
    if (state.throwOnMap) throw new Error('Aufbau schlägt fehl');
    // wie im Browser nützt eine Karte in einem abgehängten Behälter nichts: der Test soll es merken (Mehrfach-init auf Server-Markup)
    if (!el.isConnected) { state.detached += 1; throw new Error('Map container is detached from the document'); }
    this.el = el; this.options = options;
    if ((el as any)._leaflet_id) throw new Error('Map container is already initialized.');
    (el as any)._leaflet_id = state.maps.length + 1;
    el.classList.add('leaflet-container');
    el.setAttribute('tabindex', '0');
    const pane = document.createElement('div');
    pane.className = 'leaflet-marker-pane';
    el.appendChild(pane);
    this.dragging = new Handler(options.dragging !== false);
    this.touchZoom = new Handler(options.touchZoom !== false);
    this.scrollWheelZoom = new Handler(options.scrollWheelZoom !== false);
    this.doubleClickZoom = new Handler(options.doubleClickZoom !== false);
    this.boxZoom = new Handler(options.boxZoom !== false);
    state.maps.push(this);
  }
  setView(center: unknown, zoom: number, options?: unknown) { if (state.throwOnView) throw new Error('setView schlägt fehl'); this.zoom = zoom; this.view.push({ center, zoom, options }); this.fire('zoomend'); return this; }
  fitBounds(bounds: unknown, options?: any) { this.view.push({ bounds, options }); this.zoom = 14; this.fire('zoomend'); return this; }
  getZoom() { return this.zoom; }
  getMinZoom() { return this.options.minZoom; }
  getMaxZoom() { return this.options.maxZoom; }
  zoomIn() { this.zoom = Math.min(this.options.maxZoom, this.zoom + 1); this.fire('zoomend'); return this; }
  zoomOut() { this.zoom = Math.max(this.options.minZoom, this.zoom - 1); this.fire('zoomend'); return this; }
  invalidateSize() { return this; }
  remove() {
    this.isRemoved = true;
    state.removed += 1;
    delete (this.el as any)._leaflet_id;
    this.el.classList.remove('leaflet-container');
    this.el.replaceChildren();
    return this;
  }
}

export class FakeTileLayer extends Evented {
  url: string; options: Record<string, any>; map?: FakeMap; urls: string[];
  constructor(url: string, options: Record<string, any>) { super(); this.url = url; this.options = options; this.urls = [url]; state.layers.push(this); }
  addTo(map: FakeMap) { this.map = map; return this; }
  setUrl(url: string) { this.url = url; this.urls.push(url); return this; }
}

export class FakeMarker extends Evented {
  latlng: [number, number]; options: Record<string, any>; el?: HTMLElement; map?: FakeMap; isRemoved = false; latlngs: [number, number][] = [];
  constructor(latlng: [number, number], options: Record<string, any>) { super(); this.latlng = latlng; this.latlngs.push(latlng); this.options = options; state.markers.push(this); }
  addTo(map: FakeMap) {
    this.map = map;
    const el = document.createElement('div');
    el.className = `leaflet-marker-icon ${this.options.icon.options.className ?? ''}`;
    // wie Leaflet: ein Element oder eine Zeichenkette mit Markup
    const html = this.options.icon.options.html;
    el.appendChild(typeof html === 'string' ? document.createRange().createContextualFragment(html) : html);
    if (this.options.title) el.title = this.options.title;
    if (this.options.keyboard) { el.tabIndex = 0; el.setAttribute('role', 'button'); }
    map.el.querySelector('.leaflet-marker-pane')!.appendChild(el);
    this.el = el;
    // Leaflet meldet „add“, sobald das Icon steht (bei Karten ohne Ausschnitt erst später)
    this.fire('add');
    return this;
  }
  getElement() { return this.el; }
  setLatLng(latlng: [number, number]) { this.latlng = latlng; this.latlngs.push(latlng); return this; }
  remove() { this.isRemoved = true; this.el?.remove(); return this; }
}

export const L = {
  map: (el: HTMLElement | string, options: Record<string, any>) => new FakeMap(el, options),
  tileLayer: (url: string, options: Record<string, any>) => new FakeTileLayer(url, options),
  marker: (latlng: [number, number], options: Record<string, any>) => new FakeMarker(latlng, options),
  divIcon: (options: Record<string, any>) => ({ options }),
};

export default L;
export const { map, tileLayer, marker, divIcon } = L;

export const lastMap = () => state.maps[state.maps.length - 1];
export const lastLayer = () => state.layers[state.layers.length - 1];
/** Alle Kacheln der sichtbaren Ebene: Leaflet meldet „load“, wenn alle fertig oder fehlgeschlagen sind. */
export const finishTiles = (layer: FakeTileLayer, outcome: 'ok' | 'fail' | 'mixed') => {
  layer.fire('loading');
  if (outcome !== 'fail') layer.fire('tileload');
  if (outcome !== 'ok') layer.fire('tileerror');
  layer.fire('load');
};
