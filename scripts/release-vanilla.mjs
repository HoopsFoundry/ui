#!/usr/bin/env node
// Release-Ablauf des Vanilla-Pakets (Auslieferung per Release-Anhang, ab 1.0 zusätzlich npm). Kein Netz, kein Git-Push, kein Tag.
//
//   node scripts/release-vanilla.mjs [--dry-run] [--allow-dirty] [--no-build] [--no-sourcemaps] [--out=release] [--expect-version=0.10.0]
//
// Schritte (in dieser Reihenfolge, STEPS):
//   clean    der Arbeitsbaum ist sauber (git status --porcelain); mit --allow-dirty übersprungen
//   version  package.json == VERSION in allen sechs Bündeldateien == `--hoops-version` in hoops.css (und == --expect-version, falls gesetzt)
//   build    npm run build:vanilla (mit --no-build übersprungen: das vorhandene dist/vanilla wird geprüft)
//   budget   jedes Bündel (minifiziert und gzip) bleibt im Größenbudget aus scripts/vanilla-budgets.mjs, sonst Abbruch
//   pack     release/hoops-ui-<version>.tgz (dist/vanilla und fonts/ unter dem Ordner hoops-ui-<version>/, dazu version.json), .sha256 (sha256sum-Format,
//            eine Zeile je Datei, die erste für den Tarball), .tgz.sha256 (nur der Tarball), manifest.json und hoops-sync.mjs (portal-sync.mjs mit allen
//            Hilfen zu einer Datei gebündelt, ohne Abhängigkeiten) mit hoops-sync.mjs.sha256.
//            Der Tarball ist auf derselben Plattform und Node-Version byte-gleich (feste Reihenfolge, Zeitstempel 0, Besitzer 0, gzip-Kopf normiert);
//            zlib-Versionen können abweichen, maßgeblich ist die veröffentlichte .sha256.
//   verify   der Tarball wird mit dem Leser von portal-sync gelesen, jede Datei gegen die Prüfsummen geprüft; hoops-sync.mjs darf keinen relativen Import enthalten
// Scheitert ein Schritt, bleibt in `release/` nichts Halbfertiges zurück (geschrieben wird in einen temporären Ordner, erst danach verschoben).
// Ein vorhandenes Ausgabeverzeichnis wird nur ersetzt, wenn es leer ist oder die Marker-Datei `.hoops-release` trägt.
// --dry-run führt alle Prüfungen aus (außer build bei --no-build), schreibt aber nichts. --debug zeigt bei Fehlern den Stack.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { runCli } from './lib/errors.mjs';
import { assertNode } from './lib/runtime.mjs';
import { createTar, gzipNormalized, readTgz } from './lib/tar.mjs';
import { BUDGETS } from './vanilla-budgets.mjs';

export { createTar };

export const STEPS = ['clean', 'build', 'version', 'budget', 'pack', 'verify'];
export const MARKER = '.hoops-release';
export const NAME = '@hoopsfoundry/ui';
export const BUNDLE_FILES = ['hoops.js', 'hoops.min.js', 'hoops-render.js', 'hoops-render.min.js', 'hoops-map.js', 'hoops-map.min.js'];

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
 * Prüft, dass package.json, alle Bündeldateien und hoops.css dieselbe Version tragen. Gibt `{ version, found }` zurück
 * und wirft mit allen Abweichungen in einer Meldung.
 */
export async function checkVersions({ root = ROOT, bundleDir = join(root, 'dist/vanilla'), expect } = {}) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const css = await readFile(join(bundleDir, 'hoops.css'), 'utf8');
  const cssVersion = css.match(/--hoops-version:\s*"([^"]+)"/)?.[1] ?? null;
  const found = { 'package.json': pkg.version, ...(await bundleVersions(bundleDir)), 'hoops.css': cssVersion };
  const wrong = Object.entries(found).filter(([, v]) => v !== pkg.version);
  if (expect !== undefined && expect !== pkg.version) wrong.push(['--expect-version', expect]);
  if (wrong.length) {
    throw new Error(`release-vanilla: Versionen passen nicht zusammen (package.json ${pkg.version}): ${wrong.map(([f, v]) => `${f} ${v}`).join(', ')}`);
  }
  return { version: pkg.version, found };
}

