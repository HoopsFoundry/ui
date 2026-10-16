// @vitest-environment node
// Doku der Karte: Vereinssitz (kind: 'seat') und darkTiles. Code-Beispiele (Svelte per Server-Rendering, React per TypeScript-Compiler, Vanilla gegen
// map.js), Vanilla-Markup gegen die Ausgabe der Komponenten, Stories, Verweise.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mapItems, markerName, tilesMode } from '../js/map.js';
import * as code from '../stories/Map.code';
import { cleanup, compileReact, normalize, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import type { ViteDevServer } from 'vite';

const tmpDir = `${rootDir}tests/.code-tmp-mapseat/`;
let vite: ViteDevServer;
let render: Render;
beforeAll(async () => {
  ({ vite, render } = await startServer());
}, 60000);
afterAll(async () => {
  await vite?.close();
  cleanup(tmpDir);
});

const mdx = read('stories/Map.mdx');
const stories = read('stories/Map.stories.ts');
const examples = read('stories/components/MapExamples.svelte');

describe('Code-Beispiele: Vereinssitz und darkTiles', () => {
  it('Svelte rendert (SSR): Sitz mit Haus-Badge, Chip und data-tiles="invert"', async () => {
    const html = await renderSvelteSource(vite, render, tmpDir, 'sitz', code.sitzSvelte);
    expect(html).not.toContain('undefined');
    expect(html).toContain('data-tiles="invert"');
    expect(html).toContain('hoops-map-num is-seat');
    expect(html).toContain('>Vereinssitz<');
    expect(html).toContain('hoops-map-ph-pin is-seat');
    // der Sitz verbraucht keine Nummer: die Hallen sind 1 und 2
    expect(html.match(/<span class="hoops-map-num(?: is-own)?"[^>]*>(\d)<\/span>/g)?.map((s) => s.replace(/<[^>]+>/g, ''))).toEqual(['1', '2']);
  });
  it('React besteht den TypeScript-Compiler', () => {
    expect(compileReact({ sitz: code.sitzReact })).toEqual([]);
  }, 60000);
  it('React und Svelte liefern dasselbe Markup für den Sitz', async () => {
    const Svelte = ((await vite.ssrLoadModule(`${rootDir}svelte/Map.svelte`)) as { default: unknown }).default;
    const React = ((await vite.ssrLoadModule(`${rootDir}react/Map.tsx`)) as { MapView: unknown }).MapView;
    const markers = [{ id: 'sitz', lat: 49.2962, lng: 7.9105, label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' }, { id: 'a', lat: 49.3, lng: 7.9, label: 'Halle A', own: true }];
    const props = { label: 'Karte', markers, darkTiles: 'invert' };
    const ids = (html: string) => normalize(html).replace(/hoops-map-(canvas|text)-[^"#]+/g, 'hoops-map-$1-x');
    expect(ids(renderToStaticMarkup(createElement(React as never, props as never)))).toBe(ids(render(Svelte, { props }).body));
  });
  it('die Aufrufe im Vanilla-Beispiel liefern die genannten Ergebnisse', () => {
    expect(markerName({ label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' })).toBe('Geschäftsstelle TSV Nordhain, Vereinssitz');
    expect(tilesMode('invert')).toBe('invert');
    expect(mapItems([{ id: 's', lat: 49.3, lng: 7.9, label: 'Sitz', kind: 'seat' }, { id: 'a', lat: 49.31, lng: 7.91, label: 'A' }, { id: 'b', lat: 49.32, lng: 7.92, label: 'B' }]).map((i) => i.number)).toEqual([null, 1, 2]);
    expect(code.sitzVanilla).toContain('[null, 1, 2]');
    expect(code.sitzVanilla).toContain('data-tiles="invert"');
  });
});

describe('Doku', () => {
  it('Abschnitte, Stories und Beispiele sind da', () => {
    for (const heading of ['## Vereinssitz', '### Kacheln im Dunkelmodus: `darkTiles`']) expect(mdx).toContain(heading);
    for (const name of ['Vereinssitz', 'SitzMarker', 'DunkleKacheln', 'DoSitz', 'DontSitz']) {
      // DunkleKacheln steht als Iframe auf der Seite (eigenes Theme), die anderen als Canvas
      expect(mdx, name).toContain(name === 'DunkleKacheln' ? 'id=components-map--dunkle-kacheln' : `MapStories.${name}`);
      expect(stories, name).toMatch(new RegExp(`export const ${name}\\s+= .*tags: \\['!dev'\\]`));
    }
    for (const name of ['sitz', 'sitz-pins', 'dunkle-kacheln', 'do-sitz', 'dont-sitz']) expect(examples).toContain(`example === '${name}'`);
  });
  it('die Dunkel-Vorschau ist ein Iframe mit dunklem Theme', () => {
    expect(mdx).toContain('theme:Dark&id=components-map--dunkle-kacheln');
  });
  it('Marker-Feld kind und Prop darkTiles sind beschrieben', () => {
    expect(mdx).toMatch(/\['kind', "'place' \| 'seat'"/);
    expect(stories).toMatch(/darkTiles: \{ control: 'inline-radio', options: \['dim', 'invert'\].*description:/);
    expect(stories).toMatch(/seat: \{ control: 'boolean'.*description:/);
  });
  it('Demo-Daten sind erfunden (kein Bezug auf echte Orte)', () => {
    expect(read('stories/components/mapData.ts')).toContain('Geschäftsstelle TSV Nordhain');
    expect(mdx + stories + examples).not.toMatch(/images\//);
  });
});
