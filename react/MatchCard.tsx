import type { MouseEventHandler } from 'react';
import { cn } from './cn';
import { shortName } from '../js/schedule.js';
import { resolvePeriod } from '../js/periods.js';
import { TeamLogo } from './ScheduleParts';

export type MatchState = 'scheduled' | 'live' | 'finished';

export type MatchNames = 'full' | 'short';

export interface MatchTeam {
  name: string;
  /** Kurzname (z. B. "Hawks"): Anzeige bei `names="short"` und automatisch bis 640 px Breite. */
  short?: string;
  /** Logo-URL; ohne Logo erscheinen bei `logos` die Initialen. */
  logo?: string;
  score?: number;
}

export interface MatchCardProps {
  state?: MatchState;
  league?: string;
  matchday?: string;
  date?: string;
  time?: string;
  venue?: string;
  heim: MatchTeam;
  gast: MatchTeam;
  /** `short` zeigt den Kurzname, falls vorhanden; bis 640 px Breite erscheint er automatisch (CSS). Standard: `full`. */
  names?: MatchNames;
  /** Logo bzw. Initialen vor dem Teamnamen. Standard: aus. */
  logos?: boolean;
  /** Nur bei `live`: Spielabschnitt ab 1 (mit `periods`: „3. Viertel“, „5. Achtel“, „Verlängerung“). */
  period?: number;
  /** 4 Viertel (Standard) oder 8 Achtel (Mini-Basketball). */
  periods?: 4 | 8;
  /** @deprecated Stattdessen `period`; ohne `period` wird der Text unverändert angezeigt. */
  quarter?: string;
  /** Nur bei `live`: Spieluhr. */
  clock?: string;
  /** Mit `href` wird die Karte ein Link, mit `onClick` ein Button, sonst ein div. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
}

/** Spielkarte in drei Zuständen: angesetzt, live, beendet (Sieger/Verlierer). */
export function MatchCard({
  state = 'scheduled',
  league,
  matchday,
  date,
  time,
  venue,
  heim,
  gast,
  names = 'full',
  logos = false,
  period,
  periods = 4,
  quarter = '',
  clock = '',
  href,
  onClick,
  className,
}: MatchCardProps) {
  const heimWin = state === 'finished' && (heim.score ?? 0) > (gast.score ?? 0);
  const gastWin = state === 'finished' && (gast.score ?? 0) > (heim.score ?? 0);
  const showScore = state !== 'scheduled';
  const liveText = [resolvePeriod({ period, periods, quarter }).label, clock].filter(Boolean).join(' ');

  const teamBlock = (team: MatchTeam) => {
    const short = shortName(team);
    return (
      <>
        {logos ? <TeamLogo name={team.name} logo={team.logo} /> : null}
        {short ? (
          <span className={cn('hoops-match-name', 'hoops-team-name', names === 'short' && 'hoops-team-name--short')}>
            <span className="hoops-name-full">{team.name}</span>
            <span className="hoops-name-short" aria-hidden="true" title={team.name}>
              {short}
            </span>
          </span>
        ) : (
          <span className="hoops-match-name">{team.name}</span>
        )}
      </>
    );
  };

  const body = (
    <>
      <span className="hoops-match-head">
        <span className="hoops-match-league">
          {league ? <span>{league}</span> : null}
          {matchday ? <span className="hoops-match-muted">· {matchday}</span> : null}
        </span>
        {state === 'live' ? (
          <span className="hoops-match-live">
            <span className="hoops-match-pulse" aria-hidden="true" /> Live · {liveText}
          </span>
        ) : state === 'finished' ? (
          <span className="hoops-match-final">Endstand</span>
        ) : date ? (
          <span className="hoops-match-when">
            {date}
            {time ? ` · ${time}` : ''}
          </span>
        ) : null}
      </span>
      <span className="hoops-match-body">
        <span className={cn('hoops-match-team', gastWin && 'is-loser')}>
          <span className="hoops-match-dot" aria-hidden="true" />
          {teamBlock(heim)}
          {showScore && heim.score !== undefined ? <span className="hoops-match-score">{heim.score}</span> : null}
        </span>
        <span className={cn('hoops-match-team', 'hoops-match-team--gast', heimWin && 'is-loser')}>
          <span className="hoops-match-dot" aria-hidden="true" />
          {teamBlock(gast)}
          {showScore && gast.score !== undefined ? <span className="hoops-match-score">{gast.score}</span> : null}
        </span>
      </span>
      {venue ? (
        <span className="hoops-match-foot">
          <span>{venue}</span>
        </span>
      ) : null}
    </>
  );

  const cls = cn('hoops-match', `hoops-match--${state}`, logos && 'hoops-match--logos', className);
  if (href) {
    return (
      <a className={cls} href={href} onClick={onClick}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}
