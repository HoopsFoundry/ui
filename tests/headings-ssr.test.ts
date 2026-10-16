// @vitest-environment node
// Svelte und React geben dieselben Überschriftenebenen aus: titleAs > HeadingLevel > h3, für alle sieben Titelkomponenten
// (Server-Rendering beider Fassungen, Markup verglichen); das Modal gibt seinen Kindern titleAs + 1 weiter.
import { createElement, type ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TITLE_CASES, type TitleCase } from './helpers/title-cases';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let render: Render;
let snip: (html: string) => never;
let HeadingLevelReact: ComponentType<{ level?: number; by?: number }>;
let Wrap: unknown;
let ModalWith: unknown;
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];

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

const tags = (html: string) => [...html.matchAll(/<(h[1-6])[\s>]/g)].map((m) => m[1]);

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js' })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
  const { createRawSnippet } = (await vite.ssrLoadModule('svelte')) as { createRawSnippet: (fn: () => { render: () => string }) => unknown };
  snip = (html) => createRawSnippet(() => ({ render: () => html })) as never;
  HeadingLevelReact = (await load('react/HeadingLevel.tsx', 'HeadingLevel')) as typeof HeadingLevelReact;
  Wrap = await load('tests/helpers/Wrap.svelte');
  ModalWith = await load('tests/helpers/ModalWith.svelte');
}, 60000);
afterAll(async () => {
  await vite?.close();
});

type Wrapping = { level?: number; by?: number }[];

async function both(c: TitleCase, extra: Record<string, unknown>, wrap: Wrapping) {
  const Svelte = await load(c.svelte);
  const React = (await load(c.react, c.reactName)) as ComponentType<Record<string, unknown>>;
  const svelteHtml = render(Wrap, { props: { Comp: Svelte, props: { ...c.svelteProps(snip), ...extra }, wrap } }).body;
  let tree = createElement(React, { ...c.reactProps(), ...extra });
  for (const w of [...wrap].reverse()) tree = createElement(HeadingLevelReact, w, tree);
  return { svelte: normalize(svelteHtml), react: normalize(renderToStaticMarkup(tree)), svelteTags: tags(svelteHtml) };
}

const WRAPPINGS: [string, Wrapping, string][] = [
  ['ohne HeadingLevel', [], 'h3'],
  ['level 2', [{ level: 2 }], 'h2'],
  ['level 4', [{ level: 4 }], 'h4'],
  ['level 6', [{ level: 6 }], 'h6'],
  ['by (ohne Vorfahr)', [{ by: 1 }], 'h3'],
  ['by 2 (ohne Vorfahr)', [{ by: 2 }], 'h4'],
  ['level 2 + by', [{ level: 2 }, { by: 1 }], 'h3'],
  ['level 3 + by 2 + by', [{ level: 3 }, { by: 2 }, { by: 1 }], 'h6'],
  ['by über 6 hinaus', [{ level: 6 }, { by: 2 }], 'h6'],
];
const TITLEAS: (string | undefined)[] = [undefined, 'h2', 'h5'];

describe.each(TITLE_CASES.map((c) => [c.name, c] as const))('%s: Svelte und React geben dieselbe Ebene aus', (_name, c) => {
  const compact = c.name.includes('compact');
  for (const [label, wrap, level] of WRAPPINGS) {
    for (const titleAs of TITLEAS) {
      it(`${label}, titleAs=${titleAs ?? '-'}`, async () => {
        const r = await both(c, titleAs ? { titleAs } : {}, wrap);
        expect(r.svelte).toBe(r.react);
        // compact (TeamCard) hat keine Überschrift
        expect(r.svelteTags).toEqual(compact ? [] : [titleAs ?? level]);
      });
    }
  }
});

describe('Modal: Titel h2 (oder titleAs), Kinder bekommen die nächste Ebene (Svelte)', () => {
  const table = TITLE_CASES.find((c) => c.name === 'Table')!;
  const empty = TITLE_CASES.find((c) => c.name === 'EmptyState')!;
  const modalTags = async (c: TitleCase, extra: Record<string, unknown>) => {
    const Svelte = await load(c.svelte);
    return tags(render(ModalWith, { props: { Comp: Svelte, props: c.svelteProps(snip), ...extra } }).body);
  };
  it('Standard: h2 und h3', async () => {
    expect(await modalTags(table, {})).toEqual(['h2', 'h3']);
  });
  it.each([['h2', 'h3'], ['h3', 'h4'], ['h4', 'h5'], ['h5', 'h6'], ['h6', 'h6']])('titleAs=%s: Inhalt %s', async (titleAs, child) => {
    expect(await modalTags(table, { titleAs })).toEqual([titleAs, child]);
  });
  it('Footer bekommt dieselbe Ebene wie der Inhalt', async () => {
    expect(await modalTags(empty, { inFooter: true })).toEqual(['h2', 'h3']);
  });
  it('eigenes HeadingLevel im Inhalt gewinnt', async () => {
    expect(await modalTags(empty, { nested: 5 })).toEqual(['h2', 'h5']);
  });
  it('ein HeadingLevel außerhalb ändert den Titel nicht', async () => {
    expect(await modalTags(table, { outer: 5 })).toEqual(['h2', 'h3']);
  });
  it('ungültiges titleAs: Rückfall auf h2', async () => {
    expect(await modalTags(table, { titleAs: 'h1' })).toEqual(['h2', 'h3']);
  });
  it('der Titel trägt die Klasse und die id des Dialogs', async () => {
    const Svelte = await load(table.svelte);
    const html = render(ModalWith, { props: { Comp: Svelte, props: table.svelteProps(snip), titleAs: 'h4' } }).body;
    expect(html).toMatch(/<h4 class="hoops-m-title" id="(hoops-modal-title-[^"]+)"/);
    expect(html).toMatch(/aria-labelledby="hoops-modal-title-/);
  });
});
