/**
 * DSS Modal · Dialog auf vorhandenem Markup
 * --------------------------------------------------------------
 * `initModal(root, options)` macht ein `dss-modal` bedienbar, `openModal(el)` und `closeModal(el)` öffnen und schließen es. Zwei Wege:
 *  - **Natives `<dialog>`** (`root` ist ein `dialog`): `showModal()` übernimmt Hintergrund (`::backdrop`), Top-Layer und das Abschalten der Seite dahinter.
 *  - **Sonst** (ein Element mit `hidden`, das Hintergrund und `role="dialog"` enthält): `role="dialog"`, `aria-modal="true"`, die Geschwister des
 *    Modals werden `inert`, `hidden` wird umgeschaltet. Dasselbe gilt für ein `dialog` ohne `showModal` (alte Browser, jsdom).
 * Gemeinsam: der Fokus geht beim Öffnen auf `[data-dss-modal-focus]`/`[autofocus]`, sonst auf die Fläche (`.dss-modal`, `tabindex="-1"`) und kehrt
 * beim Schließen zum Auslöser zurück; Tab bleibt im Modal (Fokusfalle); Escape schließt (außer `closable: false`); ein Klick auf den Hintergrund
 * schließt nur mit `dismissOnBackdrop` (Standard aus, wie in den Svelte-/React-Modals); die Seite dahinter scrollt nicht (Scroll-Sperre, Rückbau
 * beim Schließen). Auslöser sind `data-dss-modal-open="<id>"` (irgendwo im Dokument) und `data-dss-modal-close` oder `.dss-m-close` (im Modal).
 * Meldet `dss:modalopen` und `dss:modalclose`. Kein `innerHTML`, kein Zugriff auf `window`/`document` beim Import. Typen: js/modal.d.ts.
 */
import { createCleanups, createRegistry, listen, snapshotAttributes } from './lifecycle.js';

export const MODAL_OPEN_EVENT = 'dss:modalopen';
export const MODAL_CLOSE_EVENT = 'dss:modalclose';
const registry = createRegistry();
const instances = new WeakMap(); // Wurzel -> Handle
const stack = []; // offene Modals, das oberste zuletzt (nur es reagiert auf Tastatur und Fokus)
const locks = new WeakMap(); // Dokument -> Scroll-Sperre
let uid = 0;

const FOCUSABLE = 'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, [contenteditable=""], [contenteditable="true"], [tabindex]';

/** Fokussierbare Elemente in `container` in Dokumentreihenfolge (ohne gesperrte, verborgene, inerte und `tabindex="-1"`). */
export function focusables(container) {
  const win = container.ownerDocument?.defaultView;
  return [...container.querySelectorAll(FOCUSABLE)].filter((el) => {
    if (el.disabled || el.getAttribute('tabindex') === '-1' || el.closest('[hidden], [inert]')) return false;
    const style = win?.getComputedStyle?.(el);
    return !style || (style.display !== 'none' && style.visibility !== 'hidden');
  });
}

/** Sperrt das Scrollen der Seite (zählend: mehrere offene Modals sperren einmal); die Breite der Bildlaufleiste wird ausgeglichen. */
function lockScroll(doc) {
  let lock = locks.get(doc);
  if (!lock) {
    const html = doc.documentElement;
    const win = doc.defaultView;
    const gap = Math.max(0, (win?.innerWidth ?? 0) - html.clientWidth);
    lock = { count: 0, overflow: html.style.overflow, padding: html.style.getPropertyValue('padding-inline-end') };
    if (gap && !lock.padding) html.style.setProperty('padding-inline-end', `${gap}px`);
    html.style.overflow = 'hidden';
    locks.set(doc, lock);
  }
  lock.count++;
}
function unlockScroll(doc) {
  const lock = locks.get(doc);
  if (!lock || --lock.count > 0) return;
  const html = doc.documentElement;
  html.style.overflow = lock.overflow;
  if (lock.padding) html.style.setProperty('padding-inline-end', lock.padding);
  else html.style.removeProperty('padding-inline-end');
  if (!html.getAttribute('style')) html.removeAttribute('style');
  locks.delete(doc);
}

/** Macht alle Geschwister von `el` und seinen Vorfahren (bis `body`) inert; gibt die Funktion zum Rückbau zurück (nur was wir gesetzt haben). */
function inertAround(el) {
  const changed = [];
  const body = el.ownerDocument.body;
  for (let node = el; node && node !== body; node = node.parentElement) {
    const parent = node.parentElement;
    if (!parent) break;
    for (const sibling of parent.children) {
      if (sibling === node || sibling.hasAttribute('inert') || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sibling.tagName)) continue;
      sibling.setAttribute('inert', '');
      changed.push(sibling);
    }
  }
  return () => {
    for (const sibling of changed) sibling.removeAttribute('inert');
  };
}

