/**
 * DSS Render · DOM-Hilfen ohne Abhängigkeiten
 * --------------------------------------------------------------
 * Gemeinsam für `mount` (js/render/mount.js) und `mountMap`/`initMap` (js/map-vanilla.js): Markup über `Range.createContextualFragment`
 * einsetzen (nie über eine HTML-Eigenschaft), Styles nach dem Einsetzen über das CSSOM anwenden (CSP `style-src` ohne `unsafe-inline`),
 * eine seitenweit eindeutige Kennung erzeugen. Die Datei hängt an nichts (insbesondere nicht am Accordion), damit das Karten-Bündel sie
 * ohne den Rest des Render-Pakets nutzen kann.
 */

// Zähler für erzeugte Kennungen: einer je Seite über alle Kopien des Moduls (Symbol.for), damit zwei Bündel keine gleiche id vergeben
const COUNTER = Symbol.for('dss.render.counter');
export const nextUid = () => {
  const store = (globalThis[COUNTER] ??= { n: 0 });
  store.n += 1;
  return `m${store.n}`;
};

// Inline-Styles der Render-Funktionen: nur diese Eigenschaften, und nur aus unserem eigenen Markup
const STYLE_PROPS = new Set(['left', 'top', 'width', '--dss-map-h']);
const STYLE_ATTR = /\sstyle="([^"]*)"/g;

/** Ersetzt `style="…"` im Markup durch `data-dss-style="…"`: das Attribut wird nach dem Einsetzen über das CSSOM angewendet (CSP `style-src`). */
export const deferStyles = (html) => html.replace(STYLE_ATTR, ' data-dss-style="$1"');

/** Wendet `data-dss-style` über `style.setProperty` an (nur bekannte Eigenschaften) und entfernt das Attribut. */
export function applyStyles(host) {
  for (const el of host.querySelectorAll('[data-dss-style]')) {
    for (const part of el.getAttribute('data-dss-style').split(';')) {
      const at = part.indexOf(':');
      if (at < 0) continue;
      const name = part.slice(0, at).trim();
      const value = part.slice(at + 1).trim();
      if (STYLE_PROPS.has(name) && !/[;{}()\\]/.test(value)) el.style.setProperty(name, value);
    }
    el.removeAttribute('data-dss-style');
  }
}

/** Ein Fragment aus Markup (Styles schon aufgeschoben); nach dem Einfügen `applyStyles(host)` aufrufen. */
export function fragmentOf(doc, html, context) {
  const range = doc.createRange();
  if (context) range.selectNodeContents(context);
  return range.createContextualFragment(deferStyles(html));
}

/** Ersetzt den Inhalt von `host` durch `html` (Fragment, Styles über das CSSOM). */
export function insertMarkup(host, html) {
  host.replaceChildren(fragmentOf(host.ownerDocument, html, host));
  applyStyles(host);
}
