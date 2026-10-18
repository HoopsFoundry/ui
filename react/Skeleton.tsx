import type { CSSProperties } from 'react';
import { cn } from './cn';
import { useT } from './i18n';

export type SkeletonVariant = 'line' | 'block' | 'circle' | 'row' | 'match';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  height?: string;
  /** Eckenradius (ignoriert beim Kreis). */
  rounded?: string;
  /** Anzahl der Wiederholungen (nicht bei `match`). */
  count?: number;
  /** Text für Screenreader, wird einmal angesagt; `""` lässt den Status-Text weg. */
  label?: string;
  className?: string;
}

function Bar({ style, circle }: { style: CSSProperties; circle?: boolean }) {
  return <div className={cn('hoops-skel', circle ? 'hoops-skel--circle' : 'hoops-skel--line')} style={style} aria-hidden="true" />;
}

/** Shimmer-Platzhalter für Ladezustände; die Platzhalter sind dekorativ, ein einzelner Status-Text meldet das Laden. */
export function Skeleton({
  variant = 'line',
  width = 'auto',
  height = 'auto',
  rounded = '6px',
  count = 1,
  label,
  className,
}: SkeletonProps) {
  const i18n = useT();
  const text = label ?? i18n.t('skeleton.loading');
  // label="" lässt den Status-Text weg (mehrere Skeletons auf einer Seite)
  const status = text ? (
    <span role="status" className="hoops-sr-only" lang={i18n.lang}>
      {text}
    </span>
  ) : null;

  if (variant === 'row') {
    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={cn('hoops-skel-row', className)} aria-hidden="true">
            <Bar circle style={{ width: 44, height: 44 }} />
            <div className="hoops-skel-who">
              <Bar style={{ width: '50%', height: 14 }} />
              <Bar style={{ width: '30%', height: 10, marginTop: 4 }} />
            </div>
            <Bar style={{ width: 60, height: 18 }} />
          </div>
        ))}
        {status}
      </>
    );
  }

  if (variant === 'match') {
    return (
      <>
        <div className={cn('hoops-skel-match', className)} aria-hidden="true">
          <div className="hoops-skel-match-head">
            <Bar style={{ width: 90, height: 10 }} />
            <Bar style={{ width: 70, height: 10 }} />
          </div>
          {[0, 1].map((row) => (
            <div key={row} className="hoops-skel-match-row">
              <Bar circle style={{ width: 12, height: 12 }} />
              <Bar style={{ flex: 1, height: 18 }} />
              <Bar style={{ width: 36, height: 22 }} />
            </div>
          ))}
        </div>
        {status}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn('hoops-skel', `hoops-skel--${variant}`, className)}
          style={{ width, height, borderRadius: variant === 'circle' ? '50%' : rounded }}
          aria-hidden="true"
        />
      ))}
      {status}
    </>
  );
}
