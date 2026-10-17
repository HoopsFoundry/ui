// Regeln der Karte in Vanilla (V2b) als prüfbare Aussagen. tests/map-vanilla-mutation.test.ts lädt die Module aus dem echten Quelltext (alle
// Regeln gelten) und aus verfälschtem (die zugehörige Regel muss kippen). Läuft unter jsdom; Leaflet ist gespielt (globalThis.__L).
import { deSetupImport } from './i18n-de';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { vi } from 'vitest';
import { read, type Rules } from './mutation';
import * as mock from './leaflet-mock';

export const MAP_FILES = [
  'js/map-vanilla.js', 'js/map-leaflet.js', 'js/map.js', 'js/url.js', 'js/lifecycle.js', 'js/motion.js',
  'js/render/map-view.js', 'js/render/dom.js', 'js/render/core.js', 'js/render/escape.js', 'js/render/venue-card.js', 'js/render/mount.js', 'js/vanilla-core.js',
] as const;
export type MapFile = (typeof MAP_FILES)[number];
type Fn = (...args: any[]) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
export interface Loaded { vanilla: Record<string, Fn>; venue: Record<string, Fn>; core: Record<string, Fn>; leaflet: Record<string, Fn> }

/**
 * Lädt die Module aus Quelltext (data-URL); relative Importe zeigen auf diese Fassungen (so wirkt eine verfälschte Datei bei allen, die sie importieren),
 * alles andere auf die Dateien. `import('leaflet')` wird durch das gespielte Leaflet ersetzt.
 */
