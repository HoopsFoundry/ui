// Gemeinsame Hilfen der Release-Tests: Bündel kopieren, Skript aus Text laden (für Mutationen), Tarball lesen.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bundleDir } from './bundle-dir';

// Jede Testdatei bekommt eigene Arbeitsordner (Vitest führt Dateien parallel aus): das Hilfsmodul wird je Datei neu geladen, die Marke ist je Datei verschieden
export const tmpRoot = resolve(process.cwd(), `tests/.release-tmp-${randomBytes(4).toString('hex')}`);
export const releaseScript = resolve(process.cwd(), 'scripts/release-vanilla.mjs');
export const syncScript = resolve(process.cwd(), 'scripts/portal-sync.mjs');
const loadRoot = `${tmpRoot}-load`;
let loadCounter = 0;
const dirs = new WeakMap<object, string>();

/** Kopie des Test-Bündels (tests/.bundle-tmp) in einen eigenen Ordner, damit Tests es verfälschen dürfen. */
export async function copyBundle(name: string) {
  const dir = `${tmpRoot}/${name}`;
  await cp(bundleDir, dir, { recursive: true });
  return dir;
}

/**
 * Lädt ein Skript aus (verfälschtem) Text. Der Ordner scripts/ wird in einen eigenen Ordner kopiert, `file` (Standard das Release-Skript) und
 * weitere Dateien aus `extra` (Pfad unter scripts/ → Text) werden dort überschrieben; so lösen sich relative Importe wie im Original auf.
 * Beim Release-Skript entfällt der Direktaufruf, und `ROOT` zeigt auf das Repository.
 */
export async function loadScript(source: string, file = 'release-vanilla.mjs', extra: Record<string, string> = {}) {
  const dir = `${loadRoot}/${loadCounter++}`;
  await cp(resolve(process.cwd(), 'scripts'), `${dir}/scripts`, { recursive: true });
  const prepared = source
    .replace("fileURLToPath(new URL('../', import.meta.url))", `'${process.cwd()}/'`)
    .replace('fileURLToPath(import.meta.url) === resolve(process.argv[1])', 'false');
  await writeFile(`${dir}/scripts/${file}`, prepared);
  for (const [name, text] of Object.entries(extra)) await writeFile(`${dir}/scripts/${name}`, text);
  const mod = await import(/* @vite-ignore */ pathToFileURL(`${dir}/scripts/${file}`).href);
  // weitere Module aus demselben Ordner (zum Beispiel die Hilfen unter lib/) für Regeln, die sie direkt aufrufen
  dirs.set(mod, `${dir}/scripts`);
  return mod;
}

/** Lädt ein weiteres Modul aus dem Ordner, den `loadScript` angelegt hat (`name` relativ zu scripts/). */
export const loadSibling = (mod: object, name: string) => import(/* @vite-ignore */ pathToFileURL(`${dirs.get(mod)}/${name}`).href);

/** Räumt die von loadScript angelegten Ordner auf. */
export const cleanLoaded = () => rm(loadRoot, { recursive: true, force: true });

export const readText = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

/** Baut ein Test-Release (tgz, sha256, Version) aus Dateien: für Tests von portal-sync, ohne das echte Release-Skript. */
export async function writeFakeRelease(dir: string, version: string, files: Record<string, string>, options: { top?: string } = {}) {
  const { createTar, gzipNormalized } = await import(/* @vite-ignore */ pathToFileURL(resolve(process.cwd(), 'scripts/lib/tar.mjs')).href);
  const { createHash } = await import('node:crypto');
  const sha = (d: Buffer) => createHash('sha256').update(d).digest('hex');
  const top = options.top ?? `dss-vanilla-${version}`;
  const entries = Object.entries(files).sort().map(([name, text]) => ({ path: `${top}/${name}`, data: Buffer.from(text) }));
  const tgz = gzipNormalized(createTar(entries));
  await mkdir(dir, { recursive: true });
  const sums = [`${sha(tgz)}  dss-vanilla-${version}.tgz`, ...entries.map((e) => `${sha(e.data)}  ${e.path}`)].join('\n') + '\n';
  await writeFile(`${dir}/dss-vanilla-${version}.tgz`, tgz);
  await writeFile(`${dir}/dss-vanilla-${version}.sha256`, sums);
  return { tgz, sums, entries };
}
