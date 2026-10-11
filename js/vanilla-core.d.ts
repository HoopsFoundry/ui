import type { AccordionOptions } from './accordion.js';
import type { BackToTopOptions } from './backtop.js';
import type { DssHandle } from './lifecycle.js';
import type { PageNavOptions } from './pagenav.js';
import type { ThemeOptions } from './theme.js';

export { reducedMotion } from './motion.js';
export { safeHref } from './url.js';
export { createHandle } from './lifecycle.js';

export type DssBlockName = 'accordion' | 'pagenav' | 'backtop' | 'theme';

export interface InitAllOptions {
  accordion?: AccordionOptions;
  pagenav?: PageNavOptions;
  backtop?: BackToTopOptions;
  theme?: ThemeOptions;
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
/** Startet alle Elemente mit `data-dss="accordion|pagenav|backtop|theme"` unterhalb von `scope` (Standard: das Dokument). */
export function initAll(scope?: ParentNode | null, options?: InitAllOptions): InitAllHandle;
