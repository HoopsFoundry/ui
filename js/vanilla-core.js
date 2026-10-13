/**
 * DSS Vanilla Core · alles auf einmal starten
 * --------------------------------------------------------------
 * `initAll(scope, options)` findet im Dokument (oder unterhalb von `scope`) alle Elemente mit `data-dss="accordion|pagenav|backtop|theme|tabs|modal|map"` und
 * startet den passenden Baustein darauf. Jeder Baustein folgt dem Muster `initX(root, options) → { destroy() }` (js/lifecycle.js); `initAll`
 * gibt ein Handle zurück, das alle abbaut. Ein zweiter Aufruf ersetzt die frühere Fassung je Element (idempotent). Optionen je Baustein stehen in
 * `options.<name>` oder am Element als JSON in `data-dss-options`. Die Karte (`data-dss="map"`) gehört nicht zum Kern (Leaflet und der
 * Karten-Code liegen im eigenen Bündel dss-map.js): `options.map.start` nimmt `initMapBlock` aus dem Karten-Bündel entgegen; ohne sie bleibt
 * ein Element mit `data-dss="map"` unberührt. Beim Import passiert nichts (kein Auto-Start, kein Zugriff auf `window`/`document`).
 * Typen: js/vanilla-core.d.ts.
 */
import { initAccordion } from './accordion.js';
import { initBackToTop } from './backtop.js';
import { createHandle } from './lifecycle.js';
import { initModal } from './modal.js';
import { initPageNav } from './pagenav.js';
import { initTabs } from './tabs.js';
import { initTheme } from './theme.js';

export { reducedMotion } from './motion.js';
export { safeHref } from './url.js';
export { createHandle } from './lifecycle.js';

const BLOCKS = {
  // `data-dss-acc` bleibt als älterer Weg gültig (initAccordions)
  accordion: { selector: '[data-dss="accordion"], [data-dss-acc]', start: (el, o) => initAccordion(el, o) },
  pagenav: { selector: '[data-dss="pagenav"]', start: (el, o) => initPageNav(el, o) },
  // Auf einem Button wird er übernommen, auf einem anderen Element ist es der Container des Knopfes
  backtop: { selector: '[data-dss="backtop"]', start: (el, o) => initBackToTop(el.tagName === 'BUTTON' ? { ...o, button: el } : { ...o, container: el }) },
  theme: { selector: '[data-dss="theme"]', start: (el, o) => initTheme(el, o) },
  tabs: { selector: '[data-dss="tabs"]', start: (el, o) => initTabs(el, o) },
  modal: { selector: '[data-dss="modal"]', start: (el, o) => initModal(el, o) },
  // Die Karte kommt aus dem eigenen Bündel (dss-map.js): `start` ist `options.map.start` (initMapBlock); ohne sie wird nichts gestartet
  map: { selector: '[data-dss="map"]', start: (el, o, shared) => (typeof shared.start === 'function' ? shared.start(el, o) : null) },
};

/** Namen der Bausteine, die `initAll` kennt. */
export const DSS_BLOCKS = Object.keys(BLOCKS);

const isPlain = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/** Optionen aus `data-dss-options`: JSON-Objekt; Ungültiges, Listen und Schlüssel wie `__proto__` fallen weg. */
export function parseOptions(text) {
  if (typeof text !== 'string' || !text.trim()) return {};
  try {
    const value = JSON.parse(text);
    if (!isPlain(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype'));
  } catch {
    return {};
  }
}

/**
 * Startet alle Bausteine mit `data-dss` unterhalb von `scope` (Standard: das Dokument; ein passendes `scope` selbst zählt mit).
 * `options`: `{ accordion?, pagenav?, backtop?, theme?, tabs?, modal?, map?, only? }`, wobei `only` eine Liste von Namen ist (Standard alle).
 * Gibt `{ destroy(), count }` zurück.
 */
export function initAll(scope, options = {}) {
  if (typeof document === 'undefined') return { ...createHandle(null), count: 0 };
  const host = scope && typeof scope.querySelectorAll === 'function' ? scope : document;
  const opts = isPlain(options) ? options : {};
  const only = Array.isArray(opts.only) ? opts.only : DSS_BLOCKS;
  const handles = [];
  for (const name of DSS_BLOCKS) {
    if (!only.includes(name)) continue;
    const block = BLOCKS[name];
    const found = new Set(host.querySelectorAll(block.selector));
    if (typeof host.matches === 'function' && host.matches(block.selector)) found.add(host);
    const shared = isPlain(opts[name]) ? opts[name] : {};
    for (const el of found) {
      // `start` der Karte ist die Anbindung, keine Option der Karte
      const inherited = name === 'map' ? Object.fromEntries(Object.entries(shared).filter(([key]) => key !== 'start')) : shared;
      const handle = block.start(el, { ...inherited, ...parseOptions(el.getAttribute('data-dss-options')) }, shared);
      if (handle) handles.push(handle);
    }
  }
  const handle = createHandle(() => {
    for (const h of handles.splice(0).reverse()) h.destroy();
  });
  return { destroy: handle.destroy, count: handles.length };
}
