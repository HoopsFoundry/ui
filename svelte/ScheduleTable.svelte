<script lang="ts">
  /**
   * HoopsFoundry UI ScheduleTable · Svelte 5
   * --------------------------------------------------------------
   * Spielplan als Tabelle: Gegenüberstellung (versus), Perspektive einer
   * Mannschaft (opponent) oder Turnier-Spalten (columns). Nutzt
   * ausschließlich die Klassen aus css/components.css (kein eigener
   * Scoped-Style); gleiche Struktur wie die React-Fassung.
   *
   * Snippets: `time` (ersetzt die Uhrzeit) und `notice` (zusätzliche Zelle am
   * Zeilenende), jeweils mit dem Spiel als Argument. `title` und `meta` sind
   * reine Strings; `titleAs` ('h2' bis 'h6', Standard h3 bzw. Ebene aus HeadingLevel) wählt die
   * Überschriftenebene; `renderLink` gibt es in Svelte nicht (Links als einfache <a>).
   *
   * `names`: "full" (Standard) oder "short" (Kurzname, falls vorhanden); bis 640 px Breite
   * erscheint der Kurzname automatisch (CSS). `logos`: Logo/Initialen vor dem Teamnamen;
   * Standard aus, im Layout `opponent` an (wie bisher), solange nicht ausdrücklich `false`.
   */
  import type { Snippet } from 'svelte';
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  import CollapsibleFrame from './internal/CollapsibleFrame.svelte';
  import { useI18n } from './i18n.js';
  import { outcomeLetter } from '../js/league.js';
  import type { CatalogValue } from '../js/i18n/index.js';
  import {
    ariaForResult,
    columnsFor,
    densityFor,
    groupBySection,
    hasScore,
    initials,
    layoutFor,
    resolveOutcome,
    shortName,
    stateLabel,
    winnerSide,
  } from '../js/schedule.js';
  import type { ScheduleDensity, ScheduleGame, ScheduleLayout, ScheduleNames, ScheduleTeam } from '../js/schedule.js';

  let {
    games,
    layout = undefined,
    density = undefined,
    names = 'full',
    logos = undefined,
    title = '',
    titleAs = undefined,
    meta = '',
    caption = '',
    collapsible = false,
    open = $bindable(false),
    id = undefined,
    texts = undefined,
    class: klass = '',
    time = undefined,
    notice = undefined,
  }: {
    games: ScheduleGame[];
    layout?: ScheduleLayout;
    density?: ScheduleDensity;
    names?: ScheduleNames;
    logos?: boolean;
    title?: string;
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    meta?: string;
    caption?: string;
    /** Einklappbar: der Rahmenkopf wird zum Bereichskopf (Button in der Überschrift), die Tabelle zum Bereich. Braucht einen `title`. */
    collapsible?: boolean;
    /** Geöffnet, mit `bind:open` gebunden (nur mit `collapsible`; Standard geschlossen). */
    open?: boolean;
    /** Anker für Deep-Link und Sprungleiste einer `Accordion`-Gruppe (nur mit `collapsible`); ohne `id` gibt es keinen. */
    id?: string;
    /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters und `setTexts`. */
    texts?: Record<string, CatalogValue>;
    class?: string;
    time?: Snippet<[ScheduleGame]>;
    notice?: Snippet<[ScheduleGame]>;
  } = $props();

  const heading = useHeadingTag(() => titleAs);
  const i18n = useI18n(() => texts);
  // Nur in der Entwicklung (`$inspect` entfällt im Produktionsbuild)
  $inspect(collapsible && !title).with((_type, missing) => {
    if (missing) console.warn('[HoopsFoundry UI] ScheduleTable: `collapsible` braucht einen `title`, sonst bleibt der Rahmen unverändert.');
  });

  const mode = $derived<ScheduleLayout>(layout ?? layoutFor(games));
  const dens = $derived<ScheduleDensity>(density ?? densityFor(games, mode));
  const cols = $derived(columnsFor(mode, games, Boolean(notice), i18n.options));
  const groups = $derived(groupBySection(games));
  const showOppLogo = $derived(logos !== false);
  const OUTCOME_CHIP = { S: 'hoops-chip--ok', N: 'hoops-chip--err', U: '' } as const;
</script>