const isElement = (value) => Boolean(value) && typeof value === 'object' && value.nodeType === 1;

/**
 * Macht ein Modal bedienbar (geschlossen). Optionen: `dismissOnBackdrop` (Klick auf den Hintergrund schließt; Standard `false`), `closable`
 * (Escape und Hintergrund schließen; Standard `true`; `data-dss-modal-close` schließt immer), `initialFocus` (CSS-Auswahl im Modal),
 * `returnFocus` (Element, das beim Schließen den Fokus bekommt, oder `false`; Standard der Auslöser), `lockScroll` (Standard `true`),
 * `onOpen(detail)`, `onClose(detail)`. Rückgabe `{ destroy(), open(trigger?), close(reason?), isOpen() }`.
 */
export function initModal(root, options = {}) {
  const none = { destroy() {}, open() {}, close() {}, isOpen: () => false };
  if (typeof document === 'undefined' || !isElement(root)) return none;
  registry.release(root);

  const doc = root.ownerDocument ?? document;
  const opts = options && typeof options === 'object' ? options : {};
  const closable = opts.closable !== false;
  const dismissOnBackdrop = opts.dismissOnBackdrop === true;
  const locksScroll = opts.lockScroll !== false;

  const cleanups = createCleanups();
  const isDialog = root.localName === 'dialog';
  const dialogEl = isDialog ? root : root.matches('[role="dialog"], [role="alertdialog"]') ? root : root.querySelector('[role="dialog"], [role="alertdialog"]') ?? root.querySelector('.dss-modal') ?? root;
  const surface = root.querySelector('.dss-modal') ?? dialogEl;
  const backdropEl = root.querySelector('.dss-backdrop');
  const wrapEl = root.querySelector('.dss-modal-wrap');

  // Markup vorbereiten (destroy stellt es wieder her)
  cleanups.add(snapshotAttributes(root, ['hidden', 'open']));
  cleanups.add(snapshotAttributes(dialogEl, ['role', 'aria-modal', 'aria-labelledby']));
  cleanups.add(snapshotAttributes(surface, ['tabindex']));
  if (!isDialog) root.hidden = true;
  else root.removeAttribute('open');
  if (!isDialog && !dialogEl.hasAttribute('role')) dialogEl.setAttribute('role', 'dialog');
  if (!isDialog) dialogEl.setAttribute('aria-modal', 'true');
  if (!dialogEl.hasAttribute('aria-labelledby') && !dialogEl.hasAttribute('aria-label')) {
    const title = root.querySelector('.dss-m-title, [data-dss-modal-title]');
    if (title) {
      cleanups.add(snapshotAttributes(title, ['id']));
      if (!title.id) title.id = `dss-modal-title-${++uid}`;
      dialogEl.setAttribute('aria-labelledby', title.id);
    }
  }
  if (!surface.hasAttribute('tabindex')) surface.setAttribute('tabindex', '-1');

  let opened = false;
  let nativeOpen = false;
  let restoreInert = null;
  let returnTo = null;
  let lastTrigger = null;
  const record = { root };

  const emit = (type, detail, callback) => {
    root.dispatchEvent(new CustomEvent(type, { bubbles: true, detail }));
    if (typeof callback === 'function') callback(detail);
  };
  const focusTarget = () => {
    let target = null;
    if (typeof opts.initialFocus === 'string') {
      try {
        target = root.querySelector(opts.initialFocus);
      } catch {
        target = null;
      }
    }
    return target ?? root.querySelector('[data-dss-modal-focus], [autofocus]') ?? surface;
  };
  const isTop = () => stack[stack.length - 1] === record;

  // Aufräumen nach dem Schließen (gemeinsam für unseren Aufruf und das native `close`-Ereignis)
  const finish = (reason, quiet) => {
    const index = stack.indexOf(record);
    if (index >= 0) stack.splice(index, 1);
    restoreInert?.();
    restoreInert = null;
    if (!isDialog) root.hidden = true;
    if (locksScroll) unlockScroll(doc);
    const target = returnTo;
    returnTo = null;
    if (target && target.isConnected && typeof target.focus === 'function') target.focus();
    if (!quiet) emit(MODAL_CLOSE_EVENT, { reason, trigger: lastTrigger }, opts.onClose);
  };

  const close = (reason = 'api', quiet = false) => {
    if (!opened) return;
    opened = false;
    if (nativeOpen && root.open) root.close();
    else if (isDialog) root.removeAttribute('open');
    nativeOpen = false;
    finish(reason, quiet);
  };

  const open = (trigger) => {
    if (opened) return;
    opened = true;
    const active = doc.activeElement;
    lastTrigger = isElement(trigger) ? trigger : null;
    returnTo = opts.returnFocus === false ? null : isElement(opts.returnFocus) ? opts.returnFocus : lastTrigger ?? (active && active !== doc.body ? active : null);
    stack.push(record);
    if (isDialog && typeof root.showModal === 'function') {
      try {
        if (root.open) root.close();
        root.showModal();
        nativeOpen = true;
      } catch {
        nativeOpen = false;
      }
    }
    if (!nativeOpen) {
      if (isDialog) root.setAttribute('open', '');
      else root.hidden = false;
      restoreInert = inertAround(root);
    }
    if (locksScroll) lockScroll(doc);
    focusTarget().focus({ preventScroll: true });
    emit(MODAL_OPEN_EVENT, { trigger: lastTrigger }, opts.onOpen);
  };

  // Tastatur: Escape schließt, Tab bleibt im Modal
  cleanups.add(listen(doc, 'keydown', (event) => {
    if (!opened || !isTop() || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (closable) close('escape');
      return;
    }
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const list = focusables(dialogEl);
    const first = list[0] ?? surface;
    const last = list[list.length - 1] ?? surface;
    const active = doc.activeElement;
    if (!dialogEl.contains(active) || (event.shiftKey && (active === first || active === surface)) || (!event.shiftKey && active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  }, true));
  // Fokus, der doch herausfällt (z. B. per Programm), kommt zurück
  cleanups.add(listen(doc, 'focusin', (event) => {
    if (!opened || !isTop() || dialogEl.contains(event.target)) return;
    (focusables(dialogEl)[0] ?? surface).focus();
  }));
  // Natives Dialog: Abbrechen (Escape-Rückfall) und Schließen von außen (z. B. <form method="dialog">)
  if (isDialog) {
    cleanups.add(listen(root, 'cancel', (event) => {
      event.preventDefault();
      if (opened && closable && isTop()) close('escape');
    }));
    cleanups.add(listen(root, 'close', () => {
      if (!opened) return;
      opened = false;
      nativeOpen = false;
      finish('native');
    }));
  }
  // Auslöser im Dokument
  cleanups.add(listen(doc, 'click', (event) => {
    const trigger = event.target instanceof doc.defaultView.Element ? event.target.closest('[data-dss-modal-open]') : null;
    if (!trigger || !root.id || trigger.getAttribute('data-dss-modal-open') !== root.id || root.contains(trigger)) return;
    event.preventDefault();
    open(trigger);
  }));
  // Schließen-Knöpfe und Hintergrund
  let downOnBackdrop = false;
  const onBackdrop = (target) => target === backdropEl || target === wrapEl || (isDialog && target === root);
  for (const type of ['mousedown', 'pointerdown', 'touchstart']) cleanups.add(listen(root, type, (event) => { downOnBackdrop = onBackdrop(event.target); }, true));
  cleanups.add(listen(root, 'click', (event) => {
    const target = event.target;
    if (!(target instanceof doc.defaultView.Element)) return;
    const button = target.closest('.dss-m-close, [data-dss-modal-close]');
    if (button && root.contains(button)) {
      event.preventDefault();
      close('close-button');
      return;
    }
    if (dismissOnBackdrop && closable && downOnBackdrop && onBackdrop(target)) close('backdrop');
    downOnBackdrop = false;
  }));

  const handle = registry.claim(root, () => {
    close('destroy', true);
    instances.delete(root);
    cleanups.run();
  });
  const api = { destroy: handle.destroy, open, close: (reason) => close(reason), isOpen: () => opened };
  instances.set(root, api);
  return api;
}

/** Öffnet das Modal `el` (startet es mit den Standardoptionen, falls noch nicht geschehen). Gibt das Handle zurück. */
export function openModal(el, trigger) {
  const api = instances.get(el) ?? initModal(el);
  api.open(trigger);
  return api;
}

/** Schließt das Modal `el` (ohne Wirkung, wenn es nicht offen oder nicht gestartet ist). */
export function closeModal(el, reason) {
  instances.get(el)?.close(reason);
}
