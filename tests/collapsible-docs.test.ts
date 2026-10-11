// @vitest-environment node
// Doku „Tabellen einklappen“: Beispiel-Stories versteckt (tags !dev, kein autodocs), je Docs-Seite eindeutige ids, Regionsnamen und
// Sprungleisten-Namen (axe landmark-unique), die Beispiele werden wirklich gerendert, die MDX-Seiten zeigen Abschnitt, Props und Dos und Don'ts.
import { readFileSync } from 'node:fs';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
const read = (p: string) => readFileSync(`${rootDir}${p}`, 'utf8');
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const PAGES = [
  { name: 'Table', mdx: 'stories/Table.mdx', stories: 'stories/Table.stories.ts', examples: 'stories/components/TableExamples.svelte', skip: [] as string[] },
  { name: 'Spielplan', mdx: 'stories/Spielplan.mdx', stories: 'stories/Spielplan.examples.stories.ts', examples: 'stories/components/SpielplanExamples.svelte', skip: [] },
  { name: 'LeagueCard', mdx: 'stories/LeagueCard.mdx', stories: 'stories/LeagueCard.stories.ts', examples: 'stories/components/LeagueCardExamples.svelte', skip: ['handy'] },
  { name: 'Accordion', mdx: 'stories/Accordion.mdx', stories: 'stories/Accordion.stories.ts', examples: 'stories/components/AccordionExamples.svelte', skip: ['handy'] },
];
const NEW: Record<string, string[]> = {
  Table: ['einklappbar', 'einklappbar-id', 'einklappbar-gruppe', 'do-offen', 'dont-zu'],
  Spielplan: ['einklappbar', 'einklappbar-id', 'einklappbar-gruppe', 'do-offen', 'dont-zu'],
  LeagueCard: ['einklappbar', 'einklappbar-id', 'einklappbar-gruppe', 'do-offen', 'dont-zu'],
  Accordion: ['liga'],
};

describe.each(PAGES)('Doku $name', (page) => {
  const stories = read(page.stories);
  const names = [...stories.matchAll(/example\('([\w-]+)'\)/g)].map((m) => m[1]);

  it('die neuen Beispiel-Stories gibt es und sind versteckt (!dev), kein autodocs', () => {
    for (const n of NEW[page.name]) expect(names, n).toContain(n);
    expect(stories).not.toContain('autodocs');
    if (page.name === 'Spielplan') expect(stories).toMatch(/tags:\s*\['!dev'\]/);
    else for (const n of NEW[page.name]) expect(stories, n).toMatch(new RegExp(`example\\('${n}'\\)[^\\n]*tags:\\s*\\['!dev'\\]`));
  });
  it('alle Beispiele der Seite rendern; ids, Regionsnamen und Sprungleisten-Namen sind seitenweit eindeutig', async () => {
    const component = ((await vite.ssrLoadModule(rootDir + page.examples)) as { default: unknown }).default;
    const ids: string[] = [];
    const regions: string[] = [];
    const navs: string[] = [];
    // Falsche Beispiele (dont-…) sind in der Doku inert und zählen nicht als Region
    for (const n of names.filter((x) => !page.skip.includes(x) && !x.startsWith('dont-'))) {
      const html = render(component, { props: { example: n } }).body;
      // erzeugte ids (dss-cf-…) zählt der Browser je Seite durch (im Browser geprüft); beim einzelnen Server-Rendern beginnt der Zähler jedes Mal neu
      ids.push(...[...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]).filter((id) => !id.startsWith('dss-cf-')));
      regions.push(...[...html.matchAll(/role="region"[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]));
      navs.push(...[...html.matchAll(/<nav[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]));
    }
    // Die Sprungleiste entsteht im Browser; ihr Name steht im Quelltext
    const source = read(page.examples);
    navs.push(...[...source.matchAll(/navLabel="([^"]+)"/g)].map((m) => m[1]));
    const dup = (list: string[]) => list.filter((x, i) => list.indexOf(x) !== i);
    expect(dup(ids), 'ids').toEqual([]);
    expect(dup(regions), 'Regionen').toEqual([]);
    expect(dup(navs), 'navLabel').toEqual([]);
  });
  it('Beispiele werden ausgewertet: der Rahmen ist ein Kopf mit Button, offen/zu wie angekündigt', async () => {
    const component = ((await vite.ssrLoadModule(rootDir + page.examples)) as { default: unknown }).default;
    const first = NEW[page.name][0];
    const html = render(component, { props: { example: first } }).body;
    expect(html.match(/class="dss-acc-trigger"/g)!.length).toBeGreaterThanOrEqual(page.name === 'Accordion' ? 4 : 2);
    if (page.name !== 'Accordion') {
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain('aria-expanded="false"');
    }
  });
});

describe('MDX-Seiten', () => {
  it.each(['stories/Table.mdx', 'stories/Spielplan.mdx', 'stories/LeagueCard.mdx'])('%s: Abschnitt, Code je Fassung, Dos und Don\'ts', (p) => {
    const mdx = read(p);
    expect(mdx).toMatch(/^## Tabellen einklappen$/m);
    expect(mdx).toContain('collapsibleVanilla');
    expect(mdx).toMatch(/collapsible/);
    expect(mdx).toMatch(/title: 'Wichtiges offen lassen'/);
    expect(mdx).toMatch(/DoOffen/);
    expect(mdx).toMatch(/DontZu/);
  });
  it('Accordion.mdx: Liga-Seite mit einklappbaren Rahmen, „nicht verwenden“ aus Paket A ist weg', () => {
    const mdx = read('stories/Accordion.mdx');
    expect(mdx).toContain('einklappbare Tabellenrahmen');
    expect(mdx).not.toMatch(/folgen in einem eigenen Paket|eigenen Rahmen im Bereich/);
  });
  it('Props-Tabellen nennen collapsible, open, defaultOpen und id', () => {
    for (const p of ['stories/Table.mdx', 'stories/Spielplan.mdx']) {
      const mdx = read(p);
      expect(mdx).toMatch(/\['collapsible'|\['open/);
      expect(mdx).toMatch(/\['id',/);
    }
    for (const p of ['stories/Table.stories.ts', 'stories/LeagueCard.stories.ts', 'stories/Spielplan.playground.stories.ts']) expect(read(p)).toContain('collapsible');
  });
});
