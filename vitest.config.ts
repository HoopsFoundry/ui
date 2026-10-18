import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ configFile: new URL('./svelte.config.js', import.meta.url).pathname })],
  // Svelte-Komponenten im Browser-Modus (mount) unter jsdom testen
  // 'leaflet' ist in Tests ein gespieltes Modul (tests/helpers/leaflet-mock.ts): kein Netz, kein echtes Leaflet
  resolve: { conditions: ['browser'], alias: { leaflet: new URL('./tests/helpers/leaflet-mock.ts', import.meta.url).pathname } },
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    globals: true,
    // tests/setup-i18n.ts: Standardsprache der bestehenden Tests ist Deutsch (die Bibliothek startet mit Englisch)
    setupFiles: ['./react/test-setup.ts', './tests/setup-i18n.ts'],
    // baut das Vanilla-Bündel einmal für tests/vanilla-bundle*.test.ts
    globalSetup: ['./tests/helpers/bundle-setup.ts'],
    include: ['react/**/*.test.{ts,tsx}', 'tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    // axe-Läufe und getByRole sind unter Last (Spotlight, CI) langsam; 5 s Standard erzeugt Flakes.
    testTimeout: 20000,
  },
});
