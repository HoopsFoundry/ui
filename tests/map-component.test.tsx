// @vitest-environment jsdom
// Karte (Svelte und React): Verhalten ohne Netz, Leaflet ist gespielt (tests/helpers/leaflet-mock.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupAll, drivers, reactStrictDriver, type Driver, type Mounted } from './helpers/map-drivers';
import { finishTiles, lastLayer, lastMap, reset, state } from './helpers/leaflet-mock';

const A = { id: 'a', lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain', own: true };
const B = { id: 'b', lat: 49.5, lng: 8.5, label: 'Halle Süd & West', href: '/hallen/sued' };
const C = { id: 'c', lat: 49.45, lng: 8.4, label: 'Gymnasium Lindenberg' };
const BASE = { markers: [A], label: 'Karte der Sporthalle' };

let current: Mounted | undefined;
let matches = false;
const open = (driver: Driver, props: Record<string, unknown> = {}) => (current = driver.mount({ ...BASE, ...props }));
const style = (el: Element | null) => (el?.getAttribute('style') ?? '').replace(/\s+/g, '');
const q = <T extends Element = HTMLElement>(m: Mounted, sel: string) => m.root.querySelector<T>(sel);
const qa = <T extends Element = HTMLElement>(m: Mounted, sel: string) => [...m.root.querySelectorAll<T>(sel)];
const click = async (m: Mounted, el: Element | null) => { await m.act(() => (el as HTMLElement).click()); };
const loadMap = async (m: Mounted) => { await click(m, q(m, '.dss-map-load')); await vi.waitFor(() => expect(state.maps.length).toBeGreaterThan(0)); await m.settle(); };

beforeEach(() => {
  reset();
  matches = false;
  window.matchMedia = ((query: string) => ({ matches: query.includes('reduce') ? matches : false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
  delete document.documentElement.dataset.motion;
});
afterEach(async () => {
  await current?.unmount();
  current = undefined;
  cleanupAll();
  vi.restoreAllMocks();
});

describe.each(drivers)('Karte · $name', (driver) => {
  describe('Platzhalter (Zwei-Klick)', () => {
    it('zeigt Hinweis und Schaltfläche, lädt weder Leaflet noch Kacheln', async () => {
      const m = open(driver);
      await m.settle();
      expect(q(m, '.dss-map-load')?.textContent).toBe('Karte laden');
      expect(q(m, '.dss-map-note')?.textContent).toBe('Beim Laden der Karte erhält der Kartendienst deine IP-Adresse.');
      expect(q(m, '.dss-map-canvas')).toBeNull();
      expect(state.maps).toHaveLength(0);
      expect(state.layers).toHaveLength(0);
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('idle');
    });
    it('privacyNote ersetzt den Hinweis', async () => {
      const m = open(driver, { privacyNote: 'Die Karte kommt über unseren Server.' });
      expect(q(m, '.dss-map-note')?.textContent).toBe('Die Karte kommt über unseren Server.');
    });
    it('Region mit Namen, „Karte überspringen“ führt zur Liste, Quellenangabe sichtbar und verlinkt', async () => {
      const m = open(driver);
      const region = q(m, '[role="region"]')!;
      expect(region.getAttribute('aria-label')).toBe('Karte der Sporthalle');
      const skip = q<HTMLAnchorElement>(m, '.dss-map-skip')!;
      expect(skip.textContent).toBe('Karte überspringen');
      const target = q(m, `[id="${skip.getAttribute('href')!.slice(1)}"]`);
      expect(target).not.toBeNull();
      expect(target!.querySelector('ol')).not.toBeNull();
      // die Sprungmarke steht vor der Karte, das Ziel danach
      expect(skip.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(region.compareDocumentPosition(target!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      const attr = q<HTMLAnchorElement>(m, '.dss-map-attr a')!;
      expect(attr.textContent).toBe('© OpenStreetMap-Mitwirkende');
      expect(attr.getAttribute('href')).toBe('https://www.openstreetmap.org/copyright');
    });
    it('Pins im Platzhalter sind für Hilfstechnik verborgen', async () => {
      const m = open(driver, { markers: [A, B, C] });
      const pins = qa(m, '.dss-map-ph-pin');
      expect(pins.map((p) => p.textContent)).toEqual(['1', '2', '3']);
      expect(pins.every((p) => p.getAttribute('aria-hidden') === 'true')).toBe(true);
    });
  });

  describe('Textalternative', () => {
    it('nummerierte Liste mit Name, Koordinaten und Links (Standard osm, route)', async () => {
      const m = open(driver, { markers: [A, B] });
      const items = qa(m, '.dss-map-item');
      expect(items).toHaveLength(2);
      expect(items[0].querySelector('.dss-map-name')?.textContent).toContain('Sporthalle Nordhain');
      expect(items[0].querySelector('.dss-map-coords')?.textContent).toBe('49,4875° N, 8,4660° O');
      expect(items[0].querySelector('.dss-map-num')?.textContent).toBe('1');
      const links = [...items[1].querySelectorAll<HTMLAnchorElement>('.dss-map-links a')];
      expect(links.map((a) => a.firstChild?.textContent)).toEqual(['In OpenStreetMap öffnen', 'Route planen']);
      expect(links[0].getAttribute('href')).toBe('https://www.openstreetmap.org/?mlat=49.5&mlon=8.5#map=17/49.5/8.5');
      expect(links[1].getAttribute('href')).toBe('https://www.openstreetmap.org/directions?route=%3B49.5%2C8.5');
      // der Name enthält den Ort, damit mehrere gleiche Linktexte unterscheidbar sind
      expect(links[1].textContent).toBe('Route planen, Halle Süd & West');
      // href am Marker macht den Namen zum Link
      expect(items[1].querySelector('.dss-map-name a')?.getAttribute('href')).toBe('/hallen/sued');
      expect(items[0].querySelector('.dss-map-name a')).toBeNull();
    });
    it('appLinks wählt die Links; geo ergibt einen geo:-Link mit kodierter Bezeichnung', async () => {
      const m = open(driver, { markers: [B], appLinks: ['geo', 'route'] });
      const links = qa<HTMLAnchorElement>(m, '.dss-map-links a');
      expect(links.map((a) => a.firstChild?.textContent)).toEqual(['In Karten-App öffnen', 'Route planen']);
      expect(links[0].getAttribute('href')).toBe('geo:49.5,8.5?q=49.5,8.5(Halle%20S%C3%BCd%20%26%20West)');
    });
    it('ein Marker hat keine Nummer; eigene Nummer und eigener Ort werden angezeigt', async () => {
      const m = open(driver, { markers: [{ ...A, number: 7 }] });
      expect(q(m, '.dss-map-num')?.textContent).toBe('7');
      expect(q(m, '.dss-map-num')?.classList.contains('is-own')).toBe(true);
      expect(q(m, '.dss-map-name .dss-chip')?.textContent).toBe('Eigener Ort');
      await current!.set({ markers: [{ ...A, number: undefined, own: false }] });
      expect(q(m, '.dss-map-num')).toBeNull();
    });
    it('showList=false: Liste nur für Hilfstechnik (Klasse is-quiet), ohne Links, aber mit Koordinaten', async () => {
      const m = open(driver, { showList: false });
      expect(q(m, '.dss-map-text')?.classList.contains('is-quiet')).toBe(true);
      expect(q(m, '.dss-map-coords')?.textContent).toBe('49,4875° N, 8,4660° O');
      expect(q(m, '.dss-map-links')).toBeNull();
    });
    it('ungültige Marker erscheinen weder in der Liste noch auf der Karte', async () => {
      const m = open(driver, { markers: [A, { id: 'x', lat: 999, lng: 0, label: 'Kaputt' }] });
      expect(qa(m, '.dss-map-item')).toHaveLength(1);
      await loadMap(m);
      expect(state.markers).toHaveLength(1);
    });
    it('ohne Marker bleibt eine leere Liste, die Karte zeigt Deutschland', async () => {
      const m = open(driver, { markers: [], load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      expect(qa(m, '.dss-map-item')).toHaveLength(0);
      expect(lastMap().view[0]).toMatchObject({ center: [51.1657, 10.4515], zoom: 5 });
    });
  });

  describe('Karte laden', () => {
    it('Klick lädt Leaflet, baut die Karte und zeigt Zoom-Schaltflächen, der Platzhalter verschwindet', async () => {
      const m = open(driver);
      await loadMap(m);
      expect(state.maps).toHaveLength(1);
      const options = lastMap().options;
      expect(options).toMatchObject({ zoomControl: false, attributionControl: false, minZoom: 3, maxZoom: 19, keyboard: true });
      expect(lastLayer().url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(lastLayer().options.className).toBe('dss-map-tiles');
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('ready');
      expect(q(m, '.dss-map-ph')).toBeNull();
      expect(qa(m, '.dss-map-zoom-btn').map((b) => b.getAttribute('aria-label'))).toEqual(['Vergrößern', 'Verkleinern']);
    });
    it('der Fokus geht nach dem Klick auf die Kartenfläche (die Schaltfläche verschwindet)', async () => {
      const m = open(driver);
      await loadMap(m);
      expect(document.activeElement).toBe(q(m, '.dss-map-canvas'));
    });
    it('load="auto" lädt sofort, ohne Schaltfläche', async () => {
      const m = open(driver, { load: 'auto' });
      expect(q(m, '.dss-map-load')).toBeNull();
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      await m.settle();
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('ready');
    });
    it('Während des Ladens steht der Hinweis im Status (role=status), die Fläche ist inert', async () => {
      const m = open(driver, { load: 'auto' });
      expect(q(m, '[role="status"]')?.textContent).toBe('Karte wird geladen …');
      expect(q(m, '.dss-map-canvas')?.hasAttribute('inert') || (q(m, '.dss-map-canvas') as { inert?: boolean } | null)?.inert === true).toBe(true);
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      await m.settle();
      expect(q(m, '[role="status"]')?.textContent).toBe('');
    });
    it('onload/onLoad bekommt die Leaflet-Karte', async () => {
      const spy = vi.fn();
      const m = open(driver, driver.name === 'Svelte' ? { onload: spy } : { onLoad: spy });
      await loadMap(m);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(lastMap());
    });
    it('Kachelebene und Karte erhalten eine eigene Adresse (tileUrl)', async () => {
      const m = open(driver, { tileUrl: '/tiles/{z}/{x}/{y}.png', load: 'auto' });
      await vi.waitFor(() => expect(state.layers).toHaveLength(1));
      expect(lastLayer().url).toBe('/tiles/{z}/{x}/{y}.png');
      expect(m).toBeDefined();
    });
  });

  describe('Marker', () => {
    it('Marker sind fokussierbar (keyboard), mit Titel und Namen, Pin als SVG ohne Bilddateien', async () => {
      const m = open(driver, { markers: [A, B], load: 'auto' });
      await vi.waitFor(() => expect(state.markers).toHaveLength(2));
      const [first, second] = state.markers;
      expect(first.options).toMatchObject({ keyboard: true, title: 'Sporthalle Nordhain', alt: 'Sporthalle Nordhain' });
      expect(second.options.title).toBe('Halle Süd & West');
      expect(first.el?.tabIndex).toBe(0);
      expect(first.el?.getAttribute('aria-label')).toBe('Sporthalle Nordhain');
      expect(first.el?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      expect(first.el?.querySelector('text')?.textContent).toBe('1');
      expect(first.el?.classList.contains('is-own')).toBe(true);
      expect(second.el?.classList.contains('is-own')).toBe(false);
      expect(m.root.querySelector('img')).toBeNull();
    });
    it('ein einzelner Marker zeigt einen Punkt statt einer Nummer', async () => {
      open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.markers).toHaveLength(1));
      const el = state.markers[0].el!;
      expect(el.querySelector('text')).toBeNull();
      expect(el.querySelector('circle')).not.toBeNull();
    });
    it('Enter und Leertaste am Marker öffnen das Ziel wie ein Button (Leaflet meldet Tasten nur als keypress); andere Tasten nicht', async () => {
      const spy = vi.fn();
      const m = open(driver, { markers: [A, B], load: 'auto', ...(driver.name === 'Svelte' ? { onmarkerclick: spy } : { onMarkerClick: spy }) });
      await vi.waitFor(() => expect(state.markers).toHaveLength(2));
      const press = (keyCode: number) => {
        const preventDefault = vi.fn();
        state.markers[1].fire('keypress', { originalEvent: { keyCode, preventDefault } });
        return preventDefault;
      };
      await m.act(() => { expect(press(13)).toHaveBeenCalled(); });
      await m.act(() => { expect(press(32)).toHaveBeenCalled(); });
      await m.act(() => { expect(press(65)).not.toHaveBeenCalled(); });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.mock.calls[0][0]).toMatchObject({ id: 'b', href: '/hallen/sued' });
    });
    it('Klick am Marker meldet ihn', async () => {
      const spy = vi.fn();
      const m = open(driver, { markers: [A], load: 'auto', ...(driver.name === 'Svelte' ? { onmarkerclick: spy } : { onMarkerClick: spy }) });
      await vi.waitFor(() => expect(state.markers).toHaveLength(1));
      await m.act(() => state.markers[0].fire('click'));
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toMatchObject({ id: 'a', label: 'Sporthalle Nordhain' });
    });
  });

  describe('Ausschnitt und Zoom', () => {
    it('ein Marker: Zoom 15; center und zoom per Prop; mehrere Marker passen sich an (fitBounds)', async () => {
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      expect(lastMap().view[0]).toMatchObject({ center: [49.4875, 8.466], zoom: 15 });
      await m.set({ center: [50, 9], zoom: 12 });
      expect(lastMap().view.at(-1)).toMatchObject({ center: [50, 9], zoom: 12 });
      expect(state.maps).toHaveLength(1);
      await m.set({ center: undefined, zoom: undefined, markers: [A, B, C] });
      const last = lastMap().view.at(-1)!;
      expect(last.bounds).toEqual([[49.45, 8.4], [49.5, 8.5]]);
      expect(last.options).toMatchObject({ paddingTopLeft: [56, 64], paddingBottomRight: [84, 52], maxZoom: 17 });
    });
    it('Zoom-Schaltflächen: Namen, aria-controls auf die Fläche, aria-disabled an den Grenzen, Klick zoomt', async () => {
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      await m.settle();
      const [plus, minus] = qa<HTMLButtonElement>(m, '.dss-map-zoom-btn');
      const canvas = q(m, '.dss-map-canvas')!;
      expect(plus.getAttribute('aria-controls')).toBe(canvas.id);
      expect(minus.getAttribute('aria-controls')).toBe(canvas.id);
      expect(plus.hasAttribute('aria-disabled')).toBe(false);
      await click(m, plus);
      expect(lastMap().getZoom()).toBe(16);
      for (let i = 0; i < 5; i++) await click(m, plus);
      expect(lastMap().getZoom()).toBe(19);
      expect(plus.getAttribute('aria-disabled')).toBe('true');
      await click(m, plus);
      expect(lastMap().getZoom()).toBe(19);
      for (let i = 0; i < 20; i++) await click(m, minus);
      expect(lastMap().getZoom()).toBe(3);
      expect(minus.getAttribute('aria-disabled')).toBe('true');
      expect(plus.hasAttribute('aria-disabled')).toBe(false);
    });
    it('interactive=false schaltet Gesten aus, Umschalten wirkt ohne Neuaufbau', async () => {
      const m = open(driver, { load: 'auto', interactive: false });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      const map = lastMap();
      expect(map.options.dragging).toBe(false);
      expect([map.dragging, map.touchZoom, map.scrollWheelZoom, map.doubleClickZoom, map.boxZoom].map((h) => h.enabled)).toEqual([false, false, false, false, false]);
      expect(map.options.keyboard).toBe(true);
      await m.set({ interactive: true });
      expect([map.dragging, map.scrollWheelZoom, map.doubleClickZoom].map((h) => h.enabled)).toEqual([true, true, true]);
      expect(state.maps).toHaveLength(1);
    });
  });

  describe('Bewegung reduzieren', () => {
    it('Systemeinstellung: Leaflet-Animationen aus', async () => {
      matches = true;
      open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      expect(lastMap().options).toMatchObject({ zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false, inertia: false });
    });
    it('data-motion="reduce" auf <html>: ebenfalls aus', async () => {
      document.documentElement.dataset.motion = 'reduce';
      open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      expect(lastMap().options).toMatchObject({ zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false, inertia: false });
    });
    it('ohne Einstellung bleiben die Animationen an', async () => {
      open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      expect(lastMap().options).toMatchObject({ zoomAnimation: true, fadeAnimation: true, markerZoomAnimation: true, inertia: true });
    });
    it('Wechsel des Ausschnitts animiert bei reduzierter Bewegung nicht', async () => {
      matches = true;
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      await m.set({ zoom: 10 });
      expect((lastMap().view.at(-1)!.options as { animate: boolean }).animate).toBe(false);
    });
  });

  describe('Fehlerfall', () => {
    it('ungültige tileUrl: Fehlerzustand sofort, Warnung, kein Leaflet, Textalternative bleibt', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const m = open(driver, { tileUrl: 'http://example.org/{z}/{x}/{y}.png' });
      await m.settle();
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
      expect(q(m, '[role="status"]')?.textContent).toBe('Die Karte konnte nicht geladen werden. Adresse und Route siehe unten.');
      expect(q(m, '.dss-map-load')).toBeNull();
      expect(state.maps).toHaveLength(0);
      expect(qa(m, '.dss-map-item')).toHaveLength(1);
      expect(warn.mock.calls.flat().join(' ')).toContain('Ungültige tileUrl');
    });
    it('ungültige tileUrl, auch mit load="auto": Leaflet wird nie geladen', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const m = open(driver, { tileUrl: '/tiles/{z}/{x}.png', load: 'auto' });
      await m.settle();
      expect(state.maps).toHaveLength(0);
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
    });
    it('Aufbau wirft: Fehlerhinweis, onerror meldet den Grund, die Liste bleibt', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      state.throwOnMap = true;
      const spy = vi.fn();
      const m = open(driver, { load: 'auto', ...(driver.name === 'Svelte' ? { onerror: spy } : { onError: spy }) });
      await vi.waitFor(() => expect(spy).toHaveBeenCalledWith('init'));
      await m.settle();
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
      expect(q(m, '.dss-map-canvas')).toBeNull();
      expect(qa(m, '.dss-map-item')).toHaveLength(1);
    });
    it('alle sichtbaren Kacheln fehlgeschlagen: Fehlerhinweis, Karte abgebaut', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const spy = vi.fn();
      const m = open(driver, { load: 'auto', ...(driver.name === 'Svelte' ? { onerror: spy } : { onError: spy }) });
      await vi.waitFor(() => expect(state.layers).toHaveLength(1));
      await m.act(() => finishTiles(lastLayer(), 'fail'));
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
      expect(q(m, '[role="status"]')?.textContent).toContain('konnte nicht geladen werden');
      expect(spy).toHaveBeenCalledWith('tiles');
      expect(state.removed).toBe(1);
      expect(q(m, '.dss-map-zoom')).toBeNull();
    });
    it('einzelne Kachelfehler führen nicht zum Fehlerzustand', async () => {
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.layers).toHaveLength(1));
      await m.act(() => finishTiles(lastLayer(), 'mixed'));
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('ready');
      expect(state.removed).toBe(0);
    });
    it('neue tileUrl nach einem Fehler: neuer Versuch', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.layers).toHaveLength(1));
      await m.act(() => finishTiles(lastLayer(), 'fail'));
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
      await m.set({ tileUrl: '/tiles/{z}/{x}/{y}.png' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(2));
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('ready');
    });
  });

  describe('Aufräumen und Reaktivität', () => {
    it('map.remove() beim Entfernen der Komponente', async () => {
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(1));
      await m.settle();
      expect(state.removed).toBe(0);
      await m.unmount();
      current = undefined;
      expect(state.removed).toBe(1);
      expect(lastMap().isRemoved).toBe(true);
    });
    it('Entfernen vor dem Laden von Leaflet erzeugt keine Karte', async () => {
      const m = open(driver, { load: 'auto' });
      await m.unmount();
      current = undefined;
      await new Promise((r) => setTimeout(r, 10));
      expect(state.maps).toHaveLength(0);
    });
    it('Marker hinzufügen, ändern, verschieben und entfernen ohne Neuaufbau der Karte', async () => {
      const m = open(driver, { markers: [A, B], load: 'auto' });
      await vi.waitFor(() => expect(state.markers).toHaveLength(2));
      await m.set({ markers: [A, B, C] });
      expect(state.markers).toHaveLength(3);
      expect(state.markers[2].options.title).toBe('Gymnasium Lindenberg');
      await m.set({ markers: [A, { ...B, lat: 49.6 }, C] });
      expect(state.markers).toHaveLength(3);
      expect(state.markers[1].latlng).toEqual([49.6, 8.5]);
      await m.set({ markers: [A, { ...B, lat: 49.6, label: 'Halle Ost' }, C] });
      expect(state.markers).toHaveLength(4);
      expect(state.markers[1].isRemoved).toBe(true);
      expect(state.markers[3].options.title).toBe('Halle Ost');
      await m.set({ markers: [A] });
      expect(state.markers.filter((x) => !x.isRemoved)).toHaveLength(1);
      expect(state.maps).toHaveLength(1);
      expect(state.removed).toBe(0);
      expect(qa(m, '.dss-map-item')).toHaveLength(1);
    });
    it('neue Kachel-Adresse wird gesetzt, eine ungültige führt zum Fehler und baut die Karte ab', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const m = open(driver, { load: 'auto' });
      await vi.waitFor(() => expect(state.layers).toHaveLength(1));
      await m.set({ tileUrl: '/tiles/{z}/{x}/{y}.png' });
      expect(lastLayer().urls).toEqual(['https://tile.openstreetmap.org/{z}/{x}/{y}.png', '/tiles/{z}/{x}/{y}.png']);
      await m.set({ tileUrl: 'ftp://x/{z}/{x}/{y}' });
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
      expect(state.removed).toBe(1);
    });
    it('mehrere Karten auf einer Seite: eindeutige Ids', async () => {
      const first = open(driver, { load: 'auto' });
      const second = driver.mount({ ...BASE, label: 'Zweite Karte', load: 'auto' });
      await vi.waitFor(() => expect(state.maps).toHaveLength(2));
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      await second.unmount();
      expect(first).toBeDefined();
    });
  });

  describe('Quellenangabe', () => {
    it('bleibt sichtbar und verlinkt, auch bei leerem oder fehlendem Text; eigener Text ersetzt nur den Wortlaut', async () => {
      const m = open(driver, { attribution: '' });
      expect(q(m, '.dss-map-attr a')?.textContent).toBe('© OpenStreetMap-Mitwirkende');
      await m.set({ attribution: '   ' });
      expect(q(m, '.dss-map-attr a')?.textContent).toBe('© OpenStreetMap-Mitwirkende');
      await m.set({ attribution: '© OpenStreetMap-Mitwirkende, Kacheln: Beispielanbieter' });
      expect(q(m, '.dss-map-attr a')?.textContent).toBe('© OpenStreetMap-Mitwirkende, Kacheln: Beispielanbieter');
      expect(q(m, '.dss-map-attr a')?.getAttribute('href')).toBe('https://www.openstreetmap.org/copyright');
    });
    it('steht in jedem Zustand im Markup: Platzhalter, geladen, Fehler', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const m = open(driver);
      expect(q(m, '.dss-map-attr a')).not.toBeNull();
      await loadMap(m);
      expect(q(m, '.dss-map-attr a')).not.toBeNull();
      await m.act(() => finishTiles(lastLayer(), 'fail'));
      expect(q(m, '.dss-map')?.getAttribute('data-state')).toBe('error');
      expect(q(m, '.dss-map-attr a')).not.toBeNull();
    });
  });

  describe('Darstellung', () => {
    it('height setzt die Höhe über die Variable (mindestens 200); dimInDark steuert data-dim; class wird angehängt', async () => {
      const m = open(driver, { height: 400, dimInDark: false, ...(driver.name === 'Svelte' ? { class: 'meine-karte' } : { className: 'meine-karte' }) });
      const root = q(m, '.dss-map')!;
      expect(style(root)).toContain('--dss-map-h:400px');
      expect(root.getAttribute('data-dim')).toBe('false');
      expect(root.classList.contains('meine-karte')).toBe(true);
      await m.set({ height: 50 });
      expect(style(root)).toContain('--dss-map-h:200px');
      await m.set({ height: Number.NaN, dimInDark: true });
      expect(style(root)).toContain('--dss-map-h:320px');
      expect(root.getAttribute('data-dim')).toBe('true');
    });
  });
});

describe('React (StrictMode)', () => {
  it('doppelter Mount erzeugt nur eine Karte; Entfernen baut sie ab', async () => {
    const m = reactStrictDriver.mount({ ...BASE, markers: [A, B], load: 'auto' });
    current = m;
    await vi.waitFor(() => expect(state.maps.length).toBeGreaterThan(0));
    await m.settle();
    await new Promise((r) => setTimeout(r, 20));
    await m.settle();
    expect(state.maps).toHaveLength(1);
    expect(state.markers.filter((x) => !x.isRemoved)).toHaveLength(2);
    expect(state.removed).toBe(0);
    await m.unmount();
    current = undefined;
    expect(state.removed).toBe(1);
  });
  it('Klick auf „Karte laden“ im StrictMode: eine Karte', async () => {
    const m = reactStrictDriver.mount(BASE);
    current = m;
    await loadMap(m);
    await new Promise((r) => setTimeout(r, 20));
    expect(state.maps).toHaveLength(1);
  });
});
