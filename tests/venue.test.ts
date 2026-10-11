// Reine Funktionen der Hallenkarte (js/venue.js): Tabellentests mit Randfällen und die Regel-Aussagen aus tests/helpers/venue-rules.ts.
import { describe, expect, it } from 'vitest';
import * as venue from '../js/venue.js';
import { logicRules } from './helpers/venue-rules';

const { addressLines, contactInfo, gameMeta, gameState, gameWhen, gamesLimit, mailHref, telHref, venueGames, venueHref, venueMapLabel, venueMapLinks } = venue;
const game = (id: string, state = 'scheduled', extra: Record<string, unknown> = {}) => ({ id, state, heim: { name: `H${id}` }, gast: { name: `G${id}` }, ...extra }) as never;

describe('Regeln der Hallenkarte (js/venue.js)', () => {
  it.each(Object.entries(logicRules(venue as never)))('%s', (_name, ok) => {
    expect(ok).toBe(true);
  });
});

describe('telHref', () => {
  it.each<[unknown, string | undefined]>([
    ['030 23125 100', 'tel:03023125100'], ['+49 30 23125 100', 'tel:+493023125100'], ['+49 (0)30 / 23125-100', 'tel:+4903023125100'], ['030.23125.100', 'tel:03023125100'],
    ['112', 'tel:112'], ['  030 123  ', 'tel:030123'], ['12', undefined], ['', undefined], ['   ', undefined], ['abc', undefined], ['030 123 45x', undefined],
    ['tel:030123', undefined], ['030123;ext=1', undefined], ['0301234\n0301235', undefined], ['+', undefined], ['++49301234', undefined], ['0049+301234', undefined],
    [undefined, undefined], [null, undefined], [30123456, undefined], [`0${'1'.repeat(40)}`, undefined],
  ])('telHref(%j) = %j', (input, expected) => {
    expect(telHref(input as never)).toBe(expected);
  });
});

describe('mailHref', () => {
  it.each<[unknown, string | undefined]>([
    ['hallenwart@example.org', 'mailto:hallenwart@example.org'], ['a.b-c_d+e@sub.example.org', 'mailto:a.b-c_d+e@sub.example.org'], [' x@example.org ', 'mailto:x@example.org'],
    ['a@example', undefined], ['@example.org', undefined], ['a@.org', undefined], ['a b@example.org', undefined], ['a@example.org?subject=x', undefined], ['a@example.org#x', undefined],
    ['a@example.org,b@example.org', undefined], ['a@example.org;b@example.org', undefined], ['<a@example.org>', undefined], ['a (at) example.org', undefined],
    ['"a"@example.org', undefined], ['a@exämple.org', undefined], ['', undefined], [undefined, undefined], [5, undefined], [`${'a'.repeat(250)}@example.org`, undefined],
  ])('mailHref(%j) = %j', (input, expected) => {
    expect(mailHref(input as never)).toBe(expected);
  });
});

describe('contactInfo', () => {
  it('mit allen Angaben', () => {
    expect(contactInfo({ name: ' Jonas Weide ', phone: '030 23125 100', email: 'a@example.org' })).toEqual({
      name: 'Jonas Weide', phone: { text: '030 23125 100', href: 'tel:03023125100' }, email: { text: 'a@example.org', href: 'mailto:a@example.org' },
    });
  });
  it('ungültige Werte bleiben Text ohne Link', () => {
    expect(contactInfo({ name: 'A', phone: 'vormittags', email: 'a (at) b.de' })).toEqual({ name: 'A', phone: { text: 'vormittags', href: undefined }, email: { text: 'a (at) b.de', href: undefined } });
  });
  it('nur Telefon', () => {
    expect(contactInfo({ name: '', phone: '112' })).toEqual({ name: '', phone: { text: '112', href: 'tel:112' }, email: undefined });
  });
  it.each([[undefined], [null], [{}], [{ name: '  ' }], [{ name: '', phone: ' ', email: '' }], ['x'], [5]])('%j ergibt null', (input) => {
    expect(contactInfo(input as never)).toBeNull();
  });
});

