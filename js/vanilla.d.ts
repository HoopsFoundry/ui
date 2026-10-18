export { initAll, HOOPS_BLOCKS, parseOptions } from './vanilla-core.js';
export type { HoopsBlockName, InitAllOptions, InitAllHandle } from './vanilla-core.js';
export { createHandle } from './lifecycle.js';
export type { HoopsHandle } from './lifecycle.js';
export { safeHref } from './url.js';
export { reducedMotion } from './motion.js';
export { initAccordion, initAccordions, nextHeader, hashTarget, revealAround, scrollToElement } from './accordion.js';
export type { AccordionOptions, AccordionHandle } from './accordion.js';
export { initPageNav, slug } from './pagenav.js';
export type { PageNavOptions } from './pagenav.js';
export { initBackToTop } from './backtop.js';
export type { BackToTopOptions } from './backtop.js';
export { initTheme, themeBootScript, parseTheme, resolveTheme, nextTheme, readTheme, writeTheme, THEME_KEY, THEME_ATTRIBUTE } from './theme.js';
export type { ThemeOptions, ThemeHandle, ThemeMode, ThemeState } from './theme.js';
export { initTabs, nextTab, initialTab, TAB_EVENT } from './tabs.js';
export type { TabsOptions, TabsHandle, TabChangeDetail } from './tabs.js';
export { setLocale, getLocale, registerLocale, setTexts, t, availableLocales, localeOf } from './i18n/index.js';
export type { Catalog, CatalogValue, PluralObject, Params, TOptions } from './i18n/index.js';
export { onLocaleChange, LOCALE_EVENT } from './i18n-events.js';
export { initModal, openModal, closeModal, focusables, MODAL_OPEN_EVENT, MODAL_CLOSE_EVENT } from './modal.js';
export type { ModalOptions, ModalHandle, ModalOpenDetail, ModalCloseDetail, ModalCloseReason } from './modal.js';

/** Version des Pakets, aus dem dieses Bündel gebaut wurde (im Quelltext ohne Build `dev`). */
export const VERSION: string;
/** Die Version des geladenen Stylesheets (`hoops.css` setzt `--hoops-version` auf `:root`) oder `null`, wenn es fehlt. */
export function cssVersion(doc?: Document | null): string | null;
/** Vergleicht JS und CSS; `css` ist `null`, wenn `hoops.css` nicht geladen ist. Mit `warn: true` meldet `console.warn` eine Abweichung. */
export function checkVersion(doc?: Document | null, options?: { warn?: boolean }): { js: string; css: string | null; match: boolean };
export function checkVersion(options: { warn?: boolean }): { js: string; css: string | null; match: boolean };
