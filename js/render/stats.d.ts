import type { LeagueFormEntry } from '../league.js';
import type { StatInput } from '../stats.js';
import type { MountHandle, MountOptions } from './mount.js';

export interface StatsProps {
  /** Kennzahlen: `{ label, value }`; Zahlen bekommen das Dezimalkomma, ein fehlender Wert zeigt einen Gedankenstrich. */
  items: StatInput[];
  /** Ohne Kacheln, in einer Zeile. */
  compact?: boolean;
  className?: string;
}
export interface FormChipsProps {
  /** Ergebnisse, neueste zuletzt: `S`, `N`, `U`; angezeigt werden höchstens die letzten fünf. */
  form: LeagueFormEntry[];
  variant?: 'dots' | 'letters';
  className?: string;
}

export function renderStats(props: StatsProps): string;
export function renderFormChips(props: FormChipsProps): string;
export function mountStats(el: Element, props: StatsProps, options?: MountOptions): MountHandle<StatsProps>;
export function mountFormChips(el: Element, props: FormChipsProps, options?: MountOptions): MountHandle<FormChipsProps>;
