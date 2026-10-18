import type { HoopsHandle } from './lifecycle.js';

export interface BackToTopOptions {
  /** Sprache nur für diesen Baustein (sonst die globale Sprache, ein Sprachwechsel führt die Texte nach). */
  locale?: string;
  /** Eigene Texte nach Katalogschlüssel (Vorrang vor den globalen Überschreibungen und dem Katalog; die Option des Bausteins, zum Beispiel `label`, geht vor). */
  texts?: Record<string, string | { one: string; other: string; [form: string]: string }>;
  /** Name des Knopfes (Standard „Nach oben“). */
  label?: string;
  /** Alias für `label`. */
  backLabel?: string;
  /** Element oder Auswahl, in das der Knopf kommt (Standard `body`). */
  container?: Element | string | null;
  /** Vorhandener Knopf, der übernommen wird, statt einen anzulegen. */
  button?: HTMLButtonElement | null;
  /** Gescrollte Pixel, ab denen der Knopf erscheint (Standard 480). */
  showAfter?: number;
  /** Auswahl des Fokusziels nach dem Klick (Standard `h1`; Rückfall `main`). */
  target?: string;
  /** Auswahl einer festen unteren Leiste, über der der Knopf sitzt (Standard `.hoops-bnav`); `null` schaltet das ab. */
  avoid?: string | null;
  /** Zusätzlicher Abstand von unten als CSS-Länge; setzt `--hoops-backtop-offset` am Knopf. */
  offset?: string;
}

export function backTopVisible(state: { scrollY: number; innerHeight: number; scrollHeight: number; showAfter?: number }): boolean;
/** Legt den Nach-oben-Knopf an; `destroy()` entfernt ihn samt Listenern. Ein zweiter Aufruf für denselben Container ersetzt den ersten. */
export function initBackToTop(options?: BackToTopOptions): HoopsHandle;
