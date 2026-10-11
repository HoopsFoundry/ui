<script lang="ts">
  /**
   * DSS VenueCard (Hallenkarte) · Svelte 5
   * --------------------------------------------------------------
   * Halle auf einen Blick: links eine kleine Karte (Map, nicht interaktiv, Zwei-Klick-Platzhalter), rechts Name, Adresse, Kurzinfo,
   * Kontakt, die nächsten Spiele in der Halle und ein Link zur Hallenseite. Alles außer `name` ist optional; was fehlt, erscheint
   * nicht. Ohne `lat`/`lng` gibt es keine Karte, die Daten nehmen dann die ganze Breite. Unter 640 px steht die Karte oben (16:9).
   * Die Adresse steht als Text (`address`); die Karte ergänzt sie und wiederholt sie nicht. Nutzt nur Klassen aus css/components.css
   * (`dss-venue*`, dazu `dss-map*` der eingebetteten Karte). Regeln: js/venue.js.
   *
   *   standard — Karte ~ 40 %, mit den nächsten Spielen (`games`, höchstens `limit`, Standard 2)
   *   compact  — kleinere Karte (~ 30 %), ohne Spiele
   *
   * `names`/`logos` wie bei Spielplan und Karten (Kurzname bis 640 px automatisch).
   */
  import type { HeadingTag } from '../js/heading.js';
  import { useHeadingTag } from './heading-context.js';
  import { initials, shortName } from '../js/schedule.js';
  import type { ScheduleGame, ScheduleTeam } from '../js/schedule.js';
  import {
    addressLines,
    contactInfo,
    gameMeta,
    gameState,
    gameWhen,
    isCoord,
    venueGames,
    venueHref,
    venueMapLabel,
    venueMapLinks,
    venueText,
  } from '../js/venue.js';
  import type { VenueAddress, VenueContact } from '../js/venue.js';
  import MapView from './Map.svelte';

  let {
    name,
    address = undefined,
    lat = undefined,
    lng = undefined,
    info = '',
    contact = undefined,
    games = undefined,
    limit = undefined,
    gamesLabel = venueText.gamesLabel,
    href = undefined,
    linkLabel = venueText.linkLabel,
    names = 'full',
    logos = false,
    size = 'standard',
    titleAs = undefined,
    load = 'click',
    tileUrl = undefined,
    privacyNote = undefined,
    mapHeight = 250,
    class: klass = '',
  }: {
    /** Name der Halle, z. B. „Sporthalle Nordhain“. Pflicht. */
    name: string;
    /** Adresse: Straße, Postleitzahl, Ort. Leere Teile entfallen. */
    address?: VenueAddress;
    /** Koordinaten der Halle; ohne beide gültigen Werte keine Karte. */
    lat?: number;
    lng?: number;
    /** Kurzinfo, z. B. „Zwei Spielfelder, Zugang über den Haupteingang“. */
    info?: string;
    /** Ansprechperson mit Telefon und E-Mail (als `tel:`- und `mailto:`-Links). */
    contact?: VenueContact;
    /** Spiele in der Halle; gezeigt werden die nächsten `limit` (ohne beendete). Nur in `standard`. */
    games?: ScheduleGame[];
    /** Höchstzahl der Spiele (1 bis 5, Standard 2). */
    limit?: number;
    gamesLabel?: string;
    /** Seite der Halle; ohne `href` entfällt der Link. */
    href?: string;
    linkLabel?: string;
    names?: 'full' | 'short';
    logos?: boolean;
    size?: 'standard' | 'compact';
    /** Überschriftenebene, h2 bis h6. Rangfolge: `titleAs` vor der Ebene aus `HeadingLevel` vor h3. */
    titleAs?: HeadingTag;
    /** `click`: Platzhalter, Kacheln erst nach „Karte laden“ (Standard). `auto`: sofort laden. */
    load?: 'click' | 'auto';
    tileUrl?: string;
    privacyNote?: string;
    /** Mindesthöhe der Karte in Pixeln (mindestens 200); die Karte wächst mit den Daten daneben. */
    mapHeight?: number;
    class?: string;
  } = $props();

  const heading = useHeadingTag(() => titleAs);

  const hasMap = $derived(isCoord(lat, lng));
  const lines = $derived(addressLines(address));
  const person = $derived(contactInfo(contact));
  const rows = $derived(size === 'compact' ? [] : venueGames(games, limit));
  const mapLinks = $derived(venueMapLinks({ lat, lng, name }));
  const marker = $derived([{ id: 'halle', lat: lat as number, lng: lng as number, label: name }]);
  const target = $derived(venueHref(href));
