// Review V1b: Wettlauf mit dem nativen close-Ereignis, gestapelte Modals ohne dialog, Fokus-Rückfall, Warnung ohne Namen, passive Listener.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initModal } from '../js/modal.js';
import { keydown, mountHtml } from './helpers/tabs-markup';
import { dialogMarkup, divMarkup, polyfillDialog, removeDialogPolyfill, tick } from './helpers/modal-markup';

const el = (id: string) => document.getElementById(id)!;
const click = (target: Element) => target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
let handles: Array<{ destroy(): void }> = [];
beforeEach(() => polyfillDialog());
afterEach(() => {
  for (const h of handles.splice(0)) h.destroy();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('style');
  removeDialogPolyfill();
  vi.restoreAllMocks();
});

describe('Wettlauf mit dem nativen close-Ereignis', () => {
  it('open, close, open im selben Tick: nach dem späten close bleibt alles offen und Escape schließt noch', async () => {
    mountHtml(dialogMarkup());
    const h = initModal(el('freigabe'));
    handles.push(h);
    el('freigabe-auf').focus();
    h.open(el('freigabe-auf'));
    h.close();
    h.open(el('freigabe-auf'));
    await tick();
    expect(h.isOpen()).toBe(true);
    expect(el('freigabe').hasAttribute('open')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(el('freigabe').contains(document.activeElement)).toBe(true);
    keydown(document.activeElement!, 'Escape');
    expect(el('freigabe').hasAttribute('open')).toBe(false);
    await tick();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.activeElement).toBe(el('freigabe-auf'));
  });
  it('ein extern per showModal geöffnetes Dialog: open() bleibt konsistent', async () => {
    mountHtml(dialogMarkup());
    const dialog = el('freigabe') as HTMLDialogElement & { showModal(): void };
    const h = initModal(dialog);
    handles.push(h);
    dialog.showModal();
    h.open();
    await tick();
    expect(h.isOpen()).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(true);
    keydown(document.activeElement!, 'Escape');
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('gestapelte Modals ohne dialog', () => {
  it('das zweite ist nicht inert und hat den Fokus; Schließen des obersten gibt das darunter frei, Fokus zurück an den Auslöser darin', () => {
    mountHtml(divMarkup('a') + divMarkup('b'));
    handles.push(initModal(el('a')), initModal(el('b')));
    el('a-auf').focus();
    click(el('a-auf'));
    const opener = el('a-ok');
    opener.setAttribute('data-dss-modal-open', 'b');
    opener.focus();
    click(opener);
    expect(el('b').hasAttribute('inert')).toBe(false);
    expect(el('b').contains(document.activeElement)).toBe(true);
    expect(el('a').hasAttribute('inert')).toBe(true);
    keydown(document.activeElement!, 'Escape');
    expect(el('a').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
    keydown(document.activeElement!, 'Escape');
    expect(el('a-seite').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(el('a-auf'));
  });
  it('ein geerbtes inert an der eigenen Wurzel wird beim Öffnen entfernt und danach wiederhergestellt', () => {
    mountHtml(divMarkup('a'));
    const h = initModal(el('a'));
    handles.push(h);
    el('a').setAttribute('inert', '');
    h.open();
    expect(el('a').hasAttribute('inert')).toBe(false);
    h.close();
    expect(el('a').hasAttribute('inert')).toBe(true);
  });
});

describe('Fokus-Rückgabe ohne Auslöser', () => {
  it('Auslöser entfernt: main bekommt den Fokus (tabindex nur solange), nicht body', () => {
    mountHtml(divMarkup('a'));
    const h = initModal(el('a'));
    handles.push(h);
    click(el('a-auf'));
    el('a-auf').remove();
    h.close();
    expect(document.activeElement).toBe(el('a-seite'));
    expect(el('a-seite').getAttribute('tabindex')).toBe('-1');
    (document.activeElement as HTMLElement).blur();
    expect(el('a-seite').hasAttribute('tabindex')).toBe(false);
  });
  it('Auslöser im geschlossenen Bereich (hidden): Rückfall ebenso', () => {
    mountHtml(divMarkup('a'));
    const h = initModal(el('a'));
    handles.push(h);
    click(el('a-auf'));
    el('a-auf').hidden = true;
    h.close();
    expect(document.activeElement).toBe(el('a-seite'));
  });
  it('ist der Auslöser eines gestapelten Modals weg, bekommt die Fläche des darunter offenen den Fokus', () => {
    mountHtml(divMarkup('a') + divMarkup('b'));
    handles.push(initModal(el('a')), initModal(el('b')));
    click(el('a-auf'));
    const opener = el('a-ok');
    opener.setAttribute('data-dss-modal-open', 'b');
    click(opener);
    opener.remove();
    keydown(document.activeElement!, 'Escape');
    expect(document.activeElement).toBe(el('a').querySelector('.dss-modal'));
  });
});

describe('Hinweise', () => {
  it('ein Modal ohne zugänglichen Namen warnt in der Konsole, eines mit Titel nicht', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mountHtml(divMarkup('a').replace('<h2 class="dss-m-title">', '<h2>'));
    handles.push(initModal(el('a')));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('zugänglichen Namen');
    handles.pop()!.destroy();
    mountHtml(divMarkup('b'));
    handles.push(initModal(el('b')));
    expect(warn).toHaveBeenCalledTimes(1);
  });
  it('touchstart-Listener sind passive', () => {
    mountHtml(divMarkup('a'));
    const spy = vi.spyOn(el('a'), 'addEventListener');
    handles.push(initModal(el('a')));
    const touch = spy.mock.calls.find((c) => c[0] === 'touchstart')!;
    expect(touch[2]).toMatchObject({ passive: true });
  });
  it('Druck hebt die Scroll-Sperre auf', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('css/components.css', 'utf8');
    expect(css).toMatch(/@media print \{\s*html \{ overflow: visible !important;/);
  });
});
