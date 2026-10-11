// @vitest-environment node
// Svelte und React geben die einklappbaren Rahmen (Table, ScheduleTable, ScheduleGrid, LeagueCard) beim Server-Rendering mit demselben
// Markup aus (Vite-SSR gegen renderToStaticMarkup, normalisiert), einzeln und in einer Accordion-Gruppe, und beide rendern ohne window.
import { createElement, Fragment, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let render: Render;
let Host: unknown;
const R: Record<string, (p: Record<string, unknown>, ...c: unknown[]) => ReactElement> = {};
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];

// Erzeugte ids (Svelte `$props.id()`, React `useId()`) unterscheiden sich im Wortlaut: auf einen Platzhalter normalisieren
const normalize = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/dss-cf-[^"\s]*?(?=-(?:trigger|panel)")/g, 'dss-cf-ID')
    .replace(/ (hidden|inert)=""/g, ' $1')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .trim();

type Comp = 'Table' | 'ScheduleTable' | 'ScheduleGrid' | 'LeagueCard';
type Cfg = { comp: Comp; props?: Record<string, unknown>; open?: boolean; inItem?: { id: string; title: string; open?: boolean } };
type Root = { group?: Record<string, unknown>; items: Cfg[]; wrap?: { level?: number; by?: number }[] };

const games = [
  { id: 'g1', state: 'finished', time: '19:00', heim: { name: 'Team A', score: 72 }, gast: { name: 'Team B', score: 65 } },
  { id: 'g2', state: 'scheduled', time: '20:30', heim: { name: 'Team C' }, gast: { name: 'Team D' } },
];
const columns = [{ id: 'h1', label: 'Halle 1' }, { id: 'h2', label: 'Halle 2' }];
const rasterGames = [{ id: 'r1', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: 'Team A' }, gast: { name: 'Team B' } }];
const teams = [
  { rank: 1, name: 'Lindenberg Hawks', played: 11, points: 20, zone: 'up' },
  { rank: 2, name: 'BG Seeberg', played: 11, points: 18, own: true },
  { rank: 3, name: 'TSV Elbach', played: 11, points: 14 },
];
const tableColumns = [{ key: 'name', label: 'Spieler' }, { key: 'pts', label: 'PTS', align: 'right' }];

function reactFrame(c: Cfg, key: number): ReactElement {
  const common = { collapsible: true, ...(c.props ?? {}), defaultOpen: c.open ?? false };
  let el: ReactElement;
  if (c.comp === 'Table') el = createElement(R.Table, { ...common, columns: tableColumns, key }, createElement('tr', null, createElement('td', null, 'J. Tanner'), createElement('td', { className: 'num' }, '22')));
  else if (c.comp === 'ScheduleTable') el = createElement(R.ScheduleTable, { ...common, games, key });
  else if (c.comp === 'ScheduleGrid') el = createElement(R.ScheduleGrid, { ...common, games: rasterGames, columns, key });
  else el = createElement(R.LeagueCard, { ...common, teams, key });
  if (!c.inItem) return el;
  return createElement(R.AccordionItem, { id: c.inItem.id, title: c.inItem.title, defaultOpen: c.inItem.open ?? false, key }, el);
}
function reactTree(cfg: Root): ReactElement {
  const frames = cfg.items.map(reactFrame);
  let tree: ReactElement = cfg.group ? createElement(R.Accordion, { ...cfg.group }, ...frames) : createElement(Fragment, null, ...frames);
  for (const w of [...(cfg.wrap ?? [])].reverse()) tree = createElement(R.HeadingLevel, w, tree);
  return tree;
}

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
  Host = await load('tests/helpers/FramesSsr.svelte');
  R.Table = (await load('react/Table.tsx', 'Table')) as never;
  R.ScheduleTable = (await load('react/ScheduleTable.tsx', 'ScheduleTable')) as never;
  R.ScheduleGrid = (await load('react/ScheduleGrid.tsx', 'ScheduleGrid')) as never;
  R.LeagueCard = (await load('react/LeagueCard.tsx', 'LeagueCard')) as never;
  R.Accordion = (await load('react/Accordion.tsx', 'Accordion')) as never;
  R.AccordionItem = (await load('react/Accordion.tsx', 'AccordionItem')) as never;
  R.HeadingLevel = (await load('react/HeadingLevel.tsx', 'HeadingLevel')) as never;
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const one = (comp: Comp, props: Record<string, unknown> = {}, open = false): Root => ({ items: [{ comp, props, open }] });
const COMPS: Comp[] = ['Table', 'ScheduleTable', 'ScheduleGrid', 'LeagueCard'];

