// @vitest-environment node
// Code-Beispiele und Beispiele der Ligencard-Doku (stories/LeagueCard.code.ts, components/LeagueCardExamples.svelte):
// React per TypeScript-Compiler, Svelte per Server-Rendering, Vanilla-Markup gegen die Ausgabe der Komponenten.
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as league from '../stories/LeagueCard.code';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp-league/`;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };

beforeAll(async () => {
  mkdirSync(tmpDir, { recursive: true });
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js' })],
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
    .replace(/ onerror="this\.__e=event"/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .replace(/<(img|br)([^>]*?)\/?>/g, '<$1$2>')
    .trim();

const SVELTE = { svelte: league.svelte, ebeneSvelte: league.ebeneSvelte };
const REACT = { react: league.react, ebeneReact: league.ebeneReact };

describe('Svelte-Code-Beispiele rendern (SSR)', () => {
  it.each(Object.entries(SVELTE))('%s', async (name, source) => {
    const file = `${tmpDir}${name}.svelte`;
    writeFileSync(file, source.replace(/@bbv\/dss-design-system\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`));
    const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
    const html = render(component, { props: {} }).body;
    expect(html.length).toBeGreaterThan(100);
    expect(html).not.toContain('undefined');
    expect(html).toContain('dss-league');
  });
});

