// @vitest-environment node
// Svelte und React geben beim Server-Rendering dasselbe Markup aus (Vite-SSR gegen renderToStaticMarkup, normalisiert),
// und beide rendern ohne window. Die Sprungleiste, „Alle öffnen/schließen“ und die Region-Rolle in Gruppen entstehen erst im Browser.
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let render: Render;
let Host: unknown;
let Acc: (p: Record<string, unknown>) => ReactElement;
let Item: (p: Record<string, unknown>) => ReactElement;
let Level: (p: Record<string, unknown>) => ReactElement;
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];

const normalize = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ (hidden|inert)=""/g, ' $1')
    .replace(/&gt;/g, '>') // Svelte schreibt ">" im Text unmaskiert, React als &gt;
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();

type ItemCfg = { id: string; title: string; open?: boolean; disabled?: boolean; meta?: string; titleAs?: string; body?: string; nested?: GroupCfg };
type GroupCfg = { props?: Record<string, unknown>; items: ItemCfg[]; wrap?: { level?: number; by?: number }[] };

function reactGroup(g: GroupCfg): ReactElement {
  const items = g.items.map((item) =>
    createElement(
      Item,
      { key: item.id, id: item.id, title: item.title, defaultOpen: item.open, disabled: item.disabled, titleAs: item.titleAs, meta: item.meta },
      item.body ?? '',
      item.nested ? reactGroup(item.nested) : null,
    ),
  );
  return createElement(Acc, { ...(g.props ?? {}) }, ...items);
}
function reactTree(g: GroupCfg): ReactElement {
  let tree = reactGroup(g);
  for (const w of [...(g.wrap ?? [])].reverse()) tree = createElement(Level, w, tree);
  return tree;
}

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
  Host = await load('tests/helpers/AccordionSsr.svelte');
  Acc = (await load('react/Accordion.tsx', 'Accordion')) as typeof Acc;
  Item = (await load('react/Accordion.tsx', 'AccordionItem')) as typeof Item;
  Level = (await load('react/HeadingLevel.tsx', 'HeadingLevel')) as typeof Level;
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const three: ItemCfg[] = [
  { id: 'a', title: 'Tabelle', body: 'Inhalt A' },
  { id: 'b', title: 'Spielplan', body: 'Inhalt B' },
  { id: 'c', title: 'Kader', body: 'Inhalt C' },
];
const many = (n: number): ItemCfg[] => Array.from({ length: n }, (_, i) => ({ id: `i${i}`, title: `Bereich ${i}`, body: 'x' }));
const nest = (props: Record<string, unknown> = {}): GroupCfg => ({
  props: { syncHash: false, ...props },
  items: [{ id: 'o', title: 'Außen', open: true, body: 'außen', nested: { props: { syncHash: false }, items: [{ id: 'm', title: 'Mitte', open: true, body: 'mitte', nested: { items: [{ id: 'i', title: 'Innen', body: 'innen' }] } }, { id: 'm2', title: 'Mitte 2' }] } }],
});