<!-- team-Snippet: synchron halten mit ScheduleTable/ScheduleGrid -->
{#snippet teamName(t: ScheduleTeam)}
  {@const short = shortName(t)}
  {#if short}<span class="hoops-team-name" class:hoops-team-name--short={names === 'short'}><span class="hoops-name-full">{t.name}</span><span class="hoops-name-short" aria-hidden="true" title={t.name}>{short}</span></span>{:else}{t.name}{/if}
{/snippet}

{#snippet team(t: ScheduleTeam | undefined, loser: boolean, withLogo: boolean)}
  {@const current = t ?? { name: '?' }}
  {@const logo = withLogo && t !== undefined && !t.placeholder}
  <span class="hoops-sch-team" class:is-loser={loser} class:hoops-sch-team--logo={logo}>
    {#if logo}<span class="hoops-team-logo" class:hoops-team-logo--initials={!current.logo} aria-hidden="true">{#if current.logo}<img src={current.logo} alt="" loading="lazy" />{:else}{initials(current.name, 2)}{/if}</span>{/if}
    {#if current.href && !current.placeholder}
      <a class="hoops-link" href={current.href}>{@render teamName(current)}</a>
    {:else if current.placeholder}
      <span class="hoops-sch-ph">{@render teamName(current)}</span>
    {:else}
      {@render teamName(current)}
    {/if}
  </span>
{/snippet}

{#snippet noteText(game: ScheduleGame)}
  {#if game.note}<span class="hoops-sch-note">{game.note}</span>{/if}
{/snippet}

{#snippet row(game: ScheduleGame)}
  {@const own = game.heim?.own || game.gast?.own}
  {@const winner = winnerSide(game)}
  {#if game.state === 'bye'}
    <!-- Die expliziten role-Attribute sind Absicht: Sie erhalten die Tabellensemantik, wenn das Mobil-CSS
         display: block/grid setzt. Nicht entfernen, um die Svelte-Warnung zu unterdrücken. -->
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <tr role="row" class="hoops-sch-row is-bye">
      <td role="cell" class="hoops-sch-bye" colspan={cols.length}>
        {#if game.time}<span class="hoops-sch-time">{game.time} · </span>{/if}
        {#if game.heim}{@const parts = i18n.sentence('schedule.bye', 'team')}{#each parts as part, index}{#if index > 0}{@render team(game.heim, false, logos === true)}{/if}{part}{/each}{:else}{game.note || i18n.t('schedule.bye-none')}{/if}
      </td>
    </tr>
  {:else}
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <tr
      role="row"
      class="hoops-sch-row"
      class:is-own={own && mode !== 'opponent'}
      class:is-live={game.state === 'live'}
      class:is-cancelled={game.state === 'cancelled'}
      class:is-postponed={game.state === 'postponed'}
    >
      {#each cols as col (col.key)}
        {#if col.key === 'nr'}
          <td role="cell" class="hoops-sch-nr">{game.nr}</td>
        {:else if col.key === 'when'}
          <td role="cell" class="hoops-sch-when">
            {#if game.date}<span class="hoops-sch-date">{game.date}</span>{/if}
            {#if time || game.time}<span class="hoops-sch-time">{#if time}{@render time(game)}{:else}{game.time}{/if}</span>{/if}
            {#if stateLabel(game.state, i18n.options)}<span class="hoops-sr-only">{` ${stateLabel(game.state, i18n.options)}`}</span>{/if}
            {#if game.state === 'live'}
              <span class="hoops-match-live hoops-sch-live"><span class="hoops-match-pulse" aria-hidden="true"></span> {i18n.t('common.live')}</span>
            {/if}
            {#if mode !== 'columns' && game.venue}<span class="hoops-sch-venue">{game.venue}</span>{/if}
          </td>
        {:else if col.key === 'ha'}
          <td role="cell" class="hoops-sch-ha">
            <span class="hoops-chip hoops-chip--mono {game.at === 'gast' ? 'hoops-chip--amber' : 'hoops-chip--sky'}">{i18n.t(game.at === 'gast' ? 'schedule.chip.away' : 'schedule.chip.home')}</span>
          </td>
        {:else if col.key === 'match'}
          <td role="cell" class="hoops-sch-match">
            {#if mode === 'opponent' && game.opponent}
              <span class="hoops-sch-opp">
                {#if showOppLogo}
                  <span class="hoops-sch-logo" aria-hidden="true">
                    {#if game.opponent.logo}<img src={game.opponent.logo} alt="" loading="lazy" />{:else}{initials(game.opponent.name)}{/if}
                  </span>
                {/if}
                {@render team(game.opponent, false, false)}
              </span>
            {:else}
              {@render team(game.heim, winner === 'gast', logos === true)}
              <span class="hoops-sch-sep" aria-hidden="true"> – </span>
              <span class="hoops-sr-only"> {i18n.t('schedule.versus')} </span>
              {@render team(game.gast, winner === 'heim', logos === true)}
            {/if}
            {#if game.league}
              <span class="hoops-sch-sub">
                {#if game.league.href}<a class="hoops-link" href={game.league.href}>{game.league.name}</a>{:else}{game.league.name}{/if}
              </span>
            {/if}
            {@render noteText(game)}
          </td>
        {:else if col.key === 'heim'}
          <td role="cell" class="hoops-sch-heim">{@render team(game.heim, winner === 'gast', logos === true)}</td>
        {:else if col.key === 'gast'}
          <td role="cell" class="hoops-sch-gast">{@render team(game.gast, winner === 'heim', logos === true)}{@render noteText(game)}</td>
        {:else if col.key === 'field'}
          <td role="cell" class="hoops-sch-field-cell">
            {#if game.field}<span class="hoops-chip hoops-chip--mono hoops-sch-field" title={game.field}>{game.field}</span>{/if}
          </td>
        {:else if col.key === 'venue'}
          <td role="cell" class="hoops-sch-venue-cell">{game.venue}</td>
        {:else if col.key === 'res'}
          {@const scored = (game.state === 'finished' || game.state === 'live') && hasScore(game, mode)}
          {@const result = mode === 'opponent' ? resolveOutcome(game) : undefined}
          <td role="cell" class="hoops-sch-res">
            {#if !scored}
              <span class="hoops-sch-none">–</span>
            {:else}
              <span class="hoops-sch-resbox">
                {#if result}<span class="hoops-chip hoops-chip--mono {OUTCOME_CHIP[result]}" aria-hidden="true">{outcomeLetter(result, i18n.options)}</span>{/if}
                <span class="hoops-sch-score" aria-hidden="true">{mode === 'opponent' && game.opponent ? `${game.ownScore} : ${game.opponent.score}` : `${game.heim?.score} : ${game.gast?.score}`}</span>
                <span class="hoops-sr-only">{ariaForResult(game, mode, i18n.options)}</span>
                {#if game.provisional}<small class="hoops-sch-prov" aria-hidden="true">{i18n.t('schedule.provisional')}</small>{/if}
              </span>
            {/if}
          </td>
        {:else if col.key === 'notice'}
          <td role="cell" class="hoops-sch-notice">{#if notice}{@render notice(game)}{/if}</td>
        {/if}
      {/each}
    </tr>
  {/if}
{/snippet}

{#snippet frameMeta()}
  <span class="hoops-frame-meta"><span>{meta}</span></span>
{/snippet}

{#snippet tableRegion()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen den scrollbaren Bereich erreichen (WCAG 2.1.1) -->
  <div class="hoops-table-scroll" role="region" tabindex="0" aria-label={caption || title || i18n.t('schedule.table-label')}>
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <table role="table" class="hoops-tbl hoops-tbl--schedule hoops-tbl--{dens} hoops-sch--{mode}">
      {#if caption}<caption class="hoops-sr-only">{caption}</caption>{/if}
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <thead role="rowgroup" class:hoops-sr-only={mode !== 'columns'}>
        <!-- svelte-ignore a11y_no_redundant_roles -->
        <tr role="row">
          {#each cols as col (col.key)}
            <th scope="col" role="columnheader">{col.label}</th>
          {/each}
        </tr>
      </thead>
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <tbody role="rowgroup">
        {#each groups as group, index (`${group.section ?? 'ohne'}-${index}`)}
          {#if group.section}
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <tr role="row" class="hoops-sch-group"><th scope="colgroup" colspan={cols.length}>{group.section}</th></tr>
          {/if}
          {#each group.games as game (game.id)}
            {@render row(game)}
          {/each}
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

{#if collapsible && title}
  <CollapsibleFrame rootClass="hoops-frame {klass}" {id} {title} {titleAs} bind:open meta={meta ? frameMeta : undefined} lang={i18n.lang}>
    {@render tableRegion()}
  </CollapsibleFrame>
{:else}
  <div class="hoops-frame {klass}" lang={i18n.lang}>
    {#if title || meta}
      <div class="hoops-frame-head">
        {#if title}<svelte:element this={heading.tag} class="hoops-frame-title">{title}</svelte:element>{:else}<span></span>{/if}
        <div class="hoops-frame-meta">{#if meta}<span>{meta}</span>{/if}</div>
      </div>
    {/if}
    {@render tableRegion()}
  </div>
{/if}
