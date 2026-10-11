import { cn } from './cn';
import { initials, shortName } from '../js/schedule.js';
import {
  cellNumber,
  diffSign,
  diffText,
  leagueSummary,
  leagueWindow,
  liveInfo,
  rankText,
  teamTotal,
  windowLabel,
  zoneInfo,
  zoneLegend,
} from '../js/league.js';
import type { LeagueColumn, LeagueFormEntry, LeagueTeam, LeagueZone } from '../js/league.js';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';
import { CollapsibleFrame } from './internal/CollapsibleFrame';
import { FormChips } from './FormChips';
import { devWarn } from './internal/devWarn';

export type { LeagueColumn, LeagueFormEntry, LeagueTeam, LeagueZone };
export type LeagueCardSize = 'standard' | 'compact';
export type LeagueCardNames = 'full' | 'short';

export interface LeagueCardProps {
  /** Name der Liga, z. B. „Oberliga Nordhain Männer“. */
  title: string;
  /** Tabelle der Liga (alle Teams oder ein Teil); die Karte zeigt einen Ausschnitt (siehe `limit`, `own`). */
  teams: LeagueTeam[];
  /** Teams der ganzen Liga, wenn `teams` nur einen Teil enthält. */
  teamCount?: number;
  /** Gespielte und alle Spiele der Saison (Untertitel). */
  played?: number;
  total?: number;
  /** Zusätzliche Spalten: `won` (S), `lost` (N), `diff` (Korbdifferenz), `form` (letzte Spiele). */
  columns?: LeagueColumn[];
  /** Zeilen ohne eigene Mannschaft (Standard 3). Mit eigener Mannschaft erscheinen vier: zwei davor, die eigene, eine dahinter. */
  limit?: number;
  /** Ziel des Links unter der Tabelle; ohne `href` entfällt der Link. */
  href?: string;
  /** Text des Links. Standard: „Komplette Tabelle und Spielplan“. */
  linkLabel?: string;
  /** Laufende Spiele: Zahl („2 Spiele laufen“) oder `true` (nur „Live“). */
  live?: number | boolean;
  /** `short` zeigt den Kurznamen (falls vorhanden); bis 640 px Breite erscheint er automatisch (CSS). */
  names?: LeagueCardNames;
  /** Logo bzw. Initialen vor dem Namen. */
  logos?: boolean;
  /** `standard`: Zeilen 60 px mit Untertitel; `compact`: Zeilen 40 px ohne Untertitel. */
  size?: LeagueCardSize;
  /** Überschriftenebene des Titels, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  /** Einklappbar: Kopf (Titel, Untertitel, Live) wird zum Bereichskopf (Button in der Überschrift), die Tabelle zum Bereich. */
  collapsible?: boolean;
  /** Geöffnet, kontrolliert (zusammen mit `onOpenChange`); nur mit `collapsible`. */
  open?: boolean;
  /** Anfangszustand, wenn unkontrolliert (Standard geschlossen). */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Anker für Deep-Link und Sprungleiste einer `Accordion`-Gruppe (nur mit `collapsible`); ohne `id` gibt es keinen. */
  id?: string;
  className?: string;
}

/** Name mit Kurzform: beide Texte im Markup, der Kurzname ist für Hilfstechnik versteckt (der volle Name gilt). */
function NameText({ team, names }: { team: LeagueTeam; names: LeagueCardNames }) {
  const short = shortName(team);
  if (!short) return <>{team.name}</>;
  return (
    <span className={cn('dss-team-name', names === 'short' && 'dss-team-name--short')}>
      <span className="dss-name-full">{team.name}</span>
      <span className="dss-name-short" aria-hidden="true" title={team.name}>
        {short}
      </span>
    </span>
  );
}