/** Importe des Bündels auf Dateien desselben Ordners (`from "./hoops.js"`). */
const importsOf = (code) => [...new Set([...code.matchAll(/from\s*["']\.\/([\w.-]+\.js)["']/g)].map((m) => m[1]))];

/** Misst die drei Bündel (minifizierte Datei und gzip) und vergleicht mit den Budgets aus scripts/vanilla-budgets.mjs. */
export async function measureBundles({ bundleDir }) {
  const bundles = {};
  for (const [id, budget] of Object.entries(BUDGETS)) {
    const min = await readFile(join(bundleDir, budget.file));
    const gz = gzipSync(min, { level: 9 }).length;
    const requires = importsOf(min.toString('utf8')).map((f) => f.replace(/\.min\.js$|\.js$/g, ''));
    bundles[id] = {
      file: budget.file, minBytes: min.length, gzipBytes: gz, minKiB: kib(min.length), gzipKiB: kib(gz),
      budget: { minBytes: budget.minBytes, gzipBytes: budget.gzipBytes, minKiB: kib(budget.minBytes), gzipKiB: kib(budget.gzipBytes) },
      requires, css: 'hoops.css',
    };
  }
  return bundles;
}

/** Wirft, wenn ein Bündel sein Budget überschreitet (min oder gzip). */
export function assertBudgets(bundles) {
  const over = [];
  for (const [id, b] of Object.entries(bundles)) {
    if (b.minBytes > b.budget.minBytes) over.push(`${b.file} ${b.minKiB} KiB > ${b.budget.minKiB} KiB (min)`);
    if (b.gzipBytes > b.budget.gzipBytes) over.push(`${b.file} ${b.gzipKiB} KiB > ${b.budget.gzipKiB} KiB (gzip)`);
    void id;
  }
  if (over.length) throw new Error(`release-vanilla: Größenbudget überschritten: ${over.join('; ')}. Budget in scripts/vanilla-budgets.mjs nur mit Begründung erhöhen.`);
}

/**
 * Bündelt scripts/portal-sync.mjs mit allen Hilfen aus scripts/lib zu einer Datei ohne Abhängigkeiten (hoops-sync.mjs) und prüft,
 * dass kein relativer Import übrig bleibt.
 */
export async function bundleSync({ root = ROOT } = {}) {
  const { build } = await import('esbuild');
  const result = await build({
    entryPoints: [join(root, 'scripts/portal-sync.mjs')], bundle: true, platform: 'node', format: 'esm', target: 'node18', write: false, legalComments: 'none', logLevel: 'silent',
  });
  const text = result.outputFiles[0].text;
  if (text.match(/(?:from|import)\s*\(?\s*["']\.{1,2}\//)) throw new Error('release-vanilla: hoops-sync.mjs enthält noch einen relativen Import.');
  if (!text.startsWith('#!/usr/bin/env node')) throw new Error('release-vanilla: hoops-sync.mjs hat keine Startzeile (#!/usr/bin/env node).');
  return Buffer.from(text);
}

/** Inhalt von manifest.json: Dateien mit Größen (Byte und KiB, min und gzip), Budgets, Abhängigkeiten, Leaflet-Hinweis, Hilfsskript. */
export async function buildManifest({ root = ROOT, bundleDir, version, files, tarball, sync }) {
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const bundles = await measureBundles({ bundleDir });
  const leafletRange = pkg.peerDependencies?.leaflet ?? null;
  return {
    name: NAME,
    version,
    tarball,
    sync: sync ?? null,
    files: files.map((f) => ({ path: f.path, bytes: f.data.length, sha256: sha256(f.data) })),
    bundles,
    modules: 'ES-Module (script type="module"), Ziel es2020',
    leaflet: {
      required: false,
      range: leafletRange,
      note: 'Leaflet gehört nicht zum Release. Es wird nur für die Karte gebraucht, lokal ausgeliefert (loadLeaflet) und erst nach dem Klick geladen.',
    },
    pairing: 'hoops.js, hoops-render.js, hoops-map.js und hoops.css einer Version gehören zusammen (VERSION im Bündel == --hoops-version in hoops.css).',
  };
}

/** Pfad für die Ausgabe: relativ zum aktuellen Ordner, wenn er darunter liegt, sonst absolut (nie ../../..). */
export function shownPath(path, cwd = process.cwd()) {
  const rel = relative(cwd, path);
  if (rel === '') return '.';
  return rel.startsWith('..') || isAbsolute(rel) ? resolve(path) : rel;
}

/** Wirft, wenn `outDir` nicht ersetzt werden darf: Projekt-Root, Elternordner, Wurzel oder ein nicht leerer Ordner ohne Marker `.hoops-release`. */
async function assertOutDir(outDir, root) {
  const out = resolve(outDir);
  const r = resolve(root);
  if (out === r || r.startsWith(out + sep) || out === parse(out).root) {
    throw new Error(`release-vanilla: Ausgabeordner ${out} ist nicht erlaubt (Projekt-Root, Elternordner oder Wurzel).`);
  }
  if (!existsSync(out)) return;
  const entries = await readdir(out).catch(() => {
    throw new Error(`release-vanilla: Ausgabeziel ${out} ist kein Ordner.`);
  });
  if (entries.length && !entries.includes(MARKER)) {
    throw new Error(`release-vanilla: ${shownPath(out)} ist nicht leer und hat keine Marker-Datei ${MARKER}; der Ordner gehört nicht diesem Skript und wird nicht gelöscht.`);
  }
}

/**
 * Führt den Ablauf aus. Optionen: `root`, `bundleDir` (Standard `dist/vanilla`), `outDir` (Standard `release`), `allowDirty`, `dryRun`,
 * `build` (Funktion, Standard npm run build:vanilla; `false` = nicht bauen), `sourcemaps` (Standard true), `expect` (erwartete Version),
 * `gitStatus` (Funktion, gibt die porcelain-Ausgabe zurück), `log`. Gibt `{ version, steps, files, outDir, dryRun, manifest, sums, tgz, sync }` zurück.
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
  await assertOutDir(outDir, root);
  if (!allowDirty) {
    const status = gitStatus ? await gitStatus() : execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    if (status.trim()) throw new Error('release-vanilla: Der Arbeitsbaum ist nicht sauber (git status --porcelain). Committe oder verwende --allow-dirty.');
    step('clean');
  }
  // erst bauen, dann prüfen: gegen alte Bündel wäre der Versionsabgleich sinnlos
  if (build !== false) {
    if (build) await build();
    else execFileSync('npm', ['run', 'build:vanilla', '--silent'], { cwd: root, stdio: 'inherit' });
    step('build');
  }
  const { version, found } = await checkVersions({ root, bundleDir, expect });
  step('version', `${version} (${Object.keys(found).length} Stellen)`);
  assertBudgets(await measureBundles({ bundleDir }));
  step('budget', 'alle Bündel im Budget');

  const prefix = `hoops-ui-${version}`;
  const names = (await listFiles(bundleDir)).filter((n) => sourcemaps || !n.endsWith('.map'));
  const files = [];
  for (const name of names) files.push({ path: `${prefix}/${name}`, data: await readFile(join(bundleDir, name)) });
  const fontsDir = join(root, 'fonts');
  if (existsSync(fontsDir)) for (const name of await listFiles(fontsDir)) files.push({ path: `${prefix}/fonts/${name}`, data: await readFile(join(fontsDir, name)) });
  files.push({ path: `${prefix}/version.json`, data: Buffer.from(`${JSON.stringify({ name: NAME, version })}\n`) });
  files.sort((a, b) => (a.path < b.path ? -1 : 1));

  const tgz = gzipNormalized(createTar(files));
  const tgzName = `${prefix}.tgz`;
  const tarballLine = `${sha256(tgz)}  ${tgzName}\n`;
  const sums = [tarballLine.trim(), ...files.map((f) => `${sha256(f.data)}  ${f.path}`)].join('\n') + '\n';
  const syncData = await bundleSync({ root });
  const sync = { name: 'hoops-sync.mjs', bytes: syncData.length, sha256: sha256(syncData), sha256File: 'hoops-sync.mjs.sha256', node: '>=18' };
  const manifest = await buildManifest({
    root, bundleDir, version, files, sync,
    tarball: { name: tgzName, bytes: tgz.length, sha256: sha256(tgz), sha256File: `${prefix}.sha256`, sha256TarballOnly: `${tgzName}.sha256` },
  });
  step('pack', `${tgzName}, ${kib(tgz.length)} KiB, ${files.length} Dateien; hoops-sync.mjs, ${kib(syncData.length)} KiB`);

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
      await writeFile(join(tmp, MARKER), 'Dieser Ordner gehört release-vanilla.mjs und wird bei jedem Lauf ersetzt.\n');
      await writeFile(join(tmp, tgzName), tgz);
      await writeFile(join(tmp, `${prefix}.sha256`), sums);
      await writeFile(join(tmp, `${tgzName}.sha256`), tarballLine);
      await writeFile(join(tmp, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
      await writeFile(join(tmp, 'hoops-sync.mjs'), syncData);
      await writeFile(join(tmp, 'hoops-sync.mjs.sha256'), `${sync.sha256}  hoops-sync.mjs\n`);
      await rm(outDir, { recursive: true, force: true });
      await rename(tmp, outDir);
    } catch (error) {
      await rm(tmp, { recursive: true, force: true });
      throw error;
    }
  }
  return { version, steps, files: files.map((f) => f.path), outDir, dryRun, manifest, sums, tgz, sync: syncData };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const flags = new Set(process.argv.slice(2).filter((a) => !a.includes('=')));
  const values = Object.fromEntries(process.argv.slice(2).filter((a) => a.includes('=')).map((a) => a.replace(/^--/, '').split('=')));
  await runCli('release-vanilla', async () => {
    assertNode('release-vanilla');
    const result = await releaseVanilla({
      allowDirty: flags.has('--allow-dirty'), dryRun: flags.has('--dry-run'), build: flags.has('--no-build') ? false : undefined,
      sourcemaps: !flags.has('--no-sourcemaps'), expect: values['expect-version'], outDir: values.out ? resolve(values.out) : undefined,
      log: (line) => console.log(`  ${line}`),
    });
    console.log(`${result.dryRun ? 'Probelauf (nichts geschrieben)' : `geschrieben nach ${shownPath(result.outDir)}`}: ${NAME} ${result.version}`);
  }, { debug: flags.has('--debug') });
}
