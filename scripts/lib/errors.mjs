// Zentrale Übersetzung von Systemfehlern in deutsche Meldungen für die Skripte portal-sync.mjs und release-vanilla.mjs.
// Eigene Fehler der Skripte (Meldung beginnt mit dem Skriptnamen und einem Doppelpunkt) bleiben unverändert.

const OWN = /^(portal-sync|release-vanilla|dss-sync): /;

const TEXT = {
  ENOENT: (p) => `Datei oder Ordner nicht gefunden${p}.`,
  ENOTDIR: (p) => `Ein Teil des Pfads${p} ist kein Ordner (an der Stelle liegt eine Datei).`,
  EISDIR: (p) => `Hier wurde eine Datei erwartet, aber es ist ein Ordner${p}.`,
  EEXIST: (p) => `Existiert bereits${p}.`,
  EACCES: (p) => `Keine Berechtigung${p} (Schreib- oder Leserechte prüfen).`,
  EPERM: (p) => `Vorgang nicht erlaubt${p} (Schreib- oder Leserechte prüfen).`,
  EROFS: (p) => `Das Dateisystem ist schreibgeschützt${p}.`,
  ENOSPC: () => 'Kein Speicherplatz mehr frei.',
  EMFILE: () => 'Zu viele offene Dateien.',
  ENOTEMPTY: (p) => `Der Ordner${p} ist nicht leer.`,
  ECONNREFUSED: () => 'Verbindung abgelehnt (Server nicht erreichbar).',
  ENOTFOUND: () => 'Servername nicht gefunden (Netzwerk oder Adresse prüfen).',
  ECONNRESET: () => 'Die Verbindung wurde unterbrochen.',
  ETIMEDOUT: () => 'Zeitüberschreitung bei der Verbindung.',
};

/**
 * Deutsche Meldung zu einem Fehler. Mit `debug` folgt der Stack. Gibt immer eine Zeichenkette zurück, nie den Fehler selbst.
 */
export function describeError(error, { debug = false, name = 'dss' } = {}) {
  const message = String(error?.message ?? error);
  let text;
  if (OWN.test(message)) {
    text = message;
  } else if (error?.code === 'ERR_MODULE_NOT_FOUND' || /Cannot find (module|package)/.test(message)) {
    const what = message.match(/Cannot find (?:module|package) '([^']+)'/)?.[1];
    text = `${name}: Ein Modul fehlt${what ? ` (${what})` : ''}. Wurde das Paket vollständig installiert (npm install)?`;
  } else if (typeof error?.code === 'string' && TEXT[error.code]) {
    const target = error.path ? ` (${error.path})` : '';
    text = `${name}: ${TEXT[error.code](target)}`;
  } else {
    text = `${name}: Unerwarteter Fehler: ${message}${debug ? '' : ' (mit --debug folgt der Stack)'}`;
  }
  // --debug: die ursprüngliche Meldung des Systems und, soweit vorhanden, der Stack (Fehler aus fs.promises haben oft keinen)
  return debug ? `${text}\nTechnisch: ${error?.code ? `${error.code}: ` : ''}${message}${error?.stack ? `\n${error.stack}` : ''}` : text;
}

/** Führt `main` aus; bei einem Fehler: deutsche Meldung auf stderr, Exit-Code 1, kein Stack ohne `debug`. */
export async function runCli(name, main, { debug = false } = {}) {
  try {
    await main();
  } catch (error) {
    console.error(describeError(error, { debug, name }));
    process.exitCode = 1;
  }
}
