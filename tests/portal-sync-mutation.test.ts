// @vitest-environment node
// Mutationstests von portal-sync --from-release: Jede Schutzregel (Prüfsumme, Version, Archivinhalt, Zielschutz) muss kippen, wenn der Quelltext
// von scripts/portal-sync.mjs gezielt verfälscht wird.
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mutate, read } from './helpers/mutation';
import { cleanLoaded, loadScript, loadSibling, tmpRoot, writeFakeRelease } from './helpers/release-fixture';
import { startServer, type Route } from './helpers/release-server';

const SOURCE = read('scripts/portal-sync.mjs');
const LIBS = { tar: read('scripts/lib/tar.mjs'), download: read('scripts/lib/download.mjs'), fs: read('scripts/lib/fsutil.mjs'), runtime: read('scripts/lib/runtime.mjs'), errors: read('scripts/lib/errors.mjs') };
type Target = 'sync' | 'tar' | 'download' | 'fs' | 'runtime' | 'errors';
const TEXT: Record<Target, string> = { sync: SOURCE, ...LIBS };
const FILE: Record<Target, string> = { sync: 'portal-sync.mjs', tar: 'lib/tar.mjs', download: 'lib/download.mjs', fs: 'lib/fsutil.mjs', runtime: 'lib/runtime.mjs', errors: 'lib/errors.mjs' };
/** Lädt portal-sync.mjs, wobei die Datei `target` durch `text` ersetzt ist. */
const loadWith = (target: Target, text: string) => (target === 'sync' ? loadScript(text, 'portal-sync.mjs') : loadScript(SOURCE, 'portal-sync.mjs', { [FILE[target]]: text }));
const V = '0.9.0';
const FILES = { 'hoops.js': 'a', 'hoops.css': 'b', 'fonts/fonts.css': 'f', 'version.json': JSON.stringify({ name: '@hoopsfoundry/ui', version: V }) + '\n' };
const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');
const root = `${tmpRoot}-syncmut`;
const project = `${root}/p`;
const routes = new Map<string, Route>();
let server: Awaited<ReturnType<typeof startServer>>;

beforeAll(async () => {
  await rm(root, { recursive: true, force: true });
  server = await startServer(routes);
});
afterAll(async () => {
  await cleanLoaded();
  await server.close();
  await rm(root, { recursive: true, force: true });
});
beforeEach(async () => {
  routes.clear();
  await rm(project, { recursive: true, force: true });
  await mkdir(`${project}/_site/dss`, { recursive: true });
  await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
  await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
});

const serveFake = async (name: string, files: Record<string, string> = FILES, options: { top?: string; version?: string } = {}) => {
  const version = options.version ?? V;
  const fake = await writeFakeRelease(`${root}/rel-${name}`, version, files, { top: options.top });
  routes.set(`/v${version}/hoops-ui-${version}.tgz`, { body: fake.tgz });
  routes.set(`/v${version}/hoops-ui-${version}.sha256`, { body: fake.sums });
  return fake;
};
const run = (mod: any, extra: Record<string, unknown> = {}, version = V) =>
  mod.syncHoops({ root: project, source: { type: 'release', version, baseUrl: server.baseUrl }, ...extra });
/** Wahr, wenn der Lauf mit einer passenden Meldung scheitert und das Ziel unverändert ist. */
const rejected = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (error) {
    const unchanged = (await readFile(`${project}/_site/hoops/alt.js`, 'utf8').catch(() => '')) === 'alt';
    return pattern.test(String((error as Error).message)) && unchanged;
  }
};

/** Wahr, wenn der Aufruf wirft und die Meldung zum Muster passt (das Ziel wird hier nicht geprüft). */
const throws = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (error) {
    return pattern.test(String((error as Error).message));
  }
};
/** Ergebnis von `fn`, aber falsch, wenn es nicht innerhalb von `ms` kommt (eine verfälschte Quelle darf hängen, ohne den Test zu blockieren). */
const within = (ms: number, fn: () => Promise<boolean>) => Promise.race([fn(), new Promise<boolean>((done) => setTimeout(() => done(false), ms))]);
let counter = 0;

