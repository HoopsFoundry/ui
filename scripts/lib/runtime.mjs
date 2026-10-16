// Mindestversion von Node für die Skripte portal-sync.mjs und release-vanilla.mjs.
// Bestimmt aus den benutzten Schnittstellen: globales fetch (ab Node 18), AbortSignal/AbortController, Web-Streams der Antwort, gunzipSync mit
// maxOutputLength (ab 14.5), fs.rm und fs.mkdtemp. Bewusst nicht benutzt wird fs.cp (bis Node 22.3 als experimentell gemeldet).
// Geprüft wurde mit Node 20.20.2 und 22.21.0 (siehe Tests); Node 18 ist nach der Schnittstellenliste möglich, aber nicht getestet.
export const MIN_NODE_MAJOR = 18;

/** Wirft mit deutscher Meldung, wenn Node zu alt ist. `version` ist für Tests austauschbar. */
export function assertNode(name, version = process.versions.node) {
  const major = Number.parseInt(String(version).split('.')[0], 10);
  if (!Number.isFinite(major) || major < MIN_NODE_MAJOR) {
    throw new Error(`${name}: Node ${version} ist zu alt. Gebraucht wird Node ${MIN_NODE_MAJOR} oder neuer (getestet mit 20 und 22).`);
  }
}
