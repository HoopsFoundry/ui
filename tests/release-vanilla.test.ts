// @vitest-environment node
// Release-Ablauf des Vanilla-Pakets (scripts/release-vanilla.mjs): Version-Abgleich, Schritte, Tarball, Prüfsummen, Manifest, Aufräumen.
import { existsSync, readFileSync } from 'node:fs';
import { readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { gunzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { BUDGETS } from '../scripts/vanilla-budgets.mjs';
import { bundleDir } from './helpers/bundle-dir';
import { copyBundle, releaseScript, tmpRoot } from './helpers/release-fixture';
// @ts-expect-error reines ES-Modul ohne Typen
import { assertBudgets, buildManifest, checkVersions, createTar, releaseVanilla, shownPath, STEPS, BUNDLE_FILES } from '../scripts/release-vanilla.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { gzipNormalized } from '../scripts/lib/tar.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { readTgz } from '../scripts/portal-sync.mjs';

const pkg = JSON.parse(await readFile(`${process.cwd()}/package.json`, 'utf8'));
const clean = async () => '';
const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');

beforeAll(() => rm(tmpRoot, { recursive: true, force: true }));
afterAll(() => rm(tmpRoot, { recursive: true, force: true }));

describe('Version-Abgleich', () => {
  it('package.json, alle sechs Bündeldateien und hoops.css tragen dieselbe Version', async () => {
    const { version, found } = await checkVersions({ bundleDir });
    expect(version).toBe(pkg.version);
    expect(Object.keys(found).sort()).toEqual(['hoops.css', 'package.json', ...BUNDLE_FILES].sort());
    expect(Object.values(found).every((v) => v === pkg.version)).toBe(true);
  });
  it('eine abweichende CSS-Version bricht ab und nennt die Datei', async () => {
    const dir = await copyBundle('css');
    await writeFile(`${dir}/hoops.css`, (await readFile(`${dir}/hoops.css`, 'utf8')).replace(`--hoops-version: "${pkg.version}"`, '--hoops-version: "0.0.1"'));
    await expect(checkVersions({ bundleDir: dir })).rejects.toThrow(/hoops\.css 0\.0\.1/);
  });
  it('eine fehlende CSS-Version gilt als Abweichung', async () => {
    const dir = await copyBundle('css-fehlt');
    await writeFile(`${dir}/hoops.css`, ':root{}');
    await expect(checkVersions({ bundleDir: dir })).rejects.toThrow(/hoops\.css null/);
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
    expect(STEPS).toEqual(['clean', 'build', 'version', 'budget', 'pack', 'verify']);
    const out = `${tmpRoot}/ablauf`;
    const result = await releaseVanilla({ bundleDir, outDir: out, build: false, gitStatus: clean });
    expect(result.steps).toEqual(['clean', 'version', 'budget', 'pack', 'verify']);
    const built: string[] = [];
    const again = await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/ablauf2`, gitStatus: clean, build: async () => { built.push('b'); } });
    expect(again.steps).toEqual(['clean', 'build', 'version', 'budget', 'pack', 'verify']);
    // die tatsächliche Reihenfolge ist die der Konstante
    expect(again.steps).toEqual(STEPS);
    expect(built).toEqual(['b']);
  });
  it('schreibt tgz, beide sha256-Dateien, manifest.json, hoops-sync.mjs mit Prüfsumme und die Marker-Datei, sonst nichts', async () => {
    const out = `${tmpRoot}/ausgabe`;
    await releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true });
    expect((await readdir(out)).sort()).toEqual(['.hoops-release', 'hoops-sync.mjs', 'hoops-sync.mjs.sha256', `hoops-ui-${pkg.version}.sha256`, `hoops-ui-${pkg.version}.tgz`, `hoops-ui-${pkg.version}.tgz.sha256`, 'manifest.json']);
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
    await writeFile(`${bad}/hoops.css`, ':root { --hoops-version: "0.0.1"; }');
    await expect(releaseVanilla({ bundleDir: bad, outDir: out, build: false, allowDirty: true, dryRun: true })).rejects.toThrow(/Versionen/);
  });
  it('scheitert ein Schritt, bleibt nichts zurück (kein Ausgabeordner, kein temporärer Ordner)', async () => {
    const out = `${tmpRoot}/fehler/release`;
    const bad = await copyBundle('fehler');
    await rm(`${bad}/hoops.css`);
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
    await writeFile(`${out}/.hoops-release`, '');
    const bad = await copyBundle('ersetzen-falsch');
    await rm(`${bad}/hoops.css`);
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
    tgz = await readFile(`${out}/hoops-ui-${pkg.version}.tgz`);
    sums = await readFile(`${out}/hoops-ui-${pkg.version}.sha256`, 'utf8');
    manifest = JSON.parse(await readFile(`${out}/manifest.json`, 'utf8'));
  });
  it('enthält dist/vanilla, fonts und version.json unter einem Ordner hoops-ui-<version>', () => {
    const files = readTgz(tgz, { expectedTop: `hoops-ui-${pkg.version}` }) as { path: string; data: Buffer }[];
    const names = files.map((f) => f.path);
    for (const n of [...BUNDLE_FILES, 'hoops.css', 'hoops.d.ts', 'hoops-render.d.ts', 'hoops-map.d.ts', 'hoops.min.js.map', 'courtlines/court.svg', 'fonts/fonts.css', 'version.json']) expect(names, n).toContain(n);
    expect(JSON.parse(files.find((f) => f.path === 'version.json')!.data.toString())).toEqual({ name: '@hoopsfoundry/ui', version: pkg.version });
    // Inhalt gleich dem Bündel
    expect(files.find((f) => f.path === 'hoops.min.js')!.data.equals(Buffer.from(require('node:fs').readFileSync(`${bundleDir}hoops.min.js`)))).toBe(true);
  });
  it('das System-tar versteht den Tarball (ustar mit gültigen Köpfen)', async () => {
    const { execFileSync } = await import('node:child_process');
    const list = execFileSync('tar', ['-tzf', `${out}/hoops-ui-${pkg.version}.tgz`], { encoding: 'utf8' }).split('\n').filter(Boolean);
    expect(list).toContain(`hoops-ui-${pkg.version}/hoops.js`);
    expect(list.length).toBeGreaterThan(30);
  });
  it('.sha256 im sha256sum-Format: Tarball zuerst, danach jede Datei; alle Werte stimmen', () => {
    const lines = sums.trim().split('\n');
    expect(lines[0]).toBe(`${sha(tgz)}  hoops-ui-${pkg.version}.tgz`);
    const files = readTgz(tgz) as { path: string; data: Buffer }[];
    expect(lines.length).toBe(files.length + 1);
    const map = new Map(lines.slice(1).map((l) => [l.slice(66), l.slice(0, 64)]));
    for (const f of files) expect(map.get(`hoops-ui-${pkg.version}/${f.path}`), f.path).toBe(sha(f.data));
  });
  it('manifest.json nennt Name, Version, Tarball, Dateien, Größen in KiB, Budgets, Abhängigkeiten und den Leaflet-Hinweis', () => {
    expect(manifest.name).toBe('@hoopsfoundry/ui');
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.tarball).toMatchObject({ name: `hoops-ui-${pkg.version}.tgz`, bytes: tgz.length, sha256: sha(tgz), sha256File: `hoops-ui-${pkg.version}.sha256` });
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
      expect(bundle.css).toBe('hoops.css');
    }
    expect(manifest.bundles.hoops.requires).toEqual([]);
    expect(manifest.bundles['hoops-render'].requires).toEqual(['hoops']);
    expect(manifest.bundles['hoops-map'].requires).toEqual([]);
    expect(manifest.leaflet).toMatchObject({ required: false, range: pkg.peerDependencies.leaflet });
    expect(manifest.leaflet.note).toMatch(/Klick/);
    expect(manifest.pairing).toMatch(/hoops\.css/);
  });
  it('ist reproduzierbar: zwei Läufe ergeben dieselben Bytes', async () => {
    const again = await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/zweiter`, build: false, allowDirty: true });
    expect(sha(again.tgz)).toBe(sha(tgz));
    expect(again.sums).toBe(sums);
  });
  it('--no-sourcemaps lässt die Quellkarten weg', async () => {
    const result = await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/ohne-karten`, build: false, allowDirty: true, sourcemaps: false });
    expect(result.files.some((f: string) => f.endsWith('.map'))).toBe(false);
    expect(result.files.some((f: string) => f.endsWith('hoops.min.js'))).toBe(true);
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

describe('Kopf des gzip-Stroms und Tar-Aufbau (plattformunabhängig)', () => {
  let tgz: Buffer;
  beforeAll(async () => {
    tgz = (await releaseVanilla({ bundleDir, outDir: `${tmpRoot}/kopf`, build: false, allowDirty: true })).tgz;
  });
  it('gzip-Kopf: Magic, Deflate, keine Flags (kein Dateiname), MTIME 0, Betriebssystem-Byte 3', () => {
    expect([...tgz.subarray(0, 4)]).toEqual([0x1f, 0x8b, 0x08, 0x00]);
    expect([...tgz.subarray(4, 8)]).toEqual([0, 0, 0, 0]);
    expect(tgz[8]).toBe(2); // XFL: höchste Stufe
    expect(tgz[9]).toBe(3); // OS: Unix, unabhängig von der Plattform (macOS schreibt sonst 19)
  });
  it('gzipNormalized setzt das Betriebssystem-Byte und den Zeitstempel, egal was zlib schreibt', () => {
    const out = gzipNormalized(Buffer.from('abc'));
    expect(out[9]).toBe(3);
    expect([...out.subarray(4, 8)]).toEqual([0, 0, 0, 0]);
    expect(gunzipSync(out).toString()).toBe('abc');
  });
  it('tar-Köpfe: uid und gid 0, Modus 0644, Zeitstempel 0, Typ Datei, ustar; Reihenfolge sortiert', () => {
    const tar = gunzipSync(tgz);
    const names: string[] = [];
    for (let offset = 0; offset + 512 <= tar.length; ) {
      const h = tar.subarray(offset, offset + 512);
      if (h.every((b) => b === 0)) break;
      const field = (from: number, len: number) => h.toString('latin1', from, from + len).replace(/\0.*$/s, '');
      names.push(field(0, 100));
      expect(field(100, 8)).toBe('0000644');
      expect(field(108, 8)).toBe('0000000');
      expect(field(116, 8)).toBe('0000000');
      expect(field(136, 12)).toBe('00000000000');
      expect(field(156, 1)).toBe('0');
      expect(field(257, 6)).toBe('ustar');
      expect(field(265, 32)).toBe('');
      offset += 512 + Math.ceil(parseInt(field(124, 12), 8) / 512) * 512;
    }
    expect(names.length).toBeGreaterThan(30);
    expect(names).toEqual([...names].sort());
  });
});

describe('Budgets, Ausgabeordner, Hilfsskript', () => {
  it('ein Bündel über dem Budget bricht ab, nichts wird geschrieben', async () => {
    const dir = await copyBundle('budget');
    await writeFile(`${dir}/hoops.min.js`, `${await readFile(`${dir}/hoops.min.js`, 'utf8')}\n//${'x'.repeat(5000)}`);
    const out = `${tmpRoot}/budget-out`;
    // die Versionsprüfung bleibt grün (die Datei trägt weiter VERSION); das Budget von hoops.min.js liegt bei 40 KiB
    await writeFile(`${dir}/hoops.min.js`, `${await readFile(`${dir}/hoops.min.js`, 'utf8')}\n//${'y'.repeat(BUDGETS.hoops.minBytes)}`);
    await expect(releaseVanilla({ bundleDir: dir, outDir: out, build: false, allowDirty: true })).rejects.toThrow(/Größenbudget überschritten: hoops\.min\.js/);
    expect(existsSync(out)).toBe(false);
  });
  it('assertBudgets nennt min und gzip getrennt', () => {
    const b = { file: 'a.min.js', minBytes: 11, gzipBytes: 5, minKiB: 0, gzipKiB: 0, budget: { minBytes: 10, gzipBytes: 4, minKiB: 0, gzipKiB: 0 } };
    expect(() => assertBudgets({ a: b })).toThrow(/\(min\).*\(gzip\)/);
    expect(() => assertBudgets({ a: { ...b, minBytes: 10, gzipBytes: 4 } })).not.toThrow();
  });
  it('--out löscht einen vorhandenen Ordner nur mit Marker .hoops-release oder wenn er leer ist', async () => {
    const fremd = `${tmpRoot}/fremd`;
    await mkdir(fremd, { recursive: true });
    await writeFile(`${fremd}/wichtig.txt`, 'x');
    await expect(releaseVanilla({ bundleDir, outDir: fremd, build: false, allowDirty: true })).rejects.toThrow(/Marker-Datei \.hoops-release/);
    expect(existsSync(`${fremd}/wichtig.txt`)).toBe(true);
    const leer = `${tmpRoot}/leer`;
    await mkdir(leer, { recursive: true });
    await expect(releaseVanilla({ bundleDir, outDir: leer, build: false, allowDirty: true })).resolves.toBeTruthy();
    // zweiter Lauf: jetzt trägt der Ordner den Marker
    await expect(releaseVanilla({ bundleDir, outDir: leer, build: false, allowDirty: true })).resolves.toBeTruthy();
  });
  it('Projekt-Root, Elternordner und Dateisystem-Wurzel sind als Ausgabe verboten', async () => {
    for (const outDir of [process.cwd(), resolve(process.cwd(), '..'), '/']) {
      await expect(releaseVanilla({ bundleDir, outDir, build: false, allowDirty: true, dryRun: true })).rejects.toThrow(/nicht erlaubt/);
    }
  });
  it('shownPath: relativ unter dem aktuellen Ordner, sonst absolut, nie ../../..', () => {
    expect(shownPath('/a/b/release', '/a/b')).toBe('release');
    expect(shownPath('/a/b', '/a/b')).toBe('.');
    expect(shownPath('/x/y/release', '/a/b')).toBe('/x/y/release');
  });
  it('die Tarball-only-Datei .tgz.sha256 passt zum Tarball und ist sha256sum-lesbar', async () => {
    const out = `${tmpRoot}/tgzsum`;
    const r = await releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true });
    const line = await readFile(`${out}/hoops-ui-${pkg.version}.tgz.sha256`, 'utf8');
    expect(line).toBe(`${sha(r.tgz)}  hoops-ui-${pkg.version}.tgz\n`);
    expect(r.sums.startsWith(line)).toBe(true);
    expect(r.manifest.tarball.sha256TarballOnly).toBe(`hoops-ui-${pkg.version}.tgz.sha256`);
  });
  it('hoops-sync.mjs ist eine Datei ohne relative Importe, trägt die Startzeile, hat eine Prüfsumme und läuft allein', async () => {
    const out = `${tmpRoot}/sync`;
    const r = await releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true });
    const code = await readFile(`${out}/hoops-sync.mjs`, 'utf8');
    expect(code.startsWith('#!/usr/bin/env node')).toBe(true);
    expect(code.match(/(?:from|import)\s*\(?\s*["']\.{1,2}\//)).toBeNull();
    expect(await readFile(`${out}/hoops-sync.mjs.sha256`, 'utf8')).toBe(`${sha(code)}  hoops-sync.mjs\n`);
    expect(r.manifest.sync).toMatchObject({ name: 'hoops-sync.mjs', bytes: Buffer.byteLength(code), sha256: sha(code), sha256File: 'hoops-sync.mjs.sha256', node: '>=18' });
    // läuft aus einem fremden Ordner ohne das Repository: bekannte deutsche Meldung statt Stack
    const run = spawnSync(process.execPath, [`${out}/hoops-sync.mjs`, '--from-dir', `${tmpRoot}/gibt-es-nicht`], { cwd: tmpRoot, encoding: 'utf8' });
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/Quellordner .* existiert nicht/);
    expect(run.stderr).not.toMatch(/\bat \w+.*\(/);
  });
});

