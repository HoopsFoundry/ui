// @vitest-environment node
// MatchCard: Der Trikotpunkt hat einen Rand in --hoops-mute (wie bei der VenueCard), damit er im Dunkelmodus sichtbar bleibt
// (--hoops-team-heim allein erreicht dort nur 1,57:1 bis 2,66:1). Der Rand muss ≥ 3:1 auf der Kartenfläche erreichen (hell/dunkel × BBV/DBB).
// Die Regeln laufen auch gegen verfälschten Quelltext und müssen dann kippen (Mutationsprobe).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blockOf, color, ratio } from './helpers/color';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');

const body = (text: string, selector: string) => {
  const at = text.indexOf(`${selector} {`);
  return at < 0 ? '' : text.slice(at, text.indexOf('}', at));
};
export const rules = (text: string) => {
  const dot = body(text, '.hoops-match-dot');
  const gast = body(text, '.hoops-match-team--gast .hoops-match-dot');
  return {
    'Rand 1px in --hoops-mute': /border:\s*1px solid var\(--hoops-mute\)/.test(dot),
    'Größe bleibt 12px (border-box)': /box-sizing:\s*border-box/.test(dot) && /width:\s*12px/.test(dot) && /height:\s*12px/.test(dot),
    'Gast behält die Gastfarbe, ohne den Rand zu überschreiben': /background:\s*var\(--hoops-team-gast/.test(gast) && !/border/.test(gast),
  };
};

describe('MatchCard: Trikotpunkt', () => {
  it.each(Object.entries(rules(css)))('%s', (_n, ok) => expect(ok).toBe(true));

  it.each([
    ['Rand entfällt', 'border: 1px solid var(--hoops-mute); ', ''],
    ['Rand in anderer Farbe', 'border: 1px solid var(--hoops-mute)', 'border: 1px solid var(--hoops-line)'],
    ['kein border-box', 'box-sizing: border-box; ', ''],
  ])('Mutation „%s“ kippt eine Regel', (_n, from, to) => {
    const at = css.indexOf('.hoops-match-dot {');
    expect(css.indexOf(from, at)).toBeGreaterThan(-1);
    const mutated = css.slice(0, at) + css.slice(at).replace(from, to);
    expect(Object.values(rules(mutated)).every(Boolean)).toBe(false);
  });

  const blocks = {
    Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
    'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --hoops-fg'),
    'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg'),
  };
  const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      it(`Rand (--hoops-mute) ≥ 3:1 auf der Kartenfläche: ${name}, ${brand}`, () => {
        const scope = `--hoops-h-signal: var(${brand === 'BBV' ? '--hoops-h-amber' : '--hoops-h-gold'});\n${block}\n${brand === 'DBB' ? dbb : ''}\n${tokens}`;
        const c = (token: string) => color(`var(${token})`, scope);
        for (const surface of ['--hoops-surface', '--hoops-surface-2']) expect(ratio(c('--hoops-mute'), c(surface)), surface).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
