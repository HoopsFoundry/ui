/**
 * HoopsFoundry UI Periods · Spielabschnitte (Viertel, Achtel, Verlängerung)
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM. MatchCard und PlayByPlay (Svelte und React) nutzen dieselbe Logik.
 * Typen: js/periods.d.ts.
 *
 * Regel: `period` zählt ab 1. Bis `periods` (4 Viertel oder 8 Achtel, Standard 4) heißt der Abschnitt
 * "n. Viertel" bzw. "n. Achtel"; darüber ("period > periods") beginnt die Verlängerung:
 * "Verlängerung" (period = periods + 1), danach "2. Verlängerung" usw. (n = period - periods).
 * Kurzform für enge Chips: V1 bis V4, A1 bis A8, VL, VL2 usw.
 * Ungültige Werte (0, negativ, Kommazahl, NaN, kein Zahlentyp) ergeben einen leeren Text.
 * Die Wörter kommen aus dem Katalog (deutsch wie oben beschrieben, englisch „Quarter 3“, „Period 5“, „Overtime“, „Q3“, „P5“, „OT“);
 * `options` (`locale`, `texts`) steht als letzter Parameter.
 */
import { t } from './i18n/index.js';

/** Gültig ist eine ganze Zahl ab 1. */
export function isPeriod(period) {
  return typeof period === 'number' && Number.isInteger(period) && period >= 1;
}

/** Nur 8 schaltet auf Achtel; alles andere gilt als 4 Viertel. */
export function normalizePeriods(periods) {
  return periods === 8 ? 8 : 4;
}

/** Ausgeschriebene Bezeichnung ("3. Viertel", "5. Achtel", "Verlängerung", "2. Verlängerung"); leer bei ungültigem Wert. */
export function periodLabel(period, periods = 4, options) {
  if (!isPeriod(period)) return '';
  const count = normalizePeriods(periods);
  if (period <= count) return count === 8 ? t('periods.label.eighth', { number: period }, options) : t('periods.label.quarter', { number: period }, options);
  const extra = period - count;
  return extra === 1 ? t('periods.label.overtime', undefined, options) : t('periods.label.overtime-n', { number: extra }, options);
}

/** Kurzform für Chips ("V3", "A5", "VL", "VL2"); leer bei ungültigem Wert. */
export function periodShort(period, periods = 4, options) {
  if (!isPeriod(period)) return '';
  const count = normalizePeriods(periods);
  if (period <= count) return count === 8 ? t('periods.short.eighth', { number: period }, options) : t('periods.short.quarter', { number: period }, options);
  const extra = period - count;
  return extra === 1 ? t('periods.short.overtime', undefined, options) : t('periods.short.overtime-n', { number: extra }, options);
}

/**
 * Anzeige eines Abschnitts mit dem veralteten Alias `quarter`: Ein gültiges `period` gewinnt;
 * fehlt es, wird ein gesetzter `quarter`-Text unverändert angezeigt (kurz und lang gleich).
 * Ergebnis: { label, short, alias }; `alias` ist true, wenn der Text aus `quarter` stammt.
 */
export function resolvePeriod({ period, periods, quarter } = {}, options) {
  const label = periodLabel(period, periods, options);
  if (label) return { label, short: periodShort(period, periods, options), alias: false };
  const text = typeof quarter === 'string' ? quarter.trim() : '';
  return { label: text, short: text, alias: text !== '' };
}
