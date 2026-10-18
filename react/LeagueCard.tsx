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
import { useT } from './i18n';
import type { CatalogValue } from '../js/i18n/index.js';

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
  /** Text des Links. Standard aus dem Katalog (`league.link`, deutsch „Komplette Tabelle und Spielplan“). */
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
  /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters (`HoopsProvider`) und `setTexts`. */
  texts?: Record<string, CatalogValue>;
  className?: string;
}

/** Name mit Kurzform: beide Texte im Markup, der Kurzname ist für Hilfstechnik versteckt (der volle Name gilt). */
function NameText({ team, names }: { team: LeagueTeam; names: LeagueCardNames }) {
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
  linkLabel,
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
  texts,
  className,
}: LeagueCardProps) {
  const Heading = useHeadingTag(titleAs);
  const i18n = useT(texts);
  const { options } = i18n;
  const rows = leagueWindow(teams, { limit });
  const count = teamTotal(teamCount, teams);
  const summary = size === 'compact' ? '' : leagueSummary({ teamCount: count, played, total }, options);
  const caption = [title, windowLabel(rows, count, options)].filter(Boolean).join(', ');
  const legend = zoneLegend(rows, options);
  const liveTag = liveInfo(live, options);
  const wantsWon = columns.includes('won');
  const wantsLost = columns.includes('lost');
  const wantsDiff = columns.includes('diff');
  const wantsForm = columns.includes('form');

  const rootClass = cn('hoops-league', size === 'compact' && 'hoops-league--compact', className);
  const panel = (
    <>
      <div className="hoops-table-scroll hoops-league-scroll" role="region" tabIndex={0} aria-label={title ? i18n.t('league.table-titled', { title }) : i18n.t('league.table')}>
        <table className={cn('hoops-tbl', `hoops-tbl--${size === 'compact' ? 'compact' : 'touch'}`, 'hoops-league-tbl')}>
          {caption ? <caption className="hoops-sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              <th scope="col" className="hoops-league-rank">
                <span aria-hidden="true">#</span>
                <span className="hoops-sr-only">{i18n.t('league.col.rank')}</span>
              </th>
              <th scope="col">{i18n.t('league.col.team')}</th>
              <th scope="col" className="num">
                <span aria-hidden="true">{i18n.t('league.col.played-short')}</span>
                <span className="hoops-sr-only">{i18n.t('league.col.played')}</span>
              </th>
              {wantsWon ? (
                <th scope="col" className="num hoops-league-opt">
                  <span aria-hidden="true">{i18n.t('league.col.won-short')}</span>
                  <span className="hoops-sr-only">{i18n.t('league.col.won')}</span>
                </th>
              ) : null}
              {wantsLost ? (
                <th scope="col" className="num hoops-league-opt">
                  <span aria-hidden="true">{i18n.t('league.col.lost-short')}</span>
                  <span className="hoops-sr-only">{i18n.t('league.col.lost')}</span>
                </th>
              ) : null}
              {wantsDiff ? (
                <th scope="col" className="num hoops-league-opt">
                  <span aria-hidden="true">{i18n.t('league.col.diff-short')}</span>
                  <span className="hoops-sr-only">{i18n.t('league.col.diff')}</span>
                </th>
              ) : null}
              <th scope="col" className="num hoops-league-pts">
                <span aria-hidden="true">{i18n.t('league.col.points-short')}</span>
                <span className="hoops-sr-only">{i18n.t('league.col.points')}</span>
              </th>
              {wantsForm ? (
                <th scope="col" className="hoops-league-opt">
                  {i18n.t('league.col.form')}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => {
              const zone = zoneInfo(t.zone, options);
              const sign = diffSign(t.diff);
              return (
                <tr key={i} className={cn(t.own && 'is-own', zone && 'hoops-league-zone', zone && `hoops-league-zone--${zone.zone}`) || undefined}>
                  <td className="hoops-league-rank">{rankText(t.rank)}</td>
                  <td className="hoops-league-team">
                    <span className="hoops-league-who">
                      {logos ? (
                        <span className={cn('hoops-team-logo', !t.logo && 'hoops-team-logo--initials')} aria-hidden="true">
                          {t.logo ? <img src={t.logo} alt="" loading="lazy" /> : initials(t.name, 2)}
                        </span>
                      ) : null}
                      {t.href ? (
                        <a className="hoops-link hoops-league-link" href={t.href}>
                          <NameText team={t} names={names} />
                        </a>
                      ) : (
                        <NameText team={t} names={names} />
                      )}
                      {t.own ? <span className="hoops-sr-only">, {i18n.t('league.own-team')}</span> : null}
                      {zone ? <span className="hoops-sr-only">, {zone.row}</span> : null}
                    </span>
                  </td>
                  <td className="num">{cellNumber(t.played, options)}</td>
                  {wantsWon ? <td className="num hoops-league-opt">{cellNumber(t.won, options)}</td> : null}
                  {wantsLost ? <td className="num hoops-league-opt">{cellNumber(t.lost, options)}</td> : null}
                  {wantsDiff ? <td className={cn('num', 'hoops-league-opt', sign)}>{diffText(t.diff, options)}</td> : null}
                  <td className="num lead hoops-league-pts">{cellNumber(t.points, options)}</td>
                  {wantsForm ? (
                    <td className="hoops-league-opt">
                      <FormChips form={t.form ?? []} texts={texts} />
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {legend.length > 0 ? (
        <ul className="hoops-league-legend" aria-label={i18n.t('league.legend')}>
          {legend.map((z) => (
            <li key={z.zone}>
              <span className={`hoops-league-key hoops-league-key--${z.zone}`} aria-hidden="true" />
              {z.legend}
            </li>
          ))}
        </ul>
      ) : null}

      {href ? (
        <div className="hoops-league-foot">
          <a className="hoops-link hoops-league-more" href={href}>
            {linkLabel ?? i18n.t('league.link')}
            <span className="hoops-sr-only">, {title}</span>
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
        lang={i18n.lang}
        meta={
          liveTag ? (
            <span className="hoops-league-live">
              <span className="hoops-live">
                <span className="hoops-live-dot" aria-hidden="true" />
                {i18n.t('common.live')}
              </span>
              {liveTag.text ? <span className="hoops-league-live-n">{liveTag.text}</span> : null}
            </span>
          ) : undefined
        }
      >
        {panel}
      </CollapsibleFrame>
    );
  }
  if (collapsible) devWarn('[HoopsFoundry UI] LeagueCard: `collapsible` braucht einen `title`, sonst bleibt die Karte unverändert.');
  return (
    <div className={rootClass} lang={i18n.lang}>
      <div className="hoops-league-head">
        <div className="hoops-league-heading">
          <Heading className="hoops-league-title">{title}</Heading>
          {summary ? <p className="hoops-league-sub">{summary}</p> : null}
        </div>
        {liveTag ? (
          <span className="hoops-league-live">
            <span className="hoops-live">
              <span className="hoops-live-dot" aria-hidden="true" />
              {i18n.t('common.live')}
            </span>
            {liveTag.text ? <span className="hoops-league-live-n">{liveTag.text}</span> : null}
          </span>
        ) : null}
      </div>

      {panel}
    </div>
  );
}
