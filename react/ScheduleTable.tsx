import { Fragment, type ReactNode } from 'react';
import { cn } from './cn';
import { CollapsibleFrame } from './internal/CollapsibleFrame';
import { devWarn } from './internal/devWarn';
import {
  ariaForResult,
  columnsFor,
  densityFor,
  groupBySection,
  hasScore,
  initials,
  layoutFor,
  resolveOutcome,
  stateLabel,
  winnerSide,
} from '../js/schedule.js';
import { LiveTag, ResultText, TeamName, type ScheduleRenderLink } from './ScheduleParts';
import type { ScheduleDensity, ScheduleGame, ScheduleLayout, ScheduleNames } from './schedule-types';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';

export type { ScheduleLinkProps } from './ScheduleParts';

export interface ScheduleTableProps {
  games: ScheduleGame[];
  /**
   * Art der Spiel-Zelle; Standard: `opponent`, sobald ein Spiel `opponent` hat, sonst `versus`.
   * `columns` und `versus` brauchen `heim`/`gast`; Spiele, die nur `opponent` haben, zeigen dort "?" für die
   * fehlenden Teams und kein Ergebnis.
   */
  layout?: ScheduleLayout;
  /** Zeilenhöhe; Standard: `touch` bei `opponent` oder Liga-Unterzeile, sonst `default`. */
  density?: ScheduleDensity;
  /** `short` zeigt den Kurzname (`short`), falls vorhanden; bis 640 px Breite erscheint er automatisch (CSS). Standard: `full`. */
  names?: ScheduleNames;
  /**
   * Logo bzw. Initialen vor dem Teamnamen (Bild `logo` mit leerem Alternativtext; Platzhalter ohne Logo).
   * Standard: aus; im Layout `opponent` an (wie bisher), solange nicht ausdrücklich `false`.
   */
  logos?: boolean;
  /** Titel im Rahmenkopf. */
  title?: ReactNode;
  /** Überschriftenebene des Titels, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  /** Angaben rechts im Rahmenkopf, z. B. Saison oder Stand. */
  meta?: ReactNode;
  /** Unsichtbare Tabellenbeschriftung für Screenreader. */
  caption?: string;
  /** Zusätzliche Klasse am äußeren Rahmen. */
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
  /** Router-Links für Teamnamen und Liga. */
  renderLink?: ScheduleRenderLink;
  /** Ersetzt die Uhrzeit, z. B. durch eine bearbeitbare Startzeit. */
  renderTime?: (game: ScheduleGame) => ReactNode;
  /** Zusätzliche Zelle am Zeilenende, z. B. Konflikt-Badge. */
  renderNotice?: (game: ScheduleGame) => ReactNode;
}

const OUTCOME_CHIP = { S: 'hoops-chip--ok', N: 'hoops-chip--err', U: '' } as const;

