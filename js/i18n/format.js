/**
 * HoopsFoundry UI · Formatierung nach Sprache
 * --------------------------------------------------------------
 * Zahlen und Koordinaten über `Intl` mit der Sprache aus `localeOf` (Option oder globale Sprache). Himmelsrichtungen stehen im
 * Katalog (`common.direction.n|e|s|w`). Typen: js/i18n/format.d.ts.
 */
import { localeOf, t } from './index.js';

/** Zahl nach den Regeln der Sprache (Tausender- und Dezimaltrennzeichen). */
export function formatNumber(n, options, localeOptions) {
  return new Intl.NumberFormat(localeOf(localeOptions), options).format(n);
}

const plainFormats = new Map();
/**
 * Zahl so, wie `String(n)` sie schreibt (kein Tausendertrenner, keine Rundung), aber mit dem Dezimaltrennzeichen der Sprache:
 * `12.5` ergibt „12,5“ auf Deutsch und „12.5“ auf Englisch. Für Tabellenzellen, Kennzahlen und Korbdifferenz.
 */
export function formatPlain(n, localeOptions) {
  const code = localeOf(localeOptions);
  let format = plainFormats.get(code);
  if (!format) {
    format = new Intl.NumberFormat(code, { useGrouping: false, maximumFractionDigits: 20 });
    plainFormats.set(code, format);
  }
  return format.format(n);
}

const isCoord = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

// Die vier Schlüssel stehen ausgeschrieben, damit die Verwendungsprüfung (scripts/check-i18n.mjs) sie erkennt
const DIRECTION = { n: 'common.direction.n', e: 'common.direction.e', s: 'common.direction.s', w: 'common.direction.w' };

/**
 * Koordinaten wie „49.4875° N, 8.4660° E“ (4 Nachkommastellen, Trennzeichen der Sprache, Himmelsrichtung statt Vorzeichen).
 * Null und −0 gelten als N und E; ungültige Werte ergeben eine leere Zeichenkette.
 */
export function formatCoords(lat, lng, localeOptions) {
  if (!isCoord(lat, lng)) return '';
  const fmt = new Intl.NumberFormat(localeOf(localeOptions), { minimumFractionDigits: 4, maximumFractionDigits: 4, useGrouping: false });
  const part = (value, plus, minus) => {
    const text = Math.abs(value).toFixed(4);
    const zero = Number(text) === 0;
    return `${fmt.format(Number(text))}° ${t(DIRECTION[value < 0 && !zero ? minus : plus], undefined, localeOptions)}`;
  };
  return `${part(lat, 'n', 's')}, ${part(lng, 'e', 'w')}`;
}
