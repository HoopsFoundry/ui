// initBackToTop unter jsdom: Knopf, Sichtbarkeit, Klick (Scrollen, Fokus), feste untere Leiste, Aufräumen.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backTopVisible, initBackToTop } from '../js/backtop.js';

let handle: { destroy(): void } | undefined;
const setScroll = (y: number, height = 3000, inner = 800) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: inner, configurable: true });
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: height, configurable: true });
  window.dispatchEvent(new Event('scroll'));
};
const btn = () => document.querySelector<HTMLButtonElement>('.hoops-backtop')!;
const page = (html = '<main id="m"><h1 id="t">Titel</h1><p>x</p></main>') => document.body.replaceChildren(document.createRange().createContextualFragment(html));

beforeEach(() => {
  page();
  window.scrollTo = vi.fn() as never;
  setScroll(0);
});
afterEach(() => {
  handle?.destroy();
  handle = undefined;
  document.body.replaceChildren();
  delete document.documentElement.dataset.motion;
  vi.unstubAllGlobals();
});

describe('backTopVisible', () => {
  it('erst bei einer Seite über zwei Fensterhöhen und mehr als showAfter gescrollt', () => {
    expect(backTopVisible({ scrollY: 500, innerHeight: 800, scrollHeight: 3000 })).toBe(true);
    expect(backTopVisible({ scrollY: 480, innerHeight: 800, scrollHeight: 3000 })).toBe(false);
    expect(backTopVisible({ scrollY: 900, innerHeight: 800, scrollHeight: 1600 })).toBe(false);
    expect(backTopVisible({ scrollY: 900, innerHeight: 800, scrollHeight: 1601 })).toBe(true);
    expect(backTopVisible({ scrollY: 100, innerHeight: 800, scrollHeight: 3000, showAfter: 50 })).toBe(true);
  });
});

describe('Knopf', () => {
  it('ein Button mit Name, Klassen (44-px-Icon-Button) und SVG-Symbol ohne innerHTML; anfangs verborgen', () => {
    handle = initBackToTop();
    expect(btn().tagName).toBe('BUTTON');
    expect(btn().type).toBe('button');
    expect(btn().getAttribute('aria-label')).toBe('Nach oben');
    expect(btn().className).toBe('hoops-btn hoops-btn--secondary hoops-btn--icon hoops-backtop');
    expect(btn().hidden).toBe(true);
    const svg = btn().querySelector('svg')!;
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('path')!.getAttribute('d')).toBe('M12 19V5M5 12l7-7 7 7');
  });
  it('label und backLabel; Text bleibt Text', () => {
    handle = initBackToTop({ label: 'Zum Seitenanfang' });
    expect(btn().getAttribute('aria-label')).toBe('Zum Seitenanfang');
    handle.destroy();
    handle = initBackToTop({ backLabel: '"><img src=x onerror=alert(1)>' });
    expect(btn().getAttribute('aria-label')).toBe('"><img src=x onerror=alert(1)>');
    expect(document.querySelector('img')).toBeNull();
  });
  it('erscheint beim Scrollen und verschwindet wieder; auch bei resize', () => {
    handle = initBackToTop();
    setScroll(600);
    expect(btn().hidden).toBe(false);
    setScroll(100);
    expect(btn().hidden).toBe(true);
    setScroll(600);
    setScroll(600, 1000);
    window.dispatchEvent(new Event('resize'));
    expect(btn().hidden).toBe(true);
  });
  it('container: Auswahl oder Element', () => {
    page('<div id="a"></div><main><h1>T</h1></main>');
    handle = initBackToTop({ container: '#a' });
    expect(btn().parentElement!.id).toBe('a');
  });
});

