// Vanilla-Skript initAccordion unter jsdom: Button-Weg und natives details, Funktionen und Aufräumen.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initAccordion, initAccordions } from '../js/accordion.js';

const item = (id: string, { open = false, locked = false, title = id.toUpperCase(), inner = '' } = {}) => `
  <div class="dss-acc-item${open ? ' is-open' : ''}" id="${id}">
    <h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="${id}-t" aria-expanded="${open}" aria-controls="${id}-p"${locked ? ' aria-disabled="true"' : ''}><span class="dss-acc-label">${title}</span></button></h3>
    <div class="dss-acc-panel" id="${id}-p"${open ? '' : ' hidden inert'}><div class="dss-acc-panel-inner"><div class="dss-acc-body">Inhalt ${id}${inner}</div></div></div>
  </div>`;
const detailsItem = (id: string, open = false, locked = false) => `
  <details class="dss-acc-item" id="${id}"${open ? ' open' : ''}><summary class="dss-acc-trigger"${locked ? ' aria-disabled="true"' : ''}><span class="dss-acc-label">${id.toUpperCase()}</span></summary><div class="dss-acc-panel">Inhalt ${id}</div></details>`;

function mount(html: string) {
  document.body.replaceChildren(document.createRange().createContextualFragment(html));
  return document.querySelector<HTMLElement>('.dss-acc')!;
}
const group = (items: string, attrs = '') => `<div class="dss-acc dss-acc--card" data-dss-acc${attrs}>${items}</div>`;
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const expanded = (id: string) => $(`#${id}-t`).getAttribute('aria-expanded');
const click = (el: Element) => (el as HTMLElement).click();
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const tick = () => new Promise((r) => setTimeout(r, 0));

let destroy: (() => void) | undefined;
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  destroy = undefined;
});
afterEach(() => {
  destroy?.();
  document.body.replaceChildren();
});

describe('Button-Weg', () => {
  it('Klick öffnet und schließt (aria-expanded, hidden, inert, is-open)', () => {
    const root = mount(group(item('a') + item('b')));
    destroy = initAccordion(root, { syncHash: false });
    expect(expanded('a')).toBe('false');
    click($('#a-t'));
    expect(expanded('a')).toBe('true');
    expect($('#a-p').hidden).toBe(false);
    expect($('#a-p').hasAttribute('inert')).toBe(false);
    expect($('#a').classList.contains('is-open')).toBe(true);
    click($('#a-t'));
    expect(expanded('a')).toBe('false');
    expect($('#a-p').hidden).toBe(true);
    expect($('#a-p').hasAttribute('inert')).toBe(true);
    expect($('#a').classList.contains('is-open')).toBe(false);
  });

  it('mehrere Bereiche können gleichzeitig offen sein', () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))), { syncHash: false });
    click($('#a-t'));
    click($('#b-t'));
    expect([expanded('a'), expanded('b')]).toEqual(['true', 'true']);
  });

  it('exclusive: ein Öffnen schließt die anderen; beim Start bleibt nur der erste offene', () => {
    destroy = initAccordion(mount(group(item('a', { open: true }) + item('b', { open: true }) + item('c'))), { exclusive: true, syncHash: false });
    expect([expanded('a'), expanded('b'), expanded('c')]).toEqual(['true', 'false', 'false']);
    click($('#c-t'));
    expect([expanded('a'), expanded('b'), expanded('c')]).toEqual(['false', 'false', 'true']);
    expect($('#a-p').hidden).toBe(true);
  });

  it('ein gesperrter Bereich reagiert nicht auf Klicks', () => {
    destroy = initAccordion(mount(group(item('a', { locked: true }))), { syncHash: false });
    click($('#a-t'));
    expect(expanded('a')).toBe('false');
  });

  it('Klicks in einem verschachtelten Accordion betreffen nur dieses', () => {
    const inner = group(item('c'), '');
    const root = mount(group(item('a', { open: true, inner }) + item('b')));
    destroy = initAccordion(root, { syncHash: false });
    const nested = initAccordion($('#a-p .dss-acc'), { syncHash: false });
    click($('#c-t'));
    expect(expanded('c')).toBe('true');
    expect(expanded('a')).toBe('true');
    click($('#a-t'));
    expect(expanded('a')).toBe('false');
    expect(expanded('c')).toBe('true');
    nested();
  });

  it('sticky setzt die Klasse und destroy nimmt sie zurück', () => {
    const root = mount(group(item('a')));
    const off = initAccordion(root, { sticky: true, syncHash: false });
    expect(root.classList.contains('dss-acc--sticky')).toBe(true);
    off();
    expect(root.classList.contains('dss-acc--sticky')).toBe(false);
  });
});

