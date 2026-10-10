// Gemeinsamer Kontext von Accordion (Gruppe) und AccordionItem (Bereich) im Svelte-Baum.
// Rein JavaScript, damit die Komponenten ohne Zusatzschritt ausgeliefert werden. Alle Werte der Gruppe sind Getter und werden
// erst beim Lesen aufgelöst (kein Schnappschuss): so folgen die Bereiche einem Wechsel von `exclusive`, `titleAs` usw.
import { getContext, setContext } from 'svelte';

const GROUP = Symbol.for('dss.accordionGroup');
const ITEM = Symbol.for('dss.accordionItem');

/**
 * @typedef {object} AccordionEntry Ein registrierter Bereich (Getter, damit die Werte aktuell bleiben).
 * @property {string} id
 * @property {string} title
 * @property {boolean} open
 * @property {boolean} disabled
 * @property {HTMLElement | undefined} el
 * @property {HTMLElement | undefined} trigger
 * @property {() => void} reveal Öffnet den Bereich samt allen Eltern-Bereichen.
 * @property {(open: boolean) => void} setOpen
 */

/**
 * @typedef {object} AccordionGroupApi
 * @property {boolean} exclusive
 * @property {boolean} syncHash
 * @property {unknown} titleAs
 * @property {number} count Anzahl der registrierten Bereiche (0 beim Server-Rendering).
 * @property {(entry: AccordionEntry) => () => void} register Meldet einen Bereich an; die Rückgabe meldet ihn wieder ab.
 * @property {(id: string) => void} closeOthers
 * @property {(id: string, open: boolean) => void} opened Merkt den zuletzt geöffneten Bereich (Sprungleiste).
 * @property {(event: KeyboardEvent) => void} onKey
 */

/** @param {AccordionGroupApi} api */
export function provideGroup(api) {
  setContext(GROUP, api);
}

/** @returns {AccordionGroupApi | undefined} */
export function useGroup() {
  return /** @type {AccordionGroupApi | undefined} */ (getContext(GROUP));
}

/**
 * Der Bereich, in dessen Inhalt wir stehen (für verschachtelte Gruppen und das Öffnen der Eltern).
 * @param {{ readonly id: string, reveal: () => void }} api
 */
export function provideItem(api) {
  setContext(ITEM, api);
}

/** @returns {{ readonly id: string, reveal: () => void } | undefined} */
export function useParentItem() {
  return /** @type {{ id: string, reveal: () => void } | undefined} */ (getContext(ITEM));
}