const RULES: Record<string, (mod: any) => Promise<boolean>> = {
  'Tarball-Prüfsumme wird geprüft': async (mod) => {
    const fake = await serveFake('tgz');
    routes.set(`/v${V}/hoops-ui-${V}.tgz`, { body: Buffer.concat([fake.tgz.subarray(0, -1), Buffer.from([fake.tgz.at(-1)! ^ 1])]) });
    const first = await rejected(() => run(mod), /Prüfsumme|kein gültiges|beschädigt/);
    return first && (await rejected(() => run(mod), /Prüfsumme von/));
  },
  'Prüfsumme jeder Datei wird geprüft': async (mod) => {
    const fake = await serveFake('datei');
    routes.set(`/v${V}/hoops-ui-${V}.sha256`, { body: fake.sums.replace(sha('a'), sha('x')) });
    return rejected(() => run(mod), /Datei dss\.js stimmt nicht/);
  },
  'Prüfsummen-Datei und Archiv nennen dieselben Dateien': async (mod) => {
    const fake = await serveFake('liste');
    routes.set(`/v${V}/hoops-ui-${V}.sha256`, { body: `${fake.sums}${sha('x')}  hoops-ui-${V}/extra.js\n` });
    return rejected(() => run(mod), /nicht dieselben Dateien/);
  },
  'Version in version.json muss zur verlangten passen': async (mod) => {
    await serveFake('version', { ...FILES, 'version.json': JSON.stringify({ name: '@hoopsfoundry/ui', version: '0.1.0' }) });
    return rejected(() => run(mod), /version\.json im Archiv nennt/);
  },
  'oberster Ordner muss hoops-ui-<version> heißen': async (mod) => {
    await serveFake('top', FILES, { top: 'anderer-ordner' });
    return rejected(() => run(mod), /oberster Ordner/);
  },
  'Pfade mit .. sind verboten': async (mod) => {
    await serveFake('dotdot', { ...FILES, '../evil.js': 'x' });
    return rejected(() => run(mod), /unzulässiger Pfad/);
  },
  'Pfade mit Rückwärtsstrich (Windows) sind verboten': async (mod) => {
    await serveFake('backslash', { ...FILES, 'a\\b.js': 'x' });
    return rejected(() => run(mod), /unzulässiger Pfad/);
  },
  'Verknüpfungen und Geräte sind verboten': async (mod) => {
    const fake = await serveFake('link');
    // Typ-Byte des ersten Eintrags auf Verknüpfung setzen, Kopf-Prüfsumme neu berechnen
    const { gunzipSync, gzipSync } = await import('node:zlib');
    const tar = gunzipSync(fake.tgz);
    tar.write('2', 156, 'latin1');
    tar.fill(0x20, 148, 156);
    let sum = 0;
    for (let i = 0; i < 512; i++) sum += tar[i];
    tar.write(`${sum.toString(8).padStart(6, '0')}\0 `, 148, 'latin1');
    const tgz = gzipSync(tar);
    routes.set(`/v${V}/hoops-ui-${V}.tgz`, { body: tgz });
    routes.set(`/v${V}/hoops-ui-${V}.sha256`, { body: fake.sums.replace(sha(fake.tgz), sha(tgz)) });
    const first = await rejected(() => run(mod), /Eintragstyp|Prüfsumme/);
    return first && (await rejected(() => run(mod), /Eintragstyp/));
  },
  'doppelte Einträge sind verboten': async (mod) => {
    const { createTar } = await import(/* @vite-ignore */ '../scripts/release-vanilla.mjs');
    const { gzipSync } = await import('node:zlib');
    const entries = [{ path: `hoops-ui-${V}/hoops.js`, data: Buffer.from('a') }, { path: `hoops-ui-${V}/hoops.js`, data: Buffer.from('b') }];
    const tgz = gzipSync(createTar(entries));
    routes.set(`/v${V}/hoops-ui-${V}.tgz`, { body: tgz });
    routes.set(`/v${V}/hoops-ui-${V}.sha256`, { body: `${sha(tgz)}  hoops-ui-${V}.tgz\n${sha('a')}  hoops-ui-${V}/hoops.js\n` });
    return rejected(() => run(mod), /doppelter Eintrag/);
  },
  'ein Ziel ohne Marker wird nie gelöscht': async (mod) => {
    await serveFake('marker');
    await mkdir(`${project}/seite`, { recursive: true });
    await writeFile(`${project}/seite/index.html`, 'x');
    try {
      await run(mod, { to: `${project}/seite` });
    } catch {
      /* erwartet */
    }
    return existsSync(`${project}/seite/index.html`);
  },
  'ungültige Version wird vor der Anfrage abgelehnt': async (mod) => {
    server.requests.length = 0;
    const ok = await rejected(() => run(mod, {}, '../../x'), /ungültige Version/);
    return ok && server.requests.length === 0;
  },
  'übergroße Downloads werden abgelehnt': async (mod) => {
    routes.set(`/v${V}/hoops-ui-${V}.tgz`, { body: 'x', declared: 40 * 1024 * 1024, abort: true });
    routes.set(`/v${V}/hoops-ui-${V}.sha256`, { body: '' });
    return rejected(() => run(mod), /größer als/);
  },
  'Stream: Übergröße ohne Content-Length bricht ab': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    routes.set('/s', { stream: 40 * 1024 * 1024 });
    return throws(() => dl.download(`${server.baseUrl}/s`, { timeoutMs: 15000 }), /größer als/);
  },
  'Leerlauf-Grenze: ein hängender Server wird abgebrochen': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    routes.set('/h', { hang: 'before-headers' });
    return within(3000, () => throws(() => dl.download(`${server.baseUrl}/h`, { idleMs: 300, timeoutMs: 60000 }), /Zeitüberschreitung: seit 300 ms/));
  },
  'Gesamtzeit-Grenze: tröpfelnde Daten werden abgebrochen': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    routes.set('/t', { trickle: 50 });
    return within(3000, () => throws(() => dl.download(`${server.baseUrl}/t`, { idleMs: 60000, timeoutMs: 400 }), /dauert länger als 400 ms/));
  },
  'Weiterleitung: gleicher Ursprung ja, anderer Port nein': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    routes.set('/r1', { redirect: `${server.baseUrl}/ziel` });
    routes.set('/ziel', { body: 'ok' });
    routes.set('/r2', { redirect: 'http://127.0.0.1:9/x' });
    const followed = (await dl.download(`${server.baseUrl}/r1`)).toString() === 'ok';
    return followed && (await throws(() => dl.download(`${server.baseUrl}/r2`), /nicht befolgt/));
  },
  'Weiterleitung: nie von https nach http, nie von http außerhalb Loopback': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    const u = (x: string) => new URL(x);
    return !dl.redirectAllowed(u('https://a.example/x'), u('http://a.example/y')) && !dl.redirectAllowed(u('http://a.example/x'), u('http://a.example/y')) && dl.redirectAllowed(u('https://a.example/x'), u('https://a.example/y'));
  },
  'Weiterleitung: GitHub nur auf githubusercontent.com': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    const u = (x: string) => new URL(x);
    return dl.redirectAllowed(u('https://github.com/a'), u('https://objects.githubusercontent.com/b')) && !dl.redirectAllowed(u('https://github.com/a'), u('https://evil.example/b'));
  },
  'Weiterleitungsschleife endet': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    routes.set('/loop', { redirect: `${server.baseUrl}/loop` });
    return within(4000, () => throws(() => dl.download(`${server.baseUrl}/loop`, { timeoutMs: 1500 }), /zu viele Weiterleitungen/));
  },
  'http außerhalb von Loopback ist abgelehnt, mit Freigabe erlaubt': async (mod) => {
    const dl = await loadSibling(mod, 'lib/download.mjs');
    const rejectedHttp = await throws(async () => dl.checkUrl('http://example.com/x'), /unverschlüsselt/);
    return rejectedHttp && dl.checkUrl('http://example.com/x', { allowInsecureHttp: true }).protocol === 'http:' && dl.checkUrl('http://127.0.0.1:1/x').protocol === 'http:';
  },
  'Sperre: ein zweiter Lauf wird abgelehnt': async (mod) => {
    const fsu = await loadSibling(mod, 'lib/fsutil.mjs');
    const dir = `${root}/lk-${counter++}`;
    const release = await fsu.acquireLock(dir, '.l', 'portal-sync');
    const second = await throws(() => fsu.acquireLock(dir, '.l', 'portal-sync'), /Ein anderer Lauf/);
    await release();
    return second;
  },
  'Sperre: eine gerade angelegte (leere) Sperre gilt als belegt': async (mod) => {
    const fsu = await loadSibling(mod, 'lib/fsutil.mjs');
    const dir = `${root}/lk-${counter++}`;
    await mkdir(dir, { recursive: true });
    await writeFile(`${dir}/.l`, '');
    return throws(() => fsu.acquireLock(dir, '.l', 'portal-sync'), /Ein anderer Lauf/);
  },
  'Rollback: scheitert das Einsetzen, kommt das alte Ziel zurück': async (mod) => {
    await mkdir(`${project}/_site/dss`, { recursive: true });
    await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
    await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
    await mod.replaceDir(`${project}/_site/dss`, project, async (tmp: string) => writeFile(`${tmp}/neu.js`, 'n'), { beforeInstall: (tmp: string) => rm(tmp, { recursive: true, force: true }) }).catch(() => {});
    return readFile(`${project}/_site/hoops/alt.js`, 'utf8').then((t) => t === 'alt', () => false);
  },
  'Startprüfung: zu altes Node wird abgelehnt': async (mod) => {
    const rt = await loadSibling(mod, 'lib/runtime.mjs');
    return (await throws(async () => rt.assertNode('x', '16.1.0'), /zu alt/)) && !(await throws(async () => rt.assertNode('x', '18.0.0'), /./));
  },
  'Fehlertext: ENOENT auf Deutsch': async (mod) => {
    const er = await loadSibling(mod, 'lib/errors.mjs');
    return /Datei oder Ordner nicht gefunden \(\/a\)/.test(er.describeError(Object.assign(new Error('x'), { code: 'ENOENT', path: '/a' }), { name: 'portal-sync' }));
  },
  'fonts kommen nur auf Verlangen mit': async (mod) => {
    await serveFake('fonts');
    await run(mod);
    return !existsSync(`${project}/_site/hoops/fonts`) && existsSync(`${project}/_site/hoops/hoops.js`);
  },
};

