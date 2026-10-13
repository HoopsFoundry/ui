// @vitest-environment node
// Mutationstests von portal-sync --from-release: Jede Schutzregel (Prüfsumme, Version, Archivinhalt, Zielschutz) muss kippen, wenn der Quelltext
// von stories/examples/portal-sync.mjs gezielt verfälscht wird.
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { mutate, read } from './helpers/mutation';
import { loadScript, tmpRoot, writeFakeRelease } from './helpers/release-fixture';
import { startServer, type Route } from './helpers/release-server';

const SOURCE = read('stories/examples/portal-sync.mjs');
const V = '0.9.0';
const FILES = { 'dss.js': 'a', 'dss.css': 'b', 'fonts/fonts.css': 'f', 'version.json': JSON.stringify({ name: '@bbv/dss-design-system', version: V }) + '\n' };
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
  await server.close();
  await rm(root, { recursive: true, force: true });
});
beforeEach(async () => {
  routes.clear();
  await rm(project, { recursive: true, force: true });
  await mkdir(`${project}/_site/dss`, { recursive: true });
  await writeFile(`${project}/_site/dss/alt.js`, 'alt');
  await writeFile(`${project}/_site/dss/.dss-sync`, '');
});

const serveFake = async (name: string, files: Record<string, string> = FILES, options: { top?: string; version?: string } = {}) => {
  const version = options.version ?? V;
  const fake = await writeFakeRelease(`${root}/rel-${name}`, version, files, { top: options.top });
  routes.set(`/v${version}/dss-vanilla-${version}.tgz`, { body: fake.tgz });
  routes.set(`/v${version}/dss-vanilla-${version}.sha256`, { body: fake.sums });
  return fake;
};
const run = (mod: any, extra: Record<string, unknown> = {}, version = V) =>
  mod.syncDss({ root: project, source: { type: 'release', version, baseUrl: server.baseUrl }, ...extra });
/** Wahr, wenn der Lauf mit einer passenden Meldung scheitert und das Ziel unverändert ist. */
const rejected = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (error) {
    const unchanged = (await readFile(`${project}/_site/dss/alt.js`, 'utf8').catch(() => '')) === 'alt';
    return pattern.test(String((error as Error).message)) && unchanged;
  }
};

const RULES: Record<string, (mod: any) => Promise<boolean>> = {
  'Tarball-Prüfsumme wird geprüft': async (mod) => {
    const fake = await serveFake('tgz');
    routes.set(`/v${V}/dss-vanilla-${V}.tgz`, { body: Buffer.concat([fake.tgz.subarray(0, -1), Buffer.from([fake.tgz.at(-1)! ^ 1])]) });
    return rejected(() => run(mod), /Prüfsumme|kein gültiges|beschädigt/) && (await rejected(() => run(mod), /Prüfsumme von/));
  },
  'Prüfsumme jeder Datei wird geprüft': async (mod) => {
    const fake = await serveFake('datei');
    routes.set(`/v${V}/dss-vanilla-${V}.sha256`, { body: fake.sums.replace(sha('a'), sha('x')) });
    return rejected(() => run(mod), /Datei dss\.js stimmt nicht/);
  },
  'Prüfsummen-Datei und Archiv nennen dieselben Dateien': async (mod) => {
    const fake = await serveFake('liste');
    routes.set(`/v${V}/dss-vanilla-${V}.sha256`, { body: `${fake.sums}${sha('x')}  dss-vanilla-${V}/extra.js\n` });
    return rejected(() => run(mod), /nicht dieselben Dateien/);
  },
  'Version in version.json muss zur verlangten passen': async (mod) => {
    await serveFake('version', { ...FILES, 'version.json': JSON.stringify({ name: '@bbv/dss-design-system', version: '0.1.0' }) });
    return rejected(() => run(mod), /version\.json im Archiv nennt/);
  },
  'oberster Ordner muss dss-vanilla-<version> heißen': async (mod) => {
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
    routes.set(`/v${V}/dss-vanilla-${V}.tgz`, { body: tgz });
    routes.set(`/v${V}/dss-vanilla-${V}.sha256`, { body: fake.sums.replace(sha(fake.tgz), sha(tgz)) });
    return rejected(() => run(mod), /Eintragstyp|Prüfsumme/) && (await rejected(() => run(mod), /Eintragstyp/));
  },
  'doppelte Einträge sind verboten': async (mod) => {
    const { createTar } = await import(/* @vite-ignore */ '../scripts/release-vanilla.mjs');
    const { gzipSync } = await import('node:zlib');
    const entries = [{ path: `dss-vanilla-${V}/dss.js`, data: Buffer.from('a') }, { path: `dss-vanilla-${V}/dss.js`, data: Buffer.from('b') }];
    const tgz = gzipSync(createTar(entries));
    routes.set(`/v${V}/dss-vanilla-${V}.tgz`, { body: tgz });
    routes.set(`/v${V}/dss-vanilla-${V}.sha256`, { body: `${sha(tgz)}  dss-vanilla-${V}.tgz\n${sha('a')}  dss-vanilla-${V}/dss.js\n` });
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
    routes.set(`/v${V}/dss-vanilla-${V}.tgz`, { body: 'x', declared: 40 * 1024 * 1024, abort: true });
    routes.set(`/v${V}/dss-vanilla-${V}.sha256`, { body: '' });
    return rejected(() => run(mod), /größer als/);
  },
  'fonts kommen nur auf Verlangen mit': async (mod) => {
    await serveFake('fonts');
    await run(mod);
    return !existsSync(`${project}/_site/dss/fonts`) && existsSync(`${project}/_site/dss/dss.js`);
  },
};

