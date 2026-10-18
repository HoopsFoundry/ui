<script lang="ts">
  /**
   * HoopsFoundry UI TeamCard · Svelte 5
   * --------------------------------------------------------------
   * Mannschaftskarte: Kopf (Logo, Name, Liga, Saison), Bilanz und Tabellenplatz, nächstes und letztes Spiel,
   * Kader-Kurzliste, optionale Saison-Statistik. Alles außer `name` ist optional; was fehlt, erscheint nicht
   * (kein leerer Rahmen, kein Strich als Platzhalter). Nutzt nur Klassen aus css/components.css (`hoops-team*`).
   *
   *   standard — Karte mit allen Blöcken
   *   compact  — Listenzeile: Logo 32 px, Name, Liga, Bilanz kurz, Platz
   *
   * Mit `href` ist die ganze Karte ein Link (ein zusätzlicher `onclick` hängt am Link, z. B. für einen SPA-Router), mit
   * `onclick` allein ein Button (Name als Link bzw. Button in der Überschrift, flächig geklickt per ::after), sonst nicht klickbar. Eine Aktion je Karte: `leagueHref` zählt nur ohne `href`/`onclick`.
   * `names`/`logos` wie bei MatchCard (Kurzname bis 640 px automatisch; Logos der Gegner in den Spielzeilen).
   */
  import { initials, shortName } from '../js/schedule.js';
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  import { lastResult, opponentPrefix, rankInfo, recordInfo, squadText, statEntries } from '../js/team.js';
  import { outcomeLetter } from '../js/league.js';
  import { useI18n } from './i18n.js';
  import type { CatalogValue } from '../js/i18n/index.js';
  import type { TeamLast, TeamNext, TeamRecord, TeamRef, TeamSquad, TeamStats } from '../js/team.js';

  const OUTCOME_CHIP = { S: 'hoops-chip--ok', N: 'hoops-chip--err', U: '' } as const;

  let {
    name,
    short = undefined,
    logo = undefined,
    names = 'full',
    logos = false,
    league = '',
    leagueHref = undefined,
    season = '',
    record = undefined,
    rank = undefined,
    rankOf = undefined,
    points = undefined,
    next = undefined,
    last = undefined,
    squad = undefined,
    stats = undefined,
    size = 'standard',
    href = undefined,
    onclick = undefined,
    titleAs = undefined,
    texts = undefined,
  }: {
    name: string;
    short?: string;
    logo?: string;
    names?: 'full' | 'short';
    logos?: boolean;
    league?: string;
    leagueHref?: string;
    season?: string;
    record?: TeamRecord;
    rank?: number;
    rankOf?: number;
    points?: number;
    next?: TeamNext;
    last?: TeamLast;
    squad?: TeamSquad;
    stats?: TeamStats;
    size?: 'standard' | 'compact';
    href?: string;
    onclick?: () => void;
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    /** Eigene Texte (Schlüssel des Katalogs); schlagen die des Anbieters und `setTexts`. */
    texts?: Record<string, CatalogValue>;
  } = $props();

  const heading = useHeadingTag(() => titleAs);
  const i18n = useI18n(() => texts);

  const clickable = $derived(Boolean(href) || Boolean(onclick));
  const rec = $derived(recordInfo(record, i18n.options));
  const pos = $derived(rankInfo(rank, rankOf, i18n.options));
  const hasPoints = $derived(typeof points === 'number' && Number.isFinite(points));
  const squadLine = $derived(squadText(squad, i18n.options));
  const statList = $derived(statEntries(stats, i18n.options));
  const res = $derived(lastResult(last, i18n.options));
</script>

