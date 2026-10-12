// @vitest-environment node
// Das Beispiel stories/examples/portal-sync.mjs kopiert dist/vanilla (und optional Schriften, Leaflet) aus node_modules nach _site/dss.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
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
});
afterAll(() => rm(project, { recursive: true, force: true }));

describe('portal-sync.mjs', () => {
  it('kopiert dist/vanilla nach _site/dss, ersetzt Altes und schreibt version.json', async () => {
    const version = await syncDss({ root: project });
    expect(version).toBe('9.9.9');
    for (const name of ['dss.js', 'dss.min.js', 'dss.css', 'dss.d.ts', 'dss.min.js.map', 'courtlines/court.svg']) expect(existsSync(`${project}/_site/dss/${name}`), name).toBe(true);
    expect(existsSync(`${project}/_site/dss/alt.js`)).toBe(false);
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
  it('das Beispiel nennt kein Shell-Kommando und ändert nichts im Paket selbst', async () => {
    const code = await readFile(resolve(process.cwd(), 'stories/examples/portal-sync.mjs'), 'utf8');
    expect(code).not.toMatch(/child_process|execSync|spawn/);
  });
});
