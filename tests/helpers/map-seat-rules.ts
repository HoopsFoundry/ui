// Regeln für den Sitzmarker (kind: 'seat') und darkTiles der Karte als prüfbare Aussagen (tests/map-seat-rules.test.ts prüft sie am echten
// Quelltext, tests/vanilla-mutation-dom.test.ts verfälscht den Quelltext). Läuft unter jsdom.
import { bodyOf, rulesOf, type Rules } from './mutation';

type MapMod = {
  mapItems: (m: unknown[]) => { number: number | null; kind: string }[];
  markerName: (i: unknown) => string;
  tilesMode: (v: unknown) => string;
  placeholderPins: (items: unknown[]) => { kind: string }[];
  mapText: { seat: string };
};
type LeafletMod = { pinElement: (i: unknown) => SVGElement };

const seat = { id: 's', lat: 49.3, lng: 7.9, label: 'Geschäftsstelle', kind: 'seat' };
const a = { id: 'a', lat: 49.31, lng: 7.91, label: 'A' };
const b = { id: 'b', lat: 49.32, lng: 7.92, label: 'B' };
const safe = (fn: () => unknown) => {
  try {
    return fn();
  } catch {
    return Symbol('wirft');
  }
};

export function mapSeatLogicRules(m: MapMod, l: LeafletMod): Rules {
  const rule = (fn: () => unknown) => safe(fn) === true;
  const nums = (list: unknown[]) => JSON.stringify(m.mapItems(list).map((i) => i.number));
  return {
    'Sitz: kind seat bleibt, alles andere ist place': rule(() => m.mapItems([seat])[0].kind === 'seat' && m.mapItems([a])[0].kind === 'place' && m.mapItems([{ ...a, kind: 'sitz' }])[0].kind === 'place'),
    'Sitz: nie eine Nummer, auch nicht mit number': rule(() => nums([{ ...seat, number: 5 }, a, b]) === '[null,1,2]'),
    'Sitz: zählt in der Nummerierung der Orte nicht mit': rule(() => nums([a, seat, b]) === '[1,null,2]' && nums([seat, a, b]) === '[null,1,2]'),
    'Sitz: ein einzelner Ort neben dem Sitz bleibt ohne Nummer': rule(() => nums([seat, a]) === '[null,null]'),
    'Orte: Nummerierung ohne Sitz unverändert': rule(() => nums([a, b]) === '[1,2]' && nums([a]) === '[null]' && nums([{ ...a, number: 4 }, b]) === '[4,2]'),
    'Sitz: der Platzhalter kennt die Art': rule(() => m.placeholderPins(m.mapItems([seat, a, b])).map((p) => p.kind).join() === 'seat,place,place'),
    'Sitz: Name für Hilfstechnik mit Zusatz „Vereinssitz“': rule(() => m.markerName({ label: 'X', kind: 'seat' }) === 'X, Vereinssitz' && m.markerName({ label: 'X' }) === 'X' && m.markerName({ label: '', kind: 'seat' }) === 'Vereinssitz' && m.mapText.seat === 'Vereinssitz'),
    'darkTiles: nur invert ändert den Standard dim': rule(() => m.tilesMode('invert') === 'invert' && ['dim', undefined, null, '', 'Invert', 1].every((v) => m.tilesMode(v) === 'dim')),
    'Sitz: Pin zeigt ein Haus statt Nummer und Punkt': rule(() => {
      const svg = l.pinElement({ number: 7, kind: 'seat' });
      return svg.querySelector('.dss-map-pin-house') !== null && svg.querySelector('.dss-map-pin-num, .dss-map-pin-dot') === null && svg.getAttribute('viewBox') === '0 0 36 46';
    }),
    'Orte: Pin zeigt Nummer oder Punkt, kein Haus': rule(() => l.pinElement({ number: 3 }).querySelector('.dss-map-pin-house') === null && l.pinElement({ number: 3 }).querySelector('.dss-map-pin-num')?.textContent === '3' && l.pinElement({ number: null }).querySelector('.dss-map-pin-dot') !== null),
  };
}

