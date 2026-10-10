// Reine Funktionen des Accordions: Tabellentests mit Randfällen.
import { describe, expect, it } from 'vitest';
import { ancestorsOf, hashTarget, labelWithMeta, nextHeader, summaryText } from '../js/accordion.js';

const H = (...flags: boolean[]) => flags.map((disabled) => ({ disabled }));

describe('nextHeader', () => {
  const free = H(false, false, false, false);
  const gaps = H(false, true, true, false, true, false); // 0 frei, 1-2 gesperrt, 3 frei, 4 gesperrt, 5 frei

  it.each([
    ['Pfeil ab', 0, 'ArrowDown', free, 1],
    ['Pfeil auf', 2, 'ArrowUp', free, 1],
    ['Home', 3, 'Home', free, 0],
    ['End', 0, 'End', free, 3],
    ['kein Umlauf unten', 3, 'ArrowDown', free, 3],
    ['kein Umlauf oben', 0, 'ArrowUp', free, 0],
    ['Pfeil ab überspringt gesperrte', 0, 'ArrowDown', gaps, 3],
    ['Pfeil ab über mehrere Lücken', 3, 'ArrowDown', gaps, 5],
    ['Pfeil auf überspringt gesperrte', 5, 'ArrowUp', gaps, 3],
    ['Pfeil auf bis zum Anfang', 3, 'ArrowUp', gaps, 0],
    ['am Ende nur gesperrte danach: bleibt', 5, 'ArrowDown', gaps, 5],
    ['am Anfang nur gesperrte davor: bleibt', 0, 'ArrowUp', gaps, 0],
    ['Home überspringt einen gesperrten ersten', 2, 'Home', H(true, false, false), 1],
    ['End überspringt einen gesperrten letzten', 0, 'End', H(false, false, true), 1],
    ['Home: alle gesperrt, bleibt', 1, 'Home', H(true, true, true), 1],
    ['End: alle gesperrt, bleibt', 1, 'End', H(true, true, true), 1],
    ['Start auf einem gesperrten Kopf (fokussierbar): Pfeil ab', 1, 'ArrowDown', gaps, 3],
    ['Start auf einem gesperrten Kopf: Pfeil auf', 2, 'ArrowUp', gaps, 0],
    ['ein einziger Kopf', 0, 'ArrowDown', H(false), 0],
    ['andere Taste bleibt', 1, 'Enter', free, 1],
    ['Leertaste bleibt', 1, ' ', free, 1],
    ['ArrowLeft bleibt', 1, 'ArrowLeft', free, 1],
    ['kleingeschriebene Taste ist unbekannt', 1, 'home', free, 1],
    ['true als gesperrt', 0, 'ArrowDown', [false, true, false], 2],
  ])('%s', (_name, index, key, headers, expected) => {
    expect(nextHeader(index as number, key as string, headers as never)).toBe(expected);
  });

  it.each([
    ['Index zu groß', 9, 'ArrowUp', free, 9],
    ['negativer Index', -1, 'ArrowDown', free, -1],
    ['Index keine Ganzzahl', 1.5, 'ArrowDown', free, -1],
    ['leere Liste', 0, 'Home', [], 0],
    ['keine Liste', 0, 'Home', undefined, 0],
    ['Index NaN', NaN, 'End', free, -1],
    ['Index fehlt', undefined, 'End', free, -1],
  ])('ungültige Eingabe: %s ergibt den aktuellen Index', (_name, index, key, headers, expected) => {
    expect(nextHeader(index as never, key as string, headers as never)).toBe(expected);
  });
});

describe('hashTarget', () => {
  const ids = ['kader', 'spiel plan', 'a/b', 'über', 'x'];
  it.each([
    ['mit #', '#kader', 'kader'],
    ['ohne #', 'kader', 'kader'],
    ['URL-kodiertes Leerzeichen', '#spiel%20plan', 'spiel plan'],
    ['URL-kodierter Umlaut', '#%C3%BCber', 'über'],
    ['URL-kodierter Schrägstrich', '#a%2Fb', 'a/b'],
    ['Umlaut unkodiert', '#über', 'über'],
    ['unbekannte id', '#nope', null],
    ['nur #', '#', null],
    ['leer', '', null],
    ['Groß-/Kleinschreibung zählt', '#Kader', null],
    ['Teiltreffer zählt nicht', '#kade', null],
    ['doppeltes #', '##kader', null],
    ['ungültige Kodierung: Rohwert', '#%E0%A4%A', null],
    ['Pfad statt Anker', '#/kader', null],
  ])('%s', (_name, hash, expected) => {
    expect(hashTarget(hash, ids)).toBe(expected);
  });
  it('ungültige Eingaben ergeben null', () => {
    expect(hashTarget(undefined as never, ids)).toBeNull();
    expect(hashTarget('#x', undefined as never)).toBeNull();
    expect(hashTarget('#x', [])).toBeNull();
    expect(hashTarget(5 as never, ids)).toBeNull();
  });
  it('eine ungültig kodierte id wird roh verglichen', () => {
    expect(hashTarget('#%E0%A4%A', ['%E0%A4%A'])).toBe('%E0%A4%A');
  });
});

