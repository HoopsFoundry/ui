import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { localeOf, subscribe, t as translate, type CatalogValue, type Params } from '../js/i18n/index.js';
import { langFor } from '../js/i18n/lang.js';

/** Sprache, eigene Texte und Seitensprache für einen Teilbaum. */
interface I18nContextValue {
  locale?: string;
  texts?: Record<string, CatalogValue>;
  documentLang?: string;
}

const I18nContext = createContext<I18nContextValue>({});

// ── Anbindung an den Kern (js/i18n/index.js) ─────────────────────────────────────────────
// Ein gemeinsames Abonnement am Kern, solange mindestens eine Komponente lebt (kein Abonnement beim Server-Rendern, kein Leck).
// `version` steigt bei jeder Änderung; beim ersten Abonnement ebenfalls, damit eine Änderung zwischen Rendern und Abonnieren nicht verloren geht.
let version = 0;
let stop: (() => void) | undefined;
const callbacks = new Set<() => void>();

function subscribeStore(callback: () => void): () => void {
  callbacks.add(callback);
  if (callbacks.size === 1) {
    version += 1;
    stop = subscribe(() => {
      version += 1;
      for (const fn of [...callbacks]) fn();
    });
  }
  return () => {
    callbacks.delete(callback);
    if (callbacks.size === 0 && stop) {
      stop();
      stop = undefined;
    }
  };
}
const getSnapshot = () => version;
const getServerSnapshot = () => 0;

export interface HoopsProviderProps {
  /** Sprache im Teilbaum (zum Beispiel `de`); ohne Angabe gilt die des äußeren Anbieters, sonst die globale Sprache. Ändert den globalen Zustand nicht. */
  locale?: string;
  /** Eigene Texte im Teilbaum (Schlüssel des Katalogs); überlagern die des äußeren Anbieters und `setTexts`, schlagen aber nicht die Eigenschaften der Komponenten (`label` …) und deren `texts`. */
  texts?: Record<string, CatalogValue>;
  /**
   * Sprache der Seite für den Vergleich, der das Attribut `lang` an den Wurzeln der Bausteine entscheidet. Im Browser genügt `document.documentElement.lang`;
   * beim Server-Rendern setzt nur diese Angabe das Attribut (ohne sie bleibt es weg).
   */
  documentLang?: string;
  children?: ReactNode;
}

/**
 * Gibt dem Teilbaum eine Sprache und eigene Texte vor, ohne den globalen Zustand (`setLocale`, `setTexts`) zu ändern. Geschachtelte Anbieter gelten
 * innen: ihre `locale` und `documentLang` ersetzen die äußeren, ihre `texts` werden über die äußeren gelegt. Ohne Anbieter gilt die globale Sprache.
 */
export function HoopsProvider({ locale, texts, documentLang, children }: HoopsProviderProps) {
  const outer = useContext(I18nContext);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale: locale || outer.locale,
      documentLang: typeof documentLang === 'string' ? documentLang : outer.documentLang,
      texts: { ...(outer.texts ?? {}), ...(texts ?? {}) },
    }),
    [locale, texts, documentLang, outer],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Die wirksame Sprache an dieser Stelle des Baums (Anbieter, sonst global); die Komponente rendert beim Sprachwechsel neu. */
export function useLocale(): string {
  return useT().locale;
}

export interface UseT {
  /** Übersetzt `key` mit `params` in der wirksamen Sprache. */
  t: (key: string, params?: Params) => string;
  /** Optionen für die Funktionen aus `js/` (`{ locale, texts, documentLang }`). */
  options: { locale?: string; texts?: Record<string, CatalogValue>; documentLang?: string };
  locale: string;
  /** Wert für `lang` an der Wurzel des Bausteins (`undefined`, wenn die Sprache der Seite gilt). */
  lang: string | undefined;
}

/**
 * Intern: Texte, Sprache und `lang` eines Bausteins. `own` sind die `texts` der Komponente; sie schlagen die des Anbieters.
 * Liest den Kern über `useSyncExternalStore`, die Komponente rendert bei Sprach-, Katalog- und Textwechsel neu.
 */
export function useT(own?: Record<string, CatalogValue>): UseT {
  useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);
  const context = useContext(I18nContext);
  const texts = own ? { ...(context.texts ?? {}), ...own } : context.texts;
  const options = { locale: context.locale, texts, documentLang: context.documentLang };
  return {
    t: (key, params) => translate(key, params, options),
    options,
    locale: localeOf(options),
    lang: langFor(options) || undefined,
  };
}
