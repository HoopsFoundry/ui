// @vitest-environment node
// Mutationstests des Release-Ablaufs: Jede Regel muss kippen, wenn der Quelltext von scripts/release-vanilla.mjs gezielt verfälscht wird.
import { createHash } from 'node:crypto';
import { readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bundleDir } from './helpers/bundle-dir';
import { mutate, read } from './helpers/mutation';
// @ts-expect-error reines ES-Modul ohne Typen
import { readTgz } from '../stories/examples/portal-sync.mjs';
import { copyBundle, loadScript, tmpRoot } from './helpers/release-fixture';

const pkg = JSON.parse(read('package.json'));
const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');
const SOURCE = read('scripts/release-vanilla.mjs');
const root = `${tmpRoot}-mut`;
let counter = 0;
const outName = () => `${root}/out-${counter++}`;

beforeAll(async () => {
  await rm(root, { recursive: true, force: true });
  await mkdir(root, { recursive: true });
});
afterAll(() => rm(root, { recursive: true, force: true }));

/** Wahr, wenn der Aufruf wirft (und die Meldung zum Muster passt). */
const throws = async (fn: () => Promise<unknown>, pattern: RegExp) => {
  try {
    await fn();
    return false;
  } catch (error) {
    return pattern.test(String((error as Error).message));
  }
};

const RULES: Record<string, (mod: any) => Promise<boolean>> = {
  'Version: package.json wird mit den Bündeln verglichen': async (mod) => {
    const fake = `${root}/pkg-root`;
    await mkdir(fake, { recursive: true });
    await writeFile(`${fake}/package.json`, JSON.stringify({ ...pkg, version: '0.0.1' }));
    return throws(() => mod.checkVersions({ root: fake, bundleDir }), /package\.json 0\.0\.1|0\.9\.0/);
  },
  'Version: dss.css wird geprüft': async (mod) => {
    const dir = await copyBundle(`m-css-${counter++}`);
    await writeFile(`${dir}/dss.css`, (await readFile(`${dir}/dss.css`, 'utf8')).replace(`"${pkg.version}"`, '"0.0.1"'));
    return throws(() => mod.checkVersions({ bundleDir: dir }), /dss\.css 0\.0\.1/);
  },
  'Version: jede Bündeldatei wird geprüft': async (mod) => {
    const dir = await copyBundle(`m-js-${counter++}`);
    const text = await readFile(`${dir}/dss-map.min.js`, 'utf8');
    await writeFile(`${dir}/dss-map.min.js`, text.replace(`"${pkg.version}"`, '"0.0.1"'));
    return throws(() => mod.checkVersions({ bundleDir: dir }), /dss-map\.min\.js 0\.0\.1/);
  },
  'Version: --expect-version (Tag) wird geprüft': (mod) => throws(() => mod.checkVersions({ bundleDir, expect: '9.9.9' }), /expect-version/),
  'Arbeitsbaum: schmutzig bricht ab': (mod) =>
    throws(() => mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, gitStatus: async () => ' M x\n' }), /nicht sauber/),
  'Probelauf schreibt nichts': async (mod) => {
    const out = outName();
    await mod.releaseVanilla({ bundleDir, outDir: out, build: false, allowDirty: true, dryRun: true });
    return !(await readFile(`${out}/manifest.json`).then(() => true, () => false));
  },
  'Prüfsumme: die erste Zeile gehört dem Tarball': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    return r.sums.split('\n')[0] === `${sha(r.tgz)}  dss-vanilla-${pkg.version}.tgz`;
  },
  'Prüfsumme: jede Datei hat eine Zeile mit ihrem Hash': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    const lines = r.sums.trim().split('\n');
    const files = readTgz(r.tgz) as { path: string; data: Buffer }[];
    return lines.length === r.files.length + 1 && files.every((f) => lines.includes(`${sha(f.data)}  dss-vanilla-${pkg.version}/${f.path}`));
  },
  'Manifest: Budgets stammen aus vanilla-budgets': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    return r.manifest.bundles.dss.budget.minBytes === 40 * 1024 && r.manifest.bundles['dss-map'].budget.gzipBytes === 10 * 1024;
  },
  'Manifest: Abhängigkeit des Render-Bündels aus den Importen': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    return JSON.stringify(r.manifest.bundles['dss-render'].requires) === '["dss"]' && r.manifest.bundles.dss.requires.length === 0;
  },
  'Manifest: Größen aus der minifizierten Datei, gzip Stufe 9': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    const min = await readFile(`${bundleDir}dss.min.js`);
    return r.manifest.bundles.dss.minBytes === min.length && r.manifest.bundles.dss.minKiB === Math.round((min.length / 1024) * 10) / 10;
  },
  'Manifest: Leaflet ist optional und trägt den Bereich aus package.json': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    return r.manifest.leaflet.required === false && r.manifest.leaflet.range === pkg.peerDependencies.leaflet;
  },
  'Quellkarten: sourcemaps false lässt .map weg': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true, sourcemaps: false });
    return r.files.every((f: string) => !f.endsWith('.map'));
  },
  'Tarball: Dateien liegen unter dss-vanilla-<version>': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    return r.files.every((f: string) => f.startsWith(`dss-vanilla-${pkg.version}/`)) && r.files.includes(`dss-vanilla-${pkg.version}/version.json`);
  },
  'Tarball: Reihenfolge ist sortiert (reproduzierbar)': async (mod) => {
    const r = await mod.releaseVanilla({ bundleDir, outDir: outName(), build: false, allowDirty: true });
    return JSON.stringify(r.files) === JSON.stringify([...r.files].sort());
  },
  'Aufräumen: bei einem Fehler bleibt der alte Ausgabeordner unverändert': async (mod) => {
    const out = outName();
    await mkdir(out, { recursive: true });
    await writeFile(`${out}/alt.txt`, 'alt');
    const bad = await copyBundle(`m-bad-${counter++}`);
    await rm(`${bad}/dss.css`);
    await mod.releaseVanilla({ bundleDir: bad, outDir: out, build: false, allowDirty: true }).catch(() => {});
    return readFile(`${out}/alt.txt`, 'utf8').then((t) => t === 'alt', () => false);
  },
};

