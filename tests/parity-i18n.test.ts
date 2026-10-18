// @vitest-environment node
// Parität je Sprache (I3): Für jede Komponente und jede Sprache (en, de) ergeben Svelte-SSR, React-SSR und (soweit es eine gibt) die Vanilla-`render*`-Funktion
// denselben sichtbaren Text und dieselben aria-label (bei Komponenten mit Render-Funktion sogar dasselbe normalisierte Markup). Dazu: kein Rohschlüssel in der
// Ausgabe und kein Text der jeweils anderen Sprache (Wörter des Katalogs, abzüglich der Daten der Eingaben). Fehler nennen Komponente und Sprache.
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import en from '../js/i18n/en.js';
import de from '../js/i18n/de.js';
import { setLocale } from '../js/i18n/index.js';
import { renderEmptyState } from '../js/render/empty-state.js';
import { renderFormChips, renderStats } from '../js/render/stats.js';
import { renderTable } from '../js/render/table.js';
import { renderLeagueCard } from '../js/render/league-card.js';
import { renderScheduleGrid, renderScheduleTable } from '../js/render/schedule.js';
import { renderMatchCard } from '../js/render/match-card.js';
import { renderTeamCard } from '../js/render/team-card.js';
import { renderVenueCard } from '../js/render/venue-card.js';
import { renderMap } from '../js/map-vanilla.js';
import { normalize, useParity } from './helpers/render-parity';

const p = useParity();
type Props = Record<string, unknown>;
type Vanilla = (props: any, options?: any) => string;
interface Case {
  name: string;
  /** Name der Svelte-Datei und des React-Exports (`MapView` in `Map.tsx`). */
  component: string;
  props: Props;
  /** Abweichende Eigenschaften für React (zum Beispiel `heightCm`). */
  react?: Props;
  vanilla?: Vanilla;
  vanillaOptions?: Props;
  /** Nur Text und aria-label vergleichen (die Fassungen unterscheiden sich im Markup einer leeren Tabelle: Vanilla gibt ein leeres `tbody` aus). */
  speechOnly?: boolean;
}

const team = (name: string, extra: Props = {}) => ({ name, short: name.slice(0, 3), ...extra });
const game = (id: string, state: string, extra: Props = {}) => ({
  id, state, at: 'heim', ownScore: 80, nr: '#1', section: 'Day 1', date: 'Sat', time: '17:30', venue: 'Arena', field: 'Court 1', column: 'a', note: 'Note',
  league: { name: 'League' }, heim: team('Alpha', { score: 3 }), gast: team('Beta', { score: 2 }), ...extra,
});
const GAMES = [game('a', 'finished'), game('b', 'live'), game('c', 'bye'), game('d', 'cancelled'), game('e', 'postponed'), game('f', 'finished', { opponent: team('Gamma', { score: 70 }), provisional: true }), game('g', 'live', { opponent: team('Gamma', { score: 70 }) })];
const OPP = GAMES.map((g) => ({ ...g, heim: undefined, gast: undefined, opponent: team('Gamma', { score: 70 }) }));
const LEAGUE = {
  title: 'League', teams: [{ rank: 1, name: 'One', short: 'O', own: true, played: 3, won: 2, lost: 1, diff: 5, points: 4, zone: 'up', form: ['S', 'N', 'U'] }, { rank: 2, name: 'Two', zone: 'down', diff: -2 }, { rank: 3, name: 'Three', zone: 'playoff', diff: 0 }],
  teamCount: 12, played: 15, total: 132, columns: ['won', 'lost', 'diff', 'form'], href: '/league', live: 2,
};
const TEAM = {
  name: 'Alpha', short: 'Alp', league: 'League', season: '2026', record: { w: 8, d: 1, l: 3 }, rank: 3, rankOf: 12, points: 16,
  next: { opponent: team('Beta'), at: 'heim', date: 'Sat', time: '17:30', venue: 'Arena' }, last: { opponent: team('Gamma'), at: 'gast', date: 'Sat', ownScore: 92, opponentScore: 79 },
  squad: { players: 14, staff: 3 }, stats: { twoPtPct: 48.5, threePtPct: 33, trb: 38.2, to: 12 },
};
const HALLS = [{ id: 'a', lat: 49.3, lng: 7.9, label: 'Hall A', own: true, number: 1 }, { id: 's', lat: 49.31, lng: 7.91, label: 'Office', kind: 'seat' }, { id: 'c', lat: 49.32, lng: 7.92, label: 'Hall C', href: '/c' }];

