// @vitest-environment node
// Ohne das Vitest-Setup (frischer Node-Prozess) ist die Standardsprache Englisch, und die Render-Funktionen liefern englischen Text.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function probe() {
  const result = spawnSync(process.execPath, [resolve(process.cwd(), 'tests/helpers/i18n-default-probe.mjs')], { encoding: 'utf8' });
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as { locale: string; venue: string; map: string; stats: string; league: string };
}

const GERMAN = ['Karte laden', 'Größere Karte', 'Route planen', 'keine Angabe', 'Mannschaft', 'Spiele', 'Tabelle', 'Legende', 'Orte auf der Karte', 'gespielt', 'Platz'];

describe('Standardsprache ohne Setup', () => {
  const out = probe();
  it('ist Englisch', () => {
    expect(out.locale).toBe('en');
  });
  it('die Hallenkarte mit Karte ist englisch', () => {
    expect(out.venue).toContain('Load map');
    expect(out.venue).toContain('Larger map');
    expect(out.venue).toContain('Plan route');
    expect(out.venue).toContain('Loading the map sends your IP address to the map service.');
    expect(out.venue).toContain('49.4875° N, 8.4660° E');
  });
  it('die Karte ist englisch', () => {
    expect(out.map).toContain('Load map');
    expect(out.map).toContain('Places on the map');
    expect(out.map).toContain('Skip map');
  });
  it('Kennzahlen und Ligencard sind englisch', () => {
    expect(out.stats).toContain('not available');
    expect(out.league).toContain('Standings: Liga');
    expect(out.league).toContain('1 of 2 games played');
    expect(out.league).toContain('Team');
  });
  it('kein deutscher Text aus der Liste in der Ausgabe', () => {
    const all = [out.venue, out.map, out.stats, out.league].join('\n');
    for (const word of GERMAN) expect(all, word).not.toContain(word);
  });
});
