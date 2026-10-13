// @vitest-environment node
// Vanilla-`renderScheduleTable` und `renderScheduleGrid` erzeugen dasselbe Markup wie Svelte und React (normalisiert).
import { describe, expect, it } from 'vitest';
import { renderScheduleGrid, renderScheduleTable } from '../js/render/schedule.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();

const T = {
  hawks: { name: 'Lindenberg Hawks', short: 'Hawks', href: '/teams/hawks', logo: '/logos/hawks.svg' },
  nord: { name: 'TSV Nordhain 1920', short: 'Nordhain', own: true },
  see: { name: 'BG Seeberg' },
  ph: { name: 'Sieger Halbfinale 1', placeholder: true },
  elb: { name: 'Elbach Eagles', short: 'Eagles', href: '/teams/eagles' },
};
const VERSUS = [
  { id: 'a', state: 'finished', date: 'Sa, 17.10.2026', time: '17:30', venue: 'Sporthalle Nordhain', heim: { ...T.hawks, score: 78 }, gast: { ...T.nord, score: 71 }, league: { name: 'Oberliga', href: '/ligen/ober' } },
  { id: 'b', state: 'live', time: '19:00', heim: { ...T.see, score: 12 }, gast: { ...T.elb, score: 9 }, provisional: true },
  { id: 'c', state: 'scheduled', date: 'So, 18.10.2026', time: '11:00', heim: T.nord, gast: T.ph, note: 'Hinweis <1>' },
  { id: 'd', state: 'cancelled', time: '13:00', heim: T.see, gast: T.hawks },
  { id: 'e', state: 'postponed', time: '14:00', heim: T.elb, gast: T.see, section: 'Spieltag 6' },
  { id: 'f', state: 'bye', time: '15:00', heim: T.see },
  { id: 'g', state: 'bye', note: 'Spielfrei wegen Feiertag' },
];
const OPP = [
  { id: 'o1', state: 'finished', date: 'Sa, 10.10.2026', time: '17:00', at: 'heim', ownScore: 80, opponent: { ...T.hawks, score: 70 }, venue: 'Halle A' },
  { id: 'o2', state: 'finished', time: '17:00', at: 'gast', ownScore: 60, opponent: { ...T.see, score: 66 }, league: { name: 'Pokal' } },
  { id: 'o3', state: 'finished', time: '17:00', at: 'gast', ownScore: 60, opponent: { ...T.elb, score: 60 }, outcome: 'S', provisional: true },
  { id: 'o4', state: 'scheduled', time: '17:00', at: 'heim', opponent: T.elb },
  { id: 'o5', state: 'live', time: '17:00', at: 'heim', ownScore: 10, opponent: { ...T.see, score: 12 } },
];
const COLUMNS = [
  { id: 'a', state: 'finished', nr: '#1', time: '09:00', field: 'Feld 1', venue: 'Halle A', column: 'h1', heim: { ...T.hawks, score: 10 }, gast: { ...T.see, score: 8 } },
  { id: 'b', state: 'scheduled', nr: '#2', time: '09:00', field: 'Feld 2', column: 'h2', heim: T.nord, gast: T.elb },
  { id: 'c', state: 'scheduled', nr: '#3', time: '10:30', column: 'h1', heim: T.ph, gast: T.hawks, section: 'Finale' },
  { id: 'd', state: 'bye', time: '10:30', heim: T.see },
];

