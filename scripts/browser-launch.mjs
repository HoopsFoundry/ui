/**
 * Gemeinsame Regel der Browser-Prüfskripte (check-browser-matrix.mjs, check-csp-boot.mjs): ein Lauf, in dem kein einziger angeforderter
 * Browser startet, ist nie ein Erfolg. Exit-Code 1 und eine klare Meldung auf stderr, einheitlich in beiden Skripten.
 */
export const ENGINE_NAMES = ['chromium', 'firefox', 'webkit'];

/** Meldung, wenn kein Browser gestartet ist; `notStarted` ist eine Liste `{ browser, reason }`. */
export const noBrowserMessage = (requested, notStarted = []) =>
  `Kein angeforderter Browser ist gestartet (angefordert: ${requested.join(', ') || 'keiner'}). ` +
  (notStarted.length ? `Gründe: ${notStarted.map((n) => `${n.browser}: ${n.reason || 'unbekannt'}`).join('; ')}` : '');

/** Vor dem Bauen: ist keiner der angeforderten Namen bekannt, endet das Skript sofort mit Exit-Code 1. */
export function exitIfNoKnownBrowser(requested) {
  const unknown = requested.filter((name) => !ENGINE_NAMES.includes(name));
  if (unknown.length === requested.length) {
    console.error(noBrowserMessage(requested, unknown.map((browser) => ({ browser, reason: `unbekannter Browser (bekannt: ${ENGINE_NAMES.join(', ')})` }))));
    process.exit(1);
  }
}

/** Nach den Läufen: ist kein Browser gestartet, Meldung und Exit-Code 1; gibt zurück, ob mindestens einer lief. */
export function requireOneStarted(requested, versions, notStarted) {
  if (Object.keys(versions).length > 0) return true;
  console.error(noBrowserMessage(requested, notStarted));
  process.exitCode = 1;
  return false;
}
