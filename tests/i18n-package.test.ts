// @vitest-environment node
// Auslieferung der Sprachmodule: Bündler dürfen den Import von `@hoopsfoundry/ui/i18n/de` nicht verwerfen (sideEffects).
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';
import { mutate } from './helpers/mutation';

const root = process.cwd();
const pkgText = readFileSync(resolve(root, 'package.json'), 'utf8');

/** Baut `import '@hoopsfoundry/ui/i18n/de'; setLocale('de'); t('modal.close')` mit der package.json (Text) in einer Sandbox. */
async function bundle(packageJson: string) {
  const dir = mkdtempSync(join(tmpdir(), 'hoops-i18n-pkg-'));
  const pkgDir = join(dir, 'node_modules', '@hoopsfoundry', 'ui');
  mkdirSync(pkgDir, { recursive: true });
  cpSync(resolve(root, 'js'), join(pkgDir, 'js'), { recursive: true });
  writeFileSync(join(pkgDir, 'package.json'), packageJson);
  writeFileSync(join(dir, 'app.js'), "import '@hoopsfoundry/ui/i18n/de';\nimport { setLocale, t } from '@hoopsfoundry/ui/i18n';\nsetLocale('de');\nglobalThis.__out = t('modal.close');\n");
  const result = await build({ entryPoints: [join(dir, 'app.js')], bundle: true, write: false, format: 'esm', logLevel: 'silent', treeShaking: true, charset: 'utf8' });
  return result.outputFiles[0].text;
}

describe('sideEffects für das deutsche Sprachmodul', () => {
  it('package.json nennt den Pfad von de-register.js', () => {
    const list = JSON.parse(pkgText).sideEffects as string[];
    expect(list).toContain('./js/i18n/de-register.js');
    expect(list).toContain('**/*.css');
  });
  it('ein Bündler behält den Import und das Bündel enthält den deutschen Text', async () => {
    const out = await bundle(pkgText);
    expect(out).toContain('Schließen');
  });
  it('Mutation: ohne den Eintrag verwirft der Bündler den Import (Test würde rot)', async () => {
    const broken = mutate(pkgText, ',\n    "./js/i18n/de-register.js"', '');
    expect(await bundle(broken)).not.toContain('Schließen');
  });
});

// Das deutsche Vanilla-Bündel (dist/vanilla/hoops-i18n-de.js): ein Bündler darf den Import nicht verwerfen, und es teilt den Kern mit hoops.js.
import { bundleDir } from './helpers/bundle-dir';
import { existsSync } from 'node:fs';

async function bundleDe(packageJson: string) {
  const dir = mkdtempSync(join(tmpdir(), 'hoops-i18n-de-'));
  const pkgDir = join(dir, 'node_modules', '@hoopsfoundry', 'ui');
  mkdirSync(join(pkgDir, 'dist'), { recursive: true });
  cpSync(bundleDir, join(pkgDir, 'dist', 'vanilla'), { recursive: true });
  writeFileSync(join(pkgDir, 'package.json'), packageJson);
  writeFileSync(join(dir, 'app.js'), "import { setLocale, t } from '@hoopsfoundry/ui/vanilla';\nimport '@hoopsfoundry/ui/vanilla/hoops-i18n-de.js';\nsetLocale('de');\nglobalThis.__out = t('modal.close');\n");
  const result = await build({ entryPoints: [join(dir, 'app.js')], bundle: true, write: false, format: 'esm', logLevel: 'silent', treeShaking: true, charset: 'utf8' });
  return result.outputFiles[0].text;
}

describe('Bündel hoops-i18n-de.js', () => {
  it('liegt in dist/vanilla (js, min, Typen) und die package.json nennt es als Datei mit Nebenwirkung', () => {
    for (const name of ['hoops-i18n-de.js', 'hoops-i18n-de.min.js', 'hoops-i18n-de.d.ts']) expect(existsSync(join(bundleDir, name)), name).toBe(true);
    const list = JSON.parse(pkgText).sideEffects as string[];
    expect(list).toContain('./dist/vanilla/hoops-i18n-de.js');
    expect(list).toContain('./dist/vanilla/hoops-i18n-de.min.js');
  });
  it('ein Bündler behält den Import; hoops.js und das deutsche Bündel teilen dieselbe Kern-Instanz (t liefert „Schließen“)', async () => {
    const out = await bundleDe(pkgText);
    expect(out).toContain('Schließen');
    // genau eine Kopie des Kerns: die Schlüssel des englischen Katalogs stehen einmal im Ergebnis
    expect(out.split('"modal.close": "Close"').length - 1 + out.split("'modal.close': 'Close'").length - 1).toBe(1);
  });
  it('Mutation: ohne den Eintrag in sideEffects verwirft der Bündler den Import des Bündels', async () => {
    const broken = mutate(pkgText, ',\n    "./dist/vanilla/hoops-i18n-de.js"', '');
    expect(await bundleDe(broken)).not.toContain('Schließen');
  });
});
