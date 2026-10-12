/**
 * DSS Theme · Hell, Dunkel oder System
 * --------------------------------------------------------------
 * `initTheme(button, options)` macht einen Button zum Umschalter für den Dunkelmodus. Drei Modi: `light`, `dark` und `system` (kein Attribut,
 * das CSS folgt `prefers-color-scheme`; Änderungen der Systemeinstellung werden gehört). Der Button hat eine feste Beschriftung („Dunkelmodus“)
 * und `aria-pressed` (gedrückt = Dunkelmodus aktiv); die Symbole wechseln über `data-theme-state` im CSS, nicht über den Namen. Ein Klick
 * schaltet zwischen hell und dunkel und merkt sich die Wahl (Standard `localStorage`, Schlüssel `dss-theme`, blockierter Speicher bleibt ohne Fehler).
 * `themeBootScript(options)` liefert den kleinen Inline-Code für den `<head>`, der die gemerkte Wahl vor dem ersten Zeichnen setzt (kein Flackern).
 * Kein Inline-`onclick`, kein globaler Zustand, kein `innerHTML`. Rückgabe `{ destroy(), getMode(), setMode(mode) }`. Typen: js/theme.d.ts.
 */
import { createCleanups, createRegistry, listen } from './lifecycle.js';

export const THEME_KEY = 'dss-theme';
export const THEME_ATTRIBUTE = 'data-theme';
export const THEME_LABEL = 'Dunkelmodus';
const MODES = ['light', 'dark', 'system'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const SYNC_EVENT = 'dss-theme-sync';
const registry = createRegistry();

/** Gültiger Modus (`light`, `dark`, `system`) oder `null`. */
export function parseTheme(value) {
  return typeof value === 'string' && MODES.includes(value) ? value : null;
}

/** Der tatsächliche Zustand: `light` oder `dark`; `system` folgt der Systemeinstellung. */
export function resolveTheme(mode, prefersDark) {
  const m = parseTheme(mode) ?? 'system';
  if (m === 'system') return prefersDark ? 'dark' : 'light';
  return m;
}

/** Nächster Modus beim Klick: aus dem tatsächlichen Zustand `dark` wird `light` und umgekehrt (nie `system`). */
export function nextTheme(mode, prefersDark) {
  return resolveTheme(mode, prefersDark) === 'dark' ? 'light' : 'dark';
}

/** Speicher lesen/schreiben ohne Ausnahme: ein blockierter oder fehlender Speicher ergibt `null` bzw. wirkt nicht. */
export function readTheme(storage, key = THEME_KEY) {
  try {
    return parseTheme(storage?.getItem(key));
  } catch {
    return null;
  }
}
export function writeTheme(storage, mode, key = THEME_KEY, keepSystem = false) {
  try {
    // `system` löscht den Eintrag; gilt aber ein anderer defaultMode, muss die Wahl „System“ gemerkt werden (sonst käme beim nächsten Besuch der Standard)
    if (mode === 'system' && !keepSystem) storage?.removeItem(key);
    else storage?.setItem(key, mode);
    return true;
  } catch {
    return false;
  }
}

const iconEl = (doc, kind) => {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  const attrs = { class: `dss-theme-icon dss-theme-icon--${kind}`, width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' };
  for (const [name, value] of Object.entries(attrs)) svg.setAttribute(name, value);
  const paths = kind === 'sun'
    ? ['M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41']
    : ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'];
  if (kind === 'sun') {
    const circle = doc.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '4');
    svg.append(circle);
  }
  for (const d of paths) {
    const path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
};

/**
 * Umschalter für den Dunkelmodus. Optionen: `defaultMode` (Modus ohne gemerkte Wahl, Standard `system`; derselbe Wert wie bei `themeBootScript`, damit Boot-Skript und Umschalter übereinstimmen: gemerkte Wahl vor `defaultMode` vor `system`), `storageKey` (Standard `dss-theme`), `storage` (Objekt mit `getItem`, `setItem`, `removeItem`;
 * Standard `localStorage`, `null` schaltet das Merken ab), `mode` (Anfangsmodus; sonst der gemerkte, sonst `system`), `target` (Element, das
 * das Attribut bekommt; Standard `<html>`: die Tokens reagieren nur dort), `attribute` (Standard `data-theme`), `label` (Standard „Dunkelmodus“,
 * nur wenn der Button keinen eigenen Text hat), `onChange(mode, theme)`.
 */
export function initTheme(button, options = {}) {
  const none = { destroy() {}, getMode: () => 'system', setMode() {} };
  if (typeof document === 'undefined' || !button || typeof button.addEventListener !== 'function') return none;
  registry.release(button);

  const doc = button.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  const opts = options && typeof options === 'object' ? options : {};
  const key = typeof opts.storageKey === 'string' && opts.storageKey ? opts.storageKey : THEME_KEY;
  const attribute = typeof opts.attribute === 'string' && /^[a-z][a-z0-9-]*$/.test(opts.attribute) ? opts.attribute : THEME_ATTRIBUTE;
  const target = opts.target && typeof opts.target.setAttribute === 'function' ? opts.target : doc.documentElement;
  const label = typeof opts.label === 'string' && opts.label.trim() ? opts.label.trim() : THEME_LABEL;
  let storage = null;
  if (opts.storage !== null) {
    try {
      storage = opts.storage ?? win.localStorage;
    } catch {
      storage = null; // Zugriff auf localStorage kann selbst werfen (blockierte Website-Daten)
    }
  }
  const query = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-color-scheme: dark)') : null;
  const prefersDark = () => Boolean(query?.matches);

  const cleanups = createCleanups();
  const created = [];
  const before = {
    pressed: button.getAttribute('aria-pressed'), label: button.getAttribute('aria-label'), type: button.getAttribute('type'), hidden: button.hidden,
    cls: button.className, state: button.getAttribute('data-theme-state'), mode: button.getAttribute('data-theme-mode'),
  };

  const defaultMode = parseTheme(opts.defaultMode) ?? 'system';
  const id = {}; // Kennung dieser Instanz für das Fenster-Ereignis
  let mode = parseTheme(opts.mode) ?? readTheme(storage, key) ?? defaultMode;

  const apply = () => {
    const theme = resolveTheme(mode, prefersDark());
    if (mode === 'system') target.removeAttribute(attribute);
    else target.setAttribute(attribute, mode);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('data-theme-state', theme);
    button.setAttribute('data-theme-mode', mode);
    return theme;
  };
  const setMode = (next, { persist = true, notify = true, broadcast = true } = {}) => {
    const value = parseTheme(next);
    if (!value) return;
    mode = value;
    if (persist) writeTheme(storage, mode, key, defaultMode !== 'system');
    const theme = apply();
    if (notify && typeof opts.onChange === 'function') opts.onChange(mode, theme);
    // Mehrere Umschalter auf einer Seite (je Schlüssel) teilen sich den Modus: die anderen hören auf dieses Fenster-Ereignis
    if (broadcast) win.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key, mode, source: id } }));
  };

  if (!button.hasAttribute('type')) button.setAttribute('type', 'button');
  button.classList.add('dss-theme-toggle');
  if (!button.querySelector('.dss-theme-icon')) {
    for (const kind of ['sun', 'moon']) {
      const icon = iconEl(doc, kind);
      button.append(icon);
      created.push(icon);
    }
  }
  // Feste Beschriftung; hat der Button sichtbaren Text, ist das sein Name
  if (!button.textContent.trim() && !button.hasAttribute('aria-label') && !button.hasAttribute('aria-labelledby')) button.setAttribute('aria-label', label);
  button.hidden = false;
  apply();

  cleanups.add(listen(button, 'click', () => setMode(nextTheme(mode, prefersDark()))));
  if (query) {
    const onScheme = () => { if (mode === 'system') { apply(); if (typeof opts.onChange === 'function') opts.onChange(mode, resolveTheme(mode, prefersDark())); } };
    if (typeof query.addEventListener === 'function') cleanups.add(listen(query, 'change', onScheme));
    else if (typeof query.addListener === 'function') {
      query.addListener(onScheme);
      cleanups.add(() => query.removeListener(onScheme));
    }
  }
  // Ein anderer Tab ändert die Wahl
  cleanups.add(listen(win, 'storage', (event) => {
    if (event.key !== null && event.key !== key) return;
    const stored = readTheme(storage, key) ?? defaultMode;
    if (stored !== mode) setMode(stored, { persist: false });
  }));
  // Ein anderer Umschalter im selben Fenster hat den Modus geändert
  cleanups.add(listen(win, SYNC_EVENT, (event) => {
    const { key: other, mode: next, source } = event.detail ?? {};
    if (source === id || other !== key || next === mode || !parseTheme(next)) return;
    setMode(next, { persist: false, broadcast: false });
  }));

  const handle = registry.claim(button, () => {
    cleanups.run();
    for (const icon of created) icon.remove();
    button.classList.remove('dss-theme-toggle');
    if (!button.classList.length) button.removeAttribute('class');
    for (const [name, value] of [['aria-pressed', before.pressed], ['aria-label', before.label], ['type', before.type], ['data-theme-state', before.state], ['data-theme-mode', before.mode]]) {
      if (value === null) button.removeAttribute(name);
      else button.setAttribute(name, value);
    }
    button.hidden = before.hidden;
  });
  return { destroy: () => handle.destroy(), getMode: () => mode, setMode: (next) => setMode(next) };
}