type Mutation = { name: string; rule: string; from: string; to: string; after?: string };
const MUTATIONS: Mutation[] = [
  { name: 'package.json nicht verglichen', rule: 'Version: package.json wird mit den Bündeln verglichen', from: "const wrong = Object.entries(found).filter(([, v]) => v !== pkg.version);", to: "const wrong = Object.entries(found).filter(([k, v]) => k !== 'package.json' && v !== found['dss.js']);" },
  { name: 'CSS-Version aus package.json', rule: 'Version: dss.css wird geprüft', from: "'dss.css': cssVersion };", to: "'dss.css': pkg.version };" },
  { name: 'nur dss.js geprüft', rule: 'Version: jede Bündeldatei wird geprüft', from: 'for (const file of BUNDLE_FILES) {', to: "for (const file of BUNDLE_FILES.slice(0, 1)) {" },
  { name: 'expect ignoriert', rule: 'Version: --expect-version (Tag) wird geprüft', from: 'if (expect !== undefined && expect !== pkg.version)', to: 'if (false)' },
  { name: 'sauberer Baum nicht verlangt', rule: 'Arbeitsbaum: schmutzig bricht ab', from: 'if (status.trim()) throw', to: 'if (false) throw' },
  { name: 'Probelauf schreibt trotzdem', rule: 'Probelauf schreibt nichts', from: 'if (!dryRun) {', to: 'if (true) {' },
  { name: 'Tarball-Hash fehlt', rule: 'Prüfsumme: die erste Zeile gehört dem Tarball', from: "const sums = [`${sha256(tgz)}  ${tgzName}`, ...files", to: "const sums = [`${sha256(Buffer.from('x'))}  ${tgzName}`, ...files" },
  { name: 'Dateizeilen fehlen', rule: 'Prüfsumme: jede Datei hat eine Zeile mit ihrem Hash', from: "...files.map((f) => `${sha256(f.data)}  ${f.path}`)", to: "...files.slice(1).map((f) => `${sha256(f.data)}  ${f.path}`)" },
  { name: 'falscher Hash je Datei', rule: 'Prüfsumme: jede Datei hat eine Zeile mit ihrem Hash', from: "...files.map((f) => `${sha256(f.data)}  ${f.path}`)", to: "...files.map((f) => `${sha256(f.path)}  ${f.path}`)" },
  { name: 'Budget nicht aus der Datei', rule: 'Manifest: Budgets stammen aus vanilla-budgets', from: 'budget: { minBytes: budget.minBytes, gzipBytes: budget.gzipBytes,', to: 'budget: { minBytes: budget.minBytes + 1, gzipBytes: budget.gzipBytes,' },
  { name: 'Abhängigkeiten leer', rule: 'Manifest: Abhängigkeit des Render-Bündels aus den Importen', from: 'const requires = importsOf(min.toString(\'utf8\'))', to: 'const requires = [].concat(importsOf(\'\'))' },
  { name: 'Größe aus der Quelldatei', rule: 'Manifest: Größen aus der minifizierten Datei, gzip Stufe 9', from: "const min = await readFile(join(bundleDir, budget.file));", to: "const min = await readFile(join(bundleDir, budget.file.replace('.min', '')));" },
  { name: 'Leaflet als Pflicht', rule: 'Manifest: Leaflet ist optional und trägt den Bereich aus package.json', from: 'required: false,', to: 'required: true,' },
  { name: 'Leaflet-Bereich fest', rule: 'Manifest: Leaflet ist optional und trägt den Bereich aus package.json', from: 'range: leafletRange,', to: "range: '^1.0.0'," },
  { name: 'Quellkarten bleiben', rule: 'Quellkarten: sourcemaps false lässt .map weg', from: "(await listFiles(bundleDir)).filter((n) => sourcemaps || !n.endsWith('.map'))", to: '(await listFiles(bundleDir))' },
  { name: 'ohne Ordner im Tarball', rule: 'Tarball: Dateien liegen unter dss-vanilla-<version>', from: "files.push({ path: `${prefix}/version.json`,", to: "files.push({ path: `version.json`," },
  { name: 'Reihenfolge unsortiert', rule: 'Tarball: Reihenfolge ist sortiert (reproduzierbar)', from: 'files.sort((a, b) => (a.path < b.path ? -1 : 1));', to: 'files.reverse();' },
  { name: 'Ausgabeordner vorab geleert', rule: 'Aufräumen: bei einem Fehler bleibt der alte Ausgabeordner unverändert', from: 'const steps = [];', to: 'const steps = [];\n  await rm(outDir, { recursive: true, force: true });' },
];

