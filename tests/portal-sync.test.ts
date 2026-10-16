// @vitest-environment node
// Das Beispiel scripts/portal-sync.mjs kopiert dist/vanilla (und optional Schriften, Leaflet) aus node_modules nach _site/dss.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { syncHoops } from '../scripts/portal-sync.mjs';
import { bundleDir } from './helpers/bundle-dir';

const project = resolve(process.cwd(), 'tests/.portal-tmp');
beforeAll(async () => {
  await rm(project, { recursive: true, force: true });
  const pkgDir = `${project}/node_modules/@hoopsfoundry/ui`;
  await mkdir(`${pkgDir}/fonts`, { recursive: true });
  await mkdir(`${project}/node_modules/leaflet/dist`, { recursive: true });
  await cp(bundleDir, `${pkgDir}/dist/vanilla`, { recursive: true });
  await writeFile(`${pkgDir}/package.json`, JSON.stringify({ name: '@hoopsfoundry/ui', version: '9.9.9' }));
  await writeFile(`${pkgDir}/fonts/fonts.css`, '/* f */');
  await writeFile(`${project}/node_modules/leaflet/dist/leaflet.js`, '//l');
  await mkdir(`${project}/_site/dss`, { recursive: true });
  await writeFile(`${project}/_site/hoops/alt.js`, 'alt');
  await writeFile(`${project}/_site/hoops/.hoops-sync`, '');
});
afterAll(() => rm(project, { recursive: true, force: true }));

describe('portal-sync.mjs', () => {
  it('kopiert dist/vanilla nach _site/dss, ersetzt Altes und schreibt version.json', async () => {
    const version = await syncHoops({ root: project });
    expect(version).toEqual({ version: '9.9.9', leaflet: false });
    for (const name of ['hoops.js', 'hoops.min.js', 'hoops.css', 'hoops.d.ts', 'hoops.min.js.map', 'courtlines/court.svg']) expect(existsSync(`${project}/_site/hoops/${name}`), name).toBe(true);
    expect(existsSync(`${project}/_site/hoops/alt.js`)).toBe(false);
    expect(existsSync(`${project}/_site/hoops/.hoops-sync`)).toBe(true);
    expect(JSON.parse(await readFile(`${project}/_site/hoops/version.json`, 'utf8'))).toEqual({ name: '@hoopsfoundry/ui', version: '9.9.9' });
    expect(existsSync(`${project}/_site/hoops/fonts`)).toBe(false);
    expect(existsSync(`${project}/_site/vendor`)).toBe(false);
  });
  it('mit fonts und leaflet kommen auch Schriften und Leaflet mit (nach _site/vendor/leaflet)', async () => {
    await syncHoops({ root: project, fonts: true, leaflet: true });
    expect(existsSync(`${project}/_site/hoops/fonts/fonts.css`)).toBe(true);
    expect(existsSync(`${project}/_site/vendor/leaflet/leaflet.js`)).toBe(true);
  });
  it('ein Zielordner außerhalb ist möglich; ohne installiertes Paket gibt es einen klaren Fehler', async () => {
    await syncHoops({ root: project, to: `${project}/out/dss` });
    expect(existsSync(`${project}/out/hoops/hoops.js`)).toBe(true);
    await expect(syncHoops({ root: `${project}/leer` })).rejects.toThrow();
  });
  it('ein nicht leeres Ziel ohne Marker .hoops-sync wird nie gelöscht', async () => {
    await mkdir(`${project}/fremd`, { recursive: true });
    await writeFile(`${project}/fremd/wichtig.txt`, 'x');
    await expect(syncHoops({ root: project, to: `${project}/fremd` })).rejects.toThrow(/Marker-Datei/);
    expect(existsSync(`${project}/fremd/wichtig.txt`)).toBe(true);
  });
  it('Projekt-Root, Elternordner und node_modules sind als Ziel verboten', async () => {
    for (const to of [project, resolve(project, '..'), `${project}/node_modules`, `${project}/node_modules/leaflet`]) {
      await expect(syncHoops({ root: project, to })).rejects.toThrow(/nicht erlaubt/);
    }
    expect(existsSync(`${project}/node_modules/@hoopsfoundry/ui/package.json`)).toBe(true);
  });
  it('schlägt das Kopieren fehl (fonts fehlen), bleibt das alte Ziel vollständig, kein temporärer Ordner bleibt', async () => {
    await syncHoops({ root: project });
    await rm(`${project}/node_modules/@hoopsfoundry/ui/fonts`, { recursive: true, force: true });
    await expect(syncHoops({ root: project, fonts: true })).rejects.toThrow();
    expect(existsSync(`${project}/_site/hoops/hoops.js`)).toBe(true);
    expect(existsSync(`${project}/_site/hoops/version.json`)).toBe(true);
    expect((await readdir(`${project}/_site`)).filter((n) => n.includes('.tmp-'))).toEqual([]);
  });
  it('leaflet: true ohne installiertes Leaflet wirft, auto lässt es aus', async () => {
    await rm(`${project}/node_modules/leaflet`, { recursive: true, force: true });
    await expect(syncHoops({ root: project, leaflet: true })).rejects.toThrow(/leaflet/);
    const result = await syncHoops({ root: project, leaflet: 'auto' });
    expect(result.leaflet).toBe(false);
  });
  it('version.json steht im Ziel, bevor es das Ziel gibt (Marker und Dateien kommen mit dem Umbenennen)', async () => {
    const out = `${project}/neu/dss`;
    await syncHoops({ root: project, to: out });
    expect(existsSync(`${out}/version.json`)).toBe(true);
    expect(existsSync(`${out}/.hoops-sync`)).toBe(true);
  });
  it('Direktaufruf im leeren Projekt ohne Leaflet: kopiert, setzt keinen Fehlercode', async () => {
    const empty = resolve(process.cwd(), 'tests/.portal-direct-tmp');
    await rm(empty, { recursive: true, force: true });
    await mkdir(`${empty}/node_modules/@hoopsfoundry/ui/fonts`, { recursive: true });
    await cp(bundleDir, `${empty}/node_modules/@hoopsfoundry/ui/dist/vanilla`, { recursive: true });
    await writeFile(`${empty}/node_modules/@hoopsfoundry/ui/package.json`, JSON.stringify({ name: '@hoopsfoundry/ui', version: '1.2.3' }));
    const script = resolve(process.cwd(), 'scripts/portal-sync.mjs');
    const cwd = process.cwd();
    const argv1 = process.argv[1];
    const exitCode = process.exitCode;
    try {
      process.chdir(empty);
      process.argv[1] = script;
      await import(/* @vite-ignore */ `${pathToFileURL(script).href}?direkt=${Date.now()}`);
      expect(process.exitCode).toBe(exitCode);
      expect(existsSync(`${empty}/_site/hoops/hoops.js`)).toBe(true);
      expect(JSON.parse(await readFile(`${empty}/_site/hoops/version.json`, 'utf8')).version).toBe('1.2.3');
      expect(existsSync(`${empty}/_site/vendor`)).toBe(false);
    } finally {
      process.chdir(cwd);
      process.argv[1] = argv1;
      await rm(empty, { recursive: true, force: true });
    }
  });
  it('das Beispiel nennt kein Shell-Kommando und ändert nichts im Paket selbst', async () => {
    const code = await readFile(resolve(process.cwd(), 'scripts/portal-sync.mjs'), 'utf8');
    expect(code).not.toMatch(/child_process|execSync|spawn/);
  });
});
