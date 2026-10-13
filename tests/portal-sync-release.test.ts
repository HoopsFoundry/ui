// @vitest-environment node
// portal-sync mit --from-release: Download vom lokalen http-Server (kein Netz), Prüfsumme, Version, Archivinhalt, Zielschutz, Schreibrechte.
import { existsSync, readdirSync } from 'node:fs';
import { chmod, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error reines ES-Modul ohne Typen
import { parseArgs, readTgz, syncDss } from '../stories/examples/portal-sync.mjs';
// @ts-expect-error reines ES-Modul ohne Typen
import { createTar } from '../scripts/release-vanilla.mjs';
import { startServer, type Route } from './helpers/release-server';
import { tmpRoot, writeFakeRelease } from './helpers/release-fixture';

const V = '0.9.0';
const FILES = { 'dss.js': 'export const VERSION = "0.9.0";', 'dss.css': ':root{--dss-version:"0.9.0"}', 'courtlines/court.svg': '<svg/>', 'fonts/fonts.css': '/* f */', 'version.json': JSON.stringify({ name: '@bbv/dss-design-system', version: V }) + '\n' };
const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');
const project = `${tmpRoot}-sync/projekt`;
const dirs = `${tmpRoot}-sync/releases`;
const tmpCount = () => readdirSync(tmpdir()).filter((n) => n.startsWith('dss-release-')).length;

type Server = Awaited<ReturnType<typeof startServer>>;
let server: Server;
const routes = new Map<string, Route>();
const serve = (version: string, tgz: Buffer, sums: string) => {
  routes.set(`/v${version}/dss-vanilla-${version}.tgz`, { body: tgz });
  routes.set(`/v${version}/dss-vanilla-${version}.sha256`, { body: sums });
};
const sync = (options: Record<string, unknown> = {}, version = V) =>
  syncDss({ root: project, source: { type: 'release', version, baseUrl: server.baseUrl }, ...options });
const snapshot = async () => (existsSync(`${project}/_site/dss`) ? (await readdir(`${project}/_site/dss`)).sort() : null);

beforeAll(async () => {
  await rm(`${tmpRoot}-sync`, { recursive: true, force: true });
  server = await startServer(routes);
});
afterAll(async () => {
  await server.close();
  await rm(`${tmpRoot}-sync`, { recursive: true, force: true });
});
beforeEach(async () => {
  routes.clear();
  server.requests.length = 0;
  await rm(project, { recursive: true, force: true });
  await mkdir(`${project}/_site/dss`, { recursive: true });
  await writeFile(`${project}/_site/dss/alt.js`, 'alt');
  await writeFile(`${project}/_site/dss/.dss-sync`, '');
  await mkdir(`${project}/node_modules/leaflet/dist`, { recursive: true });
  await writeFile(`${project}/node_modules/leaflet/dist/leaflet.js`, '//l');
});
afterEach(async () => {
  await chmod(`${project}/_site`, 0o755).catch(() => {});
});

/** Wie `createTar`, aber der Typ-Byte jedes Eintrags wird gesetzt (Verknüpfung, Gerät …); die Kopf-Prüfsumme wird neu berechnet. */
function withType(tar: Buffer, type: string) {
  const out = Buffer.from(tar);
  out.write(type, 156, 'latin1');
  out.fill(0x20, 148, 156);
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += out[i];
  out.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'latin1');
  return out;
}
const rawRelease = (version: string, entries: { path: string; data: string }[], tweak?: (tar: Buffer) => Buffer) => {
  let tar = createTar(entries.map((e) => ({ path: e.path, data: Buffer.from(e.data) })));
  if (tweak) tar = tweak(tar);
  const tgz = gzipSync(tar);
  const sums = [`${sha(tgz)}  dss-vanilla-${version}.tgz`, ...entries.map((e) => `${sha(e.data)}  ${e.path}`)].join('\n') + '\n';
  serve(version, tgz, sums);
};

