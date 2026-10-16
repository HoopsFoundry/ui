<script lang="ts">
  /**
   * HoopsFoundry UI VenueCard (Hallenkarte) · Svelte 5
   * --------------------------------------------------------------
   * Halle auf einen Blick: links eine kleine Karte (Map, nicht interaktiv, Zwei-Klick-Platzhalter), rechts Name, Adresse, Kurzinfo,
   * Kontakt, die nächsten Spiele in der Halle und ein Link zur Hallenseite. Alles außer `name` ist optional; was fehlt, erscheint
   * nicht. Ohne `lat`/`lng` gibt es keine Karte, die Daten nehmen dann die ganze Breite. Unter 640 px steht die Karte oben (16:9).
   * Die Adresse steht als Text (`address`); die Karte ergänzt sie und wiederholt sie nicht. Nutzt nur Klassen aus css/components.css
   * (`hoops-venue*`, dazu `hoops-map*` der eingebetteten Karte). Regeln: js/venue.js.
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
    gameKeys,
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
    /** Name der Halle, z. B. „Sporthalle Nordhain“. Pflicht; leer oder nur Leerraum ergibt keine Überschrift. */
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

  /** Ohne Namen (leer oder nur Leerraum) entfällt die Überschrift, statt leer zu bleiben. */
  const title = $derived(typeof name === 'string' ? name.trim() : '');
  const hasMap = $derived(isCoord(lat, lng));
  const lines = $derived(addressLines(address));
  const person = $derived(contactInfo(contact));
  const rows = $derived(size === 'compact' ? [] : venueGames(games, limit));
  const mapLinks = $derived(venueMapLinks({ lat, lng, name: title }));
  const marker = $derived([{ id: 'halle', lat: lat as number, lng: lng as number, label: title }]);
  const keys = $derived(gameKeys(rows));
  const target = $derived(venueHref(href));
</script>

{#snippet teamLine(team: ScheduleTeam, side: 'heim' | 'gast')}
  {@const kurz = shortName(team)}
  <div class="hoops-venue-team">
    <span class={`hoops-venue-dot hoops-venue-dot--${side}`} aria-hidden="true"></span>
    {#if logos}<span class={`hoops-team-logo hoops-team-logo--sm${team.logo ? '' : ' hoops-team-logo--initials'}`} aria-hidden="true">{#if team.logo}<img src={team.logo} alt="" loading="lazy" />{:else}{initials(team.name, 2)}{/if}</span>{/if}
    <span class="hoops-sr-only">{side === 'heim' ? venueText.home : venueText.away}:</span>
    <span class="hoops-venue-team-name">
      {#if kurz}<span class="hoops-team-name" class:hoops-team-name--short={names === 'short'}><span class="hoops-name-full">{team.name}</span><span class="hoops-name-short" aria-hidden="true" title={team.name}>{kurz}</span></span>{:else}{team.name}{/if}
    </span>
  </div>
{/snippet}

<div class={`hoops-venue hoops-venue--${size}${hasMap ? ' hoops-venue--map' : ''}${klass ? ` ${klass}` : ''}`}>
  <div class="hoops-venue-in">
  {#if hasMap}
    <div class="hoops-venue-map">
      <MapView
        label={venueMapLabel(title)}
        markers={marker}
        interactive={false}
        showList={false}
        height={mapHeight}
        {load}
        {tileUrl}
        {privacyNote}
        appLinks={[]}
      />
      <div class="hoops-venue-maplinks">
        {#each mapLinks as link (link.kind)}
          <a class="hoops-link" href={link.href}>{link.text}{#if title}<span class="hoops-sr-only">, {title}</span>{/if}</a>
        {/each}
      </div>
    </div>
  {/if}

  <div class="hoops-venue-body">
    {#if title}<svelte:element this={heading.tag} class="hoops-venue-title">{title}</svelte:element>{/if}

    {#if lines.length}
      <address class="hoops-venue-address">{#each lines as line, i (i)}<span class="hoops-venue-line">{line}</span>{/each}</address>
    {/if}

    {#if info && info.trim()}<p class="hoops-venue-info">{info.trim()}</p>{/if}

    {#if person}
      <dl class="hoops-venue-contact">
        {#if person.name}<div><dt>{venueText.contact}</dt><dd>{person.name}</dd></div>{/if}
        {#if person.phone}<div><dt>{venueText.phone}</dt><dd>{#if person.phone.href}<a class="hoops-link" href={person.phone.href}>{person.phone.text}</a>{:else}{person.phone.text}{/if}</dd></div>{/if}
        {#if person.email}<div><dt>{venueText.email}</dt><dd>{#if person.email.href}<a class="hoops-link" href={person.email.href}>{person.email.text}</a>{:else}{person.email.text}{/if}</dd></div>{/if}
      </dl>
    {/if}

    {#if rows.length}
      <div class="hoops-venue-games">
        <div class="hoops-venue-sec" aria-hidden="true">{gamesLabel}</div>
        <ul class="hoops-venue-game-list" aria-label={gamesLabel}>
          {#each rows as game, i (keys[i])}
            {@const when = gameWhen(game)}
            {@const meta = gameMeta(game)}
            {@const state = gameState(game)}
            <li class="hoops-venue-game">
              {#if when || state}
                <div class="hoops-venue-game-head">
                  {#if when}<span class="hoops-venue-when">{when}</span>{/if}
                  {#if state}<span class={`hoops-chip hoops-chip--${state.tone}`}>{state.text}</span>{/if}
                </div>
              {/if}
              {#if meta}<div class="hoops-venue-game-meta">{meta}</div>{/if}
              <div class="hoops-venue-teams">
                {#if game.heim?.name}{@render teamLine(game.heim, 'heim')}{/if}
                {#if game.gast?.name}{@render teamLine(game.gast, 'gast')}{/if}
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if target}
      <div class="hoops-venue-foot">
        <a class="hoops-link hoops-venue-more" href={target}>{linkLabel}{#if title}<span class="hoops-sr-only">, {title}</span>{/if}</a>
      </div>
    {/if}
  </div>
  </div>
</div>
