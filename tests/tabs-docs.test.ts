// @vitest-environment node
// Doku-Seite „Tabs“: das Vanilla-Markup stimmt mit der Ausgabe der Svelte- und React-Komponenten überein (bis auf ids, aria-controls und die Panels),
// jede Story und jedes Beispiel existiert, Beispiel-Stories sind versteckt, Vorschau in Gerätebreite, Dos und Don'ts, Einbindung in Einführung und Sortierung.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/Tabs.code';
import { cleanup, normalize, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import type { ViteDevServer } from 'vite';

const tmpDir = `${rootDir}tests/.code-tmp-tabs/`;
let vite: ViteDevServer;
let render: Render;
beforeAll(async () => {
  ({ vite, render } = await startServer());
}, 60000);
afterAll(async () => {
  await vite?.close();
  cleanup(tmpDir);
});

const mdx = read('stories/Tabs.mdx');
const stories = read('stories/Tabs.stories.ts');
const examples = read('stories/components/TabsExamples.svelte');

/** Nur die Leisten (ohne Panels, ohne Kommentare) und ohne das, was nur das Skript braucht: ids, aria-controls, data-hoops, Zustandsklassen der Vanilla-Seite. */
const bars = (markup: string) =>
  [...markup.matchAll(/<div class="hoops-tabs[\s\S]*?\n<\/div>/g)].map((m) => m[0])
    .map((bar) => bar.replace(/ id="[^"]*"/g, '').replace(/ aria-controls="[^"]*"/g, '').replace(/ data-hoops(-options)?(='[^']*'|="[^"]*")?/g, ''));
// disabled steht in den Komponenten vor tabindex, im Markup dahinter: ohne das Attribut vergleichen, die Zahl getrennt prüfen
const clean = (html: string) => normalize(html.replace(/ aria-orientation="horizontal"/g, '').replace(/ type="button"/g, '').replace(/ disabled(="")?/g, ''));
const disabledCount = (html: string) => (html.match(/ disabled(=""|>| )/g) ?? []).length;
const sv = (name: string, body: string, imports = "import Tabs from '@hoopsfoundry/ui/svelte/Tabs';") =>
  renderSvelteSource(vite, render, tmpDir, name, `<script>\n${imports}\n</script>\n${body}`);
const reactMod = async () => (await vite.ssrLoadModule(`${rootDir}react/Tabs.tsx`)) as { Tabs: never };

describe('Vanilla-Markup gegen die Komponenten', () => {
  it('Leiste des Hauptbeispiels (Underline, Zähler, gesperrter Tab) = Svelte = React', async () => {
    const items = [{ id: 'o', label: 'Übersicht' }, { id: 'r', label: 'Aufstellung', count: 12 }, { id: 'b', label: 'Boxscore', disabled: true }];
    const svelte = await sv('bar', `<Tabs items={${JSON.stringify(items)}} value="o" ariaLabel="Spielansicht" />`);
    const react = renderToStaticMarkup(createElement((await reactMod()).Tabs, { items, value: 'o', ariaLabel: 'Spielansicht' }));
    const [bar] = bars(code.barMarkup);
    expect(clean(bar)).toBe(clean(svelte));
    expect(clean(bar)).toBe(clean(react));
    expect(disabledCount(bar)).toBe(1);
    expect(disabledCount(svelte)).toBe(1);
  });
  it('Register: Segmented Alle/Heim/Auswärts und Pills Liga/Pokal mit Zählern', async () => {
    const [segmented, pills] = bars(code.registerMarkup);
    const a = await sv('seg', `<Tabs items={[{ id: 'a', label: 'Alle' }, { id: 'h', label: 'Heim' }, { id: 'w', label: 'Auswärts' }]} variant="segmented" value="a" ariaLabel="Spiele nach Spielort" />`);
    const b = await sv('pill', `<Tabs items={[{ id: 'l', label: 'Liga', count: 10 }, { id: 'p', label: 'Pokal', count: 2 }]} variant="pills" value="l" ariaLabel="Wettbewerb" />`);
    expect(clean(segmented)).toBe(clean(a));
    expect(clean(pills)).toBe(clean(b));
    const react = renderToStaticMarkup(createElement((await reactMod()).Tabs, { items: [{ id: 'a', label: 'Alle' }, { id: 'h', label: 'Heim' }, { id: 'w', label: 'Auswärts' }], variant: 'segmented', value: 'a', ariaLabel: 'Spiele nach Spielort' }));
    expect(clean(segmented)).toBe(clean(react));
  });
  it('Filter mit Mehrfachauswahl = Svelte = React (role=group, aria-pressed)', async () => {
    const items = [{ id: 'a', label: 'Bayernliga Süd' }, { id: 'b', label: 'Regionalliga' }, { id: 'c', label: 'Pokal' }];
    const svelte = await sv('multi', `<Tabs items={${JSON.stringify(items)}} variant="pills" multi activeIds={['a', 'c']} ariaLabel="Ligen filtern" />`);
    const react = renderToStaticMarkup(createElement((await reactMod()).Tabs, { items, variant: 'pills', multi: true, activeIds: ['a', 'c'], ariaLabel: 'Ligen filtern' }));
    const [bar] = bars(code.filterMarkup);
    expect(clean(bar)).toBe(clean(svelte));
    expect(clean(bar)).toBe(clean(react));
  });
});

describe('Code-Beispiel', () => {
  it('enthält die Markup-Konstanten, beide Wege (initAll, einzeln) und das Ereignis', () => {
    expect(code.vanilla).toContain(code.barMarkup);
    expect(code.vanilla).toContain(code.filterMarkup);
    expect(code.vanilla).toContain("import { initAll } from '@hoopsfoundry/ui/vanilla-core.js'");
    expect(code.vanilla).toContain("import { initTabs } from '@hoopsfoundry/ui/tabs.js'");
    expect(code.vanilla).toContain('hoops:tabchange');
  });
  it('die Importpfade gibt es als Exporte', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.exports['./tabs.js']).toBeTruthy();
    expect(pkg.exports['./vanilla-core.js']).toBeTruthy();
  });
  it('jede id im Markup kommt einmal vor, jedes aria-controls zeigt auf ein Panel, jedes Panel auf seinen Tab', () => {
    for (const markup of [code.barMarkup, code.registerMarkup, code.filterMarkup]) {
      const ids = [...markup.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
      expect(new Set(ids).size).toBe(ids.length);
      for (const m of markup.matchAll(/aria-controls="([^"]+)"/g)) expect(ids, m[1]).toContain(m[1]);
      for (const m of markup.matchAll(/aria-labelledby="([^"]+)"/g)) expect(ids, m[1]).toContain(m[1]);
    }
  });
  it('die Ids der Beispiele auf der Doku-Seite stimmen mit keiner Svelte-Komponente überein (keine Doppelung zwischen Code und Do/Don\'t)', () => {
    const all = [code.barMarkup, code.registerMarkup, code.filterMarkup].flatMap((m) => [...m.matchAll(/ id="([^"]+)"/g)].map((x) => x[1]));
    for (const id of all) expect(examples.includes(`id="${id}"`), id).toBe(false);
  });
});

describe('Doku-Seite', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/TabsStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('Beispiel-Stories sind versteckt (literales Tag), kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    for (const m of stories.matchAll(/export const (\w+)\s*= \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= .*tags: \\['!dev'\\]`));
    for (const name of ['VanillaRegister', 'VanillaFilter', 'Handy', 'HandyVerein', 'DoPanels', 'DontPanels']) expect(stories).toMatch(new RegExp(`export const ${name}\\s*= .*tags: \\['!dev'\\]`));
  });
  it('Vorschau in Gerätebreite: zwei verschiedene Beispiele in einer feststehenden Vorschau, keine festen Iframes und kein festes Theme', () => {
    expect(mdx).not.toMatch(/<iframe /);
    expect(mdx).not.toContain('hoops-phone');
    expect(mdx).not.toContain('theme:Dark');
    expect(mdx.match(/<PreviewStep /g)).toHaveLength(2);
    expect(mdx).toContain('<PreviewStep of={TabsStories.Handy} ');
    expect(mdx).toContain('<PreviewStep of={TabsStories.HandyVerein} ');
    expect(examples).toContain("example === 'handy'");
    expect(examples).toContain("example === 'handy-verein'");
  });
  it('fünf Dos und Don\'ts; die Don\'t-Bühne ist inert (DosDonts), das neue Paar zeigt das Panel-Beispiel', () => {
    expect([...mdx.matchAll(/doText:/g)]).toHaveLength(5);
    expect(read('stories/docs/blocks/DosDonts.tsx')).toContain('{...INERT}');
    expect(mdx).toContain('TabsStories.DontPanels');
  });
  it('die Doku nennt Optionen, Ereignis, Pos1/Ende und die Garantie ohne innerHTML', () => {
    for (const part of ['activation', 'hoops:tabchange', 'Pos1 / Ende', 'ersten bzw. letzten nicht gesperrten Tab', 'destroy()', 'innerHTML', 'initTabs']) expect(mdx, part).toContain(part);
  });
  it('die Beispielseite im Code verwendet kein innerHTML', () => {
    const script = examples.slice(0, examples.indexOf('{#if example'));
    expect(script).not.toContain('innerHTML');
    expect(script).toContain('createContextualFragment');
  });
  it('Einführung, storySort, README und CHANGELOG nennen Tabs und initTabs', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-tabs--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'Tabs'/);
    expect(read('README.md')).toContain('initTabs');
    expect(read('CHANGELOG.md')).toContain('initTabs');
  });
});
