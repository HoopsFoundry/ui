// @vitest-environment node
// Kataloge en und de: gleiche Schlüssel, Platzhalter, Mehrzahlformen, Schema, und "Wort für Wort" gegen den heutigen Quelltext.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import en from '../js/i18n/en.js';
import de from '../js/i18n/de.js';

type Value = string | { one: string; other: string; [k: string]: string };
const cats = { en: en as Record<string, Value>, de: de as Record<string, Value> };
const forms = (v: Value) => (typeof v === 'string' ? [v] : Object.values(v));
const holders = (t: string) => [...t.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map((m) => m[1]).sort().join(',');
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('Kataloge', () => {
  it('en und de haben dieselbe Schlüsselmenge', () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(en).length).toBeGreaterThanOrEqual(150);
  });
  for (const [lang, cat] of Object.entries(cats)) {
    describe(lang, () => {
      it('Schlüssel folgen dem Schema', () => {
        for (const k of Object.keys(cat)) expect(k, k).toMatch(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/);
      });
      it('keine leeren Werte, keine spitzen Klammern', () => {
        for (const [k, v] of Object.entries(cat)) for (const t of forms(v)) {
          expect(t.trim(), k).not.toBe('');
          expect(t, k).not.toMatch(/[<>]/);
        }
      });
      it('geschweifte Klammern nur als Platzhalter', () => {
        for (const [k, v] of Object.entries(cat)) for (const t of forms(v)) expect(t.replace(/\{[A-Za-z_][A-Za-z0-9_]*\}/g, ''), k).not.toMatch(/[{}]/);
      });
      it('Mehrzahlobjekte haben one und other und gleiche Platzhalter in allen Formen', () => {
        for (const [k, v] of Object.entries(cat)) {
          if (typeof v === 'string') continue;
          expect(typeof v.one, k).toBe('string');
          expect(typeof v.other, k).toBe('string');
          expect(Object.keys(v).every((c) => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(c)), k).toBe(true);
          expect(new Set(Object.values(v).map(holders)).size, k).toBe(1);
          expect(v.one, k).toContain('{count}');
        }
      });
    });
  }
  it('gleiche Platzhalter und gleiche Art (Text oder Mehrzahl) in en und de', () => {
    for (const k of Object.keys(en)) {
      expect(typeof de[k as keyof typeof de], k).toBe(typeof en[k as keyof typeof en]);
      expect(holders(forms(cats.de[k])[0]), k).toBe(holders(forms(cats.en[k])[0]));
    }
  });
  it('Unentschieden hat in beiden Sprachen eine Mehrzahlform', () => {
    expect(en['team.record.draws']).toEqual({ one: '{count} draw', other: '{count} draws' });
    expect(de['team.record.draws']).toEqual({ one: '{count} Unentschieden', other: '{count} Unentschieden' });
  });
  it('Englisch: amerikanische Schreibweise und Basketball-Kürzel', () => {
    expect(en['venue.cancelled']).toBe('Canceled');
    expect(en['schedule.state.cancelled']).toBe('canceled');
    expect(JSON.stringify(Object.values(en))).not.toMatch(/[Cc]ancell/);
    expect(en['periods.label.eighth']).toBe('Period {number}');
    expect(en['periods.short.eighth']).toBe('P{number}');
    expect(en['league.col.played-short']).toBe('GP');
    expect(de['league.col.played-short']).toBe('SP');
  });
  it('Himmelsrichtungen: deutsch Osten ist O', () => {
    expect(cats.de['common.direction.e']).toBe('O');
    expect(cats.en['common.direction.e']).toBe('E');
  });
});

// Stichprobe: der deutsche Katalogtext steht Wort für Wort im heutigen Quelltext (alle festen Teile zwischen den Platzhaltern).
const SAMPLE: [string, string][] = [
  ['map.load', 'js/map.js'], ['map.error', 'js/map.js'], ['map.privacy', 'js/map.js'], ['map.canvas-hint', 'js/map.js'],
  ['accordion.expand-all', 'js/accordion.js'], ['accordion.summary.all-open', 'js/accordion.js'], ['accordion.summary.partial', 'js/accordion.js'],
  ['backtop.label', 'js/backtop.js'], ['theme.toggle', 'js/theme.js'], ['pagenav.label', 'js/pagenav.js'],
  ['modal.close', 'svelte/Modal.svelte'], ['modal.close', 'react/Modal.tsx'], ['appnav.menu', 'svelte/AppNav.svelte'],
  ['stepper.state.pending', 'svelte/Stepper.svelte'], ['skeleton.loading', 'react/Skeleton.tsx'],
  ['venue.games-label', 'js/venue.js'], ['venue.contact', 'js/venue.js'], ['schedule.col.home-away', 'js/schedule.js'],
  ['schedule.provisional', 'js/render/schedule.js'], ['schedule.bye', 'svelte/ScheduleTable.svelte'], ['schedule.time-open', 'react/ScheduleGrid.tsx'],
  ['league.link', 'js/render/league-card.js'], ['league.col.points', 'svelte/LeagueCard.svelte'], ['league.summary.teams', 'js/league.js'],
  ['league.summary.played-of', 'js/league.js'], ['league.live', 'js/league.js'], ['league.zone.down.row', 'js/league.js'],
  ['league.window.range', 'js/league.js'], ['match.final', 'svelte/MatchCard.svelte'], ['periods.label.overtime', 'js/periods.js'],
  ['playbyplay.title', 'react/PlayByPlay.tsx'], ['playbyplay.score', 'svelte/PlayByPlay.svelte'], ['team.next', 'svelte/TeamCard.svelte'],
  ['team.record.aria', 'js/team.js'], ['team.rank.aria-of', 'js/team.js'], ['team.squad.players', 'js/team.js'],
  ['team.opponent.home', 'js/team.js'], ['player.captain', 'react/PlayerCard.tsx'], ['stats.empty', 'js/stats.js'],
];
describe('heutige Texte (Wort für Wort)', () => {
  it('Stichprobe von mindestens 25 Schlüsseln aus mehreren Bausteinen mit Mehrzahl und Platzhaltern', () => {
    expect(new Set(SAMPLE.map(([k]) => k)).size).toBeGreaterThanOrEqual(25);
    expect(new Set(SAMPLE.map(([k]) => k.split('.')[0])).size).toBeGreaterThanOrEqual(12);
    expect(SAMPLE.some(([k]) => typeof de[k as keyof typeof de] === 'object')).toBe(true);
    expect(SAMPLE.some(([k]) => forms(cats.de[k]).some((t) => t.includes('{')))).toBe(true);
  });
  for (const [key, file] of SAMPLE) {
    it(`${key} in ${file}`, () => {
      const source = read(file);
      const pieces = forms(cats.de[key]).flatMap((t) => t.split(/\{[^}]*\}/)).map((p) => p.trim()).filter((p) => p.length > 1);
      expect(pieces.length, key).toBeGreaterThan(0);
      // Mehrzahl: Wörter der Einzelform und der Mehrzahlform stehen einzeln im Quelltext (ternäre Auswahl), darum je Wort prüfen
      for (const p of pieces) {
        const found = source.includes(p) || p.split(/\s+/).every((w) => source.includes(w));
        expect(found, `${key}: "${p}"`).toBe(true);
      }
    });
  }
});
