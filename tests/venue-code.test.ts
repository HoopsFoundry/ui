// @vitest-environment node
// Code-Beispiele und Beispiele der Hallenkarten-Doku (stories/VenueCard.code.ts, components/VenueCardExamples.svelte): React per TypeScript-Compiler,
// Svelte per Server-Rendering, Vanilla-Markup gegen die Ausgabe der Komponenten, Doku-Verweise und Demo-Daten.
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as venue from '../stories/VenueCard.code';
import { normalize } from './helpers/venue-normalize';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp-venue/`;
const read = (path: string) => readFileSync(`${rootDir}${path}`, 'utf8');
let vite: ViteDevServer;
type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let render: Render;

beforeAll(async () => {
  mkdirSync(tmpDir, { recursive: true });
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
  await vite.ssrLoadModule('/tests/setup-i18n.ts'); // Standardsprache der Tests (Deutsch) auch im Modulgraphen dieses Servers
}, 60000);
afterAll(async () => {
  await vite?.close();
  rmSync(tmpDir, { recursive: true, force: true });
});

const titles = (html: string) => [...html.matchAll(/<h[2-6] class="hoops-venue-title">([^<]*)</g)].map((m) => m[1]);

describe('Svelte-Code-Beispiele rendern (SSR)', () => {
  it.each(Object.entries({ svelte: venue.svelte, ebeneSvelte: venue.ebeneSvelte }))('%s', async (name, source) => {
    const file = `${tmpDir}${name}.svelte`;
    writeFileSync(file, source.replace(/@hoopsfoundry\/ui\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`));
    const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
    const html = render(component, { props: {} }).body;
    expect(html).not.toContain('undefined');
    expect(html).toContain('hoops-venue');
    if (name === 'svelte') {
      expect(titles(html)).toEqual(['Sporthalle Nordhain', 'Mehrzweckhalle Seeberg', 'Gymnasium Kiefernau']);
      expect(html).toContain('tel:03023125100');
      expect(html).toContain('mailto:hallenwart@example.org');
      expect(html.match(/<li class="hoops-venue-game"/g)).toHaveLength(2);
      expect(html).toMatch(/<h2 class="hoops-venue-title">Mehrzweckhalle Seeberg/);
      expect(html).toContain('data-state="loading"');
    } else {
      expect(html).toMatch(/<h2[^>]*>Hallen<\/h2>/);
      expect(html).toMatch(/<h4 class="hoops-venue-title">Sporthalle Nordhain/);
      expect(html).toMatch(/<h5 class="hoops-venue-title">Mehrzweckhalle Seeberg/);
    }
  });
});

describe('React-Code-Beispiele bestehen den TypeScript-Compiler', () => {
  it('alle Beispiele ohne Fehler', () => {
    const files: Record<string, string> = {};
    for (const [name, source] of Object.entries({ react: venue.react, ebeneReact: venue.ebeneReact })) {
      const imports = source.match(/^import [^;]+;$/gm) ?? [];
      const rest = source.replace(/^import [^;]+;$/gm, '').trim();
      const split = rest.search(/\n\n(\{\/\*|<)/);
      const head = split < 0 ? '' : rest.slice(0, split);
      const body = split < 0 ? rest : rest.slice(split);
      files[`${rootDir}react/__code_venue_${name}.tsx`] = [
        ...imports.map((line) => line.replace('@hoopsfoundry/ui/react', './index')),
        head,
        `export const Demo_${name} = () => (\n<>${body}</>\n);`,
      ].join('\n');
    }
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true,
      isolatedModules: true, noUnusedLocals: false, types: [],
    };
    const host = ts.createCompilerHost(options);
    const original = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, ...more) =>
      fileName in files ? ts.createSourceFile(fileName, files[fileName], languageVersion) : original(fileName, languageVersion, ...more);
    const exists = host.fileExists.bind(host);
    host.fileExists = (fileName) => fileName in files || exists(fileName);
    const readFile = host.readFile.bind(host);
    host.readFile = (fileName) => files[fileName] ?? readFile(fileName);
    const program = ts.createProgram(Object.keys(files), options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName in files);
    expect(diagnostics.map((d) => `${d.file!.fileName.split('/').pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`)).toEqual([]);
  }, 60000);
});

