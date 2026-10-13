// Server-Rendering der Svelte- und React-Komponenten für den Paritätsvergleich mit den Vanilla-Render-Funktionen (V2a).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll } from 'vitest';
import { normalize } from './render-normalize';

export { normalize };

const rootDir = new URL('../../', import.meta.url).pathname;
type Props = Record<string, unknown>;

/** Registriert Start und Ende des Vite-Servers (SSR) in der aufrufenden Testdatei; die Fassungen werden je Aufruf geladen. */
export function useParity() {
  let vite: ViteDevServer;
  let render: (component: unknown, options: { props: Props }) => { body: string };
  let createRawSnippet: (fn: (...args: any[]) => { render: () => string }) => unknown;
  beforeAll(async () => {
    vite = await createServer({
      root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
      esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
    });
    render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
    createRawSnippet = ((await vite.ssrLoadModule('svelte')) as { createRawSnippet: typeof createRawSnippet }).createRawSnippet;
  }, 60000);
  afterAll(async () => {
    await vite?.close();
  });
  const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];
  return {
    /** Svelte-SSR einer Komponente aus `svelte/<name>.svelte`; `className` wird zu `class`. */
    async svelte(name: string, props: Props = {}) {
      const component = await load(`svelte/${name}.svelte`);
      const { className, ...rest } = props;
      return normalize(render(component, { props: className === undefined ? rest : { ...rest, class: className } }).body);
    },
    /** React-SSR (`renderToStaticMarkup`) einer Komponente aus `react/<name>.tsx`. */
    async react(name: string, props: Props = {}, children?: unknown) {
      const component = await load(`react/${name}.tsx`, name);
      const element = children === undefined ? createElement(component as never, props as never) : createElement(component as never, props as never, children as never);
      return normalize(renderToStaticMarkup(element));
    },
    /** Ein Snippet für Svelte, das festes Markup ausgibt (für Tabellenzeilen). */
    snippet(html: string | ((arg: unknown) => string)) {
      return createRawSnippet((arg?: () => unknown) => ({ render: () => (typeof html === 'function' ? html(arg?.()) : html) }));
    },
  };
}
