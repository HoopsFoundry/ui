// @vitest-environment jsdom
// Karte in Vanilla (js/map-vanilla.js) unter jsdom: Zwei-Klick-Platzhalter, Leaflet-Lader, Fehlerzustände, update, destroy, Mehrfach-init,
// Aufräumen von Listenern und Beobachtern, CSSOM-Styles. Leaflet ist gespielt (tests/helpers/leaflet-mock.ts); kein Netz.
import { createElement } from 'react';
import { render as reactRender, act, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initMap, mountMap, renderMap } from '../js/map-vanilla.js';
import { renderVenueCard } from '../js/render/venue-card.js';
import { MapView } from '../react/Map';
import { finishTiles, lastLayer, lastMap, reset, state } from './helpers/leaflet-mock';
import { normalize } from './helpers/render-normalize';

const A = { id: 'a', lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain', own: true };
const B = { id: 'b', lat: 49.5, lng: 8.5, label: 'Halle Süd & West', href: '/hallen/sued' };
const C = { id: 'c', lat: 49.45, lng: 8.4, label: 'Gymnasium Lindenberg' };
const BASE = { label: 'Karte der Sporthalle', markers: [A] };
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const click = (el: Element | null) => (el as HTMLElement).click();

let host: HTMLElement;
beforeEach(() => {
  reset();
  host = document.createElement('div');
  document.body.append(host);
  window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
});
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Zählt offene Listener (add minus remove) je Ziel-Art und Ereignis. */
function ledger() {
  const live = new Map<string, number>();
  const proto = EventTarget.prototype;
  const add = proto.addEventListener;
  const remove = proto.removeEventListener;
  const key = (target: unknown, type: string) => `${target === window ? 'window' : target === document ? 'document' : 'element'} ${type}`;
  vi.spyOn(proto, 'addEventListener').mockImplementation(function (this: EventTarget, type: string, listener: never, options?: never) {
    live.set(key(this, type), (live.get(key(this, type)) ?? 0) + 1);
    return add.call(this, type, listener, options);
  } as never);
  vi.spyOn(proto, 'removeEventListener').mockImplementation(function (this: EventTarget, type: string, listener: never, options?: never) {
    live.set(key(this, type), (live.get(key(this, type)) ?? 0) - 1);
    return remove.call(this, type, listener, options);
  } as never);
  return { open: () => [...live].filter(([, n]) => n !== 0) };
}

describe('Zwei-Klick-Platzhalter', () => {
  it('vor dem Klick kein Leaflet, keine Karte, keine Kachel; der Klick startet alles', async () => {
    const load = vi.fn(async () => (await import('./helpers/leaflet-mock')).default);
    mountMap(host, BASE as never, { loadLeaflet: load });
    await tick();
    expect(load).not.toHaveBeenCalled();
    expect(state.maps).toHaveLength(0);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('idle');
    click(host.querySelector('.dss-map-load'));
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('loading');
    expect(host.querySelector('.dss-map-load')).toBeNull();
    expect(host.querySelector('.dss-map-canvas')!.hasAttribute('inert')).toBe(true);
    expect(host.querySelector('.dss-map-status')!.textContent).toBe('Karte wird geladen …');
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(load).toHaveBeenCalledTimes(1);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
    expect(host.querySelector('.dss-map-canvas')!.hasAttribute('inert')).toBe(false);
    expect(host.querySelector('.dss-map-ph')).toBeNull();
    expect(host.querySelectorAll('.dss-map-zoom-btn')).toHaveLength(2);
    // Fokus auf der Kartenfläche (nur nach dem Klick des Nutzers)
    expect(document.activeElement).toBe(host.querySelector('.dss-map-canvas'));
  });
  it('load auto startet ohne Klick, ohne Fokus-Sprung', async () => {
    mountMap(host, { ...BASE, load: 'auto', tileUrl: '/t/{z}/{x}/{y}.png' } as never);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('loading');
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
    expect(document.activeElement).not.toBe(host.querySelector('.dss-map-canvas'));
    expect(lastLayer().url).toBe('/t/{z}/{x}/{y}.png');
  });
  it('die Schaltfläche tut bei ungültiger Kachel-Adresse nichts (Fehlerzustand ohne Schaltfläche)', async () => {
    mountMap(host, { ...BASE, tileUrl: 'http://tiles.example.org/{z}/{x}/{y}.png' } as never);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
    expect(host.querySelector('.dss-map-load')).toBeNull();
    expect(host.querySelector('.dss-map-status')!.textContent).toContain('konnte nicht geladen werden');
    await tick();
    expect(state.maps).toHaveLength(0);
  });
});

describe('Leaflet laden: loadLeaflet', () => {
  it('der Lader liefert das Modul; ein Global (window.L-Stil) funktioniert ebenso', async () => {
    const mock = await import('./helpers/leaflet-mock');
    mountMap(host, { ...BASE, load: 'auto' } as never, { loadLeaflet: () => Promise.resolve(mock.L) });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
  });
  it('ohne Lader gilt import("leaflet") (der Standard)', async () => {
    mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
  });
  it('ein Lader, der wirft oder Unbrauchbares liefert, ergibt den Fehlergrund import', async () => {
    for (const loader of [() => Promise.reject(new Error('404')), () => Promise.resolve(undefined), () => Promise.resolve({ nichts: 1 }), () => { throw new Error('sofort'); }]) {
      const reasons: string[] = [];
      const el = document.createElement('div');
      document.body.append(el);
      mountMap(el, { ...BASE, load: 'auto' } as never, { loadLeaflet: loader as never, onError: (r) => reasons.push(r) });
      await vi.waitFor(() => expect(reasons).toEqual(['import']));
      expect(el.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
      expect(el.querySelector('.dss-map-canvas')).toBeNull();
      expect(el.querySelector('.dss-map-status')!.textContent).toContain('konnte nicht geladen werden');
      expect(state.maps).toHaveLength(0);
    }
  });
  it('ein Lader, der keine Funktion ist, wird ignoriert (Rückfall auf import)', async () => {
    mountMap(host, { ...BASE, load: 'auto' } as never, { loadLeaflet: 'nein' as never });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
  });
});

describe('Fehlerfälle', () => {
  it('Aufbau schlägt fehl: init; Statuszeile, Platzhalter ohne Pins, Liste bleibt', async () => {
    state.throwOnMap = true;
    const reasons: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mountMap(host, { ...BASE, load: 'auto', markers: [A, B] } as never, { onError: (r) => reasons.push(r) });
    await vi.waitFor(() => expect(reasons).toEqual(['init']));
    const root = host.querySelector('.dss-map')!;
    expect(root.getAttribute('data-state')).toBe('error');
    expect(root.querySelectorAll('.dss-map-ph-pin')).toHaveLength(0);
    expect(root.querySelector('.dss-map-status')!.textContent).toContain('konnte nicht geladen werden');
    expect(root.querySelectorAll('.dss-map-item')).toHaveLength(2);
  });
  it('alle ersten Kacheln schlagen fehl: tiles; die Karte wird abgebaut', async () => {
    const reasons: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mountMap(host, { ...BASE, load: 'auto' } as never, { onError: (r) => reasons.push(r) });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const map = lastMap();
    finishTiles(lastLayer(), 'fail');
    expect(reasons).toEqual(['tiles']);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
    expect(map.isRemoved).toBe(true);
    expect(host.querySelector('.dss-map-canvas')).toBeNull();
  });
  it('eine Karte, die schon Kacheln zeigte, kippt bei späteren Kachelfehlern nicht', async () => {
    mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    finishTiles(lastLayer(), 'ok');
    finishTiles(lastLayer(), 'fail');
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
  });
  it('update wirft: Grund update, Fehlerzustand', async () => {
    const reasons: string[] = [];
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = mountMap(host, { ...BASE, load: 'auto' } as never, { onError: (r) => reasons.push(r) });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    state.throwOnView = true;
    handle.update({ ...BASE, markers: [B, C], center: [50, 9] } as never);
    expect(reasons).toEqual(['update']);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
  });
  it('eine neue Kachel-Adresse versucht es erneut; die erste ungültige zeigt den Fehler', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = mountMap(host, { ...BASE, tileUrl: 'http://x.example/{z}/{x}/{y}.png' } as never);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
    handle.update({ ...BASE, tileUrl: '/tiles/{z}/{x}/{y}.png' } as never);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('idle');
    expect(host.querySelector('.dss-map-load')).not.toBeNull();
    expect(host.querySelectorAll('.dss-map-ph-pin')).toHaveLength(1);
  });
  it('ein Handler, der wirft, kippt die Karte nicht', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mountMap(host, { ...BASE, load: 'auto' } as never, { onLoad: () => { throw new Error('Handler'); } });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
  });
});

