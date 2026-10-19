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

// Kleinste Deckkraft, die das CSS einer laufenden Ergebniszahl gibt: direkt über opacity oder eine Keyframe-Animation, und zwar auf der Zahl
// selbst und auf ihren Behältern (Zeile, Raster-Zelle, Spielkarte; Deckkraft vererbt sich multiplikativ). Regeln für andere Zustände
// (abgesagt, beendet, gesperrt) zählen nicht. Ohne Animation und ohne opacity ist das 1.
const SCORE_SELECTORS = ['.hoops-sch-row.is-live .hoops-sch-score', '.hoops-sg-game.is-live .hoops-sch-score', '.hoops-match--live .hoops-match-score'];
const SCORE = /\.hoops-(?:sch|match)-score(?![\w-])/;
const CONTAINER = /\.hoops-(?:sch-row|sg-game|sg-result|match|match--live|match-body)(?![\w-])/;
const OTHER_STATE = /cancel|abgesagt|is-final|is-done|--final|:disabled|is-own/;
const keyframeBody = (name: string, source = css) => {
  const m = source.match(new RegExp(`@keyframes ${name}\\s*\\{([^@]*?\\}\\s*)\\}`));
  expect(m, `@keyframes ${name}`).not.toBeNull();
  return m![1];
};
const minOpacity = (name: string, source = css) => Math.min(1, ...[...keyframeBody(name, source).matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1])));
/** Deckkraft aus einer CSS-Quelle (Standard: css/components.css); exportiert für die Mutationsproben unten. */
const scoreAlpha = (source = css) => {
  const level = { score: 1, container: 1 };
  let scoreRules = 0;
  const plain = source.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of plain.matchAll(/(?<=^|[{}])\s*([^{}@]+)\{([^{}]*)\}/g)) {
    const body = m[2];
    const op = body.match(/(?:^|;|\s)opacity:\s*([\d.]+)/);
    const anim = body.match(/animation(?:-name)?:\s*([\w-]+)/);
    let alpha = op ? Number(op[1]) : 1;
    if (anim && anim[1] !== 'none' && plain.includes(`@keyframes ${anim[1]}`)) alpha = Math.min(alpha, minOpacity(anim[1], source));
    for (const raw of m[1].split(',')) {
      // Gegenstand der Regel: der letzte zusammengesetzte Selektor (nach dem letzten Kombinator)
      const subject = raw.trim().replace(/^:root\[data-motion="reduce"\] /, '').split(/\s+|>|~|\+/).filter(Boolean).pop() ?? '';
      if (SCORE.test(subject)) {
        if (body.includes('color: var(--hoops-live-fg)')) scoreRules += 1;
        if (!OTHER_STATE.test(raw)) level.score = Math.min(level.score, alpha);
      } else if (CONTAINER.test(subject) && !OTHER_STATE.test(raw)) {
        level.container = Math.min(level.container, alpha);
      }
    }
  }
  // Schutz gegen eine leere Suche: die Farbregel der Live-Zahlen muss gefunden werden
  expect(scoreRules).toBeGreaterThan(0);
  return level.score * level.container;
};

describe('Deckkraft der Live-Zahlen: auch Behälter zählen (Review K1)', () => {
  const live = '.hoops-sch-row.is-live .hoops-sch-score, .hoops-sg-game.is-live .hoops-sch-score, .hoops-match--live .hoops-match-score { color: var(--hoops-live-fg); }';
  it('Ausgangslage: 1', () => expect(scoreAlpha()).toBe(1));
  it.each([
    ['.hoops-sg-game.is-live { opacity: 0.85; }', 0.85],
    ['.hoops-sch-row.is-live { opacity: 0.9; }', 0.9],
    ['.hoops-match--live { animation: x 1s infinite; }\n@keyframes x { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }', 0.8],
    ['.hoops-match--live .hoops-match-score { opacity: 0.95; }', 0.95],
  ])('Mutation %s wird erkannt', (rule, expected) => {
    expect(scoreAlpha(`${live}\n${rule}`)).toBeCloseTo(expected, 5);
  });
  it('Regeln für andere Zustände zählen nicht (abgesagte Spiele dürfen blass sein)', () => {
    expect(scoreAlpha(`${live}\n.hoops-sg-game.is-cancelled { opacity: 0.6; }`)).toBe(1);
  });
});

