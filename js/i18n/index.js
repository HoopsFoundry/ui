/**
 * HoopsFoundry UI · Internationalisierung (Kern)
 * --------------------------------------------------------------
 * Ohne DOM, Svelte oder React; läuft in Node. Zustand ist ein Modul-Singleton: aktuelle Sprache, Kataloge und globale
 * Überschreibungen. Typen: js/i18n/index.d.ts. Der englische Katalog liegt im Kern, weitere Sprachen registriert die Anwendung
 * (zum Beispiel `@hoopsfoundry/ui/i18n/de`).
 *
 * Rückfallkette für `t`: Überschreibung je Aufruf → globale Überschreibung → Katalog der Sprache (`de-AT`) → Basissprache (`de`) → `en`.
 */
import en from './en.js';

const DEFAULT_LOCALE = 'en';

/** Sprachcode vereinheitlichen und prüfen: `de_at` wird `de-AT`; ein ungültiger Code ergibt `null`. */
function canonical(code) {
  try {
    const text = String(code ?? '').trim().replace(/_/g, '-');
    return text.length > 0 && text.length <= 64 ? Intl.getCanonicalLocales(text)[0] ?? null : null;
  } catch {
    return null;
  }
}

/** Wie `canonical`, aber mit Rückfall auf `en` und einer einmaligen deutschen Warnung je ungültigem Code. */
function normalize(code) {
  const result = canonical(code);
  if (result) return result;
  const shown = String(code).slice(0, 40);
  if (!warned.has(`locale:${shown}`)) {
    warned.add(`locale:${shown}`);
    if (!production()) console.warn(`[hoops-i18n] Ungültiger Sprachcode '${shown}', es gilt ${DEFAULT_LOCALE}.`);
  }
  return DEFAULT_LOCALE;
}

const production = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production';

let locale = DEFAULT_LOCALE;
let catalogs = new Map([[DEFAULT_LOCALE, en]]);
let overrides = {};
let listeners = new Set();
let warned = new Set();

function notify() {
  for (const fn of [...listeners]) {
    try {
      fn(locale);
    } catch (error) {
      console.error('[hoops-i18n] Ein Abonnent hat beim Sprachwechsel einen Fehler geworfen.', error);
    }
  }
}

/** Setzt die globale Sprache (Schreibweise wie `de-AT` bleibt erhalten, die Auflösung fällt auf `de` und `en` zurück). */
export function setLocale(code) {
  locale = normalize(code);
  notify();
}

/** Aktuelle globale Sprache; Standard `en`. */
export function getLocale() {
  return locale;
}

/** Fügt einen Katalog hinzu oder ersetzt den der Sprache. */
export function registerLocale(code, catalog) {
  const key = canonical(code);
  if (!key) {
    normalize(code);
    return;
  }
  catalogs.set(key, catalog && typeof catalog === 'object' ? catalog : {});
  notify();
}

/** Globale Überschreibungen `{ schlüssel: text }`; ersetzt die vorherigen, `setTexts({})` löscht sie. */
export function setTexts(texts) {
  overrides = texts && typeof texts === 'object' ? { ...texts } : {};
  notify();
}

/** Aktuelle globale Überschreibungen (Kopie). */
export function getTexts() {
  return { ...overrides };
}

/** Meldet `fn(locale)` bei jeder Änderung an; gibt die Abmeldefunktion zurück. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Sprache eines Aufrufs: `options.locale`, sonst die globale Sprache. */
export function localeOf(options) {
  return options && options.locale ? normalize(options.locale) : locale;
}

/** Registrierte Sprachcodes. */
export function availableLocales() {
  return [...catalogs.keys()];
}

/** Nur für Tests: Zustand auf Werkseinstellung (Sprache `en`, nur der eingebaute englische Katalog, keine Überschreibungen, keine Abonnenten). */
export function __resetForTests() {
  locale = DEFAULT_LOCALE;
  catalogs = new Map([[DEFAULT_LOCALE, en]]);
  overrides = {};
  listeners = new Set();
  warned = new Set();
}

const has = (object, key) => object !== null && typeof object === 'object' && Object.prototype.hasOwnProperty.call(object, key);
const isPlural = (value) => value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value.other === 'string';
/** Nur Zeichenketten und Mehrzahlobjekte (mit `other` als Zeichenkette) sind gültige Werte. */
const usable = (value) => typeof value === 'string' || isPlural(value);

function lookup(key, code, options) {
  if (has(options && options.texts, key) && usable(options.texts[key])) return options.texts[key];
  if (has(overrides, key) && usable(overrides[key])) return overrides[key];
  const chain = [code, code.split('-')[0], DEFAULT_LOCALE];
  for (const c of chain) {
    const catalog = catalogs.get(c);
    if (has(catalog, key) && usable(catalog[key])) return catalog[key];
  }
  return undefined;
}

function pick(value, code, params) {
  if (!isPlural(value)) return value;
  let category = 'other';
  const count = params && params.count;
  if (typeof count === 'number' && Number.isFinite(count)) {
    try {
      category = new Intl.PluralRules(code).select(count);
    } catch {
      category = new Intl.PluralRules(DEFAULT_LOCALE).select(count);
    }
  }
  const text = value[category];
  return typeof text === 'string' ? text : value.other;
}

/** Übersetzt `key`; `params` füllt `{name}`-Platzhalter, `params.count` wählt die Mehrzahlform. */
export function t(key, params, options) {
  const code = localeOf(options);
  const found = lookup(key, code, options);
  if (found === undefined) {
    if (!warned.has(key)) {
      warned.add(key);
      if (!production()) {
        console.warn(`[hoops-i18n] Schlüssel fehlt in allen Katalogen: ${key}`);
      }
    }
    return key;
  }
  const text = pick(found, code, params);
  return text.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (whole, name) => {
    const value = has(params, name) ? params[name] : undefined;
    return value === undefined || value === null ? whole : String(value);
  });
}