describe('Zoom-Schaltflächen', () => {
  it('Klick ruft zoomIn und zoomOut; aria-disabled an den Grenzen, nie disabled', async () => {
    mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const [plus, minus] = [...host.querySelectorAll<HTMLElement>('.dss-map-zoom-btn')];
    const map = lastMap();
    const before = map.getZoom();
    click(plus);
    expect(map.getZoom()).toBe(before + 1);
    click(minus);
    expect(map.getZoom()).toBe(before);
    map.zoom = map.options.maxZoom;
    map.fire('zoomend');
    expect(plus.getAttribute('aria-disabled')).toBe('true');
    expect(plus.hasAttribute('disabled')).toBe(false);
    click(plus);
    expect(map.getZoom()).toBe(map.options.maxZoom);
    map.zoom = map.options.minZoom;
    map.fire('zoomend');
    expect(minus.getAttribute('aria-disabled')).toBe('true');
    expect(plus.hasAttribute('aria-disabled')).toBe(false);
    expect(plus.getAttribute('aria-controls')).toBe(host.querySelector('.dss-map-canvas')!.id);
  });
});

describe('update', () => {
  it('im Platzhalter: das Markup gleicht danach renderMap der neuen Eigenschaften', () => {
    const uid = 'u1';
    const variants: Record<string, unknown>[] = [
      { ...BASE, markers: [A, B, C] },
      { ...BASE, markers: [A, B], appLinks: ['geo', 'osm', 'route'], showList: false },
      { ...BASE, markers: [{ ...C, kind: 'seat' }, A], seatLabel: 'Geschäftsstelle', darkTiles: 'invert' },
      { ...BASE, label: 'Andere Karte', privacyNote: 'Über unseren Server.', attribution: 'Daten: OSM', height: 410, dimInDark: false, className: 'meine' },
      { ...BASE, markers: [], height: 50 },
      { ...BASE, markers: [{ id: 'x', lat: 120, lng: 0, label: 'Ungültig' }, B] },
    ];
    for (const next of variants) {
      const el = document.createElement('div');
      document.body.append(el);
      const handle = mountMap(el, BASE as never, { uid });
      handle.update(next as never);
      const actual = normalize(el.innerHTML);
      const expected = normalize(renderMap(next as never, { uid }));
      expect(actual).toBe(expected);
      handle.destroy();
      expect(el.childNodes).toHaveLength(0);
    }
  });
  it('lebendige Karte: gleiche Marker-Identität über id, Position wird gesetzt, neue Marker kommen hinzu, fehlende entfallen', async () => {
    const handle = mountMap(host, { ...BASE, load: 'auto', markers: [A, B] } as never);
    await vi.waitFor(() => expect(state.markers).toHaveLength(2));
    const [mA, mB] = state.markers;
    handle.update({ ...BASE, load: 'auto', markers: [{ ...A, lat: 49.49 }, C] } as never);
    expect(state.markers[0]).toBe(mA);
    expect(mA.latlngs).toEqual([[49.4875, 8.466], [49.49, 8.466]]);
    expect(mB.isRemoved).toBe(true);
    expect(state.markers).toHaveLength(3);
    expect(host.querySelectorAll('.dss-map-item')).toHaveLength(2);
    expect(lastMap().isRemoved).toBe(false);
    expect(state.maps).toHaveLength(1);
  });
  it('interactive, center, zoom, tileUrl werden an die Karte weitergereicht, ohne Neuaufbau', async () => {
    const handle = mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    handle.update({ ...BASE, load: 'auto', interactive: false, center: [50, 9], zoom: 12, tileUrl: '/neu/{z}/{x}/{y}.png' } as never);
    const map = lastMap();
    expect(map.dragging.enabled).toBe(false);
    expect(map.view.at(-1)).toMatchObject({ center: [50, 9], zoom: 12 });
    expect(lastLayer().url).toBe('/neu/{z}/{x}/{y}.png');
    expect(state.maps).toHaveLength(1);
  });
  it('der Fokus in der Liste bleibt bei einer Aktualisierung (derselbe Link an derselben Stelle)', () => {
    const handle = mountMap(host, { ...BASE, markers: [B, C] } as never);
    const link = host.querySelector<HTMLElement>('.dss-map-item a.dss-link')!;
    link.focus();
    expect(document.activeElement).toBe(link);
    handle.update({ ...BASE, markers: [B, C, A] } as never);
    expect(document.activeElement?.tagName).toBe('A');
    expect(host.querySelector('.dss-map-item a.dss-link')).toBe(document.activeElement);
  });
  it('gleiche Liste: kein Ersetzen (der Link bleibt dasselbe Element)', () => {
    const handle = mountMap(host, { ...BASE, markers: [B, C] } as never);
    const link = host.querySelector('.dss-map-item a.dss-link');
    handle.update({ ...BASE, markers: [B, C] } as never);
    expect(host.querySelector('.dss-map-item a.dss-link')).toBe(link);
  });
});

