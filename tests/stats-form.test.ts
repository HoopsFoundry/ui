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

// ── Kontraste: Buchstaben-Marken ≥ 7:1, Punkte und Ring ≥ 3:1 auf der Fläche und der Auswahlfläche; Hell, Dunkel (beide Wege), BBV und DBB ──
import { blockOf, color, ratio } from './helpers/color';

describe('Kontraste von Kennzahlen und Form', () => {
  const tokens = read('tokens/tokens.css');
  const blocks = {
    Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
    'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --dss-fg'),
    'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --dss-fg'),
  };
  const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      const scope = `--h-signal: var(${brand === 'BBV' ? '--h-amber' : '--h-gold'});\n${blocks.Hell}\n${block}\n${brand === 'DBB' ? dbb : ''}\n${tokens}`;
      const c = (token: string) => color(`var(${token})`, scope);
      it(`${name}, ${brand}: Buchstaben in den Chip-Tönen mindestens 7:1`, () => {
        for (const tone of ['ok', 'err', 'neutral']) expect(ratio(c(`--dss-chip-${tone}-fg`), c(`--dss-chip-${tone}-bg`)), tone).toBeGreaterThanOrEqual(7);
      });
      it(`${name}, ${brand}: Punkte (Sieg, Niederlage) und Ring mindestens 3:1 auf Fläche und Auswahlfläche`, () => {
        for (const surface of ['--dss-surface', '--dss-selected-bg']) {
          expect(ratio(c('--dss-chip-ok-fg'), c(surface)), `Sieg auf ${surface}`).toBeGreaterThanOrEqual(3);
          expect(ratio(c('--dss-chip-err-fg'), c(surface)), `Niederlage auf ${surface}`).toBeGreaterThanOrEqual(3);
        }
        expect(ratio(c('--dss-mute'), c('--dss-surface')), 'Ring').toBeGreaterThanOrEqual(3);
        expect(ratio(c('--dss-mute-on-selected'), c('--dss-selected-bg')), 'Ring in der eigenen Zeile').toBeGreaterThanOrEqual(3);
      });
      it(`${name}, ${brand}: Kennzahlen (Wert --dss-fg, Beschriftung --dss-mute) mindestens 7:1 auf der Kachel`, () => {
        expect(ratio(c('--dss-fg'), c('--dss-surface'))).toBeGreaterThanOrEqual(7);
        expect(ratio(c('--dss-mute'), c('--dss-surface'))).toBeGreaterThanOrEqual(7);
      });
    }
  }
});
