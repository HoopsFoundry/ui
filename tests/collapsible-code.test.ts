// @vitest-environment node
// Code-Beispiele „Tabellen einklappen“ auf den Seiten Table, Spielplan und LeagueCard: React per TypeScript-Compiler und Server-Rendering,
// Svelte per Server-Rendering, Vanilla-Markup gegen die Ausgabe der Komponenten; jede id und jeder Titel kommt je Beispiel einmal vor.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as table from '../stories/Table.code';
import * as spielplan from '../stories/Spielplan.code';
import * as league from '../stories/LeagueCard.code';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp-collapsible/`;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };

beforeAll(async () => {
  mkdirSync(tmpDir, { recursive: true });
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
}, 60000);
afterAll(async () => {
  await vite?.close();
  rmSync(tmpDir, { recursive: true, force: true });
});

const normalize = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ (hidden|inert)=""/g, ' $1')
    .replace(/ data-hoops-acc(="")?/g, '')
    .replace(/<div class="hoops-acc-tools hoops-acc-tools--pending"[^>]*><\/div>/g, '')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();
const tags = (html: string) => [...html.matchAll(/<(h[1-6])[\s>]/g)].map((m) => m[1]);
const ids = (html: string) => [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

const renderSvelte = async (name: string, source: string) => {
  const file = `${tmpDir}${name}.svelte`;
  writeFileSync(file, source.replace(/@hoopsfoundry\/ui\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`));
  const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
  return render(component, { props: {} }).body;
};

