#!/usr/bin/env node
// hoops-sync / portal-sync: legt das Vanilla-Paket (dist/vanilla) in ein statisches Projekt (GitHub Pages u. ä.) nach _site/hoops.
// Das Skript ist Teil des Produkts: im npm-Paket (scripts/portal-sync.mjs, Befehl `hoops-sync`) und als Release-Anhang `hoops-sync.mjs`
// (eine Datei ohne Abhängigkeiten, mit eigener .sha256). Aufruf im Projekt vor dem Veröffentlichen:
//
//   node hoops-sync.mjs --from-release 0.10.0           # Release-Anhang von GitHub, Prüfsumme wird geprüft (Auslieferung bis 1.0)
//   node hoops-sync.mjs --from-package                 # installiertes npm-Paket aus node_modules (Standard; ab 1.0 die Auslieferung)
//   node hoops-sync.mjs --from-dir pfad/zum/ordner     # entpackter Release-Ordner oder Paketordner (offline, z. B. nach manuellem Download)
//   Weitere Schalter: --to <ordner> (Standard _site/hoops), --no-fonts, --leaflet (Leaflet aus node_modules nach _site/vendor/leaflet, Pflicht),
//   --base-url <url> (Standard: GitHub-Release-Adresse dieses Pakets), --allow-insecure-http (http außerhalb von Loopback),
//   --allow-redirect-host <host> (weiteren Host für Weiterleitungen freigeben), --debug (Stack bei Fehlern).
// Ergebnis:  _site/hoops/hoops.js, hoops.min.js, hoops-render*.js, hoops-map*.js, hoops.css, *.d.ts, Quellkarten, courtlines/, version.json  (und optional fonts/).
// Voraussetzung: Node 18 oder neuer (getestet mit 18.20.8, 20.20.2 und 22.21.0).
//
// Die Quelle ist austauschbar: Der Aufbau von dist/vanilla ist in allen drei Fällen derselbe. Der Wechsel auf npm ab 1.0 ändert nur die Quelle
// (aus --from-release wird --from-package), nicht das Ergebnis.
//
// Das Zielverzeichnis gehört dem Paket: Es wird bei jedem Lauf vollständig ersetzt. Deshalb schützt sich das Skript:
//  - die Quelle wird vollständig geholt und geprüft (Prüfsumme, Version, Dateinamen), bevor das Ziel angefasst wird;
//  - gebaut wird zuerst in einem Nachbarordner (`<ziel>.tmp-<pid>`); danach wird das alte Ziel nach `<ziel>.old-<pid>` verschoben, das neue eingesetzt
//    und das alte gelöscht; scheitert das Einsetzen, kommt das alte Ziel zurück;
//  - eine Sperrdatei `.hoops-sync.lock` im Elternordner verhindert zwei gleichzeitige Läufe;
//  - ein Ziel, das nicht leer ist und keine Marker-Datei `.hoops-sync` trägt, wird nie gelöscht (Abbruch mit Fehler);
//  - das Projekt-Root, ein Elternordner davon und `node_modules` sind als Ziel verboten.
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { download } from './lib/download.mjs';
import { runCli } from './lib/errors.mjs';
import { acquireLock, copyDir } from './lib/fsutil.mjs';
import { PROJECT } from './lib/project-config.mjs';
import { assertNode } from './lib/runtime.mjs';
import { parseSums, readTgz } from './lib/tar.mjs';

export { readTgz, parseSums };
const PACKAGE = PROJECT.npmPackage;
const MARKER = '.hoops-sync';
/** Eingebaute Release-Adresse (aus project.config.json); die Datei liegt unter `<basis>/v<version>/hoops-ui-<version>.tgz`. Vorrang: --base-url, Variable HOOPS_UI_BASE_URL, dieser Wert. */
export const RELEASE_BASE_URL = PROJECT.releaseBaseUrl;
/** Rangfolge der Release-Basisadresse: Option `--base-url` > Variable HOOPS_UI_BASE_URL > eingebauter Wert aus project.config.json. */
export const resolveBaseUrl = (explicit, env = process.env) => explicit || env.HOOPS_UI_BASE_URL || RELEASE_BASE_URL;
const VERSION_PATTERN = /^\d{1,6}\.\d{1,6}\.\d{1,6}(-[0-9A-Za-z.-]{1,32})?$/;

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

