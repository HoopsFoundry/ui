import type { HeadingTag } from '../heading.js';
import type { ScheduleBreak, ScheduleDensity, ScheduleGame, ScheduleGridColumn, ScheduleLayout, ScheduleNames } from '../schedule.js';
import type { RenderOptions } from './core.js';
import type { MountHandle, MountOptions } from './mount.js';

interface ScheduleFrameProps {
  games: ScheduleGame[];
  /** `short` zeigt den Kurznamen (falls vorhanden); bis 640 px automatisch (CSS). */
  names?: ScheduleNames;
  /** Logo bzw. Initialen vor dem Teamnamen. Standard: aus; im Layout `opponent` an, solange nicht ausdrücklich `false`. */
  logos?: boolean;
  title?: string;
  titleAs?: HeadingTag;
  meta?: string;
  caption?: string;
  collapsible?: boolean;
  open?: boolean;
  id?: string;
  className?: string;
}
export interface ScheduleTableProps extends ScheduleFrameProps {
  layout?: ScheduleLayout;
  density?: ScheduleDensity;
}
export interface ScheduleGridProps extends ScheduleFrameProps {
  columns: ScheduleGridColumn[];
  slots?: string[];
  breaks?: ScheduleBreak[];
  emptyLabel?: string;
  density?: ScheduleDensity;
}
/** Optionen der Spielplan-Funktionen: Text je Spiel statt Snippet/`renderTime`/`renderNotice` (wird maskiert, kein Markup). */
export interface ScheduleRenderOptions extends RenderOptions {
  /** Ersetzt die Uhrzeit (nur Tabelle). */
  time?: (game: ScheduleGame) => string;
  /** Zusätzliche Zelle am Zeilenende (Tabelle) bzw. zusätzlicher Text in der Spielzelle (Raster). */
  notice?: (game: ScheduleGame) => string;
}
export interface ScheduleMountOptions extends MountOptions {
  time?: (game: ScheduleGame) => string;
  notice?: (game: ScheduleGame) => string;
}

export function renderScheduleTable(props: ScheduleTableProps, options?: ScheduleRenderOptions): string;
export function renderScheduleGrid(props: ScheduleGridProps, options?: ScheduleRenderOptions): string;
export function mountScheduleTable(el: Element, props: ScheduleTableProps, options?: ScheduleMountOptions): MountHandle<ScheduleTableProps>;
export function mountScheduleGrid(el: Element, props: ScheduleGridProps, options?: ScheduleMountOptions): MountHandle<ScheduleGridProps>;
