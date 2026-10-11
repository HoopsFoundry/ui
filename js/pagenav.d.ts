import type { DssHandle } from './lifecycle.js';

export interface PageNavOptions {
  /** CSS-Auswahl der Ziele in `root` (Standard `'h2, [data-pagenav]'`). Eine ungültige Auswahl fällt auf den Standard zurück. */
  selector?: string;
  /** Element oder Auswahl, in das die Navigation vor den ersten Block mit einem Ziel gesetzt wird (Standard `root`). */
  container?: Element | string | null;
  /** Sichtbarer Text und Name der Navigation (Standard „Auf dieser Seite“). Mehrere Navigationen auf einer Seite brauchen verschiedene Namen (axe: `landmark-unique`). */
  label?: string;
  /** Mindestzahl der Einträge, ab der die Navigation erscheint (Standard 3). */
  minHeadings?: number;
  /** Ziele mit diesem Attribut (oder in einem Element mit diesem Attribut) fehlen (Standard `data-pagenav-skip`). */
  skipAttribute?: string;
  /** Nachgeladene Überschriften beobachten (Standard `true`). */
  observe?: boolean;
  /** Ein Anker auf ein Ziel in einem geschlossenen Bereich öffnet ihn (Standard `true`). */
  syncHash?: boolean;
}

export interface PageNavEntry {
  id: string;
  text: string;
  el: Element;
}

export const MIN_HEADINGS: number;
/** Id-Teil aus einem Text (Umlaute aufgelöst); nie leer. */
export function slug(text: unknown): string;
/** `data-pagenav` oder der Text des Ziels, Leerraum zusammengefasst. */
export function labelOf(el: Element): string;
/** Einträge aus den Zielen; vergibt fehlende ids eindeutig (`abschnitt-<slug>`, `-2` …). */
export function entries(targets: Iterable<Element>, taken?: Set<string>, onNewId?: (el: Element) => void): PageNavEntry[];
export function signature(list: readonly { id: string; text: string }[]): string;
/** Baut die Seitennavigation für `root`; `destroy()` entfernt alles, was der Baustein angelegt hat. Ein zweiter Aufruf für dieselbe Wurzel ersetzt den ersten. */
export function initPageNav(root: Element, options?: PageNavOptions): DssHandle;
