/**
 * DSS Render · VenueCard (Hallenkarte)
 * --------------------------------------------------------------
 * `renderVenueCard(props, options?)`/`mountVenueCard(el, props, options?)`: dasselbe Markup wie die Komponente VenueCard (Svelte, React),
 * auch die Karte: `renderVenueCard` liefert das Platzhalter-Markup der Karte (Region, Hinweis mit Schaltfläche „Karte laden“, Statuszeile,
 * Quellenangabe, Ortsliste mit Adresse als Text, Links „Größere Karte“ und „Route planen“) ohne Leaflet und ohne Netzverkehr. Lebendig
 * (Kacheln, Zoom, Marker) wird sie erst mit `initMap` (V2b) auf `.dss-map` in `.dss-venue-map`; bis dahin bleibt der Platzhalter mit
 * Adresse und Links. Die Schaltfläche „Karte laden“ ist ohne `initMap` gesperrt (`disabled`, `aria-disabled`), damit sie nicht tot wirkt;
 * `options.mapActive: true` gibt sie frei (V2b setzt das, das Markup ist dann das von `MapView`). Props: `name`, `address`, `lat`, `lng`, `info`, `contact`, `games`, `limit`, `gamesLabel`, `href`, `linkLabel`, `names`,
 * `logos`, `size`, `titleAs`, `load`, `tileUrl`, `privacyNote`, `mapHeight`, `className`. Spiele, Kontakt, Adresse und Links kommen aus
 * js/venue.js (Grenzen: `limit` 1 bis 5, ohne beendete und Spielfrei). Typen: js/render/venue-card.d.ts.
 */
import {
  addressLines, contactInfo, gameMeta, gameState, gameWhen, isCoord, venueGames, venueHref, venueMapLabel, venueMapLinks, venueText,
} from '../venue.js';
import { attr, esc } from './escape.js';
import { headingOf, klass, list, logoBadge, nameText, obj, pick, str, teamOf, uidFor } from './core.js';
import { mount } from './mount.js';
import { renderMapView } from './map-view.js';

/** Ein Spiel aus unvertrauten Daten: nur, was die Hallenkarte zeigt (Texte als Text, Mannschaften geprüft). */
function gameOf(raw) {
  const g = obj(raw);
  const team = (value) => (value && typeof value === 'object' ? teamOf(value) : undefined);
  return {
    id: typeof g.id === 'number' || typeof g.id === 'string' ? g.id : undefined,
    state: str(g.state), date: str(g.date), time: str(g.time), field: str(g.field),
    league: g.league && typeof g.league === 'object' ? { name: str(obj(g.league).name) } : undefined,
    heim: team(g.heim), gast: team(g.gast),
  };
}

/** Eine Mannschaft der Spielzeile: Trikotpunkt, optional Logo, versteckter Hinweis „Heim“/„Gast“, Name mit Kurzform. */
const teamLine = (team, side, names, logos) =>
  `<div class="dss-venue-team"><span class="dss-venue-dot dss-venue-dot--${side}" aria-hidden="true"></span>${logos ? logoBadge(team, 'dss-team-logo--sm') : ''}` +
  `<span class="dss-sr-only">${esc(side === 'heim' ? venueText.home : venueText.away)}:</span><span class="dss-venue-team-name">${nameText(team, names)}</span></div>`;

const contactRow = (label, value) => {
  const inner = value.href ? `<a class="dss-link" href="${attr(value.href)}">${esc(value.text)}</a>` : esc(value.text);
  return `<div><dt>${esc(label)}</dt><dd>${inner}</dd></div>`;
};

