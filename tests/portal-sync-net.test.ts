// @vitest-environment node
// portal-sync: Download mit Stromzählung, Zeitgrenzen, Weiterleitungen und http-Regeln; Sperrdatei und Ersetzen mit Rückrollen; deutsche Fehlermeldungen.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error reines ES-Modul ohne Typen
import { checkUrl, download, redirectAllowed, MAX_DOWNLOAD_BYTES } from '../scripts/lib/download.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { describeError } from '../scripts/lib/errors.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { acquireLock } from '../scripts/lib/fsutil.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { assertNode, MIN_NODE_MAJOR } from '../scripts/lib/runtime.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { replaceDir, syncHoops } from '../scripts/portal-sync.mjs';
import { startServer, type Route } from './helpers/release-server';
import { tmpRoot, writeFakeRelease } from './helpers/release-fixture';

const root = `${tmpRoot}-net`;
const sync = resolve(process.cwd(), 'scripts/portal-sync.mjs');
const routes = new Map<string, Route>();
let server: Awaited<ReturnType<typeof startServer>>;
let other: Awaited<ReturnType<typeof startServer>>;

beforeAll(async () => {
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
  server = await startServer(routes);
  other = await startServer(new Map([['/x', { body: 'fremd' }]]));
});
afterAll(async () => {
  await server.close();
  await other.close();
  await rm(root, { recursive: true, force: true });
});
beforeEach(() => routes.clear());