describe('Tastatur', () => {
  const setup = () => {
    destroy = initAccordion(mount(group(item('a') + item('b', { locked: true }) + item('c') + item('d'))), { syncHash: false });
  };
  it('Pfeil ab/auf springt zwischen den Köpfen und überspringt gesperrte', () => {
    setup();
    $('#a-t').focus();
    key($('#a-t'), 'ArrowDown');
    expect(document.activeElement).toBe($('#c-t'));
    key($('#c-t'), 'ArrowDown');
    expect(document.activeElement).toBe($('#d-t'));
    key($('#d-t'), 'ArrowDown');
    expect(document.activeElement).toBe($('#d-t')); // kein Umlauf
    key($('#d-t'), 'ArrowUp');
    expect(document.activeElement).toBe($('#c-t'));
    key($('#c-t'), 'ArrowUp');
    expect(document.activeElement).toBe($('#a-t'));
    key($('#a-t'), 'ArrowUp');
    expect(document.activeElement).toBe($('#a-t'));
  });
  it('Home und End', () => {
    setup();
    $('#c-t').focus();
    key($('#c-t'), 'End');
    expect(document.activeElement).toBe($('#d-t'));
    key($('#d-t'), 'Home');
    expect(document.activeElement).toBe($('#a-t'));
  });
  it('Pfeiltasten mit Umschalt/Strg bleiben dem Browser überlassen', () => {
    setup();
    $('#a-t').focus();
    $('#a-t').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', ctrlKey: true, bubbles: true }));
    expect(document.activeElement).toBe($('#a-t'));
  });
  it('Enter und Leertaste lösen den Button-Klick aus (nativ), die Tastatur behält den Fokus', () => {
    setup();
    $('#a-t').focus();
    click($('#a-t'));
    expect(document.activeElement).toBe($('#a-t'));
  });
});

describe('Alle öffnen / schließen', () => {
  it('legt zwei Buttons und eine höfliche Ansage an', () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))), { expandAll: true, syncHash: false });
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('.dss-acc-bar button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Alle öffnen', 'Alle schließen']);
    expect(buttons[0].getAttribute('aria-controls')).toBe('a-p b-p');
    const live = $('.dss-acc-bar [aria-live]');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('');
  });
  it('öffnet alle, schließt alle und sagt es an; gesperrte bleiben', () => {
    destroy = initAccordion(mount(group(item('a') + item('b', { locked: true }) + item('c'))), { expandAll: true, syncHash: false });
    const [open, close] = [...document.querySelectorAll<HTMLButtonElement>('.dss-acc-bar button')];
    click(open);
    expect([expanded('a'), expanded('b'), expanded('c')]).toEqual(['true', 'false', 'true']);
    expect($('.dss-acc-bar [aria-live]').textContent).toBe('2 von 3 Bereichen geöffnet');
    click(close);
    expect([expanded('a'), expanded('b'), expanded('c')]).toEqual(['false', 'false', 'false']);
    expect($('.dss-acc-bar [aria-live]').textContent).toBe('Alle Bereiche geschlossen');
  });
  it('sagt „Alle Bereiche geöffnet“ an', () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))), { expandAll: true, syncHash: false });
    click(document.querySelector('.dss-acc-bar button')!);
    expect($('.dss-acc-bar [aria-live]').textContent).toBe('Alle Bereiche geöffnet');
  });
  it('bei exclusive wird die Leiste nicht angeboten', () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))), { expandAll: true, exclusive: true, syncHash: false });
    expect(document.querySelector('.dss-acc-bar')).toBeNull();
  });
  it('destroy entfernt die Leiste und die Wirkung', () => {
    const root = mount(group(item('a')));
    const off = initAccordion(root, { expandAll: true, nav: true, syncHash: false });
    off();
    expect(document.querySelector('.dss-acc-tools')).toBeNull();
    click($('#a-t'));
    expect(expanded('a')).toBe('false');
  });
});

