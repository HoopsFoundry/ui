import type { ReactNode } from 'react';
import { cn } from './cn';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';
import { CollapsibleFrame } from './internal/CollapsibleFrame';
import { devWarn } from './internal/devWarn';
import { useT } from './i18n';
import type { CatalogValue } from '../js/i18n/index.js';

export type TableDensity = 'touch' | 'default' | 'compact' | 'dense';

export interface TableColumn {
  key: string;
  label: ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
  sortable?: boolean;
  /** Aktuelle Sortierrichtung; setzt `aria-sort` und den Pfeil. */
  sort?: 'asc' | 'desc' | null;
}

export interface TableProps {
  title?: ReactNode;
  /** Überschriftenebene des Titels, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  meta?: ReactNode;
  live?: boolean;
  density?: TableDensity;
  dark?: boolean;
  striped?: boolean;
  /** Einfacher Kopf aus Spaltendefinitionen; alternativ `head` für eigene Kopfzeilen. */
  columns?: TableColumn[];
  /** Eigene Kopfzeilen; wird ignoriert, wenn `columns` gesetzt ist. */
  head?: ReactNode;
  /** Zeilen des tbody (`<tr>`-Elemente). */
  children?: ReactNode;
  foot?: ReactNode;
  /** Unsichtbare Tabellenbeschriftung für Screenreader; benennt auch den Scrollbereich (sonst der Titel). */
  caption?: string;
  /** Einklappbar: der Rahmenkopf wird zum Bereichskopf (Button in der Überschrift), die Tabelle zum Bereich. Braucht einen `title`. */
  collapsible?: boolean;
  /** Geöffnet, kontrolliert (zusammen mit `onOpenChange`); nur mit `collapsible`. */
  open?: boolean;
  /** Anfangszustand, wenn unkontrolliert (Standard geschlossen). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Anker für Deep-Link und Sprungleiste einer `Accordion`-Gruppe (nur mit `collapsible`); ohne `id` gibt es keinen. */
  id?: string;
  /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters (`HoopsProvider`) und `setTexts`. */
  texts?: Record<string, CatalogValue>;
  className?: string;
}

const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

/** Datentabelle im HoopsFoundry-UI-Rahmen (Titelzeile optional). Zellen liefert die Anwendung als `<tr>`-Kinder. */
export function Table({
  title,
  titleAs,
  meta,
  live = false,
  density = 'default',
  dark = false,
  striped = false,
  columns,
  head,
  children,
  foot,
  caption,
  collapsible = false,
  open,
  defaultOpen,
  onOpenChange,
  id,
  texts,
  className,
}: TableProps) {
  const Heading = useHeadingTag(titleAs);
  const i18n = useT(texts);
  const hasHead = Boolean(title || meta || live);
  const metaItems = (
    <>
      {meta ? <span>{meta}</span> : null}
      {live ? (
        <span className="hoops-crumb">
          <span className="hoops-crumb-dot" aria-hidden="true" /> {i18n.t('common.live')}
        </span>
      ) : null}
    </>
  );
  const region = (
    <div className="hoops-table-scroll" role="region" tabIndex={0} aria-label={caption || (typeof title === 'string' && title) || i18n.t('table.label')}>
      <table className={cn('hoops-tbl', `hoops-tbl--${density}`, striped && 'hoops-tbl--striped')}>
        {caption ? <caption className="hoops-sr-only">{caption}</caption> : null}
        {columns ? (
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(col.align ?? 'left', col.sortable && 'sortable', col.sort && `sort-${col.sort}`)}
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={col.sort ? ARIA_SORT[col.sort] : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        {!columns && head ? <thead>{head}</thead> : null}
        <tbody>{children}</tbody>
        {foot ? <tfoot>{foot}</tfoot> : null}
      </table>
    </div>
  );
  const rootClass = cn('hoops-frame', dark && 'hoops-frame--dark', className);

  if (collapsible && title) {
    return (
      <CollapsibleFrame
        rootClass={rootClass}
        id={id}
        title={title}
        titleAs={titleAs}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        lang={i18n.lang}
        meta={meta || live ? <span className="hoops-frame-meta">{metaItems}</span> : undefined}
      >
        {region}
      </CollapsibleFrame>
    );
  }
  if (collapsible) devWarn('[HoopsFoundry UI] Table: `collapsible` braucht einen `title`, sonst bleibt der Rahmen unverändert.');
  return (
    <div className={rootClass} lang={i18n.lang}>
      {hasHead ? (
        <div className="hoops-frame-head">
          {title ? <Heading className="hoops-frame-title">{title}</Heading> : <span />}
          <div className="hoops-frame-meta">{metaItems}</div>
        </div>
      ) : null}
      {region}
    </div>
  );
}
