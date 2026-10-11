// initPageNav unter jsdom: Aufbau, ids, Auswahl, Platzierung, Namen, Nachladen, Sprung in Bereiche, Aufräumen, Sicherheit.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { entries, initPageNav, labelOf, signature, slug } from '../js/pagenav.js';
import { initAccordion } from '../js/accordion.js';

const mount = (html: string) => {
  document.body.replaceChildren(document.createRange().createContextualFragment(html));
  return document.querySelector<HTMLElement>('main')!;
};
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const nav = () => document.querySelector<HTMLElement>('nav.dss-pagenav');
const links = () => [...document.querySelectorAll<HTMLAnchorElement>('.dss-pagenav-link')];
const PAGE = `<main><h1>Verein</h1><div id="content"><section><h2>Tabelle</h2><p>a</p></section><section><h2>Spielplan</h2></section><section><h2>Kader</h2></section></div></main>`;

let scrolls: { el: Element; arg: unknown }[] = [];
let handle: { destroy(): void } | undefined;
beforeEach(() => {
  scrolls = [];
  window.history.replaceState(null, '', '/seite');
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  Element.prototype.scrollIntoView = function (this: Element, arg?: unknown) { scrolls.push({ el: this, arg }); };
  window.scrollTo = vi.fn() as never;
});
afterEach(() => {
  handle?.destroy();
  handle = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
  document.head.querySelectorAll('base').forEach((b) => b.remove());
  delete document.documentElement.dataset.motion;
});

describe('reine Funktionen', () => {
  it('slug löst Umlaute auf und ist nie leer', () => {
    expect(slug('Größe & Ärger Über Öl')).toBe('groesse-aerger-ueber-oel');
    expect(slug('Straße')).toBe('strasse');
    expect(slug('!!!')).toBe('abschnitt');
    expect(slug('')).toBe('abschnitt');
    expect(slug(undefined)).toBe('undefined');
  });
  it('labelOf: data-pagenav gewinnt, Leerraum zusammengefasst', () => {
    const el = document.createElement('div');
    el.textContent = '  Mannschaft \n  Kader ';
    expect(labelOf(el)).toBe('Mannschaft Kader');
    el.setAttribute('data-pagenav', ' Termine ');
    expect(labelOf(el)).toBe('Termine');
  });
  it('signature ändert sich mit id und Text', () => {
    const a = [{ id: 'a', text: 'A' }];
    expect(signature(a)).toBe(signature([{ id: 'a', text: 'A' }]));
    expect(signature(a)).not.toBe(signature([{ id: 'b', text: 'A' }]));
    expect(signature(a)).not.toBe(signature([{ id: 'a', text: 'B' }]));
  });
  it('entries: eindeutige ids, bestehende bleiben, Ziele ohne Text entfallen', () => {
    const els = ['Kader', 'Kader', '', 'Fest'].map((t, i) => {
      const e = document.createElement('h2');
      e.textContent = t;
      if (i === 3) e.id = 'mein-fest';
      return e;
    });
    const made: string[] = [];
    const list = entries(els, new Set(['abschnitt-kader']), (e) => made.push(e.id));
    expect(list.map((e) => e.id)).toEqual(['abschnitt-kader-2', 'abschnitt-kader-3', 'mein-fest']);
    expect(made).toEqual(['abschnitt-kader-2', 'abschnitt-kader-3']);
    expect(els[2].id).toBe('');
  });
});

