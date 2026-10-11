// @vitest-environment node
// Ligencard: reine Hilfsfunktionen in js/league.js, Tabellentests.
import { describe, it, expect } from 'vitest';
import { cellNumber, diffSign, diffText, formEntries, formLabel, leagueSummary, leagueWindow, liveInfo, rankText, teamTotal, windowLabel, zoneInfo, zoneLegend } from '../js/league.js';

const table = (count: number, ownRank?: number) =>
  Array.from({ length: count }, (_, i) => ({ rank: i + 1, name: `Team ${i + 1}`, played: 10, points: 30 - i, ...(ownRank === i + 1 ? { own: true } : {}) }));
const ranks = (rows: { rank: number }[]) => rows.map((row) => row.rank);

describe('leagueWindow mit eigener Mannschaft (zwei davor, eigene, eins dahinter)', () => {
  it.each([
    [1, [1, 2, 3, 4]],
    [2, [1, 2, 3, 4]],
    [3, [1, 2, 3, 4]],
    [4, [2, 3, 4, 5]],
    [6, [4, 5, 6, 7]],
    [7, [5, 6, 7, 8]],
    [11, [9, 10, 11, 12]],
    [12, [9, 10, 11, 12]],
  ])('Platz %i von 12 -> %j', (own, expected) => {
    expect(ranks(leagueWindow(table(12, own)))).toEqual(expected);
  });

  it('immer vier Zeilen, die eigene darunter', () => {
    for (let own = 1; own <= 12; own++) {
      const rows = leagueWindow(table(12, own));
      expect(rows).toHaveLength(4);
      expect(rows.some((row) => row.rank === own)).toBe(true);
    }
  });

  it('weniger Teams als Zeilen: alle', () => {
    expect(ranks(leagueWindow(table(3, 2)))).toEqual([1, 2, 3]);
    expect(ranks(leagueWindow(table(4, 4)))).toEqual([1, 2, 3, 4]);
  });

  it('ein Team: nur dieses', () => {
    expect(ranks(leagueWindow(table(1, 1)))).toEqual([1]);
    expect(ranks(leagueWindow(table(1)))).toEqual([1]);
  });

  it('before und after sind einstellbar, Fenstergröße bleibt before + 1 + after', () => {
    expect(ranks(leagueWindow(table(12, 6), { before: 1, after: 3 }))).toEqual([5, 6, 7, 8, 9]);
    expect(ranks(leagueWindow(table(12, 12), { before: 1, after: 3 }))).toEqual([8, 9, 10, 11, 12]);
    expect(ranks(leagueWindow(table(12, 1), { before: 1, after: 3 }))).toEqual([1, 2, 3, 4, 5]);
    expect(ranks(leagueWindow(table(12, 6), { before: 0, after: 0 }))).toEqual([6]);
  });

  it('before und after sind nicht vertauscht: zwei davor, eine dahinter', () => {
    expect(ranks(leagueWindow(table(12, 6)))).toEqual([4, 5, 6, 7]);
  });

  it('erste eigene Mannschaft zählt (bei mehreren)', () => {
    const rows = table(12);
    rows[4].own = true;
    rows[9].own = true;
    expect(ranks(leagueWindow(rows))).toEqual([3, 4, 5, 6]);
  });

  it('unsortierte Eingabe wird nach Platz sortiert', () => {
    const rows = table(12, 7).reverse();
    expect(ranks(leagueWindow(rows))).toEqual([5, 6, 7, 8]);
  });

  it('doppelte Plätze bleiben in der Eingabereihenfolge', () => {
    const rows = [
      { rank: 1, name: 'A', played: 1, points: 1 },
      { rank: 2, name: 'B', played: 1, points: 1 },
      { rank: 2, name: 'C', played: 1, points: 1 },
      { rank: 2, name: 'D', played: 1, points: 1, own: true },
      { rank: 5, name: 'E', played: 1, points: 1 },
      { rank: 6, name: 'F', played: 1, points: 1 },
    ];
    expect(leagueWindow(rows).map((row) => row.name)).toEqual(['B', 'C', 'D', 'E']);
  });
});

