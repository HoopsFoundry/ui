export interface LocaleOptions {
  locale?: string;
}
/** Zahl nach den Regeln der Sprache. */
export function formatNumber(n: number, options?: Intl.NumberFormatOptions, localeOptions?: LocaleOptions): string;
/** Zahl wie `String(n)` (keine Tausendertrennung, keine Rundung) mit dem Dezimaltrennzeichen der Sprache. */
export function formatPlain(n: number, localeOptions?: LocaleOptions): string;
/** Koordinaten mit Richtung aus dem Katalog; ungültige Werte ergeben `''`. */
export function formatCoords(lat: number, lng: number, localeOptions?: LocaleOptions): string;
