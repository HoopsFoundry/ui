// @vitest-environment node
// FormChips und StatGrid: Svelte und React erzeugen dasselbe Markup (Server-Rendering, normalisiert); Text bleibt Text.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
const load = async (path: string, name = 'default') => ((await vite.ssrLoadModule(rootDir + path)) as Record<string, unknown>)[name];
const normalize = (html: string) =>
  html.replace(/<!--[\s\S]*?-->/g, '').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').replace(/ ?> ?/g, '>').replace(/ ?</g, '<')
    .replace(/class="([^"]*)"/g, (_m, v: string) => `class="${v.trim().split(/\s+/).sort().join(' ')}"`).trim();

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js' })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
  await vite.ssrLoadModule('/tests/setup-i18n.ts'); // Standardsprache der Tests (Deutsch) auch im Modulgraphen dieses Servers
}, 60000);
afterAll(async () => {
  await vite?.close();
});

const both = async (name: 'FormChips' | 'StatGrid', props: Record<string, unknown>) => {
  const Svelte = await load(`svelte/${name}.svelte`);
  const React = await load(`react/${name}.tsx`, name);
  const { className, ...rest } = props;
  const s = render(Svelte, { props: className === undefined ? rest : { ...rest, class: className } }).body;
  const r = renderToStaticMarkup(createElement(React as never, props as never));
  return { svelte: normalize(s), react: normalize(r) };
};

describe('FormChips', () => {
  it('Standard: Punkte, versteckter Text, höchstens fünf Einträge', async () => {
    const { svelte: s, react: r } = await both('FormChips', { form: ['S', 'N', 'S', 'S', 'U', 'N', 'S'] });
    expect(s).toBe(r);
    expect(s).toContain('<span class="hoops-form"><span class="hoops-form-list" aria-hidden="true">');
    expect((s.match(/hoops-form-item /g) ?? []).length).toBe(5);
    expect(s).toContain('Form: Sieg, Sieg, Unentschieden, Niederlage, Sieg');
  });
  it('letters und eigene Klasse', async () => {
    const { svelte: s, react: r } = await both('FormChips', { form: ['S'], variant: 'letters', className: 'mein' });
    expect(s).toBe(r);
    expect(s).toContain('hoops-form hoops-form--letters mein');
  });
  it.each([[[]], [undefined], [['x', 1, null]], ['SSS']])('ungültige Form %j: nichts', async (form) => {
    const { svelte: s, react: r } = await both('FormChips', { form });
    expect(s).toBe('');
    expect(r).toBe('');
  });
  it('Reihenfolge der Zeichen: neueste zuletzt', async () => {
    const { svelte: s } = await both('FormChips', { form: ['S', 'N', 'U'] });
    expect(s.indexOf('hoops-form-item--s')).toBeLessThan(s.indexOf('hoops-form-item--n'));
    expect(s.indexOf('hoops-form-item--n')).toBeLessThan(s.indexOf('hoops-form-item--u'));
  });
});

describe('StatGrid', () => {
  it('Gitter: Beschreibungsliste, Beschriftung zuerst', async () => {
    const { svelte: s, react: r } = await both('StatGrid', { items: [{ label: 'Siege', value: 12 }, { label: 'Punkte pro Spiel', value: 82.4 }] });
    expect(s).toBe(r);
    expect(s).toContain('<dl class="hoops-stats">');
    expect(s).toContain('<dt class="hoops-stat-label">Siege</dt><dd class="hoops-stat-value">12</dd>');
    expect(s).toContain('82,4');
  });
  it('compact', async () => {
    const { svelte: s, react: r } = await both('StatGrid', { items: [{ label: 'A', value: 1 }], compact: true });
    expect(s).toBe(r);
    expect(s).toContain('hoops-stats hoops-stats--compact');
  });
  it('fehlender Wert: Gedankenstrich sichtbar, Text versteckt', async () => {
    const { svelte: s, react: r } = await both('StatGrid', { items: [{ label: 'Rebounds', value: null }] });
    expect(s).toBe(r);
    expect(s).toContain('<span aria-hidden="true">–</span><span class="hoops-sr-only">keine Angabe</span>');
  });
  it('bösartige Texte werden maskiert', async () => {
    const { svelte: s, react: r } = await both('StatGrid', { items: [{ label: '"><img src=x onerror=alert(1)>', value: '<script>alert(1)</script>' }] });
    expect(s).toBe(r);
    expect(s).not.toContain('<img');
    expect(s).not.toContain('<script');
    expect(s).toContain('&lt;img');
  });
  it('ohne gültige Einträge nichts', async () => {
    expect((await both('StatGrid', { items: [] })).svelte).toBe('');
    expect((await both('StatGrid', { items: [{ value: 1 }] })).react).toBe('');
  });
});