/**
 * Holt `hoops-ui-<version>.tgz` und `.sha256` unter `<baseUrl>/v<version>/`, prüft die Prüfsumme des Tarballs und jeder Datei darin, prüft,
 * dass Ordnername und `version.json` die verlangte Version tragen, und schreibt den Inhalt in `dir`. Wirft bei jeder Abweichung; `dir` bleibt dann leer.
 */
async function fetchRelease({ version, baseUrl, net }, dir) {
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) throw new Error(`portal-sync: ungültige Version ${JSON.stringify(version)} (erwartet z. B. 0.10.0).`);
  const prefix = `hoops-ui-${version}`;
  const base = `${String(baseUrl).replace(/\/+$/, '')}/v${version}`;
  const tgz = await download(`${base}/${prefix}.tgz`, net);
  const sums = parseSums((await download(`${base}/${prefix}.sha256`, { ...net, maxBytes: 1024 * 1024 })).toString('utf8'));
  const expected = sums.get(`${prefix}.tgz`);
  if (!expected) throw new Error(`portal-sync: ${prefix}.sha256 enthält keine Prüfsumme für ${prefix}.tgz.`);
  if (sha256(tgz) !== expected) throw new Error(`portal-sync: Prüfsumme von ${prefix}.tgz stimmt nicht (erwartet ${expected}, erhalten ${sha256(tgz)}). Nichts wurde geändert.`);
  const files = readTgz(tgz, { expectedTop: prefix });
  for (const file of files) {
    const want = sums.get(`${prefix}/${file.path}`);
    if (want !== sha256(file.data)) throw new Error(`portal-sync: Prüfsumme der Datei ${file.path} stimmt nicht oder fehlt in ${prefix}.sha256.`);
  }
  const listed = [...sums.keys()].filter((n) => n !== `${prefix}.tgz`);
  if (listed.length !== files.length) throw new Error(`portal-sync: ${prefix}.sha256 und Archiv enthalten nicht dieselben Dateien.`);
  const info = files.find((f) => f.path === 'version.json');
  let parsed;
  try {
    parsed = JSON.parse(info?.data.toString('utf8') ?? 'null');
  } catch {
    parsed = null;
  }
  if (!parsed || parsed.version !== version || parsed.name !== PACKAGE) {
    throw new Error(`portal-sync: version.json im Archiv nennt ${parsed?.name ?? '?'} ${parsed?.version ?? '?'}, verlangt war ${PACKAGE} ${version}.`);
  }
  for (const file of files) {
    const out = join(dir, ...file.path.split('/'));
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, file.data);
  }
}

// ── Ziel ───────────────────────────────────────────────────────

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

/**
 * Baut `target` in einem temporären Nachbarordner und setzt es dann ein: das alte Ziel wird nach `<ziel>.old-<pid>` verschoben, das neue
 * umbenannt, das alte gelöscht. Scheitert das Einsetzen, kommt das alte Ziel zurück. Temporäre Ordner werden in jedem Fall aufgeräumt.
 */
export async function replaceDir(target, root, fill, hooks = {}) {
  await assertSafeTarget(target, root);
  const dest = resolve(target);
  const tmp = `${dest}.tmp-${process.pid}`;
  const old = `${dest}.old-${process.pid}`;
  await rm(tmp, { recursive: true, force: true });
  await rm(old, { recursive: true, force: true });
  await mkdir(tmp, { recursive: true });
  let moved = false;
  try {
    await fill(tmp);
    await writeFile(join(tmp, MARKER), 'Dieser Ordner gehört portal-sync.mjs und wird bei jedem Lauf ersetzt.\n');
    await mkdir(dirname(dest), { recursive: true });
    if (await exists(dest)) {
      await rename(dest, old);
      moved = true;
    }
    await hooks.beforeInstall?.(tmp);
    await rename(tmp, dest);
  } catch (error) {
    if (moved && !(await exists(dest))) await rename(old, dest).catch(() => {});
    throw error;
  } finally {
    await rm(tmp, { recursive: true, force: true });
    await rm(old, { recursive: true, force: true });
  }
}

