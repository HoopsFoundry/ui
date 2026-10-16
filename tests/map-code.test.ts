// @vitest-environment node
// Code-Beispiele und Beispiele der Karten-Doku (stories/Map.code.ts, components/MapExamples.svelte, examples/*): React per TypeScript-Compiler,
// Svelte per Server-Rendering, Vanilla-Beispiel gegen map.js und gespieltes Leaflet, Kachel-Rezepte (Endpunkt kompiliert und ausgeführt, nginx geprüft).
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer, type ViteDevServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import * as map from '../stories/Map.code';
import * as mapjs from '../js/map.js';

const rootDir = new URL('../', import.meta.url).pathname;
const tmpDir = `${rootDir}tests/.code-tmp-map/`;
let vite: ViteDevServer;
let render: (component: unknown, options: { props: Record<string, unknown> }) => { body: string };

beforeAll(async () => {
  mkdirSync(tmpDir, { recursive: true });
  vite = await createServer({
    root: rootDir, configFile: false, plugins: [svelte({ configFile: rootDir + 'svelte.config.js', compilerOptions: { generate: 'server', dev: false } })],
    esbuild: { jsx: 'automatic' }, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error',
  });
  render = ((await vite.ssrLoadModule('svelte/server')) as { render: typeof render }).render;
}, 60000);
afterAll(async () => {
  await vite?.close();
  rmSync(tmpDir, { recursive: true, force: true });
});

const read = (p: string) => readFileSync(`${rootDir}${p}`, 'utf8');

describe('Svelte-Code-Beispiel rendert (SSR)', () => {
  it('svelte: zwei Karten mit eigenem Namen, Platzhalter des Auto-Ladens, Liste mit Links', async () => {
    const file = `${tmpDir}svelte.svelte`;
    writeFileSync(file, map.svelte.replace(/@hoopsfoundry\/ui\/svelte\/(\w+)/g, (_m, comp: string) => `${rootDir}svelte/${comp}.svelte`));
    const component = ((await vite.ssrLoadModule(file)) as { default: unknown }).default;
    const html = render(component, { props: {} }).body;
    expect(html).not.toContain('undefined');
    expect(html.match(/role="region" aria-label="[^"]+"/g)).toEqual(['role="region" aria-label="Hallen im Kreis Nordhain"', 'role="region" aria-label="Lage der Sporthalle Nordhain"']);
    expect(html).toContain('data-state="loading"');
    expect(html).toContain('data-state="idle"');
    expect(html).toContain('Mehrzweckhalle Seeberg');
    expect(html).toContain('In Karten-App öffnen');
    expect(html).toContain('geo:49.3,7.9?q=49.3,7.9(Sporthalle%20Nordhain)');
    expect(html).toContain('href="/hallen/seeberg"');
  });
});

describe('React-Code-Beispiel besteht den TypeScript-Compiler', () => {
  it('ohne Fehler', () => {
    const files: Record<string, string> = {};
    const imports = map.react.match(/^import [^;]+;$/gm) ?? [];
    const rest = map.react.replace(/^import [^;]+;$/gm, '').trim();
    const split = rest.search(/\n\n(\{\/\*|<)/);
    const head = split < 0 ? '' : rest.slice(0, split);
    const body = split < 0 ? rest : rest.slice(split);
    files[`${rootDir}react/__code_map.tsx`] = [
      ...imports.map((line) => line.replace('@hoopsfoundry/ui/react', './index')),
      head,
      `export const Demo_map = () => (\n<>${body}</>\n);`,
    ].join('\n');
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020, lib: ['lib.es2020.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'], module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, strict: true, noEmit: true, skipLibCheck: true,
      isolatedModules: true, noUnusedLocals: false, types: [],
    };
    const host = ts.createCompilerHost(options);
    const original = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, ...more) =>
      fileName in files ? ts.createSourceFile(fileName, files[fileName], languageVersion) : original(fileName, languageVersion, ...more);
    const exists = host.fileExists.bind(host);
    host.fileExists = (fileName) => fileName in files || exists(fileName);
    const readFile = host.readFile.bind(host);
    host.readFile = (fileName) => files[fileName] ?? readFile(fileName);
    const program = ts.createProgram(Object.keys(files), options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file && d.file.fileName in files);
    expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
  }, 60000);
});

