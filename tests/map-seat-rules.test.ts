// Sitzmarker und darkTiles: Aussagen aus tests/helpers/map-seat-rules.ts am echten Quelltext, dazu die Kontraste der invertierten Kacheln.
import { describe, expect, it } from 'vitest';
import * as map from '../js/map.js';
import * as leaflet from '../js/map-leaflet.js';
import { blockOf, color, hex, ratio, type Rgb } from './helpers/color';
import { read } from './helpers/mutation';
import { mapSeatCssRules, mapSeatLogicRules, mapSeatSourceRules } from './helpers/map-seat-rules';

describe('Sitzmarker und darkTiles: Aussagen', () => {
  it.each(Object.entries(mapSeatLogicRules(map as never, leaflet as never)))('Logik: %s', (_n, ok) => expect(ok).toBe(true));
  it.each(Object.entries(mapSeatCssRules(read('css/components.css'))))('%s', (_n, ok) => expect(ok).toBe(true));
  it.each(Object.entries(mapSeatSourceRules({ svelte: read('svelte/Map.svelte'), react: read('react/Map.tsx'), leaflet: read('js/map-leaflet.js') })))('%s', (_n, ok) => expect(ok).toBe(true));
});

// invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9): CSS-Filterfunktionen rechnen in sRGB
const invertTile = ([r, g, b]: Rgb): Rgb => {
  const inv = [1 - r, 1 - g, 1 - b];
  const m = [
    [-0.574, 1.43, 0.144],
    [0.426, 0.43, 0.144],
    [0.426, 1.43, -0.856],
  ];
  const rot = m.map((row) => row[0] * inv[0] + row[1] * inv[1] + row[2] * inv[2]);
  return rot.map((v) => Math.min(1, Math.max(0, (Math.min(1, Math.max(0, v * 0.85)) - 0.5) * 0.9 + 0.5))) as Rgb;
};
const TILES: Record<string, Rgb> = { Land: hex('#f2efe9'), Wasser: hex('#aad3df'), Wald: hex('#add19e'), Park: hex('#c8facc'), Straße: hex('#ffffff'), Gebäude: hex('#d9d0c9') };

describe('Kontraste: Marker auf invertierten Kacheln (Dunkelmodus, darkTiles="invert")', () => {
  const css = read('css/components.css');
  const tokens = read('tokens/tokens.css');
  const light = blockOf(css, '/* ── Semantische Aliase · Light');
  const dark = blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg');
  for (const brand of ['BBV', 'DBB'] as const) {
    const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${light}\n${dark}\n${tokens}`;
    const c = (t: string) => color(`var(${t})`, scope);
    it(`${brand}: Kontur oder Ring heben sich von jeder invertierten Kachel mit mindestens 3:1 ab`, () => {
      for (const [name, rgb] of Object.entries(TILES)) {
        const shown = invertTile(rgb);
        expect(Math.max(ratio(c('--hoops-base-1000'), shown), ratio(c('--hoops-n-0'), shown)), name).toBeGreaterThanOrEqual(3);
      }
    });
    it(`${brand}: das weiße Haus steht auf dem dunklen Pin mit mindestens 7:1, auf dem goldenen eigenen Pin dessen cta-Vordergrund`, () => {
      expect(ratio(c('--hoops-n-0'), c('--hoops-base-1000'))).toBeGreaterThanOrEqual(7);
      expect(ratio(c('--hoops-cta-fg'), c('--hoops-cta-bg'))).toBeGreaterThanOrEqual(7);
    });
    it(`${brand}: Quellenangabe liegt auf eigener Fläche, unabhängig von den Kacheln (≥ 7:1)`, () => {
      expect(ratio(c('--hoops-link'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
      expect(ratio(c('--hoops-fg'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
    });
  }
  it('die Filterrechnung stimmt an bekannten Punkten (Weiß wird dunkel, Schwarz hell)', () => {
    const white = invertTile([1, 1, 1]);
    const black = invertTile([0, 0, 0]);
    expect(white[0]).toBeLessThan(0.5);
    expect(black[0]).toBeGreaterThan(0.4);
  });
});
