// @vitest-environment node
// Das Render-Bündel dist/vanilla/dss-render.js: lädt in Node ohne window, importiert nur den Kern (./dss.js), kein Framework, kein innerHTML,
// exportiert genau die dokumentierte Liste, bleibt im eigenen Größenbudget und erzeugt dasselbe Markup wie die Quellmodule.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import { bundleDir as out } from './helpers/bundle-dir';
import * as source from '../js/render/index.js';

const text = (name: string) => readFileSync(`${out}${name}`, 'utf8');
let mod: Record<string, (...a: unknown[]) => unknown>;

// Eigenes Budget für das Render-Bündel (gemessen: 51 312 B = 50,2 KiB min, 17 450 B = 17,1 KiB gzip; der Kern hat sein eigenes in vanilla-bundle.test.ts: 37 164 B, 13 241 B; die Karte liegt im Bündel dss-map).
// Begründung: zehn Komponenten mit Markup, Logik aus league/schedule/team/venue/map; das Accordion kommt aus dem Kern und zählt hier nicht.
export const RENDER_BUDGET = { minBytes: 52 * 1024, gzipBytes: 18 * 1024 };

export const RENDER_EXPORTS = [
  'attr', 'esc', 'mount', 'mountEmptyState', 'mountFormChips', 'mountLeagueCard', 'mountMatchCard', 'mountScheduleGrid', 'mountScheduleTable',
  'mountStats', 'mountTable', 'mountTeamCard', 'mountVenueCard', 'renderEmptyState', 'renderFormChips', 'renderLeagueCard', 'renderMatchCard',
  'renderScheduleGrid', 'renderScheduleTable', 'renderStats', 'renderTable', 'renderTeamCard', 'renderVenueCard', 'VERSION',
];

beforeAll(async () => {
  mod = await import(/* @vite-ignore */ pathToFileURL(`${out}dss-render.js`).href);
});

describe('Render-Bündel dist/vanilla/dss-render', () => {
  it('liefert alle Dateien', () => {
    for (const name of ['dss-render.js', 'dss-render.min.js', 'dss-render.js.map', 'dss-render.min.js.map', 'dss-render.d.ts']) expect(existsSync(`${out}${name}`), name).toBe(true);
  });
  it('lädt in Node ohne window und document; genau die dokumentierte Liste', () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(Object.keys(mod).sort()).toEqual([...RENDER_EXPORTS].sort());
    expect(Object.keys(source).sort()).toEqual([...RENDER_EXPORTS].sort());
  });
  it('importiert nur den Kern desselben Ordners (dss.js bzw. dss.min.js), sonst nichts', () => {
    for (const [name, core] of [['dss-render.js', './dss.js'], ['dss-render.min.js', './dss.min.js']] as const) {
      const code = text(name);
      const imports = [...code.matchAll(/(?:^|[;}\s])import\s*(?:\{[^}]*\}\s*from\s*)?["']([^"']+)["']/g)].map((m) => m[1]);
      expect(imports, name).toEqual([core]);
      expect(code, name).not.toMatch(/\brequire\(/);
      expect(code, name).not.toMatch(/import\(/);
      for (const word of ['react', 'svelte', 'radix']) expect(code.toLowerCase(), `${name}: ${word}`).not.toContain(word);
      // Leaflet gehört nicht ins Bündel (die Karte kommt über die Option `initMap` aus dss-map.js); `loadLeaflet` ist nur ein Optionsname
      expect(code, `${name}: leaflet`).not.toMatch(/from\s*["']leaflet|import\(\s*["']leaflet|require\(\s*["']leaflet/);
    }
  });
  it('kein innerHTML, outerHTML, insertAdjacentHTML, document.write, eval oder new Function', () => {
    for (const name of ['dss-render.js', 'dss-render.min.js']) {
      const code = text(name);
      for (const needle of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'srcdoc']) expect(code, `${name}: ${needle}`).not.toContain(needle);
    }
  });
  it('das Bündel erzeugt dasselbe Markup wie die Quellmodule (in Node, ohne DOM)', () => {
    const cases: [string, Record<string, unknown>][] = [
      ['renderLeagueCard', { title: 'Oberliga', teams: [{ rank: 1, name: 'A', own: true, points: 4, form: ['S', 'N'] }], columns: ['form'], collapsible: true, open: true, id: 'o', live: 2 }],
      ['renderScheduleTable', { games: [{ id: 'a', state: 'finished', heim: { name: 'A', score: 3 }, gast: { name: 'B', score: 2 } }], title: 'Plan' }],
      ['renderVenueCard', { name: 'Halle', lat: 49.3, lng: 7.9, address: { street: 'Weg 1', city: 'Ort' } }],
      ['renderTable', { title: 'T', columns: [{ key: 'a', label: 'A' }], rows: [['x']] }],
    ];
    for (const [name, props] of cases) {
      const html = mod[name](props) as string;
      expect(html, name).toBe((source as Record<string, (p: unknown) => string>)[name](props));
      expect(html.length, name).toBeGreaterThan(100);
    }
    expect(mod.esc('<a href="x">&\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
  });
  it('VERSION ist die Version der package.json (wie im Kern)', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect((mod as unknown as { VERSION: string }).VERSION).toBe(pkg.version);
  });
  it('Größenbudget: min und gzip, getrennt vom Kern', () => {
    const min = statSync(`${out}dss-render.min.js`).size;
    const gz = gzipSync(readFileSync(`${out}dss-render.min.js`)).length;
    console.log(`dss-render.min.js ${min} Byte, gzip ${gz} Byte; dss-render.js ${statSync(`${out}dss-render.js`).size} Byte`);
    expect(min).toBeLessThanOrEqual(RENDER_BUDGET.minBytes);
    expect(gz).toBeLessThanOrEqual(RENDER_BUDGET.gzipBytes);
  });
  it('Typen: zusammengeführt in einer Datei, ohne Importe aus dem Paket', () => {
    const types = text('dss-render.d.ts');
    expect(types).not.toMatch(/from ['"]\.\.?\//);
    for (const name of RENDER_EXPORTS) expect(types, name).toContain(name);
    for (const name of ['LeagueCardProps', 'TableProps', 'MountHandle', 'ScheduleRenderOptions']) expect(types).toContain(name);
  });
  it('Quellkarte verweist auf die Quelldateien in js/render', () => {
    const map = JSON.parse(text('dss-render.min.js.map')) as { sources: string[] };
    expect(map.sources.some((s) => s.endsWith('js/render/league-card.js'))).toBe(true);
    expect(text('dss-render.min.js')).toContain('sourceMappingURL=dss-render.min.js.map');
  });
  it('package.json: Export ./vanilla-render, ./render.js und die Einzelmodule', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(pkg.exports['./vanilla-render']).toEqual({ types: './dist/vanilla/dss-render.d.ts', import: './dist/vanilla/dss-render.js' });
    expect(pkg.exports['./render.js']).toEqual({ types: './js/render/index.d.ts', import: './js/render/index.js' });
    for (const name of ['league-card', 'schedule', 'table', 'stats', 'empty-state', 'match-card', 'team-card', 'venue-card', 'mount', 'escape']) {
      expect(pkg.exports[`./render/${name}.js`], name).toEqual({ types: `./js/render/${name}.d.ts`, import: `./js/render/${name}.js` });
    }
  });
});