const CASES: Case[] = [
  { name: 'StatGrid', component: 'StatGrid', props: { items: [{ label: 'Wins', value: 12.5 }, { label: 'Rate', value: null }] }, vanilla: renderStats },
  { name: 'FormChips Punkte', component: 'FormChips', props: { form: ['S', 'N', 'U', 'S'] }, vanilla: renderFormChips },
  { name: 'FormChips Buchstaben', component: 'FormChips', props: { form: ['S', 'N', 'U'], variant: 'letters' }, vanilla: renderFormChips },
  { name: 'EmptyState', component: 'EmptyState', props: { tone: 'action', title: 'Title', body: 'Body', cta: 'Go' }, vanilla: renderEmptyState },
  { name: 'Table', component: 'Table', props: { title: 'Standings', meta: 'Meta', live: true, columns: [{ key: 'a', label: 'A' }] }, vanilla: renderTable, speechOnly: true },
  { name: 'Table ohne Titel', component: 'Table', props: { live: true, columns: [{ key: 'a', label: 'A' }] }, vanilla: renderTable, speechOnly: true },
  { name: 'LeagueCard', component: 'LeagueCard', props: { ...LEAGUE }, vanilla: renderLeagueCard },
  { name: 'LeagueCard einklappbar', component: 'LeagueCard', props: { ...LEAGUE, collapsible: true, open: true, id: 'liga' }, vanilla: renderLeagueCard },
  { name: 'LeagueCard kompakt', component: 'LeagueCard', props: { ...LEAGUE, size: 'compact', live: true }, vanilla: renderLeagueCard },
  { name: 'ScheduleTable Gegenüberstellung', component: 'ScheduleTable', props: { games: GAMES, title: 'Schedule' }, vanilla: renderScheduleTable },
  { name: 'ScheduleTable Perspektive', component: 'ScheduleTable', props: { games: OPP, layout: 'opponent' }, vanilla: renderScheduleTable },
  { name: 'ScheduleTable Turnier', component: 'ScheduleTable', props: { games: GAMES, layout: 'columns', title: 'Cup' }, vanilla: renderScheduleTable },
  {
    name: 'ScheduleGrid', component: 'ScheduleGrid', vanilla: renderScheduleGrid,
    props: { games: [game('a', 'finished'), game('b', 'live', { time: '19:00', column: 'a' }), game('c', 'bye', { time: '' }), game('d', 'live', { time: '21:00', heim: team('Alpha'), gast: team('Beta') })], columns: [{ id: 'a', label: 'Hall A' }, { id: 'b', label: 'Hall B' }], breaks: [{ time: '18:00', label: 'Break' }], slots: ['17:30', '19:00', '21:00'] },
  },
  { name: 'MatchCard angesetzt', component: 'MatchCard', props: { state: 'scheduled', date: 'Sat', time: '17:30', heim: team('Alpha'), gast: team('Beta') }, vanilla: renderMatchCard },
  { name: 'MatchCard live', component: 'MatchCard', props: { state: 'live', period: 3, clock: '04:12', heim: team('Alpha', { score: 41 }), gast: team('Beta', { score: 39 }) }, vanilla: renderMatchCard },
  { name: 'MatchCard beendet', component: 'MatchCard', props: { state: 'finished', heim: team('Alpha', { score: 80 }), gast: team('Beta', { score: 70 }) }, vanilla: renderMatchCard },
  { name: 'TeamCard', component: 'TeamCard', props: { ...TEAM }, vanilla: renderTeamCard },
  { name: 'TeamCard kompakt', component: 'TeamCard', props: { name: 'Alpha', size: 'compact', record: { w: 8, l: 3 }, rank: 3 }, vanilla: renderTeamCard },
  { name: 'VenueCard', component: 'VenueCard', props: { name: 'Arena', address: { street: 'Road 1', zip: '12345', city: 'Town' }, lat: 49.3, lng: 7.9, contact: { name: 'Jo', phone: '030 123456', email: 'a@example.org' }, games: GAMES.slice(0, 5), href: '/arena' }, vanilla: renderVenueCard, vanillaOptions: { mapActive: true } },
  { name: 'Map', component: 'MapView', props: { label: 'Map of halls', markers: HALLS, appLinks: ['osm', 'geo', 'route'] }, vanilla: renderMap },
  // ohne Render-Funktion: Svelte gegen React
  { name: 'Tabs', component: 'Tabs', props: { items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] } },
  { name: 'AppNav', component: 'AppNav', props: { items: [{ id: 'a', label: 'A', href: '/a' }, { id: 'g', label: 'G', items: [{ id: 'b', label: 'B', href: '/b' }] }] } },
  { name: 'BottomNav', component: 'BottomNav', props: { items: [{ id: 'a', label: 'A', href: '/a' }, { id: 'b', label: 'B' }] } },
  { name: 'Breadcrumbs', component: 'Breadcrumbs', props: { items: [{ label: 'A', href: '/a' }, { label: 'B' }] } },
  { name: 'Stepper horizontal', component: 'Stepper', props: { steps: [{ id: 'a', label: 'One', state: 'done' }, { id: 'b', label: 'Two', state: 'current' }, { id: 'c', label: 'Three', state: 'pending' }] } },
  { name: 'Stepper vertikal', component: 'Stepper', props: { variant: 'vertical', steps: [{ id: 'a', label: 'One', state: 'done' }, { id: 'b', label: 'Two', state: 'pending' }] } },
  { name: 'Stepper kompakt', component: 'Stepper', props: { variant: 'compact', steps: [{ id: 'a', label: 'One', state: 'current' }] } },
  { name: 'Skeleton', component: 'Skeleton', props: { variant: 'line', count: 2 } },
  { name: 'PlayByPlay', component: 'PlayByPlay', props: { meta: 'Meta', events: [{ id: 1, time: '9:12', period: 3, team: 'heim', title: 'Layup', score: { heim: 41, gast: 39 } }, { id: 2, time: '8:00', period: 5, team: 'gast', title: 'Foul' }] } },
  { name: 'PlayerCard Karte', component: 'PlayerCard', props: { jersey: 7, name: 'Pat', position: 'PG', captain: true, age: '24', height_cm: '188' }, react: { jersey: 7, name: 'Pat', position: 'PG', captain: true, age: '24', heightCm: '188' } },
  { name: 'PlayerCard Zeile', component: 'PlayerCard', props: { size: 'compact', jersey: 7, name: 'Pat', position: 'PG', captain: true } },
  { name: 'TopBar live', component: 'TopBar', props: { context: 'live', matchLabel: 'Alpha vs Beta', score: '41 : 39', clock: '04:12' } },
  { name: 'Accordion', component: 'Accordion', props: { expandAll: true, nav: true } },
];

