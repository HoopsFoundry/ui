// @vitest-environment node
// CSS des Accordions: Klassen, Tokens mit Rückfall, Animation aus bei „Bewegung reduzieren“ und data-motion, Druck, Fokus, Zielgröße, Kontraste.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { blockOf, color, ratio } from './helpers/color';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const css = read('css/components.css');
const tokens = read('tokens/tokens.css');
const START = css.indexOf('/* ── Accordion');
const acc = css.slice(START);

const rule = (selector: string) => {
  const at = acc.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`Regel nicht gefunden: ${selector}`);
  return acc.slice(acc.indexOf('{', at) + 1, acc.indexOf('}', at));
};
const mediaBlock = (head: string) => {
  const at = acc.indexOf(head);
  if (at < 0) throw new Error(`Block nicht gefunden: ${head}`);
  let depth = 0;
  for (let i = acc.indexOf('{', at); i < acc.length; i++) {
    if (acc[i] === '{') depth++;
    if (acc[i] === '}' && --depth === 0) return acc.slice(at, i + 1);
  }
  throw new Error('Block nicht geschlossen');
};

describe('Accordion-CSS: Klassen und Tokens', () => {
  it('der Abschnitt ist vorhanden', () => expect(START).toBeGreaterThan(0));
  it.each([
    'dss-acc', 'dss-acc--card', 'dss-acc--flat', 'dss-acc--nested', 'dss-acc--sticky', 'dss-acc-item', 'dss-acc-title', 'dss-acc-trigger', 'dss-acc-label',
    'dss-acc-meta', 'dss-acc-chevron', 'dss-acc-panel', 'dss-acc-panel-inner', 'dss-acc-body', 'dss-acc-tools', 'dss-acc-bar',
    'dss-acc-nav', 'dss-acc-nav-list', 'dss-acc-nav-link', 'dss-acc-nav-toggle',
  ])('definiert .%s', (cls) => {
    expect(acc).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
  });
  it('Karte ist die Grundform des Bereichs (Rand, Radius, Schatten), flach nimmt sie weg', () => {
    const item = rule('.dss-acc-item');
    expect(item).toMatch(/border:\s*1px solid var\(--dss-line\)/);
    expect(item).toMatch(/border-radius:\s*var\(--dss-acc-radius,\s*var\(--radius-lg\)\)/);
    expect(item).toMatch(/box-shadow:\s*var\(--shadow-sm\)/);
    const flat = rule('.dss-acc--flat > .dss-acc-item');
    expect(flat).toMatch(/border-radius:\s*0/);
    expect(flat).toMatch(/box-shadow:\s*none/);
    expect(flat).toMatch(/border:\s*0/);
  });
  it('Tokens werden nur mit Rückfall gelesen und nicht auf :root vorbelegt', () => {
    expect(acc).toMatch(/gap:\s*var\(--dss-acc-gap,\s*12px\)/);
    expect(acc).toMatch(/padding:\s*var\(--dss-acc-pad,\s*12px 18px\)/);
    expect(acc).toMatch(/var\(--dss-acc-radius,\s*var\(--radius-lg\)\)/);
    expect(acc).toMatch(/font-size:\s*var\(--dss-acc-title-size,\s*var\(--dss-card-title-size,\s*var\(--dss-title-size,\s*var\(--fs-body-lg\)\)\)\)/);
    expect(acc).toMatch(/top:\s*var\(--dss-acc-sticky-top,\s*0px\)/);
    for (const token of ['--dss-acc-gap', '--dss-acc-pad', '--dss-acc-radius', '--dss-acc-title-size', '--dss-acc-sticky-top']) {
      expect(css, token).not.toMatch(new RegExp(`${token}\\s*:`));
      expect(tokens, token).not.toMatch(new RegExp(`${token}\\s*:`));
    }
  });
  it('Elementselektoren h1 bis h6 setzen keine Größen (die Klasse trägt die Größe)', () => {
    expect(acc).not.toMatch(/(^|[\s,}])h[1-6]\s*[,{]/);
  });
  it('der Kopf ist mindestens 44 px hoch; Nav-Link und Nav-Schalter ebenso', () => {
    expect(rule('.dss-acc-trigger')).toMatch(/min-height:\s*44px/);
    expect(rule('.dss-acc-nav-link')).toMatch(/min-height:\s*44px/);
    expect(rule('.dss-acc-nav-toggle')).toMatch(/min-height:\s*44px/);
    expect(acc).toMatch(/\.dss-acc--nested > \.dss-acc-item > \.dss-acc-title > \.dss-acc-trigger[^{]*\{[^}]*min-height:\s*44px/);
  });
  it('verwendet keine nackten --*-text/--*-soft-Farben (nur --dss-*)', () => {
    expect(acc).not.toMatch(/var\(--(ok|err|warn|info)-(text|soft)\)/);
    expect(acc).not.toMatch(/var\(--[a-z]+-(text|soft)\)/);
  });
  it('Elemente mit Hintergrund nutzen semantische Aliase', () => {
    for (const sel of ['.dss-acc-item', '.dss-acc-nav-link', '.dss-acc-nav-toggle']) expect(rule(sel)).toMatch(/background:\s*var\(--dss-/);
  });
});

describe('Accordion-CSS: Fokus und Zustände', () => {
  it('Fokus gestrichelt (--ring-style), innen mit -3px am Kopf', () => {
    expect(rule('.dss-acc-trigger:focus-visible')).toMatch(/outline:\s*var\(--ring-w\) var\(--ring-style\) var\(--ring-color\)/);
    expect(rule('.dss-acc-trigger:focus-visible')).toMatch(/outline-offset:\s*-3px/);
    for (const sel of ['.dss-acc-nav-link:focus-visible', '.dss-acc-nav-toggle:focus-visible']) {
      expect(rule(sel)).toMatch(/outline:\s*var\(--ring-w\) var\(--ring-style\) var\(--ring-color\)/);
    }
  });
  it('Hover, Aktiv, Offen und Gesperrt sind gestaltet', () => {
    expect(acc).toMatch(/\.dss-acc-trigger:hover:not\(\[aria-disabled="true"\]\)\s*\{\s*background:\s*var\(--dss-hover-bg\)/);
    expect(acc).toMatch(/\.dss-acc-trigger:active:not\(\[aria-disabled="true"\]\)\s*\{\s*background:\s*var\(--dss-surface-2\)/);
    expect(acc).toMatch(/\.dss-acc-trigger\[aria-expanded="true"\][^{]*\{\s*background:\s*var\(--dss-hover-bg\)/);
    expect(acc).toMatch(/\.dss-acc-trigger\[aria-disabled="true"\]\s*\{[^}]*cursor:\s*not-allowed/);
  });
  it('der Pfeil dreht sich um 180° bei offen (Button und details)', () => {
    expect(acc).toMatch(/\[aria-expanded="true"\] \.dss-acc-chevron[^{]*\{\s*transform:\s*rotate\(180deg\)/);
    expect(acc).toMatch(/details\[open\] > summary\.dss-acc-trigger::after[^{]*\{\s*transform:\s*rotate\(180deg\)/);
  });
  it('natives details: ohne Dreieck, eigener Pfeil per ::after', () => {
    expect(rule('summary.dss-acc-trigger')).toMatch(/list-style:\s*none/);
    expect(acc).toMatch(/summary\.dss-acc-trigger::-webkit-details-marker\s*\{\s*display:\s*none/);
    expect(acc).toMatch(/summary\.dss-acc-trigger::after[^{]*\{[^}]*content:\s*""/);
  });
  it('geschlossen: hidden bleibt im Layout (Animation), verborgen per visibility; Höhe 0fr → 1fr in 200 ms', () => {
    expect(rule('.dss-acc-panel')).toMatch(/grid-template-rows:\s*1fr/);
    expect(rule('.dss-acc-panel')).toMatch(/transition:\s*grid-template-rows 0\.2s ease/);
    const closed = rule('.dss-acc-panel[hidden]');
    expect(closed).toMatch(/grid-template-rows:\s*0fr/);
    expect(closed).toMatch(/visibility:\s*hidden/);
    expect(closed).toMatch(/display:\s*grid/);
    expect(rule('.dss-acc-panel-inner')).toMatch(/min-height:\s*0/);
    expect(rule('.dss-acc-panel-inner')).toMatch(/overflow:\s*hidden/);
  });
});

describe('Accordion-CSS: Bewegung reduzieren, data-motion, Druck', () => {
  const reduced = mediaBlock('@media (prefers-reduced-motion: reduce)');
  const motionRules = acc.slice(acc.indexOf(':root[data-motion="reduce"] .dss-acc-panel,'), acc.indexOf('/* Druck'));
  it('bei prefers-reduced-motion: keine Übergänge, geschlossene Bereiche sofort weg', () => {
    expect(reduced).toMatch(/\.dss-acc-panel,\s*\.dss-acc-panel\[hidden\]\s*\{\s*transition:\s*none/);
    expect(reduced).toMatch(/\.dss-acc-panel\[hidden\]\s*\{\s*display:\s*none/);
    expect(reduced).toMatch(/\.dss-acc-chevron[^{]*\{\s*transition:\s*none/);
  });
  it('bei data-motion="reduce" dieselben Regeln', () => {
    expect(motionRules).toMatch(/\[data-motion="reduce"\] \.dss-acc-panel,\s*:root\[data-motion="reduce"\] \.dss-acc-panel\[hidden\]\s*\{\s*transition:\s*none/);
    expect(motionRules).toMatch(/:root\[data-motion="reduce"\] \.dss-acc-panel\[hidden\]\s*\{\s*display:\s*none/);
    expect(motionRules).toMatch(/:root\[data-motion="reduce"\] \.dss-acc-chevron[^{]*\{\s*transition:\s*none/);
  });
  it('beide Regelgruppen decken dieselben Selektoren ab', () => {
    const sels = (text: string) => new Set([...text.matchAll(/\.dss-acc-[\w-]+(?:::after)?/g)].map((m) => m[0]));
    expect(sels(motionRules)).toEqual(sels(reduced));
  });
  it('Druck: alle Bereiche sichtbar, auch bei data-motion; keine Bedienelemente; kein klebender Kopf', () => {
    const print = mediaBlock('@media print');
    expect(print).toMatch(/\.dss-acc-panel\[hidden\][^{]*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*1fr[^}]*visibility:\s*visible/);
    expect(print).toContain(':root[data-motion="reduce"] .dss-acc-panel[hidden]');
    expect(print).toMatch(/\.dss-acc-tools[^{]*\{\s*display:\s*none/);
    expect(print).toMatch(/\.dss-acc--sticky \.dss-acc-title[^{]*\{\s*position:\s*static/);
    expect(print).toMatch(/overflow:\s*visible/);
  });
});

describe('Accordion-CSS: Kopf klebt (sticky)', () => {
  const sticky = rule('.dss-acc--sticky:not(.dss-acc--nested) > .dss-acc-item.is-open > .dss-acc-title,\n.dss-acc--sticky:not(.dss-acc--nested) > details[open].dss-acc-item > summary.dss-acc-trigger');
  it('position sticky mit Abstand aus --dss-acc-sticky-top, undurchsichtig, unter Overlays (z-index < 100)', () => {
    expect(sticky).toMatch(/position:\s*sticky/);
    expect(sticky).toMatch(/top:\s*var\(--dss-acc-sticky-top,\s*0px\)/);
    expect(sticky).toMatch(/background:\s*var\(--dss-surface\)/);
    const z = Number(sticky.match(/z-index:\s*(\d+)/)![1]);
    expect(z).toBeLessThan(100);
    expect(z).toBeGreaterThan(1);
  });
  it('scroll-margin-top berücksichtigt den klebenden Kopf', () => {
    expect(rule('.dss-acc-item')).toMatch(/scroll-margin-top:\s*calc\(var\(--dss-acc-sticky-top,\s*0px\) \+ 8px\)/);
  });
  it('kein overflow:hidden zwischen Bereich und Kopf (würde position: sticky brechen)', () => {
    expect(rule('.dss-acc-item')).not.toMatch(/overflow/);
    expect(rule('.dss-acc')).not.toMatch(/overflow/);
    expect(rule('.dss-acc-title')).not.toMatch(/overflow/);
  });
});

describe('Accordion-CSS: Sprungleiste unter und über 640 px', () => {
  it('unter 640 px ist die Liste einklappbar, der Schalter sichtbar; darüber nebeneinander', () => {
    const small = mediaBlock('@media (max-width: 639.98px)');
    expect(small).toMatch(/\.dss-acc-nav-toggle\s*\{\s*display:\s*flex/);
    expect(small).toMatch(/\.dss-acc-nav:not\(\.is-open\) \.dss-acc-nav-list\s*\{\s*display:\s*none/);
    expect(rule('.dss-acc-nav-toggle')).toMatch(/display:\s*none/);
    expect(rule('.dss-acc-nav-list')).toMatch(/flex-wrap:\s*wrap/);
  });
  it('der aktuelle Link ist hervorgehoben (aria-current)', () => {
    expect(acc).toMatch(/\.dss-acc-nav-link\[aria-current="true"\]\s*\{[^}]*background:\s*var\(--dss-btn-bg\)[^}]*color:\s*var\(--dss-btn-fg\)/);
  });
});

describe('Accordion-Kontraste (Text ≥ 7:1, Pfeil und Fokus ≥ 3:1) in Hell/Dunkel und beiden Marken', () => {
  const blocks = {
    Hell: blockOf(css, '/* ── Semantische Aliase · Light'),
    'Dunkel (Media-Query)': blockOf(css, ':root:not([data-theme="light"]) {\n    --dss-fg'),
    'Dunkel (data-theme)': blockOf(css, ':root[data-theme="dark"] {\n  --dss-fg'),
  };
  const dbb = blockOf(tokens, ':root[data-brand="dbb"] {');
  const AAA = 7;
  for (const [name, block] of Object.entries(blocks)) {
    for (const brand of ['BBV', 'DBB'] as const) {
      const scope = `--h-signal: var(${brand === 'BBV' ? '--h-amber' : '--h-gold'});\n${block}\n${brand === 'DBB' ? dbb + '\n' : ''}${tokens}`;
      const c = (token: string) => color(`var(${token})`, scope);
      it(`${name}, ${brand}`, () => {
        for (const bg of ['--dss-surface', '--dss-hover-bg', '--dss-surface-2']) {
          expect(ratio(c('--dss-fg'), c(bg)), `Titel auf ${bg}`).toBeGreaterThanOrEqual(AAA);
          expect(ratio(c('--dss-mute'), c(bg)), `Zusatzinfo auf ${bg}`).toBeGreaterThanOrEqual(AAA);
          expect(ratio(c('--ring-color'), c(bg)), `Fokus-Ring auf ${bg}`).toBeGreaterThanOrEqual(3);
        }
        expect(ratio(c('--dss-fg-soft'), c('--dss-surface')), 'Inhalt').toBeGreaterThanOrEqual(AAA);
        expect(ratio(c('--dss-fg-soft'), c('--dss-surface')), 'Sprunglink').toBeGreaterThanOrEqual(AAA);
        expect(ratio(c('--dss-btn-fg'), c('--dss-btn-bg')), 'aktueller Sprunglink').toBeGreaterThanOrEqual(AAA);
        expect(ratio(c('--dss-fg'), c('--dss-surface-2')), 'Sprungleisten-Schalter').toBeGreaterThanOrEqual(AAA);
        expect(ratio(c('--dss-line-strong'), c('--dss-surface')) >= 1.2).toBe(true);
      });
    }
  }
});
