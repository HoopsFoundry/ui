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
    <span className={cn('dss-form', variant === 'letters' && 'dss-form--letters', className)}>
      <span className="dss-form-list" aria-hidden="true">
        {entries.map((e, k) => (
          <span key={k} className={`dss-form-item dss-form-item--${e.toLowerCase()}`} />
        ))}
      </span>
      <span className="dss-sr-only">{formLabel(form)}</span>
    </span>
  );
}
