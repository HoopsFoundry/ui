// @vitest-environment node
// Hallenkarte: Svelte und React erzeugen dasselbe Markup (Server-Rendering beider Fassungen, normalisiert), ohne window und document.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
type Render = (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let render: Render;
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];

import { normalize } from './helpers/venue-normalize';

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: Render }).render;
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const bodies = async (props: Record<string, unknown>) => {
  const Svelte = await load('svelte/VenueCard.svelte');
  const React = await load('react/VenueCard.tsx', 'VenueCard');
  const { className, ...rest } = props;
  const sveltePart = render(Svelte, { props: className === undefined ? rest : { ...rest, class: className } }).body;
  return [normalize(sveltePart), normalize(renderToStaticMarkup(createElement(React as never, props)))] as const;
};
const same = async (props: Record<string, unknown>) => {
  const [a, b] = await bodies(props);
  expect(a).toBe(b);
  return a;
};

const ADDRESS = { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' };
const CONTACT = { name: 'Jonas Weide', phone: '030 23125 100', email: 'hallenwart@example.org' };
const TEAMS: [string, string | undefined, string | undefined][] = [
  ['TSV Nordhain 1920', 'Nordhain', '/logos/nordhain.svg'], ['Lindenberg Hawks', 'Hawks', undefined], ['BG Seeberg', undefined, undefined], ['SV Kiefernau & Co', 'Kiefernau', '/logos/k.svg'],
  ['Elbach Eagles', 'Eagles', undefined], ['TuS Waldmark', undefined, undefined],
];
const GAMES = [0, 1, 2, 3, 4, 5].map((i) => ({
  id: `g${i}`, state: (['scheduled', 'live', 'cancelled', 'postponed', 'finished', 'scheduled'] as const)[i], date: i % 2 ? undefined : `Sa, ${17 + i}.10.2026`, time: i % 3 ? '17:30' : undefined,
  league: i % 2 ? undefined : { name: 'Oberliga Nordhain Männer' }, field: i === 2 ? 'Feld 2' : undefined,
  heim: { name: TEAMS[i][0], short: TEAMS[i][1], logo: TEAMS[i][2] }, gast: i === 5 ? undefined : { name: TEAMS[(i + 1) % 6][0], short: TEAMS[(i + 1) % 6][1], logo: TEAMS[(i + 1) % 6][2] },
}));
const BASE = { name: 'Sporthalle Nordhain' };
const FULL = { ...BASE, address: ADDRESS, lat: 49.3, lng: 7.9, info: 'Zwei Spielfelder & Zugang über den Hof.', contact: CONTACT, games: GAMES, href: '/hallen/nordhain' };

describe('VenueCard: Svelte und React erzeugen dasselbe Markup', () => {
  const cases: Record<string, Record<string, unknown>> = {
    'nur name': BASE,
    'name mit Sonderzeichen': { name: 'Halle "Süd" & <West>' },
    'Adresse': { ...BASE, address: ADDRESS },
    'Adresse nur Ort': { ...BASE, address: { zip: '12345', city: 'Nordhain' } },
    'Adresse leer': { ...BASE, address: { street: ' ' } },
    Info: { ...BASE, info: 'Zwei Felder.' },
    'Info leer': { ...BASE, info: '  ' },
    Kontakt: { ...BASE, contact: CONTACT },
    'Kontakt ungültig': { ...BASE, contact: { name: 'A', phone: 'nur vormittags', email: 'a (at) b.de' } },
    'Kontakt nur E-Mail': { ...BASE, contact: { name: '', email: 'a@example.org' } },
    'Kontakt leer': { ...BASE, contact: { name: ' ' } },
    Karte: { ...BASE, lat: 49.3, lng: 7.9 },
    'Karte auto': { ...BASE, lat: 49.3, lng: 7.9, load: 'auto', tileUrl: '/tiles/{z}/{x}/{y}.png' },
    'Karte ungültige Kachel-Adresse': { ...BASE, lat: 49.3, lng: 7.9, tileUrl: 'http://example.org/{z}/{x}/{y}.png' },
    'Karte mit Hinweis und Höhe': { ...BASE, lat: 49.3, lng: 7.9, privacyNote: 'Über unseren Server.', mapHeight: 300 },
    'Karte ungültige Koordinaten': { ...BASE, lat: 95, lng: 7.9 },
    'Karte nur lat': { ...BASE, lat: 49.3 },
    'Karte Pole': { ...BASE, lat: -90, lng: 180 },
    Spiele: { ...BASE, games: GAMES },
    'Spiele limit 5 mit Logos': { ...BASE, games: GAMES, limit: 5, logos: true },
    'Spiele Kurznamen': { ...BASE, games: GAMES, limit: 5, names: 'short' },
    'Spiele Logos und Kurznamen': { ...BASE, games: GAMES, limit: 3, logos: true, names: 'short' },
    'Spiele limit ungültig': { ...BASE, games: GAMES, limit: 0 },
    'Spiele Beschriftung': { ...BASE, games: GAMES, gamesLabel: 'Belegung' },
    'Spiele leer': { ...BASE, games: [] },
    'Spiele nur beendete': { ...BASE, games: [GAMES[4]] },
    Link: { ...BASE, href: '/hallen/nordhain' },
    'Link mit Text': { ...BASE, href: '/h', linkLabel: 'Hallenplan' },
    'Link unsicher': { ...BASE, href: 'javascript:alert(1)' },
    compact: { ...FULL, size: 'compact' },
    'compact ohne Karte': { ...BASE, address: ADDRESS, size: 'compact' },
    'titleAs h2': { ...BASE, titleAs: 'h2' },
    'titleAs h6': { ...BASE, titleAs: 'h6' },
    'titleAs ungültig': { ...BASE, titleAs: 'h1' },
    class: { ...BASE, className: 'meine-klasse' },
    'alles zusammen': { ...FULL, logos: true, names: 'short', limit: 4, titleAs: 'h4', load: 'auto', gamesLabel: 'Belegung', linkLabel: 'Hallenplan', mapHeight: 280 },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    await same(props);
  });

  it('die Fälle sind aussagekräftig: Karte, Kontaktlinks, Spiele und Zustände stehen im Markup', async () => {
    const html = await same(cases['alles zusammen']);
    for (const needle of ['role="region"', 'aria-label="Karte: Sporthalle Nordhain"', 'href="tel:03023125100"', 'href="mailto:hallenwart@example.org"', '<address', 'Abgesagt', 'dss-venue-maplinks', 'aria-label="Belegung"']) {
      expect(html, needle).toContain(needle);
    }
    expect(await same(cases['nur name'])).not.toContain('dss-map');
    expect(await same(cases['Kontakt ungültig'])).not.toContain('href="tel:');
  });

  it('rendern ohne window und document', async () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    await same(FULL);
  });
});
