// Beispiel: Ein Vanilla-Projekt (statisches Portal, GitHub Pages) holt das Vanilla-Paket und legt es nach _site/dss.
// Das Skript gehört in das Projekt, nicht in dieses Paket. Aufruf vor dem Veröffentlichen:
//
//   node portal-sync.mjs --from-release 0.9.0        # Release-Anhang von GitHub, Prüfsumme wird geprüft (Auslieferung bis 1.0)
//   node portal-sync.mjs --from-package              # installiertes npm-Paket aus node_modules (Standard; ab 1.0 die Auslieferung)
//   node portal-sync.mjs --from-dir pfad/zum/ordner  # entpackter Release-Ordner oder Paketordner (offline, z. B. nach manuellem Download)
//   Weitere Schalter: --to <ordner> (Standard _site/dss), --no-fonts, --leaflet (Leaflet aus node_modules nach _site/vendor/leaflet, Pflicht),
//   --base-url <url> (Standard: GitHub-Release-Adresse dieses Pakets).
// Ergebnis:  _site/dss/dss.js, dss.min.js, dss-render*.js, dss-map*.js, dss.css, *.d.ts, Quellkarten, courtlines/, version.json  (und optional fonts/).
//
// Die Quelle ist austauschbar: Der Aufbau von dist/vanilla ist in allen drei Fällen derselbe. Der Wechsel auf npm ab 1.0 ändert nur die Quelle
// (aus --from-release wird --from-package), nicht das Ergebnis.
//
// Das Zielverzeichnis gehört dem Paket: Es wird bei jedem Lauf vollständig ersetzt. Deshalb schützt sich das Skript:
//  - die Quelle wird vollständig geholt und geprüft (Prüfsumme, Version, Dateinamen), bevor das Ziel angefasst wird;
//  - gebaut wird zuerst in einem Nachbarordner (`<ziel>.tmp-<pid>`), erst danach ersetzt ein Umbenennen das Ziel (bei einem Fehler bleibt das alte Ziel);
//  - ein Ziel, das nicht leer ist und keine Marker-Datei `.dss-sync` trägt, wird nie gelöscht (Abbruch mit Fehler);
//  - das Projekt-Root, ein Elternordner davon und `node_modules` sind als Ziel verboten.
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const PACKAGE = '@bbv/dss-design-system';
const MARKER = '.dss-sync';
/** Release-Adresse dieses Pakets; die Datei liegt unter `<basis>/v<version>/dss-vanilla-<version>.tgz`. */
export const RELEASE_BASE_URL = 'https://github.com/OliEder/dss-design-system/releases/download';
const VERSION_PATTERN = /^\d{1,6}\.\d{1,6}\.\d{1,6}(-[0-9A-Za-z.-]{1,32})?$/;
const MAX_TGZ_BYTES = 32 * 1024 * 1024;
const MAX_UNPACKED_BYTES = 96 * 1024 * 1024;
const MAX_ENTRIES = 2000;

const exists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
const sha256 = (data) => createHash('sha256').update(data).digest('hex');

// ── Tarball und Prüfsummen ─────────────────────────────────────

/** Prüft einen Pfad aus dem Archiv: relativ, ohne `..`, ohne Rückwärtsstrich (Windows), ohne Laufwerk, ohne NUL. */
function safeEntryPath(name) {
  const bad = !name || name.includes('\0') || name.includes('\\') || name.startsWith('/') || name.split('/').some((s) => s === '' || s === '.' || s === '..' || s.includes(':'));
  if (bad) throw new Error(`portal-sync: unzulässiger Pfad im Archiv: ${JSON.stringify(name)}`);
  return name;
}

/**
 * Liest ein .tgz (ustar) vollständig in den Speicher. Es zählen nur reguläre Dateien unter einem einzigen Ordner `expectedTop`; Verknüpfungen,
 * Geräte, doppelte Namen, zu viele oder zu große Einträge und falsche Kopf-Prüfsummen brechen ab. Gibt `[{ path, data }]` mit Pfaden ohne
 * den obersten Ordner zurück (Reihenfolge wie im Archiv).
 */
