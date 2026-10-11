/**
 * DSS BackToTop · Nach-oben-Knopf
 * --------------------------------------------------------------
 * `initBackToTop(options)` legt einen runden Knopf unten rechts an (44 px, Symbol als SVG per createElementNS, kein `innerHTML`), der
 * erscheint, sobald die Seite mehr als zwei Fensterhöhen lang ist und man ein Stück gescrollt hat. Ein Klick scrollt nach oben (sanft, außer bei
 * „Bewegung reduzieren“ oder `data-motion="reduce"`) und setzt den Fokus auf die erste `h1`, sonst auf `main`. Lage über Tokens im CSS
 * (`--dss-backtop-offset`, `env(safe-area-inset-*)`, `--dss-z-backtop`); eine feste `dss-bnav` darunter wird erkannt und umgangen.
 * Rückgabe `{ destroy() }`. ES-Modul ohne Auto-Start, kein Zugriff auf `window`/`document` beim Import.
 * Typen: js/backtop.d.ts.
 */
import { createCleanups, createRegistry, emptyHandle, listen } from './lifecycle.js';
import { reducedMotion } from './motion.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULTS = { label: 'Nach oben', showAfter: 480, gap: 16, avoid: '.dss-bnav' };
const registry = createRegistry();

/** Pfeil nach oben als SVG (aria-hidden), mit DOM-Aufrufen erzeugt. */
function arrow(doc) {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  for (const [name, value] of Object.entries({ width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(name, value);
  const path = doc.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M12 19V5M5 12l7-7 7 7');
  svg.append(path);
  return svg;
}

/** Sichtbar? Die Seite ist höher als zwei Fenster und wurde mehr als `showAfter` Pixel gescrollt. */
export function backTopVisible({ scrollY, innerHeight, scrollHeight, showAfter = DEFAULTS.showAfter }) {
  return scrollHeight > innerHeight * 2 && scrollY > showAfter;
}

/**
 * Nach-oben-Knopf. Optionen: `label` (Name des Knopfes, Standard „Nach oben“; auch `backLabel`), `container` (Element oder Auswahl, in den der
 * Knopf kommt, Standard `body`), `button` (vorhandener Knopf, der übernommen wird, statt einen anzulegen), `showAfter` (Pixel, Standard 480),
 * `target` (Auswahl des Fokusziels, Standard `h1`; Rückfall `main`), `avoid` (Auswahl einer festen unteren Leiste, über der der Knopf bleibt,
 * Standard `.dss-bnav`; `null` schaltet das ab), `offset` (zusätzlicher Abstand von unten, CSS-Länge, setzt `--dss-backtop-offset`).
 */
export function initBackToTop(options = {}) {
  if (typeof document === 'undefined') return emptyHandle();
  const opts = options && typeof options === 'object' ? options : {};
  const doc = opts.button?.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  const container = typeof opts.container === 'string' ? doc.querySelector(opts.container) : opts.container;
  const host = container && typeof container.append === 'function' ? container : doc.body;
  const key = opts.button ?? host;
  if (!key) return emptyHandle();
  registry.release(key);

  const label = [opts.label, opts.backLabel].find((v) => typeof v === 'string' && v.trim())?.trim() ?? DEFAULTS.label;
  const showAfter = Number.isFinite(opts.showAfter) && opts.showAfter >= 0 ? opts.showAfter : DEFAULTS.showAfter;
  const targetSelector = typeof opts.target === 'string' && opts.target.trim() ? opts.target : 'h1';
  const avoid = opts.avoid === null ? null : typeof opts.avoid === 'string' ? opts.avoid : DEFAULTS.avoid;

  const adopted = Boolean(opts.button);
  const button = adopted ? opts.button : doc.createElement('button');
  const before = { hidden: button.hidden, type: button.getAttribute('type'), label: button.getAttribute('aria-label'), cls: button.className, offset: button.style.getPropertyValue('--dss-backtop-offset') };
  if (!adopted) {
    button.type = 'button';
    button.className = 'dss-btn dss-btn--secondary dss-btn--icon dss-backtop';
    button.append(arrow(doc));
  } else {
    button.classList.add('dss-backtop');
    if (!button.querySelector('svg')) button.append(arrow(doc));
  }
  button.setAttribute('aria-label', label);
  button.hidden = true;
  if (!adopted) host.append(button);

  const cleanups = createCleanups();
  const added = new Set(); // Ziele, denen wir tabindex gegeben haben

  const update = () => {
    const visible = backTopVisible({ scrollY: win.scrollY, innerHeight: win.innerHeight, scrollHeight: doc.documentElement.scrollHeight, showAfter });
    // Liegt der Fokus auf dem Knopf, der gleich verschwindet, geht er an das Ziel (sonst fiele er auf <body>)
    if (!visible && !button.hidden && doc.activeElement === button) focusTarget();
    button.hidden = !visible;
    // Feste untere Leiste: der Knopf sitzt darüber (Höhe der Leiste plus Abstand), sonst gilt --dss-backtop-offset aus dem CSS
    let extra = typeof opts.offset === 'string' && opts.offset.trim() ? opts.offset.trim() : '';
    if (!extra && avoid) {
      const bar = doc.querySelector(avoid);
      const style = bar ? win.getComputedStyle(bar) : null;
      if (bar && style && (style.position === 'fixed' || style.position === 'sticky') && style.display !== 'none') {
        extra = `${Math.ceil(bar.getBoundingClientRect().height) + DEFAULTS.gap}px`;
      }
    }
    if (extra) button.style.setProperty('--dss-backtop-offset', extra);
    else button.style.removeProperty('--dss-backtop-offset');
  };

  function focusTarget() {
    const target = doc.querySelector(targetSelector) ?? doc.querySelector('main');
    if (!target) return;
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      added.add(target);
    }
    target.focus({ preventScroll: true });
  }

  cleanups.add(listen(button, 'click', () => {
    win.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    focusTarget();
  }));
  cleanups.add(listen(win, 'scroll', update, { passive: true }));
  cleanups.add(listen(win, 'resize', update));
  update();

  return registry.claim(key, () => {
    cleanups.run();
    for (const el of added) el.removeAttribute('tabindex');
    added.clear();
    if (adopted) {
      button.hidden = before.hidden;
      button.className = before.cls;
      if (before.label === null) button.removeAttribute('aria-label');
      else button.setAttribute('aria-label', before.label);
      if (before.offset) button.style.setProperty('--dss-backtop-offset', before.offset);
      else button.style.removeProperty('--dss-backtop-offset');
    } else button.remove();
  });
}
