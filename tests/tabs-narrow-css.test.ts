// @vitest-environment node
// Segmentierte Tabs und Tabs mit Unterstrich brechen bei schmalem Raum um und überschreiten die Breite ihres Behälters nie (WCAG 1.4.10, Umbruch bei 320 px);
// gemessen im Browser mit scripts/check-portal-seite.mjs (team.html bei 320 px: scrollWidth 354 vorher, 320 nachher). Unterstrich-Tabs („Mannschaften 7“, „Halle“,
// „Presse“, zusammen etwa 308 px) liefen bei 320 px über den Rand (+2 px bei Fenster 320, +16 px in der Doku-Vorschau): `flex-wrap: wrap` wie bei den anderen.
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

describe('Tabs mit Unterstrich bei schmalem Raum', () => {
  const underline = (c: string) => bodyOf(rules(c), '.hoops-tabs--underline');
  const RULES_U: Record<string, (css: string) => boolean> = {
    'Unterstrich-Tabs dürfen umbrechen': (c) => /flex-wrap:\s*wrap/.test(underline(c)),
    'Unterstrich-Tabs behalten die Linie unter der Leiste': (c) => /border-bottom:\s*1px solid var\(--hoops-line\)/.test(underline(c)),
    'Die Schalter bleiben einzeilig (nowrap), nur die Leiste bricht um': (c) => /white-space:\s*nowrap/.test(bodyOf(rules(c), '.hoops-tab')),
  };
  it('der Quelltext erfüllt alle Regeln', () => {
    for (const [name, check] of Object.entries(RULES_U)) expect(check(css), name).toBe(true);
  });
  const MUTATIONS_U = [
    { rule: 'Unterstrich-Tabs dürfen umbrechen', from: '.hoops-tabs--underline { flex-wrap: wrap;', to: '.hoops-tabs--underline {' },
    { rule: 'Unterstrich-Tabs dürfen umbrechen', from: '.hoops-tabs--underline { flex-wrap: wrap;', to: '.hoops-tabs--underline { flex-wrap: nowrap;' },
    { rule: 'Unterstrich-Tabs behalten die Linie unter der Leiste', from: 'border-bottom: 1px solid var(--hoops-line); gap: var(--hoops-space-1); }', to: 'gap: var(--hoops-space-1); }' },
  ];
  for (const m of MUTATIONS_U) {
    it(`Mutation „${m.to.slice(0, 50)}“ → Regel „${m.rule}“ kippt`, () => {
      expect(RULES_U[m.rule](mutate(css, m.from, m.to))).toBe(false);
    });
  }
});
