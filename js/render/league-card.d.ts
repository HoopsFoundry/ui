import type { HeadingTag } from '../heading.js';
import type { LeagueColumn, LeagueTeam } from '../league.js';
import type { RenderOptions } from './core.js';
import type { MountHandle, MountOptions } from './mount.js';

export interface LeagueCardProps {
  /** Name der Liga, z. B. „Oberliga Nordhain Männer“. */
  title: string;
  /** Tabelle der Liga; die Karte zeigt einen Ausschnitt (siehe `limit`, `own`). */
  teams: LeagueTeam[];
  /** Teams der ganzen Liga, wenn `teams` nur einen Teil enthält. */
  teamCount?: number;
  played?: number;
  total?: number;
  /** Zusätzliche Spalten: `won`, `lost`, `diff`, `form`. */
  columns?: LeagueColumn[];
  /** Zeilen ohne eigene Mannschaft (Standard 3); mit eigener: zwei davor, die eigene, eine dahinter. */
  limit?: number;
  /** Ziel des Links unter der Tabelle (nur sichere Ziele). */
  href?: string;
  linkLabel?: string;
  /** Laufende Spiele: Zahl oder `true`. */
  live?: number | boolean;
  names?: 'full' | 'short';
  logos?: boolean;
  size?: 'standard' | 'compact';
  titleAs?: HeadingTag;
  collapsible?: boolean;
  open?: boolean;
  id?: string;
  className?: string;
}

export function renderLeagueCard(props: LeagueCardProps, options?: RenderOptions): string;
export function mountLeagueCard(el: Element, props: LeagueCardProps, options?: MountOptions): MountHandle<LeagueCardProps>;