type Mutation = { name: string; rule: string; from: string; to: string; target?: Target };
const MUTATIONS: Mutation[] = [
  { name: 'Tarball-Hash nicht verglichen', rule: 'Tarball-Prüfsumme wird geprüft', from: 'if (sha256(tgz) !== expected) throw', to: 'if (false) throw' },
  { name: 'Dateihash nicht verglichen', rule: 'Prüfsumme jeder Datei wird geprüft', from: 'if (want !== sha256(file.data)) throw', to: 'if (false) throw' },
  { name: 'Dateiliste nicht verglichen', rule: 'Prüfsummen-Datei und Archiv nennen dieselben Dateien', from: 'if (listed.length !== files.length) throw', to: 'if (false) throw' },
  { name: 'Version nicht verglichen', rule: 'Version in version.json muss zur verlangten passen', from: 'if (!parsed || parsed.version !== version || parsed.name !== PACKAGE) {', to: 'if (!parsed) {' },
  { name: 'Name nicht verglichen', rule: 'Version in version.json muss zur verlangten passen', from: 'parsed.version !== version || parsed.name !== PACKAGE', to: 'parsed.version === version + "x"' },
  { name: 'Ordnername nicht verglichen', rule: 'oberster Ordner muss hoops-ui-<version> heißen', from: 'if (expectedTop !== undefined && top !== expectedTop) throw', to: 'if (false) throw' },
  { name: '.. erlaubt', rule: 'Pfade mit .. sind verboten', from: "s === '..' || ", to: '' },
  { name: 'Rückwärtsstrich erlaubt', rule: 'Pfade mit Rückwärtsstrich (Windows) sind verboten', from: "name.includes('\\\\') || ", to: '' },
  { name: 'Verknüpfungen erlaubt', rule: 'Verknüpfungen und Geräte sind verboten', from: "if (type !== '0') throw", to: 'if (false) throw' },
  { name: 'Doppelte erlaubt', rule: 'doppelte Einträge sind verboten', from: 'if (seen.has(name)) throw', to: 'if (false) throw' },
  { name: 'Marker nicht verlangt', rule: 'ein Ziel ohne Marker wird nie gelöscht', from: 'if (entries.length && !entries.includes(MARKER)) {', to: 'if (false) {' },
  { name: 'Versionsmuster entfällt', rule: 'ungültige Version wird vor der Anfrage abgelehnt', from: '!VERSION_PATTERN.test(version)', to: 'false' },
  { name: 'Größengrenze 32 MiB → 3200 MiB', rule: 'übergroße Downloads werden abgelehnt', target: 'download', from: 'export const MAX_DOWNLOAD_BYTES = 32 * 1024 * 1024;', to: 'export const MAX_DOWNLOAD_BYTES = 3200 * 1024 * 1024;' },
  { name: 'Größengrenze 32 MiB → 3200 MiB (Strom)', rule: 'Stream: Übergröße ohne Content-Length bricht ab', target: 'download', from: 'export const MAX_DOWNLOAD_BYTES = 32 * 1024 * 1024;', to: 'export const MAX_DOWNLOAD_BYTES = 3200 * 1024 * 1024;' },
  { name: 'Zählung des Stroms entfällt', rule: 'Stream: Übergröße ohne Content-Length bricht ab', target: 'download', from: 'if (received > maxBytes) {', to: 'if (false) {' },
  { name: 'Leerlauf-Grenze entfällt', rule: 'Leerlauf-Grenze: ein hängender Server wird abgebrochen', target: 'download', from: 'kommen keine Daten`), idleMs);', to: 'kommen keine Daten`), 3600000);' },
  { name: 'Gesamtzeit-Grenze entfällt', rule: 'Gesamtzeit-Grenze: tröpfelnde Daten werden abgebrochen', target: 'download', from: 'länger als ${fmt(timeoutMs)}`), timeoutMs);', to: 'länger als ${fmt(timeoutMs)}`), 3600000);' },
  { name: 'Weiterleitung auf Loopback beliebig', rule: 'Weiterleitung: gleicher Ursprung ja, anderer Port nein', target: 'download', from: 'if (isLoopback(from.hostname)) return to.origin === from.origin;', to: 'if (isLoopback(from.hostname)) return true;' },
  { name: 'Weiterleitung nach http erlaubt', rule: 'Weiterleitung: nie von https nach http, nie von http außerhalb Loopback', target: 'download', from: "if (to.protocol !== 'https:') return false;", to: '' },
  { name: 'GitHub-Weiterleitung auf jeden Host', rule: 'Weiterleitung: GitHub nur auf githubusercontent.com', target: 'download', from: "to.hostname.endsWith('.githubusercontent.com')", to: 'true' },
  { name: 'Weiterleitungsgrenze entfällt', rule: 'Weiterleitungsschleife endet', target: 'download', from: 'if (hops >= MAX_REDIRECTS) throw', to: 'if (false) throw' },
  { name: 'http überall erlaubt', rule: 'http außerhalb von Loopback ist abgelehnt, mit Freigabe erlaubt', target: 'download', from: "if (url.protocol === 'http:' && (isLoopback(url.hostname) || allowInsecureHttp)) return url;", to: "if (url.protocol === 'http:') return url;" },
  { name: 'Sperre wird ignoriert', rule: 'Sperre: ein zweiter Lauf wird abgelehnt', target: 'fs', from: 'if ((Number.isFinite(pid) && alive(pid)) || young) {', to: 'if (false) {' },
  { name: 'junge Sperre gilt als verwaist', rule: 'Sperre: eine gerade angelegte (leere) Sperre gilt als belegt', target: 'fs', from: '< 5000;', to: '< -1000000;' },
  { name: 'Rollback entfällt', rule: 'Rollback: scheitert das Einsetzen, kommt das alte Ziel zurück', from: 'if (moved && !(await exists(dest))) await rename(old, dest).catch(() => {});', to: '' },
  { name: 'Node-Prüfung entfällt', rule: 'Startprüfung: zu altes Node wird abgelehnt', target: 'runtime', from: 'if (!Number.isFinite(major) || major < MIN_NODE_MAJOR) {', to: 'if (false) {' },
  { name: 'ENOENT bleibt englisch', rule: 'Fehlertext: ENOENT auf Deutsch', target: 'errors', from: 'Datei oder Ordner nicht gefunden', to: 'File or directory not found' },
  { name: 'fonts immer', rule: 'fonts kommen nur auf Verlangen mit', from: "(path) => !(path === join(src.distDir, 'fonts') || path === join(src.distDir, 'version.json'))", to: '() => true' },
];

describe('portal-sync --from-release: Mutationen', () => {
  it('der unverfälschte Quelltext erfüllt alle Regeln', async () => {
    const mod = await loadScript(SOURCE, 'portal-sync.mjs');
    for (const [name, rule] of Object.entries(RULES)) {
      await mkdir(`${project}/_site/dss`, { recursive: true });
      await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
      await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
      routes.clear();
      expect(await rule(mod), name).toBe(true);
    }
  });
  for (const m of MUTATIONS) {
    it(`${m.name} → Regel „${m.rule}“ kippt`, async () => {
      const target: Target = m.target ?? (LIBS.tar.includes(m.from) ? 'tar' : 'sync');
      const mod = await loadWith(target, mutate(TEXT[target], m.from, m.to));
      expect(await RULES[m.rule](mod).catch(() => false)).toBe(false);
    });
  }
});
