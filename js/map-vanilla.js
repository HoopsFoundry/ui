/**
 * HoopsFoundry UI Map · Karte in Vanilla (`renderMap`, `initMap`, `mountMap`)
 * --------------------------------------------------------------
 * Die Karte (Svelte `Map`, React `MapView`) für Seiten ohne Framework:
 *  - `renderMap(props, options?)` → Markup als Zeichenkette (dasselbe wie `MapView` im Server-Rendering, die Schaltfläche „Karte laden“ ist
 *    bedienbar); kein Leaflet, kein Netzverkehr, läuft auch in Node.
 *  - `initMap(el, options)` → `{ update(props), destroy() }` hängt das Verhalten an vorhandenes Markup (`.hoops-map` in oder an `el`): der
 *    Zwei-Klick-Platzhalter, `load: 'auto'`, Leaflet (Marker, Zoom, Fokus, Tasten), Fehlerzustände mit Statuszeile, Zoom-Schaltflächen.
 *  - `mountMap(el, props, options?)` → `renderMap` einsetzen (Styles über das CSSOM) und `initMap` starten.
 * Leaflet bleibt außerhalb des Bündels: Standard ist `import('leaflet')` erst nach dem Klick (Bundler oder importmap); `options.loadLeaflet`
 * liefert Leaflet aus einer lokalen Datei (`() => import('/vendor/leaflet/leaflet-src.esm.js')` oder `() => Promise.resolve(window.L)`).
 * Der Zustand folgt der Komponente: Platzhalter → Laden → Karte, bei einem Fehler (`tile-url`, `import`, `init`, `update`, `tiles`) Fehlerzustand mit
 * Adresse und Links der Liste; eine neue `tileUrl` versucht es erneut. Alle Eingaben sind unvertraut: Texte laufen durch `esc`/`attr` oder als
 * `textContent`, Ziele durch `safeHref`, Aufzählungen (`load`, `darkTiles`, `appLinks`, `kind`) gegen feste Listen. Beim Import passiert nichts
 * (kein Zugriff auf `window`/`document`). Typen: js/map-vanilla.d.ts.
 */
import { DEFAULT_TILE_URL, mapItems, mapText, placeholderPins, tilesMode, validTileUrl } from './map.js';
import { createMapController, devWarn } from './map-leaflet.js';
import { createRegistry } from './lifecycle.js';
import { attr } from './render/escape.js';
import { insertMarkup, nextUid, fragmentOf, reapplyStyles } from './render/dom.js';
import { mapCardMarkup, mapHeightPx, mapListMarkup, mapPinsMarkup, renderMapView } from './render/map-view.js';
import { list, obj, str, uidFor } from './render/core.js';

// Je Wurzelelement `.hoops-map` (initMap) und je Behälter (mountMap) höchstens eine Fassung; zwei Kopien des Moduls teilen sich das Register
const registry = createRegistry('map');
const noop = () => ({ update() {}, destroy() {} });
const SAFE_ATTRS = ['data-state', 'data-dim', 'data-tiles', 'class'];

/**
 * Markup der Karte (Platzhalter, Region, Liste, Statuszeile) wie `MapView`. `props`: `markers`, `label` (Pflicht), `center`, `zoom`, `height`, `interactive`,
 * `load`, `tileUrl`, `attribution`, `privacyNote`, `appLinks`, `showList`, `dimInDark`, `darkTiles`, `seatLabel`, `className`; `options.uid` legt die Basis der ids fest.
 */
export function renderMap(props, options) {
  const p = obj(props);
  return renderMapView({ ...p, loadReady: true }, uidFor(p, options));
}

const hooksOf = (source, previous = {}) => {
  const o = obj(source);
  const pick = (name) => (typeof o[name] === 'function' ? o[name] : previous[name]);
  return { loadLeaflet: pick('loadLeaflet'), onLoad: pick('onLoad'), onError: pick('onError'), onMarkerClick: pick('onMarkerClick') };
};

/** Ruft eine Funktion der Seite auf; ein Fehler dort darf die Karte nicht kippen. */
const call = (fn, arg) => {
  if (typeof fn !== 'function') return;
  try {
    fn(arg);
  } catch (error) {
    devWarn('[hoops-map] Ein Ereignis-Handler hat einen Fehler geworfen.', error);
  }
};