describe('destroy und Aufräumen', () => {
  it('baut Karte, Listener und Beobachter ab; der Behälter ist wieder, wie er war', async () => {
    const observers: { observed: Element[]; disconnected: boolean }[] = [];
    vi.stubGlobal('ResizeObserver', class {
      rec = { observed: [] as Element[], disconnected: false };
      constructor() { observers.push(this.rec); }
      observe(el: Element) { this.rec.observed.push(el); }
      unobserve() {}
      disconnect() { this.rec.disconnected = true; }
    });
    host.append('vorher');
    const l = ledger();
    const handle = mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(observers).toHaveLength(1);
    expect(observers[0].observed).toHaveLength(1);
    handle.destroy();
    expect(observers[0].disconnected).toBe(true);
    expect(lastMap().isRemoved).toBe(true);
    expect(host.textContent).toBe('vorher');
    expect(host.children).toHaveLength(0);
    expect(l.open()).toEqual([]);
    // mehrfach aufrufbar, update danach ohne Wirkung
    handle.destroy();
    handle.update({ ...BASE, markers: [B] } as never);
    expect(host.children).toHaveLength(0);
  });
  it('destroy im Platzhalter-Zustand: keine Listener übrig', () => {
    const l = ledger();
    const handle = mountMap(host, BASE as never);
    handle.destroy();
    expect(l.open()).toEqual([]);
    expect(host.childNodes).toHaveLength(0);
  });
  it('Unmount während des Imports: es entsteht keine Karte, kein Fehler', async () => {
    let release!: (value: unknown) => void;
    const errors: string[] = [];
    const handle = mountMap(host, { ...BASE, load: 'auto' } as never, {
      loadLeaflet: () => new Promise((resolve) => { release = resolve; }),
      onError: (r) => errors.push(r),
    });
    handle.destroy();
    release((await import('./helpers/leaflet-mock')).default);
    await tick();
    await tick();
    expect(state.maps).toHaveLength(0);
    expect(errors).toEqual([]);
    expect(host.childNodes).toHaveLength(0);
  });
  it('Unmount während des Imports nach Klick, dann Remount: nur eine Karte', async () => {
    const resolvers: ((value: unknown) => void)[] = [];
    const loader = () => new Promise((resolve) => resolvers.push(resolve));
    const first = mountMap(host, BASE as never, { loadLeaflet: loader });
    click(host.querySelector('.dss-map-load'));
    first.destroy();
    const second = mountMap(host, { ...BASE, load: 'auto' } as never, { loadLeaflet: loader });
    const L = (await import('./helpers/leaflet-mock')).default;
    resolvers.forEach((r) => r(L));
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(state.maps.filter((m) => !m.isRemoved)).toHaveLength(1);
    second.destroy();
    expect(state.maps.every((m) => m.isRemoved)).toBe(true);
  });
});