const CASES: [string, GroupCfg][] = [
  ['drei geschlossen', { items: three }],
  ['ein Bereich offen', { items: [{ ...three[0], open: true }, three[1], three[2]] }],
  ['alle offen', { items: three.map((i) => ({ ...i, open: true })) }],
  ['flach', { props: { variant: 'flat' }, items: three }],
  ['Karte ausdrücklich', { props: { variant: 'card' }, items: three }],
  ['sticky', { props: { sticky: true }, items: [{ ...three[0], open: true }, three[1]] }],
  ['sticky + flach', { props: { sticky: true, variant: 'flat' }, items: three }],
  ['exclusive', { props: { exclusive: true }, items: [{ ...three[0], open: true }, three[1]] }],
  ['expandAll (Leiste erst im Browser)', { props: { expandAll: true }, items: three }],
  ['nav (Leiste erst im Browser)', { props: { nav: true }, items: three }],
  ['nav + expandAll + sticky', { props: { nav: true, expandAll: true, sticky: true }, items: three }],
  ['syncHash false', { props: { syncHash: false }, items: three }],
  ['Meta als Text', { items: [{ id: 'k', title: 'Kader', meta: '14 Spieler' }, { id: 'l', title: 'Spielplan', meta: '3 live', open: true }] }],
  ['Meta bei geschlossenem und offenem Bereich', { items: [{ id: 'k', title: 'Kader', meta: '14', open: true }, { id: 'l', title: 'Plan' }] }],
  ['ein gesperrter Bereich', { items: [three[0], { ...three[1], disabled: true }, three[2]] }],
  ['gesperrt und offen', { items: [{ ...three[0], open: true, disabled: true }] }],
  ['alle gesperrt', { items: three.map((i) => ({ ...i, disabled: true })) }],
  ['titleAs der Gruppe h4', { props: { titleAs: 'h4' }, items: three }],
  ['titleAs am Bereich h2', { items: [{ ...three[0], titleAs: 'h2' }, three[1]] }],
  ['titleAs Bereich vor Gruppe', { props: { titleAs: 'h4' }, items: [{ ...three[0], titleAs: 'h6' }, three[1]] }],
  ['ungültiges titleAs h1: Rückfall h3', { items: [{ ...three[0], titleAs: 'h1' }] }],
  ['HeadingLevel 2 darüber', { wrap: [{ level: 2 }], items: three }],
  ['HeadingLevel 5 + by', { wrap: [{ level: 5 }, { by: 1 }], items: three }],
  ['sechs Bereiche (ohne Region im Server-Markup)', { items: many(6) }],
  ['sieben Bereiche (ohne Region)', { items: many(7) }],
  ['zehn Bereiche, einer offen', { items: many(10).map((x, i) => ({ ...x, open: i === 3 })) }],
  ['ein einzelner Bereich', { items: [three[0]] }],
  ['verschachtelt, drei Ebenen', nest()],
  ['verschachtelt, flach, sticky', nest({ variant: 'flat', sticky: true })],
  ['verschachtelt mit titleAs h2', nest({ titleAs: 'h2' })],
  ['verschachtelt unter HeadingLevel 4', { ...nest(), wrap: [{ level: 4 }] }],
  ['Sonderzeichen in Titel und id', { items: [{ id: 'a-b_1', title: 'Spiele & Ergebnisse <live>', body: 'a & b' }] }],
  ['leere Gruppe', { items: [] }],
];

describe('Accordion SSR: Svelte und React geben dasselbe Markup aus', () => {
  it('es sind mindestens 25 Fälle', () => expect(CASES.length).toBeGreaterThanOrEqual(25));
  it.each(CASES)('%s', (_name, cfg) => {
    const svelteHtml = normalize(render(Host, { props: { cfg } }).body);
    const reactHtml = normalize(renderToStaticMarkup(reactTree(cfg)));
    expect(svelteHtml).toBe(reactHtml);
  });
});

describe('Accordion SSR: Inhalt des Markups', () => {
  const html = (cfg: GroupCfg) => normalize(render(Host, { props: { cfg } }).body);
  it('Überschrift enthält den Button mit aria-expanded und aria-controls', () => {
    expect(html({ items: [three[0]] })).toContain('<h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="a-trigger" aria-expanded="false" aria-controls="a-panel">');
  });
  it('geschlossen: hidden und inert; offen: beides entfällt', () => {
    const closed = html({ items: [three[0]] });
    const open = html({ items: [{ ...three[0], open: true }] });
    expect(closed).toMatch(/id="a-panel"[^>]* hidden[^>]* inert|id="a-panel"[^>]* inert[^>]* hidden/);
    expect(open).not.toMatch(/id="a-panel"[^>]* (hidden|inert)/);
  });
  it('in einer Gruppe entsteht die Rolle erst im Browser; ein einzelner Bereich ist schon im Server-Markup eine Region (Svelte und React)', async () => {
    expect(html({ items: [three[0]] })).not.toContain('role="region"');
    const Solo = await load('tests/helpers/AccordionSolo.svelte');
    const svelteSolo = normalize(render(Solo, { props: {} }).body);
    const reactSolo = normalize(renderToStaticMarkup(createElement(Item, { id: 'solo', title: 'Allein' }, 'Text')));
    expect(svelteSolo).toContain('role="region" aria-labelledby="solo-trigger"');
    expect(svelteSolo).toBe(reactSolo);
  });
  it('Sprungleiste und Alle-öffnen-Leiste fehlen im Server-Markup', () => {
    const out = html({ props: { nav: true, expandAll: true }, items: three });
    expect(out).not.toContain('dss-acc-tools');
    expect(out).not.toContain('<nav');
  });
  it('ein verschachteltes Accordion zählt die Ebene hoch: h3, h4, h5', () => {
    const tags = [...html(nest()).matchAll(/<(h[1-6]) class="dss-acc-title"/g)].map((m) => m[1]);
    expect(tags).toEqual(['h3', 'h4', 'h5', 'h4']);
    expect(html(nest())).toContain('dss-acc--nested');
  });
  it('keine h1 und kein window nötig', () => {
    expect(html({ items: three })).not.toContain('<h1');
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
  });
});
