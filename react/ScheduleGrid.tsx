import type { ReactNode } from 'react';
import { cn } from './cn';
import { CollapsibleFrame } from './internal/CollapsibleFrame';
import { devWarn } from './internal/devWarn';
import { ariaForResult, buildGrid, hasScore, stateLabel, winnerSide } from '../js/schedule.js';
import { LiveTag, ResultText, TeamName, type ScheduleRenderLink } from './ScheduleParts';
import type { ScheduleBreak, ScheduleDensity, ScheduleGame, ScheduleGridColumn, ScheduleNames } from './schedule-types';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';

export interface ScheduleGridProps {
  /** Jedes Spiel braucht `time` und `column` (passt zu einer `columns[].id`). */
  games: ScheduleGame[];
  /** Spalten (Hallen oder Felder) in Anzeige-Reihenfolge; `label` ist freier Text. */
  columns: ScheduleGridColumn[];
  /** Anwurfzeiten als Zeilen; ohne Angabe aus `games` abgeleitet. */
  slots?: string[];
  /** Pausen und Sperrzeiten als Zeile über alle Spalten. */
  breaks?: ScheduleBreak[];
  emptyLabel?: string;
  /** Zeilenhöhe; Standard: `default` (anders als ScheduleTable wird sie nicht aus den Spielen abgeleitet). */
  density?: ScheduleDensity;
  /** `short` zeigt den Kurzname (`short`), falls vorhanden; bis 640 px Breite erscheint er automatisch (CSS). Standard: `full`. */
  names?: ScheduleNames;
  /** Logo bzw. Initialen vor dem Teamnamen (Platzhalter ohne Logo). Standard: aus. */
  logos?: boolean;
  title?: ReactNode;
  /** Überschriftenebene des Titels, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  meta?: ReactNode;
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
  className?: string;
  renderLink?: ScheduleRenderLink;
  /** Zusätzlicher Inhalt in der Spielzelle, z. B. Konflikt-Badge. */
  renderNotice?: (game: ScheduleGame) => ReactNode;
}

/** Zeitraster: Anwurfzeiten als Zeilen, Hallen oder Felder als Spalten (empfohlen: höchstens drei). */
export function ScheduleGrid({
  games,
  columns,
  slots,
  breaks,
  emptyLabel = 'frei',
  density = 'default',
  names = 'full',
  logos = false,
  title,
  titleAs,
  meta,
  caption,
  collapsible = false,
  open,
  defaultOpen,
  onOpenChange,
  id,
  className,
  renderLink,
  renderNotice,
}: ScheduleGridProps) {
  const Heading = useHeadingTag(titleAs);
  const rows = buildGrid({ games, columns, slots, breaks });
  const hasHead = Boolean(title || meta);

  const gameBlock = (game: ScheduleGame): ReactNode => {
    const winner = winnerSide(game);
    const own = game.heim?.own || game.gast?.own;
    const metaText = [game.nr, game.section].filter(Boolean).join(' · ');
    return (
      <div
        key={game.id}
        className={cn(
          'dss-sg-game',
          own && 'is-own',
          game.state === 'live' && 'is-live',
          game.state === 'cancelled' && 'is-cancelled',
          game.state === 'postponed' && 'is-postponed',
        )}
      >
        <div className="dss-sg-teams">
          {stateLabel(game.state) ? <span className="dss-sr-only">{`${stateLabel(game.state)} `}</span> : null}
          <TeamName team={game.heim} loser={winner === 'gast'} renderLink={renderLink} names={names} logo={logos} />
          <span className="dss-sch-sep" aria-hidden="true">
            {' – '}
          </span>
          <span className="dss-sr-only"> gegen </span>
          <TeamName team={game.gast} loser={winner === 'heim'} renderLink={renderLink} names={names} logo={logos} />
          {game.state === 'live' && !hasScore(game, 'versus') ? <LiveTag /> : null}
        </div>
        {(game.state === 'finished' || game.state === 'live') && hasScore(game, 'versus') ? (
          <div className="dss-sg-result">
            <ResultText
              visible={`${game.heim?.score} : ${game.gast?.score}`}
              spoken={ariaForResult(game, 'versus')}
              provisional={game.provisional}
            />
            {game.state === 'live' ? <LiveTag /> : null}
          </div>
        ) : null}
        {metaText ? <div className="dss-sg-meta">{metaText}</div> : null}
        {game.note ? <div className="dss-sch-note">{game.note}</div> : null}
        {renderNotice ? renderNotice(game) : null}
      </div>
    );
  };

  const rootClass = cn('dss-frame', className);
  // Scrollbereich ist fokussierbar, damit Tastaturnutzer ihn scrollen können (WCAG 2.1.1)
  const region = (
    <div className="dss-table-scroll" role="region" tabIndex={0} aria-label={caption || (typeof title === 'string' && title) || 'Zeitraster'}>
      <table role="table" className={cn('dss-tbl dss-sgrid', `dss-tbl--${density}`)}>
        {caption ? <caption className="dss-sr-only">{caption}</caption> : null}
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader" className="dss-sg-time">
              Zeit
            </th>
            {columns.map((column) => (
              <th key={column.id} scope="col" role="columnheader">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {/* Schlüssel mit Index ist Absicht: Zeitzeile, Pause und Freilos können dieselbe Startzeit haben. */}
          {rows.map((row, index) => {
            if (row.kind === 'break') {
              return (
                <tr key={`b-${index}`} role="row" className="dss-sg-break">
                  <th scope="row" role="rowheader" className="dss-sg-time">
                    {row.time}
                  </th>
                  <td role="cell" colSpan={columns.length}>
                    {row.label}
                  </td>
                </tr>
              );
            }
            if (row.kind === 'bye') {
              return (
                <tr key={`y-${index}`} role="row" className="dss-sg-bye">
                  <th scope="row" role="rowheader" className="dss-sg-time">
                    {row.time ? row.time : <span className="dss-sr-only">Zeit offen</span>}
                  </th>
                  <td role="cell" colSpan={columns.length}>
                    {row.game.heim ? (
                      <>
                        <TeamName team={row.game.heim} renderLink={renderLink} names={names} logo={logos} /> hat Freilos
                      </>
                    ) : (
                      (row.game.note ?? 'Spielfrei')
                    )}
                  </td>
                </tr>
              );
            }
            return (
              <tr key={`s-${row.time}-${index}`} role="row">
                <th scope="row" role="rowheader" className="dss-sg-time">
                  {row.time}
                </th>
                {row.cells.map((cell, columnIndex) => (
                  <td
                    key={columns[columnIndex].id}
                    role="cell"
                    className={cn('dss-sg-cell', cell.length === 0 && 'is-empty')}
                    data-label={columns[columnIndex].label}
                  >
                    {cell.length === 0 ? <span className="dss-sg-empty">{emptyLabel}</span> : cell.map(gameBlock)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

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
        meta={meta ? <span className="dss-frame-meta"><span>{meta}</span></span> : undefined}
      >
        {region}
      </CollapsibleFrame>
    );
  }
  if (collapsible) devWarn('[DSS] ScheduleGrid: `collapsible` braucht einen `title`, sonst bleibt der Rahmen unverändert.');
  return (
    <div className={rootClass}>
      {hasHead ? (
        <div className="dss-frame-head">
          {title ? <Heading className="dss-frame-title">{title}</Heading> : <span />}
          <div className="dss-frame-meta">{meta ? <span>{meta}</span> : null}</div>
        </div>
      ) : null}
      {region}
    </div>
  );
}
