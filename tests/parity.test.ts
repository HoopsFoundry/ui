// @vitest-environment node
// (unter jsdom liefert das globale URL-Objekt eine Variante, die readFileSync(new URL(...)) ablehnt)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

type Entry = { svelte: string; react: string; css: string[]; export?: string };

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('parity.manifest.json', root), 'utf8')) as Record<string, Entry>;
const css = readFileSync(new URL('css/components.css', root), 'utf8');
const indexTs = readFileSync(new URL('react/index.ts', root), 'utf8');

// Jede Svelte-Komponente muss ins Manifest (Svelte + CSS + React) — sonst schlägt der Test fehl.
describe.each(Object.entries(manifest))('Parität: %s', (name, entry) => {
  it('hat eine Svelte-Version', () => {
    expect(existsSync(new URL(entry.svelte, root))).toBe(true);
  });

  it('hat eine React-Version, die aus react/index.ts exportiert wird', () => {
    expect(existsSync(new URL(entry.react, root))).toBe(true);
    // `export`: Name des React-Exports, wenn er vom Dateinamen abweicht (Map heißt in React MapView, um das JS-Global Map nicht zu überdecken)
    expect(indexTs).toMatch(new RegExp(`\\b${entry.export ?? name}\\b[^;]*from '\\./${name}'`));
  });

  it.each(entry.css)('definiert die CSS-Klasse .%s', (cls) => {
    expect(new RegExp(`\\.${cls}(?![\\w-])`).test(css)).toBe(true);
  });
});

describe('Parität: Vollständigkeit', () => {
  it('jede Svelte-Komponente steht im Manifest', () => {
    const svelteComponents = readdirSync(new URL('svelte/', root))
      .filter((file) => file.endsWith('.svelte'))
      .map((file) => file.replace('.svelte', ''));
    expect(svelteComponents.filter((name) => !(name in manifest))).toEqual([]);
  });
});

describe('Parität: eine CSS-Quelle', () => {
  it('keine Svelte-Komponente (auch nicht in Unterordnern wie internal/) hat einen eigenen <style>-Block', () => {
    const walk = (dir: string): string[] =>
      readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}${e.name}/`) : e.name.endsWith('.svelte') ? [`${dir}${e.name}`] : []));
    const files = walk('svelte/');
    expect(files.some((f) => f.includes('internal/'))).toBe(true);
    const withStyle = files.filter((file) => /<style[\s>]/.test(readFileSync(new URL(file, root), 'utf8')));
    expect(withStyle).toEqual([]);
  });
});
