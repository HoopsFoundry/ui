// Sprachwechsel zur Laufzeit in den Vanilla-Bausteinen (I2): Ereignis hoops:localechange, Texte ohne Neuaufbau, Vorrang der Optionen, lang, keine Lecks.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetForTests, __subscriberCount, registerLocale, setLocale, setTexts } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';
import { initAccordion } from '../js/accordion.js';
import { initBackToTop } from '../js/backtop.js';
import { initPageNav } from '../js/pagenav.js';
import { initTheme } from '../js/theme.js';
import { mountMap } from '../js/map-vanilla.js';
import { mountLeagueCard, mountStats } from '../js/render/index.js';
import { LOCALE_EVENT } from '../js/i18n-events.js';

beforeEach(() => {
  __resetForTests();
  registerLocale('de', de);
  setLocale('en');
  document.body.replaceChildren();
});
afterEach(() => {
  document.documentElement.removeAttribute('lang');
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

const html = (markup: string) => {
  const host = document.createElement('div');
  host.append(document.createRange().createContextualFragment(markup));
  document.body.append(host);
  return host;
};

describe('Ereignis hoops:localechange', () => {
  it('wird bei Sprache, Katalog und Überschreibung gesendet, solange ein Baustein gemountet ist', () => {
    const seen: string[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent).detail.locale);
    document.addEventListener(LOCALE_EVENT, listener);
    const handle = initBackToTop();
    setLocale('de');
    setTexts({ 'backtop.label': 'Hoch' });
    registerLocale('fr', {});
    expect(seen).toEqual(['de', 'de', 'de']);
    handle.destroy();
    setLocale('en');
    expect(seen).toHaveLength(3);
    document.removeEventListener(LOCALE_EVENT, listener);
  });
  it('keine Lecks: nach destroy und nach 50 Wiederholungen kein Zuwachs der Abonnenten', () => {
    const before = __subscriberCount();
    for (let i = 0; i < 50; i++) {
      const handles = [initBackToTop(), mountStats(html('<div></div>').firstElementChild!, { items: [{ label: 'A', value: 1 }] }), initAccordion(html('<div class="hoops-acc"></div>'), { expandAll: true })];
      expect(__subscriberCount()).toBe(before + 1);
      handles.forEach((h) => (typeof h === 'function' ? h() : h.destroy()));
    }
    expect(__subscriberCount()).toBe(before);
  });
});

describe('Texte folgen dem Sprachwechsel (en → de → en)', () => {
  it('Nach oben, Dunkelmodus, Seitennavigation, Akkordeon', () => {
    const backtop = initBackToTop();
    const button = document.querySelector('.hoops-backtop')!;
    const toggle = document.createElement('button');
    document.body.append(toggle);
    const theme = initTheme(toggle, { storage: null });
    const root = html('<main><h2>A</h2><h2>B</h2><h2>C</h2></main>').firstElementChild as HTMLElement;
    const nav = initPageNav(root);
    const acc = html('<div class="hoops-acc"><div class="hoops-acc-item" id="x"><h3 class="hoops-acc-title"><button class="hoops-acc-trigger" aria-expanded="false" aria-controls="p">T</button></h3><div class="hoops-acc-panel" id="p" hidden></div></div></div>').firstElementChild as HTMLElement;
    const accordion = initAccordion(acc, { expandAll: true, nav: true });
    toggle.focus();
    const state = () => [button.getAttribute('aria-label'), toggle.getAttribute('aria-label'), root.querySelector('.hoops-eyebrow')?.textContent, acc.querySelector('.hoops-acc-bar button')?.textContent, acc.querySelector('.hoops-acc-nav')?.getAttribute('aria-label')];
    expect(state()).toEqual(['Back to top', 'Dark mode', 'On this page', 'Expand all', 'Sections']);
    const navBefore = root.querySelector('.hoops-pagenav');
    setLocale('de');
    expect(state()).toEqual(['Nach oben', 'Dunkelmodus', 'Auf dieser Seite', 'Alle öffnen', 'Bereiche']);
    expect(root.querySelector('.hoops-pagenav')).toBe(navBefore);
    expect(document.activeElement).toBe(toggle);
    setLocale('en');
    expect(state()[0]).toBe('Back to top');
    [backtop, theme, nav].forEach((h) => h.destroy());
    accordion();
  });
  it('eigene Optionen behalten Vorrang und lang folgt der Seite', () => {
    document.documentElement.lang = 'en';
    const backtop = initBackToTop({ label: 'Hoch' });
    const button = document.querySelector('.hoops-backtop')!;
    setLocale('de');
    expect(button.getAttribute('aria-label')).toBe('Hoch');
    expect(button.getAttribute('lang')).toBe('de');
    setLocale('en');
    expect(button.hasAttribute('lang')).toBe(false);
    backtop.destroy();
    expect(document.querySelector('.hoops-backtop')).toBeNull();
  });
  it('mountLeagueCard rendert bei Sprachwechsel neu und behält den offenen Zustand', () => {
    const host = html('<div></div>').firstElementChild as HTMLElement;
    const handle = mountLeagueCard(host, { title: 'Liga', teams: [{ rank: 1, name: 'A', points: 1 }], collapsible: true, open: true });
    expect(host.textContent).toContain('Team');
    setLocale('de');
    expect(host.textContent).toContain('Mannschaft');
    expect(host.querySelector('.hoops-acc-trigger')!.getAttribute('aria-expanded')).toBe('true');
    handle.destroy();
  });
  it('Karte: Texte wechseln, die Karte bleibt (kein Neuaufbau)', () => {
    const host = html('<div></div>').firstElementChild as HTMLElement;
    const handle = mountMap(host, { label: 'K', markers: [{ id: 'a', lat: 49.4, lng: 8.4, label: 'Halle' }] });
    const root = host.querySelector('.hoops-map');
    expect(host.querySelector('.hoops-map-load')!.textContent).toBe('Load map');
    setLocale('de');
    expect(host.querySelector('.hoops-map')).toBe(root);
    expect(host.querySelector('.hoops-map-load')!.textContent).toBe('Karte laden');
    expect(host.querySelector('.hoops-map-coords')!.textContent).toBe('49,4000° N, 8,4000° O');
    setLocale('en');
    expect(host.querySelector('.hoops-map-load')!.textContent).toBe('Load map');
    handle.destroy();
  });
});