describe('Deep-Link', () => {
  it('öffnet beim Start den Bereich zum Anker', () => {
    window.history.replaceState(null, '', '/#b');
    destroy = initAccordion(mount(group(item('a') + item('b'))));
    expect([expanded('a'), expanded('b')]).toEqual(['false', 'true']);
  });
  it('öffnet auch die Eltern-Bereiche (Wurzel zuerst)', () => {
    window.history.replaceState(null, '', '/#c');
    const inner = group(item('c'));
    const root = mount(group(item('a', { inner }) + item('b')));
    const outer = initAccordion(root);
    const nested = initAccordion($('#a-p .dss-acc'));
    expect(expanded('c')).toBe('true');
    expect(expanded('a')).toBe('true');
    expect(expanded('b')).toBe('false');
    nested();
    outer();
  });
  it('reagiert auf hashchange', async () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))));
    window.location.hash = '#a';
    await tick();
    await tick();
    expect(expanded('a')).toBe('true');
    window.location.hash = '#b';
    await tick();
    await tick();
    expect(expanded('b')).toBe('true');
  });
  it('ein unbekannter Anker ändert nichts', () => {
    window.history.replaceState(null, '', '/#unbekannt');
    destroy = initAccordion(mount(group(item('a'))));
    expect(expanded('a')).toBe('false');
  });
  it('syncHash=false ignoriert den Anker und schreibt keinen', () => {
    window.history.replaceState(null, '', '/#a');
    destroy = initAccordion(mount(group(item('a') + item('b'))), { syncHash: false });
    expect(expanded('a')).toBe('false');
    click($('#b-t'));
    expect(window.location.hash).toBe('#a');
  });
  it('Klick setzt #id ohne neuen Verlaufseintrag, Schließen entfernt ihn', () => {
    const before = window.history.length;
    destroy = initAccordion(mount(group(item('a') + item('b'))));
    click($('#a-t'));
    expect(window.location.hash).toBe('#a');
    click($('#b-t'));
    expect(window.location.hash).toBe('#b');
    click($('#a-t')); // a schließen: der Anker gehört zu b und bleibt
    expect(window.location.hash).toBe('#b');
    click($('#b-t'));
    expect(window.location.hash).toBe('');
    expect(window.history.length).toBe(before);
  });
});

describe('Sprungleiste', () => {
  it('legt nav „Bereiche“ mit Links auf die ids an', () => {
    destroy = initAccordion(mount(group(item('a', { title: 'Tabelle' }) + item('b', { title: 'Kader' }))), { nav: true, syncHash: false });
    const nav = $('nav.dss-acc-nav');
    expect(nav.getAttribute('aria-label')).toBe('Bereiche');
    const links = [...nav.querySelectorAll('a')];
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([['Tabelle', '#a'], ['Kader', '#b']]);
    const toggle = nav.querySelector('button')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(nav.querySelector('ul')!.id);
    click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('is-open')).toBe(true);
  });
  it('Klick auf einen Link öffnet den Bereich, setzt den Fokus auf den Kopf und markiert ihn aktuell', () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))), { nav: true });
    const link = document.querySelector<HTMLAnchorElement>('a[href="#b"]')!;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(expanded('b')).toBe('true');
    expect(document.activeElement).toBe($('#b-t'));
    expect(link.getAttribute('aria-current')).toBe('true');
    expect(document.querySelector('a[href="#a"]')!.hasAttribute('aria-current')).toBe(false);
    expect(window.location.hash).toBe('#b');
  });
  it('aria-current wandert zum zuletzt geöffneten und verschwindet beim Schließen', () => {
    destroy = initAccordion(mount(group(item('a') + item('b'))), { nav: true, syncHash: false });
    click($('#a-t'));
    expect(document.querySelector('a[href="#a"]')!.getAttribute('aria-current')).toBe('true');
    click($('#b-t'));
    expect(document.querySelector('a[href="#a"]')!.hasAttribute('aria-current')).toBe(false);
    expect(document.querySelector('a[href="#b"]')!.getAttribute('aria-current')).toBe('true');
    click($('#b-t'));
    expect(document.querySelector('a[href="#b"]')!.hasAttribute('aria-current')).toBe(false);
  });
});

