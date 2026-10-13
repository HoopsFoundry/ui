// initPageNav unter jsdom: Aufbau, ids, Auswahl, Platzierung, Namen, Nachladen, Sprung in Bereiche, Aufräumen, Sicherheit.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cssTime, entries, initPageNav, labelOf, signature, slug } from '../js/pagenav.js';
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
  it('labelOf: Teile mit aria-hidden zählen nicht (Kurzname neben dem vollen Namen), sonst Rückfall auf den ganzen Text', () => {
    const el = document.createElement('h2');
    el.append(document.createRange().createContextualFragment('<span>TSV Nordhain 1920</span><span aria-hidden="true">Nordhain</span>'));
    expect(labelOf(el)).toBe('TSV Nordhain 1920');
    const only = document.createElement('h2');
    only.append(document.createRange().createContextualFragment('<span aria-hidden="true">Nur versteckt</span>'));
    expect(labelOf(only)).toBe('Nur versteckt');
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
  it('ein Bereich, der sich erst nach dem Klick öffnet (Svelte, React): der Fokus kommt im nächsten Frame an', () => {
    mount(`<main><h1>L</h1>
      <div class="dss-acc-item" id="spaet"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="spaet-t" aria-expanded="false"><span class="dss-acc-label">Spät</span></button></h3>
        <div class="dss-acc-panel" id="spaet-p" hidden inert><h2 id="drin">Drin</h2></div></div>
      <h2>Zwei</h2><h2>Drei</h2></main>`);
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { queue.push(cb); return 0; });
    // Der Bereich öffnet erst in einem Mikrotask nach dem Klick; solange er inert ist, nimmt das Ziel den Fokus nicht an
    $('#spaet-t').addEventListener('click', () => queueMicrotask(() => { $('#spaet-p').removeAttribute('hidden'); $('#spaet-p').removeAttribute('inert'); $('#spaet-t').setAttribute('aria-expanded', 'true'); }));
    const target = $('#drin');
    const realFocus = HTMLElement.prototype.focus;
    target.focus = function (this: HTMLElement, o?: FocusOptions) { if (this.closest('[inert]')) return; realFocus.call(this, o); };
    handle = initPageNav($('main'));
    go('Drin');
    expect(document.activeElement).not.toBe(target);
    return Promise.resolve().then(() => {
      queue.splice(0).forEach((cb) => cb(0));
      expect(document.activeElement).toBe(target);
    });
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

describe('Sprung in Bereiche mit Höhenanimation', () => {
  const ACC = `<main><h1>L</h1><div class="dss-acc-item" id="a"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="a-t" aria-expanded="false"><span class="dss-acc-label">A</span></button></h3>
    <div class="dss-acc-panel" id="a-p" hidden inert style="transition-duration: 200ms"><div class="dss-acc-panel-inner"><h2 id="drin">Drin</h2></div></div></div><h2>Zwei</h2><h2>Drei</h2></main>`;
  const open = () => $('#a-t').addEventListener('click', () => { $('#a-p').removeAttribute('hidden'); $('#a-p').removeAttribute('inert'); $('#a-t').setAttribute('aria-expanded', 'true'); });
  const go = () => links().find((a) => a.textContent === 'Drin')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  it('cssTime: längste Angabe in Millisekunden', () => {
    expect([cssTime('0.2s'), cssTime('0s, 200ms'), cssTime('0.1s, 0.3s'), cssTime(''), cssTime('x'), cssTime(undefined)]).toEqual([200, 200, 300, 0, 0, 0]);
  });
  it('nach transitionend wird erneut gescrollt und der Fokus gesetzt', () => {
    mount(ACC);
    open();
    handle = initPageNav($('main'));
    go();
    const before = scrolls.length;
    $('#a-p').dispatchEvent(new Event('transitionend'));
    expect(scrolls.length).toBe(before + 1);
    expect(scrolls.at(-1)!.el.id).toBe('drin');
    expect(document.activeElement).toBe($('#drin'));
    // ein zweites transitionend (oder der Rückfall) scrollt nicht noch einmal
    $('#a-p').dispatchEvent(new Event('transitionend'));
    expect(scrolls.length).toBe(before + 1);
  });
  it('ohne transitionend greift der Zeit-Rückfall (Dauer plus Puffer)', async () => {
    vi.useFakeTimers();
    mount(ACC);
    open();
    handle = initPageNav($('main'));
    go();
    await vi.advanceTimersByTimeAsync(20); // der Frame mit dem ersten Scrollen
    const before = scrolls.length;
    await vi.advanceTimersByTimeAsync(200);
    expect(scrolls.length).toBe(before);
    await vi.advanceTimersByTimeAsync(100);
    expect(scrolls.length).toBe(before + 1);
  });
  it('ohne Animation (Dauer 0) oder bei reduzierter Bewegung kein zweites Scrollen', async () => {
    vi.useFakeTimers();
    mount(ACC.replace('transition-duration: 200ms', 'transition-duration: 0s'));
    open();
    handle = initPageNav($('main'));
    go();
    await vi.advanceTimersByTimeAsync(20);
    const before = scrolls.length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(scrolls.length).toBe(before);
    handle.destroy();
    mount(ACC);
    open();
    document.documentElement.dataset.motion = 'reduce';
    handle = initPageNav($('main'));
    go();
    await vi.advanceTimersByTimeAsync(20);
    const b2 = scrolls.length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(scrolls.length).toBe(b2);
  });
  it('destroy vor dem Ablauf räumt den Zeitgeber auf', async () => {
    vi.useFakeTimers();
    mount(ACC);
    open();
    handle = initPageNav($('main'));
    go();
    await vi.advanceTimersByTimeAsync(20);
    const before = scrolls.length;
    handle.destroy();
    await vi.advanceTimersByTimeAsync(1000);
    expect(scrolls.length).toBe(before);
  });
});

describe('Beobachten: umbenannte Überschriften und Höchstwartezeit', () => {
  it('ein geänderter Text einer Überschrift (characterData) baut die Navigation neu', async () => {
    vi.useFakeTimers();
    const main = mount(PAGE);
    handle = initPageNav(main);
    (document.getElementById('abschnitt-kader')!.firstChild as Text).data = 'Mannschaft';
    await vi.advanceTimersByTimeAsync(300);
    expect(links().map((a) => a.textContent)).toEqual(['Tabelle', 'Spielplan', 'Mannschaft']);
  });
  it('ein geändertes data-pagenav und ein neues data-pagenav-skip werden übernommen', async () => {
    vi.useFakeTimers();
    mount(`<main><h2>A</h2><div data-pagenav="Alt">x</div><h2>B</h2><h2>C</h2></main>`);
    handle = initPageNav($('main'));
    $('[data-pagenav]').setAttribute('data-pagenav', 'Neu');
    await vi.advanceTimersByTimeAsync(300);
    expect(links().map((a) => a.textContent)).toEqual(['A', 'Neu', 'B', 'C']);
    document.querySelectorAll('h2')[1].setAttribute('data-pagenav-skip', '');
    await vi.advanceTimersByTimeAsync(300);
    expect(links().map((a) => a.textContent)).toEqual(['A', 'Neu', 'C']);
  });
  it('die eigene Navigation löst keinen Neuaufbau aus (auch nicht per Textänderung darin)', async () => {
    vi.useFakeTimers();
    handle = initPageNav(mount(PAGE));
    const first = nav();
    (links()[0].firstChild as Text).data = 'Fremd';
    await vi.advanceTimersByTimeAsync(400);
    expect(nav()).toBe(first);
  });
  it('Höchstwartezeit: eine Seite, die ständig ändert, bekommt ihre Navigation nach spätestens einer Sekunde', async () => {
    vi.useFakeTimers();
    const main = mount(`<main><h2>A</h2><h2>B</h2><h2>C</h2></main>`);
    handle = initPageNav(main);
    const first = nav();
    main.append(Object.assign(document.createElement('h2'), { textContent: 'D' }));
    for (let i = 0; i < 12; i++) {
      await vi.advanceTimersByTimeAsync(100);
      main.append(document.createElement('p'));
    }
    expect(nav()).not.toBe(first);
    expect(links()).toHaveLength(4);
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