/** Spielplan als Tabelle: Gegenüberstellung, Perspektive einer Mannschaft oder Turnier-Spalten. */
export function ScheduleTable({
  games,
  layout,
  density,
  names = 'full',
  logos,
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
  renderTime,
  renderNotice,
}: ScheduleTableProps) {
  const Heading = useHeadingTag(titleAs);
  const mode: ScheduleLayout = layout ?? layoutFor(games);
  const dens: ScheduleDensity = density ?? densityFor(games, mode);
  const cols = columnsFor(mode, games, Boolean(renderNotice));
  const groups = groupBySection(games);
  const hasHead = Boolean(title || meta);

  const league = (game: ScheduleGame) =>
    game.league ? (
      <span className="hoops-sch-sub">
        {game.league.href ? (
          renderLink ? (
            renderLink({ href: game.league.href, className: 'hoops-link', children: game.league.name })
          ) : (
            <a className="hoops-link" href={game.league.href}>
              {game.league.name}
            </a>
          )
        ) : (
          game.league.name
        )}
      </span>
    ) : null;

  const note = (game: ScheduleGame) => (game.note ? <span className="hoops-sch-note">{game.note}</span> : null);

  const cell = (key: string, game: ScheduleGame): ReactNode => {
    const winner = winnerSide(game);
    switch (key) {
      case 'nr':
        return (
          <td key={key} role="cell" className="hoops-sch-nr">
            {game.nr}
          </td>
        );
      case 'when':
        return (
          <td key={key} role="cell" className="hoops-sch-when">
            {game.date ? <span className="hoops-sch-date">{game.date}</span> : null}
            {renderTime || game.time ? <span className="hoops-sch-time">{renderTime ? renderTime(game) : game.time}</span> : null}
            {stateLabel(game.state) ? <span className="hoops-sr-only">{` ${stateLabel(game.state)}`}</span> : null}
            {game.state === 'live' ? <LiveTag /> : null}
            {mode !== 'columns' && game.venue ? <span className="hoops-sch-venue">{game.venue}</span> : null}
          </td>
        );
      case 'ha':
        return (
          <td key={key} role="cell" className="hoops-sch-ha">
            <span className={cn('hoops-chip hoops-chip--mono', game.at === 'gast' ? 'hoops-chip--amber' : 'hoops-chip--sky')}>
              {game.at === 'gast' ? '@' : 'vs.'}
            </span>
          </td>
        );
      case 'match':
        return (
          <td key={key} role="cell" className="hoops-sch-match">
            {mode === 'opponent' && game.opponent ? (
              <span className="hoops-sch-opp">
                {logos !== false ? (
                  <span className="hoops-sch-logo" aria-hidden="true">
                    {game.opponent.logo ? <img src={game.opponent.logo} alt="" loading="lazy" /> : initials(game.opponent.name)}
                  </span>
                ) : null}
                <TeamName team={game.opponent} renderLink={renderLink} names={names} />
              </span>
            ) : (
              <>
                <TeamName team={game.heim} loser={winner === 'gast'} renderLink={renderLink} names={names} logo={logos === true} />
                <span className="hoops-sch-sep" aria-hidden="true">
                  {' – '}
                </span>
                <span className="hoops-sr-only"> gegen </span>
                <TeamName team={game.gast} loser={winner === 'heim'} renderLink={renderLink} names={names} logo={logos === true} />
              </>
            )}
            {league(game)}
            {note(game)}
          </td>
        );
      case 'heim':
        return (
          <td key={key} role="cell" className="hoops-sch-heim">
            <TeamName team={game.heim} loser={winner === 'gast'} renderLink={renderLink} names={names} logo={logos === true} />
          </td>
        );
      case 'gast':
        return (
          <td key={key} role="cell" className="hoops-sch-gast">
            <TeamName team={game.gast} loser={winner === 'heim'} renderLink={renderLink} names={names} logo={logos === true} />
            {note(game)}
          </td>
        );
      case 'field':
        return (
          <td key={key} role="cell" className="hoops-sch-field-cell">
            {game.field ? (
              <span className="hoops-chip hoops-chip--mono hoops-sch-field" title={game.field}>
                {game.field}
              </span>
            ) : null}
          </td>
        );
      case 'venue':
        return (
          <td key={key} role="cell" className="hoops-sch-venue-cell">
            {game.venue}
          </td>
        );
      case 'res': {
        const scored = (game.state === 'finished' || game.state === 'live') && hasScore(game, mode);
        if (!scored) {
          return (
            <td key={key} role="cell" className="hoops-sch-res">
              <span className="hoops-sch-none">–</span>
            </td>
          );
        }
        const result = mode === 'opponent' ? resolveOutcome(game) : undefined;
        const visible =
          mode === 'opponent' && game.opponent
            ? `${game.ownScore} : ${game.opponent.score}`
            : `${game.heim?.score} : ${game.gast?.score}`;
        return (
          <td key={key} role="cell" className="hoops-sch-res">
            <ResultText
              visible={visible}
              spoken={ariaForResult(game, mode)}
              provisional={game.provisional}
              chip={
                result ? (
                  <span className={cn('hoops-chip hoops-chip--mono', OUTCOME_CHIP[result])} aria-hidden="true">
                    {result}
                  </span>
                ) : null
              }
            />
          </td>
        );
      }
      case 'notice':
        return (
          <td key={key} role="cell" className="hoops-sch-notice">
            {renderNotice ? renderNotice(game) : null}
          </td>
        );
      default:
        return null;
    }
  };

  const row = (game: ScheduleGame): ReactNode => {
    const own = game.heim?.own || game.gast?.own;
    const classes = cn(
      'hoops-sch-row',
      own && mode !== 'opponent' && 'is-own',
      game.state === 'live' && 'is-live',
      game.state === 'cancelled' && 'is-cancelled',
      game.state === 'postponed' && 'is-postponed',
      game.state === 'bye' && 'is-bye',
    );
    if (game.state === 'bye') {
      return (
        <tr key={game.id} role="row" className={classes}>
          <td role="cell" className="hoops-sch-bye" colSpan={cols.length}>
            {game.time ? <span className="hoops-sch-time">{game.time} · </span> : null}
            {game.heim ? (
              <>
                <TeamName team={game.heim} renderLink={renderLink} names={names} logo={logos === true} /> hat Freilos
              </>
            ) : (
              (game.note ?? 'Spielfrei')
            )}
          </td>
        </tr>
      );
    }
    return (
      <tr key={game.id} role="row" className={classes}>
        {cols.map((col) => cell(col.key, game))}
      </tr>
    );
  };

  const rootClass = cn('hoops-frame', className);
  // Scrollbereich ist fokussierbar, damit Tastaturnutzer ihn scrollen können (WCAG 2.1.1)
  const region = (
    <div className="hoops-table-scroll" role="region" tabIndex={0} aria-label={caption || (typeof title === 'string' && title) || 'Spielplan'}>
      <table role="table" className={cn('hoops-tbl hoops-tbl--schedule', `hoops-tbl--${dens}`, `hoops-sch--${mode}`)}>
        {caption ? <caption className="hoops-sr-only">{caption}</caption> : null}
        <thead role="rowgroup" className={mode === 'columns' ? undefined : 'hoops-sr-only'}>
          <tr role="row">
            {cols.map((col) => (
              <th key={col.key} scope="col" role="columnheader">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {groups.map((group, index) => (
            <Fragment key={`${group.section ?? 'ohne'}-${index}`}>
              {group.section ? (
                <tr role="row" className="hoops-sch-group">
                  <th scope="colgroup" colSpan={cols.length}>
                    {group.section}
                  </th>
                </tr>
              ) : null}
              {group.games.map(row)}
            </Fragment>
          ))}
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
        meta={meta ? <span className="hoops-frame-meta"><span>{meta}</span></span> : undefined}
      >
        {region}
      </CollapsibleFrame>
    );
  }
  if (collapsible) devWarn('[HoopsFoundry UI] ScheduleTable: `collapsible` braucht einen `title`, sonst bleibt der Rahmen unverändert.');
  return (
    <div className={rootClass}>
      {hasHead ? (
        <div className="hoops-frame-head">
          {/* Platzhalter, damit die Meta-Angaben rechts stehen */}
          {title ? <Heading className="hoops-frame-title">{title}</Heading> : <span />}
          <div className="hoops-frame-meta">{meta ? <span>{meta}</span> : null}</div>
        </div>
      ) : null}
      {region}
    </div>
  );
}
