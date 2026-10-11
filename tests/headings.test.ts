// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');

// Komponenten mit Überschrift: Ebene wählbar (h2 bis h6), Rangfolge titleAs > HeadingLevel > h3 (gedacht für einen Abschnitt unter einer h2).
const MIT_TITEL = ['ScheduleTable', 'ScheduleGrid', 'Table', 'PlayerCard', 'EmptyState', 'PlayByPlay', 'TeamCard', 'LeagueCard', 'VenueCard'];

describe('Überschriftenebenen der Komponenten', () => {
  it('keine Komponente gibt eine h1 aus (die gehört der App)', () => {
    for (const dir of ['../svelte', '../react']) {
      const files = readdirSync(new URL(dir, import.meta.url)).filter((f) => /\.(svelte|tsx)$/.test(f) && !/\.test\./.test(f));
      for (const f of files) {
        const src = read(`${dir}/${f}`);
        expect(src, `${dir}/${f}`).not.toMatch(/<h1[\s>]|'h1'|"h1"/);
      }
    }
  });

  for (const name of MIT_TITEL) {
    it(`${name}: Svelte und React haben titleAs (h2 bis h6) und lesen die Ebene aus HeadingLevel`, () => {
      const svelte = read(`../svelte/${name}.svelte`);
      const react = read(`../react/${name}.tsx`);
      expect(svelte).toMatch(/titleAs\?: HeadingTag;/);
      expect(svelte).toMatch(/useHeadingTag\(\(\) => titleAs\)/);
      expect(svelte).not.toMatch(/<h[1-6][\s>]/);
      expect(svelte).not.toMatch(/titleAs = 'h/);
      expect(react).toMatch(/titleAs\?: HeadingTag;/);
      expect(react).toMatch(/const Heading = useHeadingTag\(titleAs\);/);
      expect(react).not.toMatch(/<h[1-6][\s>]/);
      expect(react).not.toMatch(/titleAs: Heading = 'h/);
    });
  }

  it('Svelte ScheduleTable und ScheduleGrid setzen die Ebene über titleAs (keine feste h3)', () => {
    for (const name of ['ScheduleTable', 'ScheduleGrid']) {
      const src = read(`../svelte/${name}.svelte`);
      expect(src).toMatch(/<svelte:element this=\{heading\.tag\} class="dss-frame-title">/);
      expect(src).not.toMatch(/<h3 class="dss-frame-title">/);
    }
  });

  it('das Modal hat titleAs (Standard h2) in beiden Fassungen und gibt titleAs + 1 an den Inhalt weiter', () => {
    const svelte = read('../svelte/Modal.svelte');
    const react = read('../react/Modal.tsx');
    expect(svelte).toMatch(/titleAs\?: HeadingTag;/);
    expect(svelte).toMatch(/resolveHeading\(titleAs, 2\)/);
    expect(svelte).toMatch(/provideHeadingLevel\(\(\) => nextLevel\(levelOfTag\(titleTag\)\)\)/);
    expect(svelte).toMatch(/<svelte:element this=\{titleTag\} class="dss-m-title"/);
    expect(react).toMatch(/titleAs = 'h2'/);
    expect(react).toMatch(/resolveHeading\(titleAs, 2\)/);
    expect(react).toMatch(/HeadingLevelContext\.Provider value=\{contentLevel\}/);
  });

  it('HeadingLevel: Svelte setzt den Kontext (provideHeadingLevel), React stellt Provider und Hook', () => {
    expect(read('../svelte/HeadingLevel.svelte')).toMatch(/provideHeadingLevel\(/);
    expect(read('../svelte/heading-context.js')).toMatch(/setContext\(KEY/);
    expect(read('../react/HeadingLevel.tsx')).toMatch(/HeadingLevelContext\.Provider/);
    expect(read('../react/index.ts')).toMatch(/HeadingLevel, useHeadingLevel/);
  });

  it('das Paket exportiert heading.js (mit Typen) und die Svelte-Komponente', () => {
    const pkg = JSON.parse(read('../package.json')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./heading.js']).toEqual({ types: './js/heading.d.ts', import: './js/heading.js' });
    expect(pkg.exports['./svelte/HeadingLevel']).toBe('./svelte/HeadingLevel.svelte');
  });
});
