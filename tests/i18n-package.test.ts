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