describe('addressLines', () => {
  it.each<[unknown, string[]]>([
    [{ street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, ['Am Sportpark 4', '12345 Nordhain']],
    [{ street: 'Am Sportpark 4' }, ['Am Sportpark 4']], [{ zip: '12345' }, ['12345']], [{ city: 'Nordhain' }, ['Nordhain']], [{ zip: '12345', city: 'Nordhain' }, ['12345 Nordhain']],
    [{ street: '  A  ', zip: ' 1 ', city: ' B ' }, ['A', '1 B']], [{ street: 5, zip: null, city: undefined }, []], [{}, []], [undefined, []], [null, []], ['x', []], [[], []],
  ])('addressLines(%j)', (input, expected) => {
    expect(addressLines(input as never)).toEqual(expected);
  });
});

describe('venueGames und gamesLimit', () => {
  const list = ['1', '2', '3', '4', '5', '6'].map((id) => game(id));
  it.each<[unknown, number]>([[undefined, 2], [0, 2], [-3, 2], [1.5, 2], ['3', 2], [Number.NaN, 2], [1, 1], [2, 2], [5, 5], [6, 5], [99, 5], [Infinity, 2]])('gamesLimit(%j) = %i', (input, expected) => {
    expect(gamesLimit(input)).toBe(expected);
  });
  it('Reihenfolge der Eingabe bleibt, Standard zwei', () => {
    expect(venueGames(list).map((g) => g.id)).toEqual(['1', '2']);
    expect(venueGames(list, 4).map((g) => g.id)).toEqual(['1', '2', '3', '4']);
  });
  it('beendete, spielfreie und leere Spiele entfallen', () => {
    const mixed = [game('a', 'finished'), game('b', 'bye'), { id: 'c', state: 'scheduled' }, null, 'x', game('d'), game('e', 'live'), game('f', 'cancelled')] as never[];
    expect(venueGames(mixed, 5).map((g) => g.id)).toEqual(['d', 'e', 'f']);
  });
  it('nur Gast oder nur Heim genügt', () => {
    expect(venueGames([{ id: 'x', state: 'scheduled', heim: { name: 'A' } }, { id: 'y', state: 'scheduled', gast: { name: 'B' } }] as never)).toHaveLength(2);
  });
  it.each([[undefined], [null], ['x'], [{}], [5]])('%j ergibt eine leere Liste', (input) => {
    expect(venueGames(input as never)).toEqual([]);
  });
});

describe('gameKeys', () => {
  it.each<[unknown[], string[]]>([
    [[{ id: 'a' }, { id: 'b' }], ['a', 'b']],
    [[{ id: 'a' }, { id: 'a' }, { id: 'a' }], ['a', 'a-2', 'a-3']],
    [[{ id: 'a' }, { id: 'a' }, { id: 'a-2' }], ['a', 'a-3', 'a-2']],
    [[{}, { id: '' }, { id: null }], ['spiel-0', 'spiel-1', 'spiel-2']],
    [[{ id: 3 }, { id: '3' }], ['3', '3-2']],
    [[{ id: 'spiel-1' }, {}], ['spiel-1', 'spiel-1-2']],
    [[null, 'x'], ['spiel-0', 'spiel-1']],
  ])('gameKeys(%j) = %j', (input, expected) => {
    expect(venue.gameKeys(input as never)).toEqual(expected);
    expect(new Set(venue.gameKeys(input as never)).size).toBe(input.length);
  });
  it('keine Liste ergibt []', () => {
    expect(venue.gameKeys(undefined)).toEqual([]);
    expect(venue.gameKeys('x' as never)).toEqual([]);
  });
});

describe('Zeilen eines Spiels', () => {
  it('gameWhen: Datum und Uhrzeit, soweit vorhanden', () => {
    expect(gameWhen(game('1', 'scheduled', { date: 'Sa, 17.10.2026', time: '17:30' }))).toBe('Sa, 17.10.2026 · 17:30');
    expect(gameWhen(game('1', 'scheduled', { date: 'Sa, 17.10.2026' }))).toBe('Sa, 17.10.2026');
    expect(gameWhen(game('1', 'scheduled', { time: '17:30' }))).toBe('17:30');
    expect(gameWhen(game('1'))).toBe('');
    expect(gameWhen(undefined as never)).toBe('');
  });
  it('gameMeta: Liga und Feld', () => {
    expect(gameMeta(game('1', 'scheduled', { league: { name: 'Landesliga Ost' }, field: 'Feld 2' }))).toBe('Landesliga Ost · Feld 2');
    expect(gameMeta(game('1', 'scheduled', { field: 'Feld 2' }))).toBe('Feld 2');
    expect(gameMeta(game('1', 'scheduled', { league: { name: '  ' } }))).toBe('');
  });
  it('gameState: Text und Ton', () => {
    expect(gameState(game('1', 'live'))).toEqual({ text: 'Live', tone: 'ok' });
    expect(gameState(game('1', 'cancelled'))).toEqual({ text: 'Abgesagt', tone: 'err' });
    expect(gameState(game('1', 'postponed'))).toEqual({ text: 'Verschoben', tone: 'warn' });
    expect(gameState(game('1'))).toBeUndefined();
  });
});

describe('Karte und Seite', () => {
  it('venueMapLabel: je Halle ein Name', () => {
    expect(venueMapLabel('Sporthalle Nordhain')).toBe('Karte: Sporthalle Nordhain');
    expect(venueMapLabel('  Halle A ')).toBe('Karte: Halle A');
    expect(venueMapLabel('')).toBe('Karte');
    expect(venueMapLabel(undefined)).toBe('Karte');
  });
  it('venueMapLinks: Größere Karte und Route, kodiert; ungültige Koordinaten ergeben keine', () => {
    const links = venueMapLinks({ lat: 49.3, lng: 7.9, name: 'Halle Süd & West' });
    expect(links.map((l) => [l.kind, l.text])).toEqual([['osm', 'Größere Karte'], ['route', 'Route planen']]);
    expect(links[0].href).toBe('https://www.openstreetmap.org/?mlat=49.3&mlon=7.9#map=17/49.3/7.9');
    expect(links[1].href).toBe('https://www.openstreetmap.org/directions?route=%3B49.3%2C7.9');
    for (const bad of [{}, { lat: 49.3 }, { lat: '49.3', lng: '7.9' }, { lat: 95, lng: 0 }, { lat: 0, lng: 181 }, { lat: Number.NaN, lng: 0 }]) expect(venueMapLinks(bad as never)).toEqual([]);
  });
  it.each<[unknown, string | undefined]>([
    ['/hallen/nordhain', '/hallen/nordhain'], ['https://example.org/h', 'https://example.org/h'], ['#halle', '#halle'], ['hallen/x', 'hallen/x'],
    ['javascript:alert(1)', undefined], ['JaVaScRiPt:alert(1)', undefined], ['java\tscript:alert(1)', undefined], ['data:text/html,x', undefined], [' /x', undefined], ['', undefined], [undefined, undefined],
  ])('venueHref(%j) = %j', (input, expected) => {
    expect(venueHref(input as never)).toBe(expected);
  });
});
