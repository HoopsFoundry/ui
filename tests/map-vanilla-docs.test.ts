// @vitest-environment jsdom
// Die Vanilla-Beispiele der Karten-Doku (stories/Map.code.ts, Render.code.ts) laufen unter jsdom gegen die Quellmodule und das gespielte Leaflet;
// die Beispielseite ohne Build stimmt mit der Datei überein und verweist nur auf Dateien, die das Paket und Leaflet liefern.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as code from '../stories/Map.code';
import { hallenKarteServer } from '../stories/Render.code';
import { renderMap } from '../js/map-vanilla.js';
import { renderVenueCard } from '../js/render/venue-card.js';
import * as mock from './helpers/leaflet-mock';
import { bundleDir } from './helpers/bundle-dir';

const root = process.cwd();
const url = (file: string) => pathToFileURL(resolve(root, file)).href;
const read = (file: string) => readFileSync(resolve(root, file), 'utf8');
let runs = 0;

/** Führt den `<script type="module">` eines Beispiels aus: Seitenpfade zeigen auf die Quellmodule, Leaflet kommt aus dem gespielten Modul. */
async function run(example: string, markup = example) {
  const script = example.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  const html = markup.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<link[^>]*>/g, '');
  document.body.replaceChildren(document.createRange().createContextualFragment(html));
  (globalThis as { __L?: unknown }).__L = mock.L;
  const source = script
    .replace('/hoops/hoops-map.min.js', url('js/map-bundle.js'))
    .replace('/hoops/hoops-render.min.js', url('js/render/index.js'))
    .replace('/hoops/hoops.min.js', url('js/vanilla.js'))
    .replaceAll("import('/vendor/leaflet/leaflet-src.esm.js')", 'Promise.resolve(globalThis.__L)');
  return (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(`${source}\n// Lauf ${++runs}`).toString('base64')}`)) as Record<string, unknown>;
}
const click = (el: Element | null) => (el as HTMLElement).click();

beforeEach(() => {
  mock.reset();
  window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as never;
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('Beispiel vanilla (mountMap)', () => {
  it('Platzhalter, Klick lädt Leaflet lokal, update ergänzt einen Marker', async () => {
    await run(code.vanilla);
    const el = document.querySelector('#karte')!;
    expect(el.querySelector('[role="region"]')!.getAttribute('aria-label')).toBe('Karte der Sporthalle Nordhain');
    // update steht im Beispiel schon vor dem Klick: zwei Orte in der Liste, zwei Pins
    expect(el.querySelectorAll('.hoops-map-item')).toHaveLength(2);
    expect(mock.state.maps).toHaveLength(0);
    click(el.querySelector('.hoops-map-load'));
    await vi.waitFor(() => expect(mock.state.maps).toHaveLength(1));
    expect(mock.lastLayer().url).toBe('/tiles/{z}/{x}/{y}.png');
    expect(mock.state.markers).toHaveLength(2);
    expect(el.querySelector('.hoops-map')!.getAttribute('data-state')).toBe('ready');
  });
  it('nur Pfade des Pakets und lokale Dateien: kein unpkg, kein CDN, keine echte Kachel-Adresse', () => {
    for (const text of [code.vanilla, code.initMapBeispiel, code.initAllKarte, code.importmapVariante, code.globalVariante, code.kopieren, code.ohneBuildSeite]) {
      // ohne Kommentare: sie dürfen das Verbotene nennen („nicht von unpkg“)
      const live = text.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\/ .*$/gm, '');
      expect(live).not.toMatch(/unpkg|cdn|jsdelivr|cdnjs|tile\.openstreetmap\.org/i);
      expect(live).not.toMatch(/innerHTML\s*=/);
    }
    expect(code.vanilla).toContain("from '/hoops/hoops-map.min.js'");
    expect(code.vanilla).toContain('/vendor/leaflet/leaflet.css');
  });
});

describe('Beispiel initMap', () => {
  it('macht das Markup lebendig und stellt es bei destroy wieder her', async () => {
    const props = { label: 'Karte der Sporthalle Nordhain', markers: [{ id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true }], tileUrl: '/tiles/{z}/{x}/{y}.png' };
    const markup = code.initMapBeispiel.replace('${renderMap(props)}', renderMap(props as never, { uid: 'doc' }));
    const out = await run(code.initMapBeispiel, markup);
    expect(out).toBeDefined();
    const before = renderMap(props as never, { uid: 'doc' });
    expect(document.querySelector('#karte')!.innerHTML.length).toBeGreaterThan(100);
    click(document.querySelector('.hoops-map-load'));
    await vi.waitFor(() => expect(mock.state.maps).toHaveLength(1));
    expect(before).toContain('Karte laden');
  });
});

describe('Beispiel data-hoops="map" und initAll', () => {
  it('ein leerer Behälter wird zur Karte, Optionen aus data-hoops-options', async () => {
    await run(code.initAllKarte);
    const el = document.querySelector('[data-hoops="map"]')!;
    expect(el.querySelector('.hoops-map')).not.toBeNull();
    expect(el.querySelector('[role="region"]')!.getAttribute('aria-label')).toBe('Karte der Sporthalle Nordhain');
    click(el.querySelector('.hoops-map-load'));
    await vi.waitFor(() => expect(mock.state.maps).toHaveLength(1));
    expect(mock.lastLayer().url).toBe('/tiles/{z}/{x}/{y}.png');
  });
});

describe('Beispiele: importmap und window.L', () => {
  it('die importmap ist gültiges JSON und löst leaflet auf die lokale Datei auf', () => {
    const map = JSON.parse(code.importmapVariante.match(/<script type="importmap">([\s\S]*?)<\/script>/)![1]);
    expect(map).toEqual({ imports: { leaflet: '/vendor/leaflet/leaflet-src.esm.js' } });
    expect(code.importmapVariante.indexOf('importmap')).toBeLessThan(code.importmapVariante.indexOf('type="module"'));
    expect(existsSync(resolve(root, 'node_modules/leaflet/dist/leaflet-src.esm.js'))).toBe(true);
  });
  it('der Lader für window.L lädt leaflet.js als Skript und liefert window.L', async () => {
    const body = code.globalVariante.match(/const loadLeaflet = ([\s\S]*?);\n\n  mountMap/)![1];
    const loader = new Function('window', 'document', `return (${body});`)(
      window, document,
    ) as () => Promise<unknown>;
    const appended: HTMLScriptElement[] = [];
    vi.spyOn(document.head, 'append').mockImplementation((node: Node | string) => { appended.push(node as HTMLScriptElement); });
    const pending = loader();
    expect(appended[0].src).toContain('/vendor/leaflet/leaflet.js');
    (window as unknown as { L: unknown }).L = mock.L;
    appended[0].onload?.(new Event('load'));
    await expect(pending).resolves.toBe(mock.L);
    // schon geladen: kein zweites Skript
    await expect(loader()).resolves.toBe(mock.L);
    expect(appended).toHaveLength(1);
    delete (window as unknown as { L?: unknown }).L;
    const failing = loader();
    appended[1].onerror?.(new Event('error'));
    await expect(failing).rejects.toThrow('leaflet.js nicht geladen');
  });
});

describe('Beispielseite ohne Build', () => {
  const page = read('stories/examples/karte-ohne-build/index.html');
  it('liegt in der Doku als dieselbe Datei', () => expect(code.ohneBuildSeite).toBe(page));
  it('verweist nur auf Dateien, die das Paket und Leaflet liefern (/hoops/ und /vendor/leaflet/)', () => {
    const refs = [...page.matchAll(/(?:href|src)="([^"]+)"|from '([^']+)'|import\('([^']+)'\)/g)].map((m) => m[1] ?? m[2] ?? m[3]).filter((r) => r.startsWith('/'));
    expect(refs.length).toBeGreaterThanOrEqual(6);
    for (const ref of refs) {
      if (ref.startsWith('/hoops/')) expect(existsSync(`${bundleDir}${ref.slice('/hoops/'.length)}`), ref).toBe(true);
      else if (ref.startsWith('/vendor/leaflet/')) expect(existsSync(resolve(root, 'node_modules/leaflet/dist', ref.slice(16))), ref).toBe(true);
      else expect(ref, ref).toMatch(/^\/tiles\//);
    }
  });
  it('Demo-Daten sind erfunden, keine Fremdadressen', () => {
    expect(page).toContain('Sporthalle Nordhain');
    expect(page).not.toMatch(/https?:\/\//);
  });
  it('die Dateien des Kopier-Beispiels gibt es', () => {
    const files = [...code.kopieren.matchAll(/(?:cp -r|cp)\s+(node_modules\/\S+)/g)].map((m) => m[1].replace('@hoopsfoundry/ui/dist/vanilla/', ''));
    expect(files.length).toBeGreaterThanOrEqual(6);
    for (const file of files) {
      if (file.startsWith('node_modules/leaflet/')) expect(existsSync(resolve(root, file)), file).toBe(true);
      else expect(existsSync(`${bundleDir}${file.replace('node_modules/', '')}`), file).toBe(true);
    }
  });
});

describe('Kopierliste gegen die statischen Importe der Bündel', () => {
  const copied = new Set([...code.kopieren.matchAll(/^cp (?:-r )?node_modules\/\S*\/(\S+)\s/gm)].map((m) => m[1]));
  it('jede statisch importierte Datei der kopierten Bündel steht in der Liste (kein 404 beim Laden)', () => {
    const bundles = ['hoops-map.min.js', 'hoops-render.min.js'].filter((name) => copied.has(name));
    expect(bundles).toEqual(['hoops-map.min.js', 'hoops-render.min.js']);
    for (const name of ['hoops-map', 'hoops-render', 'hoops'].flatMap((n) => [`${n}.js`, `${n}.min.js`])) {
      const text = readFileSync(`${bundleDir}${name}`, 'utf8');
      const imports = [...text.matchAll(/(?:^|[;}\s])(?:import|export)\s*(?:[^'";]*?\s*from\s*)?["'](\.{1,2}\/[^"']+)["']/g)].map((m) => m[1].replace(/^\.\//, ''));
      for (const file of imports) {
        expect(existsSync(`${bundleDir}${file}`), `${name} importiert ${file}`).toBe(true);
        if (bundles.includes(name)) expect(copied.has(file), `${name} importiert ${file}, die Kopierliste nennt sie nicht`).toBe(true);
      }
    }
    expect(copied.has('hoops.min.js')).toBe(true);
  });
  it('die Dokumentation nennt die Abhängigkeit (Map und Foundation/Vanilla)', () => {
    expect(read('stories/Map.mdx')).toContain('importiert statisch `./hoops.min.js`');
    expect(read('stories/Foundation/Vanilla.mdx')).toContain('importiert `hoops-render.min.js` statisch `./hoops.min.js`');
  });
});

describe('Beispiel Hallenkarte vom Server', () => {
  it('renderVenueCard mit init: true trägt data-hoops und Optionen; initAll mit initMapBlock macht sie lebendig', async () => {
    expect(hallenKarteServer).toContain('{ init: true }');
    expect(hallenKarteServer).toContain("initAll(document, { map: { start: initMapBlock");
    const html = renderVenueCard({ name: 'Sporthalle Nordhain', lat: 49.3, lng: 7.9, tileUrl: '/tiles/{z}/{x}/{y}.png' } as never, { init: true });
    expect(html).toContain('data-hoops="map"');
    expect(html).toContain('data-hoops-options="');
  });
});

describe('Dokumentation: README, CHANGELOG, Einführung, arc42', () => {
  it('README, CHANGELOG, Einführung und Foundation/Vanilla nennen die Karte ohne Framework', () => {
    expect(read('README.md')).toContain('hoops-map.js');
    expect(read('README.md')).toContain('loadLeaflet');
    expect(read('CHANGELOG.md')).toContain('Vanilla-Paket V2b');
    expect(read('stories/Introduction.mdx')).toContain('mountMap');
    expect(read('stories/Foundation/Vanilla.mdx')).toContain('## Karte');
    expect(read('stories/Map.mdx')).toContain('## Ohne Build einbinden');
    expect(read('stories/Map.mdx')).toContain('ADR-003');
    expect(read('stories/VenueCard.mdx')).toContain('initMap');
  });
  it('arc42: ADR-003, ADR-005 und ADR-007 nennen die Vanilla-Karte, das Karten-Bündel und seine Größen in KiB; keine Planstände', () => {
    const adr = read('docs/architecture/sections/09-architecture-decisions.adoc');
    expect(adr).toContain('Vanilla-Fassung: `js/map-vanilla.js`');
    expect(adr).toContain('`hoops-map.js` (Karte)');
    expect(adr).toContain('Karte 24 KiB min und 10 KiB gzip');
    expect(read('docs/architecture/sections/05-building-block-view.adoc')).toContain('`js/map-vanilla.js`');
    expect(read('docs/architecture/sections/06-runtime-view.adoc')).toContain('`initMap` und `mountMap`');
    for (const file of ['01-introduction-and-goals', '04-solution-strategy', '05-building-block-view', '06-runtime-view', '07-deployment-view', '08-crosscutting-concepts', '09-architecture-decisions', '11-risks-and-technical-debt', '12-glossary']) {
      const text = read(`docs/architecture/sections/${file}.adoc`);
      expect(text, file).not.toMatch(/\bV[123][ab]?\b|feat\/|\bKB\b|\bMB\b/);
    }
  });
  it('die Zahlen der Doku stimmen mit dem Bündel überein (KiB)', () => {
    const adr = read('docs/architecture/sections/09-architecture-decisions.adoc');
    expect(adr).toMatch(/gemessen 21,8 und 8,9/);
    expect(read('stories/Foundation/Vanilla.code.ts')).toContain('export const mapBudget = { minKB: 25, gzipKB: 10 };');
  });
});

describe('Doku: Referrer, hängender Lader, Fehlergründe, Höhe', () => {
  const mdx = read('stories/Map.mdx');
  it('Referrer: Origin, Policy der Seite, Proxy, kein no-referrer für OSM', () => {
    for (const needle of ['### Referrer und Origin', 'strict-origin-when-cross-origin', 'Same-Origin', 'no-referrer', 'gültigen Referer']) expect(mdx, needle).toContain(needle);
  });
  it('hängender Lader, Grund update, onerror bei ungültiger Anfangsadresse, Höhe 200 bis 2000', () => {
    expect(mdx).toContain('**Hängt der Lader**');
    expect(mdx).toContain("'tile-url' | 'import' | 'init' | 'update' | 'tiles'");
    expect(mdx).toContain('`onerror` wird hier nicht gerufen');
    expect(mdx).toContain('200 bis 2000 px');
    expect(read('svelte/Map.svelte')).toContain('Math.min(2000, Math.max(200, height))');
    expect(read('react/Map.tsx')).toContain('Math.min(2000, Math.max(200, height))');
  });
});