/** Hallenkarte: kleine Karte links, rechts Name, Adresse, Kurzinfo, Kontakt, nächste Spiele und Link zur Hallenseite. */
export function renderVenueCard(props, options) {
  const p = obj(props);
  // Ohne Namen (leer oder nur Leerraum) entfällt die Überschrift, statt leer zu bleiben
  const title = str(p.name).trim();
  const lat = typeof p.lat === 'number' ? p.lat : undefined;
  const lng = typeof p.lng === 'number' ? p.lng : undefined;
  const hasMap = isCoord(lat, lng);
  const size = pick(p.size, ['standard', 'compact'], 'standard');
  const names = pick(p.names, ['full', 'short'], 'full');
  const logos = Boolean(p.logos);
  const lines = addressLines(obj(p.address));
  const person = contactInfo(obj(p.contact));
  const rows = size === 'compact' ? [] : venueGames(list(p.games).filter((g) => g && typeof g === 'object').map(gameOf), p.limit);
  const target = venueHref(typeof p.href === 'string' ? p.href : undefined);
  const info = str(p.info).trim();
  const gamesLabel = typeof p.gamesLabel === 'string' ? p.gamesLabel : venueText.gamesLabel;
  const linkLabel = typeof p.linkLabel === 'string' ? p.linkLabel : venueText.linkLabel;
  const tag = headingOf(p.titleAs);
  const uid = uidFor(p, options);

  const map = hasMap
    ? '<div class="dss-venue-map">' +
      renderMapView(
        {
          label: venueMapLabel(title), markers: [{ id: 'halle', lat, lng, label: title }], showList: false, height: typeof p.mapHeight === 'number' ? p.mapHeight : 250,
          load: p.load === 'auto' ? 'auto' : 'click', tileUrl: p.tileUrl, privacyNote: p.privacyNote, appLinks: [], loadReady: obj(options).mapActive === true,
        },
        uid,
      ) +
      `<div class="dss-venue-maplinks">${venueMapLinks({ lat, lng, name: title })
        .map((link) => `<a class="dss-link" href="${attr(link.href)}">${esc(link.text)}${title ? `<span class="dss-sr-only">, ${esc(title)}</span>` : ''}</a>`)
        .join('')}</div></div>`
    : '';

  const games = rows.length
    ? `<div class="dss-venue-games"><div class="dss-venue-sec" aria-hidden="true">${esc(gamesLabel)}</div><ul class="dss-venue-game-list" aria-label="${attr(gamesLabel)}">` +
      rows
        .map((game, index) => {
          const when = gameWhen(game);
          const meta = gameMeta(game);
          const state = gameState(game);
          return (
            '<li class="dss-venue-game">' +
            (when || state
              ? `<div class="dss-venue-game-head">${when ? `<span class="dss-venue-when">${esc(when)}</span>` : ''}${state ? `<span class="dss-chip dss-chip--${state.tone}">${esc(state.text)}</span>` : ''}</div>`
              : '') +
            (meta ? `<div class="dss-venue-game-meta">${esc(meta)}</div>` : '') +
            `<div class="dss-venue-teams">${game.heim?.name ? teamLine(game.heim, 'heim', names, logos) : ''}${game.gast?.name ? teamLine(game.gast, 'gast', names, logos) : ''}</div></li>`
          );
        })
        .join('') +
      '</ul></div>'
    : '';

  return (
    `<div class="${klass('dss-venue', `dss-venue--${size}`, hasMap && 'dss-venue--map', str(p.className))}"><div class="dss-venue-in">${map}<div class="dss-venue-body">` +
    (title ? `<${tag} class="dss-venue-title">${esc(title)}</${tag}>` : '') +
    (lines.length ? `<address class="dss-venue-address">${lines.map((line) => `<span class="dss-venue-line">${esc(line)}</span>`).join('')}</address>` : '') +
    (info ? `<p class="dss-venue-info">${esc(info)}</p>` : '') +
    (person
      ? `<dl class="dss-venue-contact">${person.name ? `<div><dt>${esc(venueText.contact)}</dt><dd>${esc(person.name)}</dd></div>` : ''}${person.phone ? contactRow(venueText.phone, person.phone) : ''}${person.email ? contactRow(venueText.email, person.email) : ''}</dl>`
      : '') +
    games +
    (target ? `<div class="dss-venue-foot"><a class="dss-link dss-venue-more" href="${attr(target)}">${esc(linkLabel)}${title ? `<span class="dss-sr-only">, ${esc(title)}</span>` : ''}</a></div>` : '') +
    '</div></div></div>'
  );
}

/** Setzt `renderVenueCard` in `el` ein. Die Karte bleibt der Platzhalter, bis `initMap` (V2b) sie startet. */
export const mountVenueCard = (el, props, options) => mount(el, renderVenueCard, props, options);
