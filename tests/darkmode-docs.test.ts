// @vitest-environment node
// Doku-Seite „Dark Mode“: Code-Beispiele (React mit dem TypeScript-Compiler, Svelte per Server-Rendering), Boot-Skript im Beispiel, Verweise, Stories,
// Dos und Don'ts, Einbindung in Einführung, Sortierung, README und CHANGELOG. Das Vanilla-Markup läuft in tests/darkmode-docs-dom.test.ts (jsdom).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as code from '../stories/Foundation/DarkMode.code';
import { themeBootScript } from '../js/theme.js';
import { cleanup, compileReact, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import type { ViteDevServer } from 'vite';

const tmpDir = `${rootDir}tests/.code-tmp-darkmode/`;
let vite: ViteDevServer;
let render: Render;
beforeAll(async () => {
  ({ vite, render } = await startServer());
}, 60000);
afterAll(async () => {
  await vite?.close();
  cleanup(tmpDir);
});

const mdx = read('stories/Foundation/DarkMode.mdx');
const stories = read('stories/Foundation/DarkMode.stories.ts');
const examples = read('stories/Foundation/DarkModeDemo.svelte');

describe('Code-Beispiele', () => {
  it('Svelte rendert (SSR): ein verborgener Button', async () => {
    const html = await renderSvelteSource(vite, render, tmpDir, 'svelte', code.svelte);
    expect(html).not.toContain('undefined');
    expect(html).toMatch(/<button[^>]*type="button"[^>]*class="dss-btn dss-btn--secondary dss-btn--icon"[^>]*hidden/);
  });
  it('React besteht den TypeScript-Compiler', () => {
    expect(compileReact({ theme: code.react })).toEqual([]);
  }, 60000);
  it('das Boot-Skript im Beispiel ist genau die Ausgabe von themeBootScript()', () => {
    expect(code.bootScript).toBe(themeBootScript());
    expect(code.vanilla).toContain(`<script>${themeBootScript()}</script>`);
    expect(code.bootScript.length).toBeLessThan(300);
  });
  it('das Vanilla-Beispiel zeigt initAll, initTheme, setMode, getMode, destroy und onChange', () => {
    for (const part of ['initAll(document)', "initTheme(document.querySelector('[data-dss=\"theme\"]')", 'theme.setMode(', 'theme.getMode()', 'theme.destroy()', 'onChange']) expect(code.vanilla).toContain(part);
  });
  it('die CSP-Hinweise nennen Hash und nonce', () => {
    expect(code.cspHeader).toMatch(/sha256/);
    expect(code.cspHeader).toMatch(/nonce/);
    expect(code.cspHeader).toMatch(/script-src/);
  });
});

describe('Doku-Seite', () => {
  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/DarkModeStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(examples, m[1]).toContain(`example === '${m[1]}'`);
  });
  it('alle Stories sind versteckt (literales Tag), kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    expect(stories).toMatch(/default \{[\s\S]*tags: \['!dev'\]/);
    for (const m of stories.matchAll(/export const (\w+)\s*= \{ \.\.\.example/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= .*tags: \\['!dev'\\]`));
  });
  it('drei Dos und Don\'ts; die Don\'t-Beispiele sind in der Beispielkomponente erkennbar falsch', () => {
    expect([...mdx.matchAll(/doText:/g)]).toHaveLength(3);
    expect(examples).toMatch(/aria-label="Zum Light-Modus wechseln"/);
    expect(examples).toMatch(/Falsch: nur ein Symbol, kein Name/);
    expect(examples).toMatch(/class="card fixed"/);
  });
  it('drei Iframes: Ausprobieren und zwei Handy-Vorschauen mit verschiedenen Inhalten', () => {
    expect(mdx.match(/<iframe /g)).toHaveLength(3);
    expect(mdx).toContain('id=foundation-dark-mode--demo"');
    expect(mdx).toContain('id=foundation-dark-mode--handy"');
    expect(mdx).toContain('theme:Dark&id=foundation-dark-mode--handy-dunkel');
    expect(examples).toContain('TSV Nordhain 1920');
    expect(examples).toContain('Lindenberg Hawks');
  });
  it('die Seite nennt Modi, Speicherschlüssel, aria-pressed, Boot-Skript und die CSP', () => {
    for (const part of ['hell', 'dunkel', 'System', 'dss-theme', 'aria-pressed', 'themeBootScript', 'Content-Security-Policy', '`nonce`', 'Hash', 'Dunkelmodus']) expect(mdx, part).toContain(part);
  });
  it('Einführung, storySort, README und CHANGELOG nennen die Seite', () => {
    expect(read('stories/Introduction.mdx')).toContain('foundation-dark-mode--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'Live', 'Dark Mode'/);
    expect(read('README.md')).toContain('initTheme');
    expect(read('CHANGELOG.md')).toContain('themeBootScript');
  });
});