describe('React-Code-Beispiele bestehen den TypeScript-Compiler', () => {
  it('alle Beispiele ohne Fehler', () => {
    const files: Record<string, string> = {};
    for (const [name, source] of Object.entries(REACT)) {
      const imports = source.match(/^import [^;]+;$/gm) ?? [];
      const rest = source.replace(/^import [^;]+;$/gm, '').trim();
      const split = rest.search(/\n\n(\{\/\*|<)/);
      const head = split < 0 ? '' : rest.slice(0, split);
      const body = split < 0 ? rest : rest.slice(split);
      files[`${rootDir}react/__code_${name}.tsx`] = [
        ...imports.map((line) => line.replace('@bbv/dss-design-system/react', './index')),
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
    host.getSourceFile = (fileName, languageVersion, ...rest) =>
      fileName in files ? ts.createSourceFile(fileName, files[fileName], languageVersion) : original(fileName, languageVersion, ...rest);
    const exists = host.fileExists.bind(host);
    host.fileExists = (fileName) => fileName in files || exists(fileName);
    const read = host.readFile.bind(host);
    host.readFile = (fileName) => files[fileName] ?? read(fileName);
    const program = ts.createProgram(Object.keys(files), options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName in files);
    expect(diagnostics.map((d) => `${d.file!.fileName.split('/').pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`)).toEqual([]);
  }, 60000);
});

describe('Vanilla-Beispiel der Ligencard entspricht der Komponente', () => {
  it('standard und compact: dasselbe Markup wie Svelte und React', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('');
    const roots = [...dom.window.document.createRange().createContextualFragment(league.vanilla.replace(/<!--[\s\S]*?-->/g, '')).children].map((el) => el.outerHTML);
    expect(roots).toHaveLength(2);

    const Svelte = ((await vite.ssrLoadModule(`${rootDir}svelte/LeagueCard.svelte`)) as { default: unknown }).default;
    const React = ((await vite.ssrLoadModule(`${rootDir}react/LeagueCard.tsx`)) as { LeagueCard: unknown }).LeagueCard;
    const teams = [
      { rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20, diff: 31, zone: 'up' },
      { rank: 2, name: 'BG Seeberg', played: 11, points: 18, diff: 24 },
      { rank: 3, name: 'TSV Nordhain 1920', played: 11, points: 16, diff: 17, own: true, href: '/teams/nordhain' },
      { rank: 4, name: 'TSV Elbach', played: 11, points: 14, diff: -3 },
      { rank: 5, name: 'SV Kiefernau', played: 11, points: 14, diff: -9 },
      { rank: 6, name: 'TuS Waldmark', played: 11, points: 12, diff: -12 },
    ];
    const standard = { title: 'Oberliga Nordhain Männer', teams, teamCount: 12, played: 66, total: 132, columns: ['diff'], href: '/liga/tabelle', live: 2 };
    const compact = { title: 'Oberliga Nordhain Männer', teams: teams.map(({ own, href, zone, ...team }) => team), size: 'compact' };
    for (const [index, props] of [standard, compact].entries()) {
      const expected = normalize(roots[index]);
      expect(normalize(render(Svelte, { props }).body), `Svelte ${index}`).toBe(expected);
      expect(normalize(renderToStaticMarkup(createElement(React as never, props))), `React ${index}`).toBe(expected);
    }
  });
});

describe('Funktionen aus league.js: das Beispiel läuft und liefert die kommentierten Werte', () => {
  it('Importzeile ersetzt, Ausführung ohne Fehler', async () => {
    const file = `${tmpDir}funktionen.mjs`;
    writeFileSync(file, league.funktionenJs.replace("'@bbv/dss-design-system/league.js'", `'${rootDir}js/league.js'`) + '\nexport { rows };\n');
    const mod = (await vite.ssrLoadModule(file)) as { rows: { rank: number }[] };
    expect(mod.rows.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    const js = await import(`${rootDir}js/league.js`);
    expect(js.leagueSummary({ teamCount: 12, played: 66, total: 132 })).toBe('12 Teams · 66 von 132 Spielen gespielt');
    expect(js.leagueSummary({ teamCount: 1 })).toBe('1 Team');
    expect(js.windowLabel(mod.rows, 12)).toBe('Plätze 1 bis 4 von 12');
    expect(js.formLabel(['S', 'S', 'N'])).toBe('Form: Sieg, Sieg, Niederlage');
    expect(league.funktionenJs).toContain("// Plätze 1 und 2");
  });
});

describe('Beispiele der Doku-Seite', () => {
  const stories = readFileSync(`${rootDir}stories/LeagueCard.stories.ts`, 'utf8');
  const names = [...stories.matchAll(/example\('([\w-]+)'\)/g)].map((m) => m[1]);
  it('jede Beispiel-Story hat ein Beispiel und rendert eine Ligencard', async () => {
    expect(names.length).toBeGreaterThanOrEqual(18);
    const Examples = ((await vite.ssrLoadModule(`${rootDir}stories/components/LeagueCardExamples.svelte`)) as { default: unknown }).default;
    for (const example of names) {
      const html = render(Examples, { props: { example } }).body;
      expect(html, example).toContain('dss-league');
      expect(html, example).not.toContain('undefined');
    }
  });
  it('alle Beispiel-Stories sind versteckt (tags !dev), nur Spielwiese sichtbar; kein autodocs', () => {
    expect([...stories.matchAll(/^export const (\w+)\s+= \{ \.\.\.example\(/gm)]).toHaveLength(names.length);
    expect([...stories.matchAll(/\{ \.\.\.example\('[\w-]+'\), tags: \['!dev'\] \}/g)]).toHaveLength(names.length);
    expect(stories).not.toContain('autodocs');
  });
  it('die Spielwiese hat zu jeder Prop eine Beschreibung', () => {
    for (const prop of ['title', 'teams', 'ownRank', 'zones', 'teamCount', 'played', 'total', 'columns', 'limit', 'href', 'linkLabel', 'live', 'names', 'logos', 'size', 'titleAs']) {
      expect(stories, prop).toMatch(new RegExp(`\\n\\s+${prop}: \\{ control: [^\\n]*description: `));
    }
  });
  it('Demo-Daten: nur erfundene Vereine, keine echten Ligen- oder Vereinsnamen', () => {
    const data = readFileSync(`${rootDir}stories/components/leagueData.ts`, 'utf8') + readFileSync(`${rootDir}stories/LeagueCard.code.ts`, 'utf8');
    expect(data).toContain('Oberliga Nordhain Männer');
    expect(data + stories).not.toMatch(/Oberliga Baden|Alba|Bayern München|Ratiopharm|Bamberg/);
  });
});