</script>

{#snippet teamLine(team: ScheduleTeam, side: 'heim' | 'gast')}
  {@const kurz = shortName(team)}
  <div class="dss-venue-team">
    <span class={`dss-venue-dot dss-venue-dot--${side}`} aria-hidden="true"></span>
    {#if logos}<span class={`dss-team-logo dss-team-logo--sm${team.logo ? '' : ' dss-team-logo--initials'}`} aria-hidden="true">{#if team.logo}<img src={team.logo} alt="" loading="lazy" />{:else}{initials(team.name, 2)}{/if}</span>{/if}
    <span class="dss-sr-only">{side === 'heim' ? venueText.home : venueText.away}:</span>
    <span class="dss-venue-team-name">
      {#if kurz}<span class="dss-team-name" class:dss-team-name--short={names === 'short'}><span class="dss-name-full">{team.name}</span><span class="dss-name-short" aria-hidden="true" title={team.name}>{kurz}</span></span>{:else}{team.name}{/if}
    </span>
  </div>
{/snippet}

<div class={`dss-venue dss-venue--${size}${hasMap ? ' dss-venue--map' : ''}${klass ? ` ${klass}` : ''}`}>
  <div class="dss-venue-in">
  {#if hasMap}
    <div class="dss-venue-map">
      <MapView
        label={venueMapLabel(name)}
        markers={marker}
        interactive={false}
        showList={false}
        height={mapHeight}
        {load}
        {tileUrl}
        {privacyNote}
        appLinks={[]}
      />
      <div class="dss-venue-maplinks">
        {#each mapLinks as link (link.kind)}
          <a class="dss-link" href={link.href}>{link.text}<span class="dss-sr-only">, {name}</span></a>
        {/each}
      </div>
    </div>
  {/if}

  <div class="dss-venue-body">
    <svelte:element this={heading.tag} class="dss-venue-title">{name}</svelte:element>

    {#if lines.length}
      <address class="dss-venue-address">{#each lines as line, i (i)}<span class="dss-venue-line">{line}</span>{/each}</address>
    {/if}

    {#if info && info.trim()}<p class="dss-venue-info">{info.trim()}</p>{/if}

    {#if person}
      <dl class="dss-venue-contact">
        {#if person.name}<div><dt>{venueText.contact}</dt><dd>{person.name}</dd></div>{/if}
        {#if person.phone}<div><dt>{venueText.phone}</dt><dd>{#if person.phone.href}<a class="dss-link" href={person.phone.href}>{person.phone.text}</a>{:else}{person.phone.text}{/if}</dd></div>{/if}
        {#if person.email}<div><dt>{venueText.email}</dt><dd>{#if person.email.href}<a class="dss-link" href={person.email.href}>{person.email.text}</a>{:else}{person.email.text}{/if}</dd></div>{/if}
      </dl>
    {/if}

    {#if rows.length}
      <div class="dss-venue-games">
        <div class="dss-venue-sec" aria-hidden="true">{gamesLabel}</div>
        <ul class="dss-venue-game-list" aria-label={gamesLabel}>
          {#each rows as game (game.id)}
            {@const when = gameWhen(game)}
            {@const meta = gameMeta(game)}
            {@const state = gameState(game)}
            <li class="dss-venue-game">
              {#if when || state}
                <div class="dss-venue-game-head">
                  {#if when}<span class="dss-venue-when">{when}</span>{/if}
                  {#if state}<span class={`dss-chip dss-chip--${state.tone}`}>{state.text}</span>{/if}
                </div>
              {/if}
              {#if meta}<div class="dss-venue-game-meta">{meta}</div>{/if}
              <div class="dss-venue-teams">
                {#if game.heim?.name}{@render teamLine(game.heim, 'heim')}{/if}
                {#if game.gast?.name}{@render teamLine(game.gast, 'gast')}{/if}
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if target}
      <div class="dss-venue-foot">
        <a class="dss-link dss-venue-more" href={target}>{linkLabel}<span class="dss-sr-only">, {name}</span></a>
      </div>
    {/if}
  </div>
  </div>
</div>
