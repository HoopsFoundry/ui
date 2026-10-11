// @vitest-environment node
// Kennzahlen-Gitter und Form: reine Funktionen, CSS-Regeln, Quelltext (Aussagen aus tests/helpers/stats-rules.ts).
import { describe, expect, it } from 'vitest';
import * as stats from '../js/stats.js';
import { read } from './helpers/mutation';
import { statsCssRules, statsLogicRules, statsSourceRules } from './helpers/stats-rules';

const css = read('css/components.css');

describe('statItems', () => {
  it.each(Object.entries(statsLogicRules(stats as never)))('%s', (_name, ok) => {
    expect(ok).toBe(true);
  });
  it('Reihenfolge bleibt, Text wird nie als HTML gedeutet (nur Zeichenketten)', () => {
    const list = stats.statItems([{ label: '<b>A</b>', value: '"><img src=x onerror=alert(1)>' }, { label: 'B', value: 2 }]);
    expect(list.map((s) => s.label)).toEqual(['<b>A</b>', 'B']);
    expect(list[0].value).toBe('"><img src=x onerror=alert(1)>');
  });
});

describe('CSS: Kennzahlen-Gitter und Form', () => {
  it.each(Object.entries(statsCssRules(css)))('%s', (_name, ok) => {
    expect(ok).toBe(true);
  });
  it('alle Klassen des Manifests sind definiert', () => {
    const manifest = JSON.parse(read('parity.manifest.json')) as Record<string, { css: string[] }>;
    for (const name of ['FormChips', 'StatGrid']) for (const cls of manifest[name].css) expect(css, cls).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
  });
});

describe('Quelltext: FormChips, StatGrid, LeagueCard', () => {
  const files = () => ({
    formSvelte: read('svelte/FormChips.svelte'), formReact: read('react/FormChips.tsx'),
    statSvelte: read('svelte/StatGrid.svelte'), statReact: read('react/StatGrid.tsx'),
    leagueSvelte: read('svelte/LeagueCard.svelte'), leagueReact: read('react/LeagueCard.tsx'),
  });
  it.each(Object.entries(statsSourceRules(files())))('%s', (_name, ok) => {
    expect(ok).toBe(true);
  });
  it('kein innerHTML und kein {@html} in den neuen Komponenten', () => {
    for (const text of Object.values(files())) expect(text).not.toMatch(/innerHTML|\{@html|dangerouslySetInnerHTML/);
  });
});
