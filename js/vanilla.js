/**
 * DSS Vanilla · Einstieg des gebündelten Pakets (dist/vanilla/dss.js)
 * --------------------------------------------------------------
 * Alles, was ein Projekt ohne Framework braucht, in einer Datei: `initAll` (per `data-dss`), die einzelnen `initX`, Hilfen (`safeHref`,
 * `reducedMotion`, `themeBootScript`) und die reinen Funktionen hinter Tastatur und Sprung. Beim Import passiert nichts (kein Auto-Start, kein Zugriff auf
 * `window`/`document`), die Datei lädt auch in Node. Leaflet und die Karte gehören nicht dazu (js/map-leaflet.js lädt Leaflet erst bei Bedarf,
 * `initMap` folgt in V2). Typen: js/vanilla.d.ts. Der Build (scripts/build-vanilla.mjs) setzt `__DSS_VERSION__` aus der package.json.
 */
export { initAll, DSS_BLOCKS, parseOptions } from './vanilla-core.js';
export { createHandle } from './lifecycle.js';
export { safeHref } from './url.js';
export { reducedMotion } from './motion.js';
export { initAccordion, initAccordions, nextHeader, hashTarget, revealAround, scrollToElement } from './accordion.js';
export { initPageNav, slug } from './pagenav.js';
export { initBackToTop } from './backtop.js';
export { initTheme, themeBootScript, parseTheme, resolveTheme, nextTheme, readTheme, writeTheme, THEME_KEY, THEME_ATTRIBUTE, THEME_LABEL } from './theme.js';
export { initTabs, nextTab, initialTab, TAB_EVENT } from './tabs.js';
export { initModal, openModal, closeModal, focusables, MODAL_OPEN_EVENT, MODAL_CLOSE_EVENT } from './modal.js';

/** Version des Pakets, aus dem dieses Bündel gebaut wurde (im Quelltext ohne Build `dev`). */
// eslint-disable-next-line no-undef
export const VERSION = typeof __DSS_VERSION__ === 'string' ? __DSS_VERSION__ : 'dev';

/** Die Version des geladenen Stylesheets (`dss.css` setzt `--dss-version` auf `:root`) oder `null`, wenn es fehlt. */
export function cssVersion(doc) {
  const d = doc ?? (typeof document === 'undefined' ? null : document);
  const win = d?.defaultView;
  if (!d?.documentElement || !win?.getComputedStyle) return null;
  const raw = win.getComputedStyle(d.documentElement).getPropertyValue('--dss-version').trim().replace(/^["']|["']$/g, '');
  return raw || null;
}

/**
 * Vergleicht JS und CSS: `{ js, css, match }`; `css` ist `null`, wenn `dss.css` nicht (aus demselben Paket) geladen ist.
 * Aufruf `checkVersion(doc?, { warn })` oder `checkVersion({ warn })`: mit `warn: true` meldet `console.warn` eine Abweichung oder ein fehlendes Stylesheet.
 */
export function checkVersion(docOrOptions, maybeOptions) {
  const isOptions = docOrOptions && typeof docOrOptions === 'object' && !('documentElement' in docOrOptions);
  const doc = isOptions ? undefined : docOrOptions;
  const options = (isOptions ? docOrOptions : maybeOptions) ?? {};
  const css = cssVersion(doc);
  const result = { js: VERSION, css, match: css !== null && css === VERSION };
  if (options.warn === true && !result.match) {
    console.warn(css === null
      ? `DSS: dss.css ist nicht geladen (JavaScript ${VERSION}). Binde dss.css aus demselben Paket ein.`
      : `DSS: JavaScript ${VERSION} und CSS ${css} passen nicht zusammen. Kopiere dss.js und dss.css aus derselben Version.`);
  }
  return result;
}
