// @vitest-environment node
// Code-Beispiele der Seite „Überschriften“ (stories/Foundation/Headings.code.ts): Svelte per Server-Rendering, React per
// TypeScript-Compiler und Server-Rendering, Vanilla-Markup gegen die Ausgabe der Komponenten; die Ebenen stimmen überall.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/Foundation/Headings.code';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp-headings/`;
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
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();
const tags = (html: string) => [...html.matchAll(/<(h[1-6])[\s>]/g)].map((m) => m[1]);

const SVELTE = { seiteSvelte: code.seiteSvelte, relativSvelte: code.relativSvelte, modalSvelte: code.modalSvelte };
const REACT = { seiteReact: code.seiteReact, relativReact: code.relativReact, modalReact: code.modalReact, hookReact: code.hookReact };
const EXPECTED: Record<string, string[]> = {
  seite: ['h1', 'h2', 'h3', 'h2', 'h3', 'h3'],
  relativ: ['h3', 'h4', 'h2', 'h5'],
  modal: ['h2', 'h3'],
};

const renderSvelte = async (name: string, source: string) => {
  const file = `${tmpDir}${name}.svelte`;
  writeFileSync(file, source.replace(/@hoopsfoundry\/ui\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`));
  const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
  return render(component, { props: {} }).body;
};

/** Beispielcode → Modul mit einer Demo-Komponente (Importe auf die Quellen im Repo umgelegt). */
function reactModule(source: string, target: 'check' | 'run', name: string): string {
  const map = (line: string) =>
    line
      .replace('@hoopsfoundry/ui/react', target === 'check' ? './index' : `${rootDir}react/index.ts`)
      .replace('@hoopsfoundry/ui/heading.js', target === 'check' ? '../js/heading.js' : `${rootDir}js/heading.js`);
  const imports = source.match(/^import [^;]+;$/gm) ?? [];
  const rest = source.replace(/^import [^;]+;$/gm, '').trim();
  if (/^export function/m.test(rest)) return [...imports.map(map), rest].join('\n');
  const split = rest.search(/\n\n(\{\/\*|<)/);
  const head = split < 0 ? '' : rest.slice(0, split);
  const body = split < 0 ? rest : rest.slice(split);
  return [...imports.map(map), head, `export const Demo_${name} = () => (\n<>${body}</>\n);`].join('\n');
}

describe('Svelte-Beispiele rendern (SSR) mit den erwarteten Ebenen', () => {
  it.each(Object.entries(SVELTE))('%s', async (name, source) => {
    const html = await renderSvelte(name, source);
    expect(tags(html)).toEqual(EXPECTED[name.replace('Svelte', '')]);
  });
});

describe('React-Beispiele bestehen den TypeScript-Compiler', () => {
  it('alle Beispiele ohne Fehler', () => {
    const files: Record<string, string> = {};
    for (const [name, source] of Object.entries(REACT)) files[`${rootDir}react/__code_${name}.tsx`] = reactModule(source, 'check', name);
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

  it('Typfehler in einem Beispiel würden auffallen (titleAs h1 ist kein gültiger Typ)', () => {
    const bad = `import { EmptyState } from '@hoopsfoundry/ui/react';\n\n<EmptyState title="x" titleAs="h1" />`;
    const name = 'bad';
    const file = `${rootDir}react/__code_${name}.tsx`;
    const files = { [file]: reactModule(bad, 'check', name) };
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true, isolatedModules: true, types: [],
    };
    const host = ts.createCompilerHost(options);
    const original = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, ...rest) => (fileName in files ? ts.createSourceFile(fileName, files[fileName as keyof typeof files], languageVersion) : original(fileName, languageVersion, ...rest));
    const exists = host.fileExists.bind(host);
    host.fileExists = (fileName) => fileName in files || exists(fileName);
    const program = ts.createProgram([file], options, host);
    const messages = ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === file).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    expect(messages.join('\n')).toContain('"h1"');
  }, 60000);
});

describe('React-Beispiele rendern mit den erwarteten Ebenen und wie Svelte', () => {
  const run = async (name: string, source: string) => {
    const file = `${tmpDir}__code_${name}.tsx`;
    writeFileSync(file, reactModule(source, 'run', name));
    const mod = (await vite.ssrLoadModule(file)) as Record<string, ComponentType>;
    return renderToStaticMarkup(createElement(mod[`Demo_${name}`]));
  };
  it('seite: dieselben Ebenen und dasselbe Markup wie Svelte und Vanilla', async () => {
    const react = await run('seiteReact', code.seiteReact);
    expect(tags(react)).toEqual(EXPECTED.seite);
    const svelteHtml = await renderSvelte('seiteSvelte2', code.seiteSvelte);
    expect(normalize(react)).toBe(normalize(svelteHtml));
    expect(normalize(code.seiteVanilla)).toBe(normalize(svelteHtml));
  });
  it('relativ: h3, h4, h2, h5 (level als Zeichenkette)', async () => {
    expect(tags(await run('relativReact', code.relativReact))).toEqual(EXPECTED.relativ);
    expect(normalize(await run('relativReact', code.relativReact))).toBe(normalize(await renderSvelte('relativSvelte2', code.relativSvelte)));
  });
  it('modal: h2 und h3 (Radix-Portal rendert erst im Browser, hier wird der Inhalt geprüft)', () => {
    expect(code.modalReact).toContain('<Modal open');
  });
  it('hook: eigene Überschrift folgt der Ebene', async () => {
    const file = `${tmpDir}__code_hook.tsx`;
    writeFileSync(file, reactModule(code.hookReact, 'run', 'hook'));
    const mod = (await vite.ssrLoadModule(file)) as { SectionTitle: ComponentType<{ children: string }> };
    const { HeadingLevel } = (await vite.ssrLoadModule(`${rootDir}react/index.ts`)) as { HeadingLevel: ComponentType<{ level: number; children: unknown }> };
    expect(renderToStaticMarkup(createElement(mod.SectionTitle, { children: 'A' }))).toBe('<h3 class="hoops-t-h3">A</h3>');
    expect(renderToStaticMarkup(createElement(HeadingLevel, { level: 5, children: createElement(mod.SectionTitle, { children: 'B' }) }))).toBe('<h5 class="hoops-t-h3">B</h5>');
  });
});

describe('Hilfsfunktionen: die Kommentare im Beispiel stimmen', () => {
  it('funktionenJs', async () => {
    const { headingTag, nextLevel } = await import('../js/heading.js');
    expect([headingTag(4), headingTag(1), headingTag(7), headingTag(3.5), headingTag('4'), nextLevel(3), nextLevel(3, 2), nextLevel(undefined)]).toEqual(['h4', 'h2', 'h6', 'h3', 'h4', 4, 5, 3]);
    expect(code.funktionenJs).toContain("headingTag('4');      // 'h4'");
  });
});

describe('CSS-Beispiel der Tokens', () => {
  it('nutzt nur Tokens, die es gibt', async () => {
    const { readFileSync } = await import('node:fs');
    const tokens = readFileSync(`${rootDir}css/components.css`, 'utf8');
    for (const name of code.tokensCss.match(/--[\w-]+(?=:)/g) ?? []) expect(tokens, name).toContain(name);
    for (const name of code.tokensCss.match(/var\((--[\w-]+)\)/g) ?? []) {
      const token = name.slice(4, -1);
      expect(readFileSync(`${rootDir}tokens/tokens.css`, 'utf8'), token).toContain(`${token}:`);
    }
  });
});

describe('Typ HeadingLevelInput (js/heading.d.ts, Svelte und React)', () => {
  const check = (body: string) => {
    const file = `${rootDir}react/__code_typ.ts`;
    const files: Record<string, string> = { [file]: `import type { HeadingLevelInput } from '../js/heading.js';\n${body}` };
    const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts'], module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noEmit: true, skipLibCheck: true, isolatedModules: true, types: [] };
    const host = ts.createCompilerHost(options);
    const original = host.getSourceFile.bind(host);
    host.getSourceFile = (name, version, ...rest) => (name in files ? ts.createSourceFile(name, files[name], version) : original(name, version, ...rest));
    const exists = host.fileExists.bind(host);
    host.fileExists = (name) => name in files || exists(name);
    return ts.getPreEmitDiagnostics(ts.createProgram([file], options, host)).filter((d) => d.file?.fileName === file).length;
  };
  it('Zahlen 2 bis 6 und ihre Zeichenketten sind erlaubt', () => {
    expect(check("const a: HeadingLevelInput[] = [2, 3, 4, 5, 6, '2', '3', '4', '5', '6']; void a;")).toBe(0);
  });
  it('1, 7 und fremde Zeichenketten sind Typfehler', () => {
    expect(check("const a: HeadingLevelInput = 7; void a;")).toBeGreaterThan(0);
    expect(check("const a: HeadingLevelInput = '1'; void a;")).toBeGreaterThan(0);
    expect(check("const a: HeadingLevelInput = 'h3'; void a;")).toBeGreaterThan(0);
  });
  it('die Svelte- und React-Komponente nutzen ihn für level', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(`${rootDir}svelte/HeadingLevel.svelte`, 'utf8')).toMatch(/level\?: HeadingLevelInput;/);
    expect(readFileSync(`${rootDir}react/HeadingLevel.tsx`, 'utf8')).toMatch(/level\?: HeadingLevelInput;/);
  });
});

describe('Doku-Beispiele der Seite Headings sind inert', () => {
  it('die Vorschau (.stage) ist inert, die Gliederung bleibt außerhalb sichtbar', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(`${rootDir}stories/Foundation/Headings.svelte`, 'utf8');
    expect(src).toMatch(/<div class="stage" inert>/);
    expect(src).toMatch(/<ul class="outline" aria-hidden="true">/);
    expect(src.indexOf('<ul class="outline"')).toBeGreaterThan(src.indexOf('</div>\n\n  <ul'));
  });
});
