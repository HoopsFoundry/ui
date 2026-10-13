// @vitest-environment node
// Importieren hat keine Nebenwirkung: kein Zugriff auf window/document, nichts Neues auf globalThis (package.json: sideEffects nur für CSS).
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const dir = resolve(process.cwd(), 'js');
const modules = readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'map-leaflet.js'); // map-leaflet.js importiert Leaflet erst bei Bedarf, ist aber kein Teil der Vanilla-Bausteine
describe('sideEffects: false (außer CSS)', () => {
  it('package.json nennt nur CSS als Datei mit Nebenwirkung', () => {
    const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    expect(pkg.sideEffects).toEqual(['**/*.css']);
  });
  it.each(modules)('%s: Import ändert globalThis nicht und wirft in Node nicht', async (file) => {
    const before = [...Object.getOwnPropertyNames(globalThis), ...Object.getOwnPropertySymbols(globalThis).map(String)].sort();
    await import(/* @vite-ignore */ `${pathToFileURL(resolve(dir, file)).href}?seitenwirkung`);
    const after = [...Object.getOwnPropertyNames(globalThis), ...Object.getOwnPropertySymbols(globalThis).map(String)].sort();
    expect(after).toEqual(before);
  });
  it('die Init-Funktionen tun in Node nichts und werfen nicht', async () => {
    const mods = await Promise.all(['tabs', 'modal', 'pagenav', 'backtop', 'theme', 'vanilla-core'].map((n) => import(/* @vite-ignore */ pathToFileURL(resolve(dir, `${n}.js`)).href)));
    expect(() => {
      mods[0].initTabs(null).destroy();
      mods[1].initModal(null).destroy();
      mods[2].initPageNav(null).destroy();
      mods[3].initBackToTop().destroy();
      mods[5].initAll().destroy();
    }).not.toThrow();
  });
});