describe('Eine Animation für alles Live: nur der Punkt pulsiert', () => {
  const keyframes = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]);
  const groupFor = (animation: string) => {
    const m = css.match(new RegExp(`\\n((?:[^{}\\n]*,\\s)*[^{}\\n]*)\\{\\s*animation:\\s*${animation} ([\\d.]+)s ease-in-out infinite;\\s*\\}`));
    expect(m, animation).not.toBeNull();
    return { selectors: m![1].split(',').map((x) => x.trim()).filter(Boolean), seconds: Number(m![2]) };
  };
  const dot = groupFor('hoops-live-pulse');

  it('genau eine Live-Keyframe, die alten Einzel-Animationen und die Text-Keyframe sind weg', () => {
    expect(keyframes.filter((n) => n.startsWith('hoops-live-pulse'))).toEqual(['hoops-live-pulse']);
    for (const old of ['hoops-mc-pulse', 'hoops-pbp-pulse', 'hoops-tb-pulse', 'hoops-pulse', 'hoops-live-pulse-text']) {
      expect(keyframes).not.toContain(old);
      expect(css).not.toContain(old);
    }
  });

  it('nur die Deckkraft ändert sich, Untergrenze 0,35', () => {
    const body = keyframeBody('hoops-live-pulse');
    expect(body).toMatch(/0%,\s*100%\s*\{\s*opacity:\s*1;\s*\}/);
    expect(body).not.toMatch(/transform|box-shadow|scale|translate|color|background/);
    expect(minOpacity('hoops-live-pulse')).toBe(0.35);
  });

  it('Dauer je Durchlauf aus dem CSS: 1,6 s, also unter 1 Hz (WCAG 2.3.1)', () => {
    expect(dot.seconds).toBe(1.6);
    expect(1 / dot.seconds).toBeLessThan(1);
  });

  it('die Punkt-Selektoren pulsieren, die Ergebniszahlen nicht', () => {
    for (const selector of ['.hoops-live-pulse', '.hoops-live-dot', '.hoops-match-pulse', '.hoops-pbp-dot', '.hoops-crumb-dot', '.hoops-topbar-live::before']) {
      expect(dot.selectors).toContain(selector);
    }
    for (const selector of SCORE_SELECTORS) expect(dot.selectors).not.toContain(selector);
    expect(scoreAlpha()).toBe(1);
  });

  it('keine andere Regel gibt Live-Elementen eine eigene Animation', () => {
    const decls = [...css.matchAll(/animation:\s*([^;}]+)/g)].map((m) => m[1].trim()).filter((d) => /pulse/.test(d));
    expect(decls).toEqual(['hoops-live-pulse 1.6s ease-in-out infinite']);
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
    expect(reduced()).toEqual([...dot.selectors].sort());
  });

  it('der Pause-Schalter data-motion="reduce" deckt dieselben Selektoren ab wie die Medienabfrage', () => {
    expect(manual()).toEqual(reduced());
  });
});

describe('Ergebniszahlen laufender Spiele bleiben jederzeit ≥ 7:1 (Lückenplan 2.6)', () => {
  // Gerechnet mit der kleinsten Deckkraft, die das CSS der Zahl gibt (Animation oder opacity); jede Pulsierung
  // unter etwa 0,96 lässt hell mindestens eine Fläche unter 7:1 fallen und macht diesen Test rot.
  const surfaces = ['--hoops-surface', '--hoops-surface-2', '--hoops-hover-bg', '--hoops-selected-bg'];
  const alpha = scoreAlpha();
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      it(`${name}, ${brand}: --hoops-live-fg bei kleinster Deckkraft ≥ 7:1 auf allen Seitenflächen`, () => {
        const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${block}\n${brand === 'DBB' ? dbb + '\n' : ''}${tokens}`;
        const fg = color('var(--hoops-live-fg)', scope);
        for (const surface of surfaces) {
          const bg = color(`var(${surface})`, scope);
          expect(ratio(over(fg, bg, alpha), bg), surface).toBeGreaterThanOrEqual(AAA);
        }
      });
    }
  }

  it('Regression: der frühere Text-Puls bis 0,8 läge hell unter 7:1 (und schon 0,95 reicht nicht)', () => {
    const scope = `--hoops-h-signal: var(--hoops-h-amber);\n${blocks.Hell}\n${tokens}`;
    const fg = color('var(--hoops-live-fg)', scope);
    for (const a of [0.8, 0.95]) {
      const worst = Math.min(...surfaces.map((s) => { const bg = color(`var(${s})`, scope); return ratio(over(fg, bg, a), bg); }));
      expect(worst).toBeLessThan(AAA);
    }
  });
});

describe('Nie nur Farbe: das Wort „Live“ bzw. „läuft“ bleibt', () => {
  // das Wort steht im Katalog (`common.live`), die Dateien lesen es über den Schlüssel und zeigen es sichtbar im Text (nicht aria-hidden)
  it.each([
    ['svelte/TopBar.svelte', /<span class="hoops-topbar-live">\{i18n\.t\('common\.live'\)\}<\/span>/],
    ['react/TopBar.tsx', /<span className="hoops-topbar-live">\{i18n\.t\('common\.live'\)\}<\/span>/],
    ['svelte/MatchCard.svelte', /\{i18n\.t\('common\.live'\)\} · /],
    ['react/MatchCard.tsx', /\{i18n\.t\('common\.live'\)\} · /],
    ['svelte/PlayByPlay.svelte', /<\/span> \{i18n\.t\('common\.live'\)\}</],
    ['react/PlayByPlay.tsx', /\/> \{i18n\.t\('common\.live'\)\}/],
    ['svelte/Table.svelte', /<\/span> \{i18n\.t\('common\.live'\)\}</],
    ['react/Table.tsx', /\/> \{i18n\.t\('common\.live'\)\}/],
    ['svelte/ScheduleTable.svelte', /<\/span> \{i18n\.t\('common\.live'\)\}</],
    ['react/ScheduleParts.tsx', /\/> \{i18n\.t\('common\.live'\)\}/],
  ])('%s zeigt das Wort', (path, pattern) => {
    expect(read(path)).toMatch(pattern);
  });

  it('Screenreader-Ergebnis sagt „läuft“', () => {
    // der Text steht im Katalog (de: „läuft“), die Funktion liest ihn über den Schlüssel
    expect(read('js/schedule.js')).toContain("'schedule.live-spoken'");
  });
});
