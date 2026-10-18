import type { ScheduleTeam } from './schedule.js';
import type { TOptions } from './i18n/index.js';

/** Zone einer Mannschaft: Aufstieg, Relegation (Aufstiegsspiele bzw. Abstiegsrunde) oder Abstieg. */
export type LeagueZone = 'up' | 'playoff' | 'down';
/** Ergebnis eines Spiels in der Form: Sieg, Niederlage, Unentschieden. */
export type LeagueFormEntry = 'S' | 'N' | 'U';
/** Optionale Spalten der Ligencard. */
export type LeagueColumn = 'won' | 'lost' | 'diff' | 'form';

export interface LeagueTeam extends Pick<ScheduleTeam, 'name' | 'short' | 'logo' | 'href'> {
  /** Platz in der Tabelle (ganze Zahl ab 1). */
  rank: number;
  /** Spiele gespielt (SP). */
  played: number;
  /** Punkte (PKT). */
  points: number;
  /** Siege (S) und Niederlagen (N), nur mit der jeweiligen Spalte sichtbar. */
  won?: number;
  lost?: number;
  /** Korbdifferenz, positiv oder negativ. */
  diff?: number;
  /** Letzte Spiele, neueste zuletzt; angezeigt werden höchstens fünf. */
  form?: LeagueFormEntry[];
  /** Eigene Mannschaft: hervorgehoben und Mittelpunkt des Ausschnitts. */
  own?: boolean;
  zone?: LeagueZone;
}

export interface LeagueWindowOptions {
  /** Zeilen ohne eigene Mannschaft (Standard 3). */
  limit?: number;
  /** Zeilen vor der eigenen Mannschaft (Standard 2). */
  before?: number;
  /** Zeilen nach der eigenen Mannschaft (Standard 1). */
  after?: number;
}

export interface LeagueSummaryInput {
  teamCount?: number;
  played?: number;
  total?: number;
}

export interface LeagueZoneInfo {
  zone: LeagueZone;
  /** Versteckter Text in der Zeile ("Aufstiegsplatz"). */
  row: string;
  /** Text in der Legende ("Aufstieg"). */
  legend: string;
}

export interface LeagueLiveInfo {
  count?: number;
  /** "3 Spiele laufen"; leer bei `live: true`. */
  text: string;
}

export function leagueWindow<T extends { rank: number; own?: boolean }>(teams: readonly T[], options?: LeagueWindowOptions): T[];
export function leagueSummary(input?: LeagueSummaryInput, options?: TOptions): string;
export function formEntries(form: unknown): LeagueFormEntry[];
export function formLabel(form: unknown, options?: TOptions): string;
/** Kennbuchstabe eines Ergebnisses (`S`, `N`, `U` der Daten) in der Sprache: deutsch S, N, U, englisch W, L, D; sonst leer. */
export function outcomeLetter(entry: unknown, options?: TOptions): string;
export function windowLabel(window: readonly { rank: number }[], teamCount?: number, options?: TOptions): string;
export function diffText(value: unknown, options?: TOptions): string;
export function diffSign(value: unknown): 'plus' | 'minus' | undefined;
export function cellNumber(value: unknown, options?: TOptions): string;
export function rankText(rank: unknown): string;
export function zoneInfo(zone: unknown, options?: TOptions): LeagueZoneInfo | undefined;
export function zoneLegend(rows: readonly { zone?: unknown }[], options?: TOptions): LeagueZoneInfo[];
export function liveInfo(live: unknown, options?: TOptions): LeagueLiveInfo | undefined;
export function teamTotal(teamCount: unknown, teams: readonly unknown[] | undefined): number | undefined;
