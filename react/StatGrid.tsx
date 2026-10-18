import { statEmptyLabel, statItems } from '../js/stats.js';
import type { StatInput } from '../js/stats.js';
import { cn } from './cn';
import { useT } from './i18n';
import type { CatalogValue } from '../js/i18n/index.js';

export type { StatInput };

export interface StatGridProps {
  /** Kennzahlen: `{ label, value }`; Zahlen bekommen das Dezimalkomma. */
  items: StatInput[];
  /** Ohne Kacheln, in einer Zeile (Seitenleiste, Kopf einer Karte). */
  compact?: boolean;
  /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters (`HoopsProvider`) und `setTexts`. */
  texts?: Record<string, CatalogValue>;
  className?: string;
}

/**
 * Kennzahlen als Gitter (`hoops-stats`). Beschreibungsliste: Beschriftung zuerst, optisch steht der Wert darüber. Ein fehlender Wert zeigt
 * einen Gedankenstrich mit verstecktem Text „keine Angabe“.
 */
export function StatGrid({ items, compact = false, texts, className }: StatGridProps) {
  const i18n = useT(texts);
  const list = statItems(items, i18n.options);
  if (!list.length) return null;
  return (
    <dl className={cn('hoops-stats', compact && 'hoops-stats--compact', className)} lang={i18n.lang}>
      {list.map((s, i) => (
        <div key={i} className="hoops-stat">
          <dt className="hoops-stat-label">{s.label}</dt>
          <dd className="hoops-stat-value">
            {s.empty ? (
              <>
                <span aria-hidden="true">{s.value}</span>
                <span className="hoops-sr-only">{statEmptyLabel(i18n.options)}</span>
              </>
            ) : (
              s.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