const CASES: [string, Root][] = [];
for (const comp of COMPS) {
  CASES.push([`${comp}: zu, mit id`, one(comp, { id: 'x1', title: 'Titel A' })]);
  CASES.push([`${comp}: offen, mit id`, one(comp, { id: 'x1', title: 'Titel A' }, true)]);
  CASES.push([`${comp}: zu, ohne id`, one(comp, { title: 'Titel A' })]);
  CASES.push([`${comp}: offen, ohne id`, one(comp, { title: 'Titel A' }, true)]);
  CASES.push([`${comp}: titleAs h2`, one(comp, { id: 'x1', title: 'Titel A', titleAs: 'h2' }, true)]);
  CASES.push([`${comp}: ohne title bleibt unverändert`, one(comp, { id: 'x1' }, true)]);
  CASES.push([`${comp}: in einer Gruppe, zwei Rahmen`, { group: { syncHash: false }, items: [{ comp, props: { id: 'a1', title: 'Titel A' }, open: true }, { comp, props: { id: 'a2', title: 'Titel B' } }] }]);
  CASES.push([`${comp}: Gruppe mit titleAs h4`, { group: { syncHash: false, titleAs: 'h4' }, items: [{ comp, props: { id: 'a1', title: 'Titel A' } }] }]);
  CASES.push([`${comp}: in HeadingLevel 2`, { ...one(comp, { id: 'x1', title: 'Titel A' }, true), wrap: [{ level: 2 }] }]);
  CASES.push([`${comp}: im Bereich eines AccordionItem (einzeln)`, { group: { syncHash: false }, items: [{ comp, props: { id: 'in1', title: 'Innen' }, open: true, inItem: { id: 'ai', title: 'Außen', open: true } }] }]);
}
const withMeta: [string, Root][] = [
  ['Table: meta', one('Table', { id: 'm', title: 'Titel A', meta: 'Stand · 4. Viertel' }, true)],
  ['Table: meta und live', one('Table', { id: 'm', title: 'Titel A', meta: 'Stand', live: true })],
  ['Table: nur live', one('Table', { id: 'm', title: 'Titel A', live: true }, true)],
  ['Table: dunkel', one('Table', { id: 'm', title: 'Titel A', dark: true, meta: 'Q4' }, true)],
  ['ScheduleTable: meta', one('ScheduleTable', { id: 'm', title: 'Titel A', meta: '2 Spiele', layout: 'versus' }, true)],
  ['ScheduleGrid: meta', one('ScheduleGrid', { id: 'm', title: 'Titel A', meta: 'Samstag' })],
  ['LeagueCard: Untertitel, live', one('LeagueCard', { id: 'm', title: 'Titel A', teamCount: 12, played: 66, total: 132, live: 2 }, true)],
  ['LeagueCard: live ohne Zahl', one('LeagueCard', { id: 'm', title: 'Titel A', live: true })],
  ['LeagueCard: compact', one('LeagueCard', { id: 'm', title: 'Titel A', size: 'compact', live: 1 }, true)],
  ['gemischt: Table und LeagueCard in einer Gruppe', { group: { syncHash: false, nav: true, expandAll: true }, items: [{ comp: 'Table', props: { id: 'a', title: 'Titel A', meta: 'x' } }, { comp: 'LeagueCard', props: { id: 'b', title: 'Titel B' }, open: true }, { comp: 'ScheduleGrid', props: { title: 'Titel C' } }] }],
  ['Accordion exclusive mit Rahmen', { group: { syncHash: false, exclusive: true, variant: 'flat' }, items: [{ comp: 'Table', props: { id: 'a', title: 'Titel A' }, open: true }, { comp: 'ScheduleTable', props: { id: 'b', title: 'Titel B' } }] }],
];
CASES.push(...withMeta);

describe('SSR-Parität einklappbarer Rahmen: Svelte gleich React', () => {
  it('hat mindestens 30 Fälle', () => expect(CASES.length).toBeGreaterThanOrEqual(30));
  it.each(CASES)('%s', (_name, cfg) => {
    const s = normalize(render(Host, { props: { cfg } }).body);
    const r = normalize(renderToStaticMarkup(reactTree(cfg)));
    expect(s).toBe(r);
  });
});

describe('Server-Markup einklappbarer Rahmen', () => {
  const html = (cfg: Root) => render(Host, { props: { cfg } }).body;
  it('zu: aria-expanded false, Bereich hidden und inert, keine Region am Bereich', () => {
    const out = html(one('Table', { id: 'x', title: 'T' }));
    expect(out).toContain('aria-expanded="false"');
    expect(out).toMatch(/<div class="dss-acc-panel" id="x-panel" hidden(="")? inert/);
    expect(out).not.toMatch(/dss-acc-panel"[^>]*role="region"/);
    expect(out).toContain('aria-controls="x-panel"');
  });
  it('ohne id: kein id-Attribut am Rahmen, aber verbundene ids von Kopf und Bereich', () => {
    const out = html(one('LeagueCard', { title: 'T' }));
    expect(out).not.toMatch(/<div class="dss-league[^"]*" id=/);
    const trigger = out.match(/id="(dss-cf-[^"]+)-trigger"/)![1];
    expect(out).toContain(`aria-controls="${trigger}-panel"`);
  });
  it('ohne title: kein einklappbarer Rahmen', () => {
    const out = html(one('Table', { id: 'x' }, true));
    expect(out).not.toContain('is-collapsible');
    expect(out).not.toContain('dss-acc-trigger');
  });
  it('ohne collapsible: unverändert (kein Accordion-Markup)', () => {
    const out = render(Host, { props: { cfg: { items: [{ comp: 'Table', props: { title: 'T', collapsible: false } }] } } }).body;
    expect(out).not.toContain('dss-acc-');
  });
});

describe('ohne collapsible: kein Accordion-Markup, Svelte gleich React', () => {
  it.each(COMPS)('%s', (comp) => {
    for (const props of [{ title: 'Titel A', collapsible: false }, { title: 'Titel A', collapsible: false, id: 'x', meta: 'Info' }, { id: 'x', collapsible: false }]) {
      const cfg = one(comp, props, true);
      const s = render(Host, { props: { cfg } }).body;
      const r = renderToStaticMarkup(reactTree(cfg));
      expect(s).not.toMatch(/--acc|is-collapsible|dss-acc/);
      expect(r).not.toMatch(/--acc|is-collapsible|dss-acc/);
      expect(normalize(s)).toBe(normalize(r));
    }
  });
});