describe('ancestorsOf', () => {
  const tree = [
    { id: 'a', parent: null },
    { id: 'b', parent: 'a' },
    { id: 'c', parent: 'b' },
    { id: 'd' },
    { id: 'e', parent: 'd' },
    { id: 'orphan', parent: 'missing' },
  ];
  it.each([
    ['Wurzel hat keine Eltern', 'a', []],
    ['ein Elternbereich', 'b', ['a']],
    ['Wurzel zuerst', 'c', ['a', 'b']],
    ['parent fehlt: oberste Ebene', 'd', []],
    ['zweite Wurzel', 'e', ['d']],
    ['unbekannter Elternbereich bricht ab', 'orphan', []],
    ['unbekannte id', 'zzz', []],
  ])('%s', (_name, id, expected) => {
    expect(ancestorsOf(id as string, tree)).toEqual(expected);
  });
  it('Zyklen brechen ab', () => {
    const loop = [{ id: 'x', parent: 'y' }, { id: 'y', parent: 'x' }];
    expect(ancestorsOf('x', loop)).toEqual(['y']);
    expect(ancestorsOf('x', [{ id: 'x', parent: 'x' }])).toEqual([]);
  });
  it('ungültiger Baum ergibt []', () => {
    expect(ancestorsOf('a', undefined as never)).toEqual([]);
    expect(ancestorsOf('a', [])).toEqual([]);
  });
});

describe('labelWithMeta', () => {
  it.each([
    ['Titel und Zusatz', 'Kader', '14 Spieler', 'Kader, 14 Spieler'],
    ['Zahl als Zusatz', 'Kader', 14, 'Kader, 14'],
    ['ohne Zusatz', 'Kader', undefined, 'Kader'],
    ['leerer Zusatz', 'Kader', '   ', 'Kader'],
    ['Zusatz null', 'Kader', null, 'Kader'],
    ['Zusatz 0 zählt', 'Kader', 0, 'Kader, 0'],
    ['gleicher Zusatz nicht doppelt', 'Live', 'live', 'Live'],
    ['Zusatz schon am Ende', 'Kader, 14 Spieler', '14 Spieler', 'Kader, 14 Spieler'],
    ['Teiltreffer ist keine Doppelung', 'Spielplan', 'Spiel', 'Spielplan, Spiel'],
    ['Leerraum wird geglättet', '  Kader  ', ' 14   Spieler ', 'Kader, 14 Spieler'],
    ['Zeilenumbruch im Zusatz', 'Kader', '14\nSpieler', 'Kader, 14 Spieler'],
    ['ohne Titel: nur Zusatz', '', 'Live', 'Live'],
    ['beides leer', '', '', ''],
    ['Titel fehlt (undefined)', undefined, undefined, ''],
  ])('%s', (_name, title, meta, expected) => {
    expect(labelWithMeta(title, meta)).toBe(expected);
  });
});

describe('summaryText', () => {
  it.each([
    [5, 5, 'Alle Bereiche geöffnet'],
    [0, 5, 'Alle Bereiche geschlossen'],
    [3, 5, '3 von 5 Bereichen geöffnet'],
    [1, 5, '1 von 5 Bereichen geöffnet'],
    [4, 5, '4 von 5 Bereichen geöffnet'],
    [1, 1, 'Der Bereich ist geöffnet'],
    [0, 1, 'Der Bereich ist geschlossen'],
    [1, 2, '1 von 2 Bereichen geöffnet'],
    [9, 5, 'Alle Bereiche geöffnet'],
    [-2, 5, 'Alle Bereiche geschlossen'],
    [2.5, 5, 'Alle Bereiche geschlossen'],
    [0, 0, ''],
    [3, 0, ''],
    [2, NaN, ''],
    [2, -1, ''],
    [NaN, 4, 'Alle Bereiche geschlossen'],
  ])('%s von %s: %s', (open, total, expected) => {
    expect(summaryText(open, total)).toBe(expected);
  });
});
