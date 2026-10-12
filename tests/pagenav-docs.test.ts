// @vitest-environment node
// Doku-Seite „PageNav“: Code-Beispiele (React mit dem TypeScript-Compiler, Svelte per Server-Rendering), Verweise, Stories, Dos und Don'ts,
// Einbindung in Einführung, Sortierung, README und CHANGELOG. Das Vanilla-Markup läuft in tests/pagenav-docs-dom.test.ts (jsdom).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/PageNav.code';
import { cleanup, compileReact, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import type { ViteDevServer } from 'vite';

const tmpDir = `${rootDir}tests/.code-tmp-pagenav/`;
let vite: ViteDevServer;
let render: Render;
beforeAll(async () => {
  ({ vite, render } = await startServer());
}, 60000);
afterAll(async () => {
  await vite?.close();
  cleanup(tmpDir);
});

const mdx = read('stories/PageNav.mdx');
const stories = read('stories/PageNav.stories.ts');
const examples = read('stories/components/PageNavExamples.svelte');

describe('Code-Beispiele', () => {
  it('Svelte rendert (SSR): Seite mit leerem Platz für die Navigation', async () => {
    const html = await renderSvelteSource(vite, render, tmpDir, 'svelte', code.svelte);
    expect(html).not.toContain('undefined');
    expect(html.match(/<h2>/g)).toHaveLength(3);
    expect(html).toContain('<main');
    expect(html).not.toContain('dss-pagenav');
  });
  it('React besteht den TypeScript-Compiler', () => {
    expect(compileReact({ pagenav: code.react })).toEqual([]);
  }, 60000);
  it('das Funktionen-Beispiel nennt nur vorhandene Exporte', async () => {
    const pagenav = await import('../js/pagenav.js');
    const accordion = await import('../js/accordion.js');
    for (const name of ['slug', 'entries', 'signature']) expect(pagenav, name).toHaveProperty(name);
    for (const name of ['revealAround', 'scrollToElement']) expect(accordion, name).toHaveProperty(name);
    expect(pagenav.slug('Größe & Ärger')).toBe('groesse-aerger');
  });
  it('Svelte- und React-Beispiel nutzen container, onMount/useEffect und destroy', () => {
    expect(code.svelte).toMatch(/onMount/);
    expect(code.svelte).toMatch(/container: platz/);
    expect(code.svelte).toMatch(/nav\.destroy\(\); top\.destroy\(\)/);
    expect(code.react).toMatch(/useEffect/);
    expect(code.react).toMatch(/container: platz\.current/);
    expect(code.react).toMatch(/nav\.destroy\(\)/);
  });
});

describe('Doku-Seite', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/PageNavStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('Beispiel-Stories sind versteckt (literales Tag), kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    for (const m of stories.matchAll(/export const (\w+)\s*= \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= .*tags: \\['!dev'\\]`));
    for (const name of ['NachOben', 'NachObenBnav']) expect(stories).toMatch(new RegExp(`export const ${name} = .*tags: \\['!dev'\\]`));
    expect(stories).toMatch(/export const Standard = \{ args/);
    expect(stories).toMatch(/export const Spielwiese = \{/);
  });
  it('argTypes haben Beschreibungen', () => {
    for (const k of ['sections', 'label', 'minHeadings', 'skipSecond', 'blockWithoutHeading', 'observe']) expect(stories).toMatch(new RegExp(`${k}: \\{.*description:`));
  });
  it('drei Dos und Don\'ts', () => expect([...mdx.matchAll(/doText:/g)]).toHaveLength(3));
  it('jede Navigation der Beispiele auf der Seite hat einen eigenen Namen (axe landmark-unique); nur das inerte Don\'t darf doppeln', () => {
    // Beispiele je Name aufteilen; Handy-Beispiele stehen in eigenen Rahmen (iframe), Don't-Beispiele sind inert
    const pieces = examples.split(/\{(?:#if|:else if) example === '/);
    const blocks = Object.fromEntries(pieces.slice(1).map((b) => [b.slice(0, b.indexOf("'")), b]));
    const onPage = Object.entries(blocks).filter(([name]) => !name.startsWith('handy') && !name.startsWith('dont-'));
    const names = onPage.flatMap(([, text]) => [
      ...[...text.matchAll(/label: '([^']+)'/g)].map((m) => m[1]),
      ...[...text.matchAll(/<p class="dss-eyebrow" id="[^"]+">([^<]+)<\/p>/g)].map((m) => m[1]),
    ]);
    // 'vanilla' setzt den Namen über data-dss-options
    names.push(...[...pieces[0].matchAll(/label: '([^']+)'/g)].map((m) => m[1]));
    expect(names.length).toBeGreaterThan(8);
    expect(new Set(names).size, JSON.stringify(names)).toBe(names.length);
    // Das Don't doppelt den Namen absichtlich
    const dont = [...blocks['dont-namen'].matchAll(/<p class="dss-eyebrow" id="[^"]+">([^<]+)<\/p>/g)].map((m) => m[1]);
    expect(dont[0]).toBe(dont[1]);
  });
  it('die Dokumentation nennt landmark-unique und den Namen als Parameter', () => {
    expect(mdx).toMatch(/landmark-unique/);
    expect(mdx).toMatch(/Der Name ist deshalb ein Parameter/);
  });
  it('die Handy-Vorschauen: zwei Iframes mit verschiedenen Beispielen, dazu zwei Nach-oben-Rahmen', () => {
    expect(mdx.match(/<iframe /g)).toHaveLength(4);
    expect(mdx).toContain('id=components-pagenav--handy"');
    expect(mdx).toContain('theme:Dark&id=components-pagenav--handy-dunkel');
    expect(mdx).toContain('id=components-pagenav--nach-oben"');
    expect(mdx).toContain('id=components-pagenav--nach-oben-bnav"');
  });
  it('keine globalen Regeln: die Doku nennt Token und Opt-in-Klasse', () => {
    expect(mdx).toMatch(/--dss-scroll-offset/);
    expect(mdx).toMatch(/dss-scroll-pad/);
    expect(mdx).toMatch(/keine globalen Regeln/);
    expect(mdx).toMatch(/`dss-pagenav-target`, deren `scroll-margin-top` `--dss-scroll-offset` plus `1rem` ist/);
  });
  it('die Doku nennt Animation, Beobachtung, Routing, verschachtelte Gruppen, RTL und createContextualFragment', () => {
    for (const part of ['`transitionend`', 'Höchstwartezeit', '`history.replaceState`', 'Hash-Routing', 'jede Accordion-Gruppe, auch eine verschachtelte', 'keine Wurzel, nur Optionen', '`inset-inline-end`', '`createContextualFragment`']) expect(mdx, part).toContain(part);
  });
  it('die Beispielseiten laufen nicht über ihren Rahmen (box-sizing)', () => {
    expect(examples).toMatch(/\.page \{ box-sizing: border-box;/);
    expect(read('stories/components/PageNavPlayground.svelte')).toMatch(/\.page \{ box-sizing: border-box;/);
  });
  it('Einführung, storySort, README und CHANGELOG nennen die Seite', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-pagenav--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'Accordion', 'PageNav'/);
    expect(read('README.md')).toContain('PageNav');
    expect(read('CHANGELOG.md')).toContain('PageNav');
  });
  it('Exporte: pagenav.js, backtop.js, vanilla-core.js mit Typen', () => {
    const pkg = JSON.parse(read('package.json'));
    for (const name of ['pagenav', 'backtop', 'vanilla-core', 'theme', 'motion', 'url', 'lifecycle', 'stats']) {
      expect(pkg.exports[`./${name}.js`], name).toEqual({ types: `./js/${name}.d.ts`, import: `./js/${name}.js` });
    }
  });
});
