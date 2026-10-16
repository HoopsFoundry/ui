import type { HoopsHandle } from './lifecycle.js';

/** Ein Tab für die Tastaturnavigation: `disabled` überspringt ihn (oder `true`). */
export type TabState = { disabled?: boolean } | boolean;

export interface NextTabOptions {
  /** Senkrechte Leiste: Pfeil ab/auf statt rechts/links (Standard `false`). */
  vertical?: boolean;
  /** Rechts-nach-links: Pfeil links/rechts vertauscht (Standard `false`). */
  rtl?: boolean;
  /** Pfeile laufen am Rand um (Standard `true`, wie in den Svelte-/React-Tabs). */
  wrap?: boolean;
}

export interface TabChangeDetail {
  /** Index des Tabs, der gewählt (oder bei `multi` umgeschaltet) wurde. */
  index: number;
  /** `data-tab` oder `id` des Tabs (sonst leer). */
  id: string;
  tab: HTMLElement;
  /** Das zugehörige Panel (über `aria-controls`) oder `null`. */
  panel: HTMLElement | null;
  /** `user` (Klick, Tastatur), `hash` (Anker), `api` (`select`). */
  source: 'user' | 'hash' | 'api';
  /** Nur bei `multi`: neuer Zustand des Schalters und alle gedrückten. */
  pressed?: boolean;
  ids?: string[];
}

export interface TabsOptions {
  /** `auto`: Pfeiltasten wählen sofort (Standard, wie Svelte/React); `manual`: Pfeiltasten bewegen nur den Fokus, Enter/Leertaste wählt. */
  activation?: 'auto' | 'manual';
  /** Senkrechte Leiste (Standard: `aria-orientation="vertical"` oder `hoops-tabs--vertical`). */
  vertical?: boolean;
  /** Mehrfachauswahl mit `aria-pressed` (Standard: die Leiste hat `role="group"`). */
  multi?: boolean;
  /** Anfangstab: Index, `data-tab` oder `id`. */
  value?: string | number;
  /** Deep-Link: `#id` eines Tabs, Panels oder eines Elements in einem Panel wählt den Tab; eine Wahl schreibt den Anker (Standard `false`). */
  hash?: boolean;
  onChange?: (detail: TabChangeDetail) => void;
}

export interface TabsHandle extends HoopsHandle {
  /** Wählt einen Tab (Index, `data-tab`/`id` oder Element); gesperrte und unbekannte werden ignoriert. */
  select(target: number | string | Element): void;
  /** `data-tab` oder `id` des gewählten Tabs (bei `multi` die Liste der gedrückten); ohne Tabs `null`. */
  getValue(): string | string[] | null;
}

export const TAB_EVENT: 'hoops:tabchange';
/** Index, auf den eine Taste springt (Pfeil, Pos1, Ende); gesperrte Tabs werden übersprungen. Andere Tasten ergeben `index`. */
export function nextTab(index: number, key: string, tabs: TabState[], options?: NextTabOptions): number;
/** Anfangsauswahl: gewünschter, sonst markierter, sonst erster nicht gesperrter Index; ohne Tabs `-1`. */
export function initialTab(tabs: TabState[], wanted?: number, marked?: number): number;
/** Macht die Leiste bedienbar (Pfeiltasten, Pos1/Ende, `aria-selected`, roving tabindex, Panels). */
export function initTabs(root: Element, options?: TabsOptions): TabsHandle;
