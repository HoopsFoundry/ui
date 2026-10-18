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
  venueString,
} from '../js/venue.js';
import type { VenueAddress, VenueContact } from '../js/venue.js';
import { MapView } from './Map';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';
import { useT } from './i18n';
import type { CatalogValue, TOptions } from '../js/i18n/index.js';

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
  /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters (`HoopsProvider`) und `setTexts`, aber nicht `venueText` und die Eigenschaften wie `gamesLabel`. */
  texts?: Record<string, CatalogValue>;
  className?: string;
}

/** Eine Mannschaft der Spielzeile: Trikotpunkt, optional Logo, versteckter Hinweis „Heim“/„Gast“, Name mit Kurzform. */
function TeamLine({ team, side, names, logos, options }: { team: ScheduleTeam; side: 'heim' | 'gast'; names: VenueCardNames; logos: boolean; options: TOptions }) {
  const short = shortName(team);
  return (
    <div className="hoops-venue-team">
      <span className={`hoops-venue-dot hoops-venue-dot--${side}`} aria-hidden="true" />
      {logos ? (
        <span className={cn('hoops-team-logo', 'hoops-team-logo--sm', !team.logo && 'hoops-team-logo--initials')} aria-hidden="true">
          {team.logo ? <img src={team.logo} alt="" loading="lazy" /> : initials(team.name, 2)}
        </span>
      ) : null}
      <span className="hoops-sr-only">{venueString(side === 'heim' ? 'home' : 'away', options)}:</span>
      <span className="hoops-venue-team-name">
        {short ? (
          <span className={cn('hoops-team-name', names === 'short' && 'hoops-team-name--short')}>
            <span className="hoops-name-full">{team.name}</span>
            <span className="hoops-name-short" aria-hidden="true" title={team.name}>
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
  gamesLabel,
  href,
  linkLabel,
  names = 'full',
  logos = false,
  size = 'standard',
  titleAs,
  load = 'click',
  tileUrl,
  privacyNote,
  mapHeight = 250,
  texts,
  className,
}: VenueCardProps) {
  const Heading = useHeadingTag(titleAs);
  const i18n = useT(texts);
  const { options } = i18n;
  // Text der Halle in Sprache und Texten dieses Bausteins; eine Zuweisung an `venueText` hat Vorrang
  const V = (key: Parameters<typeof venueString>[0]) => venueString(key, options);
  const gamesTitle = gamesLabel ?? V('gamesLabel');
  const more = linkLabel ?? V('linkLabel');
  // Ohne Namen (leer oder nur Leerraum) entfällt die Überschrift, statt leer zu bleiben
  const title = typeof name === 'string' ? name.trim() : '';
  const hasMap = isCoord(lat, lng);
  const lines = addressLines(address);
  const person = contactInfo(contact);
  const rows: ScheduleGame[] = size === 'compact' ? [] : venueGames(games, limit);
  const mapLinks = venueMapLinks({ lat, lng, name: title }, options);
  const target = venueHref(href);
  const keys = gameKeys(rows);

  return (
    <div className={cn('hoops-venue', `hoops-venue--${size}`, hasMap && 'hoops-venue--map', className)} lang={i18n.lang}>
      <div className="hoops-venue-in">
      {hasMap ? (
        <div className="hoops-venue-map">
          <MapView
            label={venueMapLabel(title, options)}
            markers={[{ id: 'halle', lat: lat as number, lng: lng as number, label: title }]}
            interactive={false}
            showList={false}
            height={mapHeight}
            load={load}
            tileUrl={tileUrl}
            privacyNote={privacyNote}
            texts={texts}
            appLinks={[]}
          />
          <div className="hoops-venue-maplinks">
            {mapLinks.map((link) => (
              <a key={link.kind} className="hoops-link" href={link.href}>
                {link.text}
                {title ? <span className="hoops-sr-only">, {title}</span> : null}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="hoops-venue-body">
        {title ? <Heading className="hoops-venue-title">{title}</Heading> : null}

        {lines.length > 0 ? (
          <address className="hoops-venue-address">
            {lines.map((line, i) => (
              <span key={i} className="hoops-venue-line">
                {line}
              </span>
            ))}
          </address>
        ) : null}

        {info && info.trim() ? <p className="hoops-venue-info">{info.trim()}</p> : null}

        {person ? (
          <dl className="hoops-venue-contact">
            {person.name ? (
              <div>
                <dt>{V('contact')}</dt>
                <dd>{person.name}</dd>
              </div>
            ) : null}
            {person.phone ? (
              <div>
                <dt>{V('phone')}</dt>
                <dd>
                  {person.phone.href ? (
                    <a className="hoops-link" href={person.phone.href}>
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
                <dt>{V('email')}</dt>
                <dd>
                  {person.email.href ? (
                    <a className="hoops-link" href={person.email.href}>
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
          <div className="hoops-venue-games">
            <div className="hoops-venue-sec" aria-hidden="true">
              {gamesTitle}
            </div>
            <ul className="hoops-venue-game-list" aria-label={gamesTitle}>
              {rows.map((game, index) => {
                const when = gameWhen(game);
                const meta = gameMeta(game);
                const state = gameState(game, options);
                return (
                  <li key={keys[index]} className="hoops-venue-game">
                    {when || state ? (
                      <div className="hoops-venue-game-head">
                        {when ? <span className="hoops-venue-when">{when}</span> : null}
                        {state ? <span className={`hoops-chip hoops-chip--${state.tone}`}>{state.text}</span> : null}
                      </div>
                    ) : null}
                    {meta ? <div className="hoops-venue-game-meta">{meta}</div> : null}
                    <div className="hoops-venue-teams">
                      {game.heim?.name ? <TeamLine team={game.heim} side="heim" names={names} logos={logos} options={options} /> : null}
                      {game.gast?.name ? <TeamLine team={game.gast} side="gast" names={names} logos={logos} options={options} /> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {target ? (
          <div className="hoops-venue-foot">
            <a className="hoops-link hoops-venue-more" href={target}>
              {more}
              {title ? <span className="hoops-sr-only">, {title}</span> : null}
            </a>
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
