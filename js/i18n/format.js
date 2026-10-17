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

const isCoord = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

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
    return `${fmt.format(Number(text))}° ${t(`common.direction.${value < 0 && !zero ? minus : plus}`, undefined, localeOptions)}`;
  };
  return `${part(lat, 'n', 's')}, ${part(lng, 'e', 'w')}`;
}
