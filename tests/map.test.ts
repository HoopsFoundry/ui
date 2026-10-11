// Reine Funktionen der Karte (js/map.js): Tabellentests mit Randfällen.
import { describe, expect, it } from 'vitest';
import { boundsOf, formatCoords, initialView, isCoord, mapItems, mapLinks, placeholderPins, validTileUrl } from '../js/map.js';

describe('isCoord', () => {
  it.each<[unknown, unknown, boolean]>([
    [49.4875, 8.466, true], [0, 0, true], [-0, -0, true], [90, 180, true], [-90, -180, true],
    [90.0001, 0, false], [-90.0001, 0, false], [0, 180.0001, false], [0, -180.0001, false],
    [Number.NaN, 0, false], [0, Number.NaN, false], [Infinity, 0, false], [0, -Infinity, false],
    ['49.4875', '8.466', false], ['49', 8, false], [49, '8', false], [null, null, false], [undefined, 1, false], [{}, [], false],
  ])('isCoord(%j, %j) = %s', (lat, lng, expected) => {
    expect(isCoord(lat, lng)).toBe(expected);
  });
});

describe('formatCoords', () => {
  it.each<[number, number, string]>([
    [49.4875, 8.466, '49,4875° N, 8,4660° O'],
    [-33.8688, 151.2093, '33,8688° S, 151,2093° O'],
    [40.7128, -74.006, '40,7128° N, 74,0060° W'],
    [0, 0, '0,0000° N, 0,0000° O'],
    [-0, -0, '0,0000° N, 0,0000° O'],
    [-0.00001, -0.00001, '0,0000° N, 0,0000° O'],
    [-0.0001, -0.0001, '0,0001° S, 0,0001° W'],
    [90, 0, '90,0000° N, 0,0000° O'],
    [-90, 0, '90,0000° S, 0,0000° O'],
    [0, 180, '0,0000° N, 180,0000° O'],
    [0, -180, '0,0000° N, 180,0000° W'],
    [49.48754999, 8.46604999, '49,4875° N, 8,4660° O'],
    [49.48756, 8.46606, '49,4876° N, 8,4661° O'],
  ])('formatCoords(%s, %s) = %s', (lat, lng, expected) => {
    expect(formatCoords(lat, lng)).toBe(expected);
  });
  it('ungültige Werte ergeben eine leere Zeichenkette', () => {
    expect(formatCoords(91, 0)).toBe('');
    expect(formatCoords(0, 181)).toBe('');
    expect(formatCoords(Number.NaN, 0)).toBe('');
    expect(formatCoords('1' as never, 2)).toBe('');
  });
});

