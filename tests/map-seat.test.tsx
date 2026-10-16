// Karte: Marker-Art `seat` (Vereinssitz) und `darkTiles`: reine Funktionen, Pin-Symbol, Marker im Controller (gespieltes Leaflet), Komponenten.
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { markerName, mapItems, mapText, placeholderPins, tilesMode } from '../js/map.js';
import { createMapController, pinElement } from '../js/map-leaflet.js';
import { MapView } from '../react/Map';
import { expectNoA11yViolations } from '../react/test-utils';
import * as mock from './helpers/leaflet-mock';

const seat = { id: 's', lat: 49.3, lng: 7.9, label: 'Geschäftsstelle', kind: 'seat' as const };
const a = { id: 'a', lat: 49.31, lng: 7.91, label: 'Halle A' };
const b = { id: 'b', lat: 49.32, lng: 7.92, label: 'Halle B' };

afterEach(() => {
  cleanup();
  mock.reset();
  document.body.replaceChildren();
});

describe('mapItems: kind', () => {
  it('Standard ist place; seat bleibt seat; unbekannte Werte gelten als place', () => {
    expect(mapItems([a]).map((i) => i.kind)).toEqual(['place']);
    expect(mapItems([seat]).map((i) => i.kind)).toEqual(['seat']);
    expect(mapItems([{ ...a, kind: 'sitz' as never }, { ...b, kind: 1 as never }]).map((i) => i.kind)).toEqual(['place', 'place']);
  });
  it('ein Sitzmarker hat nie eine Nummer, auch nicht mit number', () => {
    expect(mapItems([{ ...seat, number: 5 }, a, b]).map((i) => i.number)).toEqual([null, 1, 2]);
  });
  it('der Sitz zählt in der Nummerierung der Orte nicht mit (egal wo er steht)', () => {
    expect(mapItems([a, seat, b]).map((i) => i.number)).toEqual([1, null, 2]);
    expect(mapItems([seat, a, b]).map((i) => i.number)).toEqual([null, 1, 2]);
  });
  it('Sitz und ein Ort: der Ort bleibt ohne Nummer (ein einzelner Ort)', () => {
    expect(mapItems([seat, a]).map((i) => i.number)).toEqual([null, null]);
  });
  it('ohne Sitz bleibt alles wie zuvor', () => {
    expect(mapItems([a, b]).map((i) => i.number)).toEqual([1, 2]);
    expect(mapItems([a]).map((i) => i.number)).toEqual([null]);
    expect(mapItems([{ ...a, number: 4 }, b]).map((i) => i.number)).toEqual([4, 2]);
  });
  it('ein Sitz ohne gültige Koordinaten entfällt und zählt nicht', () => {
    expect(mapItems([{ ...seat, lat: 999 }, a, b]).map((i) => i.number)).toEqual([1, 2]);
  });
});

describe('placeholderPins, markerName, tilesMode', () => {
  it('placeholderPins trägt die Art', () => {
    const pins = placeholderPins(mapItems([seat, a, b]));
    expect(pins.map((p) => p.kind)).toEqual(['seat', 'place', 'place']);
    expect(pins[0].number).toBeNull();
  });
  it('markerName: Sitz mit Zusatz, sonst der Name', () => {
    expect(markerName({ label: 'Halle A' })).toBe('Halle A');
    expect(markerName({ label: 'Halle A', kind: 'place' })).toBe('Halle A');
    // sichtbare Nummer voran (WCAG 2.5.3); ein Sitz hat keine
    expect(markerName({ label: 'Halle A', number: 2 })).toBe('2, Halle A');
    expect(markerName({ label: 'Halle A', number: 0 })).toBe('0, Halle A');
    expect(markerName({ label: '', number: 3 })).toBe('3');
    expect(markerName({ label: 'Halle A', number: null })).toBe('Halle A');
    expect(markerName({ label: 'Halle A', number: 1.5 })).toBe('Halle A');
    expect(markerName({ label: 'Sitz', kind: 'seat', number: 4 })).toBe('Sitz, Vereinssitz');
    expect(markerName({ label: 'Sitz', kind: 'seat', seatText: 'Geschäftsstelle' })).toBe('Sitz, Geschäftsstelle');
    expect(markerName({ label: 'Sitz', kind: 'seat', seatText: '  ' })).toBe('Sitz, Vereinssitz');
    expect(markerName({ label: 'Geschäftsstelle', kind: 'seat' })).toBe('Geschäftsstelle, Vereinssitz');
    expect(markerName({ label: '', kind: 'seat' })).toBe('Vereinssitz');
    expect(markerName(undefined as never)).toBe('');
    expect(mapText.seat).toBe('Vereinssitz');
  });
  it('tilesMode: nur invert ändert den Standard', () => {
    expect(tilesMode('invert')).toBe('invert');
    for (const v of ['dim', undefined, null, '', 'Invert', 'brightness', 1, {}]) expect(tilesMode(v)).toBe('dim');
  });
});