describe('Aufbau', () => {
  it('baut nav, Liste und Links aus den h2 (ab drei)', () => {
    handle = initPageNav(mount(PAGE));
    expect(nav()).not.toBeNull();
    expect(links().map((a) => a.textContent)).toEqual(['Tabelle', 'Spielplan', 'Kader']);
    expect(links().map((a) => a.getAttribute('href'))).toEqual([
      `${window.location.origin}/seite#abschnitt-tabelle`, `${window.location.origin}/seite#abschnitt-spielplan`, `${window.location.origin}/seite#abschnitt-kader`,
    ]);
    expect($('#abschnitt-kader').tagName).toBe('H2');
    expect(nav()!.querySelectorAll('ul > li > a')).toHaveLength(3);
  });
  it('Name der Navigation: aria-labelledby auf den sichtbaren Text, Standard „Auf dieser Seite“', () => {
    handle = initPageNav(mount(PAGE));
    const id = nav()!.getAttribute('aria-labelledby')!;
    expect(document.getElementById(id)!.textContent).toBe('Auf dieser Seite');
    expect(document.getElementById(id)!.classList.contains('dss-eyebrow')).toBe(true);
    expect(nav()!.hasAttribute('aria-label')).toBe(false);
  });
  it('label ändert Text und Namen; zwei Navigationen mit verschiedenen Namen bleiben eindeutig', () => {
    mount(`<main><section id="a"><h2>A1</h2><h2>A2</h2><h2>A3</h2></section><section id="b"><h2>B1</h2><h2>B2</h2><h2>B3</h2></section></main>`);
    const h1 = initPageNav($('#a'), { label: 'Im Abschnitt A' });
    const h2 = initPageNav($('#b'), { label: 'Im Abschnitt B' });
    const names = [...document.querySelectorAll('nav.dss-pagenav')].map((n) => document.getElementById(n.getAttribute('aria-labelledby')!)!.textContent);
    expect(names).toEqual(['Im Abschnitt A', 'Im Abschnitt B']);
    // gleiche ids der Beschriftungen kommen nicht vor
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    h1.destroy();
    h2.destroy();
  });
  it('weniger als minHeadings: keine Navigation und keine vergebenen ids', () => {
    handle = initPageNav(mount(`<main><h2>A</h2><h2>B</h2></main>`));
    expect(nav()).toBeNull();
    expect(document.querySelectorAll('[id]')).toHaveLength(0);
  });
  it('minHeadings 2 genügt zwei, ungültige Werte fallen auf 3', () => {
    handle = initPageNav(mount(`<main><h2>A</h2><h2>B</h2></main>`), { minHeadings: 2 });
    expect(nav()).not.toBeNull();
    handle.destroy();
    handle = initPageNav(mount(`<main><h2>A</h2><h2>B</h2></main>`), { minHeadings: 0 });
    expect(nav()).toBeNull();
  });
  it('doppelte Texte bekommen eindeutige ids, beide Einträge bleiben', () => {
    handle = initPageNav(mount(`<main><h2>Kader</h2><h2>Kader</h2><h2>Kader</h2></main>`));
    expect(links().map((a) => a.getAttribute('href')!.split('#')[1])).toEqual(['abschnitt-kader', 'abschnitt-kader-2', 'abschnitt-kader-3']);
  });
  it('vorhandene ids bleiben; eine id im Dokument außerhalb von root wird nicht doppelt vergeben', () => {
    mount(`<div id="abschnitt-tabelle"></div><main><h2>Tabelle</h2><h2 id="eigen">Zwei</h2><h2>Drei</h2></main>`);
    handle = initPageNav($('main'));
    expect(links().map((a) => a.getAttribute('href')!.split('#')[1])).toEqual(['abschnitt-tabelle-2', 'eigen', 'abschnitt-drei']);
  });
  it('data-pagenav benennt Blöcke ohne Überschrift; data-pagenav-skip nimmt aus (auch über einen Vorfahren)', () => {
    mount(`<main><h2>A</h2><div data-pagenav="Kalender-Abo">x</div><h2 data-pagenav-skip>Versteckt</h2><div data-pagenav-skip><h2>Auch versteckt</h2></div><h2>B</h2></main>`);
    handle = initPageNav($('main'));
    expect(links().map((a) => a.textContent)).toEqual(['A', 'Kalender-Abo', 'B']);
  });
  it('skipAttribute ist konfigurierbar; ein ungültiger Name fällt auf den Standard zurück', () => {
    mount(`<main><h2>A</h2><h2 data-weg>X</h2><h2>B</h2><h2>C</h2></main>`);
    handle = initPageNav($('main'), { skipAttribute: 'data-weg' });
    expect(links().map((a) => a.textContent)).toEqual(['A', 'B', 'C']);
    handle.destroy();
    handle = initPageNav($('main'), { skipAttribute: '"] x [' });
    expect(links()).toHaveLength(4);
  });
  it('selector wählt andere Ebenen; eine ungültige Auswahl fällt auf den Standard zurück', () => {
    mount(`<main><h2>A</h2><h3>B</h3><h3>C</h3></main>`);
    handle = initPageNav($('main'), { selector: 'h2, h3' });
    expect(links().map((a) => a.textContent)).toEqual(['A', 'B', 'C']);
    handle.destroy();
    mount(PAGE);
    handle = initPageNav($('main'), { selector: '[[ungültig' });
    expect(links()).toHaveLength(3);
  });
  it('Überschriften in der Navigation selbst zählen nicht', () => {
    handle = initPageNav(mount(`<main><h2>A</h2><h2>B</h2><h2>C</h2></main>`), { selector: 'h2, p' });
    // das <p> der Navigation wird nicht zum Eintrag, auch nicht nach erneutem Aufbau
    handle.destroy();
    handle = initPageNav($('main'), { selector: 'h2, p' });
    expect(links().map((a) => a.textContent)).toEqual(['A', 'B', 'C']);
  });
});

