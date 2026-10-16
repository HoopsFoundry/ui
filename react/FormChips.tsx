import { formEntries, formLabel } from '../js/league.js';
import type { LeagueFormEntry } from '../js/league.js';
import { cn } from './cn';

export interface FormChipsProps {
  /** Ergebnisse, neueste zuletzt: `S` Sieg, `N` Niederlage, `U` Unentschieden. Angezeigt werden höchstens die letzten fünf. */
  form: LeagueFormEntry[];
  /** `dots` (Standard): Punkte, Quadrat, Ring. `letters`: Marken mit S, N, U. */
  variant?: 'dots' | 'letters';
  className?: string;
}

/**
 * Form (letzte Spiele): Zeichen sind `aria-hidden`, der Screenreader-Text kommt aus `formLabel`. Dieselbe Darstellung wie die
 * Spalte „Form“ der LeagueCard; ohne gültigen Eintrag erscheint nichts.
 */
export function FormChips({ form, variant = 'dots', className }: FormChipsProps) {
  const entries = formEntries(form);
  if (!entries.length) return null;
  return (
    <span className={cn('hoops-form', variant === 'letters' && 'hoops-form--letters', className)}>
      <span className="hoops-form-list" aria-hidden="true">
        {entries.map((e, k) => (
          <span key={k} className={`hoops-form-item hoops-form-item--${e.toLowerCase()}`} />
        ))}
      </span>
      <span className="hoops-sr-only">{formLabel(form)}</span>
    </span>
  );
}
