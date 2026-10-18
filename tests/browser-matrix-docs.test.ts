// @vitest-environment node
// Lückenplan 2.1: die Doku der Browser-Matrix passt zum Skript scripts/check-browser-matrix.mjs (Bereiche, Zahl der Prüfungen, Firefox-Stand).
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { coreMatrix } from '../stories/Foundation/Vanilla.code';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const script = read('scripts/check-browser-matrix.mjs');
const mdx = read('stories/Foundation/Vanilla.mdx');
const quality = read('docs/architecture/sections/10-quality-requirements.adoc');

describe('Browser-Matrix der Kernbausteine', () => {
  const scriptGroups = [...new Set([...script.matchAll(/record\(b, '([^']+)'/g)].map((m) => m[1]))];

  it('die Bereiche der Doku sind genau die Bereiche des Skripts', () => {
    expect(scriptGroups.length).toBeGreaterThan(5);
    expect(coreMatrix.groups.map((g) => g.name).sort()).toEqual([...scriptGroups].sort());
  });

  it('die Prüfungen der Bereiche summieren sich auf die Zahl je Browser', () => {
    expect(coreMatrix.groups.reduce((sum, g) => sum + g.checks, 0)).toBe(coreMatrix.checksPerBrowser);
    for (const b of coreMatrix.browsers.filter((x) => x.result !== 'nicht gelaufen')) {
      expect(b.result).toBe(`${coreMatrix.checksPerBrowser} von ${coreMatrix.checksPerBrowser} bestanden`);
    }
  });

  it('jede Prüfung des Skripts zählt: Aufrufe von record je Bereich (Container läuft für zwei Fensterbreiten)', () => {
    const calls = Object.fromEntries(scriptGroups.map((g) => [g, (script.match(new RegExp(`record\\(b, '${g}'`, 'g')) ?? []).length]));
    calls.Container *= 2;
    for (const g of coreMatrix.groups) expect(calls[g.name], g.name).toBe(g.checks);
  });

  it('die Kernfragen des Lückenplans sind abgedeckt', () => {
    for (const part of ['::backdrop', ':modal', "container-type: inline-size", 'prefers-color-scheme', 'reducedMotion', 'data-motion', 'hoops-map-load', 'hoops-pagenav']) {
      expect(script, part).toContain(part.replace('prefers-color-scheme', 'colorScheme'));
    }
  });

  it('Firefox ist ehrlich als nicht gelaufen geführt, Doku und arc42 nennen das Skript', () => {
    expect(coreMatrix.browsers.map((b) => b.name)).toEqual(['Chromium', 'WebKit (Safari-Engine)', 'Firefox']);
    expect(coreMatrix.browsers[2].result).toBe('nicht gelaufen');
    expect(coreMatrix.firefoxNote).toContain('Ursache ungeklärt');
    expect(mdx).toContain('node scripts/check-browser-matrix.mjs');
    expect(mdx).toContain('coreMatrix.groups');
    expect(quality).toContain('scripts/check-browser-matrix.mjs');
  });
});
