// Internationalisierung für die Svelte-Komponenten (I3): bindet den framework-freien Kern (js/i18n/index.js) an die Reaktivität von Svelte 5.
// Rein JavaScript ohne Runen, damit die Datei ohne Zusatzschritt ausgeliefert wird (wie heading-context.js). Die Reaktivität kommt aus
// `createSubscriber` (svelte/reactivity): Es abonniert den Kern erst, wenn eine Komponente im Browser liest, und meldet sich ab, sobald die
// letzte lesende Komponente zerstört ist (kein Abonnement beim Server-Rendern, kein Leck). Jeder Lesezugriff auf `options`, `locale`, `lang`
// und `t` hängt eine Komponente an den Kern; ein Sprachwechsel, ein neuer Katalog oder neue Überschreibungen rendern sie neu.
import { createSubscriber } from 'svelte/reactivity';
import { getContext, setContext } from 'svelte';
import { localeOf, subscribe, t } from '../js/i18n/index.js';
import { langFor } from '../js/i18n/lang.js';

const track = createSubscriber((update) => subscribe(() => update()));
const KEY = Symbol.for('hoops.i18n');

/** @typedef {{ locale?: string, texts?: Record<string, any>, documentLang?: string }} I18nContext */

/**
 * Gibt dem Teilbaum eine Sprache und eigene Texte vor (Gegenstück zu `HoopsProvider` in React), ohne den globalen Zustand zu ändern.
 * `get` wird bei jedem Lesen aufgerufen, so bleiben die Werte reaktiv. Ein innerer Aufruf gilt innen: seine `locale` und `documentLang`
 * ersetzen die äußeren, seine `texts` werden über die äußeren gelegt. Nur beim Initialisieren einer Komponente aufrufen.
 * `documentLang`: Sprache der Seite für den Vergleich, der das Attribut `lang` entscheidet; beim Server-Rendern die einzige Quelle.
 * @param {() => I18nContext} get
 */
export function provideI18n(get) {
  const outer = /** @type {(() => I18nContext) | undefined} */ (getContext(KEY));
  setContext(KEY, () => {
    const parent = outer ? outer() : {};
    const own = get() || {};
    const texts = { ...(parent.texts || {}), ...(own.texts || {}) };
    return {
      locale: own.locale || parent.locale,
      documentLang: typeof own.documentLang === 'string' ? own.documentLang : parent.documentLang,
      texts,
    };
  });
}

/**
 * Für Komponenten: liefert Texte, Sprache und `lang` des Bausteins. `getTexts` liefert die `texts`-Eigenschaft der Komponente (oder nichts).
 * Vorrang: Eigenschaften der Komponente (`label` …) vor `texts` der Komponente vor `texts` des Anbieters vor `setTexts` vor Katalog.
 * Nur beim Initialisieren einer Komponente aufrufen.
 * @param {() => (Record<string, any> | undefined)} [getTexts]
 */
export function useI18n(getTexts) {
  const context = /** @type {(() => I18nContext) | undefined} */ (getContext(KEY));
  const read = () => {
    track();
    const provided = context ? context() : {};
    const own = getTexts ? getTexts() : undefined;
    return {
      locale: provided.locale,
      documentLang: provided.documentLang,
      texts: own ? { ...(provided.texts || {}), ...own } : provided.texts,
    };
  };
  return {
    /** Optionen für die Funktionen aus `js/` (`{ locale, texts, documentLang }`); der Lesezugriff macht die Komponente reaktiv. */
    get options() {
      return read();
    },
    /** Wirksame Sprache (Anbieter, sonst global). */
    get locale() {
      return localeOf(read());
    },
    /** Wert für `lang` an der Wurzel des Bausteins: leer (`undefined`), wenn die Sprache der Seite gilt. */
    get lang() {
      return langFor(read()) || undefined;
    },
    /** Übersetzt `key` mit `params` in der wirksamen Sprache. */
    t(key, params) {
      return t(key, params, read());
    },
  };
}
