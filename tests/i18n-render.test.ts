// Sprachen der Render-Funktionen und der gemeinsamen Logik (I2): Englisch ohne Rohschlüssel und ohne deutsche Wörter, zwei Sprachen im selben Prozess über
// options.locale (ohne den globalen Zustand zu ändern), options.texts, Vorrang bestehender Optionen, Mehrzahl, Koordinaten, lang-Attribut.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, getLocale, registerLocale, setLocale, setTexts } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import { renderEmptyState, renderFormChips, renderLeagueCard, renderMatchCard, renderScheduleGrid, renderScheduleTable, renderStats, renderTable, renderTeamCard, renderVenueCard } from '../js/render/index.js';
import { renderMap } from '../js/map-vanilla.js';
import { mapText, formatCoords } from '../js/map.js';
import { periodLabel, periodShort } from '../js/periods.js';
import { leagueSummary, windowLabel, diffText, cellNumber } from '../js/league.js';
import { squadText, recordInfo, formatNumber as formatNumberTeam } from '../js/team.js';
import { statItems } from '../js/stats.js';
import { summaryText } from '../js/accordion.js';

const hawks = { name: 'Lindenberg Hawks', short: 'Hawks', own: true };
const games = [
  { id: 'a', state: 'finished', date: 'Sa, 12.10.', time: '17:30', heim: { name: 'A', score: 80 }, gast: { name: 'B', score: 70 }, provisional: true },
  { id: 'b', state: 'live', time: '19:00', heim: { name: 'C', score: 10 }, gast: { name: 'D', score: 12 } },
  { id: 'c', state: 'cancelled', heim: { name: 'E' }, gast: { name: 'F' } },
  { id: 'd', state: 'bye', time: '20:00', heim: { name: 'G' } },
];
const perspective = [{ id: 'p', state: 'finished', time: '17:30', at: 'heim', opponent: { name: 'X', score: 70 }, ownScore: 80 }];
const league = { title: 'Liga', teams: [{ rank: 1, name: 'A', played: 3, won: 2, lost: 1, diff: 5.5, points: 4, form: ['S', 'N', 'U'], zone: 'up' }, { rank: 2, name: 'B', own: true, played: 3, points: 2, zone: 'down' }], teamCount: 12, played: 15, total: 132, columns: ['won', 'lost', 'diff', 'form'], live: 2, href: '/liga' };
const venue = { name: 'Halle Nord', lat: 49.4875, lng: 8.466, address: { street: 'Weg 1', city: 'Ort' }, contact: { name: 'Frau X', phone: '0123 456', email: 'x@example.org' }, games: [{ id: 'g', state: 'live', date: 'Sa', heim: { name: 'A' }, gast: { name: 'B' } }], href: '/halle' };