const zoomIcon = (path) =>
  `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="${path}"></path></svg>`;
const zoomMarkup = (canvasId) =>
  `<div class="hoops-map-zoom" role="group" aria-label="${attr(mapText.zoomGroup)}">` +
  `<button type="button" class="hoops-map-zoom-btn" aria-label="${attr(mapText.zoomIn)}" aria-controls="${attr(canvasId)}">${zoomIcon('M10 4v12M4 10h12')}</button>` +
  `<button type="button" class="hoops-map-zoom-btn" aria-label="${attr(mapText.zoomOut)}" aria-controls="${attr(canvasId)}">${zoomIcon('M4 10h12')}</button></div>`;

/** Hängt die Karte an `root` (ein Element `.hoops-map`). `restore`: `destroy` stellt das Markup vom Beginn wieder her. */
function attach(root, options, { restore }) {
  // Zuerst die frühere Fassung abbauen: ihr destroy ersetzt die Kinder von `root`; Knoten dürfen erst danach gelesen werden
  registry.release(root);
  const doc = root.ownerDocument;
  const stage = root.querySelector('.hoops-map-stage');
  if (!stage) {
    devWarn('[hoops-map] initMap: im Element fehlt das Markup der Karte (.hoops-map-stage); renderMap erzeugt es.');
    return noop();
  }
  // Markup vom Server: eine Seite mit `style-src 'self'` blockiert dessen style-Attribute; über das CSSOM gelten Höhe und Pins trotzdem
  if (restore) reapplyStyles(root);

  let props = obj(options);
  let hooks = hooksOf(props);
  const has = (key) => props[key] !== undefined;
  const pristine = restore ? [...root.childNodes].map((node) => node.cloneNode(true)) : [];
  const restoreAttributes = (() => {
    const before = SAFE_ATTRS.map((name) => [name, root.hasAttribute(name) ? root.getAttribute(name) : null]);
    return () => {
      for (const [name, value] of before) {
        if (value === null) root.removeAttribute(name);
        else if (root.getAttribute(name) !== value) root.setAttribute(name, value);
      }
    };
  })();
  const heightBefore = root.style.getPropertyValue('--hoops-map-h');

  const textId = root.querySelector('.hoops-map-text')?.id ?? '';
  const canvasId = root.querySelector('.hoops-map-canvas')?.id || (textId.startsWith('hoops-map-text-') ? `hoops-map-canvas-${textId.slice(13)}` : `hoops-map-canvas-${nextUid()}`);

  const markupState = root.getAttribute('data-state');
  let phase = props.load === 'auto' || (props.load === undefined && markupState === 'loading') ? 'loading' : 'idle';
  let failure = null;
  let zoomNow = { zoom: 0, min: 0, max: 99 };
  let userStarted = false;
  let controller = null;
  let active = null;
  let destroyed = false;
  let syncing = false;
  let dirty = false;
  let lastPins = null;
  let lastList = null;
  let appliedClass = [];
  let warnedUrl = null;

  const tileUrlOf = (p) => (typeof p.tileUrl === 'string' ? p.tileUrl : DEFAULT_TILE_URL);
  const controllerOptions = () => ({
    markers: list(props.markers),
    appLinks: Array.isArray(props.appLinks) ? props.appLinks : ['osm', 'route'],
    center: props.center,
    zoom: props.zoom,
    interactive: props.interactive !== false,
    tileUrl: tileUrlOf(props),
    seatLabel: typeof props.seatLabel === 'string' ? props.seatLabel : undefined,
  });

  const focusedIn = (node) => {
    const rootNode = typeof root.getRootNode === 'function' ? root.getRootNode() : doc;
    const current = (rootNode && rootNode.activeElement) || doc.activeElement;
    return current && node.contains(current) ? current : null;
  };

  /** Ersetzt die Einträge der Liste; steht der Fokus in einem Link, bekommt der Link an derselben Stelle ihn zurück. */
  const replaceList = (ol, html) => {
    const current = focusedIn(ol);
    let memo = null;
    if (current) {
      const item = current.closest('li');
      if (item) memo = { item: [...ol.children].indexOf(item), link: [...item.querySelectorAll('a')].indexOf(current) };
    }
    insertMarkup(ol, html);
    if (memo && memo.item >= 0 && memo.link >= 0) ol.children[memo.item]?.querySelectorAll('a')[memo.link]?.focus({ preventScroll: true });
  };

  const applyClass = (value) => {
    const next = value.split(/\s+/).filter(Boolean);
    root.classList.remove(...appliedClass.filter((name) => !next.includes(name) && name !== 'hoops-map'));
    root.classList.add(...next);
    appliedClass = next;
  };

  const startController = (canvas) => {
    const token = {};
    active = token;
    const live = (fn) => (arg) => {
      if (destroyed || active !== token) return;
      fn(arg);
    };
    controller = createMapController(canvas, controllerOptions(), {
      loadLeaflet: hooks.loadLeaflet,
      onReady: live((map) => {
        phase = 'ready';
        call(hooks.onLoad, map);
        sync();
      }),
      onError: live((reason) => {
        failure = reason;
        call(hooks.onError, reason);
        sync();
      }),
      onZoom: live((z) => {
        zoomNow = z;
        sync();
      }),
      onMarkerClick: live((item) => call(hooks.onMarkerClick, item)),
    });
  };

  const paint = () => {
    const tileUrl = tileUrlOf(props);
    const urlOk = validTileUrl(tileUrl);
    const state = !urlOk || failure ? 'error' : phase;
    const running = state === 'loading' || state === 'ready';
    if (!urlOk && warnedUrl !== tileUrl) {
      warnedUrl = tileUrl;
      devWarn(`[hoops-map] Ungültige tileUrl: ${tileUrl}. Erwartet wird eine Adresse mit {z}, {x} und {y} über https, ein Pfad ab Wurzel oder http://localhost.`);
    }
    const showList = props.showList !== false;
    const privacy = typeof props.privacyNote === 'string' ? props.privacyNote : mapText.privacy;
    const items = mapItems(list(props.markers), Array.isArray(props.appLinks) ? props.appLinks : ['osm', 'route'], { seat: typeof props.seatLabel === 'string' ? props.seatLabel : undefined });

    root.setAttribute('data-state', state);
    if (has('dimInDark')) root.setAttribute('data-dim', props.dimInDark !== false ? 'true' : 'false');
    if (has('darkTiles')) root.setAttribute('data-tiles', tilesMode(props.darkTiles));
    if (has('height')) root.style.setProperty('--hoops-map-h', `${mapHeightPx(props.height)}px`);
    if (has('className')) applyClass(str(props.className));
    if (has('label')) root.querySelector('.hoops-map-frame')?.setAttribute('aria-label', str(props.label));
    if (has('attribution')) {
      const link = stage.querySelector('.hoops-map-attr a');
      if (link) link.textContent = str(props.attribution).trim() || mapText.attribution;
    }

    // Kartenfläche und Controller: laufen nur im Zustand „loading“ oder „ready“
    let canvas = stage.querySelector('.hoops-map-canvas');
    if (running) {
      if (!canvas) {
        canvas = doc.createElement('div');
        canvas.className = 'hoops-map-canvas';
        canvas.id = canvasId;
        canvas.setAttribute('role', 'group');
        canvas.setAttribute('aria-label', mapText.canvasHint);
        stage.insertBefore(canvas, stage.firstChild);
      }
      if (state === 'loading') canvas.setAttribute('inert', '');
      else canvas.removeAttribute('inert');
      if (!controller) startController(canvas);
    } else {
      if (controller) {
        active = null;
        controller.destroy();
        controller = null;
      }
      canvas?.remove();
      canvas = null;
    }

    // Platzhalter: Pins, Hinweis und Schaltfläche; mit der Karte entfällt er
    let ph = stage.querySelector('.hoops-map-ph');
    if (state === 'ready') {
      ph?.remove();
    } else {
      if (!ph) {
        ph = doc.createElement('div');
        ph.className = 'hoops-map-ph';
        stage.insertBefore(ph, canvas ? canvas.nextSibling : stage.firstChild);
      }
      if (has('markers') || state === 'error') {
        const pinsHtml = mapPinsMarkup(state === 'error' ? [] : placeholderPins(items));
        if (pinsHtml !== lastPins) {
          for (const pin of ph.querySelectorAll('.hoops-map-ph-pin')) pin.remove();
          const holder = doc.createElement('div');
          insertMarkup(holder, pinsHtml);
          ph.prepend(...holder.childNodes);
          lastPins = pinsHtml;
        }
      }
      let card = ph.querySelector('.hoops-map-ph-card');
      if (state === 'idle') {
        let created = false;
        if (!card) {
          ph.append(fragmentOf(doc, mapCardMarkup(privacy, true)));
          card = ph.querySelector('.hoops-map-ph-card');
          created = true;
        }
        if (created || has('privacyNote')) {
          const note = card.querySelector('.hoops-map-note');
          if (note) note.textContent = privacy;
        }
        // Mit initMap ist die Schaltfläche bedienbar (renderVenueCard liefert sie ohne Anbindung gesperrt)
        const button = card.querySelector('.hoops-map-load');
        button?.removeAttribute('disabled');
        button?.removeAttribute('aria-disabled');
      } else {
        card?.remove();
      }
    }

    // Zoom-Schaltflächen: nur mit der Karte, aria-disabled an den Grenzen (nie `disabled`: der Fokus bleibt)
    let zoom = stage.querySelector('.hoops-map-zoom');
    if (state === 'ready') {
      if (!zoom) {
        const fragment = fragmentOf(doc, zoomMarkup(canvasId));
        zoom = fragment.firstChild;
        stage.insertBefore(fragment, stage.querySelector('.hoops-map-status'));
      }
      const [zoomIn, zoomOut] = zoom.querySelectorAll('.hoops-map-zoom-btn');
      const setDisabled = (button, off) => (off ? button.setAttribute('aria-disabled', 'true') : button.removeAttribute('aria-disabled'));
      if (zoomIn) setDisabled(zoomIn, !(zoomNow.zoom < zoomNow.max));
      if (zoomOut) setDisabled(zoomOut, !(zoomNow.zoom > zoomNow.min));
    } else {
      zoom?.remove();
    }

    const status = state === 'error' ? mapText.error : state === 'loading' ? mapText.loading : '';
    const statusEl = stage.querySelector('.hoops-map-status');
    if (statusEl && statusEl.textContent !== status) statusEl.textContent = status;

    // Liste der Orte (die Textalternative): nur ersetzen, wenn sich das Markup ändert
    if (has('showList')) root.querySelector('.hoops-map-text')?.classList.toggle('is-quiet', !showList);
    if (has('markers')) {
      const html = mapListMarkup(items, showList);
      const ol = root.querySelector('.hoops-map-list');
      if (ol && html !== lastList) {
        replaceList(ol, html);
        lastList = html;
      }
    }

    // Nach „Karte laden“ liegt der Fokus auf der Kartenfläche, sobald sie nicht mehr inert ist (die Schaltfläche ist verschwunden)
    if (state === 'ready' && userStarted && canvas) {
      userStarted = false;
      canvas.focus({ preventScroll: true });
    }
  };

  const sync = () => {
    if (destroyed) return;
    if (syncing) {
      dirty = true;
      return;
    }
    syncing = true;
    try {
      do {
        dirty = false;
        paint();
      } while (dirty && !destroyed);
    } finally {
      syncing = false;
    }
  };

  const onClick = (event) => {
    const target = event.target && typeof event.target.closest === 'function' ? event.target.closest('.hoops-map-load, .hoops-map-zoom-btn') : null;
    if (!target || !root.contains(target)) return;
    if (target.classList.contains('hoops-map-load')) {
      if (phase !== 'idle' || failure || !validTileUrl(tileUrlOf(props))) return;
      userStarted = true;
      phase = 'loading';
      sync();
      return;
    }
    if (target.getAttribute('aria-disabled') === 'true' || !controller) return;
    const buttons = [...(target.parentNode?.children ?? [])];
    if (buttons.indexOf(target) === 0) controller.zoomIn();
    else controller.zoomOut();
  };
  root.addEventListener('click', onClick);

  const handle = registry.claim(root, () => {
    destroyed = true;
    active = null;
    controller?.destroy();
    controller = null;
    root.removeEventListener('click', onClick);
    if (restore) {
      root.replaceChildren(...pristine);
      restoreAttributes();
      if (heightBefore) root.style.setProperty('--hoops-map-h', heightBefore);
      else root.style.removeProperty('--hoops-map-h');
    }
  });

  sync();

  return {
    update(next) {
      if (destroyed) return;
      const before = tileUrlOf(props);
      // Teilweise Eigenschaften: Angegebenes ersetzt, `undefined` wird ignoriert, `null` nimmt die Eigenschaft zurück (es gilt wieder der Standard).
      // Nie ein stiller Rückfall: fehlt `tileUrl`, bleibt die bisherige Adresse (kein Kachelabruf beim Standardserver)
      const merged = { ...props };
      for (const [key, value] of Object.entries(obj(next))) {
        if (value === undefined) continue;
        if (value === null) delete merged[key];
        else merged[key] = value;
      }
      props = merged;
      hooks = hooksOf(obj(next), hooks);
      // Neue Kachel-Adresse: ein früherer Fehler gilt nicht mehr, die Karte versucht es erneut
      if (tileUrlOf(props) !== before) failure = null;
      const had = controller;
      sync();
      if (controller && controller === had) controller.update(controllerOptions());
    },
    destroy: handle.destroy,
  };
}