describe('--from-release: Erfolg', () => {
  it('lädt Tarball und Prüfsumme, prüft, entpackt und ersetzt das Ziel', async () => {
    const fake = await writeFakeRelease(`${dirs}/ok`, V, FILES);
    serve(V, fake.tgz, fake.sums);
    const before = tmpCount();
    const result = await sync();
    expect(result).toEqual({ version: V, leaflet: false });
    expect(server.requests).toEqual([`/v${V}/dss-vanilla-${V}.tgz`, `/v${V}/dss-vanilla-${V}.sha256`]);
    expect((await snapshot())).toEqual(['.dss-sync', 'courtlines', 'dss.css', 'dss.js', 'version.json']);
    expect(await readFile(`${project}/_site/dss/dss.js`, 'utf8')).toBe(FILES['dss.js']);
    expect(JSON.parse(await readFile(`${project}/_site/dss/version.json`, 'utf8'))).toEqual({ name: '@bbv/dss-design-system', version: V });
    expect(tmpCount()).toBe(before);
  });
  it('fonts und Leaflet kommen nur auf Verlangen mit', async () => {
    const fake = await writeFakeRelease(`${dirs}/ok2`, V, FILES);
    serve(V, fake.tgz, fake.sums);
    const result = await sync({ fonts: true, leaflet: true });
    expect(result.leaflet).toBe(true);
    expect(await readFile(`${project}/_site/dss/fonts/fonts.css`, 'utf8')).toBe('/* f */');
    expect(existsSync(`${project}/_site/vendor/leaflet/leaflet.js`)).toBe(true);
  });
  it('--from-dir: ein entpackter Release-Ordner (offline) und ein Paketordner gehen ebenso', async () => {
    const fake = await writeFakeRelease(`${dirs}/dir`, V, FILES);
    const out = `${dirs}/entpackt`;
    for (const f of readTgz(fake.tgz) as { path: string; data: Buffer }[]) {
      await mkdir(resolve(out, f.path, '..'), { recursive: true });
      await writeFile(resolve(out, f.path), f.data);
    }
    const result = await syncDss({ root: project, source: { type: 'dir', path: out } });
    expect(result.version).toBe(V);
    expect(existsSync(`${project}/_site/dss/dss.js`)).toBe(true);
    expect(existsSync(`${project}/_site/dss/fonts`)).toBe(false);
    await expect(syncDss({ root: project, source: { type: 'dir', path: `${dirs}/gibtsnicht` } })).rejects.toThrow(/existiert nicht/);
    await mkdir(`${dirs}/leer`, { recursive: true });
    await expect(syncDss({ root: project, source: { type: 'dir', path: `${dirs}/leer` } })).rejects.toThrow();
  });
});