describe('Release-Ablauf: Mutationen', () => {
  it('der unverfälschte Quelltext erfüllt alle Regeln', async () => {
    const mod = await loadScript(SOURCE);
    for (const [name, rule] of Object.entries(RULES)) expect(await rule(mod), name).toBe(true);
  });
  for (const m of MUTATIONS) {
    it(`${m.name} → Regel „${m.rule}“ kippt`, async () => {
      const mod = await loadScript(mutate(SOURCE, m.from, m.to, m.after ? SOURCE.indexOf(m.after) : 0));
      expect(await RULES[m.rule](mod).catch(() => false)).toBe(false);
    });
  }
  it('Gegenprobe (verify): ein inhaltlich beschädigter Tarball wird erkannt, ohne die Prüfung nicht', async () => {
    const corrupt = mutate(SOURCE, 'blocks.push(header, data,', 'blocks.push(header, Buffer.alloc(data.length),');
    const args = { bundleDir, build: false, allowDirty: true };
    const base = await loadScript(corrupt);
    await expect(base.releaseVanilla({ ...args, outDir: outName() })).rejects.toThrow(/stimmt beim Zurücklesen nicht/);
    const off = await loadScript(mutate(corrupt, 'if (!same) throw', 'if (false) throw'));
    await expect(off.releaseVanilla({ ...args, outDir: outName() })).resolves.toBeTruthy();
  });
  it('die Schritte tragen die dokumentierte Reihenfolge (Mutation: build nach version)', async () => {
    const swapped = mutate(SOURCE, "export const STEPS = ['clean', 'version', 'build', 'pack', 'verify'];", "export const STEPS = ['clean', 'build', 'version', 'pack', 'verify'];");
    const mod = await loadScript(swapped);
    expect(mod.STEPS).not.toEqual(['clean', 'version', 'build', 'pack', 'verify']);
    const result = await (await loadScript(SOURCE)).releaseVanilla({ bundleDir, outDir: outName(), allowDirty: true, build: async () => {} });
    expect(result.steps).toEqual(['build', 'version', 'pack', 'verify']);
  });
});