describe('natives details', () => {
  it('exclusive vergibt ein gemeinsames name', () => {
    destroy = initAccordion(mount(group(detailsItem('a') + detailsItem('b'))), { exclusive: true, syncHash: false });
    const names = [...document.querySelectorAll('details')].map((d) => d.getAttribute('name'));
    expect(names[0]).toBeTruthy();
    expect(names[0]).toBe(names[1]);
  });
  it('ein vorhandenes name bleibt', () => {
    const root = mount(group('<details class="dss-acc-item" id="a" name="mein"><summary class="dss-acc-trigger">A</summary><div class="dss-acc-panel">x</div></details>'));
    destroy = initAccordion(root, { exclusive: true, syncHash: false });
    expect($('details').getAttribute('name')).toBe('mein');
  });
  it('exclusive schließt die anderen auch ohne native Gruppenunterstützung (toggle-Ereignis)', async () => {
    destroy = initAccordion(mount(group(detailsItem('a', true) + detailsItem('b'))), { exclusive: true, syncHash: false });
    $<HTMLDetailsElement>('#b').open = true;
    await tick();
    await tick();
    expect($<HTMLDetailsElement>('#a').open).toBe(false);
    expect($<HTMLDetailsElement>('#b').open).toBe(true);
  });
  it('Deep-Link öffnet das details samt Eltern', () => {
    window.history.replaceState(null, '', '/#c');
    const inner = `<div class="dss-acc" data-dss-acc>${detailsItem('c')}</div>`;
    const root = mount(group(`<details class="dss-acc-item" id="a"><summary class="dss-acc-trigger">A</summary><div class="dss-acc-panel">${inner}</div></details>` + detailsItem('b')));
    const outer = initAccordion(root);
    const nested = initAccordion($('#a .dss-acc'));
    expect($<HTMLDetailsElement>('#c').open).toBe(true);
    expect($<HTMLDetailsElement>('#a').open).toBe(true);
    expect($<HTMLDetailsElement>('#b').open).toBe(false);
    nested();
    outer();
  });
  it('ein Öffnen durch den Nutzer schreibt den Anker (toggle), Schließen entfernt ihn', async () => {
    destroy = initAccordion(mount(group(detailsItem('a'))));
    const d = $<HTMLDetailsElement>('#a');
    d.open = true; // wie ein Klick auf summary: das Skript hat es nicht ausgelöst
    await tick();
    await tick();
    expect(window.location.hash).toBe('#a');
    d.open = false;
    await tick();
    await tick();
    expect(window.location.hash).toBe('');
  });
  it('vom Skript ausgelöstes Öffnen (Alle öffnen) schreibt keinen Anker', async () => {
    destroy = initAccordion(mount(group(detailsItem('a') + detailsItem('b'))), { expandAll: true });
    click(document.querySelector('.dss-acc-bar button')!);
    await tick();
    await tick();
    expect(window.location.hash).toBe('');
  });
  it('Pfeile wirken auch auf summary', () => {
    destroy = initAccordion(mount(group(detailsItem('a') + detailsItem('b', false, true) + detailsItem('c'))), { syncHash: false });
    const sum = (id: string) => $(`#${id} summary`);
    sum('a').focus();
    key(sum('a'), 'ArrowDown');
    expect(document.activeElement).toBe(sum('c'));
    key(sum('c'), 'Home');
    expect(document.activeElement).toBe(sum('a'));
  });
  it('ein gesperrtes summary öffnet nicht', () => {
    destroy = initAccordion(mount(group(detailsItem('a', false, true))), { syncHash: false });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    $('#a summary').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
  it('Alle öffnen wirkt auf details', () => {
    destroy = initAccordion(mount(group(detailsItem('a') + detailsItem('b'))), { expandAll: true, syncHash: false });
    click(document.querySelector('.dss-acc-bar button')!);
    expect([...document.querySelectorAll('details')].map((d) => d.open)).toEqual([true, true]);
    expect($('.dss-acc-bar [aria-live]').textContent).toBe('Alle Bereiche geöffnet');
  });
});

describe('Lebenszyklus', () => {
  it('ohne Wurzel und ohne Browser passiert nichts', () => {
    expect(() => initAccordion(null as never)()).not.toThrow();
  });
  it('zweimal für dieselbe Wurzel ersetzt die frühere Fassung (keine doppelten Leisten, kein doppeltes Umschalten)', () => {
    const root = mount(group(item('a')));
    initAccordion(root, { expandAll: true, syncHash: false });
    destroy = initAccordion(root, { expandAll: true, syncHash: false });
    expect(document.querySelectorAll('.dss-acc-bar').length).toBe(1);
    click($('#a-t'));
    expect(expanded('a')).toBe('true');
  });
  it('initAccordions startet alle [data-dss-acc]', () => {
    mount(group(item('a')) + group(item('b')));
    const off = initAccordions(document, { syncHash: false });
    click($('#a-t'));
    click($('#b-t'));
    expect([expanded('a'), expanded('b')]).toEqual(['true', 'true']);
    off();
    click($('#a-t'));
    expect(expanded('a')).toBe('true');
  });
});
