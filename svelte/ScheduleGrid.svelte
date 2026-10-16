<script lang="ts">
  /**
   * HoopsFoundry UI ScheduleGrid · Svelte 5
   * --------------------------------------------------------------
   * Zeitraster: Anwurfzeiten als Zeilen, Hallen oder Felder als Spalten
   * (empfohlen: höchstens drei). Nutzt ausschließlich die Klassen aus
   * css/components.css (kein eigener Scoped-Style); gleiche Struktur wie
   * die React-Fassung. Snippet `notice`: zusätzlicher Inhalt in der Spielzelle.
   * `title` und `meta` sind reine Strings; `titleAs` ('h2' bis 'h6', Standard h3 bzw. Ebene aus HeadingLevel) wählt die
   * Überschriftenebene; `renderLink` gibt es in Svelte nicht (Links als einfache <a>).
   *
   * `names`: "full" (Standard) oder "short" (Kurzname, falls vorhanden); bis 640 px Breite
   * erscheint der Kurzname automatisch (CSS). `logos`: Logo/Initialen vor dem Teamnamen (Standard aus).
   */
  import type { Snippet } from 'svelte';
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  import CollapsibleFrame from './internal/CollapsibleFrame.svelte';
  import { ariaForResult, buildGrid, hasScore, initials, shortName, stateLabel, winnerSide } from '../js/schedule.js';
  import type { ScheduleBreak, ScheduleDensity, ScheduleGame, ScheduleGridColumn, ScheduleNames, ScheduleTeam } from '../js/schedule.js';

  let {
    games,
    columns,
    slots = undefined,
    breaks = undefined,
    emptyLabel = 'frei',
    density = 'default',
    names = 'full',
    logos = false,
    title = '',
    titleAs = undefined,
    meta = '',
    caption = '',
    collapsible = false,
    open = $bindable(false),
    id = undefined,
    class: klass = '',
    notice = undefined,
  }: {
    games: ScheduleGame[];
    columns: ScheduleGridColumn[];
    slots?: string[];
    breaks?: ScheduleBreak[];
    emptyLabel?: string;
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
    class?: string;
    notice?: Snippet<[ScheduleGame]>;
  } = $props();

  const heading = useHeadingTag(() => titleAs);
  // Nur in der Entwicklung (`$inspect` entfällt im Produktionsbuild)
  $inspect(collapsible && !title).with((_type, missing) => {
    if (missing) console.warn('[HoopsFoundry UI] ScheduleGrid: `collapsible` braucht einen `title`, sonst bleibt der Rahmen unverändert.');
  });

  const rows = $derived(buildGrid({ games, columns, slots, breaks }));
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

