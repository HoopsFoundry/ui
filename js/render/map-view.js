/**
 * HoopsFoundry UI Render · Karte als Markup (Platzhalter, Liste, Statuszeile)
 * --------------------------------------------------------------
 * Das Markup von `MapView` (React) und `Map` (Svelte) im Zustand vor dem Laden: Sprunglink, Region mit Platzhalter (Pins und Zwei-Klick-Karte
 * mit Hinweis), Statuszeile, Quellenangabe und die Liste der Orte. Nur Markup, ohne Leaflet und ohne Netzverkehr; die lebendige Karte
 * (Kacheln, Zoom-Schaltflächen, Marker) hängt `initMap` (js/map-vanilla.js) an dieselben Elemente (`.hoops-map-canvas`, `.hoops-map-load`).
 * Intern: `renderVenueCard` und `renderMap` benutzen es, `initMap` die Teilstücke (`mapPinsMarkup`, `mapCardMarkup`, `mapListMarkup`); kein eigener
 * Export in package.json. Marker, Texte und Ziele laufen durch `esc`/`attr`/`safeHref`.
 */
import { DEFAULT_TILE_URL, mapItems, mapString, mapText, placeholderPins, tilesMode, validTileUrl } from '../map.js';
import { attr, esc } from './escape.js';
import { klass, list, num, obj, str, withLang } from './core.js';

/** Pins des Platzhalters (Lage in Prozent; das `style`-Attribut setzt `mount`/`initMap` über das CSSOM). */
export const mapPinsMarkup = (pins) =>
  pins
    .map(
      (pin) =>
        `<span class="${klass('hoops-map-ph-pin', pin.own && 'is-own', pin.kind === 'seat' && 'is-seat')}" style="left:${pin.x}%;top:${pin.y}%" aria-hidden="true">${esc(pin.number ?? '')}</span>`,
    )
    .join('');

/** Hinweis und Schaltfläche „Karte laden“; ohne `enabled` ist die Schaltfläche gesperrt (es hängt noch kein `initMap` daran). */
export const mapCardMarkup = (privacy, enabled, options) =>
  `<div class="hoops-map-ph-card"><p class="hoops-map-note">${esc(privacy)}</p><button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md hoops-map-load"${enabled ? '' : ' disabled aria-disabled="true"'}>${esc(mapString('load', options))}</button></div>`;

/** Karte mit der Schaltfläche „Erneut versuchen“ (Fehlerzustand nach einem Ladefehler; gehört zu `initMap`). */
export const mapRetryMarkup = (options) =>
  `<div class="hoops-map-ph-card"><button type="button" class="hoops-btn hoops-btn--primary hoops-btn--md hoops-map-retry">${esc(mapString('retry', options))}</button></div>`;

/** Einträge der Ortsliste (der Inhalt von `ol.hoops-map-list`). */
export const mapListMarkup = (items, showList, options) =>
  items
    .map((item) => {
      const number =
        item.kind === 'seat'
          ? `<span class="${klass('hoops-map-num', 'is-seat', item.own && 'is-own')}" aria-hidden="true"></span>`
          : item.number !== null
            ? `<span class="${klass('hoops-map-num', item.own && 'is-own')}" aria-hidden="true">${esc(item.number)}</span>`
            : '';
      const name = item.href ? `<a class="hoops-link" href="${attr(item.href)}">${esc(item.label)}</a>` : `<span>${esc(item.label)}</span>`;
      const links =
        showList && item.links.length > 0
          ? `<div class="hoops-map-links">${item.links.map((link) => `<a class="hoops-link" href="${attr(link.href)}">${esc(link.text)}<span class="hoops-sr-only">, ${esc(item.label)}</span></a>`).join('')}</div>`
          : '';
      return (
        `<li class="hoops-map-item"${item.number !== null && item.number !== undefined ? ` value="${esc(item.number)}"` : ''}>${number}` +
        `<div class="hoops-map-item-body"><p class="hoops-map-name">${name}${item.kind === 'seat' ? `<span class="hoops-chip">${esc(item.seatText)}</span>` : ''}` +
        `${item.own ? `<span class="hoops-chip hoops-chip--amber">${esc(mapString('own', options))}</span>` : ''}</p><p class="hoops-map-coords">${esc(item.coords)}</p>${links}</div></li>`
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
 * @param {{ locale?: string, texts?: object, documentLang?: string }} [options] Sprache und Texte (siehe js/i18n/index.js)
 */
export function renderMapView(props, uid, options) {
  const p = obj(props);
  const markers = list(p.markers);
  const appLinks = Array.isArray(p.appLinks) ? p.appLinks : ['osm', 'route'];
  const showList = p.showList !== false;
  const dimInDark = p.dimInDark !== false;
  const tileUrl = typeof p.tileUrl === 'string' ? p.tileUrl : DEFAULT_TILE_URL;
  const privacy = typeof p.privacyNote === 'string' ? p.privacyNote : mapString('privacy', options);
  const source = str(p.attribution).trim() || mapString('attribution', options);
  const items = mapItems(markers, appLinks, { seat: typeof p.seatLabel === 'string' ? p.seatLabel : undefined }, options);
  const pins = placeholderPins(items);
  const state = !validTileUrl(tileUrl) ? 'error' : p.load === 'auto' ? 'loading' : 'idle';
  const status = state === 'error' ? mapString('error', options) : state === 'loading' ? mapString('loading', options) : '';
  const canvasId = `hoops-map-canvas-${uid}`;
  const textId = `hoops-map-text-${uid}`;

  const pinMarkup = mapPinsMarkup(state === 'error' ? [] : pins);
  const card = state === 'idle' ? mapCardMarkup(privacy, p.loadReady === true, options) : '';
  const canvas =
    state === 'loading' ? `<div class="hoops-map-canvas" id="${attr(canvasId)}" role="group" aria-label="${attr(mapString('canvasHint', options))}" inert></div>` : '';

  return withLang(
    `<div class="${klass('hoops-map', str(p.className))}" data-state="${state}" data-dim="${dimInDark ? 'true' : 'false'}" data-tiles="${tilesMode(p.darkTiles)}" style="--hoops-map-h:${mapHeightPx(p.height)}px">` +
    `<a class="hoops-map-skip" href="#${attr(textId)}">${esc(mapString('skip', options))}</a>` +
    `<div class="hoops-map-frame" role="region"${typeof p.label === 'string' ? ` aria-label="${attr(p.label)}"` : ''}><div class="hoops-map-stage">${canvas}` +
    `<div class="hoops-map-ph">${pinMarkup}${card}</div>` +
    `<div class="hoops-map-status" role="status">${esc(status)}</div>` +
    `<p class="hoops-map-attr"><a href="${attr(mapText.attributionHref)}">${esc(source)}</a></p></div></div>` +
    `<div class="${klass('hoops-map-text', !showList && 'is-quiet')}" id="${attr(textId)}" tabindex="-1"><ol class="hoops-map-list" aria-label="${attr(mapString('listLabel', options))}">${mapListMarkup(items, showList, options)}</ol></div></div>`,
    options,
  );
}
