/**
 * HoopsFoundry UI Render · Escaping
 * --------------------------------------------------------------
 * Jeder Text und jeder Attributwert, der in Markup der Render-Funktionen gelangt, läuft durch `esc` (bzw. `attr`). Das ist die einzige
 * Stelle, an der aus Daten Markup wird; die Render-Funktionen setzen nie Zeichenketten von außen ungeprüft ein. Ohne DOM, ohne Abhängigkeiten.
 * Typen: js/render/escape.d.ts.
 */

// Steuerzeichen außer Tabulator, Zeilenvorschub und Wagenrücklauf; sie haben in Text nichts verloren (der Parser behandelt manche, z. B. NUL, eigenwillig)
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * Text für Markup: Zeichenketten und endliche Zahlen werden zu Text, alles andere (`null`, `undefined`, Objekte, Funktionen, `NaN`,
 * Wahrheitswerte) zu einer leeren Zeichenkette. `& < > " '` werden zu Zeichenverweisen, Steuerzeichen entfallen. Eine Länge ist nicht begrenzt.
 */
export function esc(value) {
  let text = '';
  if (typeof value === 'string') text = value;
  else if (typeof value === 'number' && Number.isFinite(value)) text = String(value);
  else if (typeof value === 'bigint') text = String(value);
  return text.replace(CONTROL, '').replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

/**
 * Wert für ein Attribut (immer in doppelten Anführungszeichen: `name="${attr(value)}"`). Dieselben Regeln wie `esc`; die Funktion
 * trägt einen eigenen Namen, damit im Quelltext sichtbar bleibt, wo ein Attribut und wo ein Text entsteht.
 */
export function attr(value) {
  return esc(value);
}
