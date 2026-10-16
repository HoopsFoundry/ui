// @vitest-environment node
// Segmentierte Tabs brechen bei schmalem Raum um und überschreiten die Breite ihres Behälters nie (WCAG 1.4.10, Umbruch bei 320 px);
// gemessen im Browser mit scripts/check-portal-seite.mjs (team.html bei 320 px: scrollWidth 354 vorher, 320 nachher).
import { describe, expect, it } from 'vitest';
import { bodyOf, mutate, read, rulesOf } from './helpers/mutation';

const rules = (css: string) => rulesOf(css);
const rule = (css: string) => bodyOf(rules(css), '.hoops-tabs--segmented');
const css = read('css/components.css');

const RULES: Record<string, (css: string) => boolean> = {
  'Segmentierte Tabs dürfen umbrechen': (c) => /flex-wrap:\s*wrap/.test(rule(c)),
  'Segmentierte Tabs sind höchstens so breit wie ihr Behälter': (c) => /max-width:\s*100%/.test(rule(c)),
  'Segmentierte Tabs bleiben inline-flex (Breite nach Inhalt, wenn Platz ist)': (c) => /display:\s*inline-flex/.test(rule(c)),
  'Die Schalter behalten ihre Mindesthöhe von 44 px (md)': (c) => /min-height:\s*44px/.test(bodyOf(rules(c), '.hoops-tabs--md .hoops-tab')),
};

describe('Segmentierte Tabs bei schmalem Raum', () => {
  it('der Quelltext erfüllt alle Regeln', () => {
    for (const [name, check] of Object.entries(RULES)) expect(check(css), name).toBe(true);
  });
  const MUTATIONS = [
    { rule: 'Segmentierte Tabs dürfen umbrechen', from: 'display: inline-flex; flex-wrap: wrap; max-width: 100%;', to: 'display: inline-flex; max-width: 100%;' },
    { rule: 'Segmentierte Tabs sind höchstens so breit wie ihr Behälter', from: 'flex-wrap: wrap; max-width: 100%; padding: 3px;', to: 'flex-wrap: wrap; padding: 3px;' },
    { rule: 'Segmentierte Tabs bleiben inline-flex (Breite nach Inhalt, wenn Platz ist)', from: '.hoops-tabs--segmented { display: inline-flex;', to: '.hoops-tabs--segmented { display: flex;' },
    { rule: 'Die Schalter behalten ihre Mindesthöhe von 44 px (md)', from: '.hoops-tabs--md .hoops-tab { min-height: 44px;', to: '.hoops-tabs--md .hoops-tab { min-height: 32px;' },
    { rule: 'Segmentierte Tabs dürfen umbrechen', from: 'flex-wrap: wrap; max-width: 100%; padding: 3px;', to: 'flex-wrap: nowrap; max-width: 100%; padding: 3px;' },
  ];
  for (const m of MUTATIONS) {
    it(`Mutation „${m.from.slice(0, 50)}…“ → Regel „${m.rule}“ kippt`, () => {
      expect(RULES[m.rule](mutate(css, m.from, m.to))).toBe(false);
    });
  }
  it('pills, underline und vertical bleiben unverändert', () => {
    expect(bodyOf(rules(css), '.hoops-tabs--pills')).toMatch(/flex-wrap:\s*wrap/);
    expect(bodyOf(rules(css), '.hoops-tabs')).not.toMatch(/max-width/);
  });
});