describe('leagueWindow ohne eigene Mannschaft', () => {
  it('die ersten drei', () => {
    expect(ranks(leagueWindow(table(12)))).toEqual([1, 2, 3]);
  });
  it('limit einstellbar', () => {
    expect(ranks(leagueWindow(table(12), { limit: 5 }))).toEqual([1, 2, 3, 4, 5]);
    expect(ranks(leagueWindow(table(12), { limit: 1 }))).toEqual([1]);
  });
  it('weniger Teams als limit: alle', () => {
    expect(ranks(leagueWindow(table(2)))).toEqual([1, 2]);
    expect(ranks(leagueWindow(table(5), { limit: 8 }))).toEqual([1, 2, 3, 4, 5]);
  });
  it('leere Liste und ungültige Eingaben', () => {
    expect(leagueWindow([])).toEqual([]);
    expect(leagueWindow(undefined as never)).toEqual([]);
    expect(leagueWindow(null as never)).toEqual([]);
    expect(leagueWindow('x' as never)).toEqual([]);
  });
  it.each([0, -2, 1.5, Number.NaN, '4' as never, null as never])('ungültiges limit %s fällt auf 3 zurück', (limit) => {
    expect(ranks(leagueWindow(table(12), { limit }))).toEqual([1, 2, 3]);
  });
  it('Einträge ohne Objekt werden übergangen, Einträge ohne Platz stehen am Ende', () => {
    const rows = [{ name: 'X' }, null, { rank: 2, name: 'B' }, { rank: 1, name: 'A' }] as never[];
    expect(leagueWindow(rows, { limit: 5 }).map((row: { name: string }) => row.name)).toEqual(['A', 'B', 'X']);
  });
  it('verändert die Eingabe nicht', () => {
    const rows = table(12, 7).reverse();
    const copy = [...rows];
    leagueWindow(rows);
    expect(rows).toEqual(copy);
  });
});

describe('leagueSummary', () => {
  it.each([
    [{ teamCount: 12, played: 15, total: 132 }, '12 Teams · 15 von 132 Spielen gespielt'],
    [{ teamCount: 1, played: 1, total: 6 }, '1 Team · 1 von 6 Spielen gespielt'],
    [{ teamCount: 2, played: 0, total: 1 }, '2 Teams · 0 von 1 Spiel gespielt'],
    [{ teamCount: 12 }, '12 Teams'],
    [{ played: 15, total: 132 }, '15 von 132 Spielen gespielt'],
    [{ teamCount: 12, played: 15 }, '12 Teams · 15 Spiele gespielt'],
    [{ teamCount: 12, played: 1 }, '12 Teams · 1 Spiel gespielt'],
    [{ teamCount: 12, total: 132 }, '12 Teams · 132 Spiele insgesamt'],
    [{ teamCount: 12, played: 1500, total: 13200 }, '12 Teams · 1500 von 13200 Spielen gespielt'],
    [{ teamCount: 0 }, '0 Teams'],
    [{}, ''],
    [undefined, ''],
  ])('%j -> %s', (input, text) => {
    expect(leagueSummary(input as never)).toBe(text);
  });
  it('ungültige Zahlen entfallen', () => {
    expect(leagueSummary({ teamCount: -1, played: 1.5, total: Number.NaN })).toBe('');
    expect(leagueSummary({ teamCount: 12, played: -3, total: 132 })).toBe('12 Teams · 132 Spiele insgesamt');
    expect(leagueSummary({ teamCount: '12' as never, played: '5' as never, total: 10 })).toBe('10 Spiele insgesamt');
    expect(leagueSummary({ teamCount: Infinity, played: 3, total: 6 })).toBe('3 von 6 Spielen gespielt');
  });
});

describe('formLabel und formEntries', () => {
  it('Wörter, neueste zuletzt', () => {
    expect(formLabel(['S', 'S', 'N'])).toBe('Form: Sieg, Sieg, Niederlage');
    expect(formLabel(['U'])).toBe('Form: Unentschieden');
  });
  it('höchstens fünf: die neuesten', () => {
    expect(formLabel(['N', 'S', 'S', 'N', 'U', 'S'])).toBe('Form: Sieg, Sieg, Niederlage, Unentschieden, Sieg');
    expect(formEntries(['S', 'S', 'S', 'S', 'S', 'N'])).toEqual(['S', 'S', 'S', 'S', 'N']);
  });
  it('ungültige Einträge werden ignoriert', () => {
    expect(formEntries(['S', 'x', 'N', 3, null, 's'])).toEqual(['S', 'N']);
    expect(formLabel(['x', 1])).toBe('');
  });
  it.each([undefined, null, 'SSN', 5, {}, []])('%j ergibt leer', (value) => {
    expect(formLabel(value)).toBe('');
    expect(formEntries(value)).toEqual([]);
  });
});

