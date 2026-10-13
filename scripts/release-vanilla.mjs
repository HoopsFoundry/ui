#!/usr/bin/env node
// Release-Ablauf des Vanilla-Pakets (Auslieferung per Release-Anhang, ab 1.0 zusätzlich npm). Kein Netz, kein Git-Push, kein Tag.
//
//   node scripts/release-vanilla.mjs [--dry-run] [--allow-dirty] [--no-build] [--no-sourcemaps] [--out=release] [--expect-version=0.9.0]
//
// Schritte (in dieser Reihenfolge, STEPS):
//   clean    der Arbeitsbaum ist sauber (git status --porcelain); mit --allow-dirty übersprungen
//   version  package.json == VERSION in allen sechs Bündeldateien == `--dss-version` in dss.css (und == --expect-version, falls gesetzt)
//   build    npm run build:vanilla (mit --no-build übersprungen: das vorhandene dist/vanilla wird geprüft)
//   pack     release/dss-vanilla-<version>.tgz (dist/vanilla und fonts/ unter dem Ordner dss-vanilla-<version>/, dazu version.json),
//            reproduzierbar (feste Reihenfolge, Zeitstempel 0), .sha256 (sha256sum-Format) und manifest.json
//   verify   der Tarball wird mit dem Leser von portal-sync.mjs gelesen, jede Datei gegen die Prüfsummen geprüft
// Scheitert ein Schritt, bleibt in `release/` nichts Halbfertiges zurück (geschrieben wird in einen temporären Ordner, erst danach verschoben).
// --dry-run führt alle Prüfungen aus (außer build bei --no-build), schreibt aber nichts.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { BUDGETS } from './vanilla-budgets.mjs';
import { readTgz } from '../stories/examples/portal-sync.mjs';

export const STEPS = ['clean', 'version', 'build', 'pack', 'verify'];
export const NAME = '@bbv/dss-design-system';
export const BUNDLE_FILES = ['dss.js', 'dss.min.js', 'dss-render.js', 'dss-render.min.js', 'dss-map.js', 'dss-map.min.js'];

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const sha256 = (data) => createHash('sha256').update(data).digest('hex');
const kib = (bytes) => Math.round((bytes / 1024) * 10) / 10;

/** Alle Dateien unter `dir` als sortierte relative Pfade mit `/`. */
async function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(path, base)));
    else if (entry.isFile()) out.push(relative(base, path).split(sep).join('/'));
  }
  return out;
}

/** Schreibt eine Zahl als nullterminiertes Oktalfeld der Länge `length`. */
function octal(value, length) {
  return Buffer.from(`${value.toString(8).padStart(length - 1, '0')}\0`, 'latin1');
}

