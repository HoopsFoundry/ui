/**
 * HoopsFoundry UI · `lang`-Attribut für Bausteine
 * --------------------------------------------------------------
 * Weicht die Sprache eines Bausteins (Option `locale`, sonst die globale Sprache) von der Sprache der Seite ab, bekommt die Wurzel des
 * Bausteins `lang="…"`, damit Hilfstechnik richtig vorliest (WCAG 3.1.2). Die Sprache der Seite ist `options.documentLang`, sonst
 * `document.documentElement.lang`; ist sie leer oder unbekannt (zum Beispiel in Node ohne `documentLang`), bleibt das Attribut weg.
 * Verglichen wird die Basissprache (`de-AT` und `de` gelten als gleich). Maßgeblich ist die Sprache des Katalogs, der die Texte liefert
 * (`resolvedLocale`): `fr` ohne französischen Katalog zeigt englische Texte und bekommt `lang="en"`, nicht `fr`.
 */
import { localeOf, resolvedLocale } from './index.js';

const base = (code) => String(code).split('-')[0].toLowerCase();

/** Der Wert für `lang` oder eine leere Zeichenkette, wenn kein Attribut nötig ist. `options`: `locale`, `documentLang`. */
export function langFor(options) {
  const code = resolvedLocale(localeOf(options));
  // `documentLang` als Zeichenkette (auch leer) gilt als angegeben; `undefined` (fehlt oder ausdrücklich undefined) heißt: das Dokument fragen
  const given = options && typeof options.documentLang === 'string';
  let page = given ? options.documentLang : '';
  if (!given && typeof document !== 'undefined' && document.documentElement) page = document.documentElement.lang;
  page = typeof page === 'string' ? page.trim() : '';
  if (!page) return '';
  return base(page) === base(code) ? '' : code;
}
