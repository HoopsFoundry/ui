// @vitest-environment node
// Das Karten-Bündel dist/vanilla/dss-map.js: lädt in Node ohne window und document, lädt Leaflet nur über einen dynamischen Import (nicht gebündelt, nicht
// statisch), kein innerHTML, exportiert genau die dokumentierte Liste, bleibt im eigenen Größenbudget und erzeugt dasselbe Markup wie die Quellmodule.
import { BUDGETS } from '../scripts/vanilla-budgets.mjs';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import { bundleDir as out } from './helpers/bundle-dir';
import * as source from '../js/map-bundle.js';

const text = (name: string) => readFileSync(`${out}${name}`, 'utf8');
let mod: Record<string, (...a: unknown[]) => unknown>;

// Eigenes Budget für das Karten-Bündel (gemessen: 22 053 B = 21,7 KiB min, 9 055 B = 8,9 KiB gzip). Begründung: Zustände und Markup der Karte, die
// Leaflet-Anbindung (Marker, Gesten, Fehlerfälle) und die Logik aus map.js; Leaflet selbst gehört nicht dazu, es wird erst nach dem Klick geladen.
export const MAP_BUDGET = BUDGETS['dss-map'];
export const MAP_EXPORTS = ['VERSION', 'initMap', 'initMapBlock', 'mountMap', 'renderMap'];

beforeAll(async () => {
  mod = await import(/* @vite-ignore */ pathToFileURL(`${out}dss-map.js`).href);
});

describe('Karten-Bündel dist/vanilla/dss-map', () => {
  it('liefert alle Dateien', () => {
    for (const name of ['dss-map.js', 'dss-map.min.js', 'dss-map.js.map', 'dss-map.min.js.map', 'dss-map.d.ts']) expect(existsSync(`${out}${name}`), name).toBe(true);
  });
  it('lädt in Node ohne window und document; genau die dokumentierte Liste', () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    expect(Object.keys(mod).sort()).toEqual([...MAP_EXPORTS].sort());
    expect(Object.keys(source).sort()).toEqual([...MAP_EXPORTS].sort());
  });
  it('in Node tun init und mount nichts, ohne zu werfen; renderMap liefert Markup', () => {
    const { renderMap, initMap, mountMap, initMapBlock } = mod as Record<string, (...a: unknown[]) => any>;
    expect(() => initMap(null, {}).destroy()).not.toThrow();
    expect(() => mountMap(null, {}).destroy()).not.toThrow();
    expect(() => initMapBlock(null, {}).destroy()).not.toThrow();
    const html = renderMap({ label: 'Karte <1>', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Halle "A"' }] }, { uid: 'n1' }) as string;
    expect(html).toContain('aria-label="Karte &lt;1&gt;"');
    expect(html).toContain('Halle &quot;A&quot;');
    expect(html).toContain('id="dss-map-text-n1"');
    expect(html).toBe((source.renderMap as (...a: unknown[]) => string)({ label: 'Karte <1>', markers: [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Halle "A"' }] }, { uid: 'n1' }));
  });
  it('Leaflet ist nicht gebündelt: nur ein dynamischer import("leaflet"), kein statischer, kein require, sonst kein Import', () => {
    for (const name of ['dss-map.js', 'dss-map.min.js']) {
      const code = text(name);
      expect(code, name).not.toMatch(/^\s*import\s[^;]*from\s*["'][^"']+["']/m);
      expect(code, name).not.toMatch(/\brequire\(/);
      const dynamic = [...code.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
      expect(dynamic, name).toEqual(['leaflet']);
      // nichts von Leaflet selbst: keine Klassen- oder Funktionsdefinitionen
      expect(code, name).not.toContain('L.Map = ');
      for (const word of ['react', 'svelte', 'radix']) expect(code.toLowerCase(), `${name}: ${word}`).not.toContain(word);
    }
  });
  it('kein innerHTML, outerHTML, insertAdjacentHTML, document.write, eval oder new Function', () => {
    for (const name of ['dss-map.js', 'dss-map.min.js']) {
      const code = text(name);
      for (const needle of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'srcdoc']) expect(code, `${name}: ${needle}`).not.toContain(needle);
    }
  });
  it('VERSION ist die Version der package.json (wie im Kern)', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect((mod as unknown as { VERSION: string }).VERSION).toBe(pkg.version);
  });
  it('Größenbudget: min und gzip, getrennt von Kern und Render-Bündel', () => {
    const min = statSync(`${out}dss-map.min.js`).size;
    const gz = gzipSync(readFileSync(`${out}dss-map.min.js`)).length;
    console.log(`dss-map.min.js ${min} Byte, gzip ${gz} Byte; dss-map.js ${statSync(`${out}dss-map.js`).size} Byte`);
    expect(min).toBeLessThanOrEqual(MAP_BUDGET.minBytes);
    expect(gz).toBeLessThanOrEqual(MAP_BUDGET.gzipBytes);
  });
  it('Typen: zusammengeführt in einer Datei, ohne Importe aus dem Paket', () => {
    const types = text('dss-map.d.ts');
    expect(types).not.toMatch(/from ['"]\.\.?\//);
    for (const name of MAP_EXPORTS) expect(types, name).toContain(name);
    for (const name of ['MapProps', 'MapBehavior', 'MapMountHandle', 'loadLeaflet']) expect(types).toContain(name);
  });
  it('Quellkarte verweist auf die Quelldateien', () => {
    const map = JSON.parse(text('dss-map.min.js.map')) as { sources: string[] };
    expect(map.sources.some((s) => s.endsWith('js/map-vanilla.js'))).toBe(true);
    expect(text('dss-map.min.js')).toContain('sourceMappingURL=dss-map.min.js.map');
  });
  it('package.json: Exporte ./vanilla-map und ./map-vanilla.js', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    expect(pkg.exports['./vanilla-map']).toEqual({ types: './dist/vanilla/dss-map.d.ts', import: './dist/vanilla/dss-map.js' });
    expect(pkg.exports['./map-vanilla.js']).toEqual({ types: './js/map-vanilla.d.ts', import: './js/map-vanilla.js' });
  });
});
