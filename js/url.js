/**
 * DSS URL · Prüfung von Links
 * --------------------------------------------------------------
 * Gemeinsam für Karte (Marker-Ziele), Hallenkarte, Seitennavigation und die Render-Funktionen. Ohne DOM, ohne Abhängigkeiten.
 * Typen: js/url.d.ts. `js/map.js` exportiert `safeHref` weiterhin (Abwärtskompatibilität).
 */

/**
 * Prüft ein Ziel (`href`) eines Markers: erlaubt sind `http:`, `https:`, `mailto:`, `tel:` (Schema in beliebiger Schreibweise), Pfade
 * (`/…`, `./…`, `../…`, `ort/seite`, `?…`) und `#`-Ziele. Alles mit anderem Schema (`javascript:`, `data:`, `vbscript:` …) und alles mit
 * Steuerzeichen oder Leerraum am Anfang ergibt `undefined`. Steuerzeichen und Leerzeichen innerhalb entfernen Browser vor der Auswertung
 * des Schemas, deshalb zählt die Funktion sie vorher mit.
 */
export function safeHref(href) {
  if (typeof href !== 'string' || !href) return undefined;
  if (/^[\u0000-\u0020\u007f-\u00a0\u1680\u2000-\u200f\u2028\u2029\u202f\u205f\u3000\ufeff]/.test(href)) return undefined;
  // so, wie der Browser das Schema liest: Tabulator und Zeilenumbrüche fallen weg
  const flat = href.replace(/[\u0000-\u001f\u007f]/g, '');
  const scheme = flat.match(/^([A-Za-z][A-Za-z0-9+.-]*):/);
  if (scheme) return /^(https?|mailto|tel)$/i.test(scheme[1]) ? href : undefined;
  // „ohne Schema“ heißt: der Teil vor dem ersten / ? # enthält keinen Doppelpunkt (sonst wäre es ein Schema)
  if (/^[^/?#]*:/.test(flat)) return undefined;
  // Zeichenverweise (&colon;, &#58;) ergäben in Markup-Kontexten ein Schema: vor dem ersten / ? # nicht zulassen
  if (/^[^/?#]*&/.test(flat)) return undefined;
  return href;
}