describe('Mehrfach-init (idempotent)', () => {
  it('mountMap zweimal am selben Behälter: die erste Fassung wird abgebaut', async () => {
    const first = mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const second = mountMap(host, { ...BASE, load: 'auto', label: 'Neu' } as never);
    expect(state.maps[0].isRemoved).toBe(true);
    await vi.waitFor(() => expect(state.maps).toHaveLength(2));
    expect(host.querySelectorAll('.dss-map')).toHaveLength(1);
    expect(host.querySelector('[role="region"]')!.getAttribute('aria-label')).toBe('Neu');
    first.destroy();
    expect(state.maps[1].isRemoved).toBe(false);
    second.destroy();
    expect(state.maps[1].isRemoved).toBe(true);
  });
  it('initMap zweimal auf demselben Markup: ein Klick-Listener, eine Karte', async () => {
    host.append(document.createRange().createContextualFragment(renderMap(BASE as never)));
    const l = ledger();
    const first = initMap(host, BASE as never);
    const second = initMap(host, BASE as never);
    expect(l.open().filter(([k]) => k.includes('click'))).toEqual([['element click', 1]]);
    click(host.querySelector('.dss-map-load'));
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    first.destroy();
    expect(state.maps[0].isRemoved).toBe(false);
    second.destroy();
    expect(state.maps[0].isRemoved).toBe(true);
    expect(l.open()).toEqual([]);
  });
});

