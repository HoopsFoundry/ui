/**
 * HoopsFoundry UI Render · VenueCard (Hallenkarte)
 * --------------------------------------------------------------
 * `renderVenueCard(props, options?)`/`mountVenueCard(el, props, options?)`: dasselbe Markup wie die Komponente VenueCard (Svelte, React),
 * auch die Karte: `renderVenueCard` liefert das Platzhalter-Markup der Karte (Region, Hinweis mit Schaltfläche „Karte laden“, Statuszeile,
 * Quellenangabe, Ortsliste mit Adresse als Text, Links „Größere Karte“ und „Route planen“) ohne Leaflet und ohne Netzverkehr. Lebendig
 * (Kacheln, Zoom, Marker) wird sie mit `initMap` (js/map-vanilla.js) auf `.hoops-map` in `.hoops-venue-map`: `mountVenueCard(el, props, { initMap })`
 * startet sie selbst (nicht interaktiv, ohne Liste wie die Komponente), und `update` lässt die laufende Karte stehen, solange Ort und Name gleich bleiben.
 * Ohne `initMap` ist die Schaltfläche „Karte laden“ gesperrt (`disabled`, `aria-disabled`), damit sie nicht tot wirkt; `options.mapActive: true`
 * gibt sie frei (das Markup ist dann das von `MapView`). `options.init: true` markiert die Karte für `initAll` (`data-hoops="map"` mit den Optionen
 * als JSON in `data-hoops-options`), für Seiten, deren Markup auf dem Server entsteht. Props: `name`, `address`, `lat`, `lng`, `info`, `contact`, `games`, `limit`, `gamesLabel`, `href`, `linkLabel`, `names`,
 * `logos`, `size`, `titleAs`, `load`, `tileUrl`, `privacyNote`, `mapHeight`, `className`. Spiele, Kontakt, Adresse und Links kommen aus
 * js/venue.js (Grenzen: `limit` 1 bis 5, ohne beendete und Spielfrei). Typen: js/render/venue-card.d.ts.
 */
import {
  addressLines, contactInfo, gameMeta, gameState, gameWhen, isCoord, venueGames, venueHref, venueMapLabel, venueMapLinks, venueText,
} from '../venue.js';
import { attr, esc } from './escape.js';
import { headingOf, klass, list, logoBadge, nameText, obj, pick, str, teamOf, uidFor } from './core.js';
import { createRegistry } from '../lifecycle.js';
import { mount } from './mount.js';
import { renderMapView } from './map-view.js';

// Je Behälter höchstens eine Hallenkarte samt Karte: ein zweites mountVenueCard räumt die erste (auch ihre Leaflet-Karte) ab
const registry = createRegistry('venue-card');

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

/** Eigenschaften der eingebetteten Karte (wie die Komponente: nicht interaktiv, ohne Liste, ohne App-Links, ein Marker „halle“). */
function venueMapProps(p, title, lat, lng) {
  const props = {
    markers: [{ id: 'halle', lat, lng, label: title }], interactive: false, showList: false, appLinks: [],
    height: typeof p.mapHeight === 'number' ? p.mapHeight : 250, load: p.load === 'auto' ? 'auto' : 'click',
  };
  if (typeof p.tileUrl === 'string') props.tileUrl = p.tileUrl;
  if (typeof p.privacyNote === 'string') props.privacyNote = p.privacyNote;
  return props;
}

/** Eine Mannschaft der Spielzeile: Trikotpunkt, optional Logo, versteckter Hinweis „Heim“/„Gast“, Name mit Kurzform. */
const teamLine = (team, side, names, logos) =>
  `<div class="hoops-venue-team"><span class="hoops-venue-dot hoops-venue-dot--${side}" aria-hidden="true"></span>${logos ? logoBadge(team, 'hoops-team-logo--sm') : ''}` +
  `<span class="hoops-sr-only">${esc(side === 'heim' ? venueText.home : venueText.away)}:</span><span class="hoops-venue-team-name">${nameText(team, names)}</span></div>`;

