// @vitest-environment node
// Größe der Komponentenüberschriften: hängt an der Klasse und an Tokens, nie am Elementnamen (h2/h3/h4 sehen gleich aus).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const css = read('../css/components.css').replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = read('../tokens/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');

/** Alle Regeln als [Selektor, Rumpf]; @media-Blöcke werden aufgelöst (Rumpf der inneren Regeln). */
function rules(source: string): [string, string][] {
  const out: [string, string][] = [];
  for (const m of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) out.push([m[1].trim(), m[2]]);
  return out;
}
const RULES = rules(css);
const body = (selector: string): string => {
  const hit = RULES.filter(([s]) => s === selector);
  expect(hit.length, `Regel ${selector}`).toBeGreaterThan(0);
  return hit.map(([, b]) => b).join(';');
};
const decl = (selector: string, prop: string): string | undefined =>
  [...body(selector).matchAll(new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`, 'g'))].map((m) => m[1].trim()).pop();

const FRAME = (d: string) => `var(--hoops-frame-title-size, var(--hoops-title-size, ${d}))`;
const CARD = (d: string) => `var(--hoops-card-title-size, var(--hoops-title-size, ${d}))`;
const WEIGHT = (d: string) => `var(--hoops-title-weight, ${d})`;
const LEADING = (d: string) => `var(--hoops-title-leading, ${d})`;

// Selektor: [Größe, Gewicht, Zeilenhöhe]; die Vorgaben sind die Werte vor Einführung der Tokens
const TITLES: Record<string, [string, string, string]> = {
  '.hoops-frame-title': [FRAME('var(--hoops-fs-body)'), WEIGHT('600'), LEADING('inherit')],
  '.hoops-pbp-title': [FRAME('var(--hoops-fs-body)'), WEIGHT('600'), LEADING('inherit')],
  '.hoops-pc-nm': [CARD('var(--hoops-fs-body-lg)'), WEIGHT('600'), LEADING('inherit')],
  '.hoops-pc-hero .hoops-pc-nm': [CARD('var(--hoops-fs-hero)'), WEIGHT('700'), LEADING('1.05')],
  '.hoops-empty-title': [CARD('var(--hoops-fs-body-lg)'), WEIGHT('700'), LEADING('inherit')],
  '.hoops-team-nm': [CARD('var(--hoops-fs-body-lg)'), WEIGHT('600'), LEADING('1.2')],
  '.hoops-team--compact .hoops-team-nm': [CARD('var(--hoops-fs-body)'), WEIGHT('600'), LEADING('1.2')],
  '.hoops-league-title': [CARD('var(--hoops-fs-h3)'), WEIGHT('700'), LEADING('1.2')],
  '.hoops-league--compact .hoops-league-title': [CARD('var(--hoops-fs-body-lg)'), WEIGHT('700'), LEADING('1.2')],
  '.hoops-m-title': ['var(--hoops-title-size, var(--hoops-fs-h3))', WEIGHT('700'), LEADING('inherit')],
};

describe('Überschriften: Größe über Tokens mit Rückfall auf die bisherigen Werte', () => {
  for (const [selector, [size, weight, leading]] of Object.entries(TITLES)) {
    it(`${selector}: Größe, Gewicht und Zeilenhöhe`, () => {
      expect(decl(selector, 'font-size')).toBe(size);
      expect(decl(selector, 'font-weight')).toBe(weight);
      expect(decl(selector, 'line-height')).toBe(leading);
    });
  }

  it('die Tokens sind nirgends fest vorbelegt (sonst gäbe es keinen Rückfall auf den Wert je Komponente)', () => {
    for (const name of ['--hoops-title-size', '--hoops-title-weight', '--hoops-title-leading', '--hoops-frame-title-size', '--hoops-card-title-size']) {
      expect(css, name).not.toMatch(new RegExp(`${name}\\s*:`));
      expect(tokens, name).not.toMatch(new RegExp(`${name}\\s*:`));
    }
  });

  it('die Größe hängt nie am Elementnamen: kein h1 bis h6 als Selektor mit Größe, Gewicht oder Zeilenhöhe', () => {
    const offenders = RULES.filter(([selector, b]) => /(^|[\s,>+~(])h[1-6](?![-\w])/.test(selector) && /(font-size|font-weight|font\s*:|line-height)/.test(b)).map(([s]) => s);
    expect(offenders).toEqual([]);
  });

  it('kein Selektor für Überschriftenklassen nennt einen Elementnamen (Klasse allein genügt)', () => {
    for (const selector of Object.keys(TITLES)) expect(selector).not.toMatch(/\bh[1-6]\b/);
  });
});
