/**
 * HoopsFoundry UI · Ereignis `hoops:localechange` (Vanilla-Paket)
 * --------------------------------------------------------------
 * Der DOM-freie Kern (js/i18n/index.js) kennt kein Dokument. Dieses Modul verbindet ihn mit dem Dokument: Solange mindestens ein Baustein
 * gemountet ist (`init*`, `mount*`), abonniert es den Kern und sendet bei jeder Änderung (Sprache, Katalog oder Überschreibungen) auf `document`
 * das `CustomEvent` `hoops:localechange` (`detail: { locale }`). Die Bausteine hören mit `onLocaleChange` darauf und aktualisieren ihre Texte
 * ohne Neuaufbau; `destroy()` meldet sich ab, der letzte Abgang beendet auch das Abonnement am Kern (kein Leck). Beim Import passiert nichts.
 */
import { subscribe } from './i18n/index.js';

export const LOCALE_EVENT = 'hoops:localechange';

let users = 0;
let stop = null;

function retain() {
  users += 1;
  if (users === 1 && typeof document !== 'undefined') {
    stop = subscribe((locale) => {
      try {
        document.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale } }));
      } catch {
        // ein fehlerhafter Hörer darf den Sprachwechsel nicht kippen
      }
    });
  }
}

function release() {
  users = Math.max(0, users - 1);
  if (users === 0 && stop) {
    stop();
    stop = null;
  }
}

/**
 * Ruft `fn(locale)` bei jedem `hoops:localechange` auf; gibt die Abmeldefunktion zurück (mehrfach aufrufbar). Ohne Dokument (Node) tut die Funktion nichts.
 * Ein Fehler in `fn` wird gemeldet, nicht geworfen.
 */
export function onLocaleChange(fn) {
  if (typeof document === 'undefined' || typeof fn !== 'function') return () => {};
  const listener = (event) => {
    try {
      fn(event && event.detail && event.detail.locale);
    } catch (error) {
      console.error('[hoops-i18n] Ein Baustein hat den Sprachwechsel nicht verarbeitet.', error);
    }
  };
  document.addEventListener(LOCALE_EVENT, listener);
  retain();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    document.removeEventListener(LOCALE_EVENT, listener);
    release();
  };
}
