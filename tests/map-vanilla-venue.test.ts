// @vitest-environment jsdom
// Hallenkarte und initAll mit der Karte in Vanilla: mountVenueCard startet die eingebettete Karte über `initMap`, das Update lässt die
// laufende Karte stehen, destroy räumt alles auf; `data-dss="map"` (initAll) mit JSON-Optionen. Leaflet ist gespielt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initMap, initMapBlock, renderMap } from '../js/map-vanilla.js';
import { mountVenueCard, renderVenueCard } from '../js/render/venue-card.js';
import { initAll } from '../js/vanilla-core.js';
import { lastMap, reset, state } from './helpers/leaflet-mock';

const HALLE = { name: 'Sporthalle Nordhain', lat: 49.3, lng: 7.9, address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, tileUrl: '/tiles/{z}/{x}/{y}.png' };
const click = (el: Element | null) => (el as HTMLElement).click();
let host: HTMLElement;
beforeEach(() => {
  reset();
  host = document.createElement('div');
  document.body.append(host);
  window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('mountVenueCard mit initMap', () => {
  it('„Karte laden“ ist bedienbar und startet eine nicht interaktive Karte mit einem Marker', async () => {
    const h = mountVenueCard(host, HALLE as never, { initMap });
    const button = host.querySelector<HTMLButtonElement>('.dss-map-load')!;
    expect(button.disabled).toBe(false);
    expect(button.hasAttribute('aria-disabled')).toBe(false);
    expect(state.maps).toHaveLength(0);
    click(button);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const map = lastMap();
    expect(map.dragging.enabled).toBe(false);
    expect(map.scrollWheelZoom.enabled).toBe(false);
    expect(state.markers).toHaveLength(1);
    expect(state.markers[0].options.title).toBe('Sporthalle Nordhain');
    expect(host.querySelector('.dss-venue-map .dss-map')!.getAttribute('data-state')).toBe('ready');
    expect(host.querySelectorAll('.dss-venue-maplinks a')).toHaveLength(2);
    h.destroy();
  });
  it('load auto startet ohne Klick; die Kachel-Adresse der Halle gilt', async () => {
    mountVenueCard(host, { ...HALLE, load: 'auto' } as never, { initMap });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(state.layers[0].url).toBe('/tiles/{z}/{x}/{y}.png');
  });
  it('ohne initMap bleibt die Schaltfläche gesperrt und nichts startet', async () => {
    mountVenueCard(host, HALLE as never);
    expect(host.querySelector<HTMLButtonElement>('.dss-map-load')!.disabled).toBe(true);
    click(host.querySelector('.dss-map-load'));
    await new Promise((r) => setTimeout(r, 0));
    expect(state.maps).toHaveLength(0);
  });
  it('loadLeaflet, onLoad und onError der Optionen kommen bei initMap an', async () => {
    const mock = await import('./helpers/leaflet-mock');
    const load = vi.fn(() => Promise.resolve(mock.L));
    const onLoad = vi.fn();
    mountVenueCard(host, { ...HALLE, load: 'auto' } as never, { initMap, loadLeaflet: load, onLoad });
    await vi.waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
    expect(load).toHaveBeenCalledTimes(1);
    const reasons: string[] = [];
    const other = document.createElement('div');
    document.body.append(other);
    mountVenueCard(other, { ...HALLE, load: 'auto' } as never, { initMap, loadLeaflet: () => Promise.reject(new Error('x')), onError: (r: string) => reasons.push(r) });
    await vi.waitFor(() => expect(reasons).toEqual(['import']));
    expect(other.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
    expect(other.querySelector('.dss-venue-body')).not.toBeNull();
  });
  it('update mit gleichem Ort und Namen lässt die laufende Karte stehen (dieselbe Karte, dasselbe Element)', async () => {
    const h = mountVenueCard(host, { ...HALLE, load: 'auto' } as never, { initMap });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const canvas = host.querySelector('.dss-map-canvas');
    const live = host.querySelector('.dss-venue-map');
    h.update({ ...HALLE, load: 'auto', info: 'Zwei Spielfelder.', contact: { name: 'Jonas Weide' } } as never);
    expect(host.querySelector('.dss-venue-info')!.textContent).toBe('Zwei Spielfelder.');
    expect(host.querySelector('.dss-venue-map')).toBe(live);
    expect(host.querySelector('.dss-map-canvas')).toBe(canvas);
    expect(state.maps).toHaveLength(1);
    expect(lastMap().isRemoved).toBe(false);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
  });
  it('update mit neuem Ort baut eine neue Karte, die alte wird entfernt; ohne Koordinaten entfällt die Karte', async () => {
    const h = mountVenueCard(host, { ...HALLE, load: 'auto' } as never, { initMap });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    h.update({ ...HALLE, load: 'auto', lat: 49.31, lng: 7.91 } as never);
    expect(state.maps[0].isRemoved).toBe(true);
    await vi.waitFor(() => expect(state.maps).toHaveLength(2));
    expect(state.maps[1].isRemoved).toBe(false);
    h.update({ name: 'Sporthalle Nordhain' } as never);
    expect(state.maps[1].isRemoved).toBe(true);
    expect(host.querySelector('.dss-venue-map')).toBeNull();
    h.update({ ...HALLE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(3));
  });
  it('destroy räumt die Karte und das Markup auf; ein zweites mountVenueCard ersetzt das erste samt Karte', async () => {
    host.append('vorher');
    const first = mountVenueCard(host, { ...HALLE, load: 'auto' } as never, { initMap });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const second = mountVenueCard(host, { ...HALLE, load: 'auto', name: 'Andere Halle' } as never, { initMap });
    expect(state.maps[0].isRemoved).toBe(true);
    await vi.waitFor(() => expect(state.maps).toHaveLength(2));
    first.destroy();
    expect(state.maps[1].isRemoved).toBe(false);
    second.destroy();
    expect(state.maps[1].isRemoved).toBe(true);
    expect(host.textContent).toBe('vorher');
    second.update(HALLE as never);
    expect(host.textContent).toBe('vorher');
  });
});

describe('initAll: data-dss="map"', () => {
  const optionsOf = (extra: object = {}) => JSON.stringify({ label: 'Karte der Halle', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Halle' }], ...extra });

  it('ein leerer Behälter wird zur Karte (mountMap), die Optionen kommen aus data-dss-options', async () => {
    host.setAttribute('data-dss', 'map');
    host.setAttribute('data-dss-options', optionsOf({ tileUrl: '/t/{z}/{x}/{y}.png', load: 'auto' }));
    const all = initAll(document, { map: { start: initMapBlock } });
    expect(all.count).toBe(1);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(state.layers[0].url).toBe('/t/{z}/{x}/{y}.png');
    expect(host.querySelector('[role="region"]')!.getAttribute('aria-label')).toBe('Karte der Halle');
    all.destroy();
    expect(state.maps[0].isRemoved).toBe(true);
    expect(host.children).toHaveLength(0);
  });
  it('vorhandenes Markup (renderMap) wird per initMap gestartet; der Behälter behält sein Markup', async () => {
    host.setAttribute('data-dss', 'map');
    host.setAttribute('data-dss-options', optionsOf());
    host.append(document.createRange().createContextualFragment(renderMap({ label: 'Karte der Halle', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Halle' }] } as never, { uid: 's1' })));
    const before = host.querySelector('.dss-map');
    const all = initAll(document, { map: { start: initMapBlock } });
    click(host.querySelector('.dss-map-load'));
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(host.querySelector('.dss-map')).toBe(before);
    all.destroy();
  });
  it('die Hallenkarte vom Server (init: true) wird durch initAll lebendig', async () => {
    host.append(document.createRange().createContextualFragment(renderVenueCard(HALLE as never, { init: true, uid: 'h1' })));
    const wrapper = host.querySelector('.dss-venue-map')!;
    expect(wrapper.getAttribute('data-dss')).toBe('map');
    const options = JSON.parse(wrapper.getAttribute('data-dss-options')!);
    expect(options).toMatchObject({ interactive: false, showList: false, appLinks: [], load: 'click', tileUrl: '/tiles/{z}/{x}/{y}.png' });
    expect(options.markers).toEqual([{ id: 'halle', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain' }]);
    // ohne Anbindung bleibt sie gesperrt
    expect(host.querySelector<HTMLButtonElement>('.dss-map-load')!.disabled).toBe(true);
    const all = initAll(document, { map: { start: initMapBlock } });
    expect(host.querySelector<HTMLButtonElement>('.dss-map-load')!.disabled).toBe(false);
    click(host.querySelector('.dss-map-load'));
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(lastMap().dragging.enabled).toBe(false);
    all.destroy();
    expect(host.querySelector<HTMLButtonElement>('.dss-map-load')!.disabled).toBe(true);
  });
  it('ohne start bleibt ein Element mit data-dss="map" unberührt', () => {
    host.setAttribute('data-dss', 'map');
    host.setAttribute('data-dss-options', optionsOf());
    const all = initAll(document);
    expect(all.count).toBe(0);
    expect(host.children).toHaveLength(0);
  });
  it('Prototyp-Schlüssel in data-dss-options werden verworfen (kein load auto, keine geerbten Werte)', async () => {
    host.setAttribute('data-dss', 'map');
    host.setAttribute('data-dss-options', '{"__proto__":{"load":"auto"},"constructor":{"prototype":{"load":"auto"}},"label":"K","markers":[{"id":"a","lat":49.3,"lng":7.9,"label":"H"}]}');
    initAll(document, { map: { start: initMapBlock } });
    await new Promise((r) => setTimeout(r, 0));
    expect(state.maps).toHaveLength(0);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('idle');
    expect(({} as Record<string, unknown>).load).toBeUndefined();
  });
  it('kaputtes JSON: leere Optionen, kein Fehler (die Karte ist leer, aber da)', () => {
    host.setAttribute('data-dss', 'map');
    host.setAttribute('data-dss-options', '{kaputt');
    expect(() => initAll(document, { map: { start: initMapBlock } })).not.toThrow();
    expect(host.querySelector('.dss-map')).not.toBeNull();
  });
  it('gemeinsame Optionen (loadLeaflet) gelten für alle Karten, ohne den Schlüssel start', async () => {
    const mock = await import('./helpers/leaflet-mock');
    const load = vi.fn(() => Promise.resolve(mock.L));
    const seen: Record<string, unknown>[] = [];
    host.setAttribute('data-dss', 'map');
    host.setAttribute('data-dss-options', optionsOf({ load: 'auto' }));
    initAll(document, { map: { start: (el: Element, o: Record<string, unknown>) => { seen.push(o); return initMapBlock(el, o); }, loadLeaflet: load } } as never);
    await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    expect(seen[0]).not.toHaveProperty('start');
    expect(seen[0].loadLeaflet).toBe(load);
  });
});
