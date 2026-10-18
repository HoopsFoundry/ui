// @vitest-environment node
// Lückenplan 2.5: Storybook-Oberfläche. Wo Storybooks Standardfarben auf unseren Doku-Seiten (unsere Flächen, unsere Texte) unter die
// Kontrastgrenze fallen, setzt .storybook/storybook.css die Token der Seite. Was Storybook selbst erzeugt (Manager, Landmarken des
// Docs-Rahmens, Schalter „Show code“, Syntaxfarben), ist im Lückenplan und in arc42 Kapitel 11 dokumentiert, nicht überschrieben.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { blockOf, color, hex, ratio } from './helpers/color';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const sb = read('.storybook/storybook.css');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const AAA = 7;

const light = blockOf(css, '/* ── Semantische Aliase · Light');
const dark = blockOf(css, ':root[data-theme="dark"] {\n  --hoops-fg');
const tokensDark = blockOf(tokens, ':root[data-theme="dark"] {');
const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
const scopes = {
  'Hell, BBV': `${light}\n${tokens}`,
  'Hell, DBB': `${light}\n${dbb}\n${tokens}`,
  'Dunkel, BBV': `${dark}\n${tokensDark}\n${tokens}`,
  'Dunkel, DBB': `${dark}\n${tokensDark}\n${dbb}\n${tokens}`,
};

describe('Storybook-Rahmen: unsere Inhalte nehmen die Token der Seite', () => {
  it('Links aus dem MDX-Text (.sbdocs-a) nutzen --hoops-link und sind unterstrichen', () => {
    expect(sb).toMatch(/\.sbdocs-content a\.sbdocs-a:not\(\.docs-story \*\)\s*\{[^}]*color:\s*var\(--hoops-link\)[^}]*text-decoration:\s*underline/);
  });
  it('Inline-Code nutzt Text- und Flächenfarbe der Seite', () => {
    expect(sb).toMatch(/\.sbdocs-content code:not\(pre code\):not\(\.docs-story \*\)\s*\{[^}]*color:\s*var\(--hoops-page-fg\)[^}]*background:\s*var\(--hoops-page-surface-2\)/);
  });
  it('die Objekt-Steuerelemente der Argumenttabelle nutzen --hoops-link (auf der dunklen Tabellenfläche verfehlte Storybook-Blau AA)', () => {
    expect(sb).toMatch(/\.rejt-accordion-button,\s*\n?\.sbdocs \.docblock-argstable\.docblock-argstable \.rejt-name\s*\{\s*color:\s*var\(--hoops-link\)/);
  });

  for (const [name, scope] of Object.entries(scopes)) {
    it(`${name}: --hoops-link auf --hoops-page-bg und Inline-Code auf --hoops-page-surface-2 ≥ 7:1`, () => {
      const bg = color('var(--hoops-page-bg)', scope);
      expect(ratio(color('var(--hoops-link)', scope), bg)).toBeGreaterThanOrEqual(AAA);
      expect(ratio(color('var(--hoops-page-fg)', scope), color('var(--hoops-page-surface-2)', scope))).toBeGreaterThanOrEqual(AAA);
    });
  }

  it('Storybooks eigene Farben reichten nicht (Regression: gemessen 4,58:1 hell, 4,38:1 auf Schwarz)', () => {
    const sbBlue = hex('#006deb');
    expect(ratio(sbBlue, color('var(--hoops-page-bg)', scopes['Hell, BBV']))).toBeLessThan(AAA);
    expect(ratio(sbBlue, [0, 0, 0])).toBeLessThan(4.5);
  });
});
