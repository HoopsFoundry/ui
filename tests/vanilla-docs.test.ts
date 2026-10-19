// @vitest-environment node
// Doku-Seite „Vanilla“: Beispiele, Verweise, Stories, Dos und Don'ts, Liste der Exporte gegen das gebaute Bündel, Größenangaben gegen die Messung,
// Einbindung in Einführung, Sortierung, README und CHANGELOG. Das Markup läuft in tests/vanilla-docs-dom.test.ts (jsdom).
import { readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import * as code from '../stories/Foundation/Vanilla.code';
import { themeBootScript } from '../js/theme.js';
import { bundleDir } from './helpers/bundle-dir';
import { read } from './helpers/docs-code';

const mdx = read('stories/Foundation/Vanilla.mdx');
const stories = read('stories/Foundation/Vanilla.stories.ts');
const examples = read('stories/Foundation/VanillaDemo.svelte');

describe('Code-Beispiele', () => {
  it('die Seite enthält das Boot-Skript (genau die Ausgabe von themeBootScript), beide Aufrufe und alle sechs data-hoops-Namen', () => {
    expect(code.vanilla).toContain(`<script>${themeBootScript()}</script>`);
    expect(code.vanilla).toContain("import { initAll, VERSION, checkVersion } from '/hoops/hoops.min.js'");
    expect(code.vanilla).toContain('href="/hoops/hoops.css"');
    expect(code.vanilla).toContain('data-hoops="theme"');
    expect(code.vanilla).toContain(code.pageMarkup.split('\n')[0]);
  });
  it('die Optionen-Beispiele nennen vorhandene Optionen', () => {
    for (const part of ['data-hoops-options', 'only:', 'initTabs', 'initModal', 'openModal', 'closeModal', 'destroy']) expect(code.options, part).toContain(part);
    expect(code.dynamic).toContain('createContextualFragment');
    expect(code.dynamic).not.toMatch(/\.innerHTML\s*=/);
  });
  it('die CSP nennt script-src, Hash und nonce und die Grenze (kein eval)', () => {
    for (const part of ["script-src 'self'", 'sha256', 'nonce', 'eval', 'CSSOM']) expect(code.cspHeader, part).toContain(part);
  });
  it('das Skript im Beispiel ist das Beispiel der Doku: portal-sync.mjs wird roh eingebunden', () => {
    expect(mdx).toContain("import syncSource from '../../scripts/portal-sync.mjs?raw'");
    expect(read('scripts/portal-sync.mjs')).toContain('export async function syncHoops');
  });
});

describe('Bündel: Exportliste und Größen stimmen mit der Doku', () => {
  it('jeder Export des gebauten Bündels steht auf der Seite (und kein Name ist erfunden)', async () => {
    const mod = (await import(/* @vite-ignore */ pathToFileURL(`${bundleDir}hoops.js`).href)) as Record<string, unknown>;
    const section = mdx.slice(mdx.indexOf('## Alle Exporte'), mdx.indexOf('## Vorschau in Gerätebreite'));
    const listed = [...section.matchAll(/<code>(\w+)<\/code>/g)].map((m) => m[1]);
    expect(listed.sort()).toEqual(Object.keys(mod).sort());
  });
  it('HOOPS_BLOCKS: die Tabelle nennt jeden Baustein von initAll mit seiner Funktion', async () => {
    const { HOOPS_BLOCKS } = (await import('../js/vanilla-core.js')) as { HOOPS_BLOCKS: string[] };
    const section = mdx.slice(mdx.indexOf('## data-hoops'), mdx.indexOf('## Das Muster'));
    expect(HOOPS_BLOCKS).toHaveLength(7);
    for (const name of HOOPS_BLOCKS) {
      expect(section, name).toContain(`['${name}',`);
      // die Karte startet über initMapBlock aus dem Karten-Bündel
      expect(section, name).toContain(name === 'map' ? 'initMapBlock' : `init${name === 'backtop' ? 'BackToTop' : name === 'pagenav' ? 'PageNav' : name[0].toUpperCase() + name.slice(1)}`);
    }
    expect(section).toContain('sieben');
  });
  it('die Größenangaben weichen höchstens 5 % von der Messung ab; das Budget gilt', () => {
    const near = (documented: number, measured: number) => expect(Math.abs(documented - measured) / measured, `${documented} gegen ${measured}`).toBeLessThanOrEqual(0.05);
    near(code.bundleSizes.js, statSync(`${bundleDir}hoops.js`).size);
    near(code.bundleSizes.min, statSync(`${bundleDir}hoops.min.js`).size);
    near(code.bundleSizes.gzip, gzipSync(readFileSync(`${bundleDir}hoops.min.js`)).length);
    near(code.bundleSizes.css, statSync(`${bundleDir}hoops.css`).size);
    near(code.renderSizes.js, statSync(`${bundleDir}hoops-render.js`).size);
    near(code.renderSizes.min, statSync(`${bundleDir}hoops-render.min.js`).size);
    near(code.renderSizes.gzip, gzipSync(readFileSync(`${bundleDir}hoops-render.min.js`)).length);
    expect(code.renderBudget).toEqual({ minKB: 57, gzipKB: 19 });
    expect(code.renderSizes.min).toBeLessThanOrEqual(code.renderBudget.minKB * 1024);
    expect(code.renderSizes.gzip).toBeLessThanOrEqual(code.renderBudget.gzipKB * 1024);
    near(code.mapSizes.js, statSync(`${bundleDir}hoops-map.js`).size);
    near(code.mapSizes.min, statSync(`${bundleDir}hoops-map.min.js`).size);
    near(code.mapSizes.gzip, gzipSync(readFileSync(`${bundleDir}hoops-map.min.js`)).length);
    expect(code.mapBudget).toEqual({ minKB: 26, gzipKB: 10 });
    expect(code.mapSizes.min).toBeLessThanOrEqual(code.mapBudget.minKB * 1024);
    expect(code.mapSizes.gzip).toBeLessThanOrEqual(code.mapBudget.gzipKB * 1024);
    expect(code.budget).toEqual({ minKB: 48, gzipKB: 17 });
    expect(code.bundleSizes.min).toBeLessThanOrEqual(code.budget.minKB * 1024);
    expect(code.bundleSizes.gzip).toBeLessThanOrEqual(code.budget.gzipKB * 1024);
  });
});

describe('Doku-Seite', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('die Pflichtabschnitte sind da', () => {
    for (const title of ['## Überblick', '## Einbindung ohne Build', '## data-hoops: was initAll startet', '## Das Muster: init, destroy, idempotent', '## Markup erzeugen', '### update und destroy', '### Escaping und Eingaben', '### In Node und im Crawler', '### Bündel und Größe', '## Sicherheit', '### CSP und Boot-Skript', '## Bundle-Größen', '## Kopieren ins Projekt', '## Einbinden aus dem Release', '## Aktualisieren', '## Kompatibilität', '## Wechsel auf npm ab 1.0', '## Versionsabgleich', '## Alle Exporte', '## Vorschau in Gerätebreite', "## Dos und Don'ts"]) expect(mdx, title).toContain(title);
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/VanillaStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('Beispiel-Stories sind versteckt (literales Tag), kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    for (const m of stories.matchAll(/export const (\w+)\s*= \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= .*tags: \\['!dev'\\]`));
  });
  it('Vorschau in Gerätebreite: vier verschiedene Beispiele ohne festes Theme, vier Dos und Don\'ts', () => {
    expect(mdx).not.toMatch(/<iframe |theme:Dark/);
    for (const name of ['Handy', 'HandyAccordion', 'MarkupHandy', 'MarkupHandyTeam']) expect(mdx, name).toContain(`<PreviewStep of={VanillaStories.${name}} `);
    expect([...mdx.matchAll(/doText:/g)]).toHaveLength(4);
  });
  it('die Doku nennt Muster, Sicherheit und Versionsabgleich', () => {
    for (const part of ['idempotent', 'destroy()', 'createContextualFragment', 'textContent', 'safeHref', 'data-hoops-options', '`--hoops-version`', 'checkVersion', 'version.json', 'initMap', 'hoops-map.js', 'loadLeaflet', 'npm run build:vanilla', 'script-src', 'hoops-render.js', 'esc', 'renderLeagueCard', 'mountLeagueCard', 'Crawler']) expect(mdx, part).toContain(part);
  });
  it('die Beispielseite im Code verwendet kein innerHTML', () => {
    const script = examples.slice(0, examples.indexOf('{#if example'));
    expect(script).not.toContain('innerHTML');
    expect(script).toContain('createContextualFragment');
  });
  it('Einführung, storySort, README und CHANGELOG nennen die Seite', () => {
    expect(read('stories/Introduction.mdx')).toContain('foundation-vanilla--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'Dark Mode', 'Vanilla'/);
    expect(read('README.md')).toContain('Foundation/Vanilla');
    expect(read('README.md')).toContain('build:vanilla');
    expect(read('CHANGELOG.md')).toContain('Foundation/Vanilla');
  });
});