describe('pinElement', () => {
  it('Sitz: Haus statt Nummer und Punkt, gleiche Maße und Kontur wie die anderen Pins', () => {
    const svg = pinElement({ number: null, kind: 'seat' });
    expect(svg.getAttribute('viewBox')).toBe('0 0 36 46');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('.hoops-map-pin-edge')).not.toBeNull();
    expect(svg.querySelector('.hoops-map-pin-body')).not.toBeNull();
    expect(svg.querySelector('.hoops-map-pin-house')).not.toBeNull();
    expect(svg.querySelector('.hoops-map-pin-dot, .hoops-map-pin-num')).toBeNull();
    expect(svg.querySelector('text, circle')).toBeNull();
  });
  it('Sitz mit Nummer zeigt trotzdem nur das Haus', () => {
    const svg = pinElement({ number: 7, kind: 'seat' });
    expect(svg.querySelector('.hoops-map-pin-num')).toBeNull();
    expect(svg.querySelector('.hoops-map-pin-house')).not.toBeNull();
  });
  it('Orte bleiben unverändert (Nummer oder Punkt)', () => {
    expect(pinElement({ number: 3 }).querySelector('.hoops-map-pin-num')!.textContent).toBe('3');
    expect(pinElement({ number: null }).querySelector('.hoops-map-pin-dot')).not.toBeNull();
    expect(pinElement({ number: 3, kind: 'place' }).querySelector('.hoops-map-pin-house')).toBeNull();
  });
  it('das Haus liegt innerhalb des Pins (Mitte bei 18/16,5)', () => {
    const d = pinElement({ number: null, kind: 'seat' }).querySelector('.hoops-map-pin-house')!.getAttribute('d')!;
    const nums = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
    expect(nums.length).toBeGreaterThan(6);
    expect(d.startsWith('M18 9.5')).toBe(true);
  });
});

describe('Controller: Sitzmarker', () => {
  const start = async (markers: unknown[]) => {
    const el = document.createElement('div');
    document.body.append(el);
    const ctrl = createMapController(el, { markers: markers as never, appLinks: [] });
    await ctrl.started;
    return { el, ctrl };
  };
  it('Name, Titel und Klasse des Sitzmarkers; die Orte bleiben unverändert', async () => {
    const { el, ctrl } = await start([seat, a, b]);
    const [s, pa, pb] = mock.state.markers;
    expect(s.options).toMatchObject({ title: 'Geschäftsstelle, Vereinssitz', alt: 'Geschäftsstelle, Vereinssitz', keyboard: true });
    expect(s.el!.getAttribute('aria-label')).toBe('Geschäftsstelle, Vereinssitz');
    expect(s.el!.classList.contains('is-seat')).toBe(true);
    expect(s.el!.querySelector('.hoops-map-pin-house')).not.toBeNull();
    expect(pa.options.title).toBe('1, Halle A');
    expect(pa.el!.getAttribute('aria-label')).toBe('1, Halle A');
    expect(pa.el!.querySelector('.hoops-map-pin-num')!.textContent).toBe('1');
    expect(pb.el!.querySelector('.hoops-map-pin-num')!.textContent).toBe('2');
    expect(el.querySelectorAll('.leaflet-marker-icon')).toHaveLength(3);
    ctrl.destroy();
  });
  it('ändert sich die Art, wird der Marker neu gebaut', async () => {
    const { ctrl } = await start([{ ...a }]);
    expect(mock.state.markers[0].el!.querySelector('.hoops-map-pin-house')).toBeNull();
    ctrl.update({ markers: [{ ...a, kind: 'seat' }] as never, appLinks: [] });
    const last = mock.state.markers[mock.state.markers.length - 1];
    expect(last.el!.querySelector('.hoops-map-pin-house')).not.toBeNull();
    expect(mock.state.markers[0].isRemoved).toBe(true);
    ctrl.destroy();
  });
  it('Enter am Sitzmarker öffnet das sichere Ziel wie bei anderen Orten (javascript: nie)', async () => {
    const { ctrl } = await start([{ ...seat, href: 'javascript:alert(1)' }]);
    const m = mock.state.markers[0];
    m.fire('click');
    expect(window.location.href).not.toContain('javascript');
    ctrl.destroy();
  });
});

