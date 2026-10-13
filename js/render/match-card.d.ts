import type { RenderOptions } from './core.js';
import type { MountHandle, MountOptions } from './mount.js';

export interface MatchTeam {
  name: string;
  /** Kurzname: Anzeige bei `names="short"` und automatisch bis 640 px. */
  short?: string;
  /** Logo-URL (nur sichere Ziele); ohne Logo erscheinen bei `logos` die Initialen. */
  logo?: string;
  score?: number;
}
export interface MatchCardProps {
  state?: 'scheduled' | 'live' | 'finished';
  league?: string;
  matchday?: string;
  date?: string;
  time?: string;
  venue?: string;
  heim: MatchTeam;
  gast: MatchTeam;
  names?: 'full' | 'short';
  logos?: boolean;
  /** Nur bei `live`: Spielabschnitt ab 1 (mit `periods`). */
  period?: number;
  periods?: 4 | 8;
  /** Veraltet: Stattdessen `period`. */
  quarter?: string;
  clock?: string;
  /** Mit `href` (nur sichere Ziele) ist die Karte ein Link. */
  href?: string;
  className?: string;
}
export interface MatchCardRenderOptions extends RenderOptions {
  /** Ohne `href` als Button statt `div` ausgeben. */
  button?: boolean;
}
export interface MatchCardMountOptions extends MountOptions {
  /** Klick auf die Karte; ohne `href` wird die Karte ein Button. */
  onClick?: (event: Event) => void;
}

export function renderMatchCard(props: MatchCardProps, options?: MatchCardRenderOptions): string;
export function mountMatchCard(el: Element, props: MatchCardProps, options?: MatchCardMountOptions): MountHandle<MatchCardProps>;
