<script lang="ts" module>
  export type PbpEvent = {
    id: string | number;
    time: string; // "M:SS"
    /** Spielabschnitt ab 1 (mit `periods`): Chip „V1“ bis „V4“ bzw. „A1“ bis „A8“, „VL“ für die Verlängerung. */
    period?: number;
    /** @deprecated Stattdessen `period`; ohne `period` wird der Text unverändert angezeigt. */
    quarter?: string; // freier Text, z. B. "Q1" .. "OT"
    team?: 'heim' | 'gast' | 'none';
    kind?: 'default' | 'score-2p' | 'score-3p' | 'ft' | 'foul' | 'timeout' | 'sub' | 'turnover';
    title: string;
    titleBold?: string;
    detail?: string;
    score?: { heim: number; gast: number };
  };
</script>

<script lang="ts">
  import { resolvePeriod } from '../js/periods.js';
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  /**
   * HoopsFoundry UI PlayByPlay · Svelte 5
   * --------------------------------------------------------------
   * Live-Scoring-Ereignisstrom, chronologisch. Je Ereignis: Zeit (M:SS + Spielabschnitt),
   * 4 px Teamstreifen, Aktion (+ Detail), kumulierter Spielstand. Nutzt nur Klassen
   * aus css/components.css. Der Feed ist ein `role="log"` und per Tastatur scrollbar.
   *
   * Spielabschnitt: `period` je Ereignis und `periods` (4 Viertel, Standard, oder 8 Achtel) an der Komponente; der Chip
   * zeigt die Kurzform (V3, A5, VL), Screenreader lesen den vollen Text („3. Viertel“). `quarter` ist veraltet (Alias).
   *
   * Ereignisarten: default · score-2p · score-3p · ft · foul · timeout · sub · turnover
   */
  let {
    title = 'Play-by-Play · neueste oben',
    titleAs = undefined,
    meta = '',
    live = true,
    dark = false,
    periods = 4,
    events,
  }: {
    title?: string;
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    meta?: string;
    live?: boolean;
    dark?: boolean;
    periods?: 4 | 8;
    events: PbpEvent[];
  } = $props();

  const heading = useHeadingTag(() => titleAs);

  const teamText = { heim: 'Heim:', gast: 'Gast:' } as const;
</script>

<div class={`hoops-pbp-frame ${dark ? 'hoops-pbp-frame--dark' : ''}`}>
  <div class="hoops-pbp-head">
    <svelte:element this={heading.tag} class="hoops-pbp-title">{title}</svelte:element>
    <div class="hoops-pbp-meta">
      {#if meta}<span>{meta}</span>{/if}
      {#if live}<span class="hoops-pbp-live"><span class="hoops-pbp-dot" aria-hidden="true"></span> Live</span>{/if}
    </div>
  </div>

  <div class="hoops-pbp-feed" role="log" aria-label={title} tabindex="0">
    {#each events as e (e.id)}
      {@const abschnitt = resolvePeriod({ period: e.period, periods, quarter: e.quarter })}
      <div class={`hoops-pbp-event hoops-pbp-event--${e.kind ?? 'default'}`}>
        <div class="hoops-pbp-time">
          {e.time}
          {#if abschnitt.short}
            <span class="hoops-pbp-q">{#if abschnitt.alias}{abschnitt.label}{:else}<span aria-hidden="true">{abschnitt.short}</span><span class="hoops-sr-only">{abschnitt.label}</span>{/if}</span>
          {/if}
        </div>
        <div class={`hoops-pbp-strip hoops-pbp-strip--${e.team ?? 'none'}`} aria-hidden="true"></div>
        <div class="hoops-pbp-body">
          <div class="hoops-pbp-action">
            {#if e.team && e.team !== 'none'}<span class="hoops-sr-only">{teamText[e.team]} </span>{/if}
            {#if e.titleBold}<b>{e.titleBold}</b> · {/if}{e.title}
          </div>
          {#if e.detail}
            <div class="hoops-pbp-detail">{e.detail}</div>
          {/if}
        </div>
        {#if e.score}
          <div class="hoops-pbp-score"><span aria-hidden="true">{e.score.heim}<span class="hoops-pbp-sep">:</span>{e.score.gast}</span><span class="hoops-sr-only">{`Spielstand ${e.score.heim} zu ${e.score.gast}`}</span></div>
        {/if}
      </div>
    {/each}
  </div>
</div>
