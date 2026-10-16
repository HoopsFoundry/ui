<script lang="ts">
  /**
   * HoopsFoundry UI MatchCard · Svelte 5
   * --------------------------------------------------------------
   * Drei Spielzustände, eine Kartengrammatik. Nutzt nur Klassen aus css/components.css.
   *
   *   scheduled — Datum/Uhrzeit, Halle, Teams
   *   live      — Spielstand, Spielabschnitt + Uhr, Puls
   *   finished  — Endstand, Sieger/Verlierer
   *
   * Mit `href` ist die Karte ein Link, mit `onclick` ein Button, sonst ein div.
   *
   * `names`: "full" (Standard) oder "short" (Kurzname, falls vorhanden); bis 640 px Breite erscheint
   * der Kurzname automatisch (CSS, Viewport-Regel). `logos`: Logo bzw. Initialen vor dem Namen (Standard aus).
   *
   * Spielabschnitt (nur live): `period` (ab 1) mit `periods` (4 Viertel, Standard, oder 8 Achtel) ergibt „3. Viertel“,
   * „5. Achtel“, „Verlängerung“ (js/periods.js). `quarter` ist veraltet und bleibt als Alias: Ohne `period` wird der
   * Text unverändert angezeigt.
   */
  import { initials, shortName } from '../js/schedule.js';
  import { resolvePeriod } from '../js/periods.js';
  type State = 'scheduled' | 'live' | 'finished';
  type Team = { name: string; short?: string; logo?: string; color?: 'heim' | 'gast'; score?: number };
  type Names = 'full' | 'short';

  let {
    state = 'scheduled',
    league = '',
    matchday = '',
    date = '',
    time = '',
    venue = '',
    heim,
    gast,
    names = 'full',
    logos = false,
    period = undefined,
    periods = 4,
    quarter = '',
    clock = '',
    href = undefined,
    onclick = undefined,
  }: {
    state?: State;
    league?: string;
    matchday?: string;
    date?: string;
    time?: string;
    venue?: string;
    heim: Team;
    gast: Team;
    names?: Names;
    logos?: boolean;
    period?: number;
    periods?: 4 | 8;
    /** @deprecated Stattdessen `period`; ohne `period` wird der Text unverändert angezeigt. */
    quarter?: string;
    clock?: string;
    href?: string;
    onclick?: () => void;
  } = $props();

  let heimWin = $derived(state === 'finished' && (heim.score ?? 0) > (gast.score ?? 0));
  let gastWin = $derived(state === 'finished' && (gast.score ?? 0) > (heim.score ?? 0));
  const tag = $derived(href ? 'a' : onclick ? 'button' : 'div');
  const liveText = $derived([resolvePeriod({ period, periods, quarter }).label, clock].filter(Boolean).join(' '));
</script>

{#snippet teamBlock(t: Team)}
  {#if logos}<span class="hoops-team-logo" class:hoops-team-logo--initials={!t.logo} aria-hidden="true">{#if t.logo}<img src={t.logo} alt="" loading="lazy" />{:else}{initials(t.name, 2)}{/if}</span>{/if}
  {#if shortName(t)}<span class="hoops-match-name hoops-team-name" class:hoops-team-name--short={names === 'short'}><span class="hoops-name-full">{t.name}</span><span class="hoops-name-short" aria-hidden="true" title={t.name}>{shortName(t)}</span></span>{:else}<span class="hoops-match-name">{t.name}</span>{/if}
{/snippet}

<!-- Der Handler hängt nur an <a>/<button> (nie am <div>); Svelte kann das bei svelte:element nicht erkennen. -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<svelte:element
  this={tag}
  class={`hoops-match hoops-match--${state}${logos ? ' hoops-match--logos' : ''}`}
  href={tag === 'a' ? href : undefined}
  type={tag === 'button' ? 'button' : undefined}
  onclick={tag === 'div' ? undefined : onclick}
>
  <span class="hoops-match-head">
    <span class="hoops-match-league">
      {#if league}<span>{league}</span>{/if}
      {#if matchday}<span class="hoops-match-muted">· {matchday}</span>{/if}
    </span>
    {#if state === 'live'}
      <span class="hoops-match-live"><span class="hoops-match-pulse" aria-hidden="true"></span> Live · {liveText}</span>
    {:else if state === 'finished'}
      <span class="hoops-match-final">Endstand</span>
    {:else if date}
      <span class="hoops-match-when">{date}{time ? ` · ${time}` : ''}</span>
    {/if}
  </span>

  <span class="hoops-match-body">
    <span class={`hoops-match-team ${gastWin ? 'is-loser' : ''}`}>
      <span class="hoops-match-dot" aria-hidden="true"></span>
      {@render teamBlock(heim)}
      {#if state !== 'scheduled' && heim.score !== undefined}<span class="hoops-match-score">{heim.score}</span>{/if}
    </span>
    <span class={`hoops-match-team hoops-match-team--gast ${heimWin ? 'is-loser' : ''}`}>
      <span class="hoops-match-dot" aria-hidden="true"></span>
      {@render teamBlock(gast)}
      {#if state !== 'scheduled' && gast.score !== undefined}<span class="hoops-match-score">{gast.score}</span>{/if}
    </span>
  </span>

  {#if venue}
    <span class="hoops-match-foot"><span>{venue}</span></span>
  {/if}
</svelte:element>