{#snippet nameText(t: TeamRef, withNames: 'full' | 'short')}
  {@const kurz = shortName(t)}
  {#if kurz}<span class="hoops-team-name" class:hoops-team-name--short={withNames === 'short'}><span class="hoops-name-full">{t.name}</span><span class="hoops-name-short" aria-hidden="true" title={t.name}>{kurz}</span></span>{:else}{t.name}{/if}
{/snippet}

{#snippet logoBadge(t: TeamRef, cls: string)}
  <span class={cls ? `hoops-team-logo ${cls}` : 'hoops-team-logo'} class:hoops-team-logo--initials={!t.logo} aria-hidden="true">{#if t.logo}<img src={t.logo} alt="" loading="lazy" />{:else}{initials(t.name, 2)}{/if}</span>
{/snippet}

{#snippet nameBlock()}
  {#if href}<a class="hoops-team-link" {href} {onclick}>{@render nameText({ name, short }, names)}</a>
  {:else if onclick}<button class="hoops-team-link" type="button" {onclick}>{@render nameText({ name, short }, names)}</button>
  {:else}{@render nameText({ name, short }, names)}{/if}
{/snippet}

{#snippet leagueLine()}
  {#if league || season}
    <div class="hoops-team-sub">
      {#if league}{#if leagueHref && !clickable}<a class="hoops-link" href={leagueHref}>{league}</a>{:else}<span>{league}</span>{/if}{/if}
      {#if season}<span>{season}</span>{/if}
    </div>
  {/if}
{/snippet}

{#snippet tile(value: string, label: string, aria: string)}
  <div>
    <div class="hoops-pc-v" aria-hidden="true">{value}</div>
    <div class="hoops-pc-l" aria-hidden="true">{label}</div>
    <span class="hoops-sr-only">{aria}</span>
  </div>
{/snippet}

{#snippet opponentName(o: TeamRef, at: 'heim' | 'gast' | undefined)}
  {#if at}<span class={`hoops-chip hoops-chip--mono ${at === 'gast' ? 'hoops-chip--amber' : 'hoops-chip--sky'}`} aria-hidden="true">{i18n.t(at === 'gast' ? 'schedule.chip.away' : 'schedule.chip.home')}</span>{/if}
  <span class="hoops-team-game-opp">
    {#if logos}{@render logoBadge(o, 'hoops-team-logo--sm')}{/if}
    <span><span class="hoops-sr-only">{opponentPrefix(at, i18n.options)}</span>{@render nameText(o, names)}</span>
  </span>
{/snippet}

{#if size === 'compact'}
  <div class={`hoops-team hoops-team--compact${clickable ? ' hoops-team--link' : ''}`} lang={i18n.lang}>
    {@render logoBadge({ name, logo }, '')}
    <div class="hoops-team-who">
      <span class="hoops-team-nm">{@render nameBlock()}</span>
      {@render leagueLine()}
    </div>
    <span class="hoops-team-end">
      {#if rec}<span class="hoops-team-rec" aria-hidden="true">{rec.text}</span><span class="hoops-sr-only">{rec.aria}</span>{/if}
      {#if pos}<span class="hoops-team-rank" aria-hidden="true">{i18n.t('team.rank.compact', { rank: pos.text })}</span><span class="hoops-sr-only">{pos.aria}</span>{/if}
    </span>
  </div>
{:else}
  <div class={`hoops-team hoops-team--standard${clickable ? ' hoops-team--link' : ''}`} lang={i18n.lang}>
    <div class="hoops-team-head">
      {@render logoBadge({ name, logo }, 'hoops-team-logo--lg')}
      <div class="hoops-team-who">
        <svelte:element this={heading.tag} class="hoops-team-nm">{@render nameBlock()}</svelte:element>
        {@render leagueLine()}
      </div>
    </div>

    {#if rec || pos || hasPoints}
      <div class="hoops-team-vitals">
        {#if rec}{@render tile(rec.text, rec.label, rec.aria)}{/if}
        {#if pos}{@render tile(pos.text, pos.label, pos.aria)}{/if}
        {#if hasPoints}{@render tile(String(points), i18n.t('team.points'), i18n.t('team.points-aria', { points: points as number }))}{/if}
      </div>
    {/if}

    {#if next || last}
      <div class="hoops-team-games">
        {#if next}
          <div class="hoops-team-game">
            <div class="hoops-team-game-l">{i18n.t('team.next')}</div>
            <div class="hoops-team-game-row">
              {@render opponentName(next.opponent, next.at)}
              {#if next.date || next.time}<span class="hoops-team-game-end">{[next.date, next.time].filter(Boolean).join(' · ')}</span>{/if}
            </div>
            {#if next.venue}<div class="hoops-team-game-venue">{next.venue}</div>{/if}
          </div>
        {/if}
        {#if last}
          <div class="hoops-team-game">
            <div class="hoops-team-game-l">{last.date ? `${i18n.t('team.last')} · ${last.date}` : i18n.t('team.last')}</div>
            <div class="hoops-team-game-row">
              {@render opponentName(last.opponent, last.at)}
              {#if res}
                <span class="hoops-team-game-end">
                  {#if res.outcome}<span class={`hoops-chip hoops-chip--mono ${OUTCOME_CHIP[res.outcome]}`} aria-hidden="true">{outcomeLetter(res.outcome, i18n.options)}</span>{/if}
                  <span class="hoops-team-game-score" aria-hidden="true">{res.score}</span>
                  <span class="hoops-sr-only">{res.aria}</span>
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if squadLine}<div class="hoops-team-squad">{squadLine}</div>{/if}

    {#if statList.length}
      <div class="hoops-team-stats" role="group" aria-label={i18n.t('team.season-stats')}>
        <div class="hoops-team-sec" aria-hidden="true">{i18n.t('team.season-stats')}</div>
        <div class="hoops-team-vitals">
          {#each statList as s (s.key)}
            <div>
              <div class="hoops-pc-v">{s.value}</div>
              <div class="hoops-pc-l">{s.label}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
