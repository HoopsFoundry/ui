<script lang="ts">
  /**
   * HoopsFoundry UI FormChips (Form: letzte Spiele) · Svelte 5
   * --------------------------------------------------------------
   * Die letzten Spiele einer Mannschaft als Reihe kleiner Zeichen: Sieg (gefüllter Punkt), Niederlage (Quadrat), Unentschieden (Ring),
   * mit `variant="letters"` als Marken mit S, N, U. Die Zeichen sind `aria-hidden`; der Screenreader-Text kommt aus `formLabel`
   * („Form: Sieg, Sieg, Niederlage“, js/league.js). Zeigt höchstens die letzten fünf Einträge; ohne gültigen Eintrag erscheint nichts.
   * Dieselbe Darstellung nutzt die Spalte „Form“ der LeagueCard. Nutzt nur Klassen aus css/components.css (`hoops-form*`).
   */
  import { formEntries, formLabel } from '../js/league.js';
  import { outcomeLetter } from '../js/league.js';
  import type { LeagueFormEntry } from '../js/league.js';
  import { useI18n } from './i18n.js';
  import type { CatalogValue } from '../js/i18n/index.js';

  let {
    form,
    variant = 'dots',
    texts = undefined,
    class: klass = '',
  }: {
    /** Ergebnisse, neueste zuletzt: `S` Sieg, `N` Niederlage, `U` Unentschieden. */
    form: LeagueFormEntry[];
    /** `dots` (Standard): Punkte, Quadrat, Ring. `letters`: Marken mit S, N, U. */
    variant?: 'dots' | 'letters';
    /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters und `setTexts`. */
    texts?: Record<string, CatalogValue>;
    class?: string;
  } = $props();

  const i18n = useI18n(() => texts);
  const entries = $derived(formEntries(form));
  const label = $derived(formLabel(form, i18n.options));
</script>

{#if entries.length}<span class={`hoops-form${variant === 'letters' ? ' hoops-form--letters' : ''}${klass ? ` ${klass}` : ''}`} lang={i18n.lang}><span class="hoops-form-list" aria-hidden="true">{#each entries as e, k (k)}<span class={`hoops-form-item hoops-form-item--${e.toLowerCase()}`} data-letter={variant === 'letters' ? outcomeLetter(e, i18n.options) : undefined}></span>{/each}</span><span class="hoops-sr-only">{label}</span></span>{/if}
