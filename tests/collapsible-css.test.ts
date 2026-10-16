// @vitest-environment node
// CSS der einklappbaren Rahmen (Table, ScheduleTable, ScheduleGrid, LeagueCard): Klassen, Titelgröße bleibt an den Rahmen-Tokens,
// geschlossen ohne doppelten Strich, Fokus, Druck, Sticky, keine Elementselektoren mit Größe, keine nackten --*-text.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');
const START = css.indexOf('/* ── Einklappbare Rahmen');
const frames = css.slice(START);
const noComments = frames.replace(/\/\*[\s\S]*?\*\//g, '');

const rule = (selector: string) => {
  const at = frames.indexOf(`${selector} {`);
  if (at < 0) throw new Error(`Regel nicht gefunden: ${selector}`);
  return frames.slice(frames.indexOf('{', at) + 1, frames.indexOf('}', at));
};

describe('CSS einklappbarer Rahmen', () => {
  it('der Abschnitt steht nach Accordion und Ligencard', () => {
    expect(START).toBeGreaterThan(css.indexOf('/* ── LeagueCard'));
    expect(START).toBeGreaterThan(css.indexOf('/* ── Accordion'));
  });
  it.each(['is-collapsible', 'is-open', 'hoops-frame-head--acc', 'hoops-league-head--acc', 'hoops-acc-sub', 'hoops-acc-trigger'])('verwendet .%s', (cls) => {
    expect(frames).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
  });
  it('die Titelgröße bleibt an den Rahmen-Tokens: der Button erbt die Schrift vom Titel, keine Accordion-Tokens im Abschnitt', () => {
    const inherit = rule('.hoops-frame-title > .hoops-acc-trigger, .hoops-league-title > .hoops-acc-trigger');
    expect(inherit).toMatch(/font:\s*inherit/);
    expect(inherit).toMatch(/letter-spacing:\s*inherit/);
    expect(inherit).toMatch(/color:\s*inherit/);
    expect(noComments).not.toMatch(/--hoops-acc-title-size|--hoops-acc-pad|--hoops-acc-nested-title-size/);
    expect(inherit).not.toMatch(/font-size/);
    // die Titelgrößen selbst bleiben unverändert an den Rahmen- bzw. Karten-Tokens
    expect(css).toMatch(/\.hoops-frame-title\s*\{[^}]*font-size:\s*var\(--hoops-frame-title-size,\s*var\(--hoops-title-size,\s*var\(--hoops-fs-body\)\)\)/);
    expect(css).toMatch(/\.hoops-league-title\s*\{[^}]*font-size:\s*var\(--hoops-card-title-size,\s*var\(--hoops-title-size,\s*var\(--hoops-fs-h3\)\)\)/);
  });
  it('kein Selektor auf h1 bis h6 im Abschnitt', () => {
    expect(noComments).not.toMatch(/(^|[\s,>+~])h[1-6]\b/m);
  });
  it('keine nackten --*-text-Variablen (nur mit Token-Namen --hoops-…)', () => {
    expect(noComments).not.toMatch(/var\(--hoops-(ok|err|warn|info|signal|cool|base)-(text|soft)\b/);
  });
  it('Rahmenkopf: ohne Innenabstand, der Button trägt ihn (≥ 44 px Zielhöhe über .hoops-acc-trigger)', () => {
    expect(rule('.hoops-frame-head--acc, .hoops-league-head--acc')).toMatch(/padding:\s*0/);
    expect(rule('.hoops-frame-title > .hoops-acc-trigger')).toMatch(/padding:\s*16px 22px/);
    expect(css).toMatch(/\.hoops-acc-trigger\s*\{[^}]*min-height:\s*44px/);
  });
  it('geschlossen: kein doppelter Strich (Rand des Kopfes durchsichtig), Radius rundum', () => {
    const closed = rule('.hoops-frame.is-collapsible:not(.is-open) > .hoops-frame-head--acc');
    expect(closed).toMatch(/border-bottom-color:\s*transparent/);
    expect(closed).toMatch(/border-radius:\s*13px/);
    expect(rule('.hoops-league.is-collapsible:not(.is-open) > .hoops-league-head--acc')).toMatch(/border-radius:\s*15px/);
  });
  it('Fokus: der gestrichelte Ring kommt von .hoops-acc-trigger (innen), auf dunklem Rahmen in der dezenten Farbe', () => {
    expect(css).toMatch(/\.hoops-acc-trigger:focus-visible\s*\{[^}]*outline:\s*var\(--hoops-ring-w\) var\(--hoops-ring-style\) var\(--hoops-ring-color\);\s*outline-offset:\s*-3px/);
    expect(rule('.hoops-frame--dark .hoops-acc-trigger:focus-visible')).toMatch(/outline-color:\s*var\(--hoops-ring-color-on-dark\)/);
  });
  it('Hover und Aktiv nutzen vorhandene Tokens (kein Zustand nur über Farbe: der Pfeil dreht sich)', () => {
    expect(frames).toMatch(/\.hoops-frame-head--acc \.hoops-acc-trigger:hover/);
    expect(css).toMatch(/\.hoops-acc-trigger\[aria-expanded="true"\] \.hoops-acc-chevron[^{]*\{\s*transform:\s*rotate\(180deg\)/);
  });
  it('Sticky: der Rahmen schneidet mit overflow: clip (kein Scrollcontainer), der Kopf klebt', () => {
    expect(frames).toMatch(/\.hoops-acc--sticky:not\(\.hoops-acc--nested\) > \.hoops-frame\.is-collapsible[^{]*\{\s*overflow:\s*clip/);
    expect(frames).toMatch(/\.hoops-frame\.is-open > \.hoops-frame-head--acc[^{]*\{[^}]*position:\s*sticky/);
  });
  it('Druck: Kopf nicht klebend, Strich unter dem Kopf auch bei zugeklappt', () => {
    const at = frames.indexOf('@media print');
    expect(at).toBeGreaterThan(0);
    const print = frames.slice(at);
    // so spezifisch wie die Regel für „zugeklappt“, sonst bliebe der Strich im Druck durchsichtig
    expect(print).toMatch(/\.hoops-frame\.is-collapsible:not\(\.is-open\) > \.hoops-frame-head--acc\s*\{[^}]*border-bottom-color:\s*var\(--hoops-line\)/);
    expect(print).toMatch(/position:\s*static/);
  });
  it('Animation und Druck der Bereiche kommen aus dem Accordion (gleiche Klassen), nicht aus einer Kopie', () => {
    expect(frames).not.toMatch(/grid-template-rows/);
    expect(frames).not.toMatch(/prefers-reduced-motion/);
    const acc = css.slice(css.indexOf('/* ── Accordion'), START);
    expect(acc).toMatch(/\.hoops-acc-panel\[hidden\]/);
    expect(acc).toMatch(/:root\[data-motion="reduce"\] \.hoops-acc-panel/);
  });
  it('ohne collapsible ändert sich nichts: alle Regeln hängen an .is-collapsible, --acc oder dem Button im Titel', () => {
    for (const m of noComments.matchAll(/(^|\})\s*([^{}@]+)\{/g)) {
      for (const sel of m[2].replace(/:is\([^)]*\)/g, '').split(',').map((x) => x.trim()).filter(Boolean)) {
        expect(sel, sel).toMatch(/is-collapsible|--acc|\.hoops-acc-trigger|\.hoops-acc-sub|\.hoops-acc-chevron|\.hoops-league-live/);
      }
    }
  });
});

describe('Zielgröße der Links im Spielplan (WCAG 2.5.8)', () => {
  const sub = css.match(/\.hoops-sch-sub \.hoops-link, \.hoops-sch-team \.hoops-link \{([^}]*)\}/);
  it('Links in Unterzeile und am Teamnamen: 3 px Fläche oben und unten, negativer Rand hält die Zeilenhöhe', () => {
    expect(sub).not.toBeNull();
    expect(sub![1]).toMatch(/padding-block:\s*3px/);
    expect(sub![1]).toMatch(/margin-block:\s*-3px/);
  });
});
