// Das Markup der Seite „Vanilla“ läuft mit initAll in jsdom (Tabs, Dialog, Accordion), destroy stellt es wieder her.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAll } from '../js/vanilla-core.js';
import { pageMarkup } from '../stories/Foundation/Vanilla.code';
import { dialogMarkup } from '../stories/Modal.code';
import { polyfillDialog, removeDialogPolyfill } from './helpers/modal-markup';
import { keydown, mountHtml } from './helpers/tabs-markup';

let handle: { destroy(): void; count: number } | undefined;
beforeEach(() => {
  polyfillDialog();
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn() as never;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
});
afterEach(() => {
  handle?.destroy();
  removeDialogPolyfill();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('Seite „Vanilla“ mit initAll', () => {
  it('startet zwei Leisten, einen Dialog und ein Accordion', () => {
    mountHtml(pageMarkup);
    handle = initAll(document, { accordion: { syncHash: false } });
    expect(handle.count).toBe(4);
    keydown(document.getElementById('ort-alle')!, 'ArrowRight');
    expect(document.getElementById('ort-heim-panel')!.hidden).toBe(false);
    document.getElementById('wb-pokal')!.click();
    expect(document.getElementById('wb-pokal-panel')!.hidden).toBe(false);
    document.querySelector<HTMLElement>('[data-dss-modal-open="freigabe"]')!.click();
    expect(document.getElementById('freigabe')!.hasAttribute('open')).toBe(true);
    keydown(document.activeElement!, 'Escape');
    expect(document.getElementById('freigabe')!.hasAttribute('open')).toBe(false);
  });
  it('destroy stellt das Markup wieder her', () => {
    mountHtml(pageMarkup);
    const before = document.body.innerHTML;
    handle = initAll(document, { accordion: { syncHash: false } });
    keydown(document.getElementById('ort-alle')!, 'ArrowRight');
    handle.destroy();
    expect(document.body.innerHTML).toBe(before);
  });
  it('das Markup enthält jede id nur einmal und das Dialog ist dasselbe wie auf der Modal-Seite', () => {
    const ids = [...pageMarkup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pageMarkup).toContain(dialogMarkup);
  });
});