/** Sichtbarer Text und alle aria-label in einer Zeichenkette (zum Vergleich der Fassungen). */
const speech = (html: string) => {
  const text = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const labels = [...html.matchAll(/(?:aria-label|title|alt|lang|data-letter)="([^"]*)"/g)].map((m) => m[1]);
  return `${text} || ${labels.join(' | ')}`;
};

// Wörter der Kataloge: Teile zwischen den Platzhaltern
const pieces = (catalog: Record<string, unknown>) =>
  new Set(Object.values(catalog).flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v as Record<string, string>))).flatMap((t) => t.split(/\{[^}]*\}/)).map((x) => x.replace(/^[\s,:·–—.-]+|[\s,:·–—.-]+$/g, '')).filter((x) => x.length >= 4));
const inputs = JSON.stringify(CASES.map((c) => [c.props, c.react]));
const enPieces = pieces(en);
const dePieces = pieces(de);
const onlyDe = [...dePieces].filter((x) => !enPieces.has(x) && !inputs.includes(x) && !/\d/.test(x));
const onlyEn = [...enPieces].filter((x) => !dePieces.has(x) && !inputs.includes(x) && !/\d/.test(x));
const RAW_KEY = /\b(?:common|accordion|backtop|theme|pagenav|modal|tabs|appnav|bottomnav|breadcrumbs|stepper|skeleton|map|venue|schedule|league|match|periods|playbyplay|team|player|stats|table)\.[a-z][a-z.-]+\b/;