export function readTgz(buffer, { expectedTop } = {}) {
  let tar;
  try {
    tar = gunzipSync(buffer, { maxOutputLength: MAX_UNPACKED_BYTES });
  } catch (error) {
    throw new Error(`portal-sync: Archiv ist kein gültiges .tgz oder zu groß (${error.message})`);
  }
  const entries = [];
  const seen = new Set();
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break;
    const field = (from, length) => header.toString('latin1', from, from + length).replace(/\0.*$/s, '');
    const stored = parseInt(field(148, 8).trim(), 8);
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += i >= 148 && i < 156 ? 0x20 : header[i];
    if (stored !== sum) throw new Error('portal-sync: Archiv beschädigt (Kopf-Prüfsumme stimmt nicht).');
    const type = field(156, 1) || '0';
    const size = parseInt(field(124, 12).trim() || '0', 8);
    if (!Number.isFinite(size) || size < 0) throw new Error('portal-sync: Archiv beschädigt (Größenangabe).');
    const start = offset + 512;
    if (start + size > tar.length) throw new Error('portal-sync: Archiv abgeschnitten (Datei endet vor ihrer Länge).');
    offset = start + Math.ceil(size / 512) * 512;
    if (type === 'x' || type === 'g') continue; // erweiterte Köpfe: ignoriert
    if (type === '5') {
      safeEntryPath(field(0, 100).replace(/\/$/, ''));
      continue;
    }
    if (type !== '0') throw new Error(`portal-sync: unzulässiger Eintragstyp ${JSON.stringify(type)} im Archiv (nur Dateien und Ordner).`);
    const prefix = field(345, 155);
    const name = safeEntryPath(prefix ? `${prefix}/${field(0, 100)}` : field(0, 100));
    if (seen.has(name)) throw new Error(`portal-sync: doppelter Eintrag im Archiv: ${name}`);
    seen.add(name);
    if (entries.length >= MAX_ENTRIES) throw new Error('portal-sync: zu viele Einträge im Archiv.');
    entries.push({ name, data: Buffer.from(tar.subarray(start, start + size)) });
  }
  if (!entries.length) throw new Error('portal-sync: Archiv enthält keine Dateien.');
  const tops = new Set(entries.map((e) => e.name.split('/')[0]));
  if (entries.some((e) => !e.name.includes('/')) || tops.size !== 1) throw new Error('portal-sync: Archiv muss genau einen obersten Ordner enthalten.');
  const [top] = tops;
  if (expectedTop !== undefined && top !== expectedTop) throw new Error(`portal-sync: oberster Ordner ${top} statt ${expectedTop}.`);
  return entries.map((e) => ({ path: e.name.slice(top.length + 1), data: e.data }));
}

/** Liest eine .sha256-Datei (`<hex>  <name>` je Zeile) als Map Name → Hex. */
export function parseSums(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.match(/^([0-9a-f]{64}) [ *](.+)$/);
    if (!match) throw new Error(`portal-sync: unlesbare Zeile in der Prüfsummen-Datei: ${JSON.stringify(line.slice(0, 80))}`);
    map.set(match[2], match[1]);
  }
  return map;
}

async function download(url, fetchFn) {
  let response;
  try {
    response = await fetchFn(url);
  } catch (error) {
    throw new Error(`portal-sync: Download fehlgeschlagen (${url}): ${error.cause?.message ?? error.message}`);
  }
  if (!response.ok) throw new Error(`portal-sync: Download fehlgeschlagen (${url}): HTTP ${response.status}`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_TGZ_BYTES) throw new Error(`portal-sync: ${url} ist größer als ${MAX_TGZ_BYTES} Byte.`);
  let data;
  try {
    data = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new Error(`portal-sync: Download abgebrochen (${url}): ${error.cause?.message ?? error.message}`);
  }
  if (data.length > MAX_TGZ_BYTES) throw new Error(`portal-sync: ${url} ist größer als ${MAX_TGZ_BYTES} Byte.`);
  if (declared && data.length !== declared) throw new Error(`portal-sync: Download unvollständig (${url}): ${data.length} von ${declared} Byte.`);
  return data;
}

/**
 * Holt `dss-vanilla-<version>.tgz` und `.sha256` unter `<baseUrl>/v<version>/`, prüft die Prüfsumme des Tarballs und jeder Datei darin, prüft,
 * dass Ordnername und `version.json` die verlangte Version tragen, und schreibt den Inhalt in `dir`. Wirft bei jeder Abweichung; `dir` bleibt dann leer.
 */
async function fetchRelease({ version, baseUrl, fetchFn }, dir) {
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) throw new Error(`portal-sync: ungültige Version ${JSON.stringify(version)} (erwartet z. B. 0.9.0).`);
  const prefix = `dss-vanilla-${version}`;
  const base = `${String(baseUrl).replace(/\/+$/, '')}/v${version}`;
  const tgz = await download(`${base}/${prefix}.tgz`, fetchFn);
  const sums = parseSums((await download(`${base}/${prefix}.sha256`, fetchFn)).toString('utf8'));
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
 * Löst die Quelle auf: gibt `{ distDir, fontsDir, name, version, cleanup }` zurück. `distDir` hat den Aufbau von dist/vanilla.
 *  - `{ type: 'package' }` (Standard): node_modules/@bbv/dss-design-system im Projekt `root`;
 *  - `{ type: 'dir', path }`: ein Paketordner (mit dist/vanilla) oder ein entpackter Release-Ordner (mit dss.js und version.json);
 *  - `{ type: 'release', version, baseUrl?, fetch? }`: Release-Anhang, geprüft und in einen temporären Ordner entpackt.
 */
