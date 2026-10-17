/**
 * HoopsFoundry UI · Texttabellen (`mapText`, `venueText`)
 * --------------------------------------------------------------
 * Bis zur Internationalisierung waren `mapText` und `venueText` Objekte mit festen deutschen Texten, die Svelte und React als Standardwerte lesen
 * und die eine Anwendung durch Zuweisen überschreiben konnte. Die Tabelle behält diese Form: jede Eigenschaft liest den Katalogtext der
 * globalen Sprache (Zugriffsfunktion), eine Zuweisung merkt sich den Wert und hat Vorrang vor Katalog und `texts`; `undefined` oder `null`
 * nimmt die Zuweisung zurück. `lookup(name, options)` ist der Weg für Aufrufe mit eigener Sprache oder eigenen Texten (`options.locale`,
 * `options.texts`); die Reihenfolge ist: zugewiesener Wert > `options.texts` > globale Überschreibung > Katalog.
 */
import { t } from './index.js';

/**
 * @param {Record<string, string>} keys Eigenschaft → Katalogschlüssel
 * @param {Record<string, unknown>} [plain] weitere Eigenschaften ohne Text (zum Beispiel Adressen)
 */
export function textTable(keys, plain = {}) {
  const own = new Map();
  const table = { ...plain };
  for (const [name, key] of Object.entries(keys)) {
    Object.defineProperty(table, name, {
      enumerable: true,
      configurable: true,
      get: () => (own.has(name) ? own.get(name) : t(key)),
      set: (value) => {
        if (value === undefined || value === null) own.delete(name);
        else own.set(name, String(value));
      },
    });
  }
  const lookup = (name, options) => (own.has(name) ? own.get(name) : t(keys[name], undefined, options));
  return { table, lookup };
}
