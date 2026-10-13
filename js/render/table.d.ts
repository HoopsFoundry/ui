import type { HeadingTag } from '../heading.js';
import type { RenderOptions } from './core.js';
import type { MountHandle, MountOptions } from './mount.js';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  /** Zahl (Pixel) oder Länge mit Einheit (`80px`, `20%`, `6rem`); anderes entfällt. */
  width?: string | number;
  sortable?: boolean;
  /** Aktuelle Sortierrichtung; setzt `aria-sort`. */
  sort?: 'asc' | 'desc' | null;
}
/** Eine Zelle: Text, Zahl oder Objekt (`header: true` ergibt `th scope="row"`). */
export type TableCell = string | number | { text: string | number; className?: string; href?: string; header?: boolean; colSpan?: number };
/** Eine Zeile: Liste von Zellen oder `{ cells, className }` (z. B. `is-own`). */
export type TableRow = TableCell[] | { cells: TableCell[]; className?: string };

export interface TableProps {
  title?: string;
  titleAs?: HeadingTag;
  meta?: string;
  live?: boolean;
  density?: 'touch' | 'default' | 'compact' | 'dense';
  dark?: boolean;
  striped?: boolean;
  columns?: TableColumn[];
  /** Eigene Kopfzeilen (ohne `columns`). */
  head?: TableRow[];
  rows?: TableRow[];
  foot?: TableRow[];
  caption?: string;
  collapsible?: boolean;
  /** Geöffnet (nur mit `collapsible`; Standard geschlossen). */
  open?: boolean;
  id?: string;
  className?: string;
}

export function renderTable(props: TableProps, options?: RenderOptions): string;
export function mountTable(el: Element, props: TableProps, options?: MountOptions): MountHandle<TableProps>;
