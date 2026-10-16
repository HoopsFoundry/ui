import type { HoopsHandle } from './lifecycle.js';

export type ModalCloseReason = 'escape' | 'backdrop' | 'close-button' | 'native' | 'api' | 'destroy' | (string & {});

export interface ModalOpenDetail {
  /** Das auslösende Element (`data-hoops-modal-open`) oder `null` (Aufruf aus dem Code). */
  trigger: Element | null;
}
export interface ModalCloseDetail extends ModalOpenDetail {
  reason: ModalCloseReason;
}

export interface ModalOptions {
  /** Ein Klick auf den Hintergrund schließt (Standard `false`, wie in den Svelte-/React-Modals). */
  dismissOnBackdrop?: boolean;
  /** Escape und Hintergrund schließen (Standard `true`); `data-hoops-modal-close` und `.hoops-m-close` schließen immer. */
  closable?: boolean;
  /** CSS-Auswahl im Modal für den Anfangsfokus (sonst `[data-hoops-modal-focus]`, `[autofocus]`, zuletzt die Fläche). */
  initialFocus?: string;
  /** Element, das beim Schließen den Fokus bekommt, oder `false` (Standard: der Auslöser, sonst das zuvor fokussierte Element). */
  returnFocus?: Element | false;
  /** Scroll-Sperre der Seite während das Modal offen ist (Standard `true`). */
  lockScroll?: boolean;
  onOpen?: (detail: ModalOpenDetail) => void;
  onClose?: (detail: ModalCloseDetail) => void;
}

export interface ModalHandle extends HoopsHandle {
  open(trigger?: Element | null): void;
  close(reason?: ModalCloseReason): void;
  isOpen(): boolean;
}

export const MODAL_OPEN_EVENT: 'hoops:modalopen';
export const MODAL_CLOSE_EVENT: 'hoops:modalclose';
/** Fokussierbare Elemente in `container` in Dokumentreihenfolge (ohne gesperrte, verborgene, inerte, `tabindex="-1"`). */
export function focusables(container: Element): HTMLElement[];
/** Macht ein Modal bedienbar (geschlossen): natives `<dialog>` oder Markup mit `role="dialog"`. */
export function initModal(root: Element, options?: ModalOptions): ModalHandle;
/** Öffnet das Modal (startet es mit den Standardoptionen, falls nötig). */
export function openModal(el: Element, trigger?: Element | null): ModalHandle;
/** Schließt das Modal; ohne Wirkung, wenn es nicht offen ist. */
export function closeModal(el: Element, reason?: ModalCloseReason): void;
