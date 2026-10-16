import { cn } from './cn';

export interface CourtLinesProps {
  /** `fixed` (Standard): füllt den Viewport. `absolute`: füllt den nächsten positionierten Container. */
  position?: 'fixed' | 'absolute';
  className?: string;
}

/**
 * Dezente Spielfeldlinien (FIBA 28 × 15 m) als Seitenhintergrund. Rein dekorativ.
 * Seiteninhalt braucht `position: relative; z-index: 1`, damit er über dem Hintergrund liegt.
 */
export function CourtLines({ position = 'fixed', className }: CourtLinesProps) {
  return (
    <div className={cn('hoops-courtbg', position === 'absolute' && 'hoops-courtbg--absolute', className)} aria-hidden="true">
      <div className="hoops-courtlines" />
    </div>
  );
}
