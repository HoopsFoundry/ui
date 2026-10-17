// @vitest-environment node
// Svelte und React erzeugen für Namen und Logos dasselbe Markup (Server-Rendering beider Fassungen, normalisiert).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];

// Whitespace an Tag-Grenzen, Kommentare und Klassenreihenfolge sind kein Unterschied
const normalize = (html: string) =>
  html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ ?> ?/g, '>')
    .replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, value: string) => `class="${value.trim().split(/\s+/).sort().join(' ')}"`)
    .replace(/<(img|br)([^>]*?)\/?>/g, '<$1$2>')
    .replace(/colSpan=/g, 'colspan=')
    .trim();

const team = (name: string, short?: string, extra: Record<string, unknown> = {}) => ({ name, short, ...extra });
const versus = [
  { id: 'a', state: 'finished', date: 'Sa', time: '18:00', provisional: true, league: { name: 'L', href: '/l' },
    heim: team('TSV Nordhain 1920', 'TSV N.', { href: '/t', score: 80, own: true, logo: '/logos/a.svg' }), gast: team('Lindenberg Hawks', 'Hawks', { score: 70 }) },
  { id: 'b', state: 'scheduled', heim: team('BG Seeberg'), gast: team('Erster A', 'E1', { placeholder: true }) },
  { id: 'c', state: 'live', heim: team('X', 'X'), gast: team('Y Team', 'Y', { href: '/y' }) },
  { id: 'd', state: 'scheduled', heim: team('Erster FC Waldbach', 'Waldbach'), gast: team('Zweiter FC Hollbach') },
  { id: 'e', state: 'bye', time: '09:30', heim: team('Lindenberg Hawks', 'Hawks', { logo: '/logos/h.svg' }) },
  { id: 'f', state: 'bye', time: '10:00', note: 'Spielfrei am Sonntag' },
];
const opponent = [
  { id: 'o1', state: 'finished', date: 'Sa', time: '17', at: 'heim', ownScore: 6, opponent: team('Dukes Eschental', 'Dukes', { href: '/d', score: 5, logo: '/logos/d.svg' }) },
  { id: 'o2', state: 'scheduled', at: 'gast', opponent: team('Bergheimer Club', 'BC') },
];
const columns = [{ id: 'f1', label: 'F1' }, { id: 'f2', label: 'F2' }];
const gridGames = versus.map((game, index) => ({ ...game, time: game.time ?? '09:00', column: columns[index % 2].id }));

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js' })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
  await vite.ssrLoadModule('/tests/setup-i18n.ts'); // Standardsprache der Tests (Deutsch) auch im Modulgraphen dieses Servers
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const variants: Record<string, unknown>[] = [];
for (const names of [undefined, 'full', 'short']) {
  for (const logos of [undefined, true, false]) {
    variants.push({ ...(names ? { names } : {}), ...(logos === undefined ? {} : { logos }) });
  }
}

describe('SSR-Parität Svelte ↔ React: Namen und Logos', () => {
  it.each(variants)('ScheduleTable (versus, columns, opponent) %j', async (options) => {
    const Svelte = await load('svelte/ScheduleTable.svelte');
    const React = await load('react/ScheduleTable.tsx', 'ScheduleTable');
    for (const [layout, games] of [['versus', versus], ['columns', versus], [undefined, opponent]] as const) {
      const props = { games, ...(layout ? { layout } : {}), ...options };
      expect(normalize(render(Svelte, { props }).body), `${layout} ${JSON.stringify(options)}`).toBe(
        normalize(renderToStaticMarkup(createElement(React as never, props))),
      );
    }
  });

  it.each(variants)('ScheduleGrid %j', async (options) => {
    const Svelte = await load('svelte/ScheduleGrid.svelte');
    const React = await load('react/ScheduleGrid.tsx', 'ScheduleGrid');
    const props = { games: gridGames, columns, ...options };
    expect(normalize(render(Svelte, { props }).body)).toBe(normalize(renderToStaticMarkup(createElement(React as never, props))));
  });

  it.each(variants)('MatchCard %j', async (options) => {
    const Svelte = await load('svelte/MatchCard.svelte');
    const React = await load('react/MatchCard.tsx', 'MatchCard');
    for (const state of ['scheduled', 'live', 'finished']) {
      const props = {
        state, league: 'L', date: 'Sa', time: '18', venue: 'H', quarter: 'Q3', clock: '4:00',
        heim: { name: 'TSV Nordhain 1920', short: 'TSV N.', score: 3, logo: '/l.svg' }, gast: { name: 'Hawks Club', score: 2 }, ...options,
      };
      expect(normalize(render(Svelte, { props }).body), state).toBe(normalize(renderToStaticMarkup(createElement(React as never, props))));
    }
  });
});
