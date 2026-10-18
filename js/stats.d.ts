import type { TOptions } from './i18n/index.js';

/** Eine Kennzahl: Beschriftung und Wert. */
export interface StatInput {
  label: string;
  /** Zahl (Dezimaltrennzeichen der Sprache) oder Text; `null` oder leer ergibt den Gedankenstrich mit verstecktem Text „keine Angabe“. */
  value?: number | string | null;
}

export interface StatItem {
  label: string;
  /** Anzeigetext; bei `empty` der Gedankenstrich. */
  value: string;
  empty: boolean;
}

/** Text für den fehlenden Wert in der globalen Sprache (Live-Binding, `statItems` frischt ihn auf); neuer Code nutzt `statEmptyLabel`. */
export let statEmptyText: string;
/** Text für den fehlenden Wert in der Sprache des Aufrufs (`options.locale`, `options.texts`). */
export function statEmptyLabel(options?: TOptions): string;
export function statItems(items: unknown, options?: TOptions): StatItem[];
