// @vitest-environment node
// Vanilla-`renderMap` erzeugt dasselbe Markup wie React (`MapView`) und Svelte (`Map`) im Server-Rendering (normalisiert), und
// `renderMap` ohne `uid` ist stabil (Hash der Eingaben), mit `uid` die Basis der ids.
import { describe, expect, it } from 'vitest';
import { renderMap } from '../js/map-vanilla.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
const HALLEN = [
  { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
  { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg', href: '/hallen/seeberg' },
  { id: 'kiefernau', lat: 49.2955, lng: 7.8905, label: 'Gymnasium Kiefernau' },
];
const SITZ = { id: 'sitz', lat: 49.2962, lng: 7.9105, label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' };
const BASE = { label: 'Karte der Sporthalle Nordhain', markers: [HALLEN[0]] };

describe('Karte: renderMap gegen Svelte und React', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: BASE,
    'mehrere Marker': { label: 'Hallen im Kreis', markers: HALLEN },
    'eigener Ort und Links': { label: 'Hallen', markers: HALLEN, appLinks: ['osm', 'geo', 'route'] },
    Vereinssitz: { label: 'Sitz und Hallen', markers: [SITZ, HALLEN[0], HALLEN[1]], darkTiles: 'invert' },
    'Vereinssitz mit eigenem Text': { label: 'Sitz', markers: [SITZ, HALLEN[0]], seatLabel: 'Geschäftsstelle' },
    'ohne Liste': { ...BASE, showList: false },
    'appLinks leer': { label: 'Hallen', markers: HALLEN, appLinks: [] },
    'appLinks alle': { label: 'Hallen', markers: HALLEN, appLinks: ['geo', 'osm', 'route'] },
    'load auto': { ...BASE, load: 'auto', tileUrl: '/tiles/{z}/{x}/{y}.png' },
    'ungültige Kachel-Adresse': { ...BASE, tileUrl: 'http://tiles.example.org/{z}/{x}/{y}.png' },
    'interactive false': { ...BASE, interactive: false, height: 240 },
    'ohne Marker': { label: 'Leer', markers: [] },
    'ungültige Koordinate': { label: 'Ungültig', markers: [{ id: 'x', lat: 95, lng: 7, label: 'Nirgends' }, HALLEN[1]] },
    'Hinweis, Quelle und Höhe': { ...BASE, privacyNote: 'Die Karte kommt über unseren Server.', attribution: 'Kartendaten: OpenStreetMap', height: 410 },
    'dunkel ohne Abdunkeln': { ...BASE, dimInDark: false, darkTiles: 'dim' },
    className: { ...BASE, className: 'meine' },
    'Sonderzeichen': { label: 'Halle "Süd" & <West>', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: "<b>Halle</b> & 'Co'", href: '/h?a=1&b=2' }] },
    'Nummern gesetzt': { label: 'Nummern', markers: [{ ...HALLEN[0], number: 7 }, { ...HALLEN[1], number: 12 }] },
    'unsichere Ziele': { label: 'Ziele', markers: [{ ...HALLEN[0], href: 'javascript:alert(1)' }, { ...HALLEN[1], href: 'data:text/html,x' }] },
    'Höhe unter Minimum': { ...BASE, height: 50 },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const v = normalize(renderMap(props as never));
    const r = await p.react('MapView', props, undefined, 'Map');
    expect(v).toBe(r);
    expect(await p.svelte('Map', props)).toBe(r);
  });
});

describe('Karte: ids', () => {
  it('ohne uid stabil (gleiche Eingaben, gleiche ids), mit uid die Basis', () => {
    expect(renderMap(BASE as never)).toBe(renderMap({ ...BASE } as never));
    const a = renderMap(BASE as never, { uid: 'a1' });
    expect(a).toContain('id="dss-map-text-a1"');
    expect(a).toContain('href="#dss-map-text-a1"');
  });
  it('uid wird auf Buchstaben, Ziffern, _ und - gekürzt', () => {
    expect(renderMap(BASE as never, { uid: 'a"><img onerror=x>' })).toContain('id="dss-map-text-aimgonerrorx"');
  });
  it('die Schaltfläche „Karte laden“ ist bedienbar (nicht gesperrt)', () => {
    const html = renderMap(BASE as never);
    expect(html).toContain('dss-map-load">Karte laden');
    expect(html).not.toContain('disabled');
  });
});