/** Das Wurzelelement `.hoops-map` an oder unter `el`. */
const rootOf = (el) => (typeof el.matches === 'function' && el.matches('.hoops-map') ? el : el.querySelector('.hoops-map'));

/**
 * Macht vorhandenes Markup lebendig: `el` ist das Element `.hoops-map` (von `renderMap`) oder ein Vorfahr (die Hallenkarte, ein Behälter).
 * `options`: die Eigenschaften wie bei `renderMap` (`markers` ist nötig; `label`, `height`, `showList` … ändern das Markup nur, wenn sie angegeben sind)
 * plus `loadLeaflet`, `onLoad`, `onError`, `onMarkerClick`. Ein zweiter Aufruf für dasselbe Element ersetzt den ersten.
 */
export function initMap(el, options) {
  if (typeof document === 'undefined' || !el || typeof el.querySelector !== 'function') return noop();
  const root = rootOf(el);
  if (!root) {
    devWarn('[hoops-map] initMap: kein Element .hoops-map gefunden.');
    return noop();
  }
  return attach(root, options, { restore: true });
}

/**
 * Setzt `renderMap(props)` in `el` ein und startet `initMap`. `options`: `uid`, `loadLeaflet`, `onLoad`, `onError`, `onMarkerClick`.
 * `update(partial)` aktualisiert Marker, Mitte, Zoom, Kachel-Adresse und Texte, ohne die Karte neu aufzubauen (nur Angegebenes ändert sich;
 * `null` nimmt eine Eigenschaft zurück); `destroy()` räumt Karte,
 * Listener und Beobachter auf und stellt den früheren Inhalt von `el` wieder her.
 */
