// Gemeinsame Grundlagen des Vanilla-Pakets: reducedMotion, safeHref-Modul, Lebenszyklus-Muster, Accordion-Handle.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reducedMotion } from '../js/motion.js';
import { reducedMotion as fromLeaflet } from '../js/map-leaflet.js';
import { safeHref } from '../js/url.js';
import { safeHref as fromMap } from '../js/map.js';
import { createCleanups, createHandle, createRegistry, emptyHandle, listen } from '../js/lifecycle.js';
import { initAccordion, initAccordions } from '../js/accordion.js';

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.motion;
  document.body.replaceChildren();
});

describe('reducedMotion (js/motion.js)', () => {
  it('ist ohne Systemeinstellung und ohne Attribut falsch', () => {
    expect(reducedMotion()).toBe(false);
  });
  it('folgt prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    expect(reducedMotion()).toBe(true);
  });
  it('folgt data-motion="reduce" auf <html>', () => {
    document.documentElement.dataset.motion = 'reduce';
    expect(reducedMotion()).toBe(true);
    document.documentElement.dataset.motion = 'normal';
    expect(reducedMotion()).toBe(false);
  });
  it('map-leaflet exportiert dieselbe Funktion (Abwärtskompatibilität, keine Verhaltensänderung)', () => {
    expect(fromLeaflet).toBe(reducedMotion);
  });
});

describe('safeHref (js/url.js)', () => {
  it('map.js exportiert dieselbe Funktion weiter', () => {
    expect(fromMap).toBe(safeHref);
  });
  it.each(['https://example.org/a', 'http://x.de', 'mailto:a@b.de', 'tel:+4989123', '/pfad', './a', '../a', 'ort/seite', '?q=1', '#anker'])('lässt %s zu', (href) => {
    expect(safeHref(href)).toBe(href);
  });
  it.each(['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\tscript:alert(1)', ' javascript:alert(1)', 'data:text/html,<b>', 'vbscript:x', '\u0001javascript:x', 'a&colon;b', '', 7, null, undefined])('verwirft %s', (href) => {
    expect(safeHref(href as never)).toBeUndefined();
  });
});

describe('Lebenszyklus-Muster (js/lifecycle.js)', () => {
  it('createHandle: destroy läuft höchstens einmal', () => {
    const fn = vi.fn();
    const h = createHandle(fn);
    h.destroy();
    h.destroy();
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('emptyHandle: destroy ist harmlos', () => {
    expect(() => emptyHandle().destroy()).not.toThrow();
  });
  it('createCleanups: umgekehrte Reihenfolge, einmalig, ein Fehler stoppt die anderen nicht', () => {
    const order: number[] = [];
    const c = createCleanups();
    c.add(() => order.push(1));
    c.add(() => { throw new Error('x'); });
    c.add(() => order.push(3));
    c.add('kein Funktion');
    c.run();
    c.run();
    expect(order).toEqual([3, 1]);
  });
  it('listen: entfernt den Listener wieder', () => {
    const fn = vi.fn();
    const off = listen(document.body, 'click', fn);
    document.body.click();
    off();
    document.body.click();
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it('createRegistry: ein zweites claim für denselben Schlüssel setzt voraus, dass release die erste Fassung abbaut', () => {
    const reg = createRegistry<object>();
    const key = {};
    const a = vi.fn();
    const b = vi.fn();
    reg.claim(key, a);
    reg.release(key);
    reg.claim(key, b);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).not.toHaveBeenCalled();
  });
  it('createRegistry: nach destroy ist der Schlüssel frei, release danach ruft nichts mehr', () => {
    const reg = createRegistry<object>();
    const key = {};
    const a = vi.fn();
    const h = reg.claim(key, a);
    h.destroy();
    reg.release(key);
    expect(a).toHaveBeenCalledTimes(1);
  });
});

describe('Accordion folgt dem Muster { destroy() }', () => {
  const html = `<div class="hoops-acc" data-hoops-acc><details class="hoops-acc-item" id="a"><summary class="hoops-acc-trigger"><span class="hoops-acc-label">A</span></summary><div class="hoops-acc-panel">x</div></details></div>`;
  const mount = () => {
    document.body.replaceChildren(document.createRange().createContextualFragment(html));
    return document.querySelector<HTMLElement>('.hoops-acc')!;
  };
  it('initAccordion liefert eine Funktion (wie bisher) mit .destroy', () => {
    const h = initAccordion(mount(), { syncHash: false, expandAll: true });
    expect(typeof h).toBe('function');
    expect(typeof h.destroy).toBe('function');
    expect(document.querySelector('.hoops-acc-bar')).not.toBeNull();
    h.destroy();
    expect(document.querySelector('.hoops-acc-bar')).toBeNull();
    expect(() => { h.destroy(); h(); }).not.toThrow();
  });
  it('ein zweiter Aufruf für dieselbe Wurzel ersetzt die erste Fassung (idempotent)', () => {
    const root = mount();
    initAccordion(root, { syncHash: false, expandAll: true });
    initAccordion(root, { syncHash: false, expandAll: true });
    expect(root.querySelectorAll('.hoops-acc-bar').length).toBe(1);
  });
  it('ohne Wurzel: Handle, das nichts tut', () => {
    const h = initAccordion(null as never);
    expect(typeof h.destroy).toBe('function');
    expect(() => h.destroy()).not.toThrow();
  });
  it('initAccordions liefert ebenfalls .destroy und räumt alle auf', () => {
    mount();
    const h = initAccordions(document, { syncHash: false, expandAll: true });
    expect(document.querySelector('.hoops-acc-bar')).not.toBeNull();
    h.destroy();
    expect(document.querySelector('.hoops-acc-bar')).toBeNull();
  });
});