{#snippet gameBlock(game: ScheduleGame)}
  {@const winner = winnerSide(game)}
  {@const own = game.heim?.own || game.gast?.own}
  {@const metaText = [game.nr, game.section].filter(Boolean).join(' · ')}
  <div
    class="hoops-sg-game"
    class:is-own={own}
    class:is-live={game.state === 'live'}
    class:is-cancelled={game.state === 'cancelled'}
    class:is-postponed={game.state === 'postponed'}
  >
    <div class="hoops-sg-teams">
      {#if stateLabel(game.state)}<span class="hoops-sr-only">{`${stateLabel(game.state)} `}</span>{/if}
      {@render team(game.heim, winner === 'gast', logos)}
      <span class="hoops-sch-sep" aria-hidden="true"> – </span>
      <span class="hoops-sr-only"> gegen </span>
      {@render team(game.gast, winner === 'heim', logos)}
      {#if game.state === 'live' && !hasScore(game, 'versus')}
        <span class="hoops-match-live hoops-sch-live"><span class="hoops-match-pulse" aria-hidden="true"></span> Live</span>
      {/if}
    </div>
    {#if (game.state === 'finished' || game.state === 'live') && hasScore(game, 'versus')}
      <div class="hoops-sg-result">
        <span class="hoops-sch-resbox">
          <span class="hoops-sch-score" aria-hidden="true">{game.heim?.score} : {game.gast?.score}</span>
          <span class="hoops-sr-only">{ariaForResult(game, 'versus')}</span>
          {#if game.provisional}<small class="hoops-sch-prov" aria-hidden="true">vorläufig</small>{/if}
        </span>
        {#if game.state === 'live'}
          <span class="hoops-match-live hoops-sch-live"><span class="hoops-match-pulse" aria-hidden="true"></span> Live</span>
        {/if}
      </div>
    {/if}
    {#if metaText}<div class="hoops-sg-meta">{metaText}</div>{/if}
    {#if game.note}<div class="hoops-sch-note">{game.note}</div>{/if}
    {#if notice}{@render notice(game)}{/if}
  </div>
{/snippet}

{#snippet frameMeta()}
  <span class="hoops-frame-meta"><span>{meta}</span></span>
{/snippet}

{#snippet tableRegion()}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -- Fokussierbar mit Absicht: Tastaturnutzer müssen den scrollbaren Bereich erreichen (WCAG 2.1.1) -->
  <div class="hoops-table-scroll" role="region" tabindex="0" aria-label={caption || title || 'Zeitraster'}>
    <!-- Die expliziten role-Attribute sind Absicht: Sie erhalten die Tabellensemantik, wenn das Mobil-CSS
         display: block/grid setzt. Nicht entfernen, um die Svelte-Warnung zu unterdrücken. -->
    <!-- svelte-ignore a11y_no_redundant_roles -->
    <table role="table" class="hoops-tbl hoops-sgrid hoops-tbl--{density}">
      {#if caption}<caption class="hoops-sr-only">{caption}</caption>{/if}
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <thead role="rowgroup">
        <!-- svelte-ignore a11y_no_redundant_roles -->
        <tr role="row">
          <th scope="col" role="columnheader" class="hoops-sg-time">Zeit</th>
          {#each columns as column (column.id)}
            <th scope="col" role="columnheader">{column.label}</th>
          {/each}
        </tr>
      </thead>
      <!-- svelte-ignore a11y_no_redundant_roles -->
      <tbody role="rowgroup">
        <!-- Schlüssel mit Index ist Absicht: Zeitzeile, Pause und Freilos können dieselbe Startzeit haben. -->
        {#each rows as row, index (`${row.kind}-${row.time ?? ''}-${index}`)}
          {#if row.kind === 'break'}
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <tr role="row" class="hoops-sg-break">
              <th scope="row" role="rowheader" class="hoops-sg-time">{row.time}</th>
              <td role="cell" colspan={columns.length}>{row.label}</td>
            </tr>
          {:else if row.kind === 'bye'}
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <tr role="row" class="hoops-sg-bye">
              <th scope="row" role="rowheader" class="hoops-sg-time">{#if row.time}{row.time}{:else}<span class="hoops-sr-only">Zeit offen</span>{/if}</th>
              <td role="cell" colspan={columns.length}>{#if row.game.heim}{@render team(row.game.heim, false, logos)} hat Freilos{:else}{row.game.note ?? 'Spielfrei'}{/if}</td>
            </tr>
          {:else}
            <!-- svelte-ignore a11y_no_redundant_roles -->
            <tr role="row">
              <th scope="row" role="rowheader" class="hoops-sg-time">{row.time}</th>
              {#each row.cells as cell, columnIndex (columns[columnIndex].id)}
                <td role="cell" class="hoops-sg-cell" class:is-empty={cell.length === 0} data-label={columns[columnIndex].label}>
                  {#if cell.length === 0}
                    <span class="hoops-sg-empty">{emptyLabel}</span>
                  {:else}
                    {#each cell as game (game.id)}{@render gameBlock(game)}{/each}
                  {/if}
                </td>
              {/each}
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
{/snippet}

{#if collapsible && title}
  <CollapsibleFrame rootClass="hoops-frame {klass}" {id} {title} {titleAs} bind:open meta={meta ? frameMeta : undefined}>
    {@render tableRegion()}
  </CollapsibleFrame>
{:else}
  <div class="hoops-frame {klass}">
    {#if title || meta}
      <div class="hoops-frame-head">
        {#if title}<svelte:element this={heading.tag} class="hoops-frame-title">{title}</svelte:element>{:else}<span></span>{/if}
        <div class="hoops-frame-meta">{#if meta}<span>{meta}</span>{/if}</div>
      </div>
    {/if}
    {@render tableRegion()}
  </div>
{/if}