describe('Funktionen aus map.js: die Aufrufe im Beispiel werden ausgewertet und liefern die kommentierten Werte', () => {
  // [Aufruf wie im Beispiel, erwartetes Ergebnis]
  const CALLS: [string, unknown][] = [
    ['formatCoords(49.4875, 8.466)', '49,4875° N, 8,4660° O'],
    ['formatCoords(-33.8688, 151.2093)', '33,8688° S, 151,2093° O'],
    ["mapLinks({ lat: 49.3, lng: 7.9, label: 'Halle Süd & West' }).geo", 'geo:49.3,7.9?q=49.3,7.9(Halle%20S%C3%BCd%20%26%20West)'],
    ['mapLinks({ lat: 49.3, lng: 7.9 }).route', 'https://www.openstreetmap.org/directions?route=%3B49.3%2C7.9'],
    ["validTileUrl('/tiles/{z}/{x}/{y}.png')", true],
    ["validTileUrl('http://tile.example.org/{z}/{x}/{y}.png')", false],
    ['isCoord(91, 0)', false],
    ['boundsOf([{ lat: 49.3, lng: 7.9 }, { lat: 49.31, lng: 7.92 }])', { sw: [49.3, 7.9], ne: [49.31, 7.92] }],
  ];
  it('jeder Aufruf steht im Beispiel mit seinem Kommentar, und das Ergebnis stimmt', async () => {
    const lines = map.funktionenJs.split('\n');
    const literal = (value: unknown) => (typeof value === 'string' ? `'${value}'` : typeof value === 'object' ? '{ sw: [49.3, 7.9], ne: [49.31, 7.92] }' : String(value));
    for (const [expr, expected] of CALLS) {
      const line = lines.find((l) => l.startsWith(`${expr};`));
      expect(line, expr).toBeDefined();
      expect(line, expr).toContain(`// ${literal(expected)}`.replace(/^\/\/ (\{.*)$/, '// $1'));
    }
    const file = `${tmpDir}funktionen.mjs`;
    writeFileSync(file, `${map.funktionenJs.replace("'@hoopsfoundry/ui/map.js'", `'${rootDir}js/map.js'`)}\nexport const results = [${CALLS.map(([expr]) => expr).join(',\n')}];\n`);
    const mod = (await vite.ssrLoadModule(file)) as { results: unknown[] };
    expect(mod.results).toEqual(CALLS.map(([, expected]) => expected));
  });
});

describe('Beispiel „Leaflet direkt“ (leafletDirekt)', () => {
  const script = map.leafletDirekt.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  it('der Skriptteil importiert nur vorhandene Exporte aus map.js', () => {
    const named = script.match(/import \{([^}]+)\} from '@hoopsfoundry\/ui\/map\.js'/)![1].split(',').map((s) => s.trim());
    for (const name of named) expect(mapjs, name).toHaveProperty(name);
  });
  it('der Pin im Beispiel hat dieselbe Form wie der Pin der Komponente', () => {
    const path = read('js/map-leaflet.js').match(/const PIN_PATH = '([^']+)'/)![1];
    expect(map.leafletDirekt.split(path)).toHaveLength(3);
  });
  it('alle hoops-map-Klassen im Markup gibt es im CSS', () => {
    const css = read('css/components.css');
    const classes = new Set([...map.leafletDirekt.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter((c) => c.startsWith('hoops-map')));
    expect(classes.size).toBeGreaterThan(8);
    for (const cls of classes) expect(css, cls).toMatch(new RegExp(`\\.${cls}(?![\\w-])`));
  });
  it('das Skript läuft gegen das gespielte Leaflet: Karte, Kachelebene, Marker, Koordinaten und Routen-Link', async () => {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(`<body>${map.leafletDirekt.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*<\/script>/, '')}</body>`, { runScripts: 'outside-only' });
    const mock = await import('./helpers/leaflet-mock');
    mock.reset();
    // Das Skript ist ein ES-Modul: Import-Zeilen durch die lokalen Module ersetzen und im DOM von jsdom ausführen
    const body = script.replace(/import L from 'leaflet';/, '').replace(/import \{([^}]+)\} from '@hoopsfoundry\/ui\/map\.js';/, '');
    const { formatCoords, mapLinks, validTileUrl } = mapjs;
    const L = mock.L;
    const run = new dom.window.Function('L', 'formatCoords', 'mapLinks', 'validTileUrl', 'document', body);
    const prior = globalThis.document;
    // das gespielte Leaflet baut DOM mit dem globalen document: jsdom-Dokument bereitstellen
    (globalThis as { document?: unknown }).document = dom.window.document;
    try {
      run(L, formatCoords, mapLinks, validTileUrl, dom.window.document);
    } finally {
      (globalThis as { document?: unknown }).document = prior;
    }
    const m = mock.lastMap();
    expect(m.options).toMatchObject({ zoomControl: false, attributionControl: false, minZoom: 3, maxZoom: 19 });
    expect(m.view[0]).toMatchObject({ center: [49.3, 7.9], zoom: 15 });
    expect(mock.lastLayer().url).toBe('/tiles/{z}/{x}/{y}.png');
    expect(mock.lastLayer().options.className).toBe('hoops-map-tiles');
    expect(mock.state.markers[0].options).toMatchObject({ title: 'Sporthalle Nordhain', keyboard: true });
    expect(dom.window.document.getElementById('karte-koordinaten')!.textContent).toBe('49,3000° N, 7,9000° O');
    expect(dom.window.document.getElementById('karte-route')!.getAttribute('href')).toBe('https://www.openstreetmap.org/directions?route=%3B49.3%2C7.9');
  });
});

