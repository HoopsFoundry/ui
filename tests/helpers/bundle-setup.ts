// Baut das Vanilla-Bündel einmal vor allen Tests nach tests/.bundle-tmp/ (esbuild läuft nicht unter jsdom, deshalb hier im Hauptprozess)
// und räumt danach auf. tests/vanilla-bundle*.test.ts lesen von dort.
import { rmSync } from 'node:fs';
import { buildVanilla } from '../../scripts/build-vanilla.mjs';

import { bundleDir } from './bundle-dir';

export async function setup() {
  await buildVanilla({ outDir: bundleDir });
}
export function teardown() {
  rmSync(bundleDir, { recursive: true, force: true });
}