describe('windowLabel', () => {
  it.each([
    [[5, 6, 7, 8], 12, 'Plätze 5 bis 8 von 12'],
    [[1, 2, 3], 12, 'Plätze 1 bis 3 von 12'],
    [[1], 12, 'Platz 1 von 12'],
    [[9, 10, 11, 12], 12, 'Plätze 9 bis 12 von 12'],
    [[1, 2, 3, 4], undefined, 'Plätze 1 bis 4'],
    [[1, 2, 3, 4], 3, 'Plätze 1 bis 4'],
    [[1, 2, 3, 4], Number.NaN, 'Plätze 1 bis 4'],
    [[], 12, ''],
  ])('%j von %s -> %s', (rankList, count, text) => {
    expect(windowLabel(rankList.map((rank) => ({ rank })), count as never)).toBe(text);
  });
  it('ungültige Plätze ergeben leer', () => {
    expect(windowLabel([{ rank: 0 }, { rank: 2 }], 12)).toBe('');
    expect(windowLabel([{ rank: 1.5 }], 12)).toBe('');
    expect(windowLabel(undefined as never, 12)).toBe('');
  });
});

describe('diffText und diffSign', () => {
  it.each([[12, '+12'], [-5, '−5'], [0, '0'], [2.5, '+2,5'], [-0.5, '−0,5']])('%s -> %s', (value, text) => {
    expect(diffText(value)).toBe(text);
  });
  it('das Minus ist U+2212 (nicht der Bindestrich)', () => {
    expect(diffText(-5).charCodeAt(0)).toBe(0x2212);
  });
  it.each([undefined, null, '5', Number.NaN, Infinity])('%s ergibt leer', (value) => {
    expect(diffText(value)).toBe('');
    expect(diffSign(value)).toBeUndefined();
  });
  it('Vorzeichen', () => {
    expect(diffSign(3)).toBe('plus');
    expect(diffSign(-3)).toBe('minus');
    expect(diffSign(0)).toBeUndefined();
  });
});

describe('cellNumber und rankText', () => {
  it('Zahlen mit Komma, ohne Tausenderpunkt', () => {
    expect(cellNumber(1500)).toBe('1500');
    expect(cellNumber(0)).toBe('0');
    expect(cellNumber(2.5)).toBe('2,5');
    expect(cellNumber(undefined)).toBe('');
    expect(cellNumber(Number.NaN)).toBe('');
    expect(cellNumber('3')).toBe('');
  });
  it('Platz ab 1', () => {
    expect(rankText(1)).toBe('1');
    expect(rankText(0)).toBe('');
    expect(rankText(2.5)).toBe('');
    expect(rankText(undefined)).toBe('');
  });
});

describe('Zonen', () => {
  it('Texte', () => {
    expect(zoneInfo('up')).toEqual({ zone: 'up', row: 'Aufstiegsplatz', legend: 'Aufstieg' });
    expect(zoneInfo('playoff')).toEqual({ zone: 'playoff', row: 'Relegation', legend: 'Relegation' });
    expect(zoneInfo('down')).toEqual({ zone: 'down', row: 'Abstiegsplatz', legend: 'Abstieg' });
  });
  it.each([undefined, 'x', 'toString', '__proto__', 3, null])('unbekannte Zone %s ergibt undefined', (zone) => {
    expect(zoneInfo(zone)).toBeUndefined();
  });
  it('Legende: nur vorkommende Zonen, feste Reihenfolge', () => {
    expect(zoneLegend([{ zone: 'down' }, { zone: 'up' }, {}, { zone: 'down' }]).map((z) => z.legend)).toEqual(['Aufstieg', 'Abstieg']);
    expect(zoneLegend([{}, { zone: 'x' }])).toEqual([]);
    expect(zoneLegend([])).toEqual([]);
    expect(zoneLegend(undefined as never)).toEqual([]);
  });
});

describe('liveInfo', () => {
  it('true: nur das Wort Live', () => {
    expect(liveInfo(true)).toEqual({ text: '' });
  });
  it('Zahlen ab 1 mit Singular und Plural', () => {
    expect(liveInfo(1)).toEqual({ count: 1, text: '1 Spiel läuft' });
    expect(liveInfo(2)).toEqual({ count: 2, text: '2 Spiele laufen' });
  });
  it.each([false, 0, -1, 1.5, Number.NaN, undefined, null, '2'])('%s ergibt undefined', (value) => {
    expect(liveInfo(value)).toBeUndefined();
  });
});

describe('teamTotal', () => {
  it('gültiges teamCount gewinnt, sonst die Länge der Liste', () => {
    expect(teamTotal(12, table(3))).toBe(12);
    expect(teamTotal(undefined, table(3))).toBe(3);
    expect(teamTotal(-1, table(3))).toBe(3);
    expect(teamTotal(1.5, table(2))).toBe(2);
    expect(teamTotal(undefined, [])).toBeUndefined();
    expect(teamTotal(undefined, undefined)).toBeUndefined();
    expect(teamTotal(0, [])).toBe(0);
  });
});