type Fn = (options?: Record<string, unknown>) => string;
const CASES: [string, Fn][] = [
  ['Table', (o) => renderTable({ rows: [['a']], live: true }, o)],
  ['Stats', (o) => renderStats({ items: [{ label: 'Punkte', value: 41.3 }, { label: 'Quote', value: null }] }, o)],
  ['FormChips', (o) => renderFormChips({ form: ['S', 'N', 'U'] }, o)],
  ['EmptyState', (o) => renderEmptyState({ title: 'Titel' }, o)],
  ['LeagueCard', (o) => renderLeagueCard(league, o)],
  ['ScheduleTable', (o) => renderScheduleTable({ games, title: 'Plan' }, o)],
  ['ScheduleTable Perspektive', (o) => renderScheduleTable({ games: perspective }, o)],
  ['ScheduleGrid', (o) => renderScheduleGrid({ games, columns: [{ id: 'x', label: 'Feld 1' }] }, o)],
  ['MatchCard', (o) => renderMatchCard({ state: 'live', heim: { name: 'A', score: 1 }, gast: { name: 'B', score: 2 }, period: 3, clock: '04:12' }, o)],
  ['TeamCard', (o) => renderTeamCard({ ...hawks, record: { w: 12, l: 1, d: 2 }, rank: 2, rankOf: 12, points: 38, next: { opponent: { name: 'X' }, at: 'heim', date: 'Sa' }, last: { opponent: { name: 'Y' }, at: 'gast', ownScore: 90, opponentScore: 80, date: '10.10.' }, squad: { players: 14, staff: 3 }, stats: { twoPtPct: 50.5, trb: 40 } }, o)],
  ['VenueCard', (o) => renderVenueCard(venue, o)],
  ['Map', (o) => renderMap({ label: 'Hallen', markers: [{ id: 'a', lat: 49.4875, lng: 8.466, label: 'Halle A', own: true }, { id: 's', lat: 49.5, lng: 8.5, label: 'Verein', kind: 'seat' }] }, o)],
];
// deutsche Wörter der eingebauten Texte, die im englischen Ergebnis nicht vorkommen dürfen
const GERMAN = ['Mannschaft', 'Spiele ', 'Tabelle', 'Legende', 'Heimspiel', 'Auswärts', 'Karte laden', 'Größere', 'Route planen', 'Vereinssitz', 'Kontakt', 'Telefon', 'Nächstes', 'Letztes', 'Platz', 'abgesagt', 'läuft', 'vorläufig', 'Freilos', 'Zeit offen', 'keine Angabe', 'Siege', 'Endstand', 'Viertel', 'gespielt', 'Eigener Ort', 'überspringen'];
const KEY = /\b(?:common|map|venue|schedule|league|match|periods|team|stats|table)\.[a-z][a-z-]*(?:\.[a-z-]+)?\b/;
const textOf = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const attrsOf = (html: string) => [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]).join(' ');

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
});
afterEach(() => {
  // Zustand des Vitest-Setups wiederherstellen (Deutsch)
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

describe.each(CASES)('%s', (_name, render) => {
  it('Englisch: kein Rohschlüssel, kein deutsches Wort aus der Liste', () => {
    const html = render();
    const visible = `${textOf(html)} ${attrsOf(html)}`;
    expect(visible).not.toMatch(KEY);
    for (const word of GERMAN) expect(visible, word).not.toContain(word);
  });
  it('zwei Sprachen im selben Prozess über options.locale; der globale Zustand bleibt', () => {
    const en = render({ locale: 'en' });
    const german = render({ locale: 'de' });
    expect(getLocale()).toBe('en');
    expect(render()).toBe(en);
    if (_name !== 'EmptyState') expect(german).not.toBe(en);
  });
  it('options.texts überschreibt einen Katalogtext, ohne den Zustand zu ändern', () => {
    const base = render();
    const html = render({ texts: Object.fromEntries(['league.legend', 'map.skip', 'stats.empty', 'common.live', 'team.next', 'venue.contact', 'schedule.versus', 'table.label', 'match.final', 'team.points', 'league.form', 'schedule.table-label', 'schedule.grid-label'].map((k) => [k, 'ÜBERSCHRIEBEN'])) });
    if (_name !== 'EmptyState') expect(html).toContain('ÜBERSCHRIEBEN');
    expect(render()).toBe(base);
  });
});

describe('Vorrang: bestehende Option > options.texts > globale Überschreibung > Katalog', () => {
  it('linkLabel der Ligencard', () => {
    setTexts({ 'league.link': 'global' });
    expect(renderLeagueCard(league)).toContain('global');
    expect(renderLeagueCard(league, { texts: { 'league.link': 'aus texts' } })).toContain('aus texts');
    expect(renderLeagueCard({ ...league, linkLabel: 'Eigener Link' }, { texts: { 'league.link': 'aus texts' } })).toContain('Eigener Link');
  });
  it('gamesLabel und linkLabel der Hallenkarte, emptyLabel des Zeitrasters', () => {
    expect(renderVenueCard({ ...venue, gamesLabel: 'Spiele hier', linkLabel: 'Zur Seite' }, { texts: { 'venue.games-label': 'x', 'venue.link-label': 'y' } })).toMatch(/Spiele hier[\s\S]*Zur Seite/);
    const grid = { games: [games[0]], columns: [{ id: 'x', label: 'F' }, { id: 'y', label: 'G' }] };
    expect(renderScheduleGrid({ ...grid, emptyLabel: 'leer' }, { texts: { 'schedule.grid-empty': 'x' } })).toContain('>leer<');
    expect(renderScheduleGrid(grid, { texts: { 'schedule.grid-empty': 'aus texts' } })).toContain('>aus texts<');
  });
  it('seatLabel und privacyNote der Karte; mapText hat Vorrang vor options.texts', () => {
    const props = { label: 'K', markers: [{ id: 's', lat: 49.4, lng: 8.4, label: 'V', kind: 'seat' }] };
    expect(renderMap({ ...props, seatLabel: 'Haus', privacyNote: 'Hinweis' }, { texts: { 'map.seat': 'x', 'map.privacy': 'y' } })).toMatch(/Haus[\s\S]*Hinweis|Hinweis[\s\S]*Haus/);
    expect(renderMap(props, { texts: { 'map.load': 'Laden!' } })).toContain('Laden!');
    mapText.load = 'Zuweisung';
    try {
      expect(renderMap(props, { texts: { 'map.load': 'Laden!' } })).toContain('Zuweisung');
    } finally {
      mapText.load = undefined as never;
    }
    expect(renderMap(props, { texts: { 'map.load': 'Laden!' } })).toContain('Laden!');
  });
});

describe('Mehrzahl, Platzhalter und Formate', () => {
  it('Zusammenfassung der Liga: Einzahl und Mehrzahl nach Sprache', () => {
    expect(leagueSummary({ teamCount: 1, played: 1, total: 1 }, { locale: 'en' })).toBe('1 team · 1 of 1 game played');
    expect(leagueSummary({ teamCount: 12, played: 15, total: 132 }, { locale: 'en' })).toBe('12 teams · 15 of 132 games played');
    expect(leagueSummary({ teamCount: 12, played: 15, total: 132 }, { locale: 'de' })).toBe('12 Teams · 15 von 132 Spielen gespielt');
    expect(squadText({ players: 1, staff: 1 }, { locale: 'en' })).toBe('1 player · 1 coach');
    expect(squadText({ players: 14, staff: 3 }, { locale: 'en' })).toBe('14 players · 3 coaches');
    expect(summaryText(2, 5, { locale: 'en' })).toBe('2 of 5 sections open');
    expect(recordInfo({ w: 1, l: 2 }, { locale: 'en' })?.aria).toBe('Record: 1 win, 2 losses');
  });
  it('Platzierungen, Abschnitte und Korbdifferenz', () => {
    expect(windowLabel([{ rank: 5 }, { rank: 8 }], 12, { locale: 'en' })).toBe('Ranks 5 to 8 of 12');
    expect(periodLabel(3, 4, { locale: 'en' })).toBe('Quarter 3');
    expect(periodShort(5, 4, { locale: 'en' })).toBe('OT');
    expect(periodLabel(2, 4, { locale: 'de' })).toBe('2. Viertel');
    expect(diffText(5.5, { locale: 'en' })).toBe('+5.5');
    expect(diffText(-5.5, { locale: 'de' })).toBe('−5,5');
    expect(statItems([{ label: 'A', value: 41.3 }], { locale: 'en' })[0].value).toBe('41.3');
    expect(statItems([{ label: 'A', value: 41.3 }], { locale: 'de' })[0].value).toBe('41,3');
  });
  it('Koordinaten: deutsch mit Komma und O, englisch mit Punkt und E', () => {
    expect(formatCoords(49.4875, 8.466, { locale: 'de' })).toBe('49,4875° N, 8,4660° O');
    expect(formatCoords(49.4875, 8.466, { locale: 'en' })).toBe('49.4875° N, 8.4660° E');
    expect(formatCoords(-33.9, -70.6, { locale: 'en' })).toBe('33.9000° S, 70.6000° W');
  });
});

describe('lang-Attribut', () => {
  it('in Node nur mit documentLang und nur bei abweichender Sprache', () => {
    const base = renderStats({ items: [{ label: 'A', value: 1 }] });
    expect(base).not.toContain('lang=');
    expect(renderStats({ items: [{ label: 'A', value: 1 }] }, { documentLang: 'en' })).not.toContain('lang=');
    expect(renderStats({ items: [{ label: 'A', value: 1 }] }, { documentLang: 'en-GB' })).not.toContain('lang=');
    expect(renderStats({ items: [{ label: 'A', value: 1 }] }, { locale: 'de', documentLang: 'en' })).toMatch(/^<dl lang="de" /);
    expect(renderStats({ items: [{ label: 'A', value: 1 }] }, { locale: 'de', documentLang: '' })).not.toContain('lang=');
  });
  it('im Browser (jsdom) gilt document.documentElement.lang, wenn es gesetzt ist', () => {
    document.documentElement.lang = 'de';
    try {
      expect(renderStats({ items: [{ label: 'A', value: 1 }] })).toMatch(/^<dl lang="en" /);
      expect(renderStats({ items: [{ label: 'A', value: 1 }] }, { locale: 'de' })).not.toContain('lang=');
    } finally {
      document.documentElement.removeAttribute('lang');
    }
    expect(renderStats({ items: [{ label: 'A', value: 1 }] })).not.toContain('lang=');
  });
});

describe('Randwerte der Zahlenschreibung wie vor I2 (String(n), nur das Dezimalzeichen wechselt)', () => {
  const VALUES: [number, string][] = [[-0, '0'], [1e-7, '1e-7'], [1e21, '1e+21'], [1.5e-10, '1.5e-10'], [5e-324, '5e-324'], [0.1 + 0.2, '0.30000000000000004'], [12.5, '12.5'], [1234.5, '1234.5']];
  it.each(VALUES)('%s', (value, plain) => {
    expect(cellNumber(value, { locale: 'en' })).toBe(plain);
    expect(cellNumber(value, { locale: 'de' })).toBe(plain.replace('.', ','));
    expect(statItems([{ label: 'A', value }], { locale: 'de' })[0].value).toBe(plain.replace('.', ','));
    expect(formatNumberTeam(value, { locale: 'de' })).toBe(plain.replace('.', ','));
    expect(diffText(value === 0 ? 0 : Math.abs(value), { locale: 'en' })).toBe(value === 0 ? '0' : `+${plain}`);
  });
});

describe('mapText und venueText: Überschreibung zurücknehmen', () => {
  it('delete und undefined nehmen die Zuweisung zurück, der Katalogtext gilt wieder', async () => {
    const { venueText } = await import('../js/venue.js');
    for (const table of [mapText as Record<string, string>, venueText as Record<string, string>]) {
      const name = table === mapText ? 'load' : 'contact';
      const catalog = table[name];
      table[name] = 'Eigen';
      expect(table[name]).toBe('Eigen');
      delete table[name];
      expect(table[name]).toBe(catalog);
      table[name] = 'Eigen';
      table[name] = undefined as never;
      expect(table[name]).toBe(catalog);
      expect(Object.keys(table)).toContain(name);
    }
  });
});
