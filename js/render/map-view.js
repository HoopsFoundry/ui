/**
 * DSS Render · Karte als Markup (Platzhalter, Liste, Statuszeile)
 * --------------------------------------------------------------
 * Das Markup von `MapView` (React) und `Map` (Svelte) im Zustand vor dem Laden: Sprunglink, Region mit Platzhalter (Pins und Zwei-Klick-Karte
 * mit Hinweis), Statuszeile, Quellenangabe und die Liste der Orte. Nur Markup, ohne Leaflet und ohne Netzverkehr; die lebendige Karte
 * (Kacheln, Zoom-Schaltflächen, Marker) hängt `initMap` (js/map-vanilla.js) an dieselben Elemente (`.dss-map-canvas`, `.dss-map-load`).
 * Intern: `renderVenueCard` und `renderMap` benutzen es, `initMap` die Teilstücke (`mapPinsMarkup`, `mapCardMarkup`, `mapListMarkup`); kein eigener
 * Export in package.json. Marker, Texte und Ziele laufen durch `esc`/`attr`/`safeHref`.
 */
import { DEFAULT_TILE_URL, mapItems, mapText, placeholderPins, tilesMode, validTileUrl } from '../map.js';
import { attr, esc } from './escape.js';
import { klass, list, num, obj, str } from './core.js';

/** Pins des Platzhalters (Lage in Prozent; das `style`-Attribut setzt `mount`/`initMap` über das CSSOM). */
export const mapPinsMarkup = (pins) =>
  pins
    .map(
      (pin) =>
        `<span class="${klass('dss-map-ph-pin', pin.own && 'is-own', pin.kind === 'seat' && 'is-seat')}" style="left:${pin.x}%;top:${pin.y}%" aria-hidden="true">${esc(pin.number ?? '')}</span>`,
    )
    .join('');

/** Hinweis und Schaltfläche „Karte laden“; ohne `enabled` ist die Schaltfläche gesperrt (es hängt noch kein `initMap` daran). */
export const mapCardMarkup = (privacy, enabled) =>
  `<div class="dss-map-ph-card"><p class="dss-map-note">${esc(privacy)}</p><button type="button" class="dss-btn dss-btn--primary dss-btn--md dss-map-load"${enabled ? '' : ' disabled aria-disabled="true"'}>${esc(mapText.load)}</button></div>`;

/** Einträge der Ortsliste (der Inhalt von `ol.dss-map-list`). */
export const mapListMarkup = (items, showList) =>
  items
    .map((item) => {
      const number =
        item.kind === 'seat'
          ? `<span class="${klass('dss-map-num', 'is-seat', item.own && 'is-own')}" aria-hidden="true"></span>`
          : item.number !== null
            ? `<span class="${klass('dss-map-num', item.own && 'is-own')}" aria-hidden="true">${esc(item.number)}</span>`
            : '';
      const name = item.href ? `<a class="dss-link" href="${attr(item.href)}">${esc(item.label)}</a>` : `<span>${esc(item.label)}</span>`;
      const links =
        showList && item.links.length > 0
          ? `<div class="dss-map-links">${item.links.map((link) => `<a class="dss-link" href="${attr(link.href)}">${esc(link.text)}<span class="dss-sr-only">, ${esc(item.label)}</span></a>`).join('')}</div>`
          : '';
      return (
        `<li class="dss-map-item"${item.number !== null && item.number !== undefined ? ` value="${esc(item.number)}"` : ''}>${number}` +
        `<div class="dss-map-item-body"><p class="dss-map-name">${name}${item.kind === 'seat' ? `<span class="dss-chip">${esc(item.seatText)}</span>` : ''}` +
        `${item.own ? `<span class="dss-chip dss-chip--amber">${esc(mapText.own)}</span>` : ''}</p><p class="dss-map-coords">${esc(item.coords)}</p>${links}</div></li>`
      );
    })
    .join('');

/** Höhe der Karte in Pixeln: 200 bis 2000, ohne Angabe 320. */
export const mapHeightPx = (value) => {
  const height = num(value);
  return height !== undefined ? Math.min(2000, Math.max(200, height)) : 320;
};

/**
 * @param {object} props `markers`, `label`, `height`, `load` (`click`/`auto`), `tileUrl`, `attribution`, `privacyNote`, `appLinks`, `showList`,
 *   `dimInDark`, `darkTiles`, `seatLabel`, `className`, `loadReady` (die Schaltfläche „Karte laden“ ist bedienbar; ohne `initMap` bleibt sie gesperrt)
 * @param {string} uid Basis der ids (Kartenfläche und Text)
 */
export function renderMapView(props, uid) {
  const p = obj(props);
  const markers = list(p.markers);
  const appLinks = Array.isArray(p.appLinks) ? p.appLinks : ['osm', 'route'];
  const showList = p.showList !== false;
  const dimInDark = p.dimInDark !== false;
  const tileUrl = typeof p.tileUrl === 'string' ? p.tileUrl : DEFAULT_TILE_URL;
  const privacy = typeof p.privacyNote === 'string' ? p.privacyNote : mapText.privacy;
  const source = str(p.attribution).trim() || mapText.attribution;
  const items = mapItems(markers, appLinks, { seat: typeof p.seatLabel === 'string' ? p.seatLabel : undefined });
  const pins = placeholderPins(items);
  const state = !validTileUrl(tileUrl) ? 'error' : p.load === 'auto' ? 'loading' : 'idle';
  const status = state === 'error' ? mapText.error : state === 'loading' ? mapText.loading : '';
  const canvasId = `dss-map-canvas-${uid}`;
  const textId = `dss-map-text-${uid}`;

  const pinMarkup = mapPinsMarkup(state === 'error' ? [] : pins);
  const card = state === 'idle' ? mapCardMarkup(privacy, p.loadReady === true) : '';
  const canvas =
    state === 'loading' ? `<div class="dss-map-canvas" id="${attr(canvasId)}" role="group" aria-label="${attr(mapText.canvasHint)}" inert></div>` : '';

  return (
    `<div class="${klass('dss-map', str(p.className))}" data-state="${state}" data-dim="${dimInDark ? 'true' : 'false'}" data-tiles="${tilesMode(p.darkTiles)}" style="--dss-map-h:${mapHeightPx(p.height)}px">` +
    `<a class="dss-map-skip" href="#${attr(textId)}">${esc(mapText.skip)}</a>` +
    `<div class="dss-map-frame" role="region"${typeof p.label === 'string' ? ` aria-label="${attr(p.label)}"` : ''}><div class="dss-map-stage">${canvas}` +
    `<div class="dss-map-ph">${pinMarkup}${card}</div>` +
    `<div class="dss-map-status" role="status">${esc(status)}</div>` +
    `<p class="dss-map-attr"><a href="${attr(mapText.attributionHref)}">${esc(source)}</a></p></div></div>` +
    `<div class="${klass('dss-map-text', !showList && 'is-quiet')}" id="${attr(textId)}" tabindex="-1"><ol class="dss-map-list" aria-label="${attr(mapText.listLabel)}">${mapListMarkup(items, showList)}</ol></div></div>`
  );
}
