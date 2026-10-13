import type { AccordionOptions } from './accordion.js';
import type { BackToTopOptions } from './backtop.js';
import type { DssHandle } from './lifecycle.js';
import type { ModalOptions } from './modal.js';
import type { PageNavOptions } from './pagenav.js';
import type { TabsOptions } from './tabs.js';
import type { ThemeOptions } from './theme.js';

export { reducedMotion } from './motion.js';
export { safeHref } from './url.js';
export { createHandle } from './lifecycle.js';

export type DssBlockName = 'accordion' | 'pagenav' | 'backtop' | 'theme' | 'tabs' | 'modal' | 'map';

/** Die Karte gehört nicht zum Kern: `start` ist `initMapBlock` aus dem Karten-Bündel (dss-map.js); die übrigen Schlüssel gelten für jede Karte (z. B. `loadLeaflet`, `tileUrl`). */
export interface MapBlockOptions {
  start?: (el: Element, options: Record<string, unknown>) => DssHandle;
  [key: string]: unknown;
}

export interface InitAllOptions {
  accordion?: AccordionOptions;
  pagenav?: PageNavOptions;
  backtop?: BackToTopOptions;
  theme?: ThemeOptions;
  tabs?: TabsOptions;
  modal?: ModalOptions;
  map?: MapBlockOptions;
  /** Nur diese Bausteine starten (Standard alle). */
  only?: DssBlockName[];
}

export interface InitAllHandle extends DssHandle {
  /** Zahl der gestarteten Bausteine. */
  count: number;
}

export const DSS_BLOCKS: DssBlockName[];
/** Optionen aus `data-dss-options` (JSON-Objekt); Ungültiges ergibt `{}`. */
export function parseOptions(text: unknown): Record<string, unknown>;
/** Startet alle Elemente mit `data-dss="accordion|pagenav|backtop|theme|tabs|modal|map"` unterhalb von `scope` (Standard: das Dokument). */
export function initAll(scope?: ParentNode | null, options?: InitAllOptions): InitAllHandle;