describe('Klick', () => {
  it('scrollt sanft nach oben und fokussiert die h1 (tabindex -1, ohne Scrollen)', () => {
    handle = initBackToTop();
    setScroll(900);
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    btn().click();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(document.getElementById('t')!.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(document.getElementById('t'));
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it('mit data-motion="reduce" und mit prefers-reduced-motion sofort', () => {
    handle = initBackToTop();
    document.documentElement.dataset.motion = 'reduce';
    btn().click();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
    delete document.documentElement.dataset.motion;
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    btn().click();
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
  });
  it('ohne h1 fällt der Fokus auf main; ohne beides passiert nichts', () => {
    page('<main id="m"><h2>x</h2></main>');
    handle = initBackToTop();
    btn().click();
    expect(document.activeElement).toBe(document.getElementById('m'));
    handle.destroy();
    page('<div>nichts</div>');
    handle = initBackToTop();
    expect(() => btn().click()).not.toThrow();
  });
  it('ein verstecktes h1 (display: none) zählt im Browser nicht: das nächste sichtbare bekommt den Fokus', () => {
    page('<div id="x"><h1 id="weg">Versteckt</h1></div><main id="m"><h1 id="da">Sichtbar</h1></main>');
    // jsdom hat kein Layout: Layout und Sichtbarkeit nachstellen
    const shown = (el: Element, yes: boolean) => Object.defineProperty(el, 'getClientRects', { value: () => (yes ? [{}] : []), configurable: true });
    shown(document.documentElement, true);
    shown(document.getElementById('weg')!, false);
    shown(document.getElementById('da')!, true);
    shown(document.getElementById('m')!, true);
    handle = initBackToTop();
    btn().click();
    expect(document.activeElement!.id).toBe('da');
    delete (document.documentElement as unknown as { getClientRects?: unknown }).getClientRects;
  });
  it('mit Layout und ohne sichtbares h1 fällt der Fokus auf main', () => {
    page('<h1 id="weg">Versteckt</h1><main id="m"><p>x</p></main>');
    const shown = (el: Element, yes: boolean) => Object.defineProperty(el, 'getClientRects', { value: () => (yes ? [{}] : []), configurable: true });
    shown(document.documentElement, true);
    shown(document.getElementById('weg')!, false);
    shown(document.getElementById('m')!, true);
    handle = initBackToTop();
    btn().click();
    expect(document.activeElement!.id).toBe('m');
    delete (document.documentElement as unknown as { getClientRects?: unknown }).getClientRects;
  });
  it('target wählt ein anderes Fokusziel; ein vorhandenes tabindex bleibt, ein eigenes wird beim Aufräumen entfernt', () => {
    page('<main><h1 id="t" tabindex="0">T</h1><h2 id="u">U</h2></main>');
    handle = initBackToTop({ target: '#u' });
    btn().click();
    expect(document.activeElement!.id).toBe('u');
    handle.destroy();
    expect(document.getElementById('u')!.hasAttribute('tabindex')).toBe(false);
    handle = initBackToTop();
    btn().click();
    handle.destroy();
    expect(document.getElementById('t')!.getAttribute('tabindex')).toBe('0');
  });
  it('liegt der Fokus auf dem Knopf, wenn er verschwindet, geht er an das Ziel', () => {
    handle = initBackToTop();
    setScroll(900);
    btn().focus();
    expect(document.activeElement).toBe(btn());
    setScroll(0);
    expect(btn().hidden).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('t'));
  });
});

describe('feste untere Leiste', () => {
  const bar = (style: string, height = 64) => {
    page(`<main><h1 id="t">T</h1></main><nav class="hoops-bnav" style="${style}"></nav>`);
    document.querySelector('.hoops-bnav')!.getBoundingClientRect = () => ({ height }) as DOMRect;
  };
  it('eine feste hoops-bnav: der Knopf sitzt darüber (Höhe plus 16 px)', () => {
    bar('position:fixed;bottom:0');
    handle = initBackToTop();
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('80px');
  });
  it('eine nicht feste Leiste ändert nichts; avoid: null schaltet ab; offset hat Vorrang', () => {
    bar('position:static');
    handle = initBackToTop();
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('');
    handle.destroy();
    bar('position:fixed');
    handle = initBackToTop({ avoid: null });
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('');
    handle.destroy();
    bar('position:fixed');
    handle = initBackToTop({ offset: '7rem' });
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('7rem');
  });
  it('eine ausgeblendete Leiste zählt nicht', () => {
    bar('position:fixed;display:none');
    handle = initBackToTop();
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('');
  });
  it('die Leiste kommt erst später: beim nächsten Ändern der Größe wird sie erkannt', () => {
    handle = initBackToTop();
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('');
    const later = document.createElement('nav');
    later.className = 'hoops-bnav';
    later.style.position = 'fixed';
    later.getBoundingClientRect = () => ({ height: 60 }) as DOMRect;
    document.body.append(later);
    window.dispatchEvent(new Event('resize'));
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('76px');
    later.remove();
    window.dispatchEvent(new Event('resize'));
    expect(btn().style.getPropertyValue('--hoops-backtop-offset')).toBe('');
  });
});

describe('Aufräumen und Idempotenz', () => {
  it('destroy entfernt Knopf und Listener (auch mehrfach)', () => {
    handle = initBackToTop();
    handle.destroy();
    handle.destroy();
    expect(document.querySelector('.hoops-backtop')).toBeNull();
    setScroll(900);
    expect(document.querySelector('.hoops-backtop')).toBeNull();
  });
  it('ein zweiter Aufruf für denselben Container ersetzt den ersten', () => {
    initBackToTop();
    handle = initBackToTop({ label: 'Neu' });
    expect(document.querySelectorAll('.hoops-backtop')).toHaveLength(1);
    expect(btn().getAttribute('aria-label')).toBe('Neu');
  });
  it('einen vorhandenen Knopf übernehmen und beim Aufräumen zurückgeben', () => {
    page('<main><h1 id="t">T</h1></main><button id="b" type="button" class="mein" aria-label="Alt">x</button>');
    const own = document.getElementById('b') as HTMLButtonElement;
    handle = initBackToTop({ button: own });
    expect(own.classList.contains('hoops-backtop')).toBe(true);
    expect(own.hidden).toBe(true);
    expect(own.querySelector('svg')).not.toBeNull();
    setScroll(900);
    expect(own.hidden).toBe(false);
    own.click();
    expect(window.scrollTo).toHaveBeenCalled();
    handle.destroy();
    expect(document.getElementById('b')).toBe(own);
    expect(own.className).toBe('mein');
    expect(own.getAttribute('aria-label')).toBe('Alt');
    own.click();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
  });
});
