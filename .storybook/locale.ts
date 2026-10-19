// Sprache der Storybook-Vorschau (Umschalter „Sprache“, Global `locale`). Läuft als `beforeEach` der Preview: Storybook ruft es vor jedem
// Rendern einer Story auf, auch beim erneuten Rendern nach einem Wechsel der Globals, und zwar außerhalb des Svelte-Renderns. Ein Aufruf von
// `setLocale` während des Renderns (etwa in einem Decorator) meldete den Abonnenten eine Änderung mitten im Rendern; Svelte verbietet das
// (`state_unsafe_mutation`). Beim Wechsel baut Storybook die Stories ohnehin neu auf (neue Knoten, der Fokus springt auf `body`).
import { getLocale, setLocale } from '../js/i18n/index.js';

export type DocLocale = 'de' | 'en';

/** Sprache aus den Globals: `en` nur bei ausdrücklicher Wahl, sonst `de` (Start). */
export function localeFromGlobals(globals: Record<string, unknown> | undefined): DocLocale {
  return globals?.locale === 'en' ? 'en' : 'de';
}

/**
 * Setzt die Sprache der Bausteine (nur bei einem Wechsel, sonst meldete jedes Rendern allen Abonnenten eine Änderung) und die Sprache des
 * Dokuments: Die Doku-Texte sind deutsch, deshalb `lang="de"` auf `<html>`; Bausteine in Englisch tragen dann `lang="en"` an ihrer Wurzel.
 */
export function applyLocale(globals: Record<string, unknown> | undefined): DocLocale {
  if (typeof document !== 'undefined') document.documentElement.lang = 'de';
  const locale = localeFromGlobals(globals);
  if (getLocale() !== locale) setLocale(locale);
  return locale;
}
