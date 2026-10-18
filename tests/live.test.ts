// @vitest-environment node
// Live-Stil (Paket 2): Tokens, Kontraste, eine Animation, reduced-motion, kein Rot für Live.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, hex, over, ratio } from './helpers/color';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');

const AAA = 7;
const NON_TEXT = 3;

// Die drei Token-Blöcke (Hell, Dunkel per Media-Query, Dunkel per data-theme)
const blocks = {
  Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
  'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --hoops-fg'),
  'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg'),
};
const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');

describe('Live-Tokens stehen in allen drei Blöcken', () => {
  it.each(Object.entries(blocks))('%s definiert --hoops-live-fill, --hoops-live-fg und --hoops-live-fg-on-dark', (_name, block) => {
    for (const name of ['--hoops-live-fill', '--hoops-live-fg', '--hoops-live-fg-on-dark']) {
      expect(block).toMatch(new RegExp(`${name}\\s*:`));
    }
  });
});

describe('Live-Kontraste (Text ≥ 7:1, Punkt/Fläche ≥ 3:1)', () => {
  // Flächen je Theme und Marke: Seite, flache Fläche, Hover, Auswahl
  const scopes = (block: string) => ({ BBV: `${block}\n${tokens}`, DBB: `${block}\n${dbb}\n${tokens}` });
  const surfaces = ['--hoops-surface', '--hoops-surface-2', '--hoops-hover-bg', '--hoops-selected-bg'];
  // Hinweis: der Dunkel-Block setzt --hoops-h-signal nicht selbst, die Marke liefert ihn (tokens.css)
  const withHue = (scope: string, brand: 'BBV' | 'DBB') => `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${scope}`;

  for (const [name, block] of Object.entries(blocks)) {
    for (const [brand, scope0] of Object.entries(scopes(block)) as ['BBV' | 'DBB', string][]) {
      const scope = withHue(scope0, brand);
      it(`${name}, ${brand}: --hoops-live-fg ≥ 7:1 und --hoops-live-fill ≥ 3:1 auf allen Seitenflächen`, () => {
        const fg = color('var(--hoops-live-fg)', scope);
        const fill = color('var(--hoops-live-fill)', scope);
        for (const surface of surfaces) {
          const bg = color(`var(${surface})`, scope);
          expect(ratio(fg, bg), `${surface} Text`).toBeGreaterThanOrEqual(AAA);
          expect(ratio(fill, bg), `${surface} Punkt`).toBeGreaterThanOrEqual(NON_TEXT);
        }
      });

      it(`${name}, ${brand}: --hoops-live-fg-on-dark ≥ 7:1 und --hoops-live-fill ≥ 3:1 auf Schwarz, Anthrazit #191919 und Frame dunkel`, () => {
        const onDark = color('var(--hoops-live-fg-on-dark)', scope);
        const fill = color('var(--hoops-live-fill)', scope);
        const darks = [color('var(--hoops-base-1000)', scope), hex('#191919'), color('var(--hoops-n-1000)', scope), color('var(--hoops-n-950)', scope)];
        for (const bg of darks) {
          expect(ratio(onDark, bg)).toBeGreaterThanOrEqual(AAA);
          expect(ratio(fill, bg)).toBeGreaterThanOrEqual(NON_TEXT);
        }
      });
    }
  }

  it('Grün bleibt Grün: Farbton 150 wie --hoops-ok-fill', () => {
    for (const block of Object.values(blocks)) {
      for (const name of ['--hoops-live-fill', '--hoops-live-fg-on-dark']) {
        expect(block).toMatch(new RegExp(`${name}:\\s*oklch\\([\\d.]+ [\\d.]+ 150\\)`));
      }
    }
    expect(blocks.Hell).toMatch(/--hoops-live-fg:\s*var\(--hoops-ok-text\)/);
  });
});

const ruleBody = (selector: string) => {
  const found = css.indexOf(`\n${selector} {`);
  expect(found, selector).toBeGreaterThan(-1);
  return css.slice(found, css.indexOf('}', found));
};

