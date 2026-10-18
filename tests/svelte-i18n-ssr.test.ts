// @vitest-environment node
// Svelte-Grundlage der Internationalisierung beim Server-Rendern: richtige Sprache, kein Abonnement, lang nur mit ausdrücklichem documentLang.
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const rootDir = new URL('../', import.meta.url).pathname;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };
let core: typeof import('../js/i18n/index.js');
const load = async (path: string) => ((await vite.ssrLoadModule(rootDir + path)) as { default: unknown }).default;

beforeAll(async () => {
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js' })],
    server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
  core = (await vite.ssrLoadModule(rootDir + 'js/i18n/index.js')) as typeof core;
  const de = ((await vite.ssrLoadModule(rootDir + 'js/i18n/de.js')) as { default: Record<string, never> }).default;
  core.registerLocale('de', de);
}, 60000);
afterAll(async () => {
  await vite?.close();
});

describe('svelte/i18n.js beim Server-Rendern', () => {
  it('liefert die Texte der globalen Sprache und abonniert den Kern nicht', async () => {
    const Probe = await load('tests/helpers/I18nProbe.svelte');
    for (const [code, close, plural] of [['en', 'Close', '2 players'], ['de', 'Schließen', '2 Spieler']]) {
      core.setLocale(code);
      const body = render(Probe, { props: {} }).body;
      expect(body).toContain(`>${close}<`);
      expect(body).toContain(`>${plural}<`);
      expect(core.__subscriberCount()).toBe(0);
    }
  });
  it('der Anbieter gilt im Teilbaum; lang nur bei abweichender Sprache und ausdrücklichem documentLang', async () => {
    const Host = await load('tests/helpers/I18nProviderHost.svelte');
    core.setLocale('en');
    const plain = render(Host, { props: { locale: 'de' } }).body;
    expect(plain).toContain('>Schließen<');
    expect(plain).not.toContain('lang=');
    const withDoc = render(Host, { props: { locale: 'de', documentLang: 'en' } }).body;
    expect(withDoc).toContain('lang="de"');
    const same = render(Host, { props: { locale: 'de', documentLang: 'de' } }).body;
    expect(same).not.toContain('lang=');
    expect(core.getLocale()).toBe('en');
  });
});
