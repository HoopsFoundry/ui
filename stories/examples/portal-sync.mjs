// Beispiel: Ein Vanilla-Projekt (statisches Portal, GitHub Pages) kopiert das Vanilla-Paket aus node_modules nach _site/dss.
// Das Skript gehört in das Projekt, nicht in dieses Paket. Aufruf nach `npm install` und vor dem Veröffentlichen:  node portal-sync.mjs
// Ergebnis:  _site/dss/dss.js, dss.min.js, dss.css, dss.d.ts, Quellkarten, courtlines/, version.json  (und optional fonts/ und _site/vendor/leaflet/).
//
// Das Zielverzeichnis gehört dem Paket: Es wird bei jedem Lauf vollständig ersetzt. Deshalb schützt sich das Skript:
//  - gebaut wird zuerst in einem Nachbarordner (`<ziel>.tmp-<pid>`), erst danach ersetzt ein Umbenennen das Ziel (bei einem Fehler bleibt das alte Ziel);
//  - ein Ziel, das nicht leer ist und keine Marker-Datei `.dss-sync` trägt, wird nie gelöscht (Abbruch mit Fehler);
//  - das Projekt-Root, ein Elternordner davon und `node_modules` sind als Ziel verboten.
import { cp, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE = '@bbv/dss-design-system';
const MARKER = '.dss-sync';

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

/** Wirft, wenn `target` nicht vom Skript ersetzt werden darf. */
async function assertSafeTarget(target, root) {
  const t = resolve(target);
  const r = resolve(root);
  if (t === r || r.startsWith(t + sep) || t === dirname(r) || t.startsWith(join(r, 'node_modules') + sep) || t === join(r, 'node_modules')) {
    throw new Error(`portal-sync: Zielordner ${t} ist nicht erlaubt (Projekt-Root, Elternordner oder node_modules).`);
  }
  if (!(await exists(t))) return;
  const entries = await readdir(t);
  if (entries.length && !entries.includes(MARKER)) {
    throw new Error(`portal-sync: ${t} ist nicht leer und hat keine Marker-Datei ${MARKER}; der Ordner gehört nicht diesem Skript und wird nicht gelöscht.`);
  }
}

/** Baut `target` in einem temporären Nachbarordner und ersetzt es erst, wenn alles kopiert ist. */
async function replaceDir(target, root, fill) {
  await assertSafeTarget(target, root);
  const tmp = `${resolve(target)}.tmp-${process.pid}`;
  await rm(tmp, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  try {
    await fill(tmp);
    await writeFile(join(tmp, MARKER), 'Dieser Ordner gehört portal-sync.mjs und wird bei jedem Lauf ersetzt.\n');
  } catch (error) {
    await rm(tmp, { recursive: true, force: true });
    throw error;
  }
  await rm(target, { recursive: true, force: true });
  await mkdir(dirname(resolve(target)), { recursive: true });
  await rename(tmp, target);
}

/**
 * Kopiert dist/vanilla aus dem installierten Paket nach `to` (Standard `_site/dss`). Mit `fonts: true` auch fonts/ (Schriftdateien und fonts.css).
 * `leaflet`: `true` kopiert das installierte Leaflet nach `vendorTo` (Standard `_site/vendor/leaflet`) und wirft, wenn es fehlt; `'auto'` kopiert
 * es nur, wenn es installiert ist; `false` (Standard) lässt es aus. `version.json` (Name und Version, für den Abgleich mit `--dss-version`)
 * entsteht zuerst. Gibt `{ version, leaflet }` zurück.
 */
export async function syncDss({ root = process.cwd(), to = join(root, '_site/dss'), vendorTo = join(root, '_site/vendor/leaflet'), fonts = false, leaflet = false } = {}) {
  const pkgDir = join(root, 'node_modules', PACKAGE);
  const pkg = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'));
  const leafletDist = join(root, 'node_modules/leaflet/dist');
  const hasLeaflet = await exists(leafletDist);
  if (leaflet === true && !hasLeaflet) throw new Error('portal-sync: leaflet ist nicht installiert (node_modules/leaflet/dist fehlt).');
  const withLeaflet = Boolean(leaflet) && hasLeaflet;
  await assertSafeTarget(to, root);
  if (withLeaflet) await assertSafeTarget(vendorTo, root);

  await replaceDir(to, root, async (tmp) => {
    await writeFile(join(tmp, 'version.json'), `${JSON.stringify({ name: pkg.name, version: pkg.version })}\n`);
    await cp(join(pkgDir, 'dist/vanilla'), tmp, { recursive: true });
    if (fonts) await cp(join(pkgDir, 'fonts'), join(tmp, 'fonts'), { recursive: true });
  });
  if (withLeaflet) await replaceDir(vendorTo, root, (tmp) => cp(leafletDist, tmp, { recursive: true }));
  return { version: pkg.version, leaflet: withLeaflet };
}

// Direktaufruf (node portal-sync.mjs): kopiert mit den Standardpfaden, Leaflet nur, wenn es installiert ist
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const { version, leaflet } = await syncDss({ fonts: true, leaflet: 'auto' });
    console.log(`${PACKAGE} ${version} nach _site/dss kopiert${leaflet ? ', Leaflet nach _site/vendor/leaflet' : ''}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