/**
 * Inline-Code für den `<head>`: setzt die gemerkte Wahl (`light` oder `dark`) auf `<html>`, bevor die Seite gezeichnet wird. Eine gemerkte Wahl
 * `system` bleibt ohne Attribut; ohne Eintrag oder bei blockiertem Speicher gilt `defaultMode` (Standard `system`: kein Attribut, das CSS folgt der Systemeinstellung).
 * `initTheme` bekommt dasselbe `defaultMode`. Optionen:
 * `storageKey` (Standard `dss-theme`), `attribute` (Standard `data-theme`), `defaultMode`. Die Werte werden als Zeichenketten eingebettet und so
 * maskiert, dass `</script>` und Zeilentrenner darin nichts ausrichten. Mit einer Content-Security-Policy braucht das Skript ein `nonce` oder
 * einen Hash in `script-src`.
 */
export function themeBootScript(options = {}) {
  const opts = options && typeof options === 'object' ? options : {};
  const key = typeof opts.storageKey === 'string' && opts.storageKey ? opts.storageKey : THEME_KEY;
  const attribute = typeof opts.attribute === 'string' && /^[a-z][a-z0-9-]*$/.test(opts.attribute) ? opts.attribute : THEME_ATTRIBUTE;
  const fallback = opts.defaultMode === 'light' || opts.defaultMode === 'dark' ? opts.defaultMode : 'system';
  const lit = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `(function(){var m;try{m=localStorage.getItem(${lit(key)})}catch(e){}if(m!=="light"&&m!=="dark"&&m!=="system")m=${lit(fallback)};if(m==="light"||m==="dark")document.documentElement.setAttribute(${lit(attribute)},m)})();`;
}
