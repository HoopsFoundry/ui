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

const titles = (html: string) => [...html.matchAll(/<h[2-6] class="dss-league-title">([^<]*)</g)].map((m) => m[1]);
/** Zeilen im tbody je Karte */
const rowCounts = (html: string) => html.split('<table').slice(1).map((part) => ((part.split('<tbody')[1] ?? '').split('</tbody>')[0].match(/<tr/g) ?? []).length);
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
    if (name === 'svelte') {
      // drei Karten: eigene Mannschaft auf Platz 3 (vier Zeilen), compact (ebenfalls vier), ohne eigene Mannschaft mit limit 5
      expect(titles(html)).toEqual(['Oberliga Nordhain Männer', 'Oberliga Nordhain Männer', 'Oberliga Nordhain Männer']);
      expect(rowCounts(html)).toEqual([4, 4, 5]);
      expect(html).toContain('Korbdifferenz');
      expect(html).toContain('12 Teams · 66 von 132 Spielen gespielt');
      expect(html).toContain('2 Spiele laufen');
    } else {
      expect(titles(html)).toEqual(['Oberliga Nordhain Männer', 'Kreisliga Süd']);
      expect(html).toMatch(/<h2[^>]*>Tabellen<\/h2>/);
      // HeadingLevel level=4 gilt für die erste Karte, titleAs h5 gewinnt für die zweite
      expect(html).toMatch(/<h4 class="dss-league-title">Oberliga Nordhain Männer/);
      expect(html).toMatch(/<h5 class="dss-league-title">Kreisliga Süd/);
    }
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

describe('Funktionen aus league.js: die Aufrufe im Beispiel werden ausgewertet und liefern die kommentierten Werte', () => {
  // [Aufruf wie im Beispiel, erwartetes Ergebnis, Kommentartext hinter dem Aufruf]
  const CALLS: [string, unknown, string][] = [
    ['leagueWindow(teams).map((t) => t.rank)', [1, 2, 3, 4], 'Plätze 1 bis 4'],
    ['leagueWindow(teams, { limit: 2 }).map((t) => t.rank)', [1, 2, 3, 4], 'wegen der eigenen Mannschaft trotzdem vier Zeilen'],
    ["leagueWindow(teams.map(({ own, ...team }) => team), { limit: 2 }).map((t) => t.rank)", [1, 2], 'Plätze 1 und 2'],
    ["leagueSummary({ teamCount: 12, played: 66, total: 132 })", '12 Teams · 66 von 132 Spielen gespielt', "'12 Teams · 66 von 132 Spielen gespielt'"],
    ['leagueSummary({ teamCount: 1 })', '1 Team', "'1 Team'"],
    ['windowLabel(rows, 12)', 'Plätze 1 bis 4 von 12', "'Plätze 1 bis 4 von 12'"],
    ["formLabel(['S', 'S', 'N'])", 'Form: Sieg, Sieg, Niederlage', "'Form: Sieg, Sieg, Niederlage'"],
  ];
  it('jeder Aufruf steht im Beispiel mit seinem Kommentar, und das Ergebnis stimmt', async () => {
    const callable = (expr: string) => expr.replace(/\)\.map\(\(t\) => t\.rank\)$/, ')');
    for (const [expr, , comment] of CALLS) {
      const line = league.funktionenJs.split('\n').find((l) => l.includes(callable(expr)) && l.includes('//'));
      expect(line, expr).toBeDefined();
      expect(line, expr).toContain(comment);
    }
    const file = `${tmpDir}funktionen.mjs`;
    const body = league.funktionenJs.replace("'@bbv/dss-design-system/league.js'", `'${rootDir}js/league.js'`);
    writeFileSync(file, `${body}\nexport const results = [${CALLS.map(([expr]) => expr).join(',\n')}];\n`);
    const mod = (await vite.ssrLoadModule(file)) as { results: unknown[] };
    expect(mod.results).toEqual(CALLS.map(([, expected]) => expected));
  });
});