async function resolveSource(source, root) {
  if (source.type === 'release') {
    const dir = await mkdtemp(join(tmpdir(), 'dss-release-'));
    const cleanup = () => rm(dir, { recursive: true, force: true });
    try {
      await fetchRelease({ version: source.version, baseUrl: source.baseUrl ?? RELEASE_BASE_URL, fetchFn: source.fetch ?? globalThis.fetch }, dir);
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
  if (source.type === 'dir' && (await exists(join(base, 'dss.js')))) {
    const info = JSON.parse(await readFile(join(base, 'version.json'), 'utf8').catch(() => 'null'));
    if (!info?.version) throw new Error(`portal-sync: ${base} hat keine lesbare version.json (kein Release-Ordner?).`);
    return { distDir: base, fontsDir: join(base, 'fonts'), name: info.name, version: info.version, cleanup: async () => {} };
  }
  // ohne installiertes Paket: derselbe Fehler wie zuvor (package.json fehlt)
  await readFile(join(base, 'package.json'), 'utf8');
  throw new Error(`portal-sync: ${base} enthält weder dist/vanilla noch dss.js.`);
}

/**
 * Legt das Vanilla-Paket nach `to` (Standard `_site/dss`). Mit `fonts: true` auch fonts/ (Schriftdateien und fonts.css).
 * `source`: siehe resolveSource (Standard: installiertes Paket). `leaflet`: `true` kopiert das installierte Leaflet nach `vendorTo`
 * (Standard `_site/vendor/leaflet`) und wirft, wenn es fehlt; `'auto'` kopiert es nur, wenn es installiert ist; `false` (Standard) lässt es aus.
 * `version.json` (Name und Version, für den Abgleich mit `--dss-version`) entsteht zuerst. Gibt `{ version, leaflet }` zurück.
 */
export async function syncDss({ root = process.cwd(), to = join(root, '_site/dss'), vendorTo = join(root, '_site/vendor/leaflet'), fonts = false, leaflet = false, source = { type: 'package' } } = {}) {
  const leafletDist = join(root, 'node_modules/leaflet/dist');
  const hasLeaflet = await exists(leafletDist);
  if (leaflet === true && !hasLeaflet) throw new Error('portal-sync: leaflet ist nicht installiert (node_modules/leaflet/dist fehlt).');
  const withLeaflet = Boolean(leaflet) && hasLeaflet;
  await assertSafeTarget(to, root);
  if (withLeaflet) await assertSafeTarget(vendorTo, root);

  const src = await resolveSource(source, root);
  try {
    await replaceDir(to, root, async (tmp) => {
      await writeFile(join(tmp, 'version.json'), `${JSON.stringify({ name: src.name, version: src.version })}\n`);
      // fonts/ und version.json aus einem Release-Ordner kommen nicht ungefragt mit
      await cp(src.distDir, tmp, { recursive: true, filter: (path) => !(path === join(src.distDir, 'fonts') || path === join(src.distDir, 'version.json')) });
      if (fonts) await cp(src.fontsDir, join(tmp, 'fonts'), { recursive: true });
    });
    if (withLeaflet) await replaceDir(vendorTo, root, (tmp) => cp(leafletDist, tmp, { recursive: true }));
  } finally {
    await src.cleanup();
  }
  return { version: src.version, leaflet: withLeaflet };
}

/** Liest die Befehlszeile (`--from-release 0.9.0`, `--from-dir pfad`, `--from-package`, `--to`, `--base-url`, `--no-fonts`, `--leaflet`). */
export function parseArgs(argv) {
  const options = { source: { type: 'package' }, fonts: true, leaflet: 'auto' };
  const value = (i, flag) => {
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new Error(`portal-sync: ${flag} braucht einen Wert.`);
    return argv[i + 1];
  };
  let baseUrl;
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
    else throw new Error(`portal-sync: unbekannte Option ${arg}`);
  }
  if (sources.length > 1) throw new Error('portal-sync: genau eine Quelle (--from-release, --from-package oder --from-dir) angeben.');
  if (sources[0]) options.source = sources[0];
  if (baseUrl !== undefined) {
    if (options.source.type !== 'release') throw new Error('portal-sync: --base-url gilt nur mit --from-release.');
    options.source = { ...options.source, baseUrl };
  }
  return options;
}

// Direktaufruf (node portal-sync.mjs): kopiert mit den Standardpfaden, Leaflet nur, wenn es installiert ist
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const { version, leaflet } = await syncDss(options);
    console.log(`${PACKAGE} ${version} nach ${options.to ? options.to : '_site/dss'} kopiert${leaflet ? ', Leaflet nach _site/vendor/leaflet' : ''}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
