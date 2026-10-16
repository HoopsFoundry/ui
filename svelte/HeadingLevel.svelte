<script lang="ts">
  /**
   * HoopsFoundry UI HeadingLevel · Svelte 5
   * --------------------------------------------------------------
   * Gibt den Komponentenüberschriften im Inhalt eine Ebene vor (nur h2 bis h6, nie h1). Ein `titleAs` an der Komponente
   * gewinnt. `level` ist absolut, `by` relativ zum übergeordneten HeadingLevel (Standard 1; ohne Vorfahr zählt die
   * Ausgangsebene 2, `by={1}` ergibt also h3). Ändert nur die Ebene im Dokument, nicht die Größe. Kein eigener Scoped-Style.
   */
  import type { Snippet } from 'svelte';
  import { headingLevel, nextLevel, type HeadingLevelInput } from '../js/heading.js';
  import { parentHeadingContext, provideHeadingLevel } from './heading-context.js';

  let {
    level = undefined,
    by = 1,
    children,
  }: {
    /** Absolute Ebene (2 bis 6, auch als Zeichenkette `"4"`) für die Überschriften der Komponenten darunter. Gewinnt gegen `by`. */
    level?: HeadingLevelInput;
    /** Relativ zum übergeordneten HeadingLevel (Standard 1). */
    by?: number;
    children?: Snippet;
  } = $props();

  // Den Vorfahren-Kontext behalten und `parent?.level` erst im Getter lesen: so folgt `by` einem Wechsel des äußeren `level`
  const parent = parentHeadingContext();
  provideHeadingLevel(() => (level !== undefined ? headingLevel(level) : nextLevel(parent?.level, by)));
</script>

{@render children?.()}
