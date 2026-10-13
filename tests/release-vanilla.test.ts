// @vitest-environment node
// Release-Ablauf des Vanilla-Pakets (scripts/release-vanilla.mjs): Version-Abgleich, Schritte, Tarball, Prüfsummen, Manifest, Aufräumen.
import { existsSync } from 'node:fs';
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BUDGETS } from '../scripts/vanilla-budgets.mjs';
import { bundleDir } from './helpers/bundle-dir';
import { copyBundle, releaseScript, tmpRoot } from './helpers/release-fixture';
// @ts-expect-error reines ES-Modul ohne Typen
import { buildManifest, checkVersions, createTar, releaseVanilla, STEPS, BUNDLE_FILES } from '../scripts/release-vanilla.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { readTgz } from '../stories/examples/portal-sync.mjs';

const pkg = JSON.parse(await readFile(`${process.cwd()}/package.json`, 'utf8'));
const clean = async () => '';
const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');

beforeAll(() => rm(tmpRoot, { recursive: true, force: true }));
afterAll(() => rm(tmpRoot, { recursive: true, force: true }));

describe('Version-Abgleich', () => {
  it('package.json, alle sechs Bündeldateien und dss.css tragen dieselbe Version', async () => {
    const { version, found } = await checkVersions({ bundleDir });
    expect(version).toBe(pkg.version);
    expect(Object.keys(found).sort()).toEqual(['dss.css', 'package.json', ...BUNDLE_FILES].sort());
    expect(Object.values(found).every((v) => v === pkg.version)).toBe(true);
  });
  it('eine abweichende CSS-Version bricht ab und nennt die Datei', async () => {
    const dir = await copyBundle('css');
    await writeFile(`${dir}/dss.css`, (await readFile(`${dir}/dss.css`, 'utf8')).replace(`--dss-version: "${pkg.version}"`, '--dss-version: "0.0.1"'));
    await expect(checkVersions({ bundleDir: dir })).rejects.toThrow(/dss\.css 0\.0\.1/);
  });
  it('eine fehlende CSS-Version gilt als Abweichung', async () => {
    const dir = await copyBundle('css-fehlt');
    await writeFile(`${dir}/dss.css`, ':root{}');
    await expect(checkVersions({ bundleDir: dir })).rejects.toThrow(/dss\.css null/);
  });
  it.each(BUNDLE_FILES)('eine abweichende VERSION in %s bricht ab', async (file: string) => {
    const dir = await copyBundle(`js-${file}`);
    const text = await readFile(`${dir}/${file}`, 'utf8');
    expect(text).toContain(`"${pkg.version}"`);
    await writeFile(`${dir}/${file}`, text.replace(`"${pkg.version}"`, '"0.0.1"'));
    await expect(checkVersions({ bundleDir: dir })).rejects.toThrow(new RegExp(`${file.replace(/\./g, '\\.')} 0\\.0\\.1`));
  });
  it('--expect-version muss zur package.json passen (Tag gegen Version)', async () => {
    await expect(checkVersions({ bundleDir, expect: pkg.version })).resolves.toBeTruthy();
    await expect(checkVersions({ bundleDir, expect: '9.9.9' })).rejects.toThrow(/--expect-version 9\.9\.9/);
  });
});

