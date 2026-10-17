/** Eine Mehrzahlform: Kategorien von `Intl.PluralRules`; `one` und `other` sind Pflicht, `{count}` ist die Zahl. */
export interface PluralObject {
  zero?: string;
  one: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}
export type CatalogValue = string | PluralObject;
export type Catalog = Record<string, CatalogValue>;
export type Params = Record<string, string | number | null | undefined>;
export interface TOptions {
  /** Sprache nur für diesen Aufruf (sonst die globale Sprache). */
  locale?: string;
  /** Überschreibungen nur für diesen Aufruf; schlagen globale Überschreibungen und Kataloge. */
  texts?: Record<string, CatalogValue>;
}
/** Übersetzt `key`. Fehlt er in allen Katalogen, ist das Ergebnis der Schlüssel selbst (Entwicklung: einmalige Warnung). */
export function t(key: string, params?: Params, options?: TOptions): string;
/** Globale Sprache setzen (Schreibweise wie `de-AT` bleibt erhalten). */
export function setLocale(code: string): void;
/** Aktuelle globale Sprache; Standard `en`. */
export function getLocale(): string;
/** Katalog hinzufügen oder ersetzen. */
export function registerLocale(code: string, catalog: Catalog): void;
/** Globale Überschreibungen setzen; ersetzt die vorherigen, `{}` löscht. */
export function setTexts(overrides: Record<string, CatalogValue>): void;
export function getTexts(): Record<string, CatalogValue>;
/** Änderungen abonnieren; gibt die Abmeldefunktion zurück. */
export function subscribe(fn: (locale: string) => void): () => void;
/** `options.locale` oder die globale Sprache. */
export function localeOf(options?: { locale?: string }): string;
/** Registrierte Sprachcodes. */
export function availableLocales(): string[];
/** Nur für Tests: Zustand auf Werkseinstellung zurücksetzen. */
export function __resetForTests(): void;
/** Nur für Tests: Zahl der Abonnenten (Prüfung auf Lecks). */
export function __subscriberCount(): number;