/** Baut einen ustar-Tarball (nur Dateien; Namen bis 100 Zeichen; Zeitstempel 0, Besitzer 0, Modus 0644). */
export function createTar(entries) {
  const blocks = [];
  for (const { path: name, data } of entries) {
    if (Buffer.byteLength(name) > 100) throw new Error(`release-vanilla: Dateiname zu lang für ustar: ${name}`);
    const header = Buffer.alloc(512);
    header.write(name, 0, 'latin1');
    octal(0o644, 8).copy(header, 100);
    octal(0, 8).copy(header, 108);
    octal(0, 8).copy(header, 116);
    octal(data.length, 12).copy(header, 124);
    octal(0, 12).copy(header, 136);
    header.fill(0x20, 148, 156);
    header.write('0', 156, 'latin1');
    header.write('ustar\0', 257, 'latin1');
    header.write('00', 263, 'latin1');
    let sum = 0;
    for (const byte of header) sum += byte;
    Buffer.from(`${sum.toString(8).padStart(6, '0')}\0 `, 'latin1').copy(header, 148);
    blocks.push(header, data, Buffer.alloc((512 - (data.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

/** Liest VERSION aus den Bündeldateien (sie werden importiert: so ist auch geprüft, dass sie ladbar sind). */
async function bundleVersions(bundleDir) {
  const versions = {};
  for (const file of BUNDLE_FILES) {
    const mod = await import(pathToFileURL(join(bundleDir, file)).href);
    versions[file] = mod.VERSION;
  }
  return versions;
}

/**
 * Prüft, dass package.json, alle Bündeldateien und dss.css dieselbe Version tragen. Gibt `{ version, found }` zurück
 * und wirft mit allen Abweichungen in einer Meldung.
 */
export async function checkVersions({ root = ROOT, bundleDir = join(root, 'dist/vanilla'), expect } = {}) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const css = await readFile(join(bundleDir, 'dss.css'), 'utf8');
  const cssVersion = css.match(/--dss-version:\s*"([^"]+)"/)?.[1] ?? null;
  const found = { 'package.json': pkg.version, ...(await bundleVersions(bundleDir)), 'dss.css': cssVersion };
  const wrong = Object.entries(found).filter(([, v]) => v !== pkg.version);
  if (expect !== undefined && expect !== pkg.version) wrong.push(['--expect-version', expect]);
  if (wrong.length) {
    throw new Error(`release-vanilla: Versionen passen nicht zusammen (package.json ${pkg.version}): ${wrong.map(([f, v]) => `${f} ${v}`).join(', ')}`);
  }
  return { version: pkg.version, found };
}

/** Importe des Bündels auf Dateien desselben Ordners (`from "./dss.js"`). */
const importsOf = (code) => [...new Set([...code.matchAll(/from\s*["']\.\/([\w.-]+\.js)["']/g)].map((m) => m[1]))];

/** Inhalt von manifest.json: Dateien mit Größen (Byte und KiB, min und gzip), Budgets, Abhängigkeiten, Leaflet-Hinweis. */
export async function buildManifest({ root = ROOT, bundleDir, version, files, tarball }) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const bundles = {};
  for (const [id, budget] of Object.entries(BUDGETS)) {
    const min = await readFile(join(bundleDir, budget.file));
    const gz = gzipSync(min, { level: 9 }).length;
    const requires = importsOf(min.toString('utf8')).map((f) => f.replace(/\.min\.js$|\.js$/g, ''));
    bundles[id] = {
      file: budget.file, minBytes: min.length, gzipBytes: gz, minKiB: kib(min.length), gzipKiB: kib(gz),
      budget: { minBytes: budget.minBytes, gzipBytes: budget.gzipBytes, minKiB: kib(budget.minBytes), gzipKiB: kib(budget.gzipBytes) },
      requires, css: 'dss.css',
    };
  }
  const leafletRange = pkg.peerDependencies?.leaflet ?? null;
  return {
    name: NAME,
    version,
    tarball,
    files: files.map((f) => ({ path: f.path, bytes: f.data.length, sha256: sha256(f.data) })),
    bundles,
    modules: 'ES-Module (script type="module"), Ziel es2020',
    leaflet: {
      required: false,
      range: leafletRange,
      note: 'Leaflet gehört nicht zum Release. Es wird nur für die Karte gebraucht, lokal ausgeliefert (loadLeaflet) und erst nach dem Klick geladen.',
    },
    pairing: 'dss.js, dss-render.js, dss-map.js und dss.css einer Version gehören zusammen (VERSION im Bündel == --dss-version in dss.css).',
  };
}

/**
 * Führt den Ablauf aus. Optionen: `root`, `bundleDir` (Standard `dist/vanilla`), `outDir` (Standard `release`), `allowDirty`, `dryRun`,
 * `build` (Funktion, Standard npm run build:vanilla; `false` = nicht bauen), `sourcemaps` (Standard true), `expect` (erwartete Version),
 * `gitStatus` (Funktion, gibt die porcelain-Ausgabe zurück), `log`. Gibt `{ version, steps, files, outDir, dryRun }` zurück.
 */
export async function releaseVanilla({
  root = ROOT, bundleDir = join(root, 'dist/vanilla'), outDir = join(root, 'release'), allowDirty = false, dryRun = false,
  build, sourcemaps = true, expect, gitStatus, log = () => {},
} = {}) {
  const steps = [];
  const step = (name, detail = '') => {
    steps.push(name);
    log(`${name}${detail ? `: ${detail}` : ''}`);
  };
  if (!allowDirty) {
    const status = gitStatus ? await gitStatus() : execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    if (status.trim()) throw new Error('release-vanilla: Der Arbeitsbaum ist nicht sauber (git status --porcelain). Committe oder verwende --allow-dirty.');
    step('clean');
  }
  // Version vor dem Bauen gegen package.json prüfen ist sinnlos (alte Bündel): erst bauen, dann prüfen
  if (build !== false) {
    if (build) await build();
    else execFileSync('npm', ['run', 'build:vanilla', '--silent'], { cwd: root, stdio: 'inherit' });
    step('build');
  }
  const { version, found } = await checkVersions({ root, bundleDir, expect });
  step('version', `${version} (${Object.keys(found).length} Stellen)`);

  const prefix = `dss-vanilla-${version}`;
  const names = (await listFiles(bundleDir)).filter((n) => sourcemaps || !n.endsWith('.map'));
  const files = [];
  for (const name of names) files.push({ path: `${prefix}/${name}`, data: await readFile(join(bundleDir, name)) });
  const fontsDir = join(root, 'fonts');
  if (existsSync(fontsDir)) for (const name of await listFiles(fontsDir)) files.push({ path: `${prefix}/fonts/${name}`, data: await readFile(join(fontsDir, name)) });
  files.push({ path: `${prefix}/version.json`, data: Buffer.from(`${JSON.stringify({ name: NAME, version })}\n`) });
  files.sort((a, b) => (a.path < b.path ? -1 : 1));

  const tgz = gzipSync(createTar(files), { level: 9 });
  const tgzName = `${prefix}.tgz`;
  const sums = [`${sha256(tgz)}  ${tgzName}`, ...files.map((f) => `${sha256(f.data)}  ${f.path}`)].join('\n') + '\n';
  const manifest = await buildManifest({
    root, bundleDir, version, files,
    tarball: { name: tgzName, bytes: tgz.length, sha256: sha256(tgz), sha256File: `${prefix}.sha256` },
  });
  step('pack', `${tgzName}, ${kib(tgz.length)} KiB, ${files.length} Dateien`);

  // Gegenprobe mit dem Leser der Verbraucher-Seite: Namen, Reihenfolge und Inhalt müssen mit den Prüfsummen übereinstimmen
  const read = readTgz(tgz, { expectedTop: prefix });
  const same = read.length === files.length && read.every((r, i) => r.path === files[i].path.slice(prefix.length + 1) && sha256(r.data) === sha256(files[i].data));
  if (!same) throw new Error('release-vanilla: Der erzeugte Tarball stimmt beim Zurücklesen nicht mit den Dateien überein.');
  step('verify', `${read.length} Dateien`);

  if (!dryRun) {
    const tmp = `${resolve(outDir)}.tmp-${process.pid}`;
    await rm(tmp, { recursive: true, force: true });
    await mkdir(tmp, { recursive: true });
    try {
      await writeFile(join(tmp, tgzName), tgz);
      await writeFile(join(tmp, `${prefix}.sha256`), sums);
      await writeFile(join(tmp, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      await rm(outDir, { recursive: true, force: true });
      await rename(tmp, outDir);
    } catch (error) {
      await rm(tmp, { recursive: true, force: true });
      throw error;
    }
  }
  return { version, steps, files: files.map((f) => f.path), outDir, dryRun, manifest, sums, tgz };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const flags = new Set(process.argv.slice(2).filter((a) => !a.includes('=')));
  const values = Object.fromEntries(process.argv.slice(2).filter((a) => a.includes('=')).map((a) => a.replace(/^--/, '').split('=')));
  try {
    const result = await releaseVanilla({
      allowDirty: flags.has('--allow-dirty'), dryRun: flags.has('--dry-run'), build: flags.has('--no-build') ? false : undefined,
      sourcemaps: !flags.has('--no-sourcemaps'), expect: values['expect-version'], outDir: values.out ? resolve(values.out) : undefined,
      log: (line) => console.log(`  ${line}`),
    });
    console.log(`${result.dryRun ? 'Probelauf (nichts geschrieben)' : `geschrieben nach ${relative(ROOT, result.outDir) || '.'}`}: ${NAME} ${result.version}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