describe('--from-release: Abbruch lässt das Ziel unverändert', () => {
  const unchanged = async () => {
    expect(await snapshot()).toEqual(['.dss-sync', 'alt.js']);
    expect(await readFile(`${project}/_site/dss/alt.js`, 'utf8')).toBe('alt');
    expect((await readdir(`${project}/_site`)).filter((n) => n.includes('.tmp-'))).toEqual([]);
  };
  it('falsche Prüfsumme des Tarballs', async () => {
    const fake = await writeFakeRelease(`${dirs}/falsch`, V, FILES);
    serve(V, Buffer.concat([fake.tgz.subarray(0, fake.tgz.length - 1), Buffer.from([fake.tgz.at(-1)! ^ 1])]), fake.sums);
    const before = tmpCount();
    await expect(sync()).rejects.toThrow(/Prüfsumme von dss-vanilla-0\.9\.0\.tgz stimmt nicht/);
    await unchanged();
    expect(tmpCount()).toBe(before);
  });
  it('falsche Prüfsumme einer Datei im Archiv (Tarball-Hash stimmt)', async () => {
    const fake = await writeFakeRelease(`${dirs}/datei`, V, FILES);
    const wrong = fake.sums.replace(sha(FILES['dss.js']), sha('anders'));
    serve(V, fake.tgz, wrong);
    await expect(sync()).rejects.toThrow(/Datei dss\.js stimmt nicht/);
    await unchanged();
  });
  it('Prüfsummen-Datei ohne Zeile für den Tarball oder unlesbar', async () => {
    const fake = await writeFakeRelease(`${dirs}/ohne`, V, FILES);
    serve(V, fake.tgz, fake.sums.split('\n').slice(1).join('\n'));
    await expect(sync()).rejects.toThrow(/keine Prüfsumme für/);
    serve(V, fake.tgz, 'Müll\n');
    await expect(sync()).rejects.toThrow(/unlesbar/);
    await unchanged();
  });
  it('404 für den Tarball und für die Prüfsumme', async () => {
    await expect(sync()).rejects.toThrow(/HTTP 404/);
    const fake = await writeFakeRelease(`${dirs}/n404`, V, FILES);
    routes.set(`/v${V}/dss-vanilla-${V}.tgz`, { body: fake.tgz });
    await expect(sync()).rejects.toThrow(/sha256.*HTTP 404/);
    await unchanged();
  });
  it('abgebrochener Download (weniger Bytes als angekündigt)', async () => {
    const fake = await writeFakeRelease(`${dirs}/teil`, V, FILES);
    routes.set(`/v${V}/dss-vanilla-${V}.tgz`, { body: fake.tgz.subarray(0, 200), declared: fake.tgz.length, abort: true });
    routes.set(`/v${V}/dss-vanilla-${V}.sha256`, { body: fake.sums });
    await expect(sync()).rejects.toThrow(/Download (abgebrochen|fehlgeschlagen|unvollständig)/);
    await unchanged();
  });
  it('Teil-Download mit passender Länge (abgeschnittenes Archiv): die Prüfsumme fängt es', async () => {
    const fake = await writeFakeRelease(`${dirs}/kurz`, V, FILES);
    serve(V, fake.tgz.subarray(0, fake.tgz.length - 40), fake.sums);
    await expect(sync()).rejects.toThrow(/Prüfsumme/);
    await unchanged();
  });
  it('falsche Version: version.json oder Ordnername passen nicht zur verlangten Version', async () => {
    const other = await writeFakeRelease(`${dirs}/v`, V, FILES);
    // unter der Adresse von 1.0.0 liegt das Archiv der 0.9.0 (Ordner und version.json nennen 0.9.0)
    routes.set('/v1.0.0/dss-vanilla-1.0.0.tgz', { body: other.tgz });
    routes.set('/v1.0.0/dss-vanilla-1.0.0.sha256', { body: other.sums.replace(`dss-vanilla-${V}.tgz`, 'dss-vanilla-1.0.0.tgz') });
    await expect(sync({}, '1.0.0')).rejects.toThrow(/oberster Ordner dss-vanilla-0\.9\.0 statt dss-vanilla-1\.0\.0/);
    // richtiger Ordner, aber version.json nennt eine andere Version
    const fake = await writeFakeRelease(`${dirs}/v2`, '1.0.0', { ...FILES, 'version.json': JSON.stringify({ name: '@bbv/dss-design-system', version: '0.9.0' }) });
    serve('1.0.0', fake.tgz, fake.sums);
    await expect(sync({}, '1.0.0')).rejects.toThrow(/version\.json im Archiv nennt/);
    await unchanged();
  });
  it('ungültige Versionen werden abgelehnt, bevor eine Anfrage entsteht', async () => {
    for (const v of ['../x', '1.0', 'latest', '1.0.0/../../x', '']) await expect(sync({}, v)).rejects.toThrow(/ungültige Version/);
    expect(server.requests).toEqual([]);
    await unchanged();
  });
  const bad: [string, { path: string; data: string }[], ((t: Buffer) => Buffer) | undefined, RegExp][] = [
    ['Pfad mit ..', [{ path: `dss-vanilla-${V}/../evil.js`, data: 'x' }], undefined, /unzulässiger Pfad/],
    ['absoluter Pfad', [{ path: '/etc/evil', data: 'x' }], undefined, /unzulässiger Pfad/],
    ['Rückwärtsstrich (Windows)', [{ path: `dss-vanilla-${V}/a\\..\\b.js`, data: 'x' }], undefined, /unzulässiger Pfad/],
    ['Laufwerk (Windows)', [{ path: `dss-vanilla-${V}/C:/x.js`, data: 'x' }], undefined, /unzulässiger Pfad/],
    ['doppelter Eintrag', [{ path: `dss-vanilla-${V}/a.js`, data: 'x' }, { path: `dss-vanilla-${V}/a.js`, data: 'y' }], undefined, /doppelter Eintrag/],
    ['Verknüpfung', [{ path: `dss-vanilla-${V}/a.js`, data: '' }], (t) => withType(t, '2'), /Eintragstyp/],
    ['Datei ohne Ordner', [{ path: 'a.js', data: 'x' }], undefined, /obersten Ordner/],
  ];
  it.each(bad)('Archiv mit %s wird abgelehnt, es entsteht nichts außerhalb', async (_n, entries, tweak, pattern) => {
    rawRelease(V, entries, tweak);
    await expect(sync()).rejects.toThrow(pattern);
    await unchanged();
    expect(existsSync(`${project}/_site/evil.js`) || existsSync(`${project}/evil.js`) || existsSync('/etc/evil.js')).toBe(false);
  });
  it('kein gültiges gzip', async () => {
    serve(V, Buffer.from('kein gzip'), `${sha('kein gzip')}  dss-vanilla-${V}.tgz\n`);
    await expect(sync()).rejects.toThrow(/kein gültiges \.tgz/);
    await unchanged();
  });
});