function reactModule(source: string, target: 'check' | 'run'): string {
  const map = (line: string) => line.replace('@hoopsfoundry/ui/react', target === 'check' ? './index' : `${rootDir}react/index.ts`);
  const imports = source.match(/^import [^;]+;$/gm) ?? [];
  const rest = source.replace(/^import [^;]+;$/gm, '').trim();
  return [...imports.map(map), rest].join('\n');
}
const compile = (files: Record<string, string>) => {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true,
    isolatedModules: true, noUnusedLocals: false, types: [],
  };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName in files ? ts.createSourceFile(fileName, files[fileName], languageVersion) : original(fileName, languageVersion, ...rest);
  const exists = host.fileExists.bind(host);
  host.fileExists = (fileName) => fileName in files || exists(fileName);
  const read = host.readFile.bind(host);
  host.readFile = (fileName) => files[fileName] ?? read(fileName);
  const program = ts.createProgram(Object.keys(files), options, host);
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName in files).map((d) => `${d.file!.fileName.split('/').pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
};
const runReact = async (name: string, source: string, exportName: string) => {
  const file = `${tmpDir}__code_${name}.tsx`;
  writeFileSync(file, reactModule(source, 'run'));
  const mod = (await vite.ssrLoadModule(file)) as Record<string, ComponentType>;
  return renderToStaticMarkup(createElement(mod[exportName]));
};

type Page = {
  name: string;
  code: { collapsibleVanilla: string; collapsibleSvelte: string; collapsibleReact: string; collapsibleMarkup: string };
  exportName: string;
  /** Svelte-Quelltext, der dieselbe Komponente wie das Vanilla-Markup erzeugt */
  single: string;
  frames: number;
  titles: string[];
};
const PAGES: Page[] = [
  {
    name: 'Table', code: table, exportName: 'Spielseite', frames: 3, titles: ['Spieler-Statistiken', 'Boxscore Heim', 'Boxscore Gast'],
    single: `<script>
  import Table from '@hoopsfoundry/ui/svelte/Table';
</script>
<Table collapsible open id="boxscore" title="Spieler-Statistiken" meta="Stand · 4. Viertel" density="compact" columns={[{ key: 'name', label: 'Spieler' }, { key: 'pts', label: 'PTS', align: 'right' }]}>
  {#snippet rows()}
    <tr><td>J. Tanner</td><td class="num lead">22</td></tr>
    <tr><td>M. Okafor</td><td class="num lead">19</td></tr>
  {/snippet}
</Table>`,
  },
  {
    name: 'Spielplan', code: spielplan, exportName: 'Spieltag', frames: 3, titles: ['Spielplan', 'Heimspiele', 'Hallenbelegung'],
    single: `<script>
  import ScheduleTable from '@hoopsfoundry/ui/svelte/ScheduleTable';
  const games = [{ id: 'v1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } }];
</script>
<ScheduleTable collapsible open id="spielplan" title="Spielplan" meta="Saison 2026/27" {games} layout="versus" density="touch" caption="Heimspiele" />`,
  },
  {
    name: 'LeagueCard', code: league, exportName: 'Vereinsseite', frames: 3, titles: ['Oberliga Nordhain Männer', 'Landesliga Ost', 'Bezirksliga West'],
    single: `<script>
  import LeagueCard from '@hoopsfoundry/ui/svelte/LeagueCard';
  const teams = [
    { rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20 },
    { rank: 2, name: 'BG Seeberg', played: 11, points: 18 },
    { rank: 3, name: 'TSV Nordhain 1920', played: 11, points: 16 },
  ];
</script>
<LeagueCard collapsible open id="oberliga" title="Oberliga Nordhain Männer" {teams} teamCount={12} played={66} total={132} />`,
  },
];

describe.each(PAGES)('Code-Beispiele $name: Tabellen einklappen', (page) => {
  it('Svelte rendert: Köpfe als Überschrift mit Button, ein Rahmen offen, jede id nur einmal, Gruppe mit Sprungleiste im Browser', async () => {
    const html = await renderSvelte(`${page.name}-svelte`, page.code.collapsibleSvelte);
    expect(html.match(/class="hoops-acc-trigger"/g)).toHaveLength(page.frames);
    expect(tags(html)).toEqual(Array(page.frames).fill('h3'));
    expect(html).toContain('aria-expanded="true"');
    const all = ids(html);
    expect(new Set(all).size).toBe(all.length);
    for (const title of page.titles) expect(html, title).toContain(title);
    for (const m of html.matchAll(/aria-controls="([^"]+)"/g)) expect(all, m[1]).toContain(m[1]);
  });
  it('React besteht den TypeScript-Compiler', () => {
    const file = `${rootDir}react/__code_${page.name}.tsx`;
    expect(compile({ [file]: reactModule(page.code.collapsibleReact, 'check') })).toEqual([]);
  }, 60000);
  it('Typfehler würden auffallen (open ohne boolean, id als Zahl)', () => {
    const bad = page.code.collapsibleReact.replace('collapsible id="', 'collapsible id={5} title="X" open="ja" xid="').replace(/export function \w+/, 'export function Bad');
    const messages = compile({ [`${rootDir}react/__code_bad_${page.name}.tsx`]: reactModule(bad, 'check') });
    expect(messages.length).toBeGreaterThan(0);
  }, 60000);
  it('React rendert dasselbe Markup wie Svelte', async () => {
    const react = await runReact(`${page.name}-react`, page.code.collapsibleReact, page.exportName);
    const svelteHtml = await renderSvelte(`${page.name}-svelte2`, page.code.collapsibleSvelte);
    expect(normalize(react)).toBe(normalize(svelteHtml));
  });
  it('Vanilla-Markup entspricht der Ausgabe der Komponente', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('');
    const root = dom.window.document.createRange().createContextualFragment(page.code.collapsibleVanilla.replace(/<!--[\s\S]*?-->/g, '')).querySelector('.is-collapsible')!;
    const component = await renderSvelte(`${page.name}-single`, page.single);
    expect(normalize(root.outerHTML)).toBe(normalize(component));
    expect(normalize(page.code.collapsibleMarkup)).toContain(normalize(root.outerHTML));
  });
  it('Vanilla: die Klassen gibt es im CSS, der Import-Pfad ist ein Export des Pakets', () => {
    const css = readFileSync(`${rootDir}css/components.css`, 'utf8');
    for (const cls of new Set(page.code.collapsibleMarkup.match(/hoops-[\w-]+/g))) expect(css, cls).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
    const pkg = JSON.parse(readFileSync(`${rootDir}package.json`, 'utf8')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./accordion.js']).toBeTruthy();
    expect(page.code.collapsibleVanilla).toContain('@hoopsfoundry/ui/accordion.js');
  });
  it('gebundener Zustand: open kommt mit onOpenChange (React) bzw. bind:open (Svelte)', () => {
    expect(/\bopen=\{/.test(page.code.collapsibleReact) && !/onOpenChange=\{/.test(page.code.collapsibleReact)).toBe(false);
    expect(/(^|\s)open=\{/.test(page.code.collapsibleSvelte)).toBe(false);
    expect(page.code.collapsibleSvelte).toContain('bind:open');
  });
});
