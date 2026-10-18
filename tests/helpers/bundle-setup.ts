// Baut das Vanilla-Bündel einmal vor allen Tests nach tests/.bundle-tmp/ (esbuild läuft nicht unter jsdom, deshalb hier im Hauptprozess)
// und räumt danach auf. tests/vanilla-bundle*.test.ts lesen von dort. Dazu das React-Bündel (wie `npm run build:react`, nach tests/.bundle-tmp/react/):
// tests/dist-react-i18n.test.ts prüft am gebauten Bündel, dass es den Sprachzustand mit dem Quelltext-Kern teilt.
import { rmSync } from 'node:fs';
import { build } from 'tsup';
import { buildVanilla } from '../../scripts/build-vanilla.mjs';

import { bundleDir } from './bundle-dir';

export async function setup() {
  await buildVanilla({ outDir: bundleDir });
  await build({
    entry: { index: 'react/index.ts' }, format: ['esm'], dts: false, clean: false, sourcemap: false, outDir: `${bundleDir}react`,
    tsconfig: 'react/tsconfig.json', silent: true, esbuildOptions(options) { options.jsx = 'automatic'; },
  });
}
export function teardown() {
  rmSync(bundleDir, { recursive: true, force: true });
}
