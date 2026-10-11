// @vitest-environment node
// Code-Beispiele der Seite „Accordion“ (stories/Accordion.code.ts): React per TypeScript-Compiler und Server-Rendering, Svelte per
// Server-Rendering, Vanilla-Markup gegen die Ausgabe der Komponenten; Hilfsfunktionen und Tokens stimmen mit den Kommentaren überein.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/Accordion.code';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp-accordion/`;
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
    .replace(/ data-dss-acc(="")?/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();
const tags = (html: string) => [...html.matchAll(/<(h[1-6])[\s>]/g)].map((m) => m[1]);

const renderSvelte = async (name: string, source: string) => {
  const file = `${tmpDir}${name}.svelte`;
  writeFileSync(file, source.replace(/@bbv\/dss-design-system\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`));
  const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
  return render(component, { props: {} }).body;
};

/** Beispielcode → Modul mit einer Demo-Komponente (Importe auf die Quellen im Repo umgelegt). */
function reactModule(source: string, target: 'check' | 'run', name: string): string {
  const map = (line: string) => line.replace('@bbv/dss-design-system/react', target === 'check' ? './index' : `${rootDir}react/index.ts`);
  const imports = source.match(/^import [^;]+;$/gm) ?? [];
  const rest = source.replace(/^import [^;]+;$/gm, '').trim();
  if (/^export function/m.test(rest)) return [...imports.map(map), rest].join('\n');
  return [...imports.map(map), `export const Demo_${name} = () => (\n<>${rest}</>\n);`].join('\n');
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

describe('Svelte-Beispiele rendern (SSR)', () => {
  it('Hauptbeispiel: zwei Bereiche, der erste offen, die Zusatzinfo im Kopf', async () => {
    const html = await renderSvelte('svelte', code.svelte);
    expect(tags(html)).toEqual(['h3', 'h3']);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('12 Spiele');
  });
  it('Überschriftenebene: h1, h2, dann h3 (Kader), h4 (verschachtelt), h5 (titleAs)', async () => {
    expect(tags(await renderSvelte('ebenenSvelte', code.ebenenSvelte))).toEqual(['h1', 'h2', 'h3', 'h4', 'h5']);
  });
});

describe('React-Beispiele bestehen den TypeScript-Compiler und rendern wie Svelte', () => {
  it('beide Beispiele ohne Fehler', () => {
    const files: Record<string, string> = {};
    for (const [name, source] of Object.entries({ react: code.react, ebenenReact: code.ebenenReact })) files[`${rootDir}react/__code_${name}.tsx`] = reactModule(source, 'check', name);
    expect(compile(files)).toEqual([]);
  }, 60000);
  it('Typfehler würden auffallen (titleAs h1 und fehlende id)', () => {
    const bad = `import { AccordionItem } from '@bbv/dss-design-system/react';\n\nexport const A = () => <><AccordionItem id="a" title="x" titleAs="h1" /><AccordionItem title="y" /></>;`;
    const file = `${rootDir}react/__code_bad.tsx`;
    const messages = compile({ [file]: reactModule(bad, 'check', 'bad') });
    expect(messages.join('\n')).toContain('"h1"');
    expect(messages.join('\n')).toContain("'id'");
  }, 60000);
  const run = async (name: string, source: string, exportName: string) => {
    const file = `${tmpDir}__code_${name}.tsx`;
    writeFileSync(file, reactModule(source, 'run', name));
    const mod = (await vite.ssrLoadModule(file)) as Record<string, ComponentType>;
    return renderToStaticMarkup(createElement(mod[exportName]));
  };
  it('Hauptbeispiel: dasselbe Markup wie Svelte und Vanilla', async () => {
    const react = await run('react', code.react, 'LigaSeite');
    const svelteHtml = await renderSvelte('svelte2', code.svelte);
    expect(normalize(react)).toBe(normalize(svelteHtml));
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('');
    const root = dom.window.document.createRange().createContextualFragment(code.vanilla.replace(/<!--[\s\S]*?-->/g, '')).querySelector('.dss-acc')!;
    expect(normalize(root.outerHTML)).toBe(normalize(svelteHtml));
    expect(normalize(code.buttonMarkup)).toBe(normalize(svelteHtml));
  });
  it('Überschriftenebene: dieselben Ebenen und dasselbe Markup wie Svelte', async () => {
    const react = await run('ebenenReact', code.ebenenReact, 'Mannschaft');
    expect(tags(react)).toEqual(['h1', 'h2', 'h3', 'h4', 'h5']);
    expect(normalize(react)).toBe(normalize(await renderSvelte('ebenenSvelte2', code.ebenenSvelte)));
  });
});

describe('Vanilla: natives details', () => {
  it('drei details mit gemeinsamem name, summary als Kopf, die Klassen gibt es im CSS', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('');
    const root = dom.window.document.createRange().createContextualFragment(code.detailsMarkup);
    const items = [...root.querySelectorAll('details.dss-acc-item')];
    expect(items).toHaveLength(3);
    expect(new Set(items.map((d) => d.getAttribute('name'))).size).toBe(1);
    expect(items.every((d) => d.querySelector(':scope > summary.dss-acc-trigger > .dss-acc-label'))).toBe(true);
    expect(items.filter((d) => d.hasAttribute('open'))).toHaveLength(1);
    expect(new Set(items.map((d) => d.id)).size).toBe(3);
    const css = readFileSync(`${rootDir}css/components.css`, 'utf8');
    for (const cls of new Set(code.detailsMarkup.match(/dss-[\w-]+/g))) expect(css, cls).toContain(`.${cls}`);
  });
  it('das Skript im Beispiel (exclusive) hält auch ohne native Gruppe nur einen offen', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(`<!doctype html><body>${code.detailsMarkup}</body>`);
    const g = globalThis as Record<string, unknown>;
    const saved = { window: g.window, document: g.document, Element: g.Element, Node: g.Node };
    Object.assign(g, { window: dom.window, document: dom.window.document, Element: dom.window.Element, Node: dom.window.Node });
    try {
      const { initAccordion } = await import('../js/accordion.js');
      const destroy = initAccordion(dom.window.document.querySelector('.dss-acc')!, { exclusive: true, syncHash: false });
      const second = dom.window.document.querySelector<HTMLDetailsElement>('#d-spielplan')!;
      second.open = true;
      await new Promise((r) => setTimeout(r, 10));
      expect([...dom.window.document.querySelectorAll('details')].filter((d) => d.open).map((d) => d.id)).toEqual(['d-spielplan']);
      destroy();
    } finally {
      Object.assign(g, saved);
    }
  });
});

describe('Beispiele der Seite sind stimmig', () => {
  it('der Import-Pfad im Vanilla-Skript ist ein Export des Pakets', () => {
    const pkg = JSON.parse(readFileSync(`${rootDir}package.json`, 'utf8')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./accordion.js']).toBeTruthy();
    expect(pkg.exports['./svelte/Accordion']).toBeTruthy();
    expect(pkg.exports['./svelte/AccordionItem']).toBeTruthy();
    expect(code.vanilla).toContain('@bbv/dss-design-system/accordion.js');
    expect(code.svelte).toContain('@bbv/dss-design-system/svelte/Accordion');
    expect(code.svelte).toContain('@bbv/dss-design-system/svelte/AccordionItem');
  });
  it('funktionenJs: die Kommentare stimmen mit den Funktionen überein', async () => {
    const { nextHeader, hashTarget, ancestorsOf, labelWithMeta, summaryText } = await import('../js/accordion.js');
    const koepfe = [{ disabled: false }, { disabled: true }, { disabled: false }];
    expect([nextHeader(0, 'ArrowDown', koepfe), nextHeader(2, 'ArrowDown', koepfe), nextHeader(2, 'Home', koepfe)]).toEqual([2, 2, 0]);
    expect([hashTarget('#kader', ['tabelle', 'kader']), hashTarget('#unbekannt', ['tabelle', 'kader'])]).toEqual(['kader', null]);
    expect(ancestorsOf('halle', [{ id: 'kader' }, { id: 'heim', parent: 'kader' }, { id: 'halle', parent: 'heim' }])).toEqual(['kader', 'heim']);
    expect([labelWithMeta('Kader', '14 Spieler'), summaryText(3, 5), summaryText(5, 5)]).toEqual(['Kader, 14 Spieler', '3 von 5 Bereichen geöffnet', 'Alle Bereiche geöffnet']);
    for (const line of code.funktionenJs.split('\n').filter((l) => l.includes('//'))) expect(line).toMatch(/\/\/ .+/);
  });
  it('tokensCss nutzt nur Tokens, die es gibt', () => {
    const css = readFileSync(`${rootDir}css/components.css`, 'utf8');
    const tokens = readFileSync(`${rootDir}tokens/tokens.css`, 'utf8');
    for (const name of code.tokensCss.match(/--dss-acc-[\w-]+(?=:)/g) ?? []) expect(css, name).toContain(name);
    expect([...(code.tokensCss.match(/--dss-acc-[\w-]+(?=:)/g) ?? [])]).toHaveLength(5);
    for (const m of code.tokensCss.matchAll(/var\((--[\w-]+)\)/g)) expect(tokens, m[1]).toContain(`${m[1]}:`);
  });
});