/** Führt Node mit einem Modul-Text aus und gibt Ausgabe und Exit-Code zurück (kein Hintergrundprozess: wird abgewartet). */
const node = (args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) =>
  new Promise<{ code: number | null; stdout: string; stderr: string }>((done) => {
    const child = spawn(process.execPath, args, { cwd: options.cwd ?? root, env: { ...process.env, ...options.env } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => done({ code, stdout, stderr }));
  });

describe('Download: Strom, Grenze, Zeit', () => {
  it('ein Strom ohne Content-Length über 32 MiB wird abgebrochen, der Speicher des Prozesses wächst nur begrenzt', async () => {
    expect(MAX_DOWNLOAD_BYTES).toBe(32 * 1024 * 1024);
    routes.set('/v0.9.0/hoops-ui-0.9.0.tgz', { stream: 100 * 1024 * 1024 });
    const code = `
      import { syncHoops } from ${JSON.stringify(pathToFileURL(sync).href)};
      const before = process.memoryUsage().rss;
      let message = 'kein Fehler';
      try { await syncHoops({ root: ${JSON.stringify(root)}, to: ${JSON.stringify(`${root}/rss/dss`)}, source: { type: 'release', version: '0.9.0', baseUrl: ${JSON.stringify(server.baseUrl)}, timeoutMs: 20000 } }); } catch (e) { message = e.message; }
      console.log(JSON.stringify({ message, grewMiB: Math.round((process.memoryUsage().rss - before) / 1048576) }));`;
    const run = await node(['--input-type=module', '-e', code]);
    const result = JSON.parse(run.stdout);
    expect(result.message).toMatch(/größer als 33554432 Byte; der Download wurde abgebrochen/);
    // Der Prozess hält höchstens die 32 MiB plus Lesepuffer (gemessen 72 bis 83 MiB unter hoher Last); 100 MiB vollständig zu
    // puffern und zusammenzufügen wäre mehr als das Doppelte
    expect(result.grewMiB).toBeLessThan(120);
    console.log(`RSS-Zuwachs beim Abbruch eines 100-MiB-Stroms: ${result.grewMiB} MiB`);
  });
  it('ein angekündigter Content-Length über der Grenze wird sofort abgelehnt', async () => {
    routes.set('/big', { body: 'x', declared: MAX_DOWNLOAD_BYTES + 1, abort: true });
    await expect(download(`${server.baseUrl}/big`)).rejects.toThrow(/größer als/);
  });
  it('ein Server ohne Antwort führt zur Zeitüberschreitung (Leerlauf)', async () => {
    routes.set('/h', { hang: 'before-headers' });
    await expect(download(`${server.baseUrl}/h`, { idleMs: 300, timeoutMs: 5000 })).rejects.toThrow(/Zeitüberschreitung: seit 300 ms kommen keine Daten/);
  });
  it('ein Server, der nach dem Kopf verstummt, führt ebenfalls zur Zeitüberschreitung', async () => {
    routes.set('/h2', { hang: 'after-headers' });
    await expect(download(`${server.baseUrl}/h2`, { idleMs: 300, timeoutMs: 5000 })).rejects.toThrow(/seit 300 ms kommen keine Daten/);
  });
  it('tröpfelnde Daten halten die Leerlauf-Grenze wach, die Gesamtzeit bricht trotzdem ab', async () => {
    routes.set('/t', { trickle: 50 });
    await expect(download(`${server.baseUrl}/t`, { idleMs: 1000, timeoutMs: 600 })).rejects.toThrow(/dauert länger als 600 ms/);
  });
  it('normale Antworten kommen vollständig an', async () => {
    routes.set('/ok', { body: 'abc' });
    expect((await download(`${server.baseUrl}/ok`)).toString()).toBe('abc');
  });
});

describe('Adressen und Weiterleitungen', () => {
  it('http nur an Loopback; sonst nur mit ausdrücklicher Freigabe; https immer; andere Schemata nie', () => {
    expect(() => checkUrl('http://127.0.0.1:1/x')).not.toThrow();
    expect(() => checkUrl('http://localhost/x')).not.toThrow();
    expect(() => checkUrl('http://[::1]:5/x')).not.toThrow();
    expect(() => checkUrl('http://example.com/x')).toThrow(/unverschlüsselt.*--allow-insecure-http/);
    expect(() => checkUrl('http://example.com/x', { allowInsecureHttp: true })).not.toThrow();
    expect(() => checkUrl('https://example.com/x')).not.toThrow();
    expect(() => checkUrl('ftp://example.com/x')).toThrow(/nicht erlaubt/);
    expect(() => checkUrl('file:///etc/passwd')).toThrow(/nicht erlaubt/);
    expect(() => checkUrl('kein url')).toThrow(/ungültige Adresse/);
  });
  it('redirectAllowed: https gleicher Host, GitHub-Anhänge, freigegebene Hosts; nie https → http, nie Host-, Port- oder Schemawechsel sonst', () => {
    const u = (s: string) => new URL(s);
    expect(redirectAllowed(u('https://a.example/x'), u('https://a.example/y'))).toBe(true);
    expect(redirectAllowed(u('https://a.example/x'), u('https://b.example/y'))).toBe(false);
    expect(redirectAllowed(u('https://a.example/x'), u('https://a.example:8443/y'))).toBe(false);
    expect(redirectAllowed(u('https://a.example/x'), u('http://a.example/y'))).toBe(false);
    expect(redirectAllowed(u('https://a.example/x'), u('https://b.example/y'), ['b.example'])).toBe(true);
    expect(redirectAllowed(u('https://github.com/o/r/releases/download/v1/a'), u('https://release-assets.githubusercontent.com/x'))).toBe(true);
    expect(redirectAllowed(u('https://github.com/o/r/releases/download/v1/a'), u('https://githubusercontent.com.evil.example/x'))).toBe(false);
    expect(redirectAllowed(u('https://example.com/o'), u('https://x.githubusercontent.com/x'))).toBe(false);
    expect(redirectAllowed(u('http://127.0.0.1:1/x'), u('http://127.0.0.1:1/y'))).toBe(true);
    expect(redirectAllowed(u('http://127.0.0.1:1/x'), u('http://127.0.0.1:2/y'))).toBe(false);
    expect(redirectAllowed(u('http://127.0.0.1:1/x'), u('http://localhost:1/y'))).toBe(false);
    expect(redirectAllowed(u('http://127.0.0.1:1/x'), u('https://127.0.0.1:1/y'))).toBe(false);
  });
  it('eine Weiterleitung auf denselben Ursprung wird befolgt, auf einen anderen Port oder Host nicht', async () => {
    routes.set('/r1', { redirect: `${server.baseUrl}/ziel` });
    routes.set('/ziel', { body: 'angekommen' });
    expect((await download(`${server.baseUrl}/r1`)).toString()).toBe('angekommen');
    routes.set('/r2', { redirect: `${other.baseUrl}/x` });
    await expect(download(`${server.baseUrl}/r2`)).rejects.toThrow(/Weiterleitung von .* nach .* wird nicht befolgt/);
    expect(other.requests).toEqual([]);
    routes.set('/r3', { redirect: 'http://example.invalid/x' });
    await expect(download(`${server.baseUrl}/r3`)).rejects.toThrow(/nicht befolgt/);
  });
  it('Weiterleitungsschleifen enden', async () => {
    routes.set('/loop', { redirect: `${server.baseUrl}/loop` });
    await expect(download(`${server.baseUrl}/loop`)).rejects.toThrow(/zu viele Weiterleitungen/);
  });
});

describe('Sperre und Ersetzen', () => {
  it('zweiter Lauf im selben Ordner bricht mit deutscher Meldung ab, erster darf weiter', async () => {
    const dir = `${root}/lock1`;
    const release = await acquireLock(dir, '.hoops-sync.lock', 'portal-sync');
    await expect(acquireLock(dir, '.hoops-sync.lock', 'portal-sync')).rejects.toThrow(/Ein anderer Lauf \(Prozess \d+\) arbeitet gerade/);
    await release();
    expect(existsSync(`${dir}/.hoops-sync.lock`)).toBe(false);
    const again = await acquireLock(dir, '.hoops-sync.lock', 'portal-sync');
    await again();
  });
  it('eine verwaiste Sperre (Prozess läuft nicht mehr) wird übernommen', async () => {
    const dir = `${root}/lock2`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/.hoops-sync.lock`, '99999999\n');
    const release = await acquireLock(dir, '.hoops-sync.lock', 'portal-sync');
    expect((await readFile(`${dir}/.hoops-sync.lock`, 'utf8')).trim()).toBe(String(process.pid));
    await release();
  });
  it('zwei Prozesse gleichzeitig: nie ein kaputtes Ziel, höchstens ein klarer Abbruch, keine Reste', async () => {
    const fake = await writeFakeRelease(`${root}/rel`, '0.9.0', { 'hoops.js': 'a'.repeat(200000), 'version.json': JSON.stringify({ name: '@hoopsfoundry/ui', version: '0.9.0' }) });
    const dir = `${root}/rel/entpackt`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/hoops.js`, 'a'.repeat(200000));
    await writeFile(`${dir}/version.json`, JSON.stringify({ name: '@hoopsfoundry/ui', version: '0.9.0' }));
    void fake;
    const project = `${root}/parallel`;
    await mkdir(`${project}/_site/dss`, { recursive: true });
    await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
    await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
    const outcomes: { code: number | null; stderr: string }[] = [];
    for (let round = 0; round < 6; round++) {
      const runs = await Promise.all([1, 2].map(() => node([sync, '--from-dir', dir, '--no-fonts'], { cwd: project })));
      outcomes.push(...runs);
      // nach jeder Runde: Ziel vollständig, keine Reste
      expect((await readdir(`${project}/_site/dss`)).sort()).toEqual(['.hoops-sync', 'hoops.js', 'version.json']);
      expect((await readdir(`${project}/_site`)).sort()).toEqual(['dss']);
    }
    for (const o of outcomes) {
      expect(o.code === 0 || /Ein anderer Lauf( \(Prozess \d+\))? arbeitet gerade/.test(o.stderr), o.stderr).toBe(true);
      expect(o.stderr).not.toMatch(/\bat \w.*\(/);
    }
    expect(outcomes.filter((o) => o.code === 0).length).toBeGreaterThanOrEqual(6);
    console.log(`parallele Läufe: ${outcomes.filter((o) => o.code === 0).length} erfolgreich, ${outcomes.filter((o) => o.code === 1).length} mit Hinweis "anderer Lauf"`);
  });
  it('scheitert das Einsetzen, kommt das alte Ziel zurück; temporäre Ordner verschwinden', async () => {
    const project = `${root}/rollback`;
    await mkdir(`${project}/_site/dss`, { recursive: true });
    await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
    await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
    await expect(
      replaceDir(`${project}/_site/dss`, project, async (tmp: string) => writeFile(`${tmp}/neu.js`, 'neu'), { beforeInstall: (tmp: string) => rm(tmp, { recursive: true, force: true }) }),
    ).rejects.toThrow();
    expect(await readFile(`${project}/_site/hoops/alt.js`, 'utf8')).toBe('alt');
    expect((await readdir(`${project}/_site`)).sort()).toEqual(['dss']);
  });
  it('scheitert das Füllen, bleibt das alte Ziel unberührt', async () => {
    const project = `${root}/fillfail`;
    await mkdir(`${project}/_site/dss`, { recursive: true });
    await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
    await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
    await expect(replaceDir(`${project}/_site/dss`, project, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(await readFile(`${project}/_site/hoops/alt.js`, 'utf8')).toBe('alt');
    expect((await readdir(`${project}/_site`)).sort()).toEqual(['dss']);
  });
  it('der Erfolgsfall hinterlässt weder .old- noch .tmp-Ordner noch die Sperre', async () => {
    const dir = `${root}/ok-dir`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/version.json`, JSON.stringify({ name: '@hoopsfoundry/ui', version: '1.0.0' }));
    await writeFile(`${dir}/hoops.js`, 'x');
    const project = `${root}/ok-proj`;
    await mkdir(`${project}/_site/dss`, { recursive: true });
    await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
    await syncHoops({ root: project, source: { type: 'dir', path: dir } });
    expect(readdirSync(`${project}/_site`)).toEqual(['dss']);
  });
});

describe('Deutsche Fehlermeldungen und Startprüfung', () => {
  const E = (code: string, path?: string) => Object.assign(new Error(`${code}: system`), { code, path });
  it.each([
    ['ENOENT', /nicht gefunden \(\/a\/b\)/],
    ['ENOTDIR', /kein Ordner/],
    ['EEXIST', /Existiert bereits/],
    ['EACCES', /Keine Berechtigung/],
    ['EPERM', /nicht erlaubt/],
    ['ENOSPC', /Kein Speicherplatz/],
    ['EISDIR', /Ordner/],
    ['EROFS', /schreibgeschützt/],
  ])('%s wird übersetzt, ohne Stack', (code, pattern) => {
    const text = describeError(E(code, '/a/b'), { name: 'portal-sync' });
    expect(text).toMatch(pattern);
    expect(text).not.toMatch(/: system|\n/);
  });
  it('„Cannot find module“ nennt das Modul und rät zur Installation', () => {
    const text = describeError(Object.assign(new Error("Cannot find module 'esbuild' imported from /x"), { code: 'ERR_MODULE_NOT_FOUND' }), { name: 'release-vanilla' });
    expect(text).toMatch(/Modul fehlt \(esbuild\).*npm install/);
  });
  it('eigene Meldungen bleiben, Unbekanntes bekommt einen Hinweis auf --debug, --debug hängt den Stack an', () => {
    expect(describeError(new Error('portal-sync: schon deutsch'), { name: 'x' })).toBe('portal-sync: schon deutsch');
    expect(describeError(new Error('komisch'), { name: 'portal-sync' })).toMatch(/Unerwarteter Fehler: komisch \(mit --debug folgt der Stack\)/);
    expect(describeError(new Error('komisch'), { name: 'portal-sync', debug: true })).toMatch(/Technisch: komisch\n.*\n\s+at /s);
  });
  it('das Programm: Ziel unter einer Datei → deutsche Meldung, Exit 1, kein Stack; mit --debug der Stack', async () => {
    const dir = `${root}/enotdir`;
    await mkdir(`${dir}/quelle`, { recursive: true });
    await writeFile(`${dir}/quelle/hoops.js`, 'x');
    await writeFile(`${dir}/quelle/version.json`, JSON.stringify({ name: '@hoopsfoundry/ui', version: '1.0.0' }));
    await writeFile(`${dir}/datei`, 'ich bin eine Datei');
    const plain = await node([sync, '--from-dir', `${dir}/quelle`, '--to', `${dir}/datei/unter/dss`], { cwd: dir });
    expect(plain.code).toBe(1);
    expect(plain.stderr).toMatch(/^portal-sync: .*(kein Ordner|nicht gefunden|Existiert bereits)/m);
    expect(plain.stderr).not.toMatch(/\n\s+at /);
    const debug = await node([sync, '--from-dir', `${dir}/quelle`, '--to', `${dir}/datei/unter/dss`, '--debug'], { cwd: dir });
    expect(debug.code).toBe(1);
    expect(debug.stderr).toMatch(/Technisch: [A-Z]+: /);
    expect(await readdir(dir)).not.toContain('datei.old-1');
  });
  it('Node-Mindestversion: zu alte Versionen werden mit deutscher Meldung abgelehnt', () => {
    expect(MIN_NODE_MAJOR).toBe(18);
    expect(() => assertNode('portal-sync', '16.20.0')).toThrow(/Node 16\.20\.0 ist zu alt\. Gebraucht wird Node 18 oder neuer/);
    expect(() => assertNode('portal-sync', '18.0.0')).not.toThrow();
    expect(() => assertNode('portal-sync', '22.21.0')).not.toThrow();
    expect(() => assertNode('portal-sync', 'kaputt')).toThrow(/zu alt/);
    expect(() => assertNode('portal-sync')).not.toThrow();
  });
  it('die Skripte benutzen keine Schnittstellen, die erst nach Node 18 stabil sind (kein fs.cp)', async () => {
    for (const f of ['portal-sync.mjs', 'release-vanilla.mjs', 'lib/download.mjs', 'lib/fsutil.mjs', 'lib/tar.mjs', 'lib/errors.mjs']) {
      const code = await readFile(resolve(process.cwd(), 'scripts', f), 'utf8');
      expect(code, f).not.toMatch(/\bcp\(|import\.meta\.dirname|import\.meta\.filename|\.toSorted\(|structuredClone|Array\.fromAsync|Object\.groupBy/);
    }
  });
  it('die Hilfsordner sind nicht beschädigt hinterlassen', async () => {
    expect(existsSync(`${root}/rss`)).toBe(false);
    void mkdtemp;
  });
});
