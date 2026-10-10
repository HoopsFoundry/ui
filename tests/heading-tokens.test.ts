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

const FRAME = (d: string) => `var(--dss-frame-title-size, var(--dss-title-size, ${d}))`;
const CARD = (d: string) => `var(--dss-card-title-size, var(--dss-title-size, ${d}))`;
const WEIGHT = (d: string) => `var(--dss-title-weight, ${d})`;
const LEADING = (d: string) => `var(--dss-title-leading, ${d})`;

// Selektor: [Größe, Gewicht, Zeilenhöhe]; die Vorgaben sind die Werte vor Einführung der Tokens
const TITLES: Record<string, [string, string, string]> = {
  '.dss-frame-title': [FRAME('var(--fs-body)'), WEIGHT('600'), LEADING('inherit')],
  '.dss-pbp-title': [FRAME('var(--fs-body)'), WEIGHT('600'), LEADING('inherit')],
  '.dss-pc-nm': [CARD('var(--fs-body-lg)'), WEIGHT('600'), LEADING('inherit')],
  '.dss-pc-hero .dss-pc-nm': [CARD('var(--fs-hero)'), WEIGHT('700'), LEADING('1.05')],
  '.dss-empty-title': [CARD('var(--fs-body-lg)'), WEIGHT('700'), LEADING('inherit')],
  '.dss-team-nm': [CARD('var(--fs-body-lg)'), WEIGHT('600'), LEADING('1.2')],
  '.dss-team--compact .dss-team-nm': [CARD('var(--fs-body)'), WEIGHT('600'), LEADING('1.2')],
  '.dss-league-title': [CARD('var(--fs-h3)'), WEIGHT('700'), LEADING('1.2')],
  '.dss-league--compact .dss-league-title': [CARD('var(--fs-body-lg)'), WEIGHT('700'), LEADING('1.2')],
  '.dss-m-title': ['var(--dss-title-size, var(--fs-h3))', WEIGHT('700'), LEADING('inherit')],
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
    for (const name of ['--dss-title-size', '--dss-title-weight', '--dss-title-leading', '--dss-frame-title-size', '--dss-card-title-size']) {
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
