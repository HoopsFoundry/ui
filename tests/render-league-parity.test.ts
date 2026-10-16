// @vitest-environment node
// Vanilla-`renderLeagueCard` erzeugt dasselbe Markup wie Svelte und React (normalisiert).
import { describe, expect, it } from 'vitest';
import { renderLeagueCard } from '../js/render/league-card.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
const TEAMS = [
  { rank: 1, name: 'Lindenberg Hawks', short: 'Hawks', played: 11, won: 10, lost: 1, diff: 85, points: 20, zone: 'up', form: ['S', 'S', 'S', 'N', 'S'], href: '/teams/hawks' },
  { rank: 2, name: 'BG Seeberg', played: 11, won: 9, lost: 2, diff: 40, points: 18, zone: 'up', form: ['S', 'U', 'S'] },
  { rank: 3, name: 'TSV Nordhain 1920', short: 'Nordhain', logo: '/logos/nordhain.svg', played: 11, won: 7, lost: 4, diff: 12.5, points: 14, own: true, form: ['N', 'S', 'S'] },
  { rank: 4, name: 'SV Kiefernau & Co', played: 10, won: 6, lost: 4, diff: 0, points: 12 },
  { rank: 5, name: 'Elbach Eagles', short: 'Eagles', played: 11, won: 5, lost: 6, diff: -8, points: 10, zone: 'playoff' },
  { rank: 6, name: 'TuS Waldmark', played: 11, won: 1, lost: 10, diff: -90, points: 2, zone: 'down', form: ['N', 'N'] },
];
const cases: Record<string, Record<string, unknown>> = {
  minimal: { title: 'Oberliga', teams: TEAMS.slice(0, 2) },
  'Standard mit eigener Mannschaft': { title: 'Oberliga Nordhain Männer', teams: TEAMS, teamCount: 12, played: 66, total: 132, href: '/ligen/oberliga', live: 2 },
  voll: { title: 'Oberliga Nordhain Männer', teams: TEAMS, teamCount: 6, played: 63, total: 66, columns: ['won', 'lost', 'diff', 'form'], limit: 4, href: '/ligen/oberliga', linkLabel: 'Alles ansehen', live: true, names: 'short', logos: true },
  kompakt: { title: 'Oberliga', teams: TEAMS, size: 'compact', columns: ['diff'], href: '/l' },
  leer: { title: 'Oberliga', teams: [] },
  'ungültige Zahlen': { title: 'Oberliga', teams: [{ rank: 0, name: 'A', played: Number.NaN, points: Infinity, diff: 'x', won: -1 }, { rank: 1.5, name: 'B', played: '3' }], teamCount: -4, played: 1.5, total: 'x', limit: 0, columns: ['won', 'diff'], live: -1 },
  'lange Texte': { title: 'Sehr lange Ligabezeichnung '.repeat(10), teams: [{ rank: 1, name: 'Ein sehr langer Mannschaftsname '.repeat(6), short: 'Kurz', played: 1, points: 2 }], linkLabel: 'Link '.repeat(40), href: '/x' },
  titleAs: { title: 'Oberliga', teams: TEAMS.slice(0, 3), titleAs: 'h2' },
  'einklappbar offen mit id': { title: 'Oberliga', teams: TEAMS, teamCount: 12, played: 66, total: 132, collapsible: true, open: true, id: 'oberliga', live: 3 },
  'einklappbar zu ohne id': { title: 'Oberliga', teams: TEAMS, collapsible: true },
  'einklappbar kompakt mit Live': { title: 'Oberliga', teams: TEAMS, collapsible: true, open: true, id: 'o', size: 'compact', live: true },
  'names und logos': { title: 'Oberliga', teams: TEAMS, names: 'short', logos: true, limit: 6 },
  'Sonderzeichen': { title: 'A "B" <C> & D', teams: [{ rank: 1, name: '<b>x</b>', href: '/a?b=1&c=2', points: 1 }], href: '/l?x=1&y="2"' },
  className: { title: 'T', teams: TEAMS.slice(0, 1), className: 'meine' },
};

describe('LeagueCard: renderLeagueCard gegen Svelte und React', () => {
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const v = normalize(renderLeagueCard(props as never));
    const r = await p.react('LeagueCard', props);
    expect(v).toBe(r);
    const { className, ...forSvelte } = props;
    if (className === undefined) expect(await p.svelte('LeagueCard', forSvelte)).toBe(r);
    else expect(await p.svelte('LeagueCard', props)).toBe(r);
  });
  it('Fensterregel: limit begrenzt, eigene Mannschaft mit Nachbarn', () => {
    const ranks = (html: string) => [...html.matchAll(/<td class="hoops-league-rank">(\d*)<\/td>/g)].map((m) => m[1]);
    const many = Array.from({ length: 12 }, (_v, i) => ({ rank: i + 1, name: `Team ${i + 1}`, own: i === 6 }));
    expect(ranks(renderLeagueCard({ title: 'T', teams: many }))).toEqual(['5', '6', '7', '8']);
    expect(ranks(renderLeagueCard({ title: 'T', teams: many.map((t) => ({ ...t, own: false })), limit: 2 }))).toEqual(['1', '2']);
  });
});