/** Alle Abweichungen eines Falls in einer Sprache (leer = die drei Fassungen stimmen überein und enthalten nur Text der Sprache). */
function problems(c: Case, locale: string, out: { s: string; r: string; v?: string }) {
  const { s, r, v } = out;
  const where = `${c.name} (${locale})`;
  const list: string[] = [];
  if (speech(r) !== speech(s)) list.push(`${where}: React weicht von Svelte ab`);
  if (v !== undefined) {
    if (speech(v) !== speech(s)) list.push(`${where}: Vanilla weicht von Svelte ab`);
    // bei Komponenten mit Render-Funktion ist auch das Markup gleich
    if (!c.speechOnly && v !== s) list.push(`${where}: Markup Vanilla weicht von Svelte ab`);
    if (!c.speechOnly && r !== s) list.push(`${where}: Markup React weicht von Svelte ab`);
  }
  for (const [name, html] of [['Svelte', s], ['React', r], ['Vanilla', v]] as const) {
    if (html === undefined) continue;
    const said = speech(html);
    if (RAW_KEY.test(said)) list.push(`${where}: Rohschlüssel in ${name}`);
    const found = (locale === 'en' ? onlyDe : onlyEn).filter((word) => new RegExp(`(^|[^\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^\\p{L}])`, 'u').test(said));
    if (found.length) list.push(`${where}: Wörter der anderen Sprache in ${name}: ${found.join(', ')}`);
  }
  return list;
}

describe.each([['en'], ['de']])('Parität je Sprache: %s', (locale) => {
  it.each(CASES.map((c) => [c.name, c] as const))('%s: Svelte, React und Vanilla ergeben denselben Text und dieselben aria-label, ohne Rohschlüssel und ohne Text der anderen Sprache', async (_name, c) => {
    setLocale(locale);
    p.locale(locale);
    const s = await p.svelte(c.component === 'MapView' ? 'Map' : c.component, c.props);
    const r = await p.react(c.component, c.react ?? c.props, undefined, c.component === 'MapView' ? 'Map' : c.component);
    const v = c.vanilla ? normalize(c.vanilla(c.props, c.vanillaOptions)) : undefined;
    expect(problems(c, locale, { s, r, v })).toEqual([]);
  });
});

// Vorrang: Eigenschaft des Bausteins (`label` …) > `texts` des Bausteins > `setTexts` > Katalog; Svelte, React und Vanilla (`options.texts`) stimmen überein
describe('texts-Eigenschaft der Bausteine (Vorrang vor setTexts, gleiche Ausgabe in drei Fassungen)', () => {
  const OVERRIDES: [string, string, Record<string, string>][] = [
    ['StatGrid', 'Rate', { 'stats.empty': 'n/a (eigen)' }],
    ['FormChips Punkte', 'Form', { 'league.form': 'Serie (eigen): {entries}' }],
    ['Table ohne Titel', 'Table', { 'table.label': 'Tabelle (eigen)', 'common.live': 'Jetzt (eigen)' }],
    ['LeagueCard', 'League', { 'league.link': 'Alles (eigen)', 'league.col.team': 'Verein (eigen)', 'common.live': 'Jetzt (eigen)' }],
    ['ScheduleTable Gegenüberstellung', 'Schedule', { 'schedule.versus': 'gegen (eigen)', 'schedule.col.time': 'Uhr (eigen)', 'schedule.bye': '{team} pausiert (eigen)' }],
    ['ScheduleGrid', 'Hall A', { 'schedule.col.time': 'Uhr (eigen)', 'schedule.time-open': 'offen (eigen)' }],
    ['MatchCard beendet', 'Alpha', { 'match.final': 'Aus (eigen)' }],
    ['TeamCard', 'Alpha', { 'team.next': 'Demnächst (eigen)', 'team.season-stats': 'Saison (eigen)' }],
    ['VenueCard', 'Arena', { 'venue.contact': 'Ansprechpartner (eigen)', 'venue.map-link': 'Mehr Karte (eigen)' }],
    ['Map', 'Map of halls', { 'map.skip': 'Weiter (eigen)', 'map.load': 'Los (eigen)' }],
  ];
  it.each(OVERRIDES)('%s: texts gilt, schlägt setTexts und stimmt in Svelte, React und Vanilla überein', async (name, _anchor, texts) => {
    const c = CASES.find((x) => x.name === name)!;
    setLocale('en');
    const global = Object.fromEntries(Object.keys(texts).map((key) => [key, 'GLOBAL']));
    p.locale('en', global);
    const props = { ...c.props, texts };
    const svelteName = c.component === 'MapView' ? 'Map' : c.component;
    const s = await p.svelte(svelteName, props);
    const r = await p.react(c.component, { ...(c.react ?? c.props), texts }, undefined, svelteName);
    const v = normalize(c.vanilla!(c.props, { ...c.vanillaOptions, texts }));
    expect(s).not.toContain('GLOBAL');
    expect(speech(s)).toContain('(eigen)');
    expect(speech(r)).toBe(speech(s));
    expect(speech(v)).toBe(speech(s));
    p.locale('en');
  });
});

