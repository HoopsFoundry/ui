<script lang="ts">
  /**
   * DSS FormChips (Form: letzte Spiele) · Svelte 5
   * --------------------------------------------------------------
   * Die letzten Spiele einer Mannschaft als Reihe kleiner Zeichen: Sieg (gefüllter Punkt), Niederlage (Quadrat), Unentschieden (Ring),
   * mit `variant="letters"` als Marken mit S, N, U. Die Zeichen sind `aria-hidden`; der Screenreader-Text kommt aus `formLabel`
   * („Form: Sieg, Sieg, Niederlage“, js/league.js). Zeigt höchstens die letzten fünf Einträge; ohne gültigen Eintrag erscheint nichts.
   * Dieselbe Darstellung nutzt die Spalte „Form“ der LeagueCard. Nutzt nur Klassen aus css/components.css (`dss-form*`).
   */
  import { formEntries, formLabel } from '../js/league.js';
  import type { LeagueFormEntry } from '../js/league.js';

  let {
    form,
    variant = 'dots',
    class: klass = '',
  }: {
    /** Ergebnisse, neueste zuletzt: `S` Sieg, `N` Niederlage, `U` Unentschieden. */
    form: LeagueFormEntry[];
    /** `dots` (Standard): Punkte, Quadrat, Ring. `letters`: Marken mit S, N, U. */
    variant?: 'dots' | 'letters';
    class?: string;
  } = $props();

  const entries = $derived(formEntries(form));
  const label = $derived(formLabel(form));
</script>

{#if entries.length}<span class={`dss-form${variant === 'letters' ? ' dss-form--letters' : ''}${klass ? ` ${klass}` : ''}`}><span class="dss-form-list" aria-hidden="true">{#each entries as e, k (k)}<span class={`dss-form-item dss-form-item--${e.toLowerCase()}`}></span>{/each}</span><span class="dss-sr-only">{label}</span></span>{/if}
