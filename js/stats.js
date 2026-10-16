/**
 * HoopsFoundry UI Stats · Hilfsfunktionen für das Kennzahlen-Gitter (StatGrid, `hoops-stats`)
 * --------------------------------------------------------------
 * Reine Funktionen ohne DOM und ohne Intl (feste Formatierung, SSR-stabil). Svelte, React und die Vanilla-Beispiele nutzen dieselbe Logik.
 * Typen: js/stats.d.ts.
 */

/** Text für den fehlenden Wert (nur für Hilfstechnik; sichtbar steht ein Gedankenstrich). */
export const statEmptyText = 'keine Angabe';

/**
 * Kennzahlen aufbereiten: `{ label, value }` mit nicht leerer Beschriftung bleiben, alles andere entfällt. Zahlen bekommen das Dezimalkomma
 * (`41.3` wird `41,3`), Texte werden getrimmt; kein gültiger Wert (`null`, `undefined`, leer, `NaN`, `Infinity`, Objekte) ergibt `empty: true`
 * und den Gedankenstrich als sichtbaren Text. Ergebnis: `{ label, value, empty }[]`.
 */
export function statItems(items) {
  if (!Array.isArray(items)) return [];
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const label = typeof item.label === 'string' ? item.label.replace(/\s+/g, ' ').trim() : '';
    if (!label) continue;
    let value = '';
    if (typeof item.value === 'number' && Number.isFinite(item.value)) value = String(item.value).replace('.', ',');
    else if (typeof item.value === 'string') value = item.value.trim();
    out.push(value ? { label, value, empty: false } : { label, value: '–', empty: true });
  }
  return out;
}
