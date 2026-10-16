// Baut das Vanilla-Paket: dist/vanilla/hoops.js (Kern: initX, initAll …), hoops-render.js (renderX/mountX) und hoops-map.js (Karte: renderMap/initMap/
// mountMap), je als ES-Modul und minifiziert (.min.js), mit Quellkarten und zusammengeführten Typen (hoops.d.ts, hoops-render.d.ts, hoops-map.d.ts), dazu hoops.css (tokens + components) und die Court-Linien,
// auf die hoops.css verweist. hoops-render.js bringt das Accordion-Verhalten nicht selbst mit, sondern importiert es aus dem Kern (./hoops.js
// bzw. ./hoops.min.js im selben Ordner): so gibt es genau eine Kopie des Verhaltens auf der Seite. `npm run build:vanilla`; die Tests rufen buildVanilla() mit einem eigenen Zielordner auf.
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
    outDir, sourcemap: true, tsconfig: `${root}react/tsconfig.json`, define: { __HOOPS_VERSION__: JSON.stringify(pkg.version) },
  };
  const entry = `${root}js/vanilla.js`;
  await build({ ...common, entry: { dss: entry }, minify: false });
  await build({ ...common, entry: { 'dss.min': entry }, minify: true });
  await build({ ...common, entry: { dss: `${root}js/vanilla.d.ts` }, dts: { only: true }, sourcemap: false });

  // Render-Bündel: das Accordion kommt aus dem Kern (externer Import desselben Ordners), alles andere ist gebündelt
  const coreAs = (file) => ({
    name: 'hoops-core-external',
    setup(b) {
      b.onResolve({ filter: /[\\/]accordion\.js$/ }, () => ({ path: `./${file}`, external: true }));
    },
  });
  const renderEntry = `${root}js/render/index.js`;
  await build({ ...common, entry: { 'hoops-render': renderEntry }, minify: false, esbuildPlugins: [coreAs('hoops.js')] });
  await build({ ...common, entry: { 'hoops-render.min': renderEntry }, minify: true, esbuildPlugins: [coreAs('hoops.min.js')] });
  await build({ ...common, entry: { 'hoops-render': `${root}js/render/index.d.ts` }, dts: { only: true }, sourcemap: false });

  // Karten-Bündel: eigenes Bündel (Leaflet-Anbindung, Zustände, Markup), Leaflet bleibt außerhalb (dynamischer Import erst nach dem Klick)
  const mapEntry = `${root}js/map-bundle.js`;
  await build({ ...common, entry: { 'hoops-map': mapEntry }, minify: false, external: ['leaflet'] });
  await build({ ...common, entry: { 'hoops-map.min': mapEntry }, minify: true, external: ['leaflet'] });
  await build({ ...common, entry: { 'hoops-map': `${root}js/map-bundle.d.ts` }, dts: { only: true }, sourcemap: false });

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
