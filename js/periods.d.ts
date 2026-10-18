import type { TOptions } from './i18n/index.js';

/** 4 Viertel (Standard) oder 8 Achtel (Mini-Basketball). */
export type PeriodCount = 4 | 8;

export interface PeriodDisplay {
  /** Ausgeschriebene Bezeichnung ("3. Viertel"); bei Alias der unveränderte `quarter`-Text. */
  label: string;
  /** Kurzform für Chips ("V3"); bei Alias der unveränderte `quarter`-Text. */
  short: string;
  /** `true`, wenn der Text aus dem veralteten `quarter` stammt. */
  alias: boolean;
}

/** Ganze Zahl ab 1. */
export function isPeriod(period: unknown): period is number;
/** Nur 8 bleibt 8; alles andere ergibt 4. */
export function normalizePeriods(periods: unknown): PeriodCount;
/** "3. Viertel", "5. Achtel", "Verlängerung", "2. Verlängerung"; leer bei ungültigem Wert. */
export function periodLabel(period: number | undefined, periods?: PeriodCount, options?: TOptions): string;
/** "V3", "A5", "VL", "VL2"; leer bei ungültigem Wert. */
export function periodShort(period: number | undefined, periods?: PeriodCount, options?: TOptions): string;
/** Gültiges `period` gewinnt; sonst wird ein gesetzter `quarter`-Text (veraltet) unverändert gezeigt. */
export function resolvePeriod(input?: { period?: number; periods?: PeriodCount; quarter?: string }, options?: TOptions): PeriodDisplay;
