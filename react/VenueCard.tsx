import { cn } from './cn';
import { initials, shortName } from '../js/schedule.js';
import type { ScheduleGame, ScheduleTeam } from '../js/schedule.js';
import {
  addressLines,
  contactInfo,
  gameKeys,
  gameMeta,
  gameState,
  gameWhen,
  isCoord,
  venueGames,
  venueHref,
  venueMapLabel,
  venueMapLinks,
  venueText,
} from '../js/venue.js';
import type { VenueAddress, VenueContact } from '../js/venue.js';
import { MapView } from './Map';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';

export type { VenueAddress, VenueContact };
export type VenueCardSize = 'standard' | 'compact';
export type VenueCardNames = 'full' | 'short';

export interface VenueCardProps {
  /** Name der Halle, z. B. „Sporthalle Nordhain“. Pflicht; leer oder nur Leerraum ergibt keine Überschrift. */
  name: string;
  /** Adresse: Straße, Postleitzahl, Ort. Leere Teile entfallen. */
  address?: VenueAddress;
  /** Koordinaten der Halle; ohne beide gültigen Werte keine Karte. */
  lat?: number;
  lng?: number;
  /** Kurzinfo, z. B. „Zwei Spielfelder, Zugang über den Haupteingang“. */
  info?: string;
  /** Ansprechperson mit Telefon und E-Mail (als `tel:`- und `mailto:`-Links). */
  contact?: VenueContact;
  /** Spiele in der Halle; gezeigt werden die nächsten `limit` (ohne beendete). Nur in `standard`. */
  games?: ScheduleGame[];
  /** Höchstzahl der Spiele (1 bis 5, Standard 2). */
  limit?: number;
  /** Beschriftung der Spieleliste. Standard: „Nächste Spiele in der Halle“. */
  gamesLabel?: string;
  /** Seite der Halle; ohne `href` entfällt der Link. */
  href?: string;
  /** Text des Links. Standard: „Zur Hallenseite“. */
  linkLabel?: string;
  /** `short` zeigt den Kurznamen (falls vorhanden); bis 640 px erscheint er automatisch (CSS). */
  names?: VenueCardNames;
  /** Logo bzw. Initialen vor den Mannschaften der Spiele. */
  logos?: boolean;
  /** `standard`: Karte etwa 40 % mit Spielen; `compact`: kleinere Karte, ohne Spiele. */
  size?: VenueCardSize;
  /** Überschriftenebene des Namens, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  /** `click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard). `auto`: sofort laden. */
  load?: 'click' | 'auto';
  /** Kachel-Adresse der Karte (siehe Map). */
  tileUrl?: string;
  /** Hinweis im Platzhalter der Karte (siehe Map). */
  privacyNote?: string;
  /** Mindesthöhe der Karte in Pixeln (mindestens 200); die Karte wächst mit den Daten daneben. */
  mapHeight?: number;
  className?: string;
}

/** Eine Mannschaft der Spielzeile: Trikotpunkt, optional Logo, versteckter Hinweis „Heim“/„Gast“, Name mit Kurzform. */
function TeamLine({ team, side, names, logos }: { team: ScheduleTeam; side: 'heim' | 'gast'; names: VenueCardNames; logos: boolean }) {
  const short = shortName(team);
  return (
    <div className="dss-venue-team">
      <span className={`dss-venue-dot dss-venue-dot--${side}`} aria-hidden="true" />
      {logos ? (
        <span className={cn('dss-team-logo', 'dss-team-logo--sm', !team.logo && 'dss-team-logo--initials')} aria-hidden="true">
          {team.logo ? <img src={team.logo} alt="" loading="lazy" /> : initials(team.name, 2)}
        </span>
      ) : null}
      <span className="dss-sr-only">{side === 'heim' ? venueText.home : venueText.away}:</span>
      <span className="dss-venue-team-name">
        {short ? (
          <span className={cn('dss-team-name', names === 'short' && 'dss-team-name--short')}>
            <span className="dss-name-full">{team.name}</span>
            <span className="dss-name-short" aria-hidden="true" title={team.name}>
              {short}
            </span>
          </span>
        ) : (
          team.name
        )}
      </span>
    </div>
  );
}

