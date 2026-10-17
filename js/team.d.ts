import type { ScheduleOutcome, ScheduleTeam } from './schedule.js';
import type { TOptions } from './i18n/index.js';

/** Gegner oder eigenes Team: dieselben Felder wie `ScheduleTeam` (Name, Kurzname, Logo). */
export type TeamRef = Pick<ScheduleTeam, 'name' | 'short' | 'logo'>;

export interface TeamRecord {
  /** Siege */
  w: number;
  /** Niederlagen */
  l: number;
  /** Unentschieden (nur Sportarten bzw. Ligen mit Unentschieden) */
  d?: number;
}

export interface TeamNext {
  date?: string;
  time?: string;
  opponent: TeamRef;
  /** `heim` zeigt "vs.", `gast` zeigt "@". */
  at?: 'heim' | 'gast';
  venue?: string;
}

export interface TeamLast {
  date?: string;
  opponent: TeamRef;
  ownScore: number;
  opponentScore: number;
  at?: 'heim' | 'gast';
  /** Überschreibt die aus den Punkten berechnete Bewertung (Forfait, Wertung gegen die Zahlen), wie `ScheduleGame.outcome`. */
  outcome?: ScheduleOutcome;
}

export interface TeamSquad {
  players: number;
  staff?: number;
}

export interface TeamStats {
  /** Zwei-Punkte-Quote in Prozent */
  twoPtPct?: number;
  /** Drei-Punkte-Quote in Prozent */
  threePtPct?: number;
  /** Rebounds gesamt */
  trb?: number;
  /** Ballverluste */
  to?: number;
}

export function formatNumber(value: number | undefined, options?: TOptions): string;
export function recordInfo(record: TeamRecord | undefined, options?: TOptions): { text: string; label: string; aria: string } | undefined;
export function rankInfo(rank: number | undefined, rankOf?: number, options?: TOptions): { text: string; label: string; aria: string } | undefined;
export function squadText(squad: TeamSquad | undefined, options?: TOptions): string;
export function statEntries(stats: TeamStats | undefined, options?: TOptions): { key: keyof TeamStats; label: string; value: string }[];
export function lastResult(last: TeamLast | undefined, options?: TOptions): { outcome: ScheduleOutcome | undefined; score: string; aria: string } | undefined;
export function opponentPrefix(at: 'heim' | 'gast' | undefined, options?: TOptions): string;