const contactRow = (label, value) => {
  const inner = value.href ? `<a class="hoops-link" href="${attr(value.href)}">${esc(value.text)}</a>` : esc(value.text);
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

  const mapProps = hasMap ? venueMapProps(p, title, lat, lng) : null;
  const map = hasMap
    ? `<div class="hoops-venue-map"${obj(options).init === true ? ` data-hoops="map" data-hoops-options="${attr(JSON.stringify(mapProps))}"` : ''}>` +
      renderMapView({ ...mapProps, label: venueMapLabel(title), loadReady: obj(options).mapActive === true }, uid) +
      `<div class="hoops-venue-maplinks">${venueMapLinks({ lat, lng, name: title })
        .map((link) => `<a class="hoops-link" href="${attr(link.href)}">${esc(link.text)}${title ? `<span class="hoops-sr-only">, ${esc(title)}</span>` : ''}</a>`)
        .join('')}</div></div>`
    : '';

  const games = rows.length
    ? `<div class="hoops-venue-games"><div class="hoops-venue-sec" aria-hidden="true">${esc(gamesLabel)}</div><ul class="hoops-venue-game-list" aria-label="${attr(gamesLabel)}">` +
      rows
        .map((game, index) => {
          const when = gameWhen(game);
          const meta = gameMeta(game);
          const state = gameState(game);
          return (
            '<li class="hoops-venue-game">' +
            (when || state
              ? `<div class="hoops-venue-game-head">${when ? `<span class="hoops-venue-when">${esc(when)}</span>` : ''}${state ? `<span class="hoops-chip hoops-chip--${state.tone}">${esc(state.text)}</span>` : ''}</div>`
              : '') +
            (meta ? `<div class="hoops-venue-game-meta">${esc(meta)}</div>` : '') +
            `<div class="hoops-venue-teams">${game.heim?.name ? teamLine(game.heim, 'heim', names, logos) : ''}${game.gast?.name ? teamLine(game.gast, 'gast', names, logos) : ''}</div></li>`
          );
        })
        .join('') +
      '</ul></div>'
    : '';

  return (
    `<div class="${klass('hoops-venue', `hoops-venue--${size}`, hasMap && 'hoops-venue--map', str(p.className))}"><div class="hoops-venue-in">${map}<div class="hoops-venue-body">` +
    (title ? `<${tag} class="hoops-venue-title">${esc(title)}</${tag}>` : '') +
    (lines.length ? `<address class="hoops-venue-address">${lines.map((line) => `<span class="hoops-venue-line">${esc(line)}</span>`).join('')}</address>` : '') +
    (info ? `<p class="hoops-venue-info">${esc(info)}</p>` : '') +
    (person
      ? `<dl class="hoops-venue-contact">${person.name ? `<div><dt>${esc(venueText.contact)}</dt><dd>${esc(person.name)}</dd></div>` : ''}${person.phone ? contactRow(venueText.phone, person.phone) : ''}${person.email ? contactRow(venueText.email, person.email) : ''}</dl>`
      : '') +
    games +
    (target ? `<div class="hoops-venue-foot"><a class="hoops-link hoops-venue-more" href="${attr(target)}">${esc(linkLabel)}${title ? `<span class="hoops-sr-only">, ${esc(title)}</span>` : ''}</a></div>` : '') +
    '</div></div></div>'
  );
}

/**
 * Setzt `renderVenueCard` in `el` ein. `options.initMap` (die Funktion aus js/map-vanilla.js bzw. dem Karten-Bündel) startet die eingebettete Karte;
 * dazu `loadLeaflet`, `onLoad`, `onError`, `onMarkerClick` wie bei `initMap`. Ohne `initMap` bleibt die Karte der Platzhalter mit gesperrter Schaltfläche.
 */
export function mountVenueCard(el, props, options) {
  const o = obj(options);
  const { initMap, loadLeaflet, onLoad, onError, onMarkerClick, ...rest } = o;
  // Zuerst die frühere Fassung abbauen (auch mit Karte, wenn diesmal keine angebunden wird), erst danach Knoten lesen
  if (el && typeof el === 'object') registry.release(el);
  if (typeof initMap !== 'function' || typeof document === 'undefined' || !el || typeof el.querySelector !== 'function') return mount(el, renderVenueCard, props, rest);

  const behavior = {};
  for (const [name, fn] of Object.entries({ loadLeaflet, onLoad, onError, onMarkerClick })) if (typeof fn === 'function') behavior[name] = fn;
  let live = null;
  let done = false;
  const keyOf = (p) => {
    const lat = typeof p.lat === 'number' ? p.lat : undefined;
    const lng = typeof p.lng === 'number' ? p.lng : undefined;
    return isCoord(lat, lng) ? JSON.stringify([lat, lng, str(p.name).trim()]) : null;
  };
  // `null` nimmt eine frühere Angabe zurück (initMap.update führt Eigenschaften zusammen): fehlt tileUrl oder privacyNote, gilt wieder der Standard
  const optionsOf = (p) => ({ tileUrl: null, privacyNote: null, ...venueMapProps(p, str(p.name).trim(), p.lat, p.lng), ...behavior });
  const start = (p) => {
    const node = keyOf(p) ? el.querySelector('.hoops-venue-map') : null;
    live = node ? { node, key: keyOf(p), handle: initMap(node, optionsOf(p)) } : null;
  };

  const inner = mount(el, renderVenueCard, props, { ...rest, mapActive: true });
  start(obj(props));

  const handle = registry.claim(el, () => {
    done = true;
    live?.handle.destroy();
    live = null;
    inner.destroy();
  });
  return {
    update(next) {
      if (done) return;
      const p = obj(next);
      const keep = live && live.key === keyOf(p) ? live : null;
      if (live && !keep) {
        live.handle.destroy();
        live = null;
      }
      inner.update(p);
      const fresh = el.querySelector('.hoops-venue-map');
      // Die laufende Karte bleibt stehen: ein neuer Platzhalter an ihrer Stelle wird durch sie ersetzt
      if (keep && fresh && fresh !== keep.node) fresh.replaceWith(keep.node);
      if (keep && (fresh || keep.node.isConnected)) keep.handle.update(optionsOf(p));
      else if (keep) {
        keep.handle.destroy();
        live = null;
      } else start(p);
    },
    destroy: handle.destroy,
  };
}