describe('initMap auf vorhandenem Markup', () => {
  it('Server-Markup: Schaltfläche der Hallenkarte wird bedienbar, destroy stellt Markup und Sperre wieder her', async () => {
    host.append(document.createRange().createContextualFragment(renderVenueCard({ name: 'Halle', lat: 49.3, lng: 7.9 } as never, { uid: 'v1' })));
    const button = host.querySelector<HTMLButtonElement>('.dss-map-load')!;
    expect(button.disabled).toBe(true);
    const before = host.innerHTML;
    const handle = initMap(host.querySelector('.dss-venue-map')!, { markers: [{ id: 'halle', lat: 49.3, lng: 7.9, label: 'Halle' }], interactive: false, showList: false, appLinks: [] } as never);
    const live = host.querySelector<HTMLButtonElement>('.dss-map-load')!;
    expect(live.disabled).toBe(false);
    expect(live.hasAttribute('aria-disabled')).toBe(false);
    click(live);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    expect(lastMap().dragging.enabled).toBe(false);
    handle.destroy();
    expect(host.innerHTML).toBe(before);
    expect(host.querySelector<HTMLButtonElement>('.dss-map-load')!.disabled).toBe(true);
  });
  it('ohne Karten-Markup: kein Fehler, nichts passiert', () => {
    host.append('nichts');
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handle = initMap(host, BASE as never);
    expect(() => { handle.update(BASE as never); handle.destroy(); }).not.toThrow();
    expect(host.textContent).toBe('nichts');
    expect(initMap(null as never, BASE as never).destroy).toBeTypeOf('function');
  });
  it('load im Markup (auto) ohne load in den Optionen: startet sofort', async () => {
    host.append(document.createRange().createContextualFragment(renderMap({ ...BASE, load: 'auto' } as never)));
    initMap(host, { markers: [A] } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
  });
});

describe('Styles über das CSSOM (CSP style-src ohne unsafe-inline)', () => {
  it('mountMap setzt kein style-Attribut per Markup oder setAttribute; Pins und Höhe stehen im CSSOM', async () => {
    const fragments: string[] = [];
    const create = Range.prototype.createContextualFragment;
    vi.spyOn(Range.prototype, 'createContextualFragment').mockImplementation(function (this: Range, html: string) {
      fragments.push(html);
      return create.call(this, html);
    });
    const styleWrites: string[] = [];
    const set = Element.prototype.setAttribute;
    vi.spyOn(Element.prototype, 'setAttribute').mockImplementation(function (this: Element, name: string, value: string) {
      if (name.toLowerCase() === 'style') styleWrites.push(value);
      return set.call(this, name, value);
    });
    mountMap(host, { ...BASE, markers: [A, B], height: 300 } as never);
    expect(fragments.length).toBeGreaterThan(0);
    for (const html of fragments) expect(html).not.toMatch(/\sstyle="/);
    expect(styleWrites).toEqual([]);
    const root = host.querySelector<HTMLElement>('.dss-map')!;
    expect(root.style.getPropertyValue('--hoops-map-h')).toBe('300px');
    const pins = [...host.querySelectorAll<HTMLElement>('.dss-map-ph-pin')];
    expect(pins).toHaveLength(2);
    for (const pin of pins) {
      expect(pin.style.left).toMatch(/%$/);
      expect(pin.style.top).toMatch(/%$/);
      expect(pin.hasAttribute('data-dss-style')).toBe(false);
    }
  });
  it('update schreibt die Höhe über das CSSOM', () => {
    const handle = mountMap(host, BASE as never);
    handle.update({ ...BASE, height: 480 } as never);
    expect(host.querySelector<HTMLElement>('.dss-map')!.style.getPropertyValue('--hoops-map-h')).toBe('480px');
  });
});

describe('Parität im DOM: Vanilla gegen React (normalisiert)', () => {
  const norm = (el: Element) => normalize(el.innerHTML);
  const scenarios: Record<string, Record<string, unknown>> = {
    'Platzhalter': BASE,
    'mehrere Orte': { ...BASE, markers: [A, B, C], appLinks: ['osm', 'geo', 'route'] },
    'Vereinssitz': { ...BASE, markers: [{ ...C, kind: 'seat' }, A, B], darkTiles: 'invert' },
    'ungültige Adresse': { ...BASE, tileUrl: 'ftp://x/{z}/{x}/{y}' },
  };
  it.each(Object.entries(scenarios))('%s: idle/error', async (_name, props) => {
    const el = document.createElement('div');
    document.body.append(el);
    mountMap(el, props as never);
    const r = reactRender(createElement(MapView, props as never));
    await act(async () => { await tick(); });
    expect(norm(el)).toBe(norm(r.container));
  });
  it('geladen (ready), nach Klick: gleiche Elemente in gleicher Reihenfolge', async () => {
    const props = { ...BASE, markers: [A, B, C], tileUrl: '/t/{z}/{x}/{y}.png' };
    const el = document.createElement('div');
    document.body.append(el);
    mountMap(el, props as never);
    click(el.querySelector('.dss-map-load'));
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const r = reactRender(createElement(MapView, props as never));
    await act(async () => { click(r.container.querySelector('.dss-map-load')); await tick(); await tick(); });
    await vi.waitFor(() => expect(r.container.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready'));
    // Marker-DOM der gespielten Karte hängt in der Kartenfläche (gleich in beiden); die Struktur drumherum muss gleich sein
    expect(norm(el)).toBe(norm(r.container));
  });
  it('loading (load auto, vor Leaflet): gleiches Markup wie React', async () => {
    const props = { ...BASE, load: 'auto', tileUrl: '/t/{z}/{x}/{y}.png' };
    const el = document.createElement('div');
    document.body.append(el);
    mountMap(el, props as never, { loadLeaflet: () => new Promise(() => {}) });
    const r = reactRender(createElement(MapView, props as never));
    expect(norm(el)).toBe(norm(r.container));
  });
});

describe('Register über Kopien hinweg', () => {
  it('zwei geladene Kopien von map-vanilla.js: das zweite init ersetzt das erste, die Karte der ersten wird abgebaut', async () => {
    const { loadMap } = await import('./helpers/map-vanilla-rules');
    const { read } = await import('./helpers/mutation');
    const first = await loadMap();
    const second = await loadMap({ file: 'js/map-vanilla.js', source: `${read('js/map-vanilla.js')}\n// zweite Kopie` });
    expect(first.vanilla.initMap).not.toBe(second.vanilla.initMap);
    host.append(document.createRange().createContextualFragment(renderMap({ ...BASE, load: 'auto' } as never)));
    first.vanilla.initMap(host, { ...BASE, load: 'auto' });
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    const h2 = second.vanilla.initMap(host, { ...BASE, load: 'auto' });
    expect(state.maps[0].isRemoved).toBe(true);
    await vi.waitFor(() => expect(state.maps).toHaveLength(2));
    h2.destroy();
    expect(state.maps[1].isRemoved).toBe(true);
  });
});

describe('Zweimal init auf demselben Server-Markup (die Karte lebt im sichtbaren DOM)', () => {
  it('renderMap + initMap zweimal: nach dem Klick steht genau ein .leaflet-container im Dokument, kein Aufbau im abgehängten Knoten', async () => {
    host.append(document.createRange().createContextualFragment(renderMap(BASE as never)));
    initMap(host, BASE as never);
    initMap(host, BASE as never);
    click(host.querySelector('.dss-map-load'));
    await vi.waitFor(() => expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready'));
    expect(host.querySelectorAll('.leaflet-container')).toHaveLength(1);
    expect(host.querySelector('.dss-map-canvas')!.classList.contains('leaflet-container')).toBe(true);
    expect(state.detached).toBe(0);
    expect(host.querySelectorAll('.dss-map-zoom-btn')).toHaveLength(2);
  });
  it('renderVenueCard(init) + initAll zweimal: die Schaltfläche ist bedienbar und die Karte entsteht im Dokument', async () => {
    const { initAll } = await import('../js/vanilla-core.js');
    const { initMapBlock } = await import('../js/map-vanilla.js');
    host.append(document.createRange().createContextualFragment(renderVenueCard({ name: 'Halle', lat: 49.3, lng: 7.9 } as never, { init: true, uid: 'm1' })));
    const options = { map: { start: initMapBlock } };
    initAll(document, options);
    const second = initAll(document, options);
    const button = host.querySelector<HTMLButtonElement>('.dss-map-load')!;
    expect(button.disabled).toBe(false);
    click(button);
    await vi.waitFor(() => expect(host.querySelectorAll('.leaflet-container')).toHaveLength(1));
    expect(state.detached).toBe(0);
    second.destroy();
    expect(host.querySelector<HTMLButtonElement>('.dss-map-load')!.disabled).toBe(true);
  });
  it('mountMap zweimal und mountVenueCard zweimal mit initMap: je eine lebendige Karte im Dokument', async () => {
    mountMap(host, { ...BASE, load: 'auto' } as never);
    mountMap(host, { ...BASE, load: 'auto' } as never);
    await vi.waitFor(() => expect(host.querySelectorAll('.leaflet-container')).toHaveLength(1));
    const other = document.createElement('div');
    document.body.append(other);
    const { mountVenueCard } = await import('../js/render/venue-card.js');
    mountVenueCard(other, { name: 'H', lat: 49.3, lng: 7.9, load: 'auto' } as never, { initMap });
    mountVenueCard(other, { name: 'H', lat: 49.3, lng: 7.9, load: 'auto' } as never, { initMap });
    await vi.waitFor(() => expect(other.querySelectorAll('.leaflet-container')).toHaveLength(1));
    expect(state.detached).toBe(0);
  });
});

describe('update mit Teilen (kein stiller Rückfall auf den Standardserver)', () => {
  it('Proxy-tileUrl, load auto, update({ label }): Kachel-Adresse, Marker, Mitte bleiben; es gibt nie eine Anfrage an den OSM-Server', async () => {
    const handle = mountMap(host, { ...BASE, markers: [A, B], load: 'auto', tileUrl: '/proxy/{z}/{x}/{y}.png', center: [50, 9], zoom: 12, appLinks: ['geo'] } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    handle.update({ label: 'Neuer Name' });
    expect(host.querySelector('[role="region"]')!.getAttribute('aria-label')).toBe('Neuer Name');
    expect(state.layers[0].urls).toEqual(['/proxy/{z}/{x}/{y}.png']);
    expect(state.layers.every((l) => l.urls.every((u) => !u.includes('openstreetmap')))).toBe(true);
    expect(state.markers.filter((m) => !m.isRemoved)).toHaveLength(2);
    expect(host.querySelectorAll('.dss-map-item')).toHaveLength(2);
    expect(host.querySelector('.dss-map-links a')!.getAttribute('href')).toMatch(/^geo:/);
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready');
    expect(lastMap().view.at(-1)).toMatchObject({ center: [50, 9], zoom: 12 });
  });
  it('undefined wird ignoriert, null nimmt zurück (Standard), die Adresse wird erst dann der Standard', async () => {
    const handle = mountMap(host, { ...BASE, load: 'auto', tileUrl: '/proxy/{z}/{x}/{y}.png' } as never);
    await vi.waitFor(() => expect(state.maps).toHaveLength(1));
    handle.update({ tileUrl: undefined, zoom: 10 });
    expect(lastLayer().url).toBe('/proxy/{z}/{x}/{y}.png');
    handle.update({ tileUrl: null });
    expect(lastLayer().url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
});

describe('Verhalten (nicht nur Quelltextmuster)', () => {
  it('Importfehler, dann update mit neuer tileUrl: der Fehler ist weg und loadLeaflet läuft erneut', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockL = (await import('./helpers/leaflet-mock')).default;
    let calls = 0;
    const loader = () => (++calls === 1 ? Promise.reject(new Error('404')) : Promise.resolve(mockL));
    const errors: string[] = [];
    const handle = mountMap(host, { ...BASE, load: 'auto', tileUrl: '/a/{z}/{x}/{y}.png' } as never, { loadLeaflet: loader, onError: (r) => errors.push(r) });
    await vi.waitFor(() => expect(errors).toEqual(['import']));
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('error');
    // gleiche Adresse: bleibt im Fehler, der Lader wird nicht erneut gerufen
    handle.update({ label: 'Name' });
    expect(calls).toBe(1);
    handle.update({ tileUrl: '/b/{z}/{x}/{y}.png' });
    await vi.waitFor(() => expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('ready'));
    expect(calls).toBe(2);
    expect(lastLayer().url).toBe('/b/{z}/{x}/{y}.png');
    expect(host.querySelector('.dss-map-status')!.textContent).toBe('');
  });
  it('hängender Lader: die Karte bleibt im Zustand „Laden“, ohne Fehler und ohne Karte', async () => {
    const errors: string[] = [];
    mountMap(host, { ...BASE, load: 'auto' } as never, { loadLeaflet: () => new Promise(() => {}), onError: (r) => errors.push(r) });
    await tick();
    await tick();
    expect(host.querySelector('.dss-map')!.getAttribute('data-state')).toBe('loading');
    expect(host.querySelector('.dss-map-status')!.textContent).toBe('Karte wird geladen …');
    expect(errors).toEqual([]);
    expect(state.maps).toHaveLength(0);
  });
  it('Vereinssitz zählt nicht mit: Liste, Pins im Platzhalter und Marker der Karte nummerieren die Orte von 1 an', async () => {
    const handle = mountMap(host, { label: 'K', markers: [{ ...C, kind: 'seat' }, A, B], load: 'auto' } as never);
    expect([...host.querySelectorAll('.dss-map-ph-pin')].map((p) => p.textContent)).toEqual(['', '1', '2']);
    await vi.waitFor(() => expect(state.markers).toHaveLength(3));
    expect([...host.querySelectorAll('.dss-map-item')].map((li) => li.querySelector('.dss-map-num')?.textContent)).toEqual(['', '1', '2']);
    expect(state.markers.map((m) => m.options.title)).toEqual(['Gymnasium Lindenberg, Vereinssitz', '1, Sporthalle Nordhain', '2, Halle Süd & West']);
    handle.destroy();
  });
  it('Style-Whitelist und reapplyStyles: nur left, top, width und --hoops-map-h gelangen ins CSSOM', async () => {
    const { insertMarkup, reapplyStyles } = await import('../js/render/dom.js');
    const box = document.createElement('div');
    insertMarkup(box, '<span id="a" style="left:10%;top:20%;color:red;background:url(javascript:1);width:5px;--hoops-map-h:300px;--evil:1"></span><i id="b" style="left:calc(1px + 2px)"></i>');
    const a = box.querySelector<HTMLElement>('#a')!;
    expect([a.style.left, a.style.top, a.style.width, a.style.getPropertyValue('--hoops-map-h')]).toEqual(['10%', '20%', '5px', '300px']);
    expect(a.style.color).toBe('');
    expect(a.style.getPropertyValue('--evil')).toBe('');
    expect(a.style.background).toBe('');
    expect(box.querySelector<HTMLElement>('#b')!.style.left).toBe('');
    // reapplyStyles: die Attribute eines vorhandenen Baums werden über das CSSOM (erneut) angewendet, nur bekannte Eigenschaften
    const calls: string[] = [];
    const set = CSSStyleDeclaration.prototype.setProperty;
    vi.spyOn(CSSStyleDeclaration.prototype, 'setProperty').mockImplementation(function (this: CSSStyleDeclaration, name: string, value: string) {
      calls.push(name);
      return set.call(this, name, value);
    });
    const server = document.createElement('div');
    server.setAttribute('style', '--hoops-map-h:410px;color:blue');
    const pin = document.createElement('span');
    pin.setAttribute('style', 'left:30%;top:40%;position:fixed');
    server.append(pin);
    reapplyStyles(server);
    expect(calls.sort()).toEqual(['--hoops-map-h', 'left', 'top']);
  });
});