describe('--from-release: Zielschutz und Schreibrechte', () => {
  it('ein Ziel ohne Marker bleibt, auch wenn Download und Prüfung gelingen; Fremdes daneben bleibt ebenfalls', async () => {
    const fake = await writeFakeRelease(`${dirs}/z`, V, FILES);
    serve(V, fake.tgz, fake.sums);
    await mkdir(`${project}/seite`, { recursive: true });
    await writeFile(`${project}/seite/index.html`, '<p>wichtig</p>');
    await writeFile(`${project}/_site/nachbar.txt`, 'bleibt');
    await expect(sync({ to: `${project}/seite` })).rejects.toThrow(/Marker-Datei/);
    expect(await readFile(`${project}/seite/index.html`, 'utf8')).toBe('<p>wichtig</p>');
    for (const to of [project, resolve(project, '..'), `${project}/node_modules`]) await expect(sync({ to })).rejects.toThrow(/nicht erlaubt/);
    await sync();
    expect(await readFile(`${project}/_site/nachbar.txt`, 'utf8')).toBe('bleibt');
  });
  it('nicht beschreibbarer Elternordner: Fehler, Ziel unverändert, nichts liegt halb da', async () => {
    if (process.getuid?.() === 0) return;
    const fake = await writeFakeRelease(`${dirs}/w`, V, FILES);
    serve(V, fake.tgz, fake.sums);
    await chmod(`${project}/_site`, 0o555);
    await expect(sync()).rejects.toThrow();
    await chmod(`${project}/_site`, 0o755);
    expect(await readdir(`${project}/_site/dss`)).toContain('alt.js');
    expect((await readdir(`${project}/_site`)).filter((n) => n.includes('.tmp-'))).toEqual([]);
  });
});

describe('Quelle und Befehlszeile', () => {
  it('parseArgs: genau eine Quelle, Basisadresse nur mit Release, Werte nötig', () => {
    expect(parseArgs([])).toMatchObject({ source: { type: 'package' }, fonts: true, leaflet: 'auto' });
    expect(parseArgs(['--from-release', '0.9.0']).source).toEqual({ type: 'release', version: '0.9.0' });
    expect(parseArgs(['--from-release', '0.9.0', '--base-url', 'http://x']).source).toEqual({ type: 'release', version: '0.9.0', baseUrl: 'http://x' });
    expect(parseArgs(['--from-dir', 'a']).source).toEqual({ type: 'dir', path: 'a' });
    expect(parseArgs(['--from-package']).source).toEqual({ type: 'package' });
    expect(parseArgs(['--no-fonts', '--leaflet', '--to', 'x']).fonts).toBe(false);
    expect(() => parseArgs(['--from-release', '0.9.0', '--from-dir', 'a'])).toThrow(/genau eine Quelle/);
    expect(() => parseArgs(['--base-url', 'http://x'])).toThrow(/nur mit --from-release/);
    expect(() => parseArgs(['--from-release'])).toThrow(/braucht einen Wert/);
    expect(() => parseArgs(['--from-release', '--to'])).toThrow(/braucht einen Wert/);
    expect(() => parseArgs(['--foo'])).toThrow(/unbekannte Option/);
  });
  it('die Standard-Adresse zeigt auf die Release-Anhänge dieses Repositorys', async () => {
    const { RELEASE_BASE_URL } = await import(/* @vite-ignore */ '../stories/examples/portal-sync.mjs');
    expect(RELEASE_BASE_URL).toBe('https://github.com/OliEder/dss-design-system/releases/download');
  });
});
