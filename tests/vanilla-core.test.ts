// initAll: findet data-dss, reicht Optionen durch, ist idempotent, räumt auf; Import ohne Nebenwirkung.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as core from '../js/vanilla-core.js';
import { DSS_BLOCKS, initAll, parseOptions } from '../js/vanilla-core.js';
import { reducedMotion } from '../js/motion.js';
import { coreRules } from './helpers/core-rules';
import { safeHref } from '../js/url.js';

const PAGE = `
<button id="th" data-dss="theme" hidden></button>
<main data-dss="pagenav" data-dss-options='{"label":"Auf der Seite"}'><h1>T</h1><h2>A</h2><h2>B</h2><h2>C</h2></main>
<div class="dss-acc" data-dss="accordion" id="acc">
  <details class="dss-acc-item" id="d1"><summary class="dss-acc-trigger"><span class="dss-acc-label">Eins</span></summary><div class="dss-acc-panel">x</div></details>
</div>
<button id="bt" data-dss="backtop" type="button"></button>`;
const mount = (html = PAGE) => document.body.replaceChildren(document.createRange().createContextualFragment(html));
let h: { destroy(): void; count: number } | undefined;

beforeEach(() => {
  mount();
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  window.scrollTo = vi.fn() as never;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
});
afterEach(() => {
  h?.destroy();
  h = undefined;
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
  vi.unstubAllGlobals();
});

describe('initAll', () => {
  it('startet jeden Baustein auf seinem Element und zählt', () => {
    h = initAll(document, { accordion: { syncHash: false, expandAll: true } });
    expect(h.count).toBe(4);
    expect(document.getElementById('th')!.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('nav.dss-pagenav')).not.toBeNull();
    expect(document.querySelector('#acc .dss-acc-bar')).not.toBeNull();
    expect(document.getElementById('bt')!.classList.contains('dss-backtop')).toBe(true);
  });
  it('data-dss-options gilt je Element und gewinnt gegen options', () => {
    h = initAll(document, { pagenav: { label: 'Aus options' } });
    expect(document.querySelector('.dss-pagenav .dss-eyebrow')!.textContent).toBe('Auf der Seite');
  });
  it('only wählt Bausteine', () => {
    h = initAll(document, { only: ['theme'] });
    expect(h.count).toBe(1);
    expect(document.querySelector('nav.dss-pagenav')).toBeNull();
  });
  it('ein scope begrenzt die Suche; passt scope selbst, zählt es mit', () => {
    h = initAll(document.getElementById('acc'), { accordion: { syncHash: false } });
    expect(h.count).toBe(1);
    expect(document.getElementById('th')!.hasAttribute('aria-pressed')).toBe(false);
  });
  it('das ältere data-dss-acc startet ebenfalls einen Accordion', () => {
    mount('<div class="dss-acc" data-dss-acc><details class="dss-acc-item" id="x"><summary class="dss-acc-trigger"><span class="dss-acc-label">E</span></summary><div class="dss-acc-panel">x</div></details></div>');
    h = initAll(document, { accordion: { syncHash: false, expandAll: true } });
    expect(h.count).toBe(1);
    expect(document.querySelector('.dss-acc-bar')).not.toBeNull();
  });
  it('backtop auf einem anderen Element als Button: es ist der Container des Knopfes', () => {
    mount('<main><h1>T</h1></main><div id="host" data-dss="backtop"></div>');
    h = initAll(document);
    expect(document.querySelector('#host > button.dss-backtop')).not.toBeNull();
  });
  it('ein zweiter Aufruf ersetzt die frühere Fassung (keine doppelten Navigationen, Leisten, Listener)', () => {
    initAll(document, { accordion: { syncHash: false, expandAll: true } });
    h = initAll(document, { accordion: { syncHash: false, expandAll: true } });
    expect(document.querySelectorAll('nav.dss-pagenav')).toHaveLength(1);
    expect(document.querySelectorAll('.dss-acc-bar')).toHaveLength(1);
    document.getElementById('th')!.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
  it('destroy räumt alles auf (mehrfach aufrufbar)', () => {
    const before = document.body.innerHTML;
    h = initAll(document, { accordion: { syncHash: false, expandAll: true } });
    h.destroy();
    h.destroy();
    expect(document.querySelector('nav.dss-pagenav')).toBeNull();
    expect(document.querySelector('.dss-acc-bar')).toBeNull();
    expect(document.body.innerHTML).toBe(before);
  });
  it('ohne data-dss: nichts, kein Fehler', () => {
    mount('<main><h2>A</h2></main>');
    h = initAll();
    expect(h.count).toBe(0);
    expect(() => h!.destroy()).not.toThrow();
  });
  it('ein unbekannter data-dss-Wert wird ignoriert', () => {
    mount('<div data-dss="tabs"></div><div data-dss="__proto__"></div>');
    h = initAll();
    expect(h.count).toBe(0);
  });
  it('Elemente mit ungültigem Optionen-JSON starten mit Standardwerten', () => {
    mount('<main data-dss="pagenav" data-dss-options="{kaputt"><h2>A</h2><h2>B</h2><h2>C</h2></main>');
    h = initAll();
    expect(h.count).toBe(1);
    expect(document.querySelector('.dss-eyebrow')!.textContent).toBe('Auf dieser Seite');
  });
});

describe('initAll: mehrere Elemente je Baustein (Aussagen aus tests/helpers/core-rules.ts)', () => {
  it.each(Object.entries(coreRules(core as never)))('%s', (_n, ok) => expect(ok).toBe(true));
});

describe('parseOptions', () => {
  it.each([
    ['{"a":1,"b":"x"}', { a: 1, b: 'x' }],
    ['', {}], ['   ', {}], ['{kaputt', {}], ['[1,2]', {}], ['"text"', {}], ['null', {}], ['42', {}],
  ])('%j', (text, expected) => {
    expect(parseOptions(text)).toEqual(expected);
  });
  it('__proto__, constructor und prototype fallen weg und verändern nichts', () => {
    const o = parseOptions('{"__proto__":{"polluted":true},"constructor":1,"prototype":2,"ok":3}');
    expect(o).toEqual({ ok: 3 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('kein String: leer', () => {
    expect(parseOptions(undefined)).toEqual({});
    expect(parseOptions(5 as never)).toEqual({});
  });
});

describe('Modul', () => {
  it('kennt vier Bausteine und exportiert die gemeinsamen Hilfen', () => {
    expect(DSS_BLOCKS).toEqual(['accordion', 'pagenav', 'backtop', 'theme']);
    expect(core.reducedMotion).toBe(reducedMotion);
    expect(core.safeHref).toBe(safeHref);
    expect(typeof core.createHandle).toBe('function');
  });
});
