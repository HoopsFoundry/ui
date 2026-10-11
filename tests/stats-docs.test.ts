// @vitest-environment node
// Doku-Seite „Kennzahlen und Form“: Code-Beispiele (React mit dem TypeScript-Compiler, Svelte per Server-Rendering, Vanilla-Markup gegen die
// Komponenten), Verweise, Stories, Dos und Don'ts, Einbindung in Einführung, Sortierung, README und CHANGELOG.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/Stats.code';
import { cleanup, compileReact, normalize, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import type { ViteDevServer } from 'vite';

const tmpDir = `${rootDir}tests/.code-tmp-stats/`;
let vite: ViteDevServer;
let render: Render;
beforeAll(async () => {
  ({ vite, render } = await startServer());
}, 60000);
afterAll(async () => {
  await vite?.close();
  cleanup(tmpDir);
});

const mdx = read('stories/Stats.mdx');
const stories = read('stories/Stats.stories.ts');
const examples = read('stories/components/StatsExamples.svelte');

describe('Code-Beispiele', () => {
  it('Svelte rendert (SSR) mit Kennzahlen und Form', async () => {
    const html = await renderSvelteSource(vite, render, tmpDir, 'svelte', code.svelte);
    expect(html).not.toContain('undefined');
    expect(html.match(/<dl class="dss-stats/g)).toHaveLength(2);
    expect(html).toContain('dss-stats--compact');
    expect(html).toContain('82,4');
    expect(html).toContain('keine Angabe');
    expect(html).toContain('Form: Sieg, Sieg, Niederlage, Sieg, Unentschieden');
    expect(html).toContain('dss-form--letters');
  });
  it('React besteht den TypeScript-Compiler', () => {
    expect(compileReact({ stats: code.react })).toEqual([]);
  }, 60000);
  it('Vanilla-Markup entspricht der Ausgabe der Komponenten', async () => {
    const Stat = ((await vite.ssrLoadModule(`${rootDir}svelte/StatGrid.svelte`)) as { default: unknown }).default;
    const Form = ((await vite.ssrLoadModule(`${rootDir}svelte/FormChips.svelte`)) as { default: unknown }).default;
    const ReactStat = ((await vite.ssrLoadModule(`${rootDir}react/StatGrid.tsx`)) as { StatGrid: unknown }).StatGrid;
    const ReactForm = ((await vite.ssrLoadModule(`${rootDir}react/FormChips.tsx`)) as { FormChips: unknown }).FormChips;
    const items = [{ label: 'Siege', value: 12 }, { label: 'Niederlagen', value: 3 }, { label: 'Punkte pro Spiel', value: 82.4 }, { label: 'Rebounds', value: null }];
    const markups: [string, string, string][] = [
      [code.statsMarkup, normalize(render(Stat, { props: { items } }).body), normalize(renderToStaticMarkup(createElement(ReactStat as never, { items } as never)))],
      [code.statsCompactMarkup, normalize(render(Stat, { props: { items: [{ label: 'Siege', value: 12 }, { label: 'Niederlagen', value: 3 }, { label: 'Korbdifferenz', value: '+96' }], compact: true } }).body), ''],
      [code.formMarkup, normalize(render(Form, { props: { form: ['S', 'S', 'N', 'S', 'U'] } }).body), normalize(renderToStaticMarkup(createElement(ReactForm as never, { form: ['S', 'S', 'N', 'S', 'U'] } as never)))],
      [code.formLettersMarkup, normalize(render(Form, { props: { form: ['S', 'N', 'U'], variant: 'letters' } }).body), normalize(renderToStaticMarkup(createElement(ReactForm as never, { form: ['S', 'N', 'U'], variant: 'letters' } as never)))],
    ];
    for (const [markup, svelteHtml, reactHtml] of markups) {
      expect(normalize(markup)).toBe(svelteHtml);
      if (reactHtml) expect(reactHtml).toBe(svelteHtml);
    }
  });
  it('das Vanilla-Beispiel enthält alle Bausteine und die reinen Funktionen', () => {
    for (const part of [code.statsMarkup, code.statsCompactMarkup, code.formMarkup, code.formLettersMarkup, "from '@bbv/dss-design-system/stats.js'", "from '@bbv/dss-design-system/league.js'"]) expect(code.vanilla).toContain(part);
  });
  it('die Funktionen im Vanilla-Beispiel liefern die genannten Ergebnisse', async () => {
    const { formEntries, formLabel } = await import('../js/league.js');
    const { statItems } = await import('../js/stats.js');
    expect(formEntries(['S', 'N', 'x', 'S'])).toEqual(['S', 'N', 'S']);
    expect(formLabel(['S', 'S', 'N'])).toBe('Form: Sieg, Sieg, Niederlage');
    expect(statItems([{ label: 'Punkte pro Spiel', value: 82.4 }, { label: 'Rebounds', value: null }])).toEqual([
      { label: 'Punkte pro Spiel', value: '82,4', empty: false }, { label: 'Rebounds', value: '–', empty: true },
    ]);
  });
});

describe('Doku-Seite', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/StatsStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('Beispiel-Stories sind versteckt (literales Tag), kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    for (const m of stories.matchAll(/export const (\w+)\s*= \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= .*tags: \\['!dev'\\]`));
    expect(stories).toMatch(/export const Standard = \{ args/);
    expect(stories).toMatch(/export const Spielwiese = \{/);
  });
  it('argTypes haben Beschreibungen', () => {
    for (const k of ['count', 'compact', 'missing', 'variant', 'formLength']) expect(stories).toMatch(new RegExp(`${k}: \\{.*description:`));
  });
  it('drei Dos und Don\'ts; die Don\'t-Beispiele sind in der Beispielkomponente erkennbar falsch', () => {
    expect([...mdx.matchAll(/doText:/g)]).toHaveLength(3);
    expect(examples).toContain('class="dont-dots"');
  });
  it('zwei Handy-Vorschauen mit verschiedenen Inhalten', () => {
    expect(mdx.match(/<iframe /g)).toHaveLength(2);
    expect(mdx).toContain('id=components-kennzahlen--handy"');
    expect(mdx).toContain('theme:Dark&id=components-kennzahlen--handy-dunkel');
    const titles = [...examples.matchAll(/title=\{LIGEN\[(\d+)\]\}/g)].map((m) => m[1]);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('die Barrierefreiheit nennt Text statt Farbe und die Zielgröße der nicht bedienbaren Zeichen', () => {
    expect(mdx).toMatch(/Nie nur Farbe/);
    expect(mdx).toMatch(/WCAG 2\.5\.5 und 2\.5\.8/);
    expect(mdx).toMatch(/44 × 44 px/);
  });
  it('Einführung, storySort, README und CHANGELOG nennen die Seite', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-kennzahlen--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'LeagueCard', 'Kennzahlen'/);
    expect(read('README.md')).toContain('Kennzahlen');
    expect(read('CHANGELOG.md')).toContain('Kennzahlen und Form');
  });
  it('Manifest und Exporte kennen die Komponenten', () => {
    const manifest = JSON.parse(read('parity.manifest.json'));
    expect(Object.keys(manifest)).toEqual(expect.arrayContaining(['FormChips', 'StatGrid']));
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.exports['./svelte/StatGrid']).toBe('./svelte/StatGrid.svelte');
    expect(pkg.exports['./svelte/FormChips']).toBe('./svelte/FormChips.svelte');
    expect(pkg.exports['./stats.js'].import).toBe('./js/stats.js');
    expect(read('react/index.ts')).toMatch(/StatGrid[^;]*from '\.\/StatGrid'/);
    expect(read('react/index.ts')).toMatch(/FormChips[^;]*from '\.\/FormChips'/);
  });
});
