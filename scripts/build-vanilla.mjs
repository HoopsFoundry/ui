// Baut das Vanilla-Paket: dist/vanilla/hoops.js (Kern: initX, initAll, Sprach-API …), hoops-render.js (renderX/mountX), hoops-map.js (Karte: renderMap/initMap/
// mountMap) und hoops-i18n-de.js (deutscher Katalog, registriert sich beim Import), je als ES-Modul und minifiziert (.min.js), mit Quellkarten und zusammengeführten
// Typen (hoops.d.ts, hoops-render.d.ts, hoops-map.d.ts, hoops-i18n-de.d.ts), dazu hoops.css (tokens + components) und die Court-Linien, auf die hoops.css verweist.
// hoops-render.js, hoops-map.js und hoops-i18n-de.js bringen das Accordion-Verhalten und den Sprachkern (js/i18n/index.js, js/i18n-events.js) nicht selbst mit,
// sondern importieren sie aus dem Kern (./hoops.js bzw. ./hoops.min.js im selben Ordner): so gibt es genau eine Kopie auf der Seite (eine Sprache, eine Registrierung).
// `npm run build:vanilla`; die Tests rufen buildVanilla() mit einem eigenen Zielordner auf.
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function buildVanilla({ outDir = `${root}dist/vanilla` } = {}) {
  const pkg = JSON.parse(await readFile(`${root}package.json`, 'utf8'));
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const common = {
    config: false, silent: true, format: ['esm'], platform: 'browser', target: 'es2020', bundle: true, splitting: false, clean: false,
    outDir, sourcemap: true, tsconfig: `${root}react/tsconfig.json`, define: { __HOOPS_VERSION__: JSON.stringify(pkg.version) },
  };
  const entry = `${root}js/vanilla.js`;
  await build({ ...common, entry: { hoops: entry }, minify: false });
  await build({ ...common, entry: { 'hoops.min': entry }, minify: true });
  await build({ ...common, entry: { hoops: `${root}js/vanilla.d.ts` }, dts: { only: true }, sourcemap: false });

  // Bündel neben dem Kern: Accordion und Sprachkern kommen aus dem Kern (externer Import desselben Ordners), alles andere ist gebündelt
  const shared = new Set(['js/accordion.js', 'js/i18n/index.js', 'js/i18n-events.js'].map((path) => resolve(root, path)));
  const coreAs = (file) => ({
    name: 'hoops-core-external',
    setup(b) {
      b.onResolve({ filter: /\.js$/ }, (args) => {
        if (args.kind === 'entry-point' || !args.path.startsWith('.')) return undefined;
        return shared.has(resolve(args.resolveDir, args.path)) ? { path: `./${file}`, external: true } : undefined;
      });
    },
  });
  const renderEntry = `${root}js/render/index.js`;
  await build({ ...common, entry: { 'hoops-render': renderEntry }, minify: false, esbuildPlugins: [coreAs('hoops.js')] });
  await build({ ...common, entry: { 'hoops-render.min': renderEntry }, minify: true, esbuildPlugins: [coreAs('hoops.min.js')] });
  await build({ ...common, entry: { 'hoops-render': `${root}js/render/index.d.ts` }, dts: { only: true }, sourcemap: false });

  // Karten-Bündel: eigenes Bündel (Leaflet-Anbindung, Zustände, Markup), Leaflet bleibt außerhalb (dynamischer Import erst nach dem Klick);
  // Sprachkern und Ereignis kommen aus dem Kern
  const mapEntry = `${root}js/map-bundle.js`;
  await build({ ...common, entry: { 'hoops-map': mapEntry }, minify: false, external: ['leaflet'], esbuildPlugins: [coreAs('hoops.js')] });
  await build({ ...common, entry: { 'hoops-map.min': mapEntry }, minify: true, external: ['leaflet'], esbuildPlugins: [coreAs('hoops.min.js')] });
  await build({ ...common, entry: { 'hoops-map': `${root}js/map-bundle.d.ts` }, dts: { only: true }, sourcemap: false });

  // Deutsches Sprachbündel: der Katalog `de`, registriert sich beim Import über registerLocale des Kerns (./hoops.js im selben Ordner)
  const deEntry = `${root}js/i18n/de-register.js`;
  await build({ ...common, entry: { 'hoops-i18n-de': deEntry }, minify: false, esbuildPlugins: [coreAs('hoops.js')] });
  await build({ ...common, entry: { 'hoops-i18n-de.min': deEntry }, minify: true, esbuildPlugins: [coreAs('hoops.min.js')] });
  await build({ ...common, entry: { 'hoops-i18n-de': `${root}js/i18n/catalog.d.ts` }, dts: { only: true }, sourcemap: false });

  // CSS: Tokens zuerst, dann die Komponenten; die Version steht als Eigenschaft auf :root (Abgleich mit VERSION im Bündel)
  const tokens = await readFile(`${root}tokens/tokens.css`, 'utf8');
  const components = await readFile(`${root}css/components.css`, 'utf8');
  const banner = `/* ${pkg.name} ${pkg.version} · tokens.css + components.css · Schriften (fonts/fonts.css) werden nicht mitgeliefert */\n:root { --hoops-version: "${pkg.version}"; }\n`;
  await writeFile(`${outDir}/hoops.css`, `${banner}${tokens}\n${components}`);
  await cp(`${root}css/courtlines`, `${outDir}/courtlines`, { recursive: true });
  return { outDir, version: pkg.version };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildVanilla();
  console.log(`dist/vanilla gebaut (${result.version}) in ${result.outDir}`);
}
