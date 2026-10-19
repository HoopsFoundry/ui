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
  it('filtert Storybook nur am Element über die enge Liste, nicht über Selektortexte (Review W1)', () => {
    expect(script).toContain("import { STORYBOOK_CHROME } from './docs-axe-chrome.mjs'");
    expect(script).toContain('elementRef: true');
    expect(script).toMatch(/n\.element\?\.closest\?\.\(chromeSel\)/);
    expect(script).not.toMatch(/\\\.css-\[a-z0-9\]\+/);
    expect(script).toContain("args['extra-css']");
  });
  it('meldet Stories, die beim Rendern werfen (Storybook setzt den Stapel als <pre> in die Vorschau)', () => {
    expect(script).toContain("document.querySelectorAll('.docs-story .sb-story > pre')");
    expect(script).toContain("kind: 'Story-Fehler'");
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
  it('die Leiste hat eine Mindesthöhe statt einer festen Höhe: 44 px + 2 × 6 px Innenabstand = 56 px (Review K2)', () => {
    const body = rule('.hoops-topbar.hoops-topbar--dark');
    const min = Number(body.match(/min-height:\s*(\d+)px/)![1]);
    const [block] = body.match(/padding:\s*(\d+)px\s+\d+px/)!.slice(1).map(Number);
    expect(block).toBeGreaterThanOrEqual(6);
    expect(min + 2 * block).toBe(56);
    expect(body).not.toMatch(/(?:^|[\s;])height:/);
    expect(body).not.toMatch(/box-sizing/);
  });
  it('der Kontext (Spiel, Stand, Uhr) darf umbrechen und schrumpfen', () => {
    expect(rule('.hoops-topbar-ctx')).toMatch(/flex-wrap:\s*wrap/);
    expect(rule('.hoops-topbar-ctx')).toMatch(/min-width:\s*0/);
  });
});