type Mutation = { name: string; rule: string; from: string; to: string };
const MUTATIONS: Mutation[] = [
  { name: 'Tarball-Hash nicht verglichen', rule: 'Tarball-Prüfsumme wird geprüft', from: 'if (sha256(tgz) !== expected) throw', to: 'if (false) throw' },
  { name: 'Dateihash nicht verglichen', rule: 'Prüfsumme jeder Datei wird geprüft', from: 'if (want !== sha256(file.data)) throw', to: 'if (false) throw' },
  { name: 'Dateiliste nicht verglichen', rule: 'Prüfsummen-Datei und Archiv nennen dieselben Dateien', from: 'if (listed.length !== files.length) throw', to: 'if (false) throw' },
  { name: 'Version nicht verglichen', rule: 'Version in version.json muss zur verlangten passen', from: 'if (!parsed || parsed.version !== version || parsed.name !== PACKAGE) {', to: 'if (!parsed) {' },
  { name: 'Name nicht verglichen', rule: 'Version in version.json muss zur verlangten passen', from: 'parsed.version !== version || parsed.name !== PACKAGE', to: 'parsed.version === version + "x"' },
  { name: 'Ordnername nicht verglichen', rule: 'oberster Ordner muss dss-vanilla-<version> heißen', from: 'if (expectedTop !== undefined && top !== expectedTop) throw', to: 'if (false) throw' },
  { name: '.. erlaubt', rule: 'Pfade mit .. sind verboten', from: "s === '..' || ", to: '' },
  { name: 'Rückwärtsstrich erlaubt', rule: 'Pfade mit Rückwärtsstrich (Windows) sind verboten', from: "name.includes('\\\\') || ", to: '' },
  { name: 'Verknüpfungen erlaubt', rule: 'Verknüpfungen und Geräte sind verboten', from: "if (type !== '0') throw", to: 'if (false) throw' },
  { name: 'Doppelte erlaubt', rule: 'doppelte Einträge sind verboten', from: 'if (seen.has(name)) throw', to: 'if (false) throw' },
  { name: 'Marker nicht verlangt', rule: 'ein Ziel ohne Marker wird nie gelöscht', from: 'if (entries.length && !entries.includes(MARKER)) {', to: 'if (false) {' },
  { name: 'Versionsmuster entfällt', rule: 'ungültige Version wird vor der Anfrage abgelehnt', from: '!VERSION_PATTERN.test(version)', to: 'false' },
  { name: 'Größengrenze entfällt', rule: 'übergroße Downloads werden abgelehnt', from: 'const MAX_TGZ_BYTES = 32 * 1024 * 1024;', to: 'const MAX_TGZ_BYTES = 32 * 1024 * 1024 * 1024;' },
  { name: 'fonts immer', rule: 'fonts kommen nur auf Verlangen mit', from: "filter: (path) => !(path === join(src.distDir, 'fonts') || path === join(src.distDir, 'version.json'))", to: 'filter: () => true' },
];

describe('portal-sync --from-release: Mutationen', () => {
  it('der unverfälschte Quelltext erfüllt alle Regeln', async () => {
    const mod = await loadScript(SOURCE);
    for (const [name, rule] of Object.entries(RULES)) {
      await mkdir(`${project}/_site/dss`, { recursive: true });
      await writeFile(`${project}/_site/dss/alt.js`, 'alt');
      await writeFile(`${project}/_site/dss/.dss-sync`, '');
      routes.clear();
      expect(await rule(mod), name).toBe(true);
    }
  });
  for (const m of MUTATIONS) {
    it(`${m.name} → Regel „${m.rule}“ kippt`, async () => {
      const mod = await loadScript(mutate(SOURCE, m.from, m.to));
      expect(await RULES[m.rule](mod).catch(() => false)).toBe(false);
    });
  }
});
