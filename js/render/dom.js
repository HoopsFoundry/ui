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

/** Schreibt die Angaben aus `text` (`left:10%;top:20%`) über das CSSOM an `el`: nur bekannte Eigenschaften, nur schlichte Werte. */
function setDeclarations(el, text) {
  for (const part of text.split(';')) {
    const at = part.indexOf(':');
    if (at < 0) continue;
    const name = part.slice(0, at).trim();
    const value = part.slice(at + 1).trim();
    if (STYLE_PROPS.has(name) && !/[;{}()\\]/.test(value)) el.style.setProperty(name, value);
  }
}

/** Wendet `data-dss-style` über `style.setProperty` an (nur bekannte Eigenschaften) und entfernt das Attribut. */
export function applyStyles(host) {
  for (const el of host.querySelectorAll('[data-dss-style]')) {
    setDeclarations(el, el.getAttribute('data-dss-style'));
    el.removeAttribute('data-dss-style');
  }
}

/**
 * Für Markup, das die Seite selbst eingesetzt hat (Server, `renderX`): die `style`-Attribute von `host` und seinen Nachfahren noch einmal über das
 * CSSOM anwenden. Eine Seite mit `style-src 'self'` blockiert das Attribut beim Parsen (der Wert bleibt am Element stehen, wirkt aber nicht);
 * `style.setProperty` ist erlaubt. Bekannte Eigenschaften und schlichte Werte nur; wirkt das Attribut schon, ändert sich nichts.
 */
export function reapplyStyles(host) {
  for (const el of [host, ...host.querySelectorAll('[style]')]) {
    const text = el.getAttribute('style');
    if (text) setDeclarations(el, text);
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
