// initModal/openModal/closeModal: natives <dialog> (showModal), Markup mit role=dialog (inert-Hintergrund), Fokus holen und zurückgeben, Escape,
// Fokusfalle, dismissOnBackdrop, Scroll-Sperre mit Rückbau, Auslöser per data-Attribut, Ereignisse, gestapelte Modals, mehrere Instanzen, destroy.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeModal, focusables, initModal, openModal } from '../js/modal.js';
import { keydown, mountHtml } from './helpers/tabs-markup';
import { dialogMarkup, divMarkup, polyfillDialog, removeDialogPolyfill, tick } from './helpers/modal-markup';

type Handle = ReturnType<typeof initModal>;
let handles: Handle[] = [];
const el = (id: string) => document.getElementById(id)!;
const start = (html: string, id: string, options = {}) => {
  mountHtml(html);
  const handle = initModal(el(id), options);
  handles.push(handle);
  return handle;
};
const click = (target: Element) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const down = (target: Element) => target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

beforeEach(() => polyfillDialog());
afterEach(() => {
  for (const h of handles.splice(0)) h.destroy();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('style');
  removeDialogPolyfill();
});

describe('natives <dialog>', () => {
  it('der Auslöser öffnet per showModal, der Fokus geht auf data-dss-modal-focus', () => {
    start(dialogMarkup(), 'freigabe');
    const spy = vi.spyOn(HTMLDialogElement.prototype as never, 'showModal');
    el('freigabe-auf').focus();
    click(el('freigabe-auf'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(el('freigabe').hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(el('freigabe-ok'));
  });
  it('ohne Fokusziel bekommt die Fläche (.dss-modal, tabindex -1) den Fokus, nicht eine Schaltfläche', () => {
    start(dialogMarkup().replace(' data-dss-modal-focus', ''), 'freigabe');
    click(el('freigabe-auf'));
    expect(document.activeElement).toBe(el('freigabe').querySelector('.dss-modal'));
    expect(document.activeElement!.getAttribute('tabindex')).toBe('-1');
  });
  it('option initialFocus wählt das Ziel; eine ungültige Auswahl fällt zurück', () => {
    start(dialogMarkup(), 'freigabe', { initialFocus: '#freigabe-link' });
    click(el('freigabe-auf'));
    expect(document.activeElement).toBe(el('freigabe-link'));
    handles.pop()!.destroy();
    start(dialogMarkup(), 'freigabe', { initialFocus: '###' });
    click(el('freigabe-auf'));
    expect(document.activeElement).toBe(el('freigabe-ok'));
  });
  it('Escape schließt und gibt den Fokus an den Auslöser zurück', async () => {
    start(dialogMarkup(), 'freigabe');
    el('freigabe-auf').focus();
    click(el('freigabe-auf'));
    const event = keydown(document.activeElement!, 'Escape');
    expect(event.defaultPrevented).toBe(true);
    expect(el('freigabe').hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(el('freigabe-auf'));
    await tick(); // das native close-Ereignis kommt später und darf nichts doppelt tun
    expect(document.activeElement).toBe(el('freigabe-auf'));
  });
  it('das cancel-Ereignis (Escape-Rückfall des Browsers) wird abgefangen und schließt über uns', () => {
    start(dialogMarkup(), 'freigabe');
    click(el('freigabe-auf'));
    const cancel = new Event('cancel', { cancelable: true });
    el('freigabe').dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(el('freigabe').hasAttribute('open')).toBe(false);
  });
  it('closable: false: Escape und cancel schließen nicht, der Schließen-Knopf schon', () => {
    start(dialogMarkup(), 'freigabe', { closable: false });
    click(el('freigabe-auf'));
    expect(keydown(document.activeElement!, 'Escape').defaultPrevented).toBe(true);
    el('freigabe').dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(el('freigabe').hasAttribute('open')).toBe(true);
    click(el('freigabe').querySelector('.dss-m-close')!);
    expect(el('freigabe').hasAttribute('open')).toBe(false);
  });
  it('.dss-m-close und data-dss-modal-close schließen', () => {
    start(dialogMarkup(), 'freigabe');
    click(el('freigabe-auf'));
    click(el('freigabe').querySelector('.dss-m-close')!);
    expect(el('freigabe').hasAttribute('open')).toBe(false);
    click(el('freigabe-auf'));
    click(el('freigabe-abbr'));
    expect(el('freigabe').hasAttribute('open')).toBe(false);
  });
  it('ein Klick auf den Hintergrund schließt standardmäßig nicht', () => {
    start(dialogMarkup(), 'freigabe');
    click(el('freigabe-auf'));
    down(el('freigabe'));
    click(el('freigabe'));
    expect(el('freigabe').hasAttribute('open')).toBe(true);
  });
  it('mit dismissOnBackdrop schließt er, ein Klick im Modal nicht', () => {
    start(dialogMarkup(), 'freigabe', { dismissOnBackdrop: true });
    click(el('freigabe-auf'));
    const surface = el('freigabe').querySelector('.dss-m-body')!;
    down(surface);
    click(surface);
    expect(el('freigabe').hasAttribute('open')).toBe(true);
    down(el('freigabe'));
    click(el('freigabe'));
    expect(el('freigabe').hasAttribute('open')).toBe(false);
  });
  it('dismissOnBackdrop: Maustaste im Modal gedrückt, außerhalb losgelassen (Textmarkierung) schließt nicht', () => {
    start(dialogMarkup(), 'freigabe', { dismissOnBackdrop: true });
    click(el('freigabe-auf'));
    down(el('freigabe').querySelector('.dss-m-body')!);
    click(el('freigabe'));
    expect(el('freigabe').hasAttribute('open')).toBe(true);
  });
  it('dismissOnBackdrop mit closable: false schließt nicht', () => {
    start(dialogMarkup(), 'freigabe', { dismissOnBackdrop: true, closable: false });
    click(el('freigabe-auf'));
    down(el('freigabe'));
    click(el('freigabe'));
    expect(el('freigabe').hasAttribute('open')).toBe(true);
  });
  it('wird das Dialog von außen geschlossen (<form method="dialog">), räumt der Baustein auf', async () => {
    start(dialogMarkup(), 'freigabe');
    el('freigabe-auf').focus();
    click(el('freigabe-auf'));
    expect(document.documentElement.style.overflow).toBe('hidden');
    (el('freigabe') as HTMLDialogElement).close();
    await tick();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(el('freigabe-auf'));
  });
  it('wirft showModal, fällt es auf den Weg mit inert zurück', () => {
    start(dialogMarkup(), 'freigabe');
    vi.spyOn(HTMLDialogElement.prototype as never, 'showModal').mockImplementation(() => { throw new DOMException('x', 'InvalidStateError'); });
    click(el('freigabe-auf'));
    expect(el('freigabe').hasAttribute('open')).toBe(true);
    expect(el('freigabe-auf').hasAttribute('inert')).toBe(true);
    keydown(document.activeElement!, 'Escape');
    expect(el('freigabe').hasAttribute('open')).toBe(false);
    expect(el('freigabe-auf').hasAttribute('inert')).toBe(false);
  });
  it('ein dialog ohne showModal (alter Browser) nutzt den Weg mit inert', () => {
    removeDialogPolyfill();
    start(dialogMarkup(), 'freigabe');
    click(el('freigabe-auf'));
    expect(el('freigabe').hasAttribute('open')).toBe(true);
    expect(el('freigabe-auf').hasAttribute('inert')).toBe(true);
    click(el('freigabe-abbr'));
    expect(el('freigabe').hasAttribute('open')).toBe(false);
    expect(el('freigabe-auf').hasAttribute('inert')).toBe(false);
  });
  it('ein im Markup schon offenes dialog wird beim Start geschlossen', () => {
    start(dialogMarkup('freigabe', 'open'), 'freigabe');
    expect(el('freigabe').hasAttribute('open')).toBe(false);
  });
});

describe('Markup mit role=dialog (ohne <dialog>)', () => {
  it('startet geschlossen (hidden wird ergänzt), setzt role, aria-modal und aria-labelledby aus dem Titel', () => {
    start(divMarkup().replace(' hidden', ''), 'verwerfen');
    expect(el('verwerfen').hidden).toBe(true);
    const dialog = el('verwerfen').querySelector('.dss-modal')!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = el('verwerfen').querySelector('.dss-m-title')!;
    expect(title.id).toMatch(/^dss-modal-title-\d+$/);
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
  });
  it('vorhandene Beschriftung bleibt (aria-labelledby, aria-label)', () => {
    start(divMarkup().replace('class="dss-modal dss-modal--sm"', 'class="dss-modal" role="dialog" aria-label="Eigener Name"'), 'verwerfen');
    const dialog = el('verwerfen').querySelector('.dss-modal')!;
    expect(dialog.hasAttribute('aria-labelledby')).toBe(false);
    expect(dialog.getAttribute('aria-label')).toBe('Eigener Name');
  });
  it('role=alertdialog bleibt erhalten', () => {
    start(divMarkup().replace('class="dss-modal dss-modal--sm"', 'class="dss-modal" role="alertdialog"'), 'verwerfen');
    expect(el('verwerfen').querySelector('.dss-modal')!.getAttribute('role')).toBe('alertdialog');
  });
  it('Öffnen: hidden weg, Hintergrund der Seite inert, Fokus auf die Fläche', () => {
    start(divMarkup(), 'verwerfen');
    el('verwerfen-auf').focus();
    click(el('verwerfen-auf'));
    expect(el('verwerfen').hidden).toBe(false);
    expect(el('verwerfen-seite').hasAttribute('inert')).toBe(true);
    expect(el('verwerfen').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(el('verwerfen').querySelector('.dss-modal'));
  });
  it('Schließen: wieder hidden, inert zurückgebaut (auch ein vorher gesetztes inert bleibt), Fokus zurück', () => {
    start(divMarkup('verwerfen') + '<aside id="schon" inert>x</aside>', 'verwerfen');
    el('verwerfen-auf').focus();
    click(el('verwerfen-auf'));
    expect(el('schon').hasAttribute('inert')).toBe(true);
    keydown(document.activeElement!, 'Escape');
    expect(el('verwerfen').hidden).toBe(true);
    expect(el('verwerfen-seite').hasAttribute('inert')).toBe(false);
    expect(el('schon').hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(el('verwerfen-auf'));
  });
  it('Klick auf den Hintergrund: nur mit dismissOnBackdrop', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    const backdrop = el('verwerfen').querySelector('.dss-backdrop')!;
    down(backdrop);
    click(backdrop);
    expect(el('verwerfen').hidden).toBe(false);
    handles.pop()!.destroy();
    start(divMarkup(), 'verwerfen', { dismissOnBackdrop: true });
    click(el('verwerfen-auf'));
    const b2 = el('verwerfen').querySelector('.dss-backdrop')!;
    down(b2);
    click(b2);
    expect(el('verwerfen').hidden).toBe(true);
  });
  it('Tab-Falle: von der letzten Schaltfläche zur ersten, Umschalt+Tab von der ersten zur letzten, von der Fläche zur letzten', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    const list = focusables(el('verwerfen'));
    expect(list.map((e) => e.className || e.id)).toEqual(['dss-m-close', 'dss-btn', 'dss-btn']);
    list[2].focus();
    expect(keydown(list[2], 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(list[0]);
    expect(keydown(list[0], 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(list[2]);
    (el('verwerfen').querySelector('.dss-modal') as HTMLElement).focus();
    keydown(document.activeElement!, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(list[2]);
  });
  it('Tab in der Mitte geht ebenfalls über das Modal: auf das nächste Element, deterministisch in jedem Browser', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    const list = focusables(el('verwerfen'));
    list[0].focus();
    expect(keydown(list[0], 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(list[1]);
    keydown(list[1], 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(list[0]);
  });
  it('Tab von der Fläche (tabindex -1) geht auf das erste, Umschalt+Tab auf das letzte Element', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    const list = focusables(el('verwerfen'));
    const surface = el('verwerfen').querySelector('.dss-modal') as HTMLElement;
    surface.focus();
    keydown(surface, 'Tab');
    expect(document.activeElement).toBe(list[0]);
    surface.focus();
    keydown(surface, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(list[list.length - 1]);
  });
  it('Tab mit Fokus außerhalb holt ihn herein; ohne Fokusziele bleibt er auf der Fläche', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    (document.activeElement as HTMLElement).blur();
    keydown(document.body, 'Tab');
    expect(el('verwerfen').contains(document.activeElement)).toBe(true);
    for (const b of el('verwerfen').querySelectorAll('button')) b.setAttribute('disabled', '');
    expect(focusables(el('verwerfen'))).toHaveLength(0);
    (el('verwerfen').querySelector('.dss-modal') as HTMLElement).focus();
    expect(keydown(document.activeElement!, 'Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(el('verwerfen').querySelector('.dss-modal'));
  });
  it('Fokus, der herausfällt, kommt zurück', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    const outside = el('verwerfen-seitenlink');
    outside.removeAttribute('inert');
    outside.closest('main')!.removeAttribute('inert');
    outside.focus();
    expect(el('verwerfen').contains(document.activeElement)).toBe(true);
  });
  it('Strg/Alt/Meta + Tab bleiben dem Browser', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    const last = focusables(el('verwerfen')).pop()!;
    last.focus();
    expect(keydown(last, 'Tab', { ctrlKey: true }).defaultPrevented).toBe(false);
  });
  it('focusables überspringt verborgene, gesperrte und tabindex -1', () => {
    mountHtml(`<div id="c"><button>a</button><button disabled>b</button><button hidden>c</button><div hidden><button>d</button></div><button tabindex="-1">e</button><a href="#x">f</a><input type="hidden"><button style="display:none">g</button></div>`);
    expect(focusables(el('c')).map((e) => e.textContent)).toEqual(['a', 'f']);
  });
});

describe('Scroll-Sperre', () => {
  it('sperrt die Seite beim Öffnen und baut vollständig zurück (auch ein eigener Stil)', () => {
    document.documentElement.style.overflow = 'auto';
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    expect(document.documentElement.style.overflow).toBe('hidden');
    keydown(document.activeElement!, 'Escape');
    expect(document.documentElement.style.overflow).toBe('auto');
  });
  it('ohne eigenen Stil bleibt am Ende kein style-Attribut', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    click(el('verwerfen-abbr'));
    expect(document.documentElement.hasAttribute('style')).toBe(false);
  });
  it('lockScroll: false lässt die Seite in Ruhe', () => {
    start(divMarkup(), 'verwerfen', { lockScroll: false });
    click(el('verwerfen-auf'));
    expect(document.documentElement.style.overflow).toBe('');
  });
  it('zwei offene Modals sperren einmal; erst das letzte Schließen gibt frei', () => {
    mountHtml(divMarkup('a') + divMarkup('b'));
    handles.push(initModal(el('a')), initModal(el('b')));
    click(el('a-auf'));
    handles[1].open();
    expect(document.documentElement.style.overflow).toBe('hidden');
    handles[1].close();
    expect(document.documentElement.style.overflow).toBe('hidden');
    handles[0].close();
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('Ereignisse und Rückgabe', () => {
  it('dss:modalopen und dss:modalclose mit Grund und Auslöser; onOpen/onClose', () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    mountHtml(divMarkup());
    handles.push(initModal(el('verwerfen'), { onOpen, onClose }));
    const log: string[] = [];
    document.body.addEventListener('dss:modalopen', (e) => log.push('open:' + ((e as CustomEvent).detail.trigger?.id ?? '-')));
    document.body.addEventListener('dss:modalclose', (e) => log.push('close:' + (e as CustomEvent).detail.reason));
    click(el('verwerfen-auf'));
    keydown(document.activeElement!, 'Escape');
    click(el('verwerfen-auf'));
    click(el('verwerfen').querySelector('.dss-m-close')!);
    click(el('verwerfen-auf'));
    click(el('verwerfen-abbr'));
    handles[0].open();
    handles[0].close();
    expect(log).toEqual(['open:verwerfen-auf', 'close:escape', 'open:verwerfen-auf', 'close:close-button', 'open:verwerfen-auf', 'close:close-button', 'open:-', 'close:api']);
    expect(onOpen).toHaveBeenCalledTimes(4);
    expect(onClose).toHaveBeenCalledTimes(4);
  });
  it('open/close sind idempotent; isOpen folgt', () => {
    const h = start(divMarkup(), 'verwerfen');
    const spy = vi.fn();
    el('verwerfen').addEventListener('dss:modalopen', spy);
    expect(h.isOpen()).toBe(false);
    h.close();
    h.open();
    h.open();
    expect(h.isOpen()).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    h.close();
    h.close();
    expect(h.isOpen()).toBe(false);
  });
  it('openModal/closeModal: starten bei Bedarf; closeModal auf ein unbekanntes Element ist harmlos', () => {
    mountHtml(divMarkup());
    const api = openModal(el('verwerfen'));
    handles.push(api);
    expect(el('verwerfen').hidden).toBe(false);
    closeModal(el('verwerfen'));
    expect(el('verwerfen').hidden).toBe(true);
    expect(() => closeModal(document.body)).not.toThrow();
    expect(() => closeModal(null as never)).not.toThrow();
  });
  it('Rückgabefokus: ohne Auslöser das zuvor fokussierte Element; returnFocus überschreibt; returnFocus: false lässt den Fokus', () => {
    mountHtml(divMarkup() + '<button id="anders">anders</button>');
    const h = initModal(el('verwerfen'));
    handles.push(h);
    el('anders').focus();
    h.open();
    h.close();
    expect(document.activeElement).toBe(el('anders'));
    h.destroy();
    const h2 = initModal(el('verwerfen'), { returnFocus: el('verwerfen-seitenlink') });
    handles.push(h2);
    el('anders').focus();
    h2.open();
    h2.close();
    expect(document.activeElement).toBe(el('verwerfen-seitenlink'));
    h2.destroy();
    const h3 = initModal(el('verwerfen'), { returnFocus: false });
    handles.push(h3);
    el('anders').focus();
    h3.open();
    h3.close();
    expect(document.activeElement).not.toBe(el('anders'));
  });
  it('ein entfernter Auslöser erzeugt beim Schließen keinen Fehler', () => {
    start(divMarkup(), 'verwerfen');
    click(el('verwerfen-auf'));
    el('verwerfen-auf').remove();
    expect(() => keydown(document.activeElement!, 'Escape')).not.toThrow();
    expect(el('verwerfen').hidden).toBe(true);
  });
});

describe('mehrere Modals und gestapelte', () => {
  it('Auslöser öffnen je ihr eigenes Modal (nicht nur das erste)', () => {
    mountHtml(divMarkup('a') + divMarkup('b') + divMarkup('c'));
    for (const id of ['a', 'b', 'c']) handles.push(initModal(el(id)));
    click(el('b-auf'));
    expect([el('a').hidden, el('b').hidden, el('c').hidden]).toEqual([true, false, true]);
    click(el('b-abbr'));
    click(el('c-auf'));
    expect([el('a').hidden, el('b').hidden, el('c').hidden]).toEqual([true, true, false]);
  });
  it('Escape schließt nur das oberste; das untere bleibt offen und bekommt den Fokus zurück', () => {
    mountHtml(divMarkup('a') + divMarkup('b'));
    handles.push(initModal(el('a')), initModal(el('b')));
    click(el('a-auf'));
    const opener = el('a-ok');
    opener.setAttribute('data-dss-modal-open', 'b');
    opener.focus();
    click(opener);
    expect(el('b').hidden).toBe(false);
    keydown(document.activeElement!, 'Escape');
    expect(el('b').hidden).toBe(true);
    expect(el('a').hidden).toBe(false);
    expect(document.activeElement).toBe(opener);
    keydown(document.activeElement!, 'Escape');
    expect(el('a').hidden).toBe(true);
  });
  it('ein Auslöser mit fremder oder fehlender id öffnet nichts', () => {
    start(divMarkup(), 'verwerfen');
    mountHtml(divMarkup() + '<button id="x" data-dss-modal-open="gibt-es-nicht">x</button><button id="y" data-dss-modal-open="">y</button><button id="z" data-dss-modal-open=\'"><img src=x onerror=alert(1)>\'>z</button>');
    handles.push(initModal(el('verwerfen')));
    for (const id of ['x', 'y', 'z']) click(el(id));
    expect(el('verwerfen').hidden).toBe(true);
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
  it('ein Auslöser mit Kindelement (Symbol im Button) öffnet ebenso', () => {
    mountHtml(divMarkup().replace('>Verwerfen</button>', '><span id="inner">Verwerfen</span></button>'));
    handles.push(initModal(el('verwerfen')));
    click(el('inner'));
    expect(el('verwerfen').hidden).toBe(false);
  });
});

describe('init mehrfach, destroy', () => {
  it('init zweimal: ein Listener (ein Öffnen, ein Ereignis)', () => {
    mountHtml(divMarkup());
    handles.push(initModal(el('verwerfen')), initModal(el('verwerfen')));
    const spy = vi.fn();
    el('verwerfen').addEventListener('dss:modalopen', spy);
    click(el('verwerfen-auf'));
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('destroy im offenen Zustand baut alles zurück (inert, Scroll-Sperre, Fokus) und stellt das Markup her', () => {
    mountHtml(divMarkup());
    const before = document.body.innerHTML;
    const h = initModal(el('verwerfen'));
    el('verwerfen-auf').focus();
    click(el('verwerfen-auf'));
    h.destroy();
    h.destroy();
    expect(document.documentElement.hasAttribute('style')).toBe(false);
    expect(document.activeElement).toBe(el('verwerfen-auf'));
    expect(document.body.innerHTML).toBe(before);
  });
  it('destroy meldet kein dss:modalclose; danach reagieren Auslöser und Escape nicht mehr', () => {
    mountHtml(divMarkup());
    const h = initModal(el('verwerfen'));
    click(el('verwerfen-auf'));
    const spy = vi.fn();
    el('verwerfen').addEventListener('dss:modalclose', spy);
    h.destroy();
    expect(spy).not.toHaveBeenCalled();
    click(el('verwerfen-auf'));
    expect(el('verwerfen').hidden).toBe(true);
  });
  it('destroy eines nativen Dialogs: Markup wie zuvor', () => {
    mountHtml(dialogMarkup());
    const before = document.body.innerHTML;
    initModal(el('freigabe')).destroy();
    expect(document.body.innerHTML).toBe(before);
  });
  it('Müll als Wurzel oder als Optionen', () => {
    expect(() => initModal(null as never).destroy()).not.toThrow();
    expect(() => initModal({} as never).open()).not.toThrow();
    mountHtml(divMarkup());
    for (const o of [null, 5, [], 'x']) {
      const h = initModal(el('verwerfen'), o as never);
      h.open();
      expect(el('verwerfen').hidden).toBe(false);
      h.destroy();
    }
  });
  it('Titel mit Markup bleibt Text', () => {
    start(divMarkup().replace('Spielbericht verwerfen?', '&lt;img src=x onerror=alert(1)&gt;'), 'verwerfen');
    click(el('verwerfen-auf'));
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
});
