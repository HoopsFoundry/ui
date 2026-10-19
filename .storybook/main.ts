import type { StorybookConfig } from '@storybook/svelte-vite';
import { mergeConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|ts|svelte)',
    '../stories/**/*.spec.stories.ts',
  ],

  // Logos der Doku: Marke in der Seitenleiste (manager.ts), Favicon (manager-head.html, preview-head.html) und die Seite Foundation/Logo.
  // Relative Pfade, damit die Doku auch unter einem Unterpfad lädt (Webspace per rsync, GitHub Pages).
  staticDirs: [{ from: '../logo', to: '/logo' }],

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
  ],

  framework: {
    name: '@storybook/svelte-vite',
    options: {},
  },

  // Storybook 10's svelte-vite ships a docgen plugin that runs BEFORE
  // vite-plugin-svelte and tries to parse raw .svelte source as JS — which
  // breaks on Svelte 5 syntax (<svelte:boundary>, runes, etc.). Two fixes:
  //   1. Strip out the docgen plugin (loses argTypes auto-inference; we
  //      declare them explicitly in each story anyway).
  //   2. Ensure vite-plugin-svelte is registered so .svelte files compile.
  async viteFinal(viteConfig) {
    viteConfig.plugins = (viteConfig.plugins ?? []).filter((p: any) => {
      const name = p && (p.name || (p as any).constructor?.name);
      return name !== 'storybook:svelte-docgen-plugin';
    });
    return mergeConfig(viteConfig, {
      plugins: [svelte()],
      // React-JSX in .tsx (MDX-Doku-Bausteine): automatischer Transform, da kein Root-tsconfig.json existiert
      esbuild: { jsx: 'automatic' },
    });
  }
};
export default config;