export function mountMap(el, props, options) {
  if (typeof document === 'undefined' || !el || typeof el.replaceChildren !== 'function') return noop();
  registry.release(el);
  const o = obj(options);
  const uid = typeof o.uid === 'string' && o.uid.replace(/[^A-Za-z0-9_-]/g, '') ? o.uid : nextUid();
  const p = obj(props);
  const original = [...el.childNodes];
  insertMarkup(el, renderMap(p, { uid }));
  const root = el.querySelector('.hoops-map');
  const hooks = hooksOf(o);
  const inner = attach(root, { ...p, loadLeaflet: p.loadLeaflet ?? hooks.loadLeaflet, onLoad: p.onLoad ?? hooks.onLoad, onError: p.onError ?? hooks.onError, onMarkerClick: p.onMarkerClick ?? hooks.onMarkerClick }, { restore: false });
  const handle = registry.claim(el, () => {
    inner.destroy();
    el.replaceChildren(...original);
  });
  return { update: (next) => inner.update(next), destroy: handle.destroy };
}

/**
 * Anbindung für `initAll` (`data-hoops="map"`): ein Element mit Karten-Markup wird per `initMap` gestartet, ein leerer Behälter per `mountMap`
 * (die Eigenschaften stehen in `data-hoops-options`).
 */
export function initMapBlock(el, options) {
  if (typeof document === 'undefined' || !el || typeof el.querySelector !== 'function') return noop();
  return rootOf(el) ? initMap(el, options) : mountMap(el, options);
}