/**
 * Löst die Quelle auf: gibt `{ distDir, fontsDir, name, version, cleanup }` zurück. `distDir` hat den Aufbau von dist/vanilla.
 *  - `{ type: 'package' }` (Standard): node_modules/@hoopsfoundry/ui im Projekt `root`;
 *  - `{ type: 'dir', path }`: ein Paketordner (mit dist/vanilla) oder ein entpackter Release-Ordner (mit hoops.js und version.json);
 *  - `{ type: 'release', version, baseUrl?, fetch? }`: Release-Anhang, geprüft und in einen temporären Ordner entpackt.
 */
async function resolveSource(source, root) {
  if (source.type === 'release') {
    const dir = await mkdtemp(join(tmpdir(), 'hoops-release-'));
    const cleanup = () => rm(dir, { recursive: true, force: true });
    try {
      const net = { fetchFn: source.fetch ?? globalThis.fetch, allowInsecureHttp: source.allowInsecureHttp, redirectHosts: source.redirectHosts, timeoutMs: source.timeoutMs, idleMs: source.idleMs, maxBytes: source.maxBytes };
      await fetchRelease({ version: source.version, baseUrl: resolveBaseUrl(source.baseUrl), net }, dir);
    } catch (error) {
      await cleanup();
      throw error;
    }
    const info = JSON.parse(await readFile(join(dir, 'version.json'), 'utf8'));
    return { distDir: dir, fontsDir: join(dir, 'fonts'), name: info.name, version: info.version, cleanup };
  }
  const base = source.type === 'dir' ? resolve(source.path) : join(root, 'node_modules', PACKAGE);
  if (source.type === 'dir' && !(await exists(base))) throw new Error(`portal-sync: Quellordner ${base} existiert nicht.`);
  if (await exists(join(base, 'dist/vanilla'))) {
    const pkg = JSON.parse(await readFile(join(base, 'package.json'), 'utf8'));
    return { distDir: join(base, 'dist/vanilla'), fontsDir: join(base, 'fonts'), name: pkg.name, version: pkg.version, cleanup: async () => {} };
  }
  if (source.type === 'dir' && (await exists(join(base, 'hoops.js')))) {
    const info = JSON.parse(await readFile(join(base, 'version.json'), 'utf8').catch(() => 'null'));
    if (!info?.version) throw new Error(`portal-sync: ${base} hat keine lesbare version.json (kein Release-Ordner?).`);
    return { distDir: base, fontsDir: join(base, 'fonts'), name: info.name, version: info.version, cleanup: async () => {} };
  }
  // ohne installiertes Paket: derselbe Fehler wie zuvor (package.json fehlt)
  await readFile(join(base, 'package.json'), 'utf8');
  throw new Error(`portal-sync: ${base} enthält weder dist/vanilla noch hoops.js.`);
}

/**
 * Legt das Vanilla-Paket nach `to` (Standard `_site/hoops`). Mit `fonts: true` auch fonts/ (Schriftdateien und fonts.css).
 * `source`: siehe resolveSource (Standard: installiertes Paket). `leaflet`: `true` kopiert das installierte Leaflet nach `vendorTo`
 * (Standard `_site/vendor/leaflet`) und wirft, wenn es fehlt; `'auto'` kopiert es nur, wenn es installiert ist; `false` (Standard) lässt es aus.
 * `version.json` (Name und Version, für den Abgleich mit `--hoops-version`) entsteht zuerst. Gibt `{ version, leaflet }` zurück.
 */
