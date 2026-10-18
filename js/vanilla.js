/**
 * HoopsFoundry UI Vanilla · Einstieg des gebündelten Pakets (dist/vanilla/hoops.js)
 * --------------------------------------------------------------
 * Alles, was ein Projekt ohne Framework braucht, in einer Datei: `initAll` (per `data-hoops`), die einzelnen `initX`, Hilfen (`safeHref`,
 * `reducedMotion`, `themeBootScript`) und die reinen Funktionen hinter Tastatur und Sprung. Beim Import passiert nichts (kein Auto-Start, kein Zugriff auf
 * `window`/`document`), die Datei lädt auch in Node. Leaflet und die Karte gehören nicht dazu (js/map-leaflet.js lädt Leaflet erst bei Bedarf,
 * `initMap` folgt in V2). Typen: js/vanilla.d.ts. Der Build (scripts/build-vanilla.mjs) setzt `__HOOPS_VERSION__` aus der package.json.
 */
export { initAll, HOOPS_BLOCKS, parseOptions } from './vanilla-core.js';
export { createHandle } from './lifecycle.js';
export { safeHref } from './url.js';
export { reducedMotion } from './motion.js';
export { initAccordion, initAccordions, nextHeader, hashTarget, revealAround, scrollToElement } from './accordion.js';
export { initPageNav, slug } from './pagenav.js';
export { initBackToTop } from './backtop.js';
export { initTheme, themeBootScript, parseTheme, resolveTheme, nextTheme, readTheme, writeTheme, THEME_KEY, THEME_ATTRIBUTE } from './theme.js';
export { initTabs, nextTab, initialTab, TAB_EVENT } from './tabs.js';
export { initModal, openModal, closeModal, focusables, MODAL_OPEN_EVENT, MODAL_CLOSE_EVENT } from './modal.js';
// Sprache und Texte (siehe js/i18n/index.js). Der Kern liegt nur in diesem Bündel: hoops-render.js, hoops-map.js und hoops-i18n-de.js importieren ihn von hier
// (eine Instanz auf der Seite). `localeOf` und `onLocaleChange` sind für diese Bündel; `onLocaleChange(fn)` hört auf das Ereignis `hoops:localechange`.
export { setLocale, getLocale, registerLocale, setTexts, t, availableLocales, localeOf } from './i18n/index.js';
export { onLocaleChange, LOCALE_EVENT } from './i18n-events.js';

/** Version des Pakets, aus dem dieses Bündel gebaut wurde (im Quelltext ohne Build `dev`). */
// eslint-disable-next-line no-undef
export const VERSION = typeof __HOOPS_VERSION__ === 'string' ? __HOOPS_VERSION__ : 'dev';

/** Die Version des geladenen Stylesheets (`hoops.css` setzt `--hoops-version` auf `:root`) oder `null`, wenn es fehlt. */
export function cssVersion(doc) {
  const d = doc ?? (typeof document === 'undefined' ? null : document);
  const win = d?.defaultView;
  if (!d?.documentElement || !win?.getComputedStyle) return null;
  const raw = win.getComputedStyle(d.documentElement).getPropertyValue('--hoops-version').trim().replace(/^["']|["']$/g, '');
  return raw || null;
}

/**
 * Vergleicht JS und CSS: `{ js, css, match }`; `css` ist `null`, wenn `hoops.css` nicht (aus demselben Paket) geladen ist.
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
      ? `HoopsFoundry UI: hoops.css ist nicht geladen (JavaScript ${VERSION}). Binde hoops.css aus demselben Paket ein.`
      : `HoopsFoundry UI: JavaScript ${VERSION} und CSS ${css} passen nicht zusammen. Kopiere hoops.js und hoops.css aus derselben Version.`);
  }
  return result;
}