export function mapSeatCssRules(css: string): Rules {
  const start = css.indexOf('/* ── Map (Karte');
  const text = css.slice(start, css.indexOf('/* ── LeagueCard'));
  const rules = rulesOf(text);
  const body = (s: string) => bodyOf(rules, s);
  const INV = '.dss-map[data-dim="true"][data-tiles="invert"] .dss-map-tiles';
  const dark = body(`:root[data-theme="dark"] ${INV}`);
  const auto = body(`:root:not([data-theme="light"]) ${INV}`);
  const dim = body(':root[data-theme="dark"] .dss-map[data-dim="true"] .dss-map-tiles');
  return {
    'CSS: invert im Dunkelmodus (data-theme) nur mit dimInDark': /invert\(1\) hue-rotate\(180deg\)/.test(dark) && /--dss-map-invert-filter/.test(dark),
    'CSS: invert auch bei System-Dunkel ohne data-theme': /invert\(1\) hue-rotate\(180deg\)/.test(auto) && /--dss-map-invert-filter/.test(auto),
    'CSS: dim bleibt der Standard': /brightness\(var\(--dss-map-dim, 0\.8\)\)/.test(dim),
    'CSS: Filter nur auf der Kachelebene': [dark, auto, dim].every((b) => b.length > 0) && !/\.dss-map-marker|\.dss-map-attr|\.dss-map-zoom/.test(text.slice(text.indexOf('darkTiles="invert"'), text.indexOf('/* Marker (Inline-SVG)'))),
    'CSS: Haus im Pin in der Textfarbe des Pins, eigener Ort in cta': /fill:\s*var\(--dss-map-pin-fg, var\(--n-0\)\)/.test(body('.dss-map-pin-house')) && /fill:\s*var\(--dss-cta-fg\)/.test(body('.dss-map-marker.is-own .dss-map-pin-house')),
    'CSS: Haus im Platzhalter und in der Liste als Maske in currentColor': /background:\s*currentColor/.test(body('.dss-map-ph-pin.is-seat::before, .dss-map-num.is-seat::before')) && /mask:\s*url\("data:image\/svg\+xml/.test(body('.dss-map-ph-pin.is-seat::before, .dss-map-num.is-seat::before')),
    'CSS: Haus-Symbol im Platzhalter 16 px': /width:\s*16px/.test(body('.dss-map-ph-pin.is-seat::before, .dss-map-num.is-seat::before')) && /height:\s*16px/.test(body('.dss-map-ph-pin.is-seat::before, .dss-map-num.is-seat::before')),
    'CSS: kein festes Hex im Abschnitt des Sitzes': !/#[0-9a-fA-F]{3,8}\b/.test(text.slice(text.indexOf('/* Sitzmarker'), text.indexOf('/* Fokus: Fläche'))),
  };
}

export function mapSeatSourceRules(f: { svelte: string; react: string; leaflet: string }): Rules {
  const { svelte, react, leaflet } = f;
  return {
    'Quelle: data-tiles aus tilesMode': svelte.includes('data-tiles={tilesMode(darkTiles)}') && react.includes('data-tiles={tilesMode(darkTiles)}'),
    'Quelle: darkTiles hat den Standard dim': svelte.includes("darkTiles = 'dim'") && react.includes("darkTiles = 'dim'"),
    'Quelle: Sitz in der Liste als Haus-Badge ohne Zahl': svelte.includes('dss-map-num is-seat') && react.includes("'is-seat'") && /kind === 'seat'/.test(svelte) && /kind === 'seat'/.test(react),
    'Quelle: Chip Vereinssitz in der Liste': svelte.includes('{mapText.seat}') && react.includes('{mapText.seat}'),
    'Quelle: Platzhalter-Pin trägt is-seat': svelte.includes("pin.kind === 'seat' ? ' is-seat'") && react.includes("pin.kind === 'seat' && 'is-seat'"),
    'Quelle: Marker nutzt markerName für Titel, Alt und aria-label': (leaflet.match(/markerName\(/g) ?? []).length === 3 && leaflet.includes("className: `dss-map-marker${item.own ? ' is-own' : ''}${item.kind === 'seat' ? ' is-seat' : ''}`"),
    'Quelle: Art ist Teil der Signatur des Markers (Neuaufbau bei Wechsel)': leaflet.includes('item.own, item.kind, item.href'),
    'Quelle: kein style in der Svelte-Datei': !/<style[\s>]/.test(svelte),
  };
}
