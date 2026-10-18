// @vitest-environment node
// Lückenplan 2.3: die axe- und Regressionsmatrix über alle Docs-Seiten (scripts/check-docs-axe.mjs) und der Befund dazu (TopBar in schmalen Spalten).
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const script = read('scripts/check-docs-axe.mjs');
const css = read('css/components.css');

describe('axe-Matrix der Docs-Seiten', () => {
  it('liest alle Docs-Seiten aus index.json, Standard: beide Marken, hell und dunkel', () => {
    expect(script).toMatch(/e\.type === 'docs'/);
    expect(script).toContain("args.brands ?? 'bbv,dbb'");
    expect(script).toContain("args.themes ?? 'Light,Dark'");
    expect(script).toContain('color-contrast-enhanced');
    expect(script).toContain('wcag2aaa');
  });
  it('ist CI-fähig: Exit-Code 1 bei Befunden, 2 ohne Build, JSON-Ausgabe auf Wunsch', () => {
    expect(script).toMatch(/process\.exitCode = failures\.length === 0 \? 0 : 1/);
    expect(script).toMatch(/process\.exit\(2\)/);
    expect(script).toContain('args.json');
  });
});

describe('Befund aus der Matrix: dunkle TopBar schneidet in schmalen Spalten nichts ab', () => {
  const rule = (selector: string) => {
    const i = css.indexOf(`\n${selector} {`);
    expect(i, selector).toBeGreaterThan(-1);
    return css.slice(i, css.indexOf('}', i));
  };
  it('die Leiste hat eine Mindesthöhe statt einer festen Höhe', () => {
    expect(rule('.hoops-topbar.hoops-topbar--dark')).toMatch(/min-height:\s*56px/);
    expect(rule('.hoops-topbar.hoops-topbar--dark')).not.toMatch(/[^-]height:\s*56px/);
  });
  it('der Kontext (Spiel, Stand, Uhr) darf umbrechen und schrumpfen', () => {
    expect(rule('.hoops-topbar-ctx')).toMatch(/flex-wrap:\s*wrap/);
    expect(rule('.hoops-topbar-ctx')).toMatch(/min-width:\s*0/);
  });
});