describe('Beispiele der Doku-Seite', () => {
  const stories = readFileSync(`${rootDir}stories/LeagueCard.stories.ts`, 'utf8');
  const names = [...stories.matchAll(/example\('([\w-]+)'\)/g)].map((m) => m[1]);
  const renderExample = async (example: string) => {
    const Examples = ((await vite.ssrLoadModule(`${rootDir}stories/components/LeagueCardExamples.svelte`)) as { default: unknown }).default;
    return render(Examples, { props: { example } }).body;
  };
  it('jede Beispiel-Story hat ein Beispiel und rendert eine Ligencard', async () => {
    expect(names.length).toBeGreaterThanOrEqual(18);
    for (const example of names) {
      const html = await renderExample(example);
      expect(html, example).toContain('dss-league');
      expect(html, example).not.toContain('undefined');
    }
  });
  it('Beispiele rendern erwartete Titel, Zeilenzahl und Spaltenköpfe', async () => {
    const heads = (html: string) => (html.split('<table')[1]?.split('</thead>')[0].match(/<th /g) ?? []).length;
    const std = await renderExample('standard');
    expect(rowCounts(std)).toEqual([4, 3]);
    expect(std).toContain('12 Teams · 66 von 132 Spielen gespielt');
    const spalten = await renderExample('spalten');
    expect(rowCounts(spalten)).toEqual([4, 4]);
    const tables = spalten.split('<table').slice(1);
    expect(tables.map((t) => (t.split('</thead>')[0].match(/<th /g) ?? []).length)).toEqual([4, 8]);
    expect(heads(await renderExample('minimal'))).toBe(4);
    expect(rowCounts(await renderExample('minimal'))).toEqual([3, 1]);
    expect(rowCounts(await renderExample('ausschnitt'))).toEqual([4, 4, 4, 3, 3]);
    expect(rowCounts(await renderExample('zonen'))).toEqual([4, 12]);
    expect(await renderExample('live')).toContain('2 Spiele laufen');
    expect(rowCounts(await renderExample('do-zeilen'))).toEqual([4]);
    expect(rowCounts(await renderExample('dont-zeilen'))).toEqual([12]);
  });
  it('Titel sind eindeutig: je Beispiel und über alle Beispiele einer Docs-Seite (axe landmark-unique)', async () => {
    const all: string[] = [];
    for (const example of names) {
      const found = titles(await renderExample(example));
      expect(new Set(found).size, `${example}: ${found.join(' | ')}`).toBe(found.length);
      // Die Handy-Vorschau lebt allein in ihrem iframe und kommt auf der Docs-Seite nicht inline vor
      if (example !== 'handy') all.push(...found);
    }
    expect(new Set(all).size, `doppelt: ${all.filter((t, i) => all.indexOf(t) !== i).join(', ')}`).toBe(all.length);
  });
  it('Quelltext: kein fester Titel an einer Karte, alle Titel stammen aus LIGEN (mit Index)', () => {
    const source = readFileSync(`${rootDir}stories/components/LeagueCardExamples.svelte`, 'utf8');
    const cards = source.match(/<LeagueCard [^>]*>/g) ?? [];
    expect(cards.length).toBeGreaterThanOrEqual(28);
    for (const card of cards) expect(card).toMatch(/title=\{LIGEN\[\d+( \+ i)?\]\}/);
    const indexes = cards.map((c) => c.match(/LIGEN\[(\d+)( \+ i)?\]/)!).flatMap((m) => (m[2] ? [Number(m[1]), Number(m[1]) + 1, Number(m[1]) + 2] : [Number(m[1])]));
    expect(new Set(indexes).size).toBe(indexes.length);
    const data = readFileSync(`${rootDir}stories/components/leagueData.ts`, 'utf8');
    const ligen = [...data.slice(data.indexOf('export const LIGEN'), data.indexOf('];', data.indexOf('export const LIGEN'))).matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(new Set(ligen).size).toBe(ligen.length);
    expect(Math.max(...indexes)).toBeLessThan(ligen.length);
  });
  it('Dos und Don\'ts: Kartentitel als h4 unter den h3-Paartiteln', async () => {
    for (const example of names.filter((n) => /^(do|dont)-/.test(n))) {
      expect(await renderExample(example), example).toMatch(/<h4 class="dss-league-title">/);
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