describe('Programm: deutsche Fehler, Paketinhalt', () => {
  const run = (args: string[]) => spawnSync(process.execPath, [resolve(process.cwd(), 'scripts/release-vanilla.mjs'), ...args], { cwd: tmpRoot, encoding: 'utf8' });
  it('ein Ausgabeziel unter einer Datei ergibt eine deutsche Meldung, Exit 1, keinen Stack; --debug zeigt ihn', async () => {
    await mkdir(tmpRoot, { recursive: true });
    await writeFile(`${tmpRoot}/ich-bin-eine-datei`, 'x');
    const args = ['--allow-dirty', '--no-build', '--dry-run', `--out=${tmpRoot}/ich-bin-eine-datei/unter/release`];
    const plain = run(args);
    // die Prüfungen laufen, im Probelauf wird nichts geschrieben; mit Schreiben entsteht der Systemfehler
    expect(plain.status).toBe(0);
    const write = run(args.filter((a) => a !== '--dry-run'));
    expect(write.status).toBe(1);
    expect(write.stderr).toMatch(/^release-vanilla: .*(kein Ordner|nicht gefunden)/m);
    expect(write.stderr).not.toMatch(/\n\s+at /);
    const debug = run([...args.filter((a) => a !== '--dry-run'), '--debug']);
    expect(debug.status).toBe(1);
    expect(debug.stderr).toMatch(/Technisch: ENOTDIR: /);
  });
  it('npm pack enthält portal-sync.mjs und lib/, aber weder das Release-Skript noch Browser-Prüfungen', () => {
    const pack = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: process.cwd(), encoding: 'utf8' });
    expect(pack.status).toBe(0);
    // npm bis 11 liefert eine Liste, ab npm 12 ein Objekt je Paketname
    // npm 10 führt `prepare` trotz --ignore-scripts aus: die Build-Ausgabe steht dann vor dem JSON, das in einer eigenen Zeile mit [ oder { beginnt
    const parsed = JSON.parse(pack.stdout.slice(Math.max(0, pack.stdout.search(/^[[{]\s*$/m))));
    const info = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
    const files: string[] = (info as { files: { path: string }[] }).files.map((f) => f.path);
    for (const f of ['scripts/portal-sync.mjs', 'scripts/lib/tar.mjs', 'scripts/lib/download.mjs', 'scripts/lib/fsutil.mjs', 'scripts/lib/errors.mjs', 'scripts/lib/runtime.mjs', 'dist/vanilla/hoops.js']) expect(files, f).toContain(f);
    expect(files.filter((f) => f.startsWith('scripts/')).every((f) => ['scripts/portal-sync.mjs', 'scripts/migrate-from-dss.mjs', 'scripts/migration-table.mjs'].includes(f) || f.startsWith('scripts/lib/'))).toBe(true);
    // Migrationsskript der Umbenennung: Befehl hoops-migrate, mit Tabelle und Ersetzungslogik
    for (const f of ['scripts/migrate-from-dss.mjs', 'scripts/migration-table.mjs', 'scripts/lib/token-rename.mjs']) expect(files, f).toContain(f);
    expect(JSON.parse(readFileSync('package.json', 'utf8')).bin['hoops-migrate']).toBe('scripts/migrate-from-dss.mjs');
    expect(files.some((f) => /release|check-|tests\/|\.worktrees/.test(f))).toBe(false);
  });
});
