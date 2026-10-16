<script lang="ts">
  /**
   * HoopsFoundry UI LeagueCard (Ligencard) · Svelte 5
   * --------------------------------------------------------------
   * Mini-Tabelle einer Liga in einer Karte: Titel, Untertitel („12 Teams · 15 von 132 Spielen gespielt“), Tabelle mit
   * Platz, Mannschaft, SP und PKT (optional S, N, Diff, Form) und ein Link zur kompletten Tabelle. Zeigt einen Ausschnitt:
   * mit eigener Mannschaft (`own: true`) zwei davor, die eigene und eine dahinter, sonst die ersten `limit`
   * (Regeln: js/league.js). Nutzt nur Klassen aus css/components.css (`hoops-league*`, `hoops-tbl`).
   *
   *   standard — Zeilen 60 px, mit Untertitel
   *   compact  — Zeilen 40 px, ohne Untertitel, kleinerer Titel (für Seitenleisten)
   *
   * `names`/`logos` wie bei Spielplan und Karten (Kurzname bis 640 px automatisch). Auf dem Handy (bis 640 px) entfallen S, N, Diff und Form.
   */
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  import CollapsibleFrame from './internal/CollapsibleFrame.svelte';
  import FormChips from './FormChips.svelte';
  import { initials, shortName } from '../js/schedule.js';
  import {
    cellNumber,
    diffSign,
    diffText,
    leagueSummary,
    leagueWindow,
    liveInfo,
    rankText,
    teamTotal,
    windowLabel,
    zoneInfo,
    zoneLegend,
  } from '../js/league.js';
  import type { LeagueColumn, LeagueTeam } from '../js/league.js';

  let {
    title,
    teams,
    teamCount = undefined,
    played = undefined,
    total = undefined,
    columns = [],
    limit = 3,
    href = undefined,
    linkLabel = 'Komplette Tabelle und Spielplan',
    live = false,
    names = 'full',
    logos = false,
    size = 'standard',
    titleAs = undefined,
    collapsible = false,
    open = $bindable(false),
    id = undefined,
    class: klass = '',
  }: {
    /** Name der Liga, z. B. „Oberliga Nordhain Männer“. */
    title: string;
    teams: LeagueTeam[];
    /** Teams der ganzen Liga, wenn `teams` nur einen Teil enthält. */
    teamCount?: number;
    /** Gespielte und alle Spiele der Saison. */
    played?: number;
    total?: number;
    /** Zusätzliche Spalten: `won`, `lost`, `diff`, `form`. */
    columns?: LeagueColumn[];
    /** Zeilen ohne eigene Mannschaft (Standard 3). */
    limit?: number;
    /** Ziel des Links unter der Tabelle; ohne `href` entfällt der Link. */
    href?: string;
    linkLabel?: string;
    /** Laufende Spiele: Zahl oder `true` (nur „Live“). */
    live?: number | boolean;
    names?: 'full' | 'short';
    logos?: boolean;
    size?: 'standard' | 'compact';
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    /** Einklappbar: Kopf (Titel, Untertitel, Live) wird zum Bereichskopf (Button in der Überschrift), die Tabelle zum Bereich. */
    collapsible?: boolean;
    /** Geöffnet, mit `bind:open` gebunden (nur mit `collapsible`; Standard geschlossen). */
    open?: boolean;
    /** Anker für Deep-Link und Sprungleiste einer `Accordion`-Gruppe (nur mit `collapsible`); ohne `id` gibt es keinen. */
    id?: string;
    class?: string;
  } = $props();

  const heading = useHeadingTag(() => titleAs);
  // Nur in der Entwicklung (`$inspect` entfällt im Produktionsbuild)
  $inspect(collapsible && !title).with((_type, missing) => {
    if (missing) console.warn('[HoopsFoundry UI] LeagueCard: `collapsible` braucht einen `title`, sonst bleibt die Karte unverändert.');
  });

  const rows = $derived(leagueWindow(teams, { limit }));
  const count = $derived(teamTotal(teamCount, teams));
  const summary = $derived(size === 'compact' ? '' : leagueSummary({ teamCount: count, played, total }));
  const caption = $derived([title, windowLabel(rows, count)].filter(Boolean).join(', '));
  const legend = $derived(zoneLegend(rows));
  const liveTag = $derived(liveInfo(live));
  const wantsWon = $derived(columns.includes('won'));
  const wantsLost = $derived(columns.includes('lost'));
  const wantsDiff = $derived(columns.includes('diff'));
  const wantsForm = $derived(columns.includes('form'));
</script>

