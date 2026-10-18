/** Name des Ereignisses, das bei Änderung von Sprache, Katalog oder Überschreibungen auf `document` gesendet wird. */
export const LOCALE_EVENT: 'hoops:localechange';
/** Ruft `fn(locale)` bei jedem `hoops:localechange` auf; gibt die Abmeldefunktion zurück. */
export function onLocaleChange(fn: (locale: string) => void): () => void;