describe('Ablauf', () => {
  it('Schritte in fester Reihenfolge; ohne Bauen entfällt build', async () => {
    expect(STEPS).toEqual(['clean', 'version', 'build', 'pack', 'verify']);
    const out = `${tmpRoot}/ablauf`;
    const result = await releaseVanilla({ bundleDir, outDir: out, build: false, gitStatus: clean });
    expect(result.steps).toEqual(['clean', 'version', 'pack', 'verify']);
    const built: string[] = [];
    const again = await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/ablauf2`, gitStatus: clean, build: async () => { built.push('b'); } });
    expect(again.steps).toEqual(['clean', 'build', 'version', 'pack', 'verify']);
    expect(built).toEqual(['b']);
  });
  it('schreibt tgz, sha256 und manifest.json und sonst nichts', async () => {
    const out = `${tmpRoot}/ausgabe`;
    await releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true });
    expect((await readdir(out)).sort()).toEqual([`dss-vanilla-${pkg.version}.sha256`, `dss-vanilla-${pkg.version}.tgz`, 'manifest.json']);
    expect((await readdir(tmpRoot)).filter((n) => n.includes('.tmp-'))).toEqual([]);
  });
  it('ein schmutziger Arbeitsbaum bricht ab, --allow-dirty erlaubt ihn; es wird nichts geschrieben', async () => {
    const out = `${tmpRoot}/schmutzig`;
    await expect(releaseVanilla({ bundleDir, outDir: out, build: false, gitStatus: async () => ' M css/components.css\n' })).rejects.toThrow(/nicht sauber/);
    expect(existsSync(out)).toBe(false);
    await expect(releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true, gitStatus: async () => ' M x\n' })).resolves.toBeTruthy();
  });
  it('--dry-run führt die Prüfungen aus, schreibt aber nichts', async () => {
    const out = `${tmpRoot}/trocken`;
    const result = await releaseVanilla({ bundleDir, outDir: out, build: false, gitStatus: clean, dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.steps).toContain('verify');
    expect(existsSync(out)).toBe(false);
    const bad = await copyBundle('trocken-falsch');
    await writeFile(`${bad}/dss.css`, ':root { --dss-version: "0.0.1"; }');
    await expect(releaseVanilla({ bundleDir: bad, outDir: out, build: false, allowDirty: true, dryRun: true })).rejects.toThrow(/Versionen/);
  });
  it('scheitert ein Schritt, bleibt nichts zurück (kein Ausgabeordner, kein temporärer Ordner)', async () => {
    const out = `${tmpRoot}/fehler/release`;
    const bad = await copyBundle('fehler');
    await rm(`${bad}/dss.css`);
    await expect(releaseVanilla({ bundleDir: bad, outDir: out, build: false, allowDirty: true })).rejects.toThrow();
    expect(existsSync(out)).toBe(false);
    await mkdir(`${tmpRoot}/fehler`, { recursive: true });
    await writeFile(`${tmpRoot}/fehler/datei`, 'x');
    await expect(releaseVanilla({ bundleDir, outDir: `${tmpRoot}/fehler/datei/release`, build: false, allowDirty: true })).rejects.toThrow();
    expect((await readdir(`${tmpRoot}/fehler`)).filter((n) => n.includes('.tmp-'))).toEqual([]);
  });
  it('ein vorhandenes release/ wird beim Erfolg ersetzt, bei einem Fehler nicht angefasst', async () => {
    const out = `${tmpRoot}/ersetzen`;
    await mkdir(out, { recursive: true });
    await writeFile(`${out}/alt.txt`, 'alt');
    const bad = await copyBundle('ersetzen-falsch');
    await rm(`${bad}/dss.css`);
    await expect(releaseVanilla({ bundleDir: bad, outDir: out, build: false, allowDirty: true })).rejects.toThrow();
    expect(existsSync(`${out}/alt.txt`)).toBe(true);
    await releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true });
    expect(existsSync(`${out}/alt.txt`)).toBe(false);
  });
});

describe('Tarball, Prüfsummen, Manifest', () => {
  let out = '';
  let tgz: Buffer;
  let sums: string;
  let manifest: any;
  beforeAll(async () => {
    out = `${tmpRoot}/inhalt`;
    await releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true });
    tgz = await readFile(`${out}/dss-vanilla-${pkg.version}.tgz`);
    sums = await readFile(`${out}/dss-vanilla-${pkg.version}.sha256`, 'utf8');
    manifest = JSON.parse(await readFile(`${out}/manifest.json`, 'utf8'));
  });
  it('enthält dist/vanilla, fonts und version.json unter einem Ordner dss-vanilla-<version>', () => {
    const files = readTgz(tgz, { expectedTop: `dss-vanilla-${pkg.version}` }) as { path: string; data: Buffer }[];
    const names = files.map((f) => f.path);
    for (const n of [...BUNDLE_FILES, 'dss.css', 'dss.d.ts', 'dss-render.d.ts', 'dss-map.d.ts', 'dss.min.js.map', 'courtlines/court.svg', 'fonts/fonts.css', 'version.json']) expect(names, n).toContain(n);
    expect(JSON.parse(files.find((f) => f.path === 'version.json')!.data.toString())).toEqual({ name: '@bbv/dss-design-system', version: pkg.version });
    // Inhalt gleich dem Bündel
    expect(files.find((f) => f.path === 'dss.min.js')!.data.equals(Buffer.from(require('node:fs').readFileSync(`${bundleDir}dss.min.js`)))).toBe(true);
  });
  it('das System-tar versteht den Tarball (ustar mit gültigen Köpfen)', async () => {
    const { execFileSync } = await import('node:child_process');
    const list = execFileSync('tar', ['-tzf', `${out}/dss-vanilla-${pkg.version}.tgz`], { encoding: 'utf8' }).split('\n').filter(Boolean);
    expect(list).toContain(`dss-vanilla-${pkg.version}/dss.js`);
    expect(list.length).toBeGreaterThan(30);
  });
  it('.sha256 im sha256sum-Format: Tarball zuerst, danach jede Datei; alle Werte stimmen', () => {
    const lines = sums.trim().split('\n');
    expect(lines[0]).toBe(`${sha(tgz)}  dss-vanilla-${pkg.version}.tgz`);
    const files = readTgz(tgz) as { path: string; data: Buffer }[];
    expect(lines.length).toBe(files.length + 1);
    const map = new Map(lines.slice(1).map((l) => [l.slice(66), l.slice(0, 64)]));
    for (const f of files) expect(map.get(`dss-vanilla-${pkg.version}/${f.path}`), f.path).toBe(sha(f.data));
  });
  it('manifest.json nennt Name, Version, Tarball, Dateien, Größen in KiB, Budgets, Abhängigkeiten und den Leaflet-Hinweis', () => {
    expect(manifest.name).toBe('@bbv/dss-design-system');
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.tarball).toMatchObject({ name: `dss-vanilla-${pkg.version}.tgz`, bytes: tgz.length, sha256: sha(tgz), sha256File: `dss-vanilla-${pkg.version}.sha256` });
    expect(manifest.files.length).toBe((readTgz(tgz) as unknown[]).length);
    for (const [id, b] of Object.entries(BUDGETS) as [string, { file: string; minBytes: number; gzipBytes: number }][]) {
      const bundle = manifest.bundles[id];
      const min = require('node:fs').readFileSync(`${bundleDir}${b.file}`);
      expect(bundle.file).toBe(b.file);
      expect(bundle.minBytes).toBe(min.length);
      expect(bundle.gzipBytes).toBe(require('node:zlib').gzipSync(min, { level: 9 }).length);
      expect(bundle.minKiB).toBe(Math.round((min.length / 1024) * 10) / 10);
      expect(bundle.budget.minBytes).toBe(b.minBytes);
      expect(bundle.budget.gzipBytes).toBe(b.gzipBytes);
      expect(bundle.minBytes).toBeLessThanOrEqual(b.minBytes);
      expect(bundle.gzipBytes).toBeLessThanOrEqual(b.gzipBytes);
      expect(bundle.css).toBe('dss.css');
    }
    expect(manifest.bundles.dss.requires).toEqual([]);
    expect(manifest.bundles['dss-render'].requires).toEqual(['dss']);
    expect(manifest.bundles['dss-map'].requires).toEqual([]);
    expect(manifest.leaflet).toMatchObject({ required: false, range: pkg.peerDependencies.leaflet });
    expect(manifest.leaflet.note).toMatch(/Klick/);
    expect(manifest.pairing).toMatch(/dss\.css/);
  });
  it('ist reproduzierbar: zwei Läufe ergeben dieselben Bytes', async () => {
    const again = await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/zweiter`, build: false, allowDirty: true });
    expect(sha(again.tgz)).toBe(sha(tgz));
    expect(again.sums).toBe(sums);
  });
  it('--no-sourcemaps lässt die Quellkarten weg', async () => {
    const result = await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/ohne-karten`, build: false, allowDirty: true, sourcemaps: false });
    expect(result.files.some((f: string) => f.endsWith('.map'))).toBe(false);
    expect(result.files.some((f: string) => f.endsWith('dss.min.js'))).toBe(true);
  });
  it('createTar: Namen über 100 Zeichen werden abgelehnt, Inhalt wird in 512-Byte-Blöcke gefüllt', () => {
    expect(() => createTar([{ path: 'a'.repeat(101), data: Buffer.from('x') }])).toThrow(/zu lang/);
    const tar = createTar([{ path: 'a/b.txt', data: Buffer.from('x') }]);
    expect(tar.length % 512).toBe(0);
    expect(tar.length).toBe(512 + 512 + 1024);
    expect(gunzipSync(require('node:zlib').gzipSync(tar)).length).toBe(tar.length);
  });
  it('buildManifest ist ohne Dateisystem-Schreibzugriff (reine Auswertung des Bündels)', async () => {
    const m = await buildManifest({ bundleDir, version: pkg.version, files: [{ path: 'x', data: Buffer.from('abc') }], tarball: { name: 'x' } });
    expect(m.files).toEqual([{ path: 'x', bytes: 3, sha256: sha('abc') }]);
  });
  it('das Skript liegt im Repository, ruft kein Netz und kein git push', async () => {
    const code = await readFile(releaseScript, 'utf8');
    expect(code).not.toMatch(/https?:\/\/|git['", ]+push|git['", ]+tag|fetch\(/);
  });
});