/** Ligencard: Mini-Tabelle mit Ausschnitt um die eigene Mannschaft (sonst die ersten Plätze) und Link zur kompletten Tabelle. */
export function LeagueCard({
  title,
  teams,
  teamCount,
  played,
  total,
  columns = [],
  limit = 3,
  href,
  linkLabel = 'Komplette Tabelle und Spielplan',
  live = false,
  names = 'full',
  logos = false,
  size = 'standard',
  titleAs,
  collapsible = false,
  open,
  defaultOpen,
  onOpenChange,
  id,
  className,
}: LeagueCardProps) {
  const Heading = useHeadingTag(titleAs);
  const rows = leagueWindow(teams, { limit });
  const count = teamTotal(teamCount, teams);
  const summary = size === 'compact' ? '' : leagueSummary({ teamCount: count, played, total });
  const caption = [title, windowLabel(rows, count)].filter(Boolean).join(', ');
  const legend = zoneLegend(rows);
  const liveTag = liveInfo(live);
  const wantsWon = columns.includes('won');
  const wantsLost = columns.includes('lost');
  const wantsDiff = columns.includes('diff');
  const wantsForm = columns.includes('form');

  const rootClass = cn('dss-league', size === 'compact' && 'dss-league--compact', className);
  const panel = (
    <>
      <div className="dss-table-scroll dss-league-scroll" role="region" tabIndex={0} aria-label={title ? `Tabelle: ${title}` : 'Tabelle'}>
        <table className={cn('dss-tbl', `dss-tbl--${size === 'compact' ? 'compact' : 'touch'}`, 'dss-league-tbl')}>
          {caption ? <caption className="dss-sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              <th scope="col" className="dss-league-rank">
                <span aria-hidden="true">#</span>
                <span className="dss-sr-only">Platz</span>
              </th>
              <th scope="col">Mannschaft</th>
              <th scope="col" className="num">
                <span aria-hidden="true">SP</span>
                <span className="dss-sr-only">Spiele</span>
              </th>
              {wantsWon ? (
                <th scope="col" className="num dss-league-opt">
                  <span aria-hidden="true">S</span>
                  <span className="dss-sr-only">Siege</span>
                </th>
              ) : null}
              {wantsLost ? (
                <th scope="col" className="num dss-league-opt">
                  <span aria-hidden="true">N</span>
                  <span className="dss-sr-only">Niederlagen</span>
                </th>
              ) : null}
              {wantsDiff ? (
                <th scope="col" className="num dss-league-opt">
                  <span aria-hidden="true">Diff</span>
                  <span className="dss-sr-only">Korbdifferenz</span>
                </th>
              ) : null}
              <th scope="col" className="num dss-league-pts">
                <span aria-hidden="true">PKT</span>
                <span className="dss-sr-only">Punkte</span>
              </th>
              {wantsForm ? (
                <th scope="col" className="dss-league-opt">
                  Form
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const zone = zoneInfo(t.zone);
              const sign = diffSign(t.diff);
              return (
                <tr key={i} className={cn(t.own && 'is-own', zone && 'dss-league-zone', zone && `dss-league-zone--${zone.zone}`) || undefined}>
                  <td className="dss-league-rank">{rankText(t.rank)}</td>
                  <td className="dss-league-team">
                    <span className="dss-league-who">
                      {logos ? (
                        <span className={cn('dss-team-logo', !t.logo && 'dss-team-logo--initials')} aria-hidden="true">
                          {t.logo ? <img src={t.logo} alt="" loading="lazy" /> : initials(t.name, 2)}
                        </span>
                      ) : null}
                      {t.href ? (
                        <a className="dss-link dss-league-link" href={t.href}>
                          <NameText team={t} names={names} />
                        </a>
                      ) : (
                        <NameText team={t} names={names} />
                      )}
                      {t.own ? <span className="dss-sr-only">, eigene Mannschaft</span> : null}
                      {zone ? <span className="dss-sr-only">, {zone.row}</span> : null}
                    </span>
                  </td>
                  <td className="num">{cellNumber(t.played)}</td>
                  {wantsWon ? <td className="num dss-league-opt">{cellNumber(t.won)}</td> : null}
                  {wantsLost ? <td className="num dss-league-opt">{cellNumber(t.lost)}</td> : null}
                  {wantsDiff ? <td className={cn('num', 'dss-league-opt', sign)}>{diffText(t.diff)}</td> : null}
                  <td className="num lead dss-league-pts">{cellNumber(t.points)}</td>
                  {wantsForm ? (
                    <td className="dss-league-opt">
                      <FormChips form={t.form ?? []} />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {legend.length > 0 ? (
        <ul className="dss-league-legend" aria-label="Legende">
          {legend.map((z) => (
            <li key={z.zone}>
              <span className={`dss-league-key dss-league-key--${z.zone}`} aria-hidden="true" />
              {z.legend}
            </li>
          ))}
        </ul>
      ) : null}

      {href ? (
        <div className="dss-league-foot">
          <a className="dss-link dss-league-more" href={href}>
            {linkLabel}
            <span className="dss-sr-only">, {title}</span>
          </a>
        </div>
      ) : null}
    </>
  );

  if (collapsible && title) {
    return (
      <CollapsibleFrame
        kind="league"
        rootClass={rootClass}
        id={id}
        title={title}
        sub={summary}
        titleAs={titleAs}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        meta={
          liveTag ? (
            <span className="dss-league-live">
              <span className="dss-live">
                <span className="dss-live-dot" aria-hidden="true" />
                Live
              </span>
              {liveTag.text ? <span className="dss-league-live-n">{liveTag.text}</span> : null}
            </span>
          ) : undefined
        }
      >
        {panel}
      </CollapsibleFrame>
    );
  }
  if (collapsible) devWarn('[DSS] LeagueCard: `collapsible` braucht einen `title`, sonst bleibt die Karte unverändert.');
  return (
    <div className={rootClass}>
      <div className="dss-league-head">
        <div className="dss-league-heading">
          <Heading className="dss-league-title">{title}</Heading>
          {summary ? <p className="dss-league-sub">{summary}</p> : null}
        </div>
        {liveTag ? (
          <span className="dss-league-live">
            <span className="dss-live">
              <span className="dss-live-dot" aria-hidden="true" />
              Live
            </span>
            {liveTag.text ? <span className="dss-league-live-n">{liveTag.text}</span> : null}
          </span>
        ) : null}
      </div>

      {panel}
    </div>
  );
}
