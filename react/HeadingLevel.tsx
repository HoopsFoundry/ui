import { createContext, useContext, type ReactNode } from 'react';
import { headingLevel, nextLevel, resolveHeading, type HeadingLevelInput, type HeadingLevelValue, type HeadingTag } from '../js/heading.js';

export type { HeadingLevelInput, HeadingLevelValue, HeadingTag };

/** Ebene, die Komponentenüberschriften im Teilbaum bekommen; `undefined` ohne `HeadingLevel` darüber. */
export const HeadingLevelContext = createContext<HeadingLevelValue | undefined>(undefined);

export interface HeadingLevelProps {
  /** Absolute Ebene (2 bis 6, auch als Zeichenkette `"4"`) für die Überschriften der Komponenten darunter. Gewinnt gegen `by`. */
  level?: HeadingLevelInput;
  /**
   * Relativ zum übergeordneten `HeadingLevel` (Standard 1). Ohne übergeordnetes `HeadingLevel` zählt die
   * Ausgangsebene 2, `by={1}` ergibt also h3 (wie der Standard der Komponenten).
   */
  by?: number;
  children?: ReactNode;
}

/**
 * Gibt den Komponentenüberschriften im Teilbaum eine Ebene vor (nur `h2` bis `h6`, nie `h1`). Ein `titleAs` an der
 * Komponente gewinnt. Ändert nur die Ebene im Dokument, nicht die Größe (siehe Tokens `--hoops-title-size`).
 */
export function HeadingLevel({ level, by = 1, children }: HeadingLevelProps) {
  const parent = useContext(HeadingLevelContext);
  const value = level !== undefined ? headingLevel(level) : nextLevel(parent, by);
  return <HeadingLevelContext.Provider value={value}>{children}</HeadingLevelContext.Provider>;
}

/** Ebene (2 bis 6), die Komponentenüberschriften an dieser Stelle bekommen; ohne `HeadingLevel` darüber 3. */
export function useHeadingLevel(): HeadingLevelValue {
  return headingLevel(useContext(HeadingLevelContext));
}

/** Für die Titelkomponenten: `titleAs` gewinnt vor der Ebene aus `HeadingLevel` vor dem Standard h3. */
export function useHeadingTag(titleAs?: HeadingTag): HeadingTag {
  return resolveHeading(titleAs, useContext(HeadingLevelContext));
}