describe('Platzierung', () => {
  it('Standard: vor dem Block, der die erste Überschrift enthält (Kind von root)', () => {
    handle = initPageNav(mount(PAGE), { container: '#content' });
    expect(nav()!.parentElement!.id).toBe('content');
    expect(nav()!.nextElementSibling!.tagName).toBe('SECTION');
  });
  it('ohne container: in root, vor dem Block der ersten Überschrift', () => {
    handle = initPageNav(mount(PAGE));
    expect(nav()!.parentElement!.tagName).toBe('MAIN');
    expect(nav()!.nextElementSibling!.id).toBe('content');
  });
  it('container als Element außerhalb: die Navigation steht am Anfang des Containers', () => {
    mount(`<aside id="seite"><p>x</p></aside><main><h2>A</h2><h2>B</h2><h2>C</h2></main>`);
    handle = initPageNav($('main'), { container: $('#seite') });
    expect($('#seite').firstElementChild).toBe(nav());
  });
  it('ein unbekannter container fällt auf root zurück', () => {
    handle = initPageNav(mount(PAGE), { container: '#gibt-es-nicht' });
    expect(nav()!.parentElement!.tagName).toBe('MAIN');
  });
});

describe('Nachladen', () => {
  it('Überschriften, die später erscheinen, bauen die Navigation neu (entprellt); gleicher Inhalt baut nicht neu', async () => {
    vi.useFakeTimers();
    const main = mount(`<main><h2>A</h2><h2>B</h2></main>`);
    handle = initPageNav(main);
    expect(nav()).toBeNull();
    main.append(Object.assign(document.createElement('h2'), { textContent: 'C' }));
    await vi.advanceTimersByTimeAsync(100);
    expect(nav()).toBeNull();
    await vi.advanceTimersByTimeAsync(100);
    expect(links().map((a) => a.textContent)).toEqual(['A', 'B', 'C']);
    const first = nav();
    main.append(document.createElement('p'));
    await vi.advanceTimersByTimeAsync(300);
    expect(nav()).toBe(first);
    main.append(Object.assign(document.createElement('h2'), { textContent: 'D' }));
    await vi.advanceTimersByTimeAsync(300);
    expect(nav()).not.toBe(first);
    expect(links()).toHaveLength(4);
    expect(document.querySelectorAll('nav.dss-pagenav')).toHaveLength(1);
  });
  it('viele Änderungen hintereinander ergeben einen Aufbau', async () => {
    vi.useFakeTimers();
    const main = mount(`<main><h2>A</h2><h2>B</h2><h2>C</h2></main>`);
    handle = initPageNav(main);
    const first = nav();
    for (let i = 0; i < 5; i++) main.append(Object.assign(document.createElement('h2'), { textContent: `N${i}` }));
    await vi.advanceTimersByTimeAsync(400);
    expect(nav()).not.toBe(first);
    expect(links()).toHaveLength(8);
  });
  it('observe: false beobachtet nichts', async () => {
    vi.useFakeTimers();
    const main = mount(`<main><h2>A</h2><h2>B</h2></main>`);
    handle = initPageNav(main, { observe: false });
    main.append(Object.assign(document.createElement('h2'), { textContent: 'C' }));
    await vi.advanceTimersByTimeAsync(500);
    expect(nav()).toBeNull();
  });
  it('fallen Überschriften weg, verschwindet die Navigation', async () => {
    vi.useFakeTimers();
    const main = mount(PAGE);
    handle = initPageNav(main);
    $('#abschnitt-kader').remove();
    await vi.advanceTimersByTimeAsync(300);
    expect(nav()).toBeNull();
  });
});

