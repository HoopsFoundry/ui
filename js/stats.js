/**
 * HoopsFoundry UI Stats · Hilfsfunktionen für das Kennzahlen-Gitter (StatGrid, `hoops-stats`)
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte, React und die Vanilla-Beispiele nutzen dieselbe Logik.
 * Typen: js/stats.d.ts.
 */
import { formatPlain } from './i18n/format.js';
import { t } from './i18n/index.js';

/** Text für den fehlenden Wert (nur für Hilfstechnik; sichtbar steht ein Gedankenstrich) in der Sprache des Aufrufs. `options`: `locale`, `texts`. */
export function statEmptyLabel(options) {
  return t('stats.empty', undefined, options);
}

/**
 * Der Text für den fehlenden Wert in der globalen Sprache (nur für Svelte und React, die den Wert bis I3 als Konstante lesen). Ein Live-Binding:
 * `statItems` frischt es bei jedem Aufruf auf, damit ein späteres `setLocale` wirkt. Neuer Code ruft `statEmptyLabel`.
 */
export let statEmptyText = statEmptyLabel();

/**
 * Kennzahlen aufbereiten: `{ label, value }` mit nicht leerer Beschriftung bleiben, alles andere entfällt. Zahlen bekommen das Dezimaltrennzeichen der Sprache
 * (`41.3` wird deutsch `41,3`), Texte werden getrimmt; kein gültiger Wert (`null`, `undefined`, leer, `NaN`, `Infinity`, Objekte) ergibt `empty: true`
 * und den Gedankenstrich als sichtbaren Text. Ergebnis: `{ label, value, empty }[]`.
 */
export function statItems(items, options) {
  statEmptyText = statEmptyLabel();
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const label = typeof item.label === 'string' ? item.label.replace(/\s+/g, ' ').trim() : '';
    if (!label) continue;
    let value = '';
    if (typeof item.value === 'number' && Number.isFinite(item.value)) value = formatPlain(item.value, options);
    else if (typeof item.value === 'string') value = item.value.trim();
    out.push(value ? { label, value, empty: false } : { label, value: '–', empty: true });
  }
  return out;
}
