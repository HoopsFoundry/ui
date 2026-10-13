// Gemeinsame Hilfen der Release-Tests: Bündel kopieren, Skript aus Text laden (für Mutationen), Tarball lesen.
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { bundleDir } from './bundle-dir';

export const tmpRoot = resolve(process.cwd(), 'tests/.release-tmp');
export const releaseScript = resolve(process.cwd(), 'scripts/release-vanilla.mjs');
export const syncScript = resolve(process.cwd(), 'stories/examples/portal-sync.mjs');

/** Kopie des Test-Bündels (tests/.bundle-tmp) in einen eigenen Ordner, damit Tests es verfälschen dürfen. */
export async function copyBundle(name: string) {
  const dir = `${tmpRoot}/${name}`;
  await cp(bundleDir, dir, { recursive: true });
  return dir;
}

/** Lädt ein Skript aus (verfälschtem) Text: Importe auf Nachbardateien werden absolut, import.meta.url und Direktaufruf entfallen. */
export async function loadScript(source: string) {
  const code = source
    .replace("from './vanilla-budgets.mjs'", `from '${pathToFileURL(resolve(process.cwd(), 'scripts/vanilla-budgets.mjs')).href}'`)
    .replace("from '../stories/examples/portal-sync.mjs'", `from '${pathToFileURL(syncScript).href}'`)
    .replace("fileURLToPath(new URL('../', import.meta.url))", `'${process.cwd()}/'`)
    .replace('fileURLToPath(import.meta.url) === resolve(process.argv[1])', 'false');
  return import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}

export const readText = (path: string) => readFile(resolve(process.cwd(), path), 'utf8');

/** Baut ein Test-Release (tgz, sha256, Version) aus Dateien: für Tests von portal-sync, ohne das echte Release-Skript. */
export async function writeFakeRelease(dir: string, version: string, files: Record<string, string>, options: { top?: string } = {}) {
  const { createTar } = await import(/* @vite-ignore */ pathToFileURL(releaseScript).href);
  const { createHash } = await import('node:crypto');
  const sha = (d: Buffer) => createHash('sha256').update(d).digest('hex');
  const top = options.top ?? `dss-vanilla-${version}`;
  const entries = Object.entries(files).sort().map(([name, text]) => ({ path: `${top}/${name}`, data: Buffer.from(text) }));
  const tgz = gzipSync(createTar(entries));
  await mkdir(dir, { recursive: true });
  const sums = [`${sha(tgz)}  dss-vanilla-${version}.tgz`, ...entries.map((e) => `${sha(e.data)}  ${e.path}`)].join('\n') + '\n';
  await writeFile(`${dir}/dss-vanilla-${version}.tgz`, tgz);
  await writeFile(`${dir}/dss-vanilla-${version}.sha256`, sums);
  return { tgz, sums, entries };
}