export async function loadMap(override?: { file: MapFile; source: string }): Promise<Loaded> {
  const known = new Set<string>(MAP_FILES);
  const urls = new Map<string, string>();
  const urlOf = (path: string): string => {
    if (!known.has(path)) return pathToFileURL(resolve(process.cwd(), path)).href;
    const cached = urls.get(path);
    if (cached) return cached;
    const source = override && override.file === path ? override.source : read(path);
    const dir = path.slice(0, path.lastIndexOf('/'));
    const target = (spec: string) => {
      const parts = `${dir}/${spec}`.split('/');
      const out: string[] = [];
      for (const part of parts) {
        if (part === '..') out.pop();
        else if (part !== '.') out.push(part);
      }
      return out.join('/');
    };
    const code = source
      .replace(/from '(\.{1,2}\/[\w/-]+\.js)'/g, (_m, spec: string) => `from '${urlOf(target(spec))}'`)
      .replaceAll("import('leaflet')", 'Promise.resolve(globalThis.__L)');
    const url = `data:text/javascript;base64,${Buffer.from(deSetupImport + code).toString('base64')}`; // deutsche Standardsprache auch in dieser Instanz des Sprachkerns
    urls.set(path, url);
    return url;
  };
  (globalThis as { __L?: unknown }).__L = mock.L;
  const [vanilla, venue, core, leaflet] = await Promise.all([
    import(/* @vite-ignore */ urlOf('js/map-vanilla.js')),
    import(/* @vite-ignore */ urlOf('js/render/venue-card.js')),
    import(/* @vite-ignore */ urlOf('js/vanilla-core.js')),
    import(/* @vite-ignore */ urlOf('js/map-leaflet.js')),
  ]);
  return { vanilla, venue, core, leaflet };
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const A = { id: 'a', lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain' };
const B = { id: 'b', lat: 49.5, lng: 8.5, label: 'Halle Süd' };
const BASE = { label: 'Karte', markers: [A] };
const click = (el: Element | null) => (el as HTMLElement | null)?.click();
const root = () => document.querySelector('.hoops-map');
const stateOf = () => root()?.getAttribute('data-state');
const settle = async () => { for (let i = 0; i < 4; i++) await tick(); };

export async function mapRules(m: Loaded): Promise<Rules> {
  const { mountMap, initMap, initMapBlock, renderMap } = m.vanilla as { mountMap: Fn; initMap: Fn; initMapBlock: Fn; renderMap: Fn };
  const { mountVenueCard, renderVenueCard } = m.venue as { mountVenueCard: Fn; renderVenueCard: Fn };
  const { initAll } = m.core as { initAll: Fn };
  const R: Rules = {};
  const rule = async (name: string, fn: (host: HTMLElement) => Promise<boolean> | boolean) => {
    mock.reset();
    const host = document.createElement('div');
    document.body.append(host);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      R[name] = (await fn(host)) === true;
    } catch {
      R[name] = false;
    } finally {
      warn.mockRestore();
      document.body.replaceChildren();
    }
  };
  const mapState = mock.state;
  const ledger = () => {
    const live = new Map<string, number>();
    const proto = EventTarget.prototype;
    const add = proto.addEventListener;
    const remove = proto.removeEventListener;
    const key = (t: unknown, type: string) => `${t === window ? 'window' : t === document ? 'document' : 'element'} ${type}`;
    const a = vi.spyOn(proto, 'addEventListener').mockImplementation(function (this: EventTarget, type: string, l: never, o?: never) {
      live.set(key(this, type), (live.get(key(this, type)) ?? 0) + 1);
      return add.call(this, type, l, o);
    } as never);
    const r = vi.spyOn(proto, 'removeEventListener').mockImplementation(function (this: EventTarget, type: string, l: never, o?: never) {
      live.set(key(this, type), (live.get(key(this, type)) ?? 0) - 1);
      return remove.call(this, type, l, o);
    } as never);
    return { open: () => [...live].filter(([, n]) => n !== 0), stop: () => { a.mockRestore(); r.mockRestore(); } };
  };

  await rule('Karte: ohne Klick wird nichts geladen', async (host) => {
    const load = vi.fn(() => Promise.resolve(mock.L));
    mountMap(host, BASE, { loadLeaflet: load });
    await settle();
    return load.mock.calls.length === 0 && mapState.maps.length === 0 && stateOf() === 'idle';
  });
  await rule('Karte: load auto startet ohne Klick', async (host) => {
    mountMap(host, { ...BASE, load: 'auto' });
    await settle();
    return mapState.maps.length === 1 && stateOf() === 'ready';
  });
  await rule('Karte: ungültige Kachel-Adresse ergibt sofort den Fehlerzustand ohne Schaltfläche', async (host) => {
    mountMap(host, { ...BASE, tileUrl: 'http://tiles.example.org/{z}/{x}/{y}.png' });
    await settle();
    return stateOf() === 'error' && host.querySelector('.hoops-map-load') === null && mapState.maps.length === 0;
  });
  await rule('Karte: Ziele laufen durch safeHref (Liste ohne Link)', (host) => {
    mountMap(host, { label: 'K', markers: [{ ...A, href: 'javascript:alert(1)' }, { ...B, href: 'https://example.org/halle' }] });
    return host.querySelectorAll('.hoops-map-name a').length === 1 && host.querySelector('.hoops-map-name a')!.getAttribute('href') === 'https://example.org/halle';
  });
  await rule('Karte: destroy entfernt die Listener', (host) => {
    const l = ledger();
    const h = mountMap(host, BASE);
    h.destroy();
    const open = l.open();
    l.stop();
    return open.length === 0;
  });
  await rule('Karte: destroy trennt den ResizeObserver', async (host) => {
    const records: { disconnected: boolean }[] = [];
    vi.stubGlobal('ResizeObserver', class {
      rec = { disconnected: false };
      constructor() { records.push(this.rec); }
      observe() {}
      unobserve() {}
      disconnect() { this.rec.disconnected = true; }
    });
    try {
      const h = mountMap(host, { ...BASE, load: 'auto' });
      await settle();
      h.destroy();
      return records.length === 1 && records[0].disconnected;
    } finally {
      vi.unstubAllGlobals();
    }
  });
  await rule('Karte: destroy baut die Leaflet-Karte ab (map.remove) und stellt den Behälter wieder her', async (host) => {
    host.append('vorher');
    const h = mountMap(host, { ...BASE, load: 'auto' });
    await settle();
    h.destroy();
    return mapState.removed === 1 && host.textContent === 'vorher' && host.children.length === 0;
  });
  await rule('Karte: darkTiles kennt nur dim und invert', (host) => {
    const h = mountMap(host, BASE);
    h.update({ ...BASE, darkTiles: 'constructor' });
    const bad = root()!.getAttribute('data-tiles');
    h.update({ ...BASE, darkTiles: 'invert' });
    return bad === 'dim' && root()!.getAttribute('data-tiles') === 'invert';
  });
  await rule('Karte: Sitzmarker zählen in der Nummerierung nicht mit', (host) => {
    mountMap(host, { label: 'K', markers: [{ ...A, kind: 'seat' }, B, { ...A, id: 'c', lat: 49.6 }] });
    const nums = [...host.querySelectorAll('.hoops-map-num')].map((n) => n.textContent);
    return JSON.stringify(nums) === JSON.stringify(['', '1', '2']) && host.querySelectorAll('.hoops-map-num.is-seat').length === 1;
  });
  await rule('Karte: der Fehler hat eine Statuszeile', async (host) => {
    mock.state.throwOnMap = true;
    mountMap(host, { ...BASE, load: 'auto' });
    await settle();
    return stateOf() === 'error' && (host.querySelector('.hoops-map-status')?.textContent ?? '').includes('konnte nicht geladen werden');
  });
  await rule('Karte: der Fehler baut die Karte ab', async (host) => {
    mountMap(host, { ...BASE, load: 'auto' });
    await settle();
    mock.finishTiles(mock.lastLayer(), 'fail');
    return stateOf() === 'error' && mock.lastMap().isRemoved && host.querySelector('.hoops-map-canvas') === null;
  });
  await rule('Karte: ein zweites init ersetzt das erste', async (host) => {
    host.append(document.createRange().createContextualFragment(renderMap(BASE)));
    const first = initMap(host, { ...BASE, load: 'auto' });
    await settle();
    initMap(host, { ...BASE, load: 'auto' });
    await settle();
    return mapState.maps.length === 2 && mapState.maps[0].isRemoved && !mapState.maps[1].isRemoved && typeof first.destroy === 'function';
  });
  await rule('Karte: loadLeaflet liefert Leaflet', async (host) => {
    const load = vi.fn(() => Promise.resolve(mock.L));
    mountMap(host, { ...BASE, load: 'auto' }, { loadLeaflet: load });
    await settle();
    return load.mock.calls.length === 1 && mapState.maps.length === 1;
  });
  await rule('Karte: ein Lader, der keine Funktion ist, fällt auf den Standard zurück', async (host) => {
    // der Controller gilt unabhängig von mountMap (ein anderer Aufrufer kann ihm einen unbrauchbaren Lader geben)
    const { createMapController } = m.leaflet as { createMapController: Fn };
    const target = document.createElement('div');
    host.append(target);
    let ready = false;
    const ctrl = createMapController(target, { markers: [A] }, { loadLeaflet: 'nein', onReady: () => { ready = true; } });
    await ctrl.started;
    return ready && mapState.maps.length === 1;
  });
  await rule('Karte: ein Lader ohne Leaflet ergibt den Fehlergrund import', async (host) => {
    const reasons: string[] = [];
    mountMap(host, { ...BASE, load: 'auto' }, { loadLeaflet: () => Promise.resolve({ nichts: 1 }), onError: (r: string) => reasons.push(r) });
    await settle();
    return reasons.join() === 'import' && stateOf() === 'error';
  });
  await rule('Karte: update erreicht die Karte (Marker entfallen und kommen hinzu)', async (host) => {
    const h = mountMap(host, { ...BASE, load: 'auto', markers: [A, B] });
    await settle();
    h.update({ ...BASE, load: 'auto', markers: [A] });
    // der verbleibende Ort verliert seine Nummer (ein Marker ist ohne Nummer): sein Marker wird neu gebaut, der zweite entfällt
    return mapState.markers.filter((marker) => !marker.isRemoved).length === 1 && mapState.markers[1].isRemoved;
  });
  await rule('Karte: gleiche Marker-Identität über die id', async (host) => {
    const h = mountMap(host, { ...BASE, load: 'auto' });
    await settle();
    h.update({ ...BASE, load: 'auto', markers: [{ ...A, lat: 49.49 }] });
    return mapState.markers.length === 1 && mapState.markers[0].latlngs.length === 2;
  });
  await rule('Karte: eine neue Kachel-Adresse versucht es erneut', async (host) => {
    const h = mountMap(host, { ...BASE, load: 'auto', tileUrl: '/a/{z}/{x}/{y}.png' });
    await settle();
    mock.finishTiles(mock.lastLayer(), 'fail');
    const before = stateOf();
    h.update({ ...BASE, load: 'auto', tileUrl: '/b/{z}/{x}/{y}.png' });
    await settle();
    return before === 'error' && stateOf() === 'ready' && mapState.maps.length === 2 && mock.lastLayer().url === '/b/{z}/{x}/{y}.png';
  });
  await rule('Karte: nach „Karte laden“ liegt der Fokus auf der Kartenfläche', async (host) => {
    mountMap(host, BASE);
    click(host.querySelector('.hoops-map-load'));
    await settle();
    return document.activeElement === host.querySelector('.hoops-map-canvas');
  });
  await rule('Karte: Zoom-Schaltfläche an der Grenze hat aria-disabled', async (host) => {
    mountMap(host, { ...BASE, load: 'auto' });
    await settle();
    const map = mock.lastMap();
    map.zoom = map.options.maxZoom;
    map.fire('zoomend');
    const [plus, minus] = [...host.querySelectorAll('.hoops-map-zoom-btn')];
    return plus.getAttribute('aria-disabled') === 'true' && !minus.hasAttribute('aria-disabled') && !plus.hasAttribute('disabled');
  });
  await rule('Karte: Unmount während des Imports baut keine Karte', async (host) => {
    let release!: (v: unknown) => void;
    const h = mountMap(host, { ...BASE, load: 'auto' }, { loadLeaflet: () => new Promise((r) => { release = r; }) });
    h.destroy();
    release(mock.L);
    await settle();
    return mapState.maps.length === 0 && mapState.detached === 0;
  });
  await rule('Karte: ein werfender Handler kippt die Karte nicht', async (host) => {
    mountMap(host, { ...BASE, load: 'auto' }, { onLoad: () => { throw new Error('x'); } });
    await settle();
    return stateOf() === 'ready';
  });
  await rule('Karte: zweimal initMap auf Server-Markup ergibt eine lebendige Karte im Dokument', async (host) => {
    host.append(document.createRange().createContextualFragment(renderMap(BASE, { uid: 'twice' })));
    initMap(host, BASE);
    initMap(host, BASE);
    click(host.querySelector('.hoops-map-load'));
    await settle();
    return host.querySelectorAll('.leaflet-container').length === 1 && mapState.detached === 0 && stateOf() === 'ready';
  });
  await rule('Karte: update mit Teilen behält Kachel-Adresse und Marker (kein Rückfall auf den Standardserver)', async (host) => {
    const h = mountMap(host, { ...BASE, markers: [A, B], load: 'auto', tileUrl: '/proxy/{z}/{x}/{y}.png' });
    await settle();
    h.update({ label: 'Neu' });
    return mock.lastLayer().url === '/proxy/{z}/{x}/{y}.png' && mapState.layers.length === 1 && mapState.markers.filter((m) => !m.isRemoved).length === 2;
  });
  await rule('Karte: initMap stellt das Markup bei destroy wieder her', (host) => {
    host.append(document.createRange().createContextualFragment(renderMap(BASE, { uid: 'r1' })));
    const before = host.innerHTML;
    const h = initMap(host, { ...BASE, markers: [A, B], label: 'Anders' });
    const changed = host.innerHTML !== before;
    h.destroy();
    return changed && host.innerHTML === before;
  });
  await rule('Karte: während des Ladens ist die Kartenfläche inert', async (host) => {
    mountMap(host, BASE, { loadLeaflet: () => new Promise(() => {}) });
    click(host.querySelector('.hoops-map-load'));
    return host.querySelector('.hoops-map-canvas')?.hasAttribute('inert') === true;
  });
  await rule('Karte: initMap macht die gesperrte Schaltfläche der Hallenkarte bedienbar', async (host) => {
    host.append(document.createRange().createContextualFragment(renderVenueCard({ name: 'H', lat: 49.3, lng: 7.9 }, { uid: 'v' })));
    const sperre = host.querySelector<HTMLButtonElement>('.hoops-map-load')!.disabled;
    initMap(host.querySelector('.hoops-venue-map'), { markers: [{ id: 'halle', lat: 49.3, lng: 7.9, label: 'H' }] });
    return sperre && host.querySelector<HTMLButtonElement>('.hoops-map-load')!.disabled === false;
  });
  await rule('Karte: mountVenueCard startet die eingebettete Karte', async (host) => {
    mountVenueCard(host, { name: 'Halle', lat: 49.3, lng: 7.9, load: 'auto' }, { initMap });
    await settle();
    return mapState.maps.length === 1 && mapState.maps[0].dragging.enabled === false;
  });
  await rule('Karte: mountVenueCard räumt die Karte bei destroy ab', async (host) => {
    const h = mountVenueCard(host, { name: 'Halle', lat: 49.3, lng: 7.9, load: 'auto' }, { initMap });
    await settle();
    h.destroy();
    return mapState.removed === 1 && host.children.length === 0;
  });
  await rule('Karte: mountVenueCard lässt die Karte beim Update stehen', async (host) => {
    const h = mountVenueCard(host, { name: 'Halle', lat: 49.3, lng: 7.9, load: 'auto' }, { initMap });
    await settle();
    const canvas = host.querySelector('.hoops-map-canvas');
    h.update({ name: 'Halle', lat: 49.3, lng: 7.9, load: 'auto', info: 'Info' });
    return mapState.maps.length === 1 && host.querySelector('.hoops-map-canvas') === canvas && host.querySelector('.hoops-venue-info')?.textContent === 'Info';
  });
  await rule('Karte: Styles gehen über das CSSOM, nie als style-Attribut im Markup', (host) => {
    const seen: string[] = [];
    const create = Range.prototype.createContextualFragment;
    const spy = vi.spyOn(Range.prototype, 'createContextualFragment').mockImplementation(function (this: Range, html: string) {
      seen.push(html);
      return create.call(this, html);
    });
    mountMap(host, { ...BASE, markers: [A, B], height: 300 });
    spy.mockRestore();
    const pin = host.querySelector<HTMLElement>('.hoops-map-ph-pin');
    return seen.length > 0 && seen.every((html) => !/\sstyle="/.test(html)) && pin?.style.left !== '' && root()!.style.getPropertyValue('--hoops-map-h') === '300px';
  });
  await rule('Karte: nur bekannte Eigenschaften gelangen ins CSSOM', (host) => {
    const create = Range.prototype.createContextualFragment;
    const spy = vi.spyOn(Range.prototype, 'createContextualFragment').mockImplementation(function (this: Range, html: string) {
      return create.call(this, html.replace('class="hoops-map-skip"', 'class="hoops-map-skip" data-hoops-style="color:red;left:1px"'));
    });
    mountMap(host, BASE);
    spy.mockRestore();
    const skip = host.querySelector<HTMLElement>('.hoops-map-skip')!;
    return skip.style.color === '' && skip.style.left === '1px';
  });
  await rule('Karte: initMap wendet die style-Attribute von Server-Markup über das CSSOM an', (host) => {
    host.append(document.createRange().createContextualFragment(renderMap({ ...BASE, markers: [A, B], height: 333 }, { uid: 'srv' })));
    const calls: string[] = [];
    const set = CSSStyleDeclaration.prototype.setProperty;
    const spy = vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty').mockImplementation(function (this: CSSStyleDeclaration, name: string, value: string) {
      calls.push(`${name}:${value}`);
      return set.call(this, name, value);
    });
    initMap(host, { ...BASE, markers: [A, B] });
    spy.mockRestore();
    return calls.includes('--hoops-map-h:333px') && calls.filter((c) => c.startsWith('left:')).length >= 2;
  });
  await rule('Karte: data-hoops-options ohne Prototyp-Schlüssel', (host) => {
    host.setAttribute('data-hoops', 'map');
    host.setAttribute('data-hoops-options', '{"__proto__":{"load":"auto"},"constructor":{"x":1},"prototype":{"y":2},"label":"K","markers":[]}');
    let seen: string[] = [];
    const all = initAll(document, { map: { start: (el: Element, o: object) => { seen = Object.getOwnPropertyNames(o); return initMapBlock(el, o); } } });
    all.destroy();
    return seen.includes('label') && !seen.includes('__proto__') && !seen.includes('constructor') && !seen.includes('prototype');
  });
  await rule('Karte: initAll startet die Karte nur mit start und gibt start nicht weiter', (host) => {
    host.setAttribute('data-hoops', 'map');
    host.setAttribute('data-hoops-options', '{"label":"K","markers":[]}');
    const without = initAll(document);
    let seen: string[] = [];
    const withStart = initAll(document, { map: { start: (el: Element, o: object) => { seen = Object.keys(o); return initMapBlock(el, o); }, tileUrl: '/t/{z}/{x}/{y}.png' } });
    const count = [without.count, withStart.count];
    withStart.destroy();
    return count.join() === '0,1' && !seen.includes('start') && seen.includes('tileUrl');
  });
  return R;
}

export const MAP_RULE_COUNT = 35;