describe('Vanilla-Markup entspricht der Ausgabe der Komponenten', () => {
  it('Svelte und React erzeugen das Markup des Beispiels', async () => {
    const props = {
      name: 'Sporthalle Nordhain', address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, lat: 49.3, lng: 7.9, mapHeight: 250,
      info: 'Zwei Spielfelder, Zugang über den Haupteingang.', contact: { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' }, href: '/hallen/nordhain',
      games: [{ id: '1', state: 'scheduled', date: 'Sa, 17.10.2026', time: '17:30', league: { name: 'Oberliga Nordhain Männer' }, heim: { name: 'TSV Nordhain 1920' }, gast: { name: 'BG Seeberg' } }],
    };
    const Svelte = ((await vite.ssrLoadModule(`${rootDir}svelte/VenueCard.svelte`)) as { default: unknown }).default;
    const React = ((await vite.ssrLoadModule(`${rootDir}react/VenueCard.tsx`)) as { VenueCard: unknown }).VenueCard;
    // Der Pin im Platzhalter hat im Vanilla-Beispiel keine Ziffer; das Muster aus beiden Fassungen ist identisch
    const fix = (html: string) => normalize(html).replace(/id="hoops-map-text-i1"/g, 'id="halle-karte-text"').replace(/href="#hoops-map-text-i1"/g, 'href="#halle-karte-text"');
    const expected = fix(render(Svelte, { props }).body);
    expect(fix(renderToStaticMarkup(createElement(React as never, props)))).toBe(expected);
    expect(fix(venue.vanilla.replace(/<!--[\s\S]*?-->\s*/, ''))).toBe(expected);
  });
});

describe('Doku', () => {
  const stories = read('stories/VenueCard.stories.ts');
  const mdx = read('stories/VenueCard.mdx');
  const examples = read('stories/components/VenueCardExamples.svelte');

  it('jede Story der Doku ist ausgeblendet (Literal !dev), die Spielwiese nicht', () => {
    const exported = [...stories.matchAll(/export const (\w+)\s*=\s*\{([^\n]*)/g)];
    for (const [, name, rest] of exported) {
      if (name === 'Spielwiese') expect(rest).not.toContain('!dev');
      else expect(rest, name).toContain("tags: ['!dev']");
    }
    expect(exported.length).toBeGreaterThan(15);
  });
  it('jede Story, die das MDX nennt, existiert; Beispiele sind bekannt', () => {
    for (const m of mdx.matchAll(/VenueCardStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`'${m[1]}'`);
  });
  it('Beispiele ohne Netz: keine Adresse von OpenStreetMap, jede Karte mit load="auto" hat die lokale Kachel', () => {
    expect(examples + read('stories/components/venueData.ts')).not.toMatch(/tile\.openstreetmap\.org/);
    for (const card of examples.match(/<VenueCard [^>]*>/g) ?? []) if (/load="auto"/.test(card)) expect(card).toContain('tileUrl={tile}');
  });
  it('Beispiele rendern, jede Halle höchstens einmal je Seite (landmark-unique) und die Don\'t-Stages sind inert', async () => {
    const Examples = ((await vite.ssrLoadModule(`${rootDir}stories/components/VenueCardExamples.svelte`)) as { default: unknown }).default;
    // 'handy' und 'handy-andere-hallen' erscheinen als Vorschau-Iframes (eigene Dokumente), alle anderen stehen inline auf einer Seite
    // Die Vanilla-Beispiele entstehen erst im Browser (mountVenueCard in einer Svelte-Aktion): im Server-Rendering ist der Behälter leer
    const browserOnly = ['vanilla', 'vanilla-handy', 'vanilla-handy-kompakt'];
    const iframes = ['handy', 'handy-andere-hallen', ...browserOnly];
    const names = [...stories.matchAll(/example\('([\w-]+)'\)/g)].map((m) => m[1]);
    const labelsOf = (n: string) => render(Examples, { props: { example: n } }).body.match(/aria-label="Karte: [^"]*"/g) ?? [];
    expect(labelsOf('handy').filter((l) => labelsOf('handy-andere-hallen').includes(l))).toEqual([]);
    const seen = new Map<string, string>();
    for (const name of names.filter((n) => !iframes.includes(n))) {
      const html = render(Examples, { props: { example: name } }).body;
      expect(html, name).toContain('hoops-venue');
      expect(html, name).not.toContain('undefined');
      for (const label of html.match(/aria-label="Karte: [^"]*"/g) ?? []) {
        expect(seen.get(label), `${label} in ${name} und ${seen.get(label)}`).toBeUndefined();
        seen.set(label, name);
      }
    }
    expect(read('stories/docs/blocks/DosDonts.tsx')).toContain('INERT');
  });
  it('Vanilla-Beispiele: eigene Hallen (nicht von anderen Beispielen genutzt), Handy-Vorschauen verschieden, Kachel lokal', () => {
    const indexOf = (name: string) => {
      const block = examples.slice(examples.indexOf(`example === '${name}'`));
      return Number(block.match(/venueProps\((\d+)\)/)![1]);
    };
    const mine = ['vanilla', 'vanilla-handy', 'vanilla-handy-kompakt'].map(indexOf);
    expect(new Set(mine).size).toBe(3);
    const vanillaStart = examples.indexOf("example === 'vanilla'");
    const vanillaEnd = examples.indexOf("example === 'zustaende'");
    // inline auf der Seite: die Region „Karte: <Name>“ kommt nur einmal vor (landmark-unique). Die anderen Beispiele nutzen die Hallen 0 bis 23, deshalb trägt
    // das Seitenbeispiel einen eigenen Namen; die Handy-Vorschauen sind Iframes und zeigen andere Hallen als die Svelte-Vorschauen (0, 1, 10, 11)
    const block0 = examples.slice(vanillaStart, vanillaEnd);
    const ownNames = [...block0.matchAll(/venueProps\(\d+\), name: '([^']+)'/g)].map((m) => m[1]);
    expect(ownNames).toEqual(['Buchenhalle Süd', 'Ahornhalle Nord', 'Erlenhalle Ost']);
    for (const own of ownNames) {
      expect(examples.split(own), own).toHaveLength(2);
      expect(read('stories/components/venueData.ts'), own).not.toContain(own);
    }
    for (const index of mine.slice(1)) expect([0, 1, 10, 11], `Halle ${index}`).not.toContain(index);
    const block = examples.slice(vanillaStart, vanillaEnd);
    expect((block.match(/tileUrl: tile/g) ?? []).length).toBe(3);
    expect(block).not.toMatch(/openstreetmap/);
  });
  it('Demo-Daten erfunden: keine Bezüge auf images/, Adressen unter example.org, Rufnummern im Fiktionsbereich', () => {
    const data = read('stories/components/venueData.ts') + read('stories/VenueCard.code.ts') + examples;
    expect(data + mdx).not.toMatch(/images\//);
    for (const email of data.match(/[\w.+-]+@[\w.-]+\.\w+/g) ?? []) expect(email, email).toMatch(/@example\.org$/);
    for (const phone of data.match(/030 \d{5} \d{3}/g) ?? []) expect(phone, phone).toMatch(/^030 23125 \d{3}$/);
  });
  it('Seite nennt Datenschutz mit Verweis auf die Map, Größen, Handy, Dunkelmodus, Zustände, Props, Code und Dos/Don\'ts', () => {
    for (const needle of ['## Aufbau', '## Karte und Datenschutz', 'components-map--docs', '## Größen', '## Vorschau in Gerätebreite', 'Containerbreite ohne den 1 px breiten Rand', '**Breite der Karte**', 'Rand der Trikotpunkte', '258 px (30 %)', 'VenueCardStories.HandyAndereHallen', '## Dunkelmodus', '## Zustände', '<Controls of=', '<DocTable', '<FrameworkCode', '## Dos und Don\'ts', '**Vanilla:**']) expect(mdx, needle).toContain(needle);
    expect((mdx.match(/title: '/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
  it('Einträge in Introduction, storySort, README und CHANGELOG', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-venuecard--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'Map', 'VenueCard', 'Tabs'/);
    expect(read('README.md')).toContain('VenueCard');
    expect(read('CHANGELOG.md')).toContain('**`VenueCard` (Hallenkarte)**');
  });
});