{#snippet nameText(t: LeagueTeam)}
  {@const kurz = shortName(t)}
  {#if kurz}<span class="hoops-team-name" class:hoops-team-name--short={names === 'short'}><span class="hoops-name-full">{t.name}</span><span class="hoops-name-short" aria-hidden="true" title={t.name}>{kurz}</span></span>{:else}{t.name}{/if}
{/snippet}

{#snippet liveMeta()}
  <span class="hoops-league-live"><span class="hoops-live"><span class="hoops-live-dot" aria-hidden="true"></span>Live</span>{#if liveTag?.text}<span class="hoops-league-live-n">{liveTag.text}</span>{/if}</span>
{/snippet}

{#snippet panel()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen den scrollbaren Bereich erreichen (WCAG 2.1.1) -->
  <div class="hoops-table-scroll hoops-league-scroll" role="region" tabindex="0" aria-label={title ? `Tabelle: ${title}` : 'Tabelle'}>
    <table class={`hoops-tbl hoops-tbl--${size === 'compact' ? 'compact' : 'touch'} hoops-league-tbl`}>
      {#if caption}<caption class="hoops-sr-only">{caption}</caption>{/if}
      <thead>
        <tr>
          <th scope="col" class="hoops-league-rank"><span aria-hidden="true">#</span><span class="hoops-sr-only">Platz</span></th>
          <th scope="col">Mannschaft</th>
          <th scope="col" class="num"><span aria-hidden="true">SP</span><span class="hoops-sr-only">Spiele</span></th>
          {#if wantsWon}<th scope="col" class="num hoops-league-opt"><span aria-hidden="true">S</span><span class="hoops-sr-only">Siege</span></th>{/if}
          {#if wantsLost}<th scope="col" class="num hoops-league-opt"><span aria-hidden="true">N</span><span class="hoops-sr-only">Niederlagen</span></th>{/if}
          {#if wantsDiff}<th scope="col" class="num hoops-league-opt"><span aria-hidden="true">Diff</span><span class="hoops-sr-only">Korbdifferenz</span></th>{/if}
          <th scope="col" class="num hoops-league-pts"><span aria-hidden="true">PKT</span><span class="hoops-sr-only">Punkte</span></th>
          {#if wantsForm}<th scope="col" class="hoops-league-opt">Form</th>{/if}
        </tr>
      </thead>
      <tbody>
        {#each rows as t, i (i)}
          {@const zone = zoneInfo(t.zone)}
          {@const sign = diffSign(t.diff)}
          <tr class={`${t.own ? 'is-own' : ''}${zone ? ` hoops-league-zone hoops-league-zone--${zone.zone}` : ''}`.trim() || undefined}>
            <td class="hoops-league-rank">{rankText(t.rank)}</td>
            <td class="hoops-league-team">
              <span class="hoops-league-who">
                {#if logos}<span class="hoops-team-logo" class:hoops-team-logo--initials={!t.logo} aria-hidden="true">{#if t.logo}<img src={t.logo} alt="" loading="lazy" />{:else}{initials(t.name, 2)}{/if}</span>{/if}
                {#if t.href}<a class="hoops-link hoops-league-link" href={t.href}>{@render nameText(t)}</a>{:else}{@render nameText(t)}{/if}
                {#if t.own}<span class="hoops-sr-only">, eigene Mannschaft</span>{/if}
                {#if zone}<span class="hoops-sr-only">, {zone.row}</span>{/if}
              </span>
            </td>
            <td class="num">{cellNumber(t.played)}</td>
            {#if wantsWon}<td class="num hoops-league-opt">{cellNumber(t.won)}</td>{/if}
            {#if wantsLost}<td class="num hoops-league-opt">{cellNumber(t.lost)}</td>{/if}
            {#if wantsDiff}<td class={`num hoops-league-opt${sign ? ` ${sign}` : ''}`}>{diffText(t.diff)}</td>{/if}
            <td class="num lead hoops-league-pts">{cellNumber(t.points)}</td>
            {#if wantsForm}
              <td class="hoops-league-opt">
                <FormChips form={t.form ?? []} />
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if legend.length}
    <ul class="hoops-league-legend" aria-label="Legende">
      {#each legend as z (z.zone)}<li><span class={`hoops-league-key hoops-league-key--${z.zone}`} aria-hidden="true"></span>{z.legend}</li>{/each}
    </ul>
  {/if}

  {#if href}
    <div class="hoops-league-foot"><a class="hoops-link hoops-league-more" {href}>{linkLabel}<span class="hoops-sr-only">, {title}</span></a></div>
  {/if}
{/snippet}

{#if collapsible && title}
  <CollapsibleFrame kind="league" rootClass={`hoops-league${size === 'compact' ? ' hoops-league--compact' : ''}${klass ? ` ${klass}` : ''}`} {id} {title} sub={summary} {titleAs} bind:open meta={liveTag ? liveMeta : undefined}>
    {@render panel()}
  </CollapsibleFrame>
{:else}
<div class={`hoops-league${size === 'compact' ? ' hoops-league--compact' : ''}${klass ? ` ${klass}` : ''}`}>
  <div class="hoops-league-head">
    <div class="hoops-league-heading">
      <svelte:element this={heading.tag} class="hoops-league-title">{title}</svelte:element>
      {#if summary}<p class="hoops-league-sub">{summary}</p>{/if}
    </div>
    {#if liveTag}
      <span class="hoops-league-live"><span class="hoops-live"><span class="hoops-live-dot" aria-hidden="true"></span>Live</span>{#if liveTag.text}<span class="hoops-league-live-n">{liveTag.text}</span>{/if}</span>
    {/if}
  </div>

  {@render panel()}
</div>
{/if}
