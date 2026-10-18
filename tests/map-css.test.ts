// @vitest-environment node
// Karte: CSS-Regeln (Klassen, Zielgrößen, Fokus, Druck, Bewegung, Dunkelmodus), Quelltext der Komponenten, Kontraste in Hell/Dunkel und beiden Marken.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, hex, ratio, over, type Rgb } from './helpers/color';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const start = css.indexOf('/* ── Map (Karte');
const map = css.slice(start, css.indexOf('/* ── LeagueCard'));
const RULES: [string, string][] = [...map.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim().replace(/\s+/g, ' '), m[2]]);
const body = (selector: string) => RULES.filter(([s]) => s === selector).map(([, b]) => b).join(';');

describe('Map: CSS-Abschnitt', () => {
  it('der Abschnitt existiert und enthält alle Klassen des Manifests', () => {
    expect(start).toBeGreaterThan(0);
    const manifest = JSON.parse(read('parity.manifest.json')) as Record<string, { css: string[]; export?: string }>;
    for (const cls of manifest.Map.css) expect(map, cls).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
    expect(manifest.Map.export).toBe('MapView');
  });

  it('Zoom-Schaltflächen sind mindestens 44 px breit und hoch (Zahl aus px oder aus --hoops-touch-sm gerechnet)', () => {
    const btn = body('.hoops-map-zoom-btn');
    const px = (value: string) => {
      const token = value.match(/^var\((--[\w-]+)\)$/);
      if (token) return px(tokens.match(new RegExp(`${token[1]}:\\s*([^;]+);`))![1].trim());
      const n = value.match(/^(\d+(?:\.\d+)?)px$/);
      return n ? Number(n[1]) : NaN;
    };
    for (const prop of ['width', 'height']) {
      const value = btn.match(new RegExp(`(?:^|[;\\s])${prop}:\\s*([^;]+);`))![1].trim();
      expect(px(value), `${prop}: ${value}`).toBeGreaterThanOrEqual(44);
    }
    expect(px('var(--hoops-touch-sm)')).toBe(44);
  });

  it('Marker haben eine Zielgröße von 44 px Breite (Icon 44 × 46 im Skript)', () => {
    const js = read('js/map-leaflet.js');
    expect(js).toMatch(/iconSize: \[44, 46\]/);
  });

  it('Fokus-Ringe sind gestrichelt (--hoops-ring-style) an Zoom, Kartenfläche, Marker, Quellenlink und Sprungmarke', () => {
    for (const selector of ['.hoops-map-zoom-btn:focus-visible', '.hoops-map-canvas.leaflet-container:focus-visible', '.hoops-map-marker:focus-visible', '.hoops-map-attr a:focus-visible', '.hoops-map-skip:focus-visible']) {
      expect(body(selector), selector).toMatch(/outline:\s*var\(--hoops-ring-w\) var\(--hoops-ring-style\) var\(--hoops-ring-color\)/);
    }
    expect(map).not.toMatch(/outline:\s*(?!var\(--hoops-ring-w\)|none)[^;]*solid/);
  });

  it('gesperrter Zoom: aria-disabled grau und mit Cursor-Hinweis, kein Hover', () => {
    expect(body('.hoops-map-zoom-btn[aria-disabled="true"]')).toMatch(/opacity:\s*0\.45/);
    expect(RULES.map(([s]) => s)).toContain('.hoops-map-zoom-btn:hover:not([aria-disabled="true"])');
  });

  it('Druck: statt der Karte nur die Liste; die Sprungmarke entfällt, die stille Liste wird sichtbar', () => {
    const printAt = map.indexOf('@media print');
    expect(printAt).toBeGreaterThan(0);
    const print = map.slice(printAt);
    expect(print).toMatch(/\.hoops-map-frame, \.hoops-map-skip \{ display: none; \}/);
    expect(print).toMatch(/\.hoops-map-text\.is-quiet \{ position: static;/);
  });

  it('Bewegung: bei reduzierter Bewegung (Medienabfrage und data-motion) keine Übergänge der Karte', () => {
    expect(map).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.hoops-map-zoom-btn \{ transition: none !important; animation: none !important; \}/);
    expect(map).toMatch(/:root\[data-motion="reduce"\] \.hoops-map-zoom-btn \{ transition: none !important/);
    expect(map).toMatch(/:root\[data-motion="reduce"\] \.hoops-map \.leaflet-zoom-anim/);
  });

  it('Dunkelmodus: der Filter wirkt nur auf die Kachelebene (nie auf Marker, Steuerung oder Rahmen), per Media-Query und data-theme', () => {
    const filters = RULES.filter(([, b]) => /filter:\s*brightness/.test(b)).map(([s]) => s);
    expect(filters).toHaveLength(2);
    for (const selector of filters) expect(selector).toMatch(/\.hoops-map\[data-dim="true"\] \.hoops-map-tiles$/);
    expect(filters.some((s) => s.startsWith(':root[data-theme="dark"]'))).toBe(true);
    expect(filters.some((s) => s.startsWith(':root:not([data-theme="light"])'))).toBe(true);
    // das einzige andere `filter` ist der Schatten am Pin
    expect(RULES.filter(([, b]) => /(^|[;\s])filter:/.test(b) && !/brightness/.test(b)).map(([s]) => s)).toEqual(['.hoops-map-pin']);
  });

  it('Quellenangabe: immer eingeblendet (kein display:none, keine Deckkraft unter 1), 28 px hoch, über den Leaflet-Ebenen', () => {
    const attr = body('.hoops-map-attr');
    expect(attr).not.toMatch(/display:\s*none|opacity|visibility/);
    expect(attr).toMatch(/z-index:\s*1001/);
    expect(body('.hoops-map-attr a')).toMatch(/min-height:\s*28px/);
    expect(body('.hoops-map-attr')).toMatch(/background:\s*var\(--hoops-surface\)/);
  });

  it('Platzhalter und Status liegen über den Leaflet-Ebenen (z-index ab 900)', () => {
    expect(body('.hoops-map-ph')).toMatch(/z-index:\s*900/);
    expect(body('.hoops-map-status:not(:empty)')).toMatch(/z-index:\s*1002/);
    expect(body('.hoops-map-stage')).toMatch(/isolation:\s*isolate/);
  });

  it('keine nackten --ok/err/warn/info-text oder -soft (haben keinen Dunkelmodus), kein festes Hex, keine Elementselektoren für Überschriften', () => {
    expect(map).not.toMatch(/var\(--hoops-(ok|err|warn|info)-(text|soft|fill)\)/);
    expect(map.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(RULES.filter(([s]) => /(^|[\s>+~,])h[1-6](?![-\w])/.test(s))).toEqual([]);
  });

  it('Pin-Farben laufen über Tokens mit Rückfall (Marken und Themes ändern sie nicht)', () => {
    expect(body('.hoops-map-pin-body')).toMatch(/fill:\s*var\(--hoops-map-pin-bg, var\(--hoops-base-1000\)\)/);
    expect(body('.hoops-map-pin-body')).toMatch(/stroke:\s*var\(--hoops-map-pin-ring, var\(--hoops-n-0\)\)/);
    expect(body('.hoops-map-marker.is-own .hoops-map-pin-body')).toMatch(/var\(--hoops-cta-bg\)/);
  });
});

describe('Map: Quelltext', () => {
  const sources = ['svelte/Map.svelte', 'react/Map.tsx'];
  it('Svelte-Datei hat kein <style>', () => {
    expect(read('svelte/Map.svelte')).not.toContain('<style');
  });
  it.each(sources)('%s: gemeinsame Funktionen, Standardwerte, Pflichtteile im Markup', (path) => {
    const source = read(path);
    expect(source).toContain("from '../js/map.js'");
    expect(source).toContain("from '../js/map-leaflet.js'");
    for (const fn of ['mapItems(', 'placeholderPins(', 'validTileUrl(', 'createMapController(']) expect(source, fn).toContain(fn);
    expect(source).toMatch(/height = 320/);
    expect(source).toMatch(/interactive = true/);
    expect(source).toMatch(/load = 'click'/);
    expect(source).toMatch(/appLinks = \['osm', 'route'\]/);
    expect(source).toMatch(/showList = true/);
    expect(source).toMatch(/dimInDark = true/);
    expect(source).toContain('role="region"');
    expect(source).toContain('role="status"');
    expect(source).toContain('hoops-map-skip');
    expect(source).toContain('hoops-map-attr');
    expect(source).toContain('aria-controls');
    expect(source).toContain('mapText.zoomIn');
    expect(source).toContain('mapText.zoomOut');
  });
  it.each(sources)('%s: es gibt keinen Prop zum Ausblenden der Quellenangabe', (path) => {
    const source = read(path);
    expect(source).not.toMatch(/hideAttribution|showAttribution|noAttribution|attributionControl\s*[:=]\s*true/);
    expect(source).toContain('mapText.attribution');
  });
  it('Leaflet wird nur dynamisch geladen, nie statisch', () => {
    for (const path of [...sources, 'js/map.js', 'js/map-leaflet.js']) expect(read(path), path).not.toMatch(/^\s*import[^;\n]*from\s+['"]leaflet['"]/m);
    // der Standardlader ist der dynamische Import, `loadLeaflet` (hooks) ersetzt ihn für Seiten ohne Bundler
    expect(read('js/map-leaflet.js')).toMatch(/hooks\.loadLeaflet\(\) : import\('leaflet'\)/);
  });
  it('Leaflets Standardsteuerung und -bilder werden nicht verwendet; Marker sind Inline-SVG (L.divIcon)', () => {
    const js = read('js/map-leaflet.js');
    expect(js).toMatch(/zoomControl: false/);
    expect(js).toMatch(/attributionControl: false/);
    expect(js).toContain('L.divIcon(');
    expect(js).not.toMatch(/L\.icon\(|marker-icon|\.png|iconUrl/);
    expect(js).toMatch(/keyboard: true/);
    expect(js).toMatch(/markerName\(item, textOptions\(\)\)/);
    expect(js).toMatch(/title: name, alt: name/);
    expect(js).toMatch(/map\.remove\(\)/);
  });
  it('Animationen aus bei reduzierter Bewegung (Optionen im Skript)', () => {
    const js = read('js/map-leaflet.js');
    for (const option of ['zoomAnimation', 'fadeAnimation', 'markerZoomAnimation', 'inertia']) expect(js).toMatch(new RegExp(`${option}: !calm`));
    // die Abfrage liegt gemeinsam in js/motion.js; map-leaflet nutzt sie
    const motion = read('js/motion.js');
    expect(js).toMatch(/import \{ reducedMotion \} from '\.\/motion\.js'/);
    expect(motion).toContain("dataset?.motion === 'reduce'");
    expect(motion).toContain('(prefers-reduced-motion: reduce)');
  });
  it('package.json: optionale Peer-Abhängigkeit leaflet, Dev-Abhängigkeiten, Exporte', () => {
    const pkg = JSON.parse(read('package.json')) as {
      exports: Record<string, unknown>; peerDependencies: Record<string, string>; peerDependenciesMeta: Record<string, { optional?: boolean }>; devDependencies: Record<string, string>; dependencies?: Record<string, string>;
    };
    expect(pkg.peerDependencies.leaflet).toMatch(/^\^1\./);
    expect(pkg.peerDependenciesMeta.leaflet).toEqual({ optional: true });
    expect(pkg.devDependencies.leaflet).toMatch(/^\^1\./);
    expect(pkg.devDependencies['@types/leaflet']).toBeDefined();
    expect(pkg.peerDependencies['@types/leaflet']).toBeUndefined();
    expect(pkg.dependencies?.leaflet).toBeUndefined();
    expect(pkg.exports['./map.js']).toEqual({ types: './js/map.d.ts', import: './js/map.js' });
    expect(pkg.exports['./svelte/Map']).toBe('./svelte/Map.svelte');
    expect(read('react/index.ts')).toMatch(/MapView[^;]*type MapViewProps[^;]*from '\.\/Map'/);
  });
  it('die Vorschau von Storybook lädt leaflet.css', () => {
    expect(read('.storybook/preview.ts')).toContain("import 'leaflet/dist/leaflet.css'");
  });
});

// ── Kontraste: Text ≥ 7:1 (AAA), Marker und Rahmen ≥ 3:1; Hell, Dunkel (Media-Query und data-theme), BBV und DBB ──
const blocks = {
  Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
  'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --hoops-fg'),
  'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg'),
};
const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');

// Typische OSM-Kachelfarben (Standardstil): Land, Wasser, Wald, Park, Straße; im Dunkelmodus mit brightness(0.8)
const TILES: Record<string, Rgb> = { Land: hex('#f2efe9'), Wasser: hex('#aad3df'), Wald: hex('#add19e'), Park: hex('#c8facc'), Straße: hex('#ffffff'), Gebäude: hex('#d9d0c9') };
const dim = (c: Rgb, factor: number): Rgb => over([0, 0, 0] as Rgb, c, 1 - factor);

describe('Map: Kontraste', () => {
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${blocks.Hell}\n${block}\n${brand === 'DBB' ? dbb : ''}\n${tokens}`;
      const c = (token: string) => color(`var(${token})`, scope);
      const dark = name.startsWith('Dunkel');
      describe(`${name}, ${brand}`, () => {
        it('Quellenangabe (--hoops-link auf --hoops-surface) und Text ≥ 7:1', () => {
          expect(ratio(c('--hoops-link'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-fg'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-fg-soft'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
        });
        it('Koordinaten (--hoops-mute) auf Seite und Fläche ≥ 7:1, Platzhalter-Hinweis (--hoops-fg-soft auf --hoops-surface)', () => {
          for (const surface of ['--hoops-surface', '--hoops-surface-2']) expect(ratio(c('--hoops-mute'), c(surface)), surface).toBeGreaterThanOrEqual(7);
        });
        it('Zoom-Schaltfläche: Zeichen ≥ 7:1 auf der Fläche, Rand und Ring ≥ 3:1', () => {
          expect(ratio(c('--hoops-fg'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-fg'), c('--hoops-hover-bg'))).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-line-strong'), c('--hoops-surface-2'))).toBeGreaterThanOrEqual(1.2);
        });
        it('Marker: Nummer (Weiß auf Pin) und eigene Nummer (--hoops-cta-fg auf --hoops-cta-bg) ≥ 7:1', () => {
          expect(ratio(c('--hoops-n-0'), c('--hoops-base-1000'))).toBeGreaterThanOrEqual(7);
          expect(ratio(c('--hoops-cta-fg'), c('--hoops-cta-bg'))).toBeGreaterThanOrEqual(7);
        });
        it('Marker gegen helle und dunkle Kacheln: Füllung oder Ring mit ≥ 3:1 (beide Kachelhelligkeiten)', () => {
          for (const [tile, rgb] of Object.entries(TILES)) {
            const shown = dark ? dim(rgb, 0.8) : rgb;
            // Außen die dunkle Kontur, dann der weiße Ring: beide zusammen umranden den Pin (auch den eigenen in Gold); jeder Kachelton hebt sich von mindestens einem ab
            const edge = c('--hoops-base-1000');
            const ring = c('--hoops-n-0');
            expect(Math.max(ratio(edge, shown), ratio(ring, shown)), `Rand auf ${tile}`).toBeGreaterThanOrEqual(3);
            // Der Pin-Körper (dunkel) hebt sich vom weißen Ring ab, die Nummer steht auf dem Körper
            expect(ratio(c('--hoops-base-1000'), ring)).toBeGreaterThanOrEqual(7);
            // Der goldene Körper des eigenen Pins hebt sich von der dunklen Kontur ab
            expect(ratio(c('--hoops-cta-bg'), edge)).toBeGreaterThanOrEqual(7);
          }
        });
        it('Fokus-Ring auf Fläche ≥ 3:1', () => {
          const ring = dark ? c('--hoops-ring-color-on-dark') : c('--hoops-ring-color');
          expect(ratio(ring, c('--hoops-surface'))).toBeGreaterThanOrEqual(3);
        });
        it('Fehlerhinweis und Ladehinweis (--hoops-fg auf --hoops-surface) ≥ 7:1, Rand der Box ≥ 1,2:1', () => {
          expect(ratio(c('--hoops-fg'), c('--hoops-surface'))).toBeGreaterThanOrEqual(7);
        });
        it('Eigener Ort steht auch als Text („Eigener Ort“-Chip), Chip-Farben ≥ 7:1', () => {
          expect(ratio(c('--hoops-chip-amber-fg'), c('--hoops-chip-amber-bg'))).toBeGreaterThanOrEqual(7);
        });
      });
    }
  }
});
