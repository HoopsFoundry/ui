import type { ReactNode } from 'react';
import { cn } from './cn';
import { initials, shortName } from '../js/schedule.js';
import type { ScheduleNames, ScheduleTeam } from './schedule-types';
import { useT } from './i18n';
import type { CatalogValue } from '../js/i18n/index.js';

export interface ScheduleLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export type ScheduleRenderLink = (props: ScheduleLinkProps) => ReactNode;

interface TeamNameProps {
  team: ScheduleTeam | undefined;
  loser?: boolean;
  renderLink?: ScheduleRenderLink;
  /** Welcher Name sichtbar ist; bis 640 px erscheint der Kurzname in jedem Fall (CSS). */
  names?: ScheduleNames;
  /** Logo bzw. Initialen vor dem Namen (nie bei Platzhaltern). */
  logo?: boolean;
}

/** Name mit Kurzform: beide Texte im Markup, der Kurzname ist für Hilfstechnik versteckt (der volle Name gilt). */
function NameText({ team, names }: { team: ScheduleTeam; names: ScheduleNames }) {
  const short = shortName(team);
  if (!short) return <>{team.name}</>;
  return (
    <span className={cn('hoops-team-name', names === 'short' && 'hoops-team-name--short')}>
      <span className="hoops-name-full">{team.name}</span>
      <span className="hoops-name-short" aria-hidden="true" title={team.name}>
        {short}
      </span>
    </span>
  );
}

/** Teamname: Platzhalter kursiv, mit `href` als Link, Verlierer abgeblendet; optional mit Logo bzw. Initialen. */
export function TeamName({ team, loser = false, renderLink, names = 'full', logo = false }: TeamNameProps) {
  const current = team ?? { name: '?' };
  const text = <NameText team={current} names={names} />;
  const label = current.placeholder ? <span className="hoops-sch-ph">{text}</span> : text;
  let node: ReactNode = label;
  if (current.href && !current.placeholder) {
    node = renderLink ? (
      renderLink({ href: current.href, className: 'hoops-link', children: label })
    ) : (
      <a className="hoops-link" href={current.href}>
        {label}
      </a>
    );
  }
  const withLogo = logo && team !== undefined && !current.placeholder;
  return (
    <span className={cn('hoops-sch-team', loser && 'is-loser', withLogo && 'hoops-sch-team--logo')}>
      {withLogo ? <TeamLogo name={current.name} logo={current.logo} /> : null}
      {node}
    </span>
  );
}

/** Dekoratives Logo (Name steht daneben): Bild mit leerem Alternativtext, sonst Initialen im Kreis. */
export function TeamLogo({ name, logo }: { name: string; logo?: string }) {
  return (
    <span className={cn('hoops-team-logo', !logo && 'hoops-team-logo--initials')} aria-hidden="true">
      {logo ? <img src={logo} alt="" loading="lazy" /> : initials(name, 2)}
    </span>
  );
}

/** Grüner Live-Hinweis (wie MatchCard), steht hinter der Uhrzeit. */
export function LiveTag({ texts }: { texts?: Record<string, CatalogValue> }) {
  const i18n = useT(texts);
  return (
    <span className="hoops-match-live hoops-sch-live">
      <span className="hoops-match-pulse" aria-hidden="true" /> {i18n.t('common.live')}
    </span>
  );
}

interface ResultTextProps {
  visible: string;
  spoken: string;
  provisional?: boolean;
  /** Sieg-/Niederlage-Chip links neben der Zahl (nur Layout `opponent`). */
  chip?: ReactNode;
  texts?: Record<string, CatalogValue>;
}

/** Sichtbares Ergebnis (für Screenreader versteckt) plus gesprochener Text; "vorläufig" steht klein unter der Zahl. */
export function ResultText({ visible, spoken, provisional = false, chip = null, texts }: ResultTextProps) {
  const i18n = useT(texts);
  return (
    <span className="hoops-sch-resbox">
      {chip}
      <span className="hoops-sch-score" aria-hidden="true">
        {visible}
      </span>
      <span className="hoops-sr-only">{spoken}</span>
      {provisional ? (
        <small className="hoops-sch-prov" aria-hidden="true">
          {i18n.t('schedule.provisional')}
        </small>
      ) : null}
    </span>
  );
}
