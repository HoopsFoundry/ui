import type { TOptions } from './i18n/index.js';

export type ScheduleState = 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed' | 'bye';
export type ScheduleLayout = 'versus' | 'opponent' | 'columns';
export type ScheduleDensity = 'touch' | 'default' | 'compact';
export type ScheduleOutcome = 'S' | 'N' | 'U';

export type ScheduleNames = 'full' | 'short';

export interface ScheduleTeam {
  name: string;
  /** Kurzname (z. B. "Hawks"): Anzeige bei `names="short"` und automatisch bis 640 px Breite. */
  short?: string;
  /** Teamname als Link. */
  href?: string;
  /** Logo-URL; ohne Logo erscheinen die Initialen. */
  logo?: string;
  score?: number;
  /** Platzhalter wie "Erster Gruppe A": kursiv und gedämpft. */
  placeholder?: boolean;
  /** Eigene Mannschaft (Hervorhebung). */
  own?: boolean;
}

export interface ScheduleGame {
  id: string;
  /** "#3" */
  nr?: string;
  /** Gruppenzeile: "Spieltag 5", "Runde 2 · Gruppe A", "Halbfinale". */
  section?: string;
  /** Fertig formatiert, z. B. "Sa, 26.09.2026". */
  date?: string;
  /** "17:30" oder "09:30–09:50". */
  time?: string;
  /** Halle, freier Text. */
  venue?: string;
  /** Feld in der Halle, freier Text. */
  field?: string;
  /** Nur ScheduleGrid: Kennung der Spalte (passt zu einer `columns[].id`). */
  column?: string;
  state: ScheduleState;

  /** Gegenüberstellung (Liga, Halle, Turnier). */
  heim?: ScheduleTeam;
  gast?: ScheduleTeam;

  /** Perspektive einer Mannschaft; `opponent.score` sind die Punkte des Gegners. */
  opponent?: ScheduleTeam;
  /** `heim` zeigt "vs.", `gast` zeigt "@". */
  at?: 'heim' | 'gast';
  /** Punkte der eigenen Mannschaft. */
  ownScore?: number;
  /** Überschreibt die berechnete Bewertung (z. B. Forfait). */
  outcome?: ScheduleOutcome;

  league?: { name: string; href?: string };
  provisional?: boolean;
  note?: string;
}

export interface ScheduleColumn {
  key: string;
  label: string;
}

export interface ScheduleGridColumn {
  id: string;
  label: string;
}

export interface ScheduleBreak {
  time: string;
  label: string;
}

export interface ScheduleGroup {
  section: string | undefined;
  games: ScheduleGame[];
}

export type ScheduleGridRow =
  | { kind: 'slot'; time: string; cells: ScheduleGame[][] }
  | { kind: 'break'; time: string; label: string }
  | { kind: 'bye'; time: string | undefined; game: ScheduleGame };

export function outcome(own: number | undefined, opp: number | undefined): ScheduleOutcome | undefined;
export function resolveOutcome(game: ScheduleGame): ScheduleOutcome | undefined;
/** Text für abgesagte und verschobene Spiele in der Sprache des Aufrufs (`options.locale`, `options.texts`). */
export function stateLabel(state: ScheduleState | undefined, options?: TOptions): string | undefined;
export function winnerSide(game: ScheduleGame): 'heim' | 'gast' | null;
/** Mit `layout`: Perspektive nur bei `opponent`, sonst heim/gast. Ohne: Perspektive, wenn `game.opponent` existiert. */
export function hasScore(game: ScheduleGame, layout?: ScheduleLayout): boolean;
export function layoutFor(games: ScheduleGame[]): ScheduleLayout;
export function densityFor(games: ScheduleGame[], layout: ScheduleLayout): ScheduleDensity;
export function columnsFor(layout: ScheduleLayout, games: ScheduleGame[], hasNotice?: boolean, options?: TOptions): ScheduleColumn[];
export function startMinutes(time: string | undefined): number;
export function slotsFromGames(games: ScheduleGame[]): string[];
export function groupBySection(games: ScheduleGame[]): ScheduleGroup[];
/** Anfangsbuchstaben der ersten `max` Wörter (Standard 3), groß. */
export function initials(name: string, max?: number): string;
/** Kurzname eines Teams; `undefined`, wenn keiner angegeben ist oder er dem Namen gleicht. */
export function shortName(team: { name: string; short?: string } | undefined): string | undefined;
export function ariaForResult(game: ScheduleGame, layout: ScheduleLayout, options?: TOptions): string;
export function buildGrid(input: {
  games: ScheduleGame[];
  columns: ScheduleGridColumn[];
  slots?: string[];
  breaks?: ScheduleBreak[];
}): ScheduleGridRow[];
