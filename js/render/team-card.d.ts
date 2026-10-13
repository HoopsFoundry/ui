import type { HeadingTag } from '../heading.js';
import type { TeamLast, TeamNext, TeamRecord, TeamSquad, TeamStats } from '../team.js';
import type { RenderOptions } from './core.js';
import type { MountHandle, MountOptions } from './mount.js';

export interface TeamCardProps {
  /** Name der Mannschaft; als einziges Feld Pflicht. */
  name: string;
  short?: string;
  /** Logo-URL (nur sichere Ziele); ohne Logo erscheinen die Initialen. */
  logo?: string;
  names?: 'full' | 'short';
  /** Logo bzw. Initialen vor dem Gegner in den Spielzeilen. */
  logos?: boolean;
  league?: string;
  /** Link der Liga; nur ohne `href`/`onClick`. */
  leagueHref?: string;
  season?: string;
  record?: TeamRecord;
  rank?: number;
  rankOf?: number;
  points?: number;
  next?: TeamNext;
  last?: TeamLast;
  squad?: TeamSquad;
  stats?: TeamStats;
  size?: 'standard' | 'compact';
  /** Mit `href` (nur sichere Ziele) ist der Name ein Link über die ganze Karte. */
  href?: string;
  titleAs?: HeadingTag;
  className?: string;
}
export interface TeamCardRenderOptions extends RenderOptions {
  /** Ohne `href` den Namen als Button ausgeben. */
  button?: boolean;
}
export interface TeamCardMountOptions extends MountOptions {
  /** Klick auf die Karte; ohne `href` wird der Name ein Button. */
  onClick?: (event: Event) => void;
}

export function renderTeamCard(props: TeamCardProps, options?: TeamCardRenderOptions): string;
export function mountTeamCard(el: Element, props: TeamCardProps, options?: TeamCardMountOptions): MountHandle<TeamCardProps>;
