import type { ReactNode } from 'react';
import { cn } from './cn';

export type TopBarContext = 'default' | 'live' | 'admin';

export interface TopBarProps {
  brand?: string;
  /** Kurzzeichen im Amber-Quadrat (dekorativ). */
  mark?: string;
  context?: TopBarContext;
  matchLabel?: string;
  score?: string;
  clock?: string;
  user?: string;
  userInitials?: string;
  leading?: ReactNode;
  center?: ReactNode;
  actions?: ReactNode;
  /** `header` macht die Leiste zur banner-Landmark (Standard: div). */
  as?: 'header' | 'div';
  /** Begrenzt den Inhalt auf `--hoops-shell-max` (Hintergrund bleibt voll breit). */
  contained?: boolean;
  className?: string;
}

/** Dunkle App-Leiste (56 px): Marke links, optionaler Spielkontext, Aktionen rechts. */
export function TopBar({
  brand = 'DSS',
  mark = 'D',
  context = 'default',
  matchLabel = '',
  score = '',
  clock = '',
  user = '',
  userInitials = '',
  leading,
  center,
  actions,
  as: Root = 'div',
  contained = false,
  className,
}: TopBarProps) {
  return (
    <Root className={cn('dss-topbar', 'dss-topbar--dark', contained && 'dss-topbar--contained', className)}>
      <div className="dss-topbar-brand">
        <span className="dss-topbar-mark" aria-hidden="true">
          {mark}
        </span>
        {brand}
      </div>

      {leading}

      {center ? (
        <div className="dss-topbar-center">{center}</div>
      ) : context === 'live' ? (
        <div className="dss-topbar-ctx">
          <span className="dss-topbar-live">Live</span>
          {matchLabel ? <span>{matchLabel}</span> : null}
          {score ? <span className="dss-topbar-score">{score}</span> : null}
          {clock ? <span className="dss-topbar-clock">{clock}</span> : null}
        </div>
      ) : context === 'admin' && matchLabel ? (
        <div className="dss-topbar-ctx">
          <span>{matchLabel}</span>
        </div>
      ) : null}

      <span className="dss-topbar-spacer" />

      {actions}

      {user ? (
        <div className="dss-topbar-user">
          {userInitials ? <span className="dss-topbar-av">{userInitials}</span> : null}
          {user}
        </div>
      ) : null}
    </Root>
  );
}