describe('Sprung', () => {
  const ACC = `<main><h1>Liga</h1>
    <div class="dss-acc" data-dss-acc>
      <div class="dss-acc-item" id="tabelle"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="tabelle-t" aria-expanded="false" aria-controls="tabelle-p"><span class="dss-acc-label">Tabelle</span></button></h3>
        <div class="dss-acc-panel" id="tabelle-p" hidden inert><div class="dss-acc-body"><h2 id="stand">Stand</h2><p>x</p></div></div></div>
      <div class="dss-acc-item" id="kader"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="kader-t" aria-expanded="false" aria-controls="kader-p"><span class="dss-acc-label">Kader</span></button></h3>
        <div class="dss-acc-panel" id="kader-p" hidden inert><div class="dss-acc-body">
          <div class="dss-acc dss-acc--nested" data-dss-acc>
            <div class="dss-acc-item" id="guards"><h4 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="guards-t" aria-expanded="false" aria-controls="guards-p"><span class="dss-acc-label">Guards</span></button></h4>
              <div class="dss-acc-panel" id="guards-p" hidden inert><div class="dss-acc-body"><h2>Tief drin</h2></div></div></div>
          </div></div></div></div>
      <div class="dss-acc-item" id="gesperrt"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="gesperrt-t" aria-expanded="false" aria-disabled="true" aria-controls="gesperrt-p"><span class="dss-acc-label">Gesperrt</span></button></h3>
        <div class="dss-acc-panel" id="gesperrt-p" hidden inert><div class="dss-acc-body"><h2>Unerreichbar</h2></div></div></div>
    </div>
    <details id="d"><summary>Mehr</summary><h2>In details</h2></details>
    <h2>Offen sichtbar</h2></main>`;
  const setup = () => {
    mount(ACC);
    const accs = [...document.querySelectorAll<HTMLElement>('[data-dss-acc]')].map((el) => initAccordion(el, { syncHash: false }));
    handle = initPageNav($('main'));
    return accs;
  };
  const go = (text: string) => {
    const link = links().find((a) => a.textContent === text)!;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(ev);
    return ev;
  };
  it('ein Klick öffnet den umgebenden Bereich, scrollt, fokussiert das Ziel und setzt den Anker', () => {
    const accs = setup();
    const ev = go('Stand');
    expect(ev.defaultPrevented).toBe(true);
    expect($('#tabelle-t').getAttribute('aria-expanded')).toBe('true');
    expect($<HTMLElement>('#tabelle-p').hidden).toBe(false);
    expect(scrolls.at(-1)!.el.id).toBe('stand');
    expect(document.activeElement).toBe($('#stand'));
    expect($('#stand').getAttribute('tabindex')).toBe('-1');
    expect(window.location.hash).toBe('#stand');
    accs.forEach((a) => a.destroy());
  });
  it('verschachtelt: öffnet alle Eltern von außen nach innen', () => {
    const accs = setup();
    go('Tief drin');
    expect([$('#kader-t'), $('#guards-t')].map((b) => b.getAttribute('aria-expanded'))).toEqual(['true', 'true']);
    accs.forEach((a) => a.destroy());
  });
  it('ein gesperrter Bereich bleibt zu', () => {
    const accs = setup();
    go('Unerreichbar');
    expect($('#gesperrt-t').getAttribute('aria-expanded')).toBe('false');
    accs.forEach((a) => a.destroy());
  });
  it('ein umgebendes details wird geöffnet', () => {
    const accs = setup();
    go('In details');
    expect($<HTMLDetailsElement>('#d').open).toBe(true);
    accs.forEach((a) => a.destroy());
  });
  it('ein sichtbares Ziel: sanft gescrollt; mit data-motion="reduce" sofort', () => {
    const accs = setup();
    go('Offen sichtbar');
    expect((scrolls.at(-1)!.arg as ScrollIntoViewOptions).behavior).toBe('smooth');
    document.documentElement.dataset.motion = 'reduce';
    go('Offen sichtbar');
    expect((scrolls.at(-1)!.arg as ScrollIntoViewOptions).behavior).toBe('auto');
    accs.forEach((a) => a.destroy());
  });
  it('mit prefers-reduced-motion sofort', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    const accs = setup();
    go('Offen sichtbar');
    expect((scrolls.at(-1)!.arg as ScrollIntoViewOptions).behavior).toBe('auto');
    accs.forEach((a) => a.destroy());
  });
  it('wo ein Bereich geöffnet wurde, wird sofort gescrollt (die Höhe ändert sich noch)', () => {
    const accs = setup();
    go('Stand');
    expect((scrolls.at(-1)!.arg as ScrollIntoViewOptions).behavior).toBe('auto');
    accs.forEach((a) => a.destroy());
  });
  it.each([{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }])('Klick mit %j bleibt dem Browser überlassen', (init) => {
    const accs = setup();
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
    links()[0].dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    accs.forEach((a) => a.destroy());
  });
  it('ein Anker beim Laden auf ein Ziel in einem geschlossenen Bereich öffnet ihn; ein späterer hashchange ebenso', () => {
    mount(ACC);
    const accs = [...document.querySelectorAll<HTMLElement>('[data-dss-acc]')].map((el) => initAccordion(el, { syncHash: false }));
    window.history.replaceState(null, '', '/seite#stand');
    handle = initPageNav($('main'));
    expect($('#tabelle-t').getAttribute('aria-expanded')).toBe('true');
    window.history.replaceState(null, '', '/seite#d');
    // der Anker auf details selbst gehört nicht dem Accordion: öffnen
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect($<HTMLDetailsElement>('#d').open).toBe(true);
    accs.forEach((a) => a.destroy());
  });
  it('syncHash: false lässt Anker unberührt', () => {
    mount(ACC);
    window.history.replaceState(null, '', '/seite#stand');
    handle = initPageNav($('main'), { syncHash: false });
    expect($('#tabelle-t').getAttribute('aria-expanded')).toBe('false');
  });
  it('ein Anker auf einen Bereich selbst bleibt dem Accordion überlassen (kein doppeltes Öffnen)', () => {
    mount(ACC);
    const accs = [...document.querySelectorAll<HTMLElement>('[data-dss-acc]')].map((el) => initAccordion(el, { syncHash: false }));
    window.history.replaceState(null, '', '/seite#tabelle');
    handle = initPageNav($('main'));
    expect($('#tabelle-t').getAttribute('aria-expanded')).toBe('false');
    accs.forEach((a) => a.destroy());
  });
  it('<base href> lenkt die Links nicht um: sie tragen die Seitenadresse', () => {
    const base = document.createElement('base');
    base.href = 'https://example.org/ganz/woanders/';
    document.head.append(base);
    handle = initPageNav(mount(PAGE));
    for (const a of links()) expect(a.getAttribute('href')!.startsWith(window.location.origin + '/seite#')).toBe(true);
  });
});

