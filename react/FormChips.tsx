import { formEntries, formLabel, outcomeLetter } from '../js/league.js';
import type { LeagueFormEntry } from '../js/league.js';
import { cn } from './cn';
import { useT } from './i18n';
import type { CatalogValue } from '../js/i18n/index.js';

export interface FormChipsProps {
  /** Ergebnisse, neueste zuletzt: `S` Sieg, `N` Niederlage, `U` Unentschieden. Angezeigt werden höchstens die letzten fünf. */
  form: LeagueFormEntry[];
  /** `dots` (Standard): Punkte, Quadrat, Ring. `letters`: Marken mit S, N, U. */
  variant?: 'dots' | 'letters';
  /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters (`HoopsProvider`) und `setTexts`. */
  texts?: Record<string, CatalogValue>;
  className?: string;
}

/**
 * Form (letzte Spiele): Zeichen sind `aria-hidden`, der Screenreader-Text kommt aus `formLabel`. Dieselbe Darstellung wie die
 * Spalte „Form“ der LeagueCard; ohne gültigen Eintrag erscheint nichts.
 */
export function FormChips({ form, variant = 'dots', texts, className }: FormChipsProps) {
  const i18n = useT(texts);
  const entries = formEntries(form);
  if (!entries.length) return null;
  return (
    <span className={cn('hoops-form', variant === 'letters' && 'hoops-form--letters', className)} lang={i18n.lang}>
      <span className="hoops-form-list" aria-hidden="true">
        {entries.map((e, k) => (
          <span key={k} className={`hoops-form-item hoops-form-item--${e.toLowerCase()}`} data-letter={variant === 'letters' ? outcomeLetter(e, i18n.options) : undefined} />
        ))}
      </span>
      <span className="hoops-sr-only">{formLabel(form, i18n.options)}</span>
    </span>
  );
}