describe('Parität je Sprache: Aufbau der Prüfung', () => {
  it('die Wortlisten der anderen Sprache sind nicht leer (sonst prüft der Test nichts)', () => {
    expect(onlyDe.length).toBeGreaterThan(40);
    expect(onlyEn.length).toBeGreaterThan(40);
  });
  it('jede Komponente der Rendermatrix steht im Manifest', async () => {
    const manifest = JSON.parse((await import('node:fs')).readFileSync(new URL('../parity.manifest.json', import.meta.url), 'utf8')) as Record<string, unknown>;
    for (const c of CASES) expect(Object.keys(manifest), c.name).toContain(c.component === 'MapView' ? 'Map' : c.component);
  });
});

// ── Mutationen: ein Text nur in einer Fassung geändert (Kopie des Quelltexts in einem Arbeitsordner mit eigenem Server) ──
const root = process.cwd();
const made: string[] = [];
afterAll(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
function mutantTree(edits: [string, string, string][]) {
  const dir = mkdtempSync(join(tmpdir(), 'hoops-parity-'));
  made.push(dir);
  for (const top of ['js', 'svelte', 'react', 'icons']) cpSync(join(root, top), join(dir, top), { recursive: true, filter: (src) => !/\.test\./.test(src) });
  mkdirSync(join(dir, 'tests'), { recursive: true });
  cpSync(join(root, 'tests/setup-i18n.ts'), join(dir, 'tests/setup-i18n.ts'));
  for (const file of ['svelte.config.js', 'package.json']) cpSync(join(root, file), join(dir, file));
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
  for (const [file, from, to] of edits) {
    const text = readFileSync(join(dir, file), 'utf8');
    expect(text.includes(from), `Textstelle nicht gefunden in ${file}: ${from}`).toBe(true);
    writeFileSync(join(dir, file), text.replace(from, () => to));
  }
  return dir + '/';
}

const MUTATIONS: { name: string; caseName: string; edits: [string, string, string][]; expected: RegExp }[] = [
  { name: 'ein Text nur in React geändert (Endstand)', caseName: 'MatchCard beendet', edits: [['react/MatchCard.tsx', "i18n.t('match.final')", "'Final'"]], expected: /React weicht von Svelte ab/ },
  { name: 'ein Text nur in Svelte geändert (Spaltenkopf)', caseName: 'LeagueCard', edits: [['svelte/LeagueCard.svelte', "i18n.t('league.col.team')", "'Squad'"]], expected: /React weicht von Svelte ab/ },
  { name: 'ein Text nur in der Render-Funktion geändert (Gegen)', caseName: 'ScheduleTable Gegenüberstellung', edits: [['js/render/schedule.js', "tr('schedule.versus', undefined, options)", "'vs'"]], expected: /Vanilla weicht von Svelte ab/ },
  { name: 'fester deutscher Text in der englischen Ausgabe (Svelte)', caseName: 'Skeleton', edits: [['svelte/Skeleton.svelte', "i18n.t('skeleton.loading')", "'Lädt …'"]], expected: /Wörter der anderen Sprache in Svelte/ },
  { name: 'Rohschlüssel in React (falscher Schlüssel)', caseName: 'Breadcrumbs', edits: [['react/Breadcrumbs.tsx', "i18n.t('breadcrumbs.label')", "i18n.t('breadcrumbs.name')"]], expected: /Rohschlüssel in React/ },
];

describe.each(MUTATIONS)('Mutation: $name', ({ caseName, edits, expected }) => {
  const dir = mutantTree(edits);
  const m = useParity(dir);
  it('die Prüfung schlägt an', async () => {
    const c = CASES.find((x) => x.name === caseName)!;
    m.locale('en');
    const s = await m.svelte(c.component === 'MapView' ? 'Map' : c.component, c.props);
    const r = await m.react(c.component, c.react ?? c.props, undefined, c.component === 'MapView' ? 'Map' : c.component);
    const vanillaFile = edits.find(([file]) => file.startsWith('js/'));
    const modFile: Record<string, [string, string]> = { ScheduleTable: ['js/render/schedule.js', 'renderScheduleTable'] };
    const v = vanillaFile ? await m.vanilla(modFile[c.component][0], modFile[c.component][1], c.props, c.vanillaOptions) : c.vanilla ? normalize(c.vanilla(c.props, c.vanillaOptions)) : undefined;
    setLocale('en');
    const found = problems(c, 'en', { s, r, v });
    expect(found.join('\n')).toMatch(expected);
  });
});