describe('seatLabel: eigener Text für den Sitz', () => {
  it('mapItems: texts.seat setzt seatText, leer oder ungültig bleibt Vereinssitz', () => {
    expect(mapItems([seat], ['osm'], { seat: 'Geschäftsstelle' })[0].seatText).toBe('Geschäftsstelle');
    for (const v of ['', '  ', undefined, 5 as never]) expect(mapItems([seat], ['osm'], { seat: v })[0].seatText).toBe('Vereinssitz');
    expect(mapItems([seat])[0].seatText).toBe('Vereinssitz');
  });
  it('React: Chip und Marker-Name nutzen seatLabel', async () => {
    const { container } = render(<MapView label="Karte" markers={[seat, a]} seatLabel="Geschäftsstelle" load="auto" />);
    expect(container.querySelector('.hoops-map-item .hoops-chip')!.textContent).toBe('Geschäftsstelle');
    await new Promise((r) => setTimeout(r, 30));
    const m = mock.state.markers[0];
    expect(m.options.title).toBe('Geschäftsstelle, Geschäftsstelle');
  });
  it('Controller: seatLabel und Wechsel des Textes baut den Marker neu', async () => {
    const el = document.createElement('div');
    document.body.append(el);
    const ctrl = createMapController(el, { markers: [seat] as never, appLinks: [], seatLabel: 'Sitz' });
    await ctrl.started;
    expect(mock.state.markers[0].options.title).toBe('Geschäftsstelle, Sitz');
    ctrl.update({ markers: [seat] as never, appLinks: [], seatLabel: 'Zentrale' });
    expect(mock.state.markers.at(-1)!.options.title).toBe('Geschäftsstelle, Zentrale');
    ctrl.destroy();
  });
});

describe('Komponente (React)', () => {
  const props = { label: 'Karte', markers: [seat, a, b] };
  it('Liste: Haus-Badge ohne Zahl, Chip „Vereinssitz“, Orte nummeriert', () => {
    const { container } = render(<MapView {...props} />);
    const items = [...container.querySelectorAll('.hoops-map-item')];
    expect(items[0].querySelector('.hoops-map-num')!.className).toContain('is-seat');
    expect(items[0].querySelector('.hoops-map-num')!.textContent).toBe('');
    expect(items[0].querySelector('.hoops-chip')!.textContent).toBe('Vereinssitz');
    expect(items[1].querySelector('.hoops-map-num')!.textContent).toBe('1');
    expect(items[2].querySelector('.hoops-map-num')!.textContent).toBe('2');
  });
  it('Platzhalter: Sitz als Haus-Pin ohne Zahl', () => {
    const { container } = render(<MapView {...props} />);
    const pins = [...container.querySelectorAll('.hoops-map-ph-pin')];
    expect(pins[0].classList.contains('is-seat')).toBe(true);
    expect(pins[0].textContent).toBe('');
    expect(pins[1].textContent).toBe('1');
  });
  it('darkTiles: Standard dim, invert wird übernommen, Unsinn fällt auf dim', () => {
    const { container, rerender } = render(<MapView {...props} />);
    const root = () => container.querySelector('.hoops-map')!;
    expect(root().getAttribute('data-tiles')).toBe('dim');
    rerender(<MapView {...props} darkTiles="invert" />);
    expect(root().getAttribute('data-tiles')).toBe('invert');
    rerender(<MapView {...props} darkTiles={'neon' as never} />);
    expect(root().getAttribute('data-tiles')).toBe('dim');
  });
  it('keine Verstöße gegen die Barrierefreiheit (mit Sitz)', async () => {
    const { container } = render(<MapView {...props} />);
    await expectNoA11yViolations(container);
  });
});
