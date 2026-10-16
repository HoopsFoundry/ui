// @vitest-environment node
// Code-Beispiele der Card Library (stories/CardLibrary.code.ts): React per TypeScript-Compiler, Svelte per Server-Rendering,
// Vanilla-Markup gegen die Ausgabe der Komponenten. So bleiben die Beispiele lauffähig.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/CardLibrary.code';
import * as team from '../stories/TeamCard.code';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp/`;
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
    // Attributreihenfolge am Button: type zuerst
    .replace(/<button([^>]*?) type="button"/g, '<button type="button"$1')
    .trim();

const SVELTE = { svelte: code.svelte, namesSvelte: code.namesSvelte, photoSvelte: code.photoSvelte, teamSvelte: team.svelte };
const REACT = { react: code.react, namesReact: code.namesReact, photoReact: code.photoReact, teamReact: team.react };

describe('Svelte-Code-Beispiele rendern (SSR)', () => {
  it.each(Object.entries(SVELTE))('%s', async (name, source) => {
    const file = `${tmpDir}${name}.svelte`;
    const fixed = source
      .replace(/@bbv\/hoops-design-system\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`)
      .replace('<script>', '<script>\n  const openSpieler = () => {};');
    writeFileSync(file, fixed);
    const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
    const html = render(component, { props: {} }).body;
    expect(html.length).toBeGreaterThan(100);
    expect(html).not.toContain('undefined');
  });
});

describe('React-Code-Beispiele bestehen den TypeScript-Compiler', () => {
  it('alle vier Beispiele ohne Fehler', () => {
    const files: Record<string, string> = {};
    for (const [name, source] of Object.entries(REACT)) {
      const imports = source.match(/^import [^;]+;$/gm) ?? [];
      const rest = source.replace(/^import [^;]+;$/gm, '').trim();
      // Deklarationen (const …) stehen vor dem ersten JSX-Teil; der Rest ist JSX in einem Fragment
      const split = rest.search(/\n\n(\{\/\*|<)/);
      const head = split < 0 ? '' : rest.slice(0, split);
      const body = split < 0 ? rest : rest.slice(split);
      const text = [
        ...imports.map((line) => line.replace('@hoopsfoundry/ui/react', './index')),
        head,
        'const openSpieler = () => {};',
        `export const Demo_${name} = () => (\n<>${body}</>\n);`,
        'void openSpieler;',
      ].join('\n');
      files[`${rootDir}react/__code_${name}.tsx`] = text;
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
    const messages = diagnostics.map((d) => `${d.file!.fileName.split('/').pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
    expect(messages).toEqual([]);
  }, 60000);
});

describe('Vanilla-Beispiel der Teamkarte entspricht der Komponente', () => {
  it('standard und compact: dasselbe Markup wie Svelte und React', async () => {
    const { JSDOM } = await import('jsdom').catch(() => ({ JSDOM: undefined }));
    expect(JSDOM).toBeDefined();
    const dom = new JSDOM!('');
    const roots = [...dom.window.document.createRange().createContextualFragment(team.vanilla.replace(/<!--[\s\S]*?-->/g, '')).children].map((el) => el.outerHTML);
    expect(roots).toHaveLength(2);

    const Svelte = ((await vite.ssrLoadModule(`${rootDir}svelte/TeamCard.svelte`)) as { default: unknown }).default;
    const React = ((await vite.ssrLoadModule(`${rootDir}react/TeamCard.tsx`)) as { TeamCard: unknown }).TeamCard;
    const standard = {
      name: 'TSV Nordhain 1920', logo: '/logos/nordhain.svg', league: 'Bayernliga Süd', season: '2026/27', record: { w: 12, l: 3 }, rank: 3, rankOf: 12, href: '/teams/nordhain',
      next: { date: 'Sa, 25.05.', time: '19:30', opponent: { name: 'Lindenberg Hawks' }, at: 'heim', venue: 'Nordhain-Halle' },
      last: { date: 'Sa, 18.05.', opponent: { name: 'BG Seeberg' }, ownScore: 92, opponentScore: 79, at: 'gast' },
      squad: { players: 14, staff: 3 }, stats: { twoPtPct: 48.2, trb: 41.3 },
    };
    const compact = { size: 'compact', name: 'TSV Nordhain 1920', logo: '/logos/nordhain.svg', league: 'Bayernliga Süd', record: { w: 12, l: 3 }, rank: 3, href: '/teams/nordhain' };
    for (const [index, props] of [standard, compact].entries()) {
      const expected = normalize(roots[index]);
      expect(normalize(render(Svelte, { props }).body)).toBe(expected);
      expect(normalize(renderToStaticMarkup(createElement(React as never, props)))).toBe(expected);
    }
  });
});

describe('photoVanilla (PlayerCard mit Foto) entspricht der Svelte-Ausgabe', () => {
  it('compact, standard und hero', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('');
    const roots = [...dom.window.document.createRange().createContextualFragment(code.photoVanilla.replace(/<!--[\s\S]*?-->/g, '')).children].map((el) => el.outerHTML);
    expect(roots).toHaveLength(3);
    const Svelte = ((await vite.ssrLoadModule(`${rootDir}svelte/PlayerCard.svelte`)) as { default: unknown }).default;
    const base = { jersey: '4', name: 'J. Tanner', position: 'PG', captain: true, photo: '/players/jt.jpg' };
    const cases = [{ ...base, size: 'compact', stat: 22, statLabel: 'PTS' }, { ...base, size: 'standard' }, { ...base, size: 'hero' }];
    for (const [index, props] of cases.entries()) {
      expect(normalize(render(Svelte, { props }).body), props.size).toBe(normalize(roots[index]));
    }
  });
});
