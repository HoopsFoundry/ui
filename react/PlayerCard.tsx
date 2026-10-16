import { useState, type MouseEventHandler } from 'react';
import { cn } from './cn';
import { useHeadingTag, type HeadingTag } from './HeadingLevel';

export type PlayerCardSize = 'compact' | 'standard' | 'hero';
export type PlayerTeam = 'heim' | 'gast';

export interface PlayerVital {
  label: string;
  value: string | number;
  /** Hebt den Wert in Amber hervor. */
  accent?: boolean;
}

export interface PlayerCardProps {
  size?: PlayerCardSize;
  jersey: string | number;
  name: string;
  position?: string;
  team?: PlayerTeam;
  captain?: boolean;
  age?: string;
  heightCm?: string;
  /** Rolle/Funktion im Team (z. B. „Spielmacher“), nur in compact sichtbar. */
  playerRole?: string;
  vitals?: PlayerVital[];
  /** Hauptstatistik der compact-Zeile mit Beschriftung. */
  stat?: string | number | null;
  statLabel?: string;
  /** Nur compact: mit onClick wird die Zeile ein Button. */
  onClick?: MouseEventHandler<HTMLButtonElement>;
  /** Überschriftenebene des Namens in standard/hero, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
  titleAs?: HeadingTag;
  /** Foto-URL: ersetzt die Trikotmarke; die Trikotnummer bleibt als Badge (hero: Porträtfläche). Leer oder bei Ladefehler: Trikotmarke. */
  photo?: string;
  /** Alternativtext des Fotos; Standard leer (dekorativ, der Name steht daneben). */
  photoAlt?: string;
  className?: string;
}

function Vitals({ vitals }: { vitals: PlayerVital[] }) {
  if (vitals.length === 0) return null;
  return (
    <div className="hoops-pc-vitals">
      {vitals.map((vital) => (
        <div key={vital.label}>
          <div className={cn('hoops-pc-v', vital.accent && 'hoops-pc-v--amber')}>{vital.value}</div>
          <div className="hoops-pc-l">{vital.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Spielerprimitive in drei Maßstäben: compact (Listenzeile), standard (Karte), hero (dunkle Großkarte). */
export function PlayerCard({
  size = 'standard',
  jersey,
  name,
  position = '',
  team = 'heim',
  captain = false,
  age = '',
  heightCm = '',
  playerRole = '',
  vitals = [],
  stat = null,
  statLabel = '',
  onClick,
  titleAs,
  photo = '',
  photoAlt = '',
  className,
}: PlayerCardProps) {
  const Heading = useHeadingTag(titleAs);
  // Eine URL, die nicht lädt, wird gemerkt: dann erscheint wieder die Trikotmarke (kein kaputtes Bildsymbol)
  const [failedUrl, setFailedUrl] = useState('');
  const showPhoto = Boolean(photo) && photo !== failedUrl;
  const imgSize = size === 'compact' ? 32 : size === 'standard' ? 64 : 200;
  const img = (
    <img
      className="hoops-pc-img"
      src={photo}
      alt={photoAlt}
      width={imgSize}
      height={imgSize}
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(photo)}
    />
  );

  const posClass = position ? `hoops-pos ${position.toLowerCase()}` : '';
  const role = (
    <div className="hoops-pc-role">
      {position ? <span className={posClass}>{position}</span> : null}
      {captain ? <span className="hoops-pc-cap">Kapitän</span> : null}
      {age ? <span>{age}</span> : null}
      {heightCm ? <span>{heightCm} cm</span> : null}
    </div>
  );

  if (size === 'compact') {
    const body = (
      <>
        {showPhoto ? (
          <span className="hoops-pc-av">
            {img}
            <span className={cn('hoops-tn', 'hoops-tn--badge', team, captain && 'captain')}>{jersey}</span>
          </span>
        ) : (
          <span className={cn('hoops-tn', team, 'small', captain && 'captain')}>{jersey}</span>
        )}
        <span className="hoops-pc-who">
          <span className="hoops-pc-name">
            {name}
            {captain ? ' (C)' : ''}
          </span>
          {position || playerRole ? (
            <span className="hoops-pc-meta">
              {position}
              {playerRole ? ` · ${playerRole}` : ''}
            </span>
          ) : null}
        </span>
        {/* Pill nur visuell: die Position steht schon in der Meta-Zeile. Leeres <span /> = Platzhalter für die Grid-Spalte. */}
        {position ? <span className={posClass} aria-hidden="true">{position}</span> : <span />}
        {stat !== null ? (
          <span className="hoops-pc-stat">
            {stat}
            {statLabel ? <span className="hoops-pc-stat-l">{statLabel}</span> : null}
          </span>
        ) : (
          // Platzhalter für die Grid-Spalte der Statistik
          <span />
        )}
      </>
    );
    return onClick ? (
      <button type="button" className={cn('hoops-pc-row', className)} onClick={onClick}>
        {body}
      </button>
    ) : (
      <div className={cn('hoops-pc-row', className)}>{body}</div>
    );
  }

  if (size === 'standard') {
    return (
      <div className={cn('hoops-pc-card', className)}>
        <div className="hoops-pc-head">
          {showPhoto ? (
            <span className="hoops-pc-av hoops-pc-av--lg">
              {img}
              <span className={cn('hoops-tn', 'hoops-tn--badge', 'hoops-tn--badge-lg', team, captain && 'captain')}>{jersey}</span>
            </span>
          ) : (
            <span className={cn('hoops-tn', team, 'large', captain && 'captain')}>{jersey}</span>
          )}
          <div className="hoops-pc-who">
            <Heading className="hoops-pc-nm">{name}</Heading>
            {role}
          </div>
        </div>
        <Vitals vitals={vitals} />
      </div>
    );
  }

  return (
    <div className={cn('hoops-pc-hero', showPhoto && 'hoops-pc-hero--photo', className)}>
      <div className="hoops-pc-hero-left">
        {showPhoto ? (
          <>
            {img}
            <span className={cn('hoops-tn', 'hoops-tn--badge', 'hoops-tn--badge-lg', team, captain && 'captain')}>{jersey}</span>
          </>
        ) : (
          <span className={cn('hoops-tn', 'hero', team, captain && 'captain')}>{jersey}</span>
        )}
      </div>
      <div className="hoops-pc-hero-right">
        <Heading className="hoops-pc-nm">{name}</Heading>
        {role}
        <Vitals vitals={vitals} />
      </div>
    </div>
  );
}
