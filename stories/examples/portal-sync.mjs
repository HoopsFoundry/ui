// Beispiel: Ein Vanilla-Projekt (statisches Portal, GitHub Pages) kopiert das Vanilla-Paket aus node_modules nach _site/dss.
// Das Skript gehört in das Projekt, nicht in dieses Paket. Aufruf nach `npm install` und vor dem Veröffentlichen:  node portal-sync.mjs
// Ergebnis:  _site/dss/dss.js, dss.min.js, dss.css, dss.d.ts, Quellkarten, courtlines/, version.json  (und optional _site/vendor/leaflet/).
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE = '@bbv/dss-design-system';

/**
 * Kopiert dist/vanilla aus dem installierten Paket nach `to` (Standard `_site/dss`). Mit `fonts: true` auch fonts/ (Schriftdateien und fonts.css),
 * mit `leaflet: true` das installierte Leaflet nach `vendorTo` (Standard `_site/vendor/leaflet`), damit die Karte nicht von unpkg lädt.
 * Gibt die Version des Pakets zurück; in `version.json` steht sie für den Abgleich mit dem Stylesheet (`--dss-version`).
 */
export async function syncDss({ root = process.cwd(), to = join(root, '_site/dss'), vendorTo = join(root, '_site/vendor/leaflet'), fonts = false, leaflet = false } = {}) {
  const pkgDir = join(root, 'node_modules', PACKAGE);
  const pkg = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'));
  await rm(to, { recursive: true, force: true });
  await mkdir(to, { recursive: true });
  await cp(join(pkgDir, 'dist/vanilla'), to, { recursive: true });
  if (fonts) await cp(join(pkgDir, 'fonts'), join(to, 'fonts'), { recursive: true });
  if (leaflet) {
    await rm(vendorTo, { recursive: true, force: true });
    await mkdir(vendorTo, { recursive: true });
    await cp(join(root, 'node_modules/leaflet/dist'), vendorTo, { recursive: true });
  }
  await writeFile(join(to, 'version.json'), `${JSON.stringify({ name: pkg.name, version: pkg.version })}\n`);
  return pkg.version;
}

// Direktaufruf (node portal-sync.mjs): kopiert mit den Standardpfaden
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const version = await syncDss({ fonts: true, leaflet: true });
  console.log(`${PACKAGE} ${version} nach _site/dss kopiert`);
}