describe('Live-Stellen sprechen Grün, Rot bleibt Fehlern vorbehalten', () => {
  const LIVE_RULES = [
    '.hoops-live', '.hoops-live-dot', '.hoops-match-live', '.hoops-match-pulse', '.hoops-match--live', '.hoops-match--live::before',
    '.hoops-pbp-live', '.hoops-pbp-dot', '.hoops-topbar-live', '.hoops-topbar-live::before', '.hoops-crumb-dot', '.hoops-sch-live',
  ];
  it.each(LIVE_RULES)('%s nutzt weder --hoops-err-fill noch --hoops-err-text noch Chip-Rot', (selector) => {
    expect(ruleBody(selector)).not.toMatch(/--hoops-err-|--hoops-chip-err|oklch\([\d.]+ [\d.]+ 27\)/);
  });

  it('Text nutzt --hoops-live-fg (auf immer dunklen Flächen --hoops-live-fg-on-dark), Punkte --hoops-live-fill', () => {
    expect(ruleBody('.hoops-match-live')).toMatch(/color:\s*var\(--hoops-live-fg\)/);
    expect(ruleBody('.hoops-pbp-live')).toMatch(/color:\s*var\(--hoops-live-fg\)/);
    expect(ruleBody('.hoops-pbp-frame--dark .hoops-pbp-live')).toMatch(/color:\s*var\(--hoops-live-fg-on-dark\)/);
    expect(ruleBody('.hoops-topbar-live')).toMatch(/color:\s*var\(--hoops-live-fg-on-dark\)/);
    for (const dot of ['.hoops-match-pulse', '.hoops-pbp-dot', '.hoops-topbar-live::before', '.hoops-crumb-dot', '.hoops-live-dot']) {
      expect(ruleBody(dot)).toMatch(/background:\s*var\(--hoops-live-fill\)/);
    }
  });

  it('laufende Ergebniszahlen sind grün (Spielplan-Zeile, Raster-Zelle, Spielkarte)', () => {
    const rule = css.match(/\.hoops-sch-row\.is-live \.hoops-sch-score,\s*\.hoops-sg-game\.is-live \.hoops-sch-score,\s*\.hoops-match--live \.hoops-match-score\s*\{\s*color:\s*var\(--hoops-live-fg\)/);
    expect(rule).not.toBeNull();
  });

  it('Rahmen und Balken der Live-Spielkarte nutzen --hoops-live-fill', () => {
    expect(ruleBody('.hoops-match--live')).toMatch(/border-color:\s*var\(--hoops-live-fill\)/);
    expect(ruleBody('.hoops-match--live::before')).toMatch(/background:\s*var\(--hoops-live-fill\)/);
  });
});

describe('Zwei Animationen für alles Live: Punkt und Text', () => {
  const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  const keyframeBody = (name: string) => css.match(new RegExp(`@keyframes ${name}\\s*\\{([^@]*?\\}\\s*)\\}`))![1];
  const minOpacity = (name: string) => Math.min(...[...keyframeBody(name).matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1])));
  const groupFor = (animation: string) => {
    const m = css.match(new RegExp(`\\n((?:[^{}\\n]*,\\s)*[^{}\\n]*)\\{\\s*animation:\\s*${animation} ([\\d.]+)s ease-in-out infinite;\\s*\\}`));
    expect(m, animation).not.toBeNull();
    return { selectors: m![1].split(',').map((x) => x.trim()).filter(Boolean), seconds: Number(m![2]) };
  };
  const dot = groupFor('hoops-live-pulse');
  const text = groupFor('hoops-live-pulse-text');

  it('genau zwei Keyframes (Punkt und Text), die alten Einzel-Animationen sind weg', () => {
    expect(keyframes.filter((n) => n.startsWith('hoops-live-pulse')).sort()).toEqual(['hoops-live-pulse', 'hoops-live-pulse-text']);
    for (const old of ['hoops-mc-pulse', 'hoops-pbp-pulse', 'hoops-tb-pulse', 'hoops-pulse']) {
      expect(keyframes).not.toContain(old);
      expect(css).not.toContain(old);
    }
  });

  it('nur die Deckkraft ändert sich, mit Untergrenze je Typ: Punkt 0,35, Text 0,8', () => {
    for (const name of ['hoops-live-pulse', 'hoops-live-pulse-text']) {
      const body = keyframeBody(name);
      expect(body).toMatch(/0%,\s*100%\s*\{\s*opacity:\s*1;\s*\}/);
      expect(body).not.toMatch(/transform|box-shadow|scale|translate|color|background/);
    }
    expect(minOpacity('hoops-live-pulse')).toBe(0.35);
    expect(minOpacity('hoops-live-pulse-text')).toBe(0.8);
  });

  it('Dauer je Durchlauf aus dem CSS: 1,6 s, also unter 1 Hz (WCAG 2.3.1)', () => {
    for (const group of [dot, text]) {
      expect(group.seconds).toBe(1.6);
      expect(1 / group.seconds).toBeLessThan(1);
    }
  });

  it('Punkt-Selektoren und Text-Selektoren sind getrennt, Text nutzt nie die Punkt-Keyframe', () => {
    for (const selector of ['.hoops-live-pulse', '.hoops-live-dot', '.hoops-match-pulse', '.hoops-pbp-dot', '.hoops-crumb-dot', '.hoops-topbar-live::before']) {
      expect(dot.selectors).toContain(selector);
      expect(text.selectors).not.toContain(selector);
    }
    const textSelectors = ['.hoops-sch-row.is-live .hoops-sch-score', '.hoops-sg-game.is-live .hoops-sch-score', '.hoops-match--live .hoops-match-score'];
    for (const selector of textSelectors) {
      expect(text.selectors).toContain(selector);
      expect(dot.selectors).not.toContain(selector);
    }
  });

  it('keine andere Regel gibt Live-Elementen eine eigene Animation', () => {
    const decls = [...css.matchAll(/animation:\s*([^;}]+)/g)].map((m) => m[1].trim()).filter((d) => /pulse/.test(d));
    expect(decls.sort()).toEqual(['hoops-live-pulse 1.6s ease-in-out infinite', 'hoops-live-pulse-text 1.6s ease-in-out infinite']);
  });

  const reduced = () => {
    const media = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\n((?:[^{}\n]*,\n)*[^{}\n]*)\{\s*animation:\s*none;\s*\}\s*\}/);
    expect(media).not.toBeNull();
    return media![1].split(',').map((x) => x.trim()).filter(Boolean).sort();
  };
  const manual = () => {
    const attr = css.match(/\n((?::root\[data-motion="reduce"\] [^{}\n]*,\n)*:root\[data-motion="reduce"\] [^{}\n]*)\{\s*animation:\s*none;\s*\}/);
    expect(attr).not.toBeNull();
    return attr![1].split(',').map((x) => x.trim().replace(':root[data-motion="reduce"] ', '')).filter(Boolean).sort();
  };

  it('bei prefers-reduced-motion: reduce steht jede Live-Animation still', () => {
    expect(reduced()).toEqual([...dot.selectors, ...text.selectors].sort());
  });

  it('der Pause-Schalter data-motion="reduce" deckt dieselben Selektoren ab wie die Medienabfrage', () => {
    expect(manual()).toEqual(reduced());
  });
});

