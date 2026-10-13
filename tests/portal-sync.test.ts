// @vitest-environment node
// Das Beispiel stories/examples/portal-sync.mjs kopiert dist/vanilla (und optional Schriften, Leaflet) aus node_modules nach _site/dss.
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { syncDss } from '../stories/examples/portal-sync.mjs';
import { bundleDir } from './helpers/bundle-dir';

const project = resolve(process.cwd(), 'tests/.portal-tmp');
beforeAll(async () => {
  await rm(project, { recursive: true, force: true });
  const pkgDir = `${project}/node_modules/@bbv/dss-design-system`;
  await mkdir(`${pkgDir}/fonts`, { recursive: true });
  await mkdir(`${project}/node_modules/leaflet/dist`, { recursive: true });
  await cp(bundleDir, `${pkgDir}/dist/vanilla`, { recursive: true });
  await writeFile(`${pkgDir}/package.json`, JSON.stringify({ name: '@bbv/dss-design-system', version: '9.9.9' }));
  await writeFile(`${pkgDir}/fonts/fonts.css`, '/* f */');
  await writeFile(`${project}/node_modules/leaflet/dist/leaflet.js`, '//l');
  await mkdir(`${project}/_site/dss`, { recursive: true });
  await writeFile(`${project}/_site/dss/alt.js`, 'alt');
  await writeFile(`${project}/_site/dss/.dss-sync`, '');
});
afterAll(() => rm(project, { recursive: true, force: true }));

describe('portal-sync.mjs', () => {
  it('kopiert dist/vanilla nach _site/dss, ersetzt Altes und schreibt version.json', async () => {
    const version = await syncDss({ root: project });
    expect(version).toEqual({ version: '9.9.9', leaflet: false });
    for (const name of ['dss.js', 'dss.min.js', 'dss.css', 'dss.d.ts', 'dss.min.js.map', 'courtlines/court.svg']) expect(existsSync(`${project}/_site/dss/${name}`), name).toBe(true);
    expect(existsSync(`${project}/_site/dss/alt.js`)).toBe(false);
    expect(existsSync(`${project}/_site/dss/.dss-sync`)).toBe(true);
    expect(JSON.parse(await readFile(`${project}/_site/dss/version.json`, 'utf8'))).toEqual({ name: '@bbv/dss-design-system', version: '9.9.9' });
    expect(existsSync(`${project}/_site/dss/fonts`)).toBe(false);
    expect(existsSync(`${project}/_site/vendor`)).toBe(false);
  });
  it('mit fonts und leaflet kommen auch Schriften und Leaflet mit (nach _site/vendor/leaflet)', async () => {
    await syncDss({ root: project, fonts: true, leaflet: true });
    expect(existsSync(`${project}/_site/dss/fonts/fonts.css`)).toBe(true);
    expect(existsSync(`${project}/_site/vendor/leaflet/leaflet.js`)).toBe(true);
  });
  it('ein Zielordner außerhalb ist möglich; ohne installiertes Paket gibt es einen klaren Fehler', async () => {
    await syncDss({ root: project, to: `${project}/out/dss` });
    expect(existsSync(`${project}/out/dss/dss.js`)).toBe(true);
    await expect(syncDss({ root: `${project}/leer` })).rejects.toThrow();
  });
  it('ein nicht leeres Ziel ohne Marker .dss-sync wird nie gelöscht', async () => {
    await mkdir(`${project}/fremd`, { recursive: true });
    await writeFile(`${project}/fremd/wichtig.txt`, 'x');
    await expect(syncDss({ root: project, to: `${project}/fremd` })).rejects.toThrow(/Marker-Datei/);
    expect(existsSync(`${project}/fremd/wichtig.txt`)).toBe(true);
  });
  it('Projekt-Root, Elternordner und node_modules sind als Ziel verboten', async () => {
    for (const to of [project, resolve(project, '..'), `${project}/node_modules`, `${project}/node_modules/leaflet`]) {
      await expect(syncDss({ root: project, to })).rejects.toThrow(/nicht erlaubt/);
    }
    expect(existsSync(`${project}/node_modules/@bbv/dss-design-system/package.json`)).toBe(true);
  });
  it('schlägt das Kopieren fehl (fonts fehlen), bleibt das alte Ziel vollständig, kein temporärer Ordner bleibt', async () => {
    await syncDss({ root: project });
    await rm(`${project}/node_modules/@bbv/dss-design-system/fonts`, { recursive: true, force: true });
    await expect(syncDss({ root: project, fonts: true })).rejects.toThrow();
    expect(existsSync(`${project}/_site/dss/dss.js`)).toBe(true);
    expect(existsSync(`${project}/_site/dss/version.json`)).toBe(true);
    expect((await readdir(`${project}/_site`)).filter((n) => n.includes('.tmp-'))).toEqual([]);
  });
  it('leaflet: true ohne installiertes Leaflet wirft, auto lässt es aus', async () => {
    await rm(`${project}/node_modules/leaflet`, { recursive: true, force: true });
    await expect(syncDss({ root: project, leaflet: true })).rejects.toThrow(/leaflet/);
    const result = await syncDss({ root: project, leaflet: 'auto' });
    expect(result.leaflet).toBe(false);
  });
  it('version.json steht im Ziel, bevor es das Ziel gibt (Marker und Dateien kommen mit dem Umbenennen)', async () => {
    const out = `${project}/neu/dss`;
    await syncDss({ root: project, to: out });
    expect(existsSync(`${out}/version.json`)).toBe(true);
    expect(existsSync(`${out}/.dss-sync`)).toBe(true);
  });
  it('Direktaufruf im leeren Projekt ohne Leaflet: kopiert, setzt keinen Fehlercode', async () => {
    const empty = resolve(process.cwd(), 'tests/.portal-direct-tmp');
    await rm(empty, { recursive: true, force: true });
    await mkdir(`${empty}/node_modules/@bbv/dss-design-system/fonts`, { recursive: true });
    await cp(bundleDir, `${empty}/node_modules/@bbv/dss-design-system/dist/vanilla`, { recursive: true });
    await writeFile(`${empty}/node_modules/@bbv/dss-design-system/package.json`, JSON.stringify({ name: '@bbv/dss-design-system', version: '1.2.3' }));
    const script = resolve(process.cwd(), 'stories/examples/portal-sync.mjs');
    const cwd = process.cwd();
    const argv1 = process.argv[1];
    const exitCode = process.exitCode;
    try {
      process.chdir(empty);
      process.argv[1] = script;
      await import(/* @vite-ignore */ `${pathToFileURL(script).href}?direkt=${Date.now()}`);
      expect(process.exitCode).toBe(exitCode);
      expect(existsSync(`${empty}/_site/dss/dss.js`)).toBe(true);
      expect(JSON.parse(await readFile(`${empty}/_site/dss/version.json`, 'utf8')).version).toBe('1.2.3');
      expect(existsSync(`${empty}/_site/vendor`)).toBe(false);
    } finally {
      process.chdir(cwd);
      process.argv[1] = argv1;
      await rm(empty, { recursive: true, force: true });
    }
  });
  it('das Beispiel nennt kein Shell-Kommando und ändert nichts im Paket selbst', async () => {
    const code = await readFile(resolve(process.cwd(), 'stories/examples/portal-sync.mjs'), 'utf8');
    expect(code).not.toMatch(/child_process|execSync|spawn/);
  });
});
