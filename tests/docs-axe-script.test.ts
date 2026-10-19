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
  it('prüft die Vorschau-Iframes (Preview/StickyPreview) mit eigenem axe im Rahmen, jedes Beispiel und jede Breite (Storybook aufräumen)', () => {
    // die Seite selbst ohne Iframes (iframes: false), die Iframes einzeln mit denselben Regeln
    expect(script).toContain('iframes: false');
    expect(script).toContain("runAxe(frame, '#storybook-root')");
    expect(script).toContain("runAxe(page, '.sbdocs-content')");
    // jedes Beispiel einer feststehenden Vorschau über die Liste, die Iframes laden lazy
    expect(script).toContain('hoops-sp-pick');
    expect(script).toContain("scrollIntoView({ block: 'center' })");
    expect(script).toContain("reducedMotion: 'reduce'");
    expect(script).toMatch(/classList\.contains\('sb-show-main'\)/);
    // Breiten: die erste für alle Seiten, weitere für Seiten mit Vorschauen; Standard voll und handy
    expect(script).toContain("args.breiten ?? 'voll,handy'");
    expect(script).toContain('breite:${breite}');
    expect(script).toContain("kind: 'seitliches Scrollen (Vorschau)'");
    expect(script).toContain("kind: 'Story-Fehler (Vorschau)'");
    expect(script).toContain('frameRuns');
  });
  it('prüft Reflow: --reflow nimmt 900 und 320 px dazu, bekannte Überläufe von Inline-Beispielen stehen in einer Liste und werden ausgegeben', () => {
    expect(script).toContain("args.reflow === 'true' ? '1280,900,420,320'");
    expect(script).toContain('KNOWN_CANVAS_OVERFLOW');
    expect(script).toContain('bekannteUeberlaeufeInlineBeispiele');
    for (const page of ['components-accordion--docs', 'components-kennzahlen--docs', 'components-map--docs', 'components-appnav--docs']) expect(script).toContain(page);
    // Spielplan, Button und TextInput sind behoben und dürfen nicht in der Ausnahmeliste stehen
    expect(script.slice(script.indexOf('KNOWN_CANVAS_OVERFLOW = ['), script.indexOf('];', script.indexOf('KNOWN_CANVAS_OVERFLOW = [')))).not.toMatch(/spielplan|button|textinput/);
    const chapter = read('docs/architecture/sections/11-risks-and-technical-debt.adoc');
    for (const part of ['KNOWN_CANVAS_OVERFLOW', 'Lückenplan 3.11', '--reflow']) expect(chapter, part).toContain(part);
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