describe('Kontrast im Puls-Tal (Text bei Deckkraft 0,8 ≥ 4,5:1)', () => {
  const surfaces = ['--hoops-surface', '--hoops-surface-2', '--hoops-hover-bg', '--hoops-selected-bg'];
  const valley = Number(css.match(/@keyframes hoops-live-pulse-text\s*\{[^@]*?50%\s*\{\s*opacity:\s*([\d.]+)/)![1]);
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      it(`${name}, ${brand}: --hoops-live-fg gemischt mit der Fläche bleibt ≥ 4,5:1`, () => {
        const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${block}\n${brand === 'DBB' ? dbb + '\n' : ''}${tokens}`;
        const fg = color('var(--hoops-live-fg)', scope);
        for (const surface of surfaces) {
          const bg = color(`var(${surface})`, scope);
          expect(ratio(over(fg, bg, valley), bg), surface).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it('die Untergrenze 0,75 würde hell scheitern (Regression gegen zu tiefes Tal)', () => {
    const scope = `--hoops-h-signal: var(--hoops-h-amber);\n${blocks.Hell}\n${tokens}`;
    const fg = color('var(--hoops-live-fg)', scope);
    const worst = Math.min(...surfaces.map((s) => { const bg = color(`var(${s})`, scope); return ratio(over(fg, bg, 0.75), bg); }));
    expect(worst).toBeLessThan(4.5);
  });
});

describe('Nie nur Farbe: das Wort „Live“ bzw. „läuft“ bleibt', () => {
  it.each([
    ['svelte/TopBar.svelte', />Live</],
    ['react/TopBar.tsx', />Live</],
    ['svelte/MatchCard.svelte', /Live · /],
    ['react/MatchCard.tsx', /Live · /],
    ['svelte/PlayByPlay.svelte', /<\/span> Live</],
    ['react/PlayByPlay.tsx', /Live\s*<\/span>/],
    ['svelte/Table.svelte', /<\/span> Live</],
    ['react/Table.tsx', /Live\s*<\/span>|\/> Live/],
    ['svelte/ScheduleTable.svelte', /<\/span> Live</],
    ['react/ScheduleParts.tsx', /\/> Live/],
  ])('%s zeigt das Wort', (path, pattern) => {
    expect(read(path)).toMatch(pattern);
  });

  it('Screenreader-Ergebnis sagt „läuft“', () => {
    // der Text steht im Katalog (de: „läuft“), die Funktion liest ihn über den Schlüssel
    expect(read('js/schedule.js')).toContain("'schedule.live-spoken'");
  });
});
