// @vitest-environment node
// Ligencard: Svelte und React erzeugen dasselbe Markup (Server-Rendering beider Fassungen, normalisiert).
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
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

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js' })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const bodies = async (props: Record<string, unknown>) => {
  const Svelte = await load('svelte/LeagueCard.svelte');
  const React = await load('react/LeagueCard.tsx', 'LeagueCard');
  const { className, ...rest } = props;
  const sveltePart = render(Svelte, { props: className === undefined ? rest : { ...rest, class: className } }).body;
  return [normalize(sveltePart), normalize(renderToStaticMarkup(createElement(React as never, props)))] as const;
};
const same = async (props: Record<string, unknown>) => {
  const [a, b] = await bodies(props);
  expect(a).toBe(b);
  return a;
};

const NAMES: [string, string | undefined, string | undefined][] = [
  ['TSV Nordhain 1920', 'Nordhain', '/logos/nordhain.svg'], ['Lindenberg Hawks', 'Hawks', '/logos/hawks.svg'], ['BG Seeberg', 'Seeberg', undefined], ['SV Kiefernau', undefined, undefined],
  ['Elbach Eagles', 'Eagles', undefined], ['TuS Waldmark', undefined, undefined], ['BC Sonnental', undefined, undefined], ['Hafenstadt Giants', 'Giants', undefined],
  ['SG Moorberg', undefined, undefined], ['Basket Auenland', undefined, undefined],
];
const FORMS = [['S', 'S', 'N', 'S', 'U'], ['N', 'N'], [], ['S'], ['S', 'S', 'S', 'S', 'S', 'N'], ['x', 'S']];
const teams = (own?: number, extra: Record<string, unknown> = {}) =>
  NAMES.map(([name, short, logo], i) => ({
    rank: i + 1, name, short, logo, played: 10, points: 30 - i * 2, won: 10 - i, lost: i, diff: 30 - i * 7, form: FORMS[i % FORMS.length], href: i % 3 === 0 ? `/t/${i}` : undefined,
    ...(own === i + 1 ? { own: true } : {}), ...extra,
  }));
const ZONES = ['up', undefined, 'playoff', 'down', undefined, undefined, undefined, undefined, undefined, 'down'];
const withZones = () => teams(3).map((t, i) => ({ ...t, zone: ZONES[i] }));
const BASE = { title: 'Oberliga Nordhain Männer' };

describe('LeagueCard: Svelte und React erzeugen dasselbe Markup', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: { ...BASE, teams: [{ rank: 1, name: 'A', played: 1, points: 2 }] },
    'nur title und teams': { ...BASE, teams: teams() },
    'leere Liste': { ...BASE, teams: [] },
    Untertitel: { ...BASE, teams: teams(), teamCount: 12, played: 15, total: 132 },
    'ungültige Zahlen': { ...BASE, teams: teams(), teamCount: -1, played: 1.5, total: Number.NaN },
    'alle Spalten': { ...BASE, teams: teams(), columns: ['won', 'lost', 'diff', 'form'] },
    'Spalten Reihenfolge egal': { ...BASE, teams: teams(), columns: ['form', 'diff'] },
    'nur S': { ...BASE, teams: teams(), columns: ['won'] },
    'nur Form': { ...BASE, teams: teams(), columns: ['form'] },
    'Zonen mit Legende': { ...BASE, teams: withZones(), limit: 10 },
    'Zonen außerhalb des Fensters': { ...BASE, teams: teams().map((t, i) => ({ ...t, zone: i >= 3 ? 'down' : undefined })), limit: 2 },
    'Zonen und eigene': { ...BASE, teams: withZones() },
    Logos: { ...BASE, teams: teams(), logos: true },
    Kurznamen: { ...BASE, teams: teams(), names: 'short' },
    'Logos und Kurznamen': { ...BASE, teams: teams(4), logos: true, names: 'short', columns: ['diff'] },
    'Ausschnitt Platz 1': { ...BASE, teams: teams(1) },
    'Ausschnitt Mitte': { ...BASE, teams: teams(6), teamCount: 12 },
    'Ausschnitt letzter Platz': { ...BASE, teams: teams(10) },
    'limit 5': { ...BASE, teams: teams(), limit: 5 },
    'limit ungültig': { ...BASE, teams: teams(), limit: 0 },
    'titleAs h2': { ...BASE, teams: teams(), titleAs: 'h2' },
    'titleAs h6': { ...BASE, teams: teams(), titleAs: 'h6' },
    'titleAs ungültig': { ...BASE, teams: teams(), titleAs: 'h1' },
    'Live Zahl': { ...BASE, teams: teams(), live: 2 },
    'Live eins': { ...BASE, teams: teams(), live: 1 },
    'Live true': { ...BASE, teams: teams(), live: true },
    'Live 0': { ...BASE, teams: teams(), live: 0 },
    compact: { ...BASE, teams: teams(), size: 'compact', played: 3, total: 9 },
    'compact alles': { ...BASE, teams: withZones(), size: 'compact', live: 3, href: '/x', columns: ['won', 'form'], logos: true },
    Link: { ...BASE, teams: teams(), href: '/liga/tabelle' },
    'Link mit Text': { ...BASE, teams: teams(), href: '/liga/tabelle', linkLabel: 'Alle Spiele' },
    class: { ...BASE, teams: teams(), className: 'meine-klasse' },
    'alles zusammen': { ...BASE, teams: withZones(), teamCount: 12, played: 15, total: 132, columns: ['won', 'lost', 'diff', 'form'], limit: 3, href: '/t', live: 2, logos: true, names: 'short', titleAs: 'h4' },
    'fehlende Werte': { ...BASE, teams: [{ rank: 1, name: 'A' }, { rank: 2, name: 'B', played: 3 }], columns: ['won', 'diff', 'form'] },
    'Differenz 0 und negativ': { ...BASE, teams: [{ rank: 1, name: 'A', played: 1, points: 2, diff: 0 }, { rank: 2, name: 'B', played: 1, points: 2, diff: -4 }], columns: ['diff'] },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    await same(props);
  });

  it('die Fälle sind aussagekräftig: Zonen-Legende, Live-Text und eigene Zeile stehen im Markup', async () => {
    const html = await same(cases['Zonen und eigene']);
    expect(html).toContain('hoops-league-legend');
    expect(html).toContain('eigene Mannschaft');
    expect(await same(cases['Live Zahl'])).toContain('2 Spiele laufen');
    expect(await same(cases['Zonen außerhalb des Fensters'])).not.toContain('hoops-league-legend');
  });
});