export async function syncHoops({ root = process.cwd(), to = join(root, '_site/hoops'), vendorTo = join(root, '_site/vendor/leaflet'), fonts = false, leaflet = false, source = { type: 'package' } } = {}) {
  const leafletDist = join(root, 'node_modules/leaflet/dist');
  const hasLeaflet = await exists(leafletDist);
  if (leaflet === true && !hasLeaflet) throw new Error('portal-sync: leaflet ist nicht installiert (node_modules/leaflet/dist fehlt).');
  const withLeaflet = Boolean(leaflet) && hasLeaflet;
  await assertSafeTarget(to, root);
  if (withLeaflet) await assertSafeTarget(vendorTo, root);

  const src = await resolveSource(source, root);
  let unlock = async () => {};
  try {
    unlock = await acquireLock(dirname(resolve(to)), '.hoops-sync.lock', 'portal-sync');
    await replaceDir(to, root, async (tmp) => {
      await writeFile(join(tmp, 'version.json'), `${JSON.stringify({ name: src.name, version: src.version })}\n`);
      // fonts/ und version.json aus einem Release-Ordner kommen nicht ungefragt mit
      await copyDir(src.distDir, tmp, (path) => !(path === join(src.distDir, 'fonts') || path === join(src.distDir, 'version.json')));
      if (fonts) await copyDir(src.fontsDir, join(tmp, 'fonts'));
    });
    if (withLeaflet) await replaceDir(vendorTo, root, (tmp) => copyDir(leafletDist, tmp));
  } finally {
    await unlock();
    await src.cleanup();
  }
  return { version: src.version, leaflet: withLeaflet };
}

/** Liest die Befehlszeile (`--from-release 0.10.0`, `--from-dir pfad`, `--from-package`, `--to`, `--base-url`, `--no-fonts`, `--leaflet`, `--allow-insecure-http`, `--allow-redirect-host`, `--debug`). */
export function parseArgs(argv) {
  const options = { source: { type: 'package' }, fonts: true, leaflet: 'auto' };
  const value = (i, flag) => {
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`portal-sync: ${flag} braucht einen Wert.`);
    return argv[i + 1];
  };
  let baseUrl;
  const net = { redirectHosts: [] };
  const sources = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from-package') sources.push({ type: 'package' });
    else if (arg === '--from-release') sources.push({ type: 'release', version: value(i++, arg) });
    else if (arg === '--from-dir') sources.push({ type: 'dir', path: value(i++, arg) });
    else if (arg === '--base-url') baseUrl = value(i++, arg);
    else if (arg === '--to') options.to = resolve(value(i++, arg));
    else if (arg === '--no-fonts') options.fonts = false;
    else if (arg === '--leaflet') options.leaflet = true;
    else if (arg === '--allow-insecure-http') net.allowInsecureHttp = true;
    else if (arg === '--allow-redirect-host') net.redirectHosts.push(value(i++, arg));
    else if (arg === '--debug') options.debug = true;
    else throw new Error(`portal-sync: unbekannte Option ${arg}`);
  }
  if (sources.length > 1) throw new Error('portal-sync: genau eine Quelle (--from-release, --from-package oder --from-dir) angeben.');
  if (sources[0]) options.source = sources[0];
  if (baseUrl !== undefined) {
    if (options.source.type !== 'release') throw new Error('portal-sync: --base-url gilt nur mit --from-release.');
    options.source = { ...options.source, baseUrl };
  }
  if (net.allowInsecureHttp || net.redirectHosts.length) {
    if (options.source.type !== 'release') throw new Error('portal-sync: --allow-insecure-http und --allow-redirect-host gelten nur mit --from-release.');
    options.source = { ...options.source, ...net };
  }
  return options;
}

// Direktaufruf (node portal-sync.mjs oder der Befehl hoops-sync, auch über eine Verknüpfung): kopiert mit den Standardpfaden
const isMain = async () => {
  if (!process.argv[1]) return false;
  try {
    return (await realpath(fileURLToPath(import.meta.url))) === (await realpath(resolve(process.argv[1])));
  } catch {
    return false;
  }
};
if (await isMain()) {
  const debug = process.argv.includes('--debug');
  await runCli('portal-sync', async () => {
    assertNode('portal-sync');
    const options = parseArgs(process.argv.slice(2));
    const { version, leaflet } = await syncHoops(options);
    console.log(`${PACKAGE} ${version} nach ${options.to ? options.to : '_site/hoops'} kopiert${leaflet ? ', Leaflet nach _site/vendor/leaflet' : ''}`);
  }, { debug });
}