describe('mapLinks', () => {
  it('liefert geo:-, OpenStreetMap- und Routing-Link', () => {
    expect(mapLinks({ lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain' })).toEqual({
      geo: 'geo:49.4875,8.466?q=49.4875,8.466(Sporthalle%20Nordhain)',
      osm: 'https://www.openstreetmap.org/?mlat=49.4875&mlon=8.466#map=17/49.4875/8.466',
      route: 'https://www.openstreetmap.org/directions?route=%3B49.4875%2C8.466',
    });
  });
  it.each<[string, string]>([
    ['Halle Süd & West', 'Halle%20S%C3%BCd%20%26%20West'],
    ['Gymnasium am Löwenplatz', 'Gymnasium%20am%20L%C3%B6wenplatz'],
    ['Halle (Neubau)', 'Halle%20%28Neubau%29'],
    ["Halle 'A'*!", 'Halle%20%27A%27%2A%21'],
    ['Straße #1 ?x=1', 'Stra%C3%9Fe%20%231%20%3Fx%3D1'],
    ['100% Sport', '100%25%20Sport'],
  ])('kodiert die Bezeichnung %j', (label, encoded) => {
    const links = mapLinks({ lat: 1, lng: 2, label })!;
    expect(links.geo).toBe(`geo:1,2?q=1,2(${encoded})`);
    // keine unkodierte Klammer, kein & in der Bezeichnung
    expect(links.geo.slice(links.geo.indexOf('(') + 1, -1)).not.toMatch(/[()&\s]/);
  });
  it('ohne Bezeichnung entfällt die Klammer; Leerzeichen am Rand zählen nicht', () => {
    expect(mapLinks({ lat: 1, lng: 2 })!.geo).toBe('geo:1,2?q=1,2');
    expect(mapLinks({ lat: 1, lng: 2, label: '   ' })!.geo).toBe('geo:1,2?q=1,2');
    expect(mapLinks({ lat: 1, lng: 2, label: ' A ' })!.geo).toBe('geo:1,2?q=1,2(A)');
  });
  it('Zahlen: höchstens 6 Stellen, keine Exponenten, kein −0', () => {
    expect(mapLinks({ lat: 49.123456789, lng: -0.0000001 })!.osm).toContain('mlat=49.123457&mlon=0#');
    expect(mapLinks({ lat: 1e-7, lng: 2 })!.osm).toContain('mlat=0&');
    expect(mapLinks({ lat: -90, lng: -180 })!.route).toBe('https://www.openstreetmap.org/directions?route=%3B-90%2C-180');
  });
  it.each([[91, 0], [0, 181], [Number.NaN, 1], ['1', 2]])('ungültige Koordinaten (%s, %s) ergeben null', (lat, lng) => {
    expect(mapLinks({ lat: lat as number, lng: lng as number, label: 'x' })).toBeNull();
  });
  it('ohne Argument kein Fehler', () => {
    expect(mapLinks(undefined as never)).toBeNull();
  });
});

describe('validTileUrl', () => {
  const ok = [
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://{s}.tile.example.org/{z}/{x}/{y}{r}.png',
    'https://tiles.example.org/{z}/{x}/{y}.png?key=abc',
    '/tiles/{z}/{x}/{y}.png',
    '/tiles/{z}/{x}/{y}.png?z={z}&x={x}&y={y}',
    '/{z}/{y}/{x}',
    'http://localhost/tiles/{z}/{x}/{y}.png',
    'http://localhost:5173/tiles/{z}/{x}/{y}.png',
  ];
  const bad = [
    ['', 'leer'],
    ['https://tile.openstreetmap.org/{z}/{x}.png', 'ohne {y}'],
    ['https://tile.openstreetmap.org/{z}/{y}.png', 'ohne {x}'],
    ['https://tile.openstreetmap.org/{x}/{y}.png', 'ohne {z}'],
    ['https://tile.openstreetmap.org/1/2/3.png', 'ohne Platzhalter'],
    ['http://tile.openstreetmap.org/{z}/{x}/{y}.png', 'http ohne localhost'],
    ['http://localhost.evil.com/{z}/{x}/{y}.png', 'localhost als Anfang eines fremden Hosts'],
    ['http://127.0.0.1/{z}/{x}/{y}.png', 'IP-Adresse über http'],
    ['//cdn.example.org/{z}/{x}/{y}.png', 'protokollrelativ'],
    ['tiles/{z}/{x}/{y}.png', 'relativ ohne Schrägstrich'],
    ['./tiles/{z}/{x}/{y}.png', 'relativ mit Punkt'],
    ['ftp://example.org/{z}/{x}/{y}.png', 'anderes Schema'],
    ['javascript:alert(1)//{z}/{x}/{y}', 'javascript:'],
    ['data:image/png;base64,{z}{x}{y}', 'data:'],
    ['https://user:pw@tile.example.org/{z}/{x}/{y}.png', 'Zugangsdaten'],
    ['https://tile.example.org/{z}/{x}/{y}.png {s}', 'Leerzeichen'],
    ['https://tile.example.org/{z}/{x}/{y}.png"onerror=', 'Anführungszeichen'],
    ['https://tile.example.org/{z}/{x}/{y}<.png', 'spitze Klammer'],
    ['https://tile.example.org/{z}/{x}/{y}/{foo}.png', 'fremder Platzhalter'],
    ['https://tile.example.org/{z}/{x}/{y}/{{z}}', 'doppelte Klammern'],
    ['https:///{z}/{x}/{y}', 'ohne Host'],
  ] as const;
  it.each(ok)('gültig: %s', (url) => expect(validTileUrl(url)).toBe(true));
  it.each(bad)('ungültig: %s (%s)', (url) => expect(validTileUrl(url)).toBe(false));
  it.each([[undefined], [null], [42], [{}], [['https://a/{z}/{x}/{y}']]])('kein String: %j', (value) => expect(validTileUrl(value)).toBe(false));
});

describe('boundsOf', () => {
  it('leere Liste, Unsinn und nur ungültige Marker ergeben null', () => {
    expect(boundsOf([])).toBeNull();
    expect(boundsOf(undefined as never)).toBeNull();
    expect(boundsOf([{ lat: 91, lng: 0 }, { lat: 'x' as never, lng: 1 }])).toBeNull();
  });
  it('ein Marker: Rechteck aus einem Punkt', () => {
    expect(boundsOf([{ lat: 49.5, lng: 8.4 }])).toEqual({ sw: [49.5, 8.4], ne: [49.5, 8.4] });
  });
  it('mehrere Marker: Südwest und Nordost; ungültige zählen nicht', () => {
    expect(boundsOf([{ lat: 49.5, lng: 8.4 }, { lat: 48.9, lng: 9.2 }, { lat: 49.1, lng: 8.1 }, { lat: 500, lng: 0 }])).toEqual({ sw: [48.9, 8.1], ne: [49.5, 9.2] });
  });
  it('Südhalbkugel und Nullmeridian', () => {
    expect(boundsOf([{ lat: -10, lng: -5 }, { lat: 10, lng: 5 }])).toEqual({ sw: [-10, -5], ne: [10, 5] });
  });
  it('Datumsgrenze: nimmt den kürzeren Weg (Nordost-Länge über 180)', () => {
    expect(boundsOf([{ lat: 0, lng: 179 }, { lat: 1, lng: -179 }])).toEqual({ sw: [0, 179], ne: [1, 181] });
    expect(boundsOf([{ lat: 0, lng: 170 }, { lat: 1, lng: -175 }, { lat: 2, lng: 179 }])).toEqual({ sw: [0, 170], ne: [2, 185] });
  });
  it('weit auseinander ohne kürzeren Weg über die Grenze bleibt direkt', () => {
    expect(boundsOf([{ lat: 0, lng: -90 }, { lat: 0, lng: 90 }])).toEqual({ sw: [0, -90], ne: [0, 90] });
  });
  it('Pole', () => {
    expect(boundsOf([{ lat: 90, lng: 0 }, { lat: -90, lng: 0 }])).toEqual({ sw: [-90, 0], ne: [90, 0] });
  });
});

describe('mapItems', () => {
  const a = { id: 'a', lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain', own: true };
  const b = { id: 'b', lat: 49.5, lng: 8.5, label: 'Halle Süd & West', number: 7, href: '/hallen/sued' };
  it('ein Marker: keine Nummer; Links nach appLinks (Standard osm und route)', () => {
    const [item] = mapItems([a]);
    expect(item.number).toBeNull();
    expect(item.coords).toBe('49,4875° N, 8,4660° O');
    expect(item.links.map((l) => l.kind)).toEqual(['osm', 'route']);
    expect(item.links.map((l) => l.text)).toEqual(['In OpenStreetMap öffnen', 'Route planen']);
    expect(item.own).toBe(true);
  });
  it('mehrere Marker: laufende Nummern, eigene Nummer gewinnt', () => {
    expect(mapItems([a, b]).map((i) => i.number)).toEqual([1, 7]);
    expect(mapItems([a, { ...b, number: undefined }]).map((i) => i.number)).toEqual([1, 2]);
  });
  it('ungültige Marker entfallen, die Nummerierung zählt nur gültige', () => {
    expect(mapItems([{ ...a, lat: 999 }, a, b]).map((i) => i.id)).toEqual(['a', 'b']);
    expect(mapItems([{ ...a, lat: 999 }, a, { ...b, number: undefined }]).map((i) => i.number)).toEqual([1, 2]);
  });
  it('appLinks: Auswahl und Reihenfolge fest (geo, osm, route); leer ergibt keine Links', () => {
    expect(mapItems([a], ['route', 'geo']).map((l) => l.links.map((x) => x.kind))).toEqual([['geo', 'route']]);
    expect(mapItems([a], []).map((l) => l.links)).toEqual([[]]);
    expect(mapItems([a], undefined as never)[0].links).toHaveLength(2);
  });
  it('Eingabe ohne Liste ergibt eine leere Liste', () => {
    expect(mapItems(undefined as never)).toEqual([]);
  });
  it('href und Bezeichnung werden übernommen; ungültige Nummern ignoriert', () => {
    const [x] = mapItems([{ ...b, number: -1 }, a]);
    expect(x.href).toBe('/hallen/sued');
    expect(x.number).toBe(1);
  });
});

describe('initialView', () => {
  const a = { id: 'a', lat: 49.4, lng: 8.4, label: 'A' };
  const b = { id: 'b', lat: 49.6, lng: 8.8, label: 'B' };
  it('center gewinnt; zoom Standard 15', () => {
    expect(initialView({ markers: [a, b], center: [50, 9] })).toEqual({ center: [50, 9], zoom: 15 });
    expect(initialView({ markers: [a], center: [50, 9], zoom: 12 })).toEqual({ center: [50, 9], zoom: 12 });
  });
  it('ein Marker ohne Angaben: Marker mit Zoom 15', () => {
    expect(initialView({ markers: [a] })).toEqual({ center: [49.4, 8.4], zoom: 15 });
  });
  it('mehrere Marker ohne Angaben: Rechteck zum Einpassen', () => {
    expect(initialView({ markers: [a, b] })).toEqual({ bounds: { sw: [49.4, 8.4], ne: [49.6, 8.8] } });
  });
  it('nur zoom: Mitte der Marker', () => {
    const v = initialView({ markers: [a, b], zoom: 10 }) as { center: [number, number]; zoom: number };
    expect(v.zoom).toBe(10);
    expect(v.center[0]).toBeCloseTo(49.5);
    expect(v.center[1]).toBeCloseTo(8.6);
  });
  it('Zoom wird auf 3 bis 19 begrenzt; ungültiges center ignoriert', () => {
    expect(initialView({ markers: [a], zoom: 40 })).toMatchObject({ zoom: 19 });
    expect(initialView({ markers: [a], zoom: -2 })).toMatchObject({ zoom: 3 });
    expect(initialView({ markers: [a], center: [999, 1] as never })).toEqual({ center: [49.4, 8.4], zoom: 15 });
  });
  it('ohne Marker und Mitte: Deutschland', () => {
    expect(initialView({ markers: [] })).toEqual({ center: [51.1657, 10.4515], zoom: 5 });
    expect(initialView({})).toEqual({ center: [51.1657, 10.4515], zoom: 5 });
  });
  it('über die Datumsgrenze bleibt die Mitte im gültigen Bereich', () => {
    const v = initialView({ markers: [{ id: 'x', lat: 0, lng: 179, label: '' }, { id: 'y', lat: 0, lng: -179, label: '' }], zoom: 5 }) as { center: [number, number] };
    expect(Math.abs(v.center[1])).toBeCloseTo(180);
  });
});

describe('placeholderPins', () => {
  it('ein Marker liegt in der Mitte', () => {
    expect(placeholderPins([{ id: 'a', lat: 1, lng: 2, number: null, own: false }])).toEqual([{ id: 'a', number: null, own: false, x: 50, y: 50 }]);
  });
  it('mehrere Marker: Norden oben, Osten rechts, innerhalb von 18 bis 82 Prozent', () => {
    const pins = placeholderPins([
      { id: 'sw', lat: 10, lng: 10, number: 1, own: false },
      { id: 'ne', lat: 11, lng: 12, number: 2, own: true },
    ]);
    expect(pins).toEqual([
      { id: 'sw', number: 1, own: false, x: 18, y: 82 },
      { id: 'ne', number: 2, own: true, x: 82, y: 18 },
    ]);
  });
  it('gleiche Breite: y in der Mitte; leere Liste', () => {
    expect(placeholderPins([{ id: 'a', lat: 5, lng: 0, number: 1, own: false }, { id: 'b', lat: 5, lng: 1, number: 2, own: false }]).map((p) => p.y)).toEqual([50, 50]);
    expect(placeholderPins([])).toEqual([]);
  });
});
