// @vitest-environment node
// Karte: Svelte und React erzeugen beim Server-Rendering dasselbe Markup (Vite-SSR gegen renderToStaticMarkup, normalisiert), beide
// rendern ohne window und document, und das Modul lädt weder Leaflet noch greift es beim Import auf die Umgebung zu.
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let render: Render;
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];

// Ids sind pro Fassung verschieden (Svelte `c1`, React `:r0:`): in Reihenfolge des Auftretens durch i1, i2 … ersetzen
const normalize = (html: string) => {
  const ids = new Map<string, string>();
  const key = (value: string) => {
    if (!ids.has(value)) ids.set(value, `i${ids.size + 1}`);
    return ids.get(value)!;
  };
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(hoops-map-(?:canvas|text)-)([^"#]+)/g, (_m, prefix: string, id: string) => `${prefix}${key(id)}`)
    .replace(/ (hidden|inert)=""/g, ' $1')
    .replace(/&quot;/g, '"') // Svelte schreibt " und > im Text unmaskiert, React maskiert sie
    .replace(/&gt;/g, '>')
    .replace(/style="([^"]*)"/g, (_m, value: string) => `style="${value.replace(/\s*:\s*/g, ':').replace(/;\s*$/, '').replace(/\s*;\s*/g, ';')}"`)
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();
};

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const bodies = async (props: Record<string, unknown>) => {
  const Svelte = await load('svelte/Map.svelte');
  const React = await load('react/Map.tsx', 'MapView');
  const { className, ...rest } = props;
  const sveltePart = render(Svelte, { props: className === undefined ? rest : { ...rest, class: className } }).body;
  return [normalize(sveltePart), normalize(renderToStaticMarkup(createElement(React as never, props)))] as const;
};
const same = async (props: Record<string, unknown>) => {
  const [a, b] = await bodies(props);
  expect(a).toBe(b);
  return a;
};

const A = { id: 'a', lat: 49.4875, lng: 8.466, label: 'Sporthalle Nordhain', own: true };
const B = { id: 'b', lat: 49.5, lng: 8.5, label: 'Halle Süd & West', href: '/hallen/sued' };
const C = { id: 'c', lat: 49.45, lng: 8.4, label: 'Gymnasium "Lindenberg" <Ost>', number: 12 };
const D = { id: 'd', lat: -33.8688, lng: 151.2093, label: 'Südhalle' };
const BASE = { markers: [A], label: 'Karte der Sporthalle' };

describe('Map: Svelte und React erzeugen dasselbe Markup (Platzhalter)', () => {
  const cases: Record<string, Record<string, unknown>> = {
    'ein Marker': BASE,
    'zwei Marker': { ...BASE, markers: [A, B] },
    'drei Marker mit Sonderzeichen und eigener Nummer': { ...BASE, markers: [A, B, C] },
    'Südhalbkugel': { ...BASE, markers: [A, D] },
    'ohne Marker': { ...BASE, markers: [] },
    'ungültige Marker': { ...BASE, markers: [A, { id: 'x', lat: 999, lng: 0, label: 'Kaputt' }, { id: 'y', lat: 'a', lng: 0, label: 'Text' }] },
    'load auto': { ...BASE, load: 'auto' },
    'load auto, zwei Marker': { ...BASE, markers: [A, B], load: 'auto' },
    'ungültige tileUrl': { ...BASE, tileUrl: 'http://example.org/{z}/{x}/{y}.png' },
    'eigene tileUrl': { ...BASE, tileUrl: '/tiles/{z}/{x}/{y}.png', privacyNote: 'Die Karte kommt über unseren Server.' },
    'appLinks geo': { ...BASE, appLinks: ['geo'] },
    'appLinks alle': { ...BASE, markers: [A, B], appLinks: ['geo', 'osm', 'route'] },
    'appLinks leer': { ...BASE, appLinks: [] },
    'showList false': { ...BASE, showList: false },
    'showList false, mehrere': { ...BASE, markers: [A, B], showList: false },
    'height 400': { ...BASE, height: 400 },
    'height zu klein': { ...BASE, height: 20 },
    'height NaN': { ...BASE, height: Number.NaN },
    'dimInDark aus': { ...BASE, dimInDark: false },
    'eigene Quellenangabe': { ...BASE, attribution: '© OpenStreetMap-Mitwirkende, Kacheln: Beispielanbieter' },
    'leere Quellenangabe': { ...BASE, attribution: '' },
    'interactive aus': { ...BASE, interactive: false },
    'center und zoom': { ...BASE, center: [50, 9], zoom: 12 },
    class: { ...BASE, className: 'meine-klasse' },
    'alles zusammen': { markers: [A, B, C, D], label: 'Hallenübersicht', center: [49.5, 8.4], zoom: 11, height: 280, interactive: false, load: 'click', tileUrl: '/tiles/{z}/{x}/{y}.png', attribution: '© OpenStreetMap-Mitwirkende', privacyNote: 'Eigener Proxy', appLinks: ['osm', 'geo', 'route'], showList: true, dimInDark: false, className: 'x' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    await same(props);
  });

  it('die Fälle sind aussagekräftig: Platzhalter, Liste, Fehlerzustand, Nummern', async () => {
    const one = await same(cases['ein Marker']);
    expect(one).toContain('Karte laden');
    expect(one).toContain('49,4875° N, 8,4660° O');
    expect(one).toContain('Karte überspringen');
    expect(one).toContain('© OpenStreetMap-Mitwirkende');
    expect(one).not.toContain('hoops-map-canvas');
    expect(one).not.toContain('hoops-map-num');
    const three = await same(cases['drei Marker mit Sonderzeichen und eigener Nummer']);
    expect(three).toContain('>12<');
    expect(three).toContain('&lt;Ost>');
    expect(await same(cases['ungültige tileUrl'])).toContain('data-state="error"');
    expect(await same(cases['ungültige tileUrl'])).toContain('Die Karte konnte nicht geladen werden. Adresse und Route siehe unten.');
    const auto = await same(cases['load auto']);
    expect(auto).toContain('data-state="loading"');
    expect(auto).toContain('hoops-map-canvas');
    expect(auto).not.toContain('Karte laden');
    expect(await same(cases['showList false'])).toContain('is-quiet');
    expect(await same(cases['ungültige Marker'])).not.toContain('Kaputt');
    expect(await same(cases['appLinks geo'])).toContain('geo:49.4875,8.466');
  });
});

describe('Map: SSR und Import', () => {
  it('Svelte und React rendern ohne window und document', async () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    const [a, b] = await bodies(BASE);
    expect(a.length).toBeGreaterThan(200);
    expect(b.length).toBeGreaterThan(200);
  });
  it('die Module importieren Leaflet nicht beim Start (nur dynamisch), und greifen nicht auf window oder document zu', () => {
    const controller = readFileSync(rootDir + 'js/map-leaflet.js', 'utf8');
    const pure = readFileSync(rootDir + 'js/map.js', 'utf8');
    // keine statische Einbindung von Leaflet in irgendeiner Quelle
    for (const file of ['js/map.js', 'js/map-leaflet.js', 'svelte/Map.svelte', 'react/Map.tsx']) {
      expect(readFileSync(rootDir + file, 'utf8'), file).not.toMatch(/^\s*import[^;\n]*from\s+['"]leaflet['"]/m);
    }
    const code = controller.split('\n').filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line)).join('\n');
    expect(code.match(/import\('leaflet'\)/g)).toHaveLength(1);
    // oberste Ebene: kein window/document außerhalb von Funktionen (Zeilen ohne Einrückung)
    for (const [name, source] of [['map.js', pure], ['map-leaflet.js', controller]] as const) {
      const top = source.split('\n').filter((line) => /^\S/.test(line) && !/^(\/|\*|export function|function|\}|import|const [a-zA-Z]+ = \(|export const [A-Z_]+ =)/.test(line));
      expect(top.join('\n'), name).not.toMatch(/\b(window|document|navigator)\b/);
    }
  });
  it('das Modul js/map-leaflet.js lässt sich ohne DOM importieren, ohne dass Leaflet geladen wird', async () => {
    const mod = (await vite.ssrLoadModule(rootDir + 'js/map-leaflet.js')) as { reducedMotion: () => boolean; createMapController: unknown };
    expect(typeof mod.createMapController).toBe('function');
    expect(mod.reducedMotion()).toBe(false);
  });
});