type Case = Record<string, unknown>;
describe('ScheduleTable: renderScheduleTable gegen Svelte und React', () => {
  const cases: Record<string, Case> = {
    'Gegenüberstellung': { games: VERSUS },
    'Gegenüberstellung mit Titel': { games: VERSUS, title: 'Spielplan', meta: 'Stand 12.10.' },
    'Perspektive': { games: OPP, title: 'Spiele der Hawks' },
    'Perspektive ohne Logos': { games: OPP, logos: false },
    'Perspektive mit Kurznamen': { games: OPP, names: 'short' },
    'Turnier-Spalten': { games: COLUMNS, layout: 'columns', caption: 'Turnier' },
    'Logos in Gegenüberstellung': { games: VERSUS, logos: true, names: 'short' },
    leer: { games: [] },
    'Dichte compact': { games: VERSUS, density: 'compact' },
    'Dichte touch, versus': { games: VERSUS, density: 'touch', layout: 'versus' },
    titleAs: { games: VERSUS.slice(0, 1), title: 'Spielplan', titleAs: 'h2' },
    'einklappbar offen': { games: VERSUS, title: 'Spielplan', collapsible: true, open: true, id: 'plan', meta: 'Stand' },
    'einklappbar zu ohne id': { games: VERSUS.slice(0, 2), title: 'Spielplan', collapsible: true },
    'ungültige Zahlen': { games: [{ id: 'x', state: 'finished', heim: { name: 'A', score: Number.NaN }, gast: { name: 'B', score: Infinity } }, { id: 'y', state: 'finished', heim: { name: 'A', score: 3 }, gast: { name: 'B', score: 2 } }] },
    'lange Texte': { games: [{ id: 'l', state: 'scheduled', time: '17:30', heim: { name: 'Ein sehr langer Mannschaftsname '.repeat(6) }, gast: { name: 'Noch ein Name '.repeat(8) }, note: 'Notiz '.repeat(100) }] },
    className: { games: VERSUS.slice(0, 1), className: 'meine' },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const v = normalize(renderScheduleTable(props as never));
    const [r, s] = [await p.react('ScheduleTable', props), await p.svelte('ScheduleTable', props)];
    expect(v).toBe(r);
    expect(r).toBe(s);
  });
  it('time und notice als Text je Spiel', async () => {
    const time = (g: { time?: string }) => `um ${g.time}`;
    const notice = (g: { id: string }) => `Konflikt ${g.id} <x>`;
    const v = normalize(renderScheduleTable({ games: VERSUS.slice(0, 3) } as never, { time, notice }));
    const react = await p.react('ScheduleTable', { games: VERSUS.slice(0, 3), renderTime: time, renderNotice: notice });
    expect(v).toBe(react);
    expect(v).toContain('Konflikt a');
    expect(v).not.toContain('<x>');
  });
});

describe('ScheduleGrid: renderScheduleGrid gegen Svelte und React', () => {
  const columns = [{ id: 'h1', label: 'Halle A' }, { id: 'h2', label: 'Halle B' }];
  const games = [
    { id: 'a', state: 'finished', nr: '#1', time: '09:00', column: 'h1', heim: { ...T.hawks, score: 10 }, gast: { ...T.see, score: 8 } },
    { id: 'b', state: 'live', time: '09:00', column: 'h2', heim: { ...T.nord, score: 2 }, gast: { ...T.elb, score: 1 }, section: 'Gruppe A' },
    { id: 'c', state: 'scheduled', nr: '#3', time: '10:30', column: 'h1', heim: T.ph, gast: T.hawks, note: 'Finale' },
    { id: 'd', state: 'cancelled', time: '10:30', column: 'h2', heim: T.see, gast: T.elb },
    { id: 'e', state: 'bye', time: '12:00', heim: T.see },
    { id: 'f', state: 'bye', note: 'Spielfrei' },
    { id: 'g', state: 'live', time: '12:00', column: 'h1', heim: T.hawks, gast: T.see },
  ];
  const cases: Record<string, Case> = {
    minimal: { games: games.slice(0, 1), columns },
    voll: { games, columns, breaks: [{ time: '10:00', label: 'Pause' }, { time: '12:00', label: 'Mittag' }], title: 'Turnier', meta: 'Samstag' },
    'mit Slots': { games, columns, slots: ['09:00', '10:30', '12:00', '13:00'] },
    'emptyLabel': { games: games.slice(0, 1), columns, emptyLabel: '–', slots: ['09:00', '10:00'] },
    'Logos und Kurznamen': { games, columns, logos: true, names: 'short' },
    leer: { games: [], columns },
    'Dichte compact': { games, columns, density: 'compact' },
    titleAs: { games: games.slice(0, 2), columns, title: 'Raster', titleAs: 'h4' },
    'einklappbar': { games, columns, title: 'Raster', collapsible: true, open: true, id: 'raster' },
    'einklappbar zu': { games: games.slice(0, 2), columns, title: 'Raster', collapsible: true },
    'Sonderzeichen': { games: [{ id: 'x', state: 'scheduled', time: '09:00', column: 'h1', heim: { name: '<b>A</b>' }, gast: { name: '"B" & C' } }], columns: [{ id: 'h1', label: 'A & B "C"' }] },
  };
  it.each(Object.entries(cases))('%s', async (_name, props) => {
    const v = normalize(renderScheduleGrid(props as never));
    const [r, s] = [await p.react('ScheduleGrid', props), await p.svelte('ScheduleGrid', props)];
    expect(v).toBe(r);
    expect(r).toBe(s);
  });
});
