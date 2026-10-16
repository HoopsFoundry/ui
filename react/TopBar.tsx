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
  brand = 'HoopsFoundry UI',
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
    <Root className={cn('hoops-topbar', 'hoops-topbar--dark', contained && 'hoops-topbar--contained', className)}>
      <div className="hoops-topbar-brand">
        <span className="hoops-topbar-mark" aria-hidden="true">
          {mark}
        </span>
        {brand}
      </div>

      {leading}

      {center ? (
        <div className="hoops-topbar-center">{center}</div>
      ) : context === 'live' ? (
        <div className="hoops-topbar-ctx">
          <span className="hoops-topbar-live">Live</span>
          {matchLabel ? <span>{matchLabel}</span> : null}
          {score ? <span className="hoops-topbar-score">{score}</span> : null}
          {clock ? <span className="hoops-topbar-clock">{clock}</span> : null}
        </div>
      ) : context === 'admin' && matchLabel ? (
        <div className="hoops-topbar-ctx">
          <span>{matchLabel}</span>
        </div>
      ) : null}

      <span className="hoops-topbar-spacer" />

      {actions}

      {user ? (
        <div className="hoops-topbar-user">
          {userInitials ? <span className="hoops-topbar-av">{userInitials}</span> : null}
          {user}
        </div>
      ) : null}
    </Root>
  );
}