describe('Rezept: Kachel-Endpunkt (stories/examples/kachel-endpunkt.ts)', () => {
  const source = read('stories/examples/kachel-endpunkt.ts');
  it('besteht den TypeScript-Compiler (strict, DOM-Typen für fetch und Response)', () => {
    const file = `${rootDir}stories/examples/kachel-endpunkt.ts`;
    const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2022, lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'], module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, strict: true, noEmit: true, skipLibCheck: true, types: [] };
    const program = ts.createProgram([file], options);
    const diagnostics = ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === file);
    expect(diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))).toEqual([]);
  });
  it('liegt in der Doku als dieselbe Datei', () => expect(map.kachelEndpunktTs).toBe(source));

  type Endpoint = { parseTilePath: (path: string) => { z: number; x: number; y: number } | null; GET: (event: { params: { path: string } }) => Promise<Response> };
  const load = async (): Promise<Endpoint> => {
    const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
    const file = `${tmpDir}endpoint.mjs`;
    writeFileSync(file, js);
    return (await vite.ssrLoadModule(file)) as Endpoint;
  };

  it.each<[string, { z: number; x: number; y: number } | null]>([
    ['0/0/0.png', { z: 0, x: 0, y: 0 }],
    ['5/17/10.png', { z: 5, x: 17, y: 10 }],
    ['19/524287/524287.png', { z: 19, x: 524287, y: 524287 }],
    ['19/524288/0.png', null],
    ['19/0/524288.png', null],
    ['20/0/0.png', null],
    ['0/1/0.png', null],
    ['1/2/0.png', null],
    ['1/1/1.png', { z: 1, x: 1, y: 1 }],
    ['05/1/1.png', null],
    ['5/01/1.png', null],
    ['5/1/1.jpg', null],
    ['5/1/1', null],
    ['5/1/1.png/', null],
    ['5/1/1.png?x=1', null],
    ['-1/0/0.png', null],
    ['5/-1/0.png', null],
    ['5/1.5/0.png', null],
    ['5/1/1.PNG', null],
    ['../etc/passwd', null],
    ['5/../1.png', null],
    ['5/1/1.png%00', null],
    ['https://evil.example/1/1/1.png', null],
    ['//evil.example/1/1.png', null],
    ['', null],
    ['5/1', null],
    ['5/1/1/1.png', null],
    [' 5/1/1.png', null],
    ['5/1/1.png\n', null],
    ['1e1/1/1.png', null],
  ])('parseTilePath(%j)', async (path, expected) => {
    expect((await load()).parseTilePath(path)).toEqual(expected);
  });

  it('GET: ruft nur den festen Host mit den geprüften Zahlen ab, setzt den User-Agent und reicht Cache-Control durch', async () => {
    const endpoint = await load();
    const fetchMock = vi.fn(async () => new Response('PNGDATA', { status: 200, headers: { 'Cache-Control': 'max-age=3600', 'Set-Cookie': 'x=1' } }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const response = await endpoint.GET({ params: { path: '5/17/10.png' } });
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      expect(response.headers.get('Cache-Control')).toBe('max-age=3600');
      expect(response.headers.get('Set-Cookie')).toBeNull();
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(await response.text()).toBe('PNGDATA');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
      expect(url).toBe('https://tile.openstreetmap.org/5/17/10.png');
      expect(init.headers['User-Agent']).toMatch(/^Hallenkarte-Nordhain\/1\.0 \(\+https:\/\/beispiel\.example\/kontakt\)$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('GET: ohne Cache-Control des Kartendienstes gilt ein Tag', async () => {
    const endpoint = await load();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 200 })));
    try {
      expect((await endpoint.GET({ params: { path: '1/0/1.png' } })).headers.get('Cache-Control')).toBe('public, max-age=86400');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('GET: ungültige Pfade ergeben 404 und rufen den Kartendienst nie ab (kein offener Proxy)', async () => {
    const endpoint = await load();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    try {
      for (const path of ['../x', 'https://evil.example/a.png', '25/1/1.png', '3/9/1.png', '3/1/1.gif', '3/1/1.png?host=evil']) {
        const response = await endpoint.GET({ params: { path } });
        expect(response.status, path).toBe(404);
      }
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('GET: Fehler oder Absturz des Kartendienstes ergeben 502', async () => {
    const endpoint = await load();
    try {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 503 })));
      expect((await endpoint.GET({ params: { path: '3/1/1.png' } })).status).toBe(502);
      vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Netz weg'); }));
      expect((await endpoint.GET({ params: { path: '3/1/1.png' } })).status).toBe(502);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('GET: bei Fehlern des Kartendienstes wird dessen Antwort verworfen (body.cancel), die Verbindung bleibt nicht hängen', async () => {
    const endpoint = await load();
    const cancel = vi.fn(async () => {});
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 429, body: { cancel }, headers: new Headers() })));
    try {
      expect((await endpoint.GET({ params: { path: '3/1/1.png' } })).status).toBe(502);
      expect(cancel).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('der Quelltext enthält keine frei wählbare URL: der Host steht fest, fetch hat nur diese eine Aufrufstelle', () => {
    expect(source.match(/fetch\(/g)).toHaveLength(1);
    expect(source).toMatch(/const TILE_HOST = 'https:\/\/tile\.openstreetmap\.org';/);
    expect(source).not.toMatch(/request\.url|searchParams|params\.(url|host)/);
  });
});

describe('Rezept: nginx (stories/examples/nginx-tiles.conf)', () => {
  const conf = read('stories/examples/nginx-tiles.conf');
  const code = conf.split('\n').map((l) => l.replace(/#.*$/, '').trimEnd()).filter(Boolean);
  it('liegt in der Doku als dieselbe Datei', () => expect(map.nginxConf).toBe(conf));
  it('enthält die verlangten Direktiven', () => {
    for (const needle of ['proxy_cache_path', 'proxy_cache_valid', 'proxy_set_header User-Agent', 'proxy_pass https://tile.openstreetmap.org;', 'proxy_ssl_server_name on;', 'proxy_cache osm_tiles;']) {
      expect(conf, needle).toContain(needle);
    }
    expect(conf).toContain('location ~ ^/tiles/(\\d|1\\d)/(\\d{1,7})/(\\d{1,7})\\.png$ {');
    // keyzone passt zu proxy_cache_path
    expect(conf).toMatch(/keys_zone=osm_tiles:/);
    expect(conf).toMatch(/limit_req_zone [^;]*zone=tiles:/);
    expect(conf).toMatch(/limit_req zone=tiles /);
  });
  it('Aufbau: Klammern ausgeglichen, jede Anweisung endet mit Semikolon oder Klammer', () => {
    let depth = 0;
    for (const line of code) {
      for (const ch of line) {
        if (ch === '{') depth++;
        if (ch === '}') depth--;
        expect(depth).toBeGreaterThanOrEqual(0);
      }
      expect(line, line).toMatch(/[;{}]$/);
    }
    expect(depth).toBe(0);
  });
  it('proxy_pass hat keinen URI-Teil (im Regex-Location nicht erlaubt) und keine Variablen (sonst wäre ein resolver nötig)', () => {
    const passes = code.filter((l) => l.trim().startsWith('proxy_pass'));
    expect(passes).toEqual(['        proxy_pass https://tile.openstreetmap.org;']);
  });
  it('proxy_cache_path steht außerhalb von server und location (http-Ebene), limit_req_zone ebenfalls', () => {
    const firstServer = code.findIndex((l) => l.startsWith('server'));
    expect(code.findIndex((l) => l.startsWith('proxy_cache_path'))).toBeLessThan(firstServer);
    expect(code.findIndex((l) => l.startsWith('limit_req_zone'))).toBeLessThan(firstServer);
  });
  it('das Pfadmuster der location lässt nur Kachelpfade durch (als JavaScript-Muster nachgestellt)', () => {
    const pattern = conf.match(/location ~ (\S+) \{/)![1];
    const re = new RegExp(pattern.replace(/\//g, '\\/').replace(/\\\\/g, '\\'));
    for (const ok of ['/tiles/5/17/10.png', '/tiles/0/0/0.png', '/tiles/19/524287/1.png', '/tiles/10/1/1.png', '/tiles/1/0/9999999.png']) expect(re.test(ok), ok).toBe(true);
    for (const bad of ['/tiles/5/17/10.jpg', '/tiles/5/17/10.png/x', '/tiles/../etc/passwd', '/tiles/5/17/10.png?x=1', '/tiles/a/b/c.png', '/tiles/5/17.png', 'https://x/tiles/5/1/1.png', '/other/5/1/1.png', '/tiles/5/1/1.png\n', '/tiles/20/1/1.png', '/tiles/25/1/1.png', '/tiles/99/1/1.png', '/tiles/000/1/1.png', '/tiles/5/12345678/1.png', '/tiles/5/1/12345678.png']) {
      expect(re.test(bad), bad).toBe(false);
    }
  });
  it('rewrite entfernt nur das Präfix /tiles', () => {
    const [, from, to] = conf.match(/rewrite (\S+) (\S+) break;/)!;
    expect(from).toBe('^/tiles/(.*)$');
    expect('/tiles/5/17/10.png'.replace(new RegExp(from), to.replace('$1', '$$1'))).toBe('/5/17/10.png');
  });
  it('die Doku nennt: nicht ausgeführt, vor Gebrauch testen', () => {
    expect(read('stories/Map.mdx')).toContain('**Geprüft mit `nginx -t`**');
    expect(read('stories/Map.mdx')).toContain('`nginx -t`');
  });
});

describe('Beispiele der Doku-Seite', () => {
  const stories = read('stories/Map.stories.ts');
  const mdx = read('stories/Map.mdx');
  const examplesSrc = read('stories/components/MapExamples.svelte');
  const names = [...stories.matchAll(/example\('([\w-]+)'\)/g)].map((m) => m[1]);
  const renderExample = async (example: string) => {
    const Examples = ((await vite.ssrLoadModule(`${rootDir}stories/components/MapExamples.svelte`)) as { default: unknown }).default;
    return render(Examples, { props: { example } }).body;
  };
  const labels = (html: string) => [...html.matchAll(/role="region" aria-label="([^"]*)"/g)].map((m) => m[1]);

  it('vor dem ersten Beispiel steht eine ##-Überschrift', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
  });
  it('jede im MDX genutzte Story gibt es, jedes Beispiel gibt es in der Beispielkomponente', () => {
    for (const m of mdx.matchAll(/MapStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\b`));
    for (const name of names) expect(examplesSrc, name).toContain(`example === '${name}'`);
    expect(names.length).toBeGreaterThanOrEqual(18);
  });
  it('jedes Beispiel rendert eine Karte ohne „undefined“', async () => {
    for (const example of names) {
      const html = await renderExample(example);
      expect(html, example).not.toContain('undefined');
      // Vanilla-Beispiele entstehen erst im Browser (mountMap in einer Svelte-Aktion), die Code-Beispiele sind Text
      if (!['zustaende', 'sitz-pins'].includes(example) && !/^(vanilla|do-lokal|dont-lokal)/.test(example)) expect(html, example).toContain('hoops-map-frame');
    }
  });
  it('Namen der Karten sind eindeutig: je Beispiel und über alle Beispiele einer Docs-Seite (axe landmark-unique)', async () => {
    const all: string[] = [];
    for (const example of names) {
      const found = labels(await renderExample(example));
      expect(new Set(found).size, `${example}: ${found.join(' | ')}`).toBe(found.length);
      if (example !== 'handy') all.push(...found);
    }
    expect(new Set(all).size, `doppelt: ${all.filter((t, i) => all.indexOf(t) !== i).join(', ')}`).toBe(all.length);
  });
  it('Quelltext: kein Label doppelt in der Beispielkomponente', () => {
    const found = [...examplesSrc.matchAll(/label="([^"]+)"/g), ...examplesSrc.matchAll(/label: '([^']+)'/g)].map((m) => m[1]);
    expect(found.length).toBeGreaterThanOrEqual(15);
    expect(found.filter((l, i) => found.indexOf(l) !== i)).toEqual([]);
  });
  it('Beispiele laden keine Kacheln von OpenStreetMap: jede Karte mit load="auto" hat eine lokale tileUrl', () => {
    const maps = examplesSrc.match(/<MapView [^>]*>/g) ?? [];
    for (const m of maps.filter((x) => x.includes('load="auto"'))) expect(m, m).toContain('tileUrl={tile}');
  });
  it('das Demo-Bild wird mit ?no-inline importiert (sonst eine data-Adresse, die validTileUrl ablehnt)', () => {
    expect(read('stories/components/mapData.ts')).toContain("demo.png?no-inline");
  });
  it('Beispiele zeigen nur Demo-Hallen; keine echten Orte, Vereine oder Adressen', () => {
    const data = read('stories/components/mapData.ts') + examplesSrc + read('stories/Map.code.ts');
    expect(data).toContain('Sporthalle Nordhain');
    expect(data + stories).not.toMatch(/Mannheim|Alba|Bayern München|Ratiopharm|Bamberg|Berlin|Hamburg|München/);
    expect(mdx).toContain('Demo-Daten');
  });
  it('Beispiel-Stories sind versteckt (tags !dev), Standard und Spielwiese sichtbar, kein autodocs', () => {
    expect(stories).not.toContain('autodocs');
    expect([...stories.matchAll(/\{ \.\.\.example\('[\w-]+'\), tags: \['!dev'\] \}/g)]).toHaveLength(names.length);
    expect(stories).toMatch(/export const Standard = \{ args/);
    expect(stories).toMatch(/export const Spielwiese = \{/);
  });
  it('die Spielwiese hat zu jeder Prop eine Beschreibung', () => {
    for (const prop of ['label', 'count', 'ownFirst', 'zoom', 'height', 'interactive', 'load', 'tileUrl', 'attribution', 'privacyNote', 'appLinks', 'showList', 'dimInDark', 'darkTiles', 'seat']) {
      expect(stories, prop).toMatch(new RegExp(`\\n\\s+${prop}: \\{ control: [^\\n]*description: `));
    }
  });
  it("sechs Dos und Don'ts, jedes mit zwei Geschichten", () => {
    expect([...mdx.matchAll(/doText:/g)]).toHaveLength(6);
    for (const n of ['Adresse', 'Datenschutz', 'Liste', 'Quelle', 'Sitz', 'Lokal']) {
      expect(stories).toContain(`Do${n} `);
      expect(stories).toContain(`Dont${n} `);
    }
  });
  it('Don\'ts stellen den Fehler nach: Liste, Quellenangabe ausgeblendet (lokales CSS), sofort geladen', async () => {
    expect(examplesSrc).toMatch(/\.no-text :global\(\.hoops-map-text\) \{ display: none; \}/);
    expect(examplesSrc).toMatch(/\.no-attr :global\(\.hoops-map-attr\) \{ display: none; \}/);
    expect(await renderExample('dont-datenschutz')).toContain('data-state="loading"');
    expect(await renderExample('do-datenschutz')).toContain('Karte laden');
  });
  it('Doku nennt Policy-URL, Proxy, Pflichten, Zwei-Klick, Leaflet-CSS und die Lizenz', () => {
    expect(mdx).toContain('https://operations.osmfoundation.org/policies/tiles/');
    for (const needle of ['## Datenschutz und Kachelserver', 'Proxy-Variante', 'User-Agent', 'Cache-Control', 'Vorabladen', 'Auftragsverarbeitungsvertrag', 'leaflet/dist/leaflet.css', 'BSD-2-Clause', 'keinen Serverteil', '`MapView`']) {
      expect(mdx.toLowerCase(), needle).toContain(needle.toLowerCase());
    }
  });
  it('Einführung, storySort, README und CHANGELOG nennen die Karte', () => {
    expect(read('stories/Introduction.mdx')).toContain('components-map--docs');
    expect(read('.storybook/preview.ts')).toMatch(/'LeagueCard', 'Kennzahlen', 'Map', 'VenueCard', 'Tabs'/);
    expect(read('README.md')).toContain('MapView');
    expect(read('README.md')).toContain('leaflet/dist/leaflet.css');
    expect(read('CHANGELOG.md')).toContain('**`Map` (Karte)**');
  });
});
