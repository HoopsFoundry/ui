import { statEmptyText, statItems } from '../js/stats.js';
import type { StatInput } from '../js/stats.js';
import { cn } from './cn';

export type { StatInput };

export interface StatGridProps {
  /** Kennzahlen: `{ label, value }`; Zahlen bekommen das Dezimalkomma. */
  items: StatInput[];
  /** Ohne Kacheln, in einer Zeile (Seitenleiste, Kopf einer Karte). */
  compact?: boolean;
  className?: string;
}

/**
 * Kennzahlen als Gitter (`dss-stats`). Beschreibungsliste: Beschriftung zuerst, optisch steht der Wert darüber. Ein fehlender Wert zeigt
 * einen Gedankenstrich mit verstecktem Text „keine Angabe“.
 */
export function StatGrid({ items, compact = false, className }: StatGridProps) {
  const list = statItems(items);
  if (!list.length) return null;
  return (
    <dl className={cn('dss-stats', compact && 'dss-stats--compact', className)}>
      {list.map((s, i) => (
        <div key={i} className="dss-stat">
          <dt className="dss-stat-label">{s.label}</dt>
          <dd className="dss-stat-value">
            {s.empty ? (
              <>
                <span aria-hidden="true">{s.value}</span>
                <span className="dss-sr-only">{statEmptyText}</span>
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
