// Hilfen für die Tests der Doku-Seiten: React-Beispiele mit dem TypeScript-Compiler prüfen, Svelte-Beispiele server-rendern, Seiten lesen.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { createServer, type ViteDevServer } from 'vite';

export const rootDir = new URL('../../', import.meta.url).pathname;
export const read = (path: string) => readFileSync(`${rootDir}${path}`, 'utf8');

export type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };

/** Vite-Server für das Laden von Svelte- und React-Modulen im Test (SSR). */
export async function startServer(): Promise<{ vite: ViteDevServer; render: Render }> {
  const vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  const render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
  await vite.ssrLoadModule('/tests/setup-i18n.ts'); // Standardsprache der Tests (Deutsch) auch im Modulgraphen dieses Servers
  return { vite, render };
}

/** Rendert ein Svelte-Beispiel aus dem Text (Path-Importe zeigen auf svelte/ im Repository). */
export async function renderSvelteSource(vite: ViteDevServer, render: Render, tmpDir: string, name: string, source: string, props: Record<string, unknown> = {}) {
  mkdirSync(tmpDir, { recursive: true });
  const file = `${tmpDir}${name}.svelte`;
  writeFileSync(file, source.replace(/@hoopsfoundry\/ui\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`).replace(/@hoopsfoundry\/ui\/([\w-]+)\.js/g, (_m, mod: string) => `${rootDir}js/${mod}.js`));
  const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
  return render(component, { props }).body;
}
export const cleanup = (tmpDir: string) => rmSync(tmpDir, { recursive: true, force: true });

/** Übersetzt React-Beispiele (Text) mit dem TypeScript-Compiler; gibt die Meldungen zurück (leer = in Ordnung). */
export function compileReact(sources: Record<string, string>): string[] {
  const files: Record<string, string> = {};
  for (const [name, source] of Object.entries(sources)) {
    const imports = source.match(/^import [^;]+;$/gm) ?? [];
    const rest = source.replace(/^import [^;]+;$/gm, '').trim();
    const split = rest.search(/\n\n(\{\/\*|<)/);
    const head = split < 0 ? '' : rest.slice(0, split);
    const body = split < 0 ? rest : rest.slice(split);
    const isComponent = /export (default )?function/.test(rest);
    files[`${rootDir}react/__code_${name}.tsx`] = (isComponent
      ? [...imports.map((l) => l.replace('@hoopsfoundry/ui/react', './index').replace(/@hoopsfoundry\/ui\/([\w-]+)\.js/, '../js/$1.js')), rest.replace(/^import [^;]+;$/gm, '')]
      : [...imports.map((l) => l.replace('@hoopsfoundry/ui/react', './index')), head, `export const Demo_${name} = () => (\n<>${body}</>\n);`]).join('\n');
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
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName in files).map((d) => `${d.file!.fileName.split('/').pop()}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
}

/** Markup beider Fassungen vergleichbar machen (Klassen sortiert, Leerraum, Kommentare). */
export const normalize = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/ (hidden|inert)=""/g, ' $1')
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, v: string) => `class="${v.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();