/** Hallenkarte: kleine Karte links, rechts Name, Adresse, Kurzinfo, Kontakt, nächste Spiele und Link zur Hallenseite. */
export function VenueCard({
  name,
  address,
  lat,
  lng,
  info = '',
  contact,
  games,
  limit,
  gamesLabel = venueText.gamesLabel,
  href,
  linkLabel = venueText.linkLabel,
  names = 'full',
  logos = false,
  size = 'standard',
  titleAs,
  load = 'click',
  tileUrl,
  privacyNote,
  mapHeight = 250,
  className,
}: VenueCardProps) {
  const Heading = useHeadingTag(titleAs);
  // Ohne Namen (leer oder nur Leerraum) entfällt die Überschrift, statt leer zu bleiben
  const title = typeof name === 'string' ? name.trim() : '';
  const hasMap = isCoord(lat, lng);
  const lines = addressLines(address);
  const person = contactInfo(contact);
  const rows: ScheduleGame[] = size === 'compact' ? [] : venueGames(games, limit);
  const mapLinks = venueMapLinks({ lat, lng, name: title });
  const target = venueHref(href);
  const keys = gameKeys(rows);

  return (
    <div className={cn('dss-venue', `dss-venue--${size}`, hasMap && 'dss-venue--map', className)}>
      <div className="dss-venue-in">
      {hasMap ? (
        <div className="dss-venue-map">
          <MapView
            label={venueMapLabel(title)}
            markers={[{ id: 'halle', lat: lat as number, lng: lng as number, label: title }]}
            interactive={false}
            showList={false}
            height={mapHeight}
            load={load}
            tileUrl={tileUrl}
            privacyNote={privacyNote}
            appLinks={[]}
          />
          <div className="dss-venue-maplinks">
            {mapLinks.map((link) => (
              <a key={link.kind} className="dss-link" href={link.href}>
                {link.text}
                {title ? <span className="dss-sr-only">, {title}</span> : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="dss-venue-body">
        {title ? <Heading className="dss-venue-title">{title}</Heading> : null}

        {lines.length > 0 ? (
          <address className="dss-venue-address">
            {lines.map((line, i) => (
              <span key={i} className="dss-venue-line">
                {line}
              </span>
            ))}
          </address>
        ) : null}

        {info && info.trim() ? <p className="dss-venue-info">{info.trim()}</p> : null}

        {person ? (
          <dl className="dss-venue-contact">
            {person.name ? (
              <div>
                <dt>{venueText.contact}</dt>
                <dd>{person.name}</dd>
              </div>
            ) : null}
            {person.phone ? (
              <div>
                <dt>{venueText.phone}</dt>
                <dd>
                  {person.phone.href ? (
                    <a className="dss-link" href={person.phone.href}>
                      {person.phone.text}
                    </a>
                  ) : (
                    person.phone.text
                  )}
                </dd>
              </div>
            ) : null}
            {person.email ? (
              <div>
                <dt>{venueText.email}</dt>
                <dd>
                  {person.email.href ? (
                    <a className="dss-link" href={person.email.href}>
                      {person.email.text}
                    </a>
                  ) : (
                    person.email.text
                  )}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}

        {rows.length > 0 ? (
          <div className="dss-venue-games">
            <div className="dss-venue-sec" aria-hidden="true">
              {gamesLabel}
            </div>
            <ul className="dss-venue-game-list" aria-label={gamesLabel}>
              {rows.map((game, index) => {
                const when = gameWhen(game);
                const meta = gameMeta(game);
                const state = gameState(game);
                return (
                  <li key={keys[index]} className="dss-venue-game">
                    {when || state ? (
                      <div className="dss-venue-game-head">
                        {when ? <span className="dss-venue-when">{when}</span> : null}
                        {state ? <span className={`dss-chip dss-chip--${state.tone}`}>{state.text}</span> : null}
                      </div>
                    ) : null}
                    {meta ? <div className="dss-venue-game-meta">{meta}</div> : null}
                    <div className="dss-venue-teams">
                      {game.heim?.name ? <TeamLine team={game.heim} side="heim" names={names} logos={logos} /> : null}
                      {game.gast?.name ? <TeamLine team={game.gast} side="gast" names={names} logos={logos} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {target ? (
          <div className="dss-venue-foot">
            <a className="dss-link dss-venue-more" href={target}>
              {linkLabel}
              {title ? <span className="dss-sr-only">, {title}</span> : null}
            </a>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