describe('Aufräumen und Idempotenz', () => {
  it('destroy entfernt Navigation, Klassen, erzeugte ids und tabindex; mehrfach aufrufbar', () => {
    const main = mount(PAGE);
    const before = main.innerHTML;
    handle = initPageNav(main);
    links()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    handle.destroy();
    handle.destroy();
    expect(nav()).toBeNull();
    expect(main.innerHTML).toBe(before);
  });
  it('nach destroy beobachtet nichts mehr', async () => {
    vi.useFakeTimers();
    const main = mount(`<main><h2>A</h2><h2>B</h2></main>`);
    handle = initPageNav(main);
    handle.destroy();
    main.append(Object.assign(document.createElement('h2'), { textContent: 'C' }));
    await vi.advanceTimersByTimeAsync(500);
    expect(nav()).toBeNull();
  });
  it('ein zweiter Aufruf für dieselbe Wurzel ersetzt den ersten (eine Navigation, gleiche ids)', () => {
    const main = mount(PAGE);
    initPageNav(main);
    handle = initPageNav(main, { label: 'Neu' });
    expect(document.querySelectorAll('nav.dss-pagenav')).toHaveLength(1);
    expect(document.getElementById(nav()!.getAttribute('aria-labelledby')!)!.textContent).toBe('Neu');
    expect(links().map((a) => a.getAttribute('href')!.split('#')[1])).toEqual(['abschnitt-tabelle', 'abschnitt-spielplan', 'abschnitt-kader']);
  });
  it('hashchange-Listener wird entfernt', () => {
    mount(`<main><h2 id="x">A</h2><h2>B</h2><h2>C</h2><details id="dd"><summary>s</summary><h2 id="y">D</h2></details></main>`);
    handle = initPageNav($('main'));
    handle.destroy();
    window.history.replaceState(null, '', '/seite#y');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect($<HTMLDetailsElement>('#dd').open).toBe(false);
  });
  it('ohne Wurzel oder ohne Auswahl: Handle, das nichts tut', () => {
    for (const root of [null, undefined, {}, 'main']) expect(() => initPageNav(root as never).destroy()).not.toThrow();
  });
});

describe('Sicherheit', () => {
  it('bösartige Überschriften bleiben Text; die Links zeigen nur auf die eigene Seite', () => {
    mount(`<main><h2 id='"><img src=x onerror=alert(1)>'>Eins</h2><h2>&lt;img src=x onerror=alert(1)&gt;</h2><h2>javascript:alert(1)</h2></main>`);
    handle = initPageNav($('main'));
    expect(document.querySelector('nav img')).toBeNull();
    for (const a of links()) {
      const href = a.getAttribute('href')!;
      expect(href.startsWith(`${window.location.origin}/seite#`)).toBe(true);
      expect(href).not.toMatch(/[<>"']/);
    }
    expect(links().map((a) => a.textContent)).toContain('<img src=x onerror=alert(1)>');
  });
  it('label wird als Text gesetzt, nie als HTML', () => {
    handle = initPageNav(mount(PAGE), { label: '<b>x</b><img src=x onerror=alert(1)>' });
    expect(nav()!.querySelector('b, img')).toBeNull();
    expect($('.dss-pagenav .dss-eyebrow').textContent).toBe('<b>x</b><img src=x onerror=alert(1)>');
  });
});
