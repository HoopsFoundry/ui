// @vitest-environment node
// Vanilla-`renderMatchCard` und `renderTeamCard` erzeugen dasselbe Markup wie Svelte und React (normalisiert).
import { describe, expect, it } from 'vitest';
import { renderMatchCard } from '../js/render/match-card.js';
import { renderTeamCard } from '../js/render/team-card.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
const HEIM = { name: 'Lindenberg Hawks', short: 'Hawks', logo: '/logos/hawks.svg' };
const GAST = { name: 'TSV Nordhain 1920', short: 'Nordhain' };

describe('MatchCard: renderMatchCard gegen Svelte und React', () => {
  const cases: Record<string, Record<string, unknown>> = {
    minimal: { heim: { name: 'A' }, gast: { name: 'B' } },
    'angesetzt voll': { state: 'scheduled', league: 'Oberliga', matchday: 'Spieltag 5', date: 'Sa, 17.10.2026', time: '17:30', venue: 'Sporthalle Nordhain', heim: HEIM, gast: GAST },
    'angesetzt nur Datum': { date: 'So, 18.10.', heim: HEIM, gast: GAST },
    live: { state: 'live', league: 'Oberliga', period: 3, clock: '04:12', heim: { ...HEIM, score: 41 }, gast: { ...GAST, score: 39 } },
    'live Achtel Verlängerung': { state: 'live', period: 10, periods: 8, heim: { ...HEIM, score: 41 }, gast: { ...GAST, score: 39 } },
    'live Alias quarter': { state: 'live', quarter: 'Halbzeit', heim: { name: 'A', score: 1 }, gast: { name: 'B', score: 2 } },
    'beendet Heim gewinnt': { state: 'finished', heim: { ...HEIM, score: 80 }, gast: { ...GAST, score: 70 } },
    'beendet Gast gewinnt': { state: 'finished', heim: { ...HEIM, score: 60 }, gast: { ...GAST, score: 70 } },
    'beendet unentschieden': { state: 'finished', heim: { name: 'A', score: 5 }, gast: { name: 'B', score: 5 } },
    'ungültige Zahlen': { state: 'finished', heim: { name: 'A' }, gast: { name: 'B', score: 3 }, period: 0 },
    'Logos und Kurznamen': { heim: HEIM, gast: GAST, logos: true, names: 'short' },
    'Link': { heim: HEIM, gast: GAST, href: '/spiele/123' },
    'lange Texte': { league: 'Liga '.repeat(40), venue: 'Halle '.repeat(60), heim: { name: 'Name '.repeat(40) }, gast: { name: 'Name '.repeat(40) } },
    'Sonderzeichen': { league: '<i>"x"</i> & y', heim: { name: "A & 'B'" }, gast: { name: '<C>' } },
    className: { heim: HEIM, gast: GAST, className: 'meine' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const v = normalize(renderMatchCard(props as never));
    const r = await p.react('MatchCard', props);
    expect(v).toBe(r);
    if (props.className === undefined) expect(await p.svelte('MatchCard', props)).toBe(r);
  });
  it('ungültige Zahlen entfallen (die Komponenten zeigen „NaN“)', () => {
    const html = renderMatchCard({ state: 'finished', heim: { name: 'A', score: Number.NaN }, gast: { name: 'B', score: Infinity } } as never);
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
    expect(html).not.toContain('dss-match-score');
  });
  it('Button wie bei onClick', async () => {
    const v = normalize(renderMatchCard({ heim: HEIM, gast: GAST } as never, { button: true }));
    expect(v).toBe(await p.react('MatchCard', { heim: HEIM, gast: GAST, onClick: () => {} }));
  });
});

describe('TeamCard: renderTeamCard gegen Svelte und React', () => {
  const FULL = {
    name: 'TSV Nordhain 1920', short: 'Nordhain', logo: '/logos/nordhain.svg', league: 'Oberliga Nordhain Männer', leagueHref: '/ligen/oberliga', season: '2026/27',
    record: { w: 8, l: 3 }, rank: 3, rankOf: 12, points: 16,
    next: { opponent: { name: 'BG Seeberg', short: 'Seeberg', logo: '/l.svg' }, at: 'heim', date: 'Sa, 17.10.', time: '17:30', venue: 'Sporthalle Nordhain' },
    last: { opponent: { name: 'Elbach Eagles' }, at: 'gast', date: 'Sa, 10.10.', ownScore: 92, opponentScore: 79 },
    squad: { players: 14, staff: 3 }, stats: { twoPtPct: 48.5, threePtPct: 33, trb: 38.2, to: 12 },
  };
  const cases: Record<string, Record<string, unknown>> = {
    minimal: { name: 'TSV Nordhain 1920' },
    voll: FULL,
    kompakt: { ...FULL, size: 'compact' },
    'kompakt minimal': { name: 'A', size: 'compact' },
    'Bilanz mit Unentschieden': { name: 'A', record: { w: 1, d: 2, l: 0 }, rank: 1 },
    'ungültige Zahlen': { name: 'A', record: { w: -1, l: 2.5 }, rank: 0, points: Number.NaN, squad: { players: -3 }, stats: { trb: Number.NaN }, last: { opponent: { name: 'X' }, ownScore: 1 } },
    'lange Texte': { name: 'Ein sehr langer Mannschaftsname '.repeat(8), league: 'Liga '.repeat(40), season: 'Saison '.repeat(30) },
    titleAs: { ...FULL, titleAs: 'h2' },
    'Link': { ...FULL, href: '/teams/nordhain' },
    'names und logos': { ...FULL, names: 'short', logos: true },
    'Forfait': { name: 'A', last: { opponent: { name: 'B' }, ownScore: 0, opponentScore: 20, outcome: 'S' } },
    'nur nächstes Spiel': { name: 'A', next: { opponent: { name: 'B' }, date: 'Sa' } },
    'nur Statistik': { name: 'A', stats: { to: 3 } },
    'Sonderzeichen': { name: '<b>A</b> & "B"', league: "it's", leagueHref: '/l?a=1&b=2' },
    className: { name: 'A', className: 'meine' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const v = normalize(renderTeamCard(props as never));
    const r = await p.react('TeamCard', props);
    expect(v).toBe(r);
    if (props.className === undefined) expect(await p.svelte('TeamCard', props)).toBe(r);
  });
  it('Button wie bei onClick', async () => {
    const v = normalize(renderTeamCard({ ...FULL, leagueHref: '/x' } as never, { button: true }));
    expect(v).toBe(await p.react('TeamCard', { ...FULL, leagueHref: '/x', onClick: () => {} }));
  });
});
