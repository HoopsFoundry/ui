import type { CatalogValue, Params } from '../js/i18n/index.js';

export interface I18nContext {
  locale?: string;
  texts?: Record<string, CatalogValue>;
  documentLang?: string;
}
export interface I18nOptions {
  locale?: string;
  texts?: Record<string, CatalogValue>;
  documentLang?: string;
}
export interface UseI18n {
  readonly options: I18nOptions;
  readonly locale: string;
  readonly lang: string | undefined;
  t(key: string, params?: Params): string;
}
/** Gibt dem Teilbaum Sprache und Texte vor (nur beim Initialisieren einer Komponente aufrufen). */
export function provideI18n(get: () => I18nContext): void;
/** Texte, Sprache und `lang` eines Bausteins (nur beim Initialisieren einer Komponente aufrufen). */
export function useI18n(getTexts?: () => Record<string, CatalogValue> | undefined): UseI18n;
