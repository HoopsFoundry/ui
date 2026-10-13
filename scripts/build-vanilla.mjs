// Baut das Vanilla-Paket: dist/vanilla/dss.js (ES-Modul), dss.min.js, Quellkarten, dss.d.ts (zusammengeführt), dss.css (tokens + components)
// und die Court-Linien, auf die dss.css verweist. `npm run build:vanilla`; die Tests rufen buildVanilla() mit einem eigenen Zielordner auf.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function buildVanilla({ outDir = `${root}dist/vanilla` } = {}) {
  const pkg = JSON.parse(await readFile(`${root}package.json`, 'utf8'));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const common = {
    config: false, silent: true, format: ['esm'], platform: 'browser', target: 'es2020', bundle: true, splitting: false, clean: false,
    outDir, sourcemap: true, tsconfig: `${root}react/tsconfig.json`, define: { __DSS_VERSION__: JSON.stringify(pkg.version) },
  };
  const entry = `${root}js/vanilla.js`;
  await build({ ...common, entry: { dss: entry }, minify: false });
  await build({ ...common, entry: { 'dss.min': entry }, minify: true });
  await build({ ...common, entry: { dss: `${root}js/vanilla.d.ts` }, dts: { only: true }, sourcemap: false });

  // CSS: Tokens zuerst, dann die Komponenten; die Version steht als Eigenschaft auf :root (Abgleich mit VERSION im Bündel)
  const tokens = await readFile(`${root}tokens/tokens.css`, 'utf8');
  const components = await readFile(`${root}css/components.css`, 'utf8');
  const banner = `/* ${pkg.name} ${pkg.version} · tokens.css + components.css · Schriften (fonts/fonts.css) werden nicht mitgeliefert */\n:root { --dss-version: "${pkg.version}"; }\n`;
  await writeFile(`${outDir}/dss.css`, `${banner}${tokens}\n${components}`);
  await cp(`${root}css/courtlines`, `${outDir}/courtlines`, { recursive: true });
  return { outDir, version: pkg.version };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildVanilla();
  console.log(`dist/vanilla gebaut (${result.version}) in ${result.outDir}`);
}
