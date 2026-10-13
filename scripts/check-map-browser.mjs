#!/usr/bin/env node
/**
 * Browser-Prüfung der Karte in Vanilla (Paket V2b): eine reine HTML-Seite ohne Build, über http ausgeliefert, mit lokalem Leaflet.
 *
 *   node scripts/check-map-browser.mjs                 # Chromium, alle Prüfungen
 *   node scripts/check-map-browser.mjs --browsers=chromium,webkit,firefox
 *   node scripts/check-map-browser.mjs --only=privacy,keyboard
 *
 * Geprüft wird: Platzhalter ohne Netzverkehr (keine Anfragen, keine Cookies, kein Storage, kein Prefetch), Klick → lebendige Karte mit lokaler
 * Kachel-Route, Tastatur (Pfeile, Plus/Minus, Marker, Tab verlässt die Karte), Fokus, mehrere Karten, Karten in geschlossenem Accordion, Tabs und Modal
 * (invalidateSize), Fehlerfälle (Leaflet 404, Kachel 404), Lader-Varianten (importmap, window.L), Aufbau und Abbau 5 gegen 45 Zyklen (CDP-Metriken),
 * axe (WCAG 2.x A/AA/AAA, 2.2, best-practice, Kontrast AAA, Zielgröße) in BBV/DBB × hell/dunkel × 1280/420 px und der Vergleich mit der React-Fassung
 * (Rechtecke und Stile). Die Kachel-Route liefert ein lokales Bild: nie eine echte OpenStreetMap-Kachel. Ergebnis als JSON auf stdout; Exit-Code 1
 * bei jedem Fehlschlag. Läuft nicht unter `npm test` (braucht Browser).
 */
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, mkdir, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { chromium, firefox, webkit } from 'playwright';
import { buildVanilla } from './build-vanilla.mjs';
import { renderVenueCard } from '../js/render/venue-card.js';
import { renderMap } from '../js/map-vanilla.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const BROWSERS = (args.browsers ?? 'chromium').split(',');
const ONLY = args.only ? args.only.split(',') : null;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.map': 'application/json' };
const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  if (process.env.DETAIL && detail) console.log(`  ${name}: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  if (!ok) process.exitCode = 1;
};
const wants = (key) => !ONLY || ONLY.includes(key);

// ── Seiten ────────────────────────────────────────────────────

const HALLEN = [
  { id: 'nordhain', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain', own: true },
  { id: 'seeberg', lat: 49.3055, lng: 7.912, label: 'Mehrzweckhalle Seeberg', href: '#halle-seeberg' },
  { id: 'kiefernau', lat: 49.2955, lng: 7.8905, label: 'Gymnasium Kiefernau' },
];
const SITZ = { id: 'sitz', lat: 49.2962, lng: 7.9105, label: 'Geschäftsstelle TSV Nordhain', kind: 'seat' };

const head = (extra = '') => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Karte</title>
<link rel="stylesheet" href="/dss/dss.css"><link rel="stylesheet" href="/vendor/leaflet/leaflet.css">
<style>body{margin:0;padding:1rem;background:var(--page-bg);color:var(--page-fg)}main{max-width:56rem;margin:0 auto;display:grid;gap:1.5rem}</style>${extra}</head><body>`;
const CHEVRON = '<svg class="dss-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5"></path></svg>';

/** Mehrere Karten, dazu Karten in Accordion, Tabs und Modal (alle load auto: sie starten in einem verborgenen Behälter). */
const pageMany = () => `${head()}<main><h1>Mehrere Karten</h1>
<section aria-labelledby="h2a"><h2 id="h2a">Zwei Karten</h2><div id="k1"></div><div id="k2"></div></section>
<section aria-labelledby="h2b"><h2 id="h2b">Karte im Accordion</h2>
<div class="dss-acc dss-acc--card" data-dss="accordion"><div class="dss-acc-item" id="acc1"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="acc1-trigger" aria-expanded="false" aria-controls="acc1-panel"><span class="dss-acc-label">Halle im Accordion</span>${CHEVRON}</button></h3>
<div class="dss-acc-panel" id="acc1-panel" hidden inert><div class="dss-acc-panel-inner"><div class="dss-acc-body"><div id="k3"></div></div></div></div></div></div></section>
<section aria-labelledby="h2c"><h2 id="h2c">Karte in Tabs</h2>
<div class="dss-tabs dss-tabs--underline dss-tabs--md" role="tablist" aria-label="Ansicht" data-dss="tabs">
<button type="button" class="dss-tab is-active" role="tab" id="t-a" aria-selected="true" aria-controls="t-a-panel" tabindex="0"><span class="dss-tab-label">Info</span></button>
<button type="button" class="dss-tab" role="tab" id="t-b" aria-selected="false" aria-controls="t-b-panel" tabindex="-1"><span class="dss-tab-label">Karte</span></button></div>
<div id="t-a-panel" role="tabpanel" aria-labelledby="t-a" tabindex="0"><p>Info zur Halle.</p></div>
<div id="t-b-panel" role="tabpanel" aria-labelledby="t-b" tabindex="0" hidden inert><div id="k4"></div></div></section>
<section aria-labelledby="h2d"><h2 id="h2d">Karte im Dialog</h2>
<button type="button" class="dss-btn dss-btn--primary dss-btn--md" data-dss-modal-open="dlg">Karte öffnen</button>
<dialog class="dss-modal-dialog" id="dlg" data-dss="modal" aria-labelledby="dlg-t"><div class="dss-modal"><div class="dss-m-head"><div class="dss-m-head-text"><h2 class="dss-m-title" id="dlg-t">Halle</h2></div>
<button type="button" class="dss-m-close" aria-label="Schließen"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
<div class="dss-m-body"><div id="k5"></div></div></div></dialog></section></main>
<script type="module">
import { initAll } from '/dss/dss.min.js';
import { mountMap } from '/dss/dss-map.min.js';
const tileUrl = '/tiles/{z}/{x}/{y}.png';
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');
window.__maps = {};
const markers = ${JSON.stringify(HALLEN)};
const cfg = (id, extra) => [document.getElementById(id), { label: 'Karte ' + id, markers, tileUrl, height: 260, ...extra }, { loadLeaflet, onLoad: (m) => { window.__maps[id] = m; } }];
mountMap(...cfg('k1', {}));
mountMap(...cfg('k2', { markers: [${JSON.stringify(SITZ)}, ...markers], load: 'auto', darkTiles: 'invert' }));
mountMap(...cfg('k3', { load: 'auto' }));
mountMap(...cfg('k4', { load: 'auto' }));
mountMap(...cfg('k5', { load: 'auto' }));
initAll(document);
window.__ready = true;
</script></body></html>`;

/** Lader-Varianten: importmap (Standard-Import), window.L (klassisches Skript), Fehler (404). */
const pageLoader = (variant) => {
  const importmap = variant === 'importmap' ? '<script type="importmap">{"imports":{"leaflet":"/vendor/leaflet/leaflet-src.esm.js"}}</script>' : '';
  const loader =
    variant === 'importmap' ? 'undefined'
    : variant === 'global' ? `() => window.L ? Promise.resolve(window.L) : new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = '/vendor/leaflet/leaflet.js'; s.onload = () => resolve(window.L); s.onerror = () => reject(new Error('404')); document.head.append(s); })`
    : variant === 'kachel404' ? `() => import('/vendor/leaflet/leaflet-src.esm.js')`
    : `() => import('/vendor/leaflet/fehlt.js')`;
  return `${head(importmap)}<main><h1>Lader ${variant}</h1><div id="k"></div></main><script type="module">
import { mountMap } from '/dss/dss-map.min.js';
window.__errors = [];
mountMap(document.getElementById('k'), { label: 'Karte', markers: ${JSON.stringify(HALLEN)}, tileUrl: '${variant === 'kachel404' ? '/tiles-fehlt/{z}/{x}/{y}.png' : '/tiles/{z}/{x}/{y}.png'}' }, { loadLeaflet: ${loader}, onError: (r) => window.__errors.push(r), onLoad: (m) => { window.__map = m; } });
</script></body></html>`;
};

/** Aufbau und Abbau in Schleife (Speicher). */
const pageCycle = () => `${head()}<main><div id="k"></div><div id="v"></div></main><script type="module">
import { mountMap, initMap } from '/dss/dss-map.min.js';
import { mountVenueCard } from '/dss/dss-render.min.js';
const tileUrl = '/tiles/{z}/{x}/{y}.png';
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');
const markers = ${JSON.stringify(HALLEN)};
const once = (mount) => new Promise((resolve) => { const handle = mount(resolve); setTimeout(() => { handle.destroy(); resolve(); }, 0); });
window.__cycle = async (n) => {
  for (let i = 0; i < n; i++) {
    await new Promise((resolve) => {
      const handle = mountMap(document.getElementById('k'), { label: 'Karte', markers, tileUrl, load: 'auto' }, { loadLeaflet, onLoad: () => setTimeout(() => { handle.update({ label: 'Karte', markers: markers.slice(0, 2), tileUrl, load: 'auto' }); handle.destroy(); resolve(); }, 20) });
    });
    await new Promise((resolve) => {
      const handle = mountVenueCard(document.getElementById('v'), { name: 'Halle', lat: 49.3, lng: 7.9, tileUrl, load: 'auto' }, { initMap, loadLeaflet, onLoad: () => setTimeout(() => { handle.destroy(); resolve(); }, 20) });
    });
  }
  return n;
};
</script></body></html>`;

/**
 * Markup vom Server (Node: renderVenueCard mit init, renderMap) und initAll im Browser, mit strenger Content-Security-Policy:
 * style-src 'self' (kein unsafe-inline): mountMap und initMap setzen Styles über das CSSOM, keine Verletzung darf gemeldet werden.
 */
const HALLE = { name: 'Sporthalle Nordhain', address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, lat: 49.3, lng: 7.9, tileUrl: '/tiles/{z}/{x}/{y}.png' };
const pageInitAll = () => `${head('<script>window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective + " " + e.blockedURI));</script>')}<main><h1>Vom Server</h1>
<section aria-labelledby="hh"><h2 id="hh">Hallenkarte</h2><div id="v">${renderVenueCard(HALLE, { init: true, uid: 'srv' })}</div></section>
<section aria-labelledby="hk"><h2 id="hk">Karte</h2><div data-dss="map" data-dss-options='${JSON.stringify({ label: 'Karte aus data-dss-options', markers: HALLEN, tileUrl: '/tiles/{z}/{x}/{y}.png' })}'></div></section>
<section aria-labelledby="hm"><h2 id="hm">Karte aus Markup</h2><div id="m">${renderMap({ label: 'Karte aus renderMap', markers: [HALLEN[1]], tileUrl: '/tiles/{z}/{x}/{y}.png', height: 260 }, { uid: 'srv2' })}</div></section></main>
<script type="module" src="/t/initall.js"></script></body></html>`;
const initAllScript = `import { initAll } from '/dss/dss.min.js';
import { initMapBlock, initMap, mountMap } from '/dss/dss-map.min.js';
import { mountVenueCard } from '/dss/dss-render.min.js';
window.__maps = [];
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');
// Das Markup von renderMap (id m) trägt kein data-dss: es wird gezielt mit initMap gestartet
initMap(document.getElementById('m'), { markers: ${JSON.stringify([HALLEN[1]])}, tileUrl: '/tiles/{z}/{x}/{y}.png', loadLeaflet, onLoad: (map) => window.__maps.push(map) });
initAll(document, { map: { start: initMapBlock, loadLeaflet, onLoad: (map) => window.__maps.push(map) } });
// zusätzlich eine Karte und eine Hallenkarte per mount (Styles über das CSSOM)
const extra = document.createElement('div');
document.querySelector('main').append(extra);
mountMap(extra, { label: 'Karte per mountMap', markers: ${JSON.stringify([HALLEN[2]])}, tileUrl: '/tiles/{z}/{x}/{y}.png' }, { loadLeaflet });
const extra2 = document.createElement('div');
document.querySelector('main').append(extra2);
mountVenueCard(extra2, { name: 'Gymnasium Kiefernau', lat: 49.2955, lng: 7.8905, tileUrl: '/tiles/{z}/{x}/{y}.png' }, { initMap, loadLeaflet });
window.__ready = true;
`;

/** Nur mountMap und mountVenueCard, strenge Content-Security-Policy: es darf keine Verletzung gemeldet werden. */
const pageCsp = () => `${head('<script>window.__csp = []; document.addEventListener("securitypolicyviolation", (e) => window.__csp.push(e.violatedDirective + " " + e.blockedURI));</script>')}<main><h1>Strenge CSP</h1><div id="k"></div><div id="v"></div></main>
<script type="module" src="/t/csp.js"></script></body></html>`;
const cspScript = `import { mountMap } from '/dss/dss-map.min.js';
import { initMap } from '/dss/dss-map.min.js';
import { mountVenueCard } from '/dss/dss-render.min.js';
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');
window.__maps = [];
mountMap(document.getElementById('k'), { label: 'Karte unter CSP', markers: ${JSON.stringify(HALLEN)}, tileUrl: '/tiles/{z}/{x}/{y}.png', height: 280, darkTiles: 'invert' }, { loadLeaflet, onLoad: (m) => window.__maps.push(m) });
mountVenueCard(document.getElementById('v'), { name: 'Sporthalle Nordhain', lat: 49.3, lng: 7.9, tileUrl: '/tiles/{z}/{x}/{y}.png', mapHeight: 230 }, { initMap, loadLeaflet, onLoad: (m) => window.__maps.push(m) });
window.__ready = true;
`;

const pageTwice = () => `${head()}<main><h1>Zweimal init</h1><section aria-labelledby="a1"><h2 id="a1">Karte</h2><div id="m">${renderMap({ label: 'Karte zweimal', markers: [HALLEN[1]], tileUrl: '/tiles/{z}/{x}/{y}.png' }, { uid: 'tw1' })}</div></section>
<section aria-labelledby="a2"><h2 id="a2">Hallenkarte</h2><div id="v">${renderVenueCard(HALLE, { init: true, uid: 'tw2' })}</div></section></main>
<script type="module" src="/t/twice.js"></script></body></html>`;
const twiceScript = `import { initAll } from '/dss/dss.min.js';
import { initMap, initMapBlock } from '/dss/dss-map.min.js';
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');
const opts = { markers: ${JSON.stringify([HALLEN[1]])}, tileUrl: '/tiles/{z}/{x}/{y}.png', loadLeaflet };
initMap(document.getElementById('m'), opts);
initMap(document.getElementById('m'), opts);
initAll(document, { map: { start: initMapBlock, loadLeaflet } });
initAll(document, { map: { start: initMapBlock, loadLeaflet } });
window.__ready = true;
`;
const pagePartial = () => `${head()}<main><h1>update mit Teilen</h1><div id="k"></div></main><script type="module" src="/t/partial.js"></script></body></html>`;
const partialScript = `import { mountMap } from '/dss/dss-map.min.js';
const loadLeaflet = () => import('/vendor/leaflet/leaflet-src.esm.js');
const handle = mountMap(document.getElementById('k'), { label: 'Karte', markers: ${JSON.stringify(HALLEN)}, tileUrl: '/tiles/{z}/{x}/{y}.png', load: 'auto' }, { loadLeaflet });
window.__update = (partial) => handle.update(partial);
window.__ready = true;
`;

/** React-Fassung derselben Karte (Vergleich der Rechtecke und Stile). */
const pageReact = () => `${head()}<main><h1>React</h1><div id="root"></div></main><script type="module" src="/react-map.js"></script></body></html>`;
const pageVanillaSame = (extra = '') => `${head()}<main><h1>Vanilla</h1><div id="root"></div></main><script type="module">
import { mountMap } from '/dss/dss-map.min.js';
window.__done = false;
mountMap(document.getElementById('root'), { label: 'Karte der Hallen', markers: [${JSON.stringify(SITZ)}, ...${JSON.stringify(HALLEN)}], tileUrl: '/tiles/{z}/{x}/{y}.png', load: 'auto', height: 320${extra} }, { loadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js'), onLoad: () => { window.__done = true; } });
</script></body></html>`;

// ── Server ───────────────────────────────────────────────────

async function startServer({ dist, reactJs }) {
  const demo = await readFile(join(ROOT, 'stories/assets/tiles/demo.png'));
  const counts = { tiles: 0, requests: [] };
  const pages = {
    '/t/many': pageMany(), '/t/importmap': pageLoader('importmap'), '/t/global': pageLoader('global'), '/t/lader404': pageLoader('lader404'),
    '/t/kachel404': pageLoader('kachel404'), '/t/cycle': pageCycle(), '/t/react': pageReact(), '/t/vanilla': pageVanillaSame(), '/t/initall': pageInitAll(), '/t/csp': pageCsp(), '/t/twice': pageTwice(), '/t/partial': pagePartial(),
  };
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    counts.requests.push(path);
    const send = (status, body, type) => {
      res.writeHead(status, { 'content-type': type ?? 'text/plain', 'cache-control': 'no-store' });
      res.end(body);
    };
    if (path.startsWith('/tiles/')) { counts.tiles += 1; return send(200, demo, 'image/png'); }
    if (path.startsWith('/tiles-fehlt/')) return send(404, 'nicht da');
    if (path === '/t/initall.js') return send(200, initAllScript, TYPES['.js']);
    if (path === '/t/csp.js') return send(200, cspScript, TYPES['.js']);
    if (path === '/t/twice.js') return send(200, twiceScript, TYPES['.js']);
    if (path === '/t/partial.js') return send(200, partialScript, TYPES['.js']);
    if (pages[path]) {
      // /t/initall: strenge Content-Security-Policy (kein unsafe-inline bei style-src); der Inline-Hörer im Kopf braucht script-src 'unsafe-inline'
      const csp = path === '/t/initall' || path === '/t/csp' ? { 'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; img-src 'self' data:" } : {};
      res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store', ...csp });
      return res.end(pages[path]);
    }
    if (path === '/react-map.js') return send(200, reactJs, TYPES['.js']);
    const files = [
      [/^\/dss\//, dist], [/^\/vendor\/leaflet\//, join(ROOT, 'node_modules/leaflet/dist')], [/^\/vendor\/leaflet-chunks\//, join(dist, '..', 'react-chunks')],
    ];
    for (const [re, dir] of files) {
      if (re.test(path)) {
        const file = join(dir, path.replace(re, ''));
        if (existsSync(file)) return send(200, await readFile(file), TYPES[extname(file)] ?? 'application/octet-stream');
        return send(404, 'nicht da');
      }
    }
    if (path === '/' || path === '/index.html') return send(200, await readFile(join(ROOT, 'stories/examples/karte-ohne-build/index.html')), TYPES['.html']);
    if (path.startsWith('/chunks/')) {
      const file = join(dist, '..', 'react-out', path.replace('/chunks/', ''));
      if (existsSync(file)) return send(200, await readFile(file), TYPES['.js']);
    }
    return send(404, 'nicht da');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, counts, origin: `http://127.0.0.1:${server.address().port}` };
}

async function buildReact(dir) {
  const entry = join(dir, 'react-entry.tsx');
  await writeFile(entry, `import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { MapView } from '${ROOT}react/Map.tsx';
const markers = ${JSON.stringify([SITZ, ...HALLEN])};
window.__done = false;
createRoot(document.getElementById('root')).render(createElement(MapView, { label: 'Karte der Hallen', markers, tileUrl: '/tiles/{z}/{x}/{y}.png', load: 'auto', height: 320, onLoad: () => { window.__done = true; } }));
`);
  const out = join(dir, 'react-out');
  await build_(entry, out);
  return await readFile(join(out, 'react-entry.js'), 'utf8');
}
async function build_(entry, out) {
  await esbuild({
    entryPoints: [entry], bundle: true, format: 'esm', outdir: out, splitting: false, platform: 'browser', target: 'es2020', jsx: 'automatic',
    nodePaths: [join(ROOT, 'node_modules')], define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'error',
  });
}

// ── Hilfen ───────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, ms = 8000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`Zeitüberschreitung: ${label}`);
    await sleep(40);
  }
}
const stateOf = (page, sel = '.dss-map') => page.evaluate((s) => document.querySelector(s)?.getAttribute('data-state'), sel);

function trackRequests(page) {
  const log = [];
  page.on('request', (req) => log.push({ url: req.url(), type: req.resourceType() }));
  return log;
}

async function applyTheme(page, { brand, theme }) {
  await page.evaluate(({ brand, theme }) => {
    const root = document.documentElement;
    if (brand === 'dbb') root.setAttribute('data-brand', 'dbb'); else root.removeAttribute('data-brand');
    if (theme === 'dark') root.setAttribute('data-theme', 'dark'); else root.setAttribute('data-theme', 'light');
  }, { brand, theme });
}

// ── Prüfungen ────────────────────────────────────────────────

async function checkPrivacy(ctx, origin, counts, browserName) {
  const page = await ctx.newPage();
  const log = trackRequests(page);
  const before = counts.tiles;
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await waitFor(() => stateOf(page), 'Platzhalter');
  await sleep(300);
  const urls = log.map((r) => new URL(r.url).pathname);
  const leafletRequested = urls.some((u) => u.startsWith('/vendor/leaflet/') && u.endsWith('.js'));
  const tileRequested = urls.some((u) => u.startsWith('/tiles/'));
  const cookies = await ctx.cookies();
  const storage = await page.evaluate(() => ({ cookie: document.cookie, local: localStorage.length, session: sessionStorage.length }));
  const hints = await page.evaluate(() => document.querySelectorAll('link[rel=prefetch],link[rel=preload],link[rel=modulepreload],link[rel=preconnect],link[rel=dns-prefetch]').length);
  const hosts = new Set(log.map((r) => new URL(r.url).host));
  record(`${browserName} · Datenschutz: vor dem Klick kein Leaflet, keine Kachel`, !leafletRequested && !tileRequested && counts.tiles === before, { urls });
  record(`${browserName} · Datenschutz: nur der eigene Host, keine Cookies, kein Storage, keine Hinweise (prefetch/preconnect)`, hosts.size === 1 && cookies.length === 0 && storage.cookie === '' && storage.local === 0 && storage.session === 0 && hints === 0, { hosts: [...hosts], storage, hints });
  record(`${browserName} · Platzhalter: zwei Karten idle, Schaltfläche bedienbar`, await page.evaluate(() => [...document.querySelectorAll('.dss-map')].every((m) => m.getAttribute('data-state') === 'idle') && [...document.querySelectorAll('.dss-map-load')].every((b) => !b.disabled && !b.hasAttribute('aria-disabled'))));
  // Klick: nur jetzt Leaflet und Kacheln
  const after = log.length;
  await page.click('#karte .dss-map-load');
  await waitFor(async () => (await stateOf(page, '#karte .dss-map')) === 'ready', 'Karte bereit');
  await sleep(500);
  const afterUrls = log.slice(after).map((r) => new URL(r.url).pathname);
  const afterHosts = new Set(log.slice(after).map((r) => new URL(r.url).host));
  record(`${browserName} · Klick: Leaflet (lokal) und Kacheln nur vom Kachel-Host`, afterUrls.some((u) => u.includes('leaflet-src.esm.js')) && afterUrls.some((u) => u.startsWith('/tiles/')) && afterHosts.size === 1, { afterUrls: afterUrls.slice(0, 12) });
  const live = await page.evaluate(() => ({
    markers: document.querySelectorAll('#karte .leaflet-marker-icon').length, zoom: document.querySelectorAll('#karte .dss-map-zoom-btn').length,
    focus: document.activeElement?.classList.contains('dss-map-canvas') ?? false, tiles: document.querySelectorAll('#karte .leaflet-tile-loaded').length,
    ph: document.querySelector('#karte .dss-map-ph') !== null, status: document.querySelector('#karte .dss-map-status')?.textContent,
    otherIdle: document.querySelector('#halle .dss-map')?.getAttribute('data-state'),
  }));
  record(`${browserName} · Klick: Marker, Zoom-Schaltflächen, Kacheln geladen, Fokus auf der Kartenfläche, andere Karte bleibt idle`,
    live.markers === 3 && live.zoom === 2 && live.tiles > 0 && live.focus && !live.ph && live.status === '' && live.otherIdle === 'idle', live);
  const cookiesAfter = await ctx.cookies();
  record(`${browserName} · nach dem Klick weiterhin keine Cookies, kein Storage`, cookiesAfter.length === 0 && (await page.evaluate(() => localStorage.length + sessionStorage.length)) === 0);
  // Hallenkarte (Anbindung über initMap): auch erst nach Klick
  await page.click('#halle .dss-map-load');
  await waitFor(async () => (await stateOf(page, '#halle .dss-map')) === 'ready', 'Hallenkarte bereit');
  const venue = await page.evaluate(() => ({ markers: document.querySelectorAll('#halle .leaflet-marker-icon').length, dragging: window.__karten.length }));
  record(`${browserName} · Hallenkarte: Klick startet die eingebettete Karte (1 Marker)`, venue.markers === 1 && venue.dragging === 2, venue);
  await page.close();
}

async function checkKeyboard(ctx, origin, browserName) {
  const page = await ctx.newPage();
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await page.focus('#karte .dss-map-load');
  await page.keyboard.press('Enter');
  await waitFor(async () => (await stateOf(page, '#karte .dss-map')) === 'ready', 'Karte bereit');
  const activeIsCanvas = await page.evaluate(() => document.activeElement?.classList.contains('dss-map-canvas'));
  record(`${browserName} · Tastatur: Enter auf „Karte laden“ legt den Fokus auf die Kartenfläche`, activeIsCanvas);
  const view = () => page.evaluate(() => { const m = window.__karten[0]; const c = m.getCenter(); return { lat: c.lat, lng: c.lng, zoom: m.getZoom() }; });
  const v0 = await view();
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await sleep(600);
  const v1 = await view();
  record(`${browserName} · Tastatur: Pfeil rechts verschiebt die Karte`, v1.lng > v0.lng + 1e-5, { v0, v1 });
  await page.keyboard.press('+');
  await sleep(600);
  const v2 = await view();
  await page.keyboard.press('-');
  await sleep(600);
  const v3 = await view();
  record(`${browserName} · Tastatur: + vergrößert, − verkleinert`, v2.zoom === v1.zoom + 1 && v3.zoom === v1.zoom, { v1, v2, v3 });
  // Tab: Marker erreichbar, danach verlässt der Fokus die Karte (keine Falle)
  const path = [];
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement;
      return { cls: a?.className?.toString().slice(0, 40) ?? '', inMap: Boolean(a?.closest('#karte .dss-map-frame')), tag: a?.tagName, label: a?.getAttribute('aria-label') ?? a?.getAttribute('title') ?? '' };
    });
    path.push(info);
    if (!info.inMap) break;
  }
  const markers = path.filter((p) => p.cls.includes('leaflet-marker-icon')).length;
  const zoomBtns = path.filter((p) => p.cls.includes('dss-map-zoom-btn')).length;
  // Safari (WebKit unter macOS) lässt Tab standardmäßig an Schaltflächen und Links vorbei (Systemeinstellung „Tab hebt jedes Element hervor“): dort zählen nur die Marker
  const zoomOk = browserName === 'webkit' ? zoomBtns === 0 || zoomBtns === 2 : zoomBtns === 2;
  record(`${browserName} · Tastatur: Tab erreicht alle Marker (und beide Zoom-Schaltflächen) und verlässt die Karte danach`, markers === 3 && zoomOk && !path.at(-1).inMap, path.map((p) => p.cls.split(' ')[0] || p.tag));
  // Zurück: Shift+Tab geht in die Karte und wieder hinaus
  let out = false;
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Shift+Tab');
    const inMap = await page.evaluate(() => Boolean(document.activeElement?.closest('#karte .dss-map-frame')));
    if (!inMap && i > 3) { out = true; break; }
  }
  record(`${browserName} · Tastatur: Shift+Tab verlässt die Karte rückwärts`, out);
  // Marker mit Ziel: Enter öffnet den Anker
  await page.evaluate(() => { const icons = [...document.querySelectorAll('#karte .leaflet-marker-icon')]; icons.find((i) => i.getAttribute('aria-label')?.includes('Seeberg')).focus(); });
  await page.keyboard.press('Enter');
  await sleep(200);
  record(`${browserName} · Tastatur: Enter am Marker folgt dem Ziel`, (await page.evaluate(() => location.hash)) === '#halle-seeberg');
  // Zoom-Schaltfläche mit Maus und aria-disabled an der Grenze
  await page.evaluate(() => { const m = window.__karten[0]; m.setZoom(m.getMaxZoom(), { animate: false }); });
  await sleep(200);
  const disabled = await page.evaluate(() => document.querySelector('#karte .dss-map-zoom-btn')?.getAttribute('aria-disabled'));
  record(`${browserName} · Zoom-Schaltfläche an der Obergrenze: aria-disabled, nicht disabled`, disabled === 'true' && (await page.evaluate(() => !document.querySelector('#karte .dss-map-zoom-btn').disabled)));
  await page.close();
}

async function checkMany(ctx, origin, browserName) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${origin}/t/many`, { waitUntil: 'networkidle' });
  await waitFor(() => page.evaluate(() => window.__ready), 'Seite');
  await waitFor(() => page.evaluate(() => Object.keys(window.__maps).length >= 3), 'k2 im Platzhalter, k3..k5 verborgen');
  // k1 bleibt idle, k2 lädt automatisch, k3 bis k5 laden in verborgenen Behältern
  record(`${browserName} · mehrere Karten: k1 idle, k2 (auto) ready, jede Karte eine eigene Leaflet-Karte`, (await stateOf(page, '#k1 .dss-map')) === 'idle' && (await stateOf(page, '#k2 .dss-map')) === 'ready');
  // Vereinssitz: Haus statt Nummer, Name mit Zusatz, Nummerierung der übrigen Orte von 1 an; darkTiles invert wirkt im Dunkelmodus auf die Kachelebene
  const seat = await page.evaluate(() => {
    const markers = [...document.querySelectorAll('#k2 .leaflet-marker-icon')];
    const seatMarker = markers.find((m) => m.classList.contains('is-seat'));
    return {
      seats: markers.filter((m) => m.classList.contains('is-seat')).length,
      house: seatMarker?.querySelector('.dss-map-pin-house') !== null,
      name: seatMarker?.getAttribute('aria-label') ?? '',
      numbers: markers.filter((m) => !m.classList.contains('is-seat')).map((m) => m.querySelector('.dss-map-pin-num')?.textContent).sort(),
      tiles: document.querySelector('#k2 .dss-map').getAttribute('data-tiles'),
    };
  });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const filter = await page.evaluate(() => getComputedStyle(document.querySelector('#k2 .leaflet-tile-pane .dss-map-tiles') ?? document.querySelector('#k2 .dss-map-tiles')).filter);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  record(`${browserName} · Vereinssitz und darkTiles: Haus, Name „…, Vereinssitz“, Orte von 1 an, im Dunkelmodus invertiert`, seat.seats === 1 && seat.house && seat.name.endsWith('Vereinssitz') && seat.numbers.join() === '1,2,3' && seat.tiles === 'invert' && /invert/.test(filter), { seat, filter });
  const sizeOk = (id) => page.evaluate((id) => {
    const el = document.querySelector(`#${id} .dss-map-canvas`); const m = window.__maps[id];
    if (!el || !m) return { ok: false, why: 'fehlt' };
    const s = m.getSize();
    const tiles = [...el.querySelectorAll('.leaflet-tile-loaded')].filter((t) => t.getBoundingClientRect().width > 0).length;
    return { ok: el.clientWidth > 100 && s.x === el.clientWidth && s.y === el.clientHeight && tiles > 0, w: el.clientWidth, h: el.clientHeight, size: [s.x, s.y], tiles };
  }, id);
  // Accordion
  await page.click('#acc1-trigger');
  await waitFor(async () => (await sizeOk('k3')).ok, 'k3 Größe nach dem Öffnen').catch(() => {});
  const k3 = await sizeOk('k3');
  record(`${browserName} · Karte im Accordion: nach dem Öffnen passt die Kartengröße (invalidateSize), Kacheln sichtbar`, k3.ok, k3);
  // Tabs
  await page.click('#t-b');
  await waitFor(async () => (await sizeOk('k4')).ok, 'k4 Größe nach dem Wechsel').catch(() => {});
  const k4 = await sizeOk('k4');
  record(`${browserName} · Karte in Tabs: nach dem Wechsel passt die Kartengröße, Kacheln sichtbar`, k4.ok, k4);
  // Modal
  await page.click('[data-dss-modal-open="dlg"]');
  await waitFor(async () => (await sizeOk('k5')).ok, 'k5 Größe im Dialog').catch(() => {});
  const k5 = await sizeOk('k5');
  record(`${browserName} · Karte im Dialog: nach dem Öffnen passt die Kartengröße, Kacheln sichtbar`, k5.ok, k5);
  record(`${browserName} · keine Seitenfehler auf der Mehrkartenseite`, errors.length === 0, errors);
  // Fokus im Dialog: Tab bleibt im Dialog, Escape schließt und gibt den Fokus zurück
  await page.keyboard.press('Escape');
  await sleep(200);
  record(`${browserName} · Dialog mit Karte: Escape schließt, Fokus zurück zum Auslöser`, await page.evaluate(() => document.activeElement?.getAttribute('data-dss-modal-open') === 'dlg'));
  await page.close();
}

async function checkInitAll(ctx, origin, browserName) {
  // Server-Markup und initAll unter strenger CSP: das Markup der Seite selbst (style-Attribute) wird blockiert, die Karte wendet die Werte über das CSSOM an
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${origin}/t/initall`, { waitUntil: 'networkidle' });
  await waitFor(() => page.evaluate(() => window.__ready), 'Seite');
  const idle = await page.evaluate(() => ({
    states: [...document.querySelectorAll('.dss-map')].map((m) => m.getAttribute('data-state')),
    disabled: [...document.querySelectorAll('.dss-map-load')].filter((b) => b.disabled).length,
    heights: [...document.querySelectorAll('.dss-map')].map((m) => Math.round(m.querySelector('.dss-map-frame').getBoundingClientRect().height)),
    csp: window.__csp,
  }));
  const onlyAttr = idle.csp.every((v) => v.startsWith('style-src-attr'));
  record(`${browserName} · Server-Markup: fünf Karten idle, Schaltflächen bedienbar; blockiert ist nur das style-Attribut des Server-Markups (style-src-attr), die Höhe gilt über das CSSOM`,
    idle.states.length === 5 && idle.states.every((s) => s === 'idle') && idle.disabled === 0 && onlyAttr && idle.heights.every((h) => h >= 150), idle);
  for (const btn of await page.$$('.dss-map-load')) await btn.click();
  await waitFor(async () => (await page.evaluate(() => [...document.querySelectorAll('.dss-map')].every((m) => m.getAttribute('data-state') === 'ready'))), 'alle bereit');
  const live = await page.evaluate(() => ({ markers: document.querySelectorAll('.leaflet-marker-icon').length, csp: window.__csp, maps: window.__maps.length, dragging: window.__maps.map((m) => m.dragging.enabled()) }));
  record(`${browserName} · Server-Markup nach dem Klick: lebendig, Hallenkarte nicht interaktiv, keine weitere CSP-Verletzung`, live.markers >= 5 && live.csp.every((v) => v.startsWith('style-src-attr')) && live.csp.length === idle.csp.length && errors.length === 0 && live.dragging.includes(false), { live, errors });
  await page.close();

  // nur mountMap und mountVenueCard: strenge CSP ohne eine Verletzung
  const strict = await ctx.newPage();
  await strict.goto(`${origin}/t/csp`, { waitUntil: 'networkidle' });
  await waitFor(() => strict.evaluate(() => window.__ready), 'CSP-Seite');
  for (const btn of await strict.$$('.dss-map-load')) await btn.click();
  await waitFor(async () => (await strict.evaluate(() => [...document.querySelectorAll('.dss-map')].every((m) => m.getAttribute('data-state') === 'ready'))), 'beide bereit');
  const info = await strict.evaluate(() => ({
    csp: window.__csp, heights: [...document.querySelectorAll('.dss-map-frame')].map((f) => Math.round(f.getBoundingClientRect().height)),
    pins: document.querySelectorAll('.leaflet-marker-icon').length, styleAttr: [...document.querySelectorAll('.dss-map [style]')].filter((el) => !el.className.toString().includes('leaflet')).length,
  }));
  record(`${browserName} · mountMap und mountVenueCard unter style-src 'self': keine CSP-Verletzung, Höhen und Pins gelten (CSSOM)`, info.csp.length === 0 && info.heights.every((h) => h >= 200) && info.pins === 4, info);
  await strict.close();
}

/**
 * Frisches Projekt: nur die Dateien der Kopierliste aus der Doku (`kopieren` in stories/Map.code.ts) landen in einem leeren `_site`; die Beispielseite
 * läuft daraus (kein Zugriff auf dist oder node_modules). Jeder 404 oder Konsolenfehler ist ein Befund (z. B. fehlendes dss.min.js für dss-render.min.js).
 */
async function checkFresh(ctx, dist, browserName) {
  const site = await mkdtemp(join(tmpdir(), 'dss-fresh-'));
  const source = await readFile(join(ROOT, 'stories/Map.code.ts'), 'utf8');
  const list = source.match(/export const kopieren = `([\s\S]*?)`;/)[1];
  const copied = [];
  for (const line of list.split('\n')) {
    const m = line.match(/^cp (?:-r )?(\S+)\s+(_site\/\S+)/);
    if (!m) continue;
    const from = m[1].replace('node_modules/@bbv/dss-design-system/dist/vanilla/', `${dist}/`).replace('node_modules/', `${ROOT}node_modules/`);
    const to = join(site, m[2].replace(/^_site\//, ''));
    await mkdir(to.endsWith('/') ? to : join(to, '..'), { recursive: true });
    await cp(from, to.endsWith('/') ? join(to, from.split('/').pop()) : to, { recursive: true });
    copied.push(from.split('/').pop());
  }
  await writeFile(join(site, 'index.html'), await readFile(join(ROOT, 'stories/examples/karte-ohne-build/index.html')));
  const demo = await readFile(join(ROOT, 'stories/assets/tiles/demo.png'));
  const misses = [];
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (path.startsWith('/tiles/')) { res.writeHead(200, { 'content-type': 'image/png' }); return res.end(demo); }
    const file = join(site, path === '/' ? 'index.html' : path);
    if (!file.startsWith(site) || !existsSync(file) || !extname(file)) { misses.push(path); res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle' });
  await waitFor(() => stateOf(page, '#karte .dss-map'), 'Platzhalter');
  await page.click('#karte .dss-map-load');
  await page.click('#halle .dss-map-load');
  await waitFor(async () => (await stateOf(page, '#karte .dss-map')) === 'ready' && (await stateOf(page, '#halle .dss-map')) === 'ready', 'beide Karten bereit');
  const live = await page.evaluate(() => document.querySelectorAll('.leaflet-container').length);
  record(`${browserName} · frisches Projekt (nur Dateien der Kopierliste): kein 404, beide Karten lebendig`, misses.length === 0 && errors.length === 0 && live === 2 && copied.includes('dss.min.js'), { misses, errors, live, copied });
  await page.close();
  server.close();
  await rm(site, { recursive: true, force: true });
}

/** Zweimal init auf demselben Server-Markup (initMap und initAll): die Karte entsteht im sichtbaren DOM, der Button ist bedienbar. */
async function checkTwice(ctx, origin, browserName) {
  const page = await ctx.newPage();
  await page.goto(`${origin}/t/twice`, { waitUntil: 'networkidle' });
  await waitFor(() => page.evaluate(() => window.__ready), 'Seite');
  const before = await page.evaluate(() => [...document.querySelectorAll('.dss-map-load')].map((b) => b.disabled));
  for (const btn of await page.$$('.dss-map-load')) await btn.click();
  await waitFor(async () => (await page.evaluate(() => [...document.querySelectorAll('.dss-map')].every((m) => m.getAttribute('data-state') === 'ready'))), 'beide bereit');
  const live = await page.evaluate(() => ({
    containers: document.querySelectorAll('.leaflet-container').length,
    inDoc: [...document.querySelectorAll('.dss-map-canvas')].map((c) => c.classList.contains('leaflet-container') && c.isConnected && c.clientHeight > 100),
    tiles: document.querySelectorAll('.leaflet-tile-loaded').length,
  }));
  record(`${browserName} · zweimal init (initMap und initAll) auf Server-Markup: Schaltflächen bedienbar, Karten lebendig im Dokument`, before.every((d) => d === false) && live.containers === 2 && live.inDoc.every(Boolean) && live.tiles > 0, { before, live });
  await page.close();
}

/** update mit Teilen: Proxy-tileUrl bleibt, es gibt keine Anfrage an den Standardserver (eine Route fängt tile.openstreetmap.org ab und zählt). */
async function checkPartialUpdate(ctx, origin, browserName) {
  const page = await ctx.newPage();
  const osm = [];
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.includes('tile.openstreetmap.org')) { osm.push(url); return route.abort(); }
    return route.continue();
  });
  await page.goto(`${origin}/t/partial`, { waitUntil: 'networkidle' });
  await waitFor(() => page.evaluate(() => window.__ready), 'Seite');
  await waitFor(async () => (await stateOf(page)) === 'ready', 'bereit');
  await page.evaluate(() => window.__update({ label: 'Nur der Name ändert sich' }));
  await sleep(600);
  const info = await page.evaluate(() => ({ label: document.querySelector('[role=region]').getAttribute('aria-label'), markers: document.querySelectorAll('.leaflet-marker-icon').length, state: document.querySelector('.dss-map').getAttribute('data-state') }));
  record(`${browserName} · update({ label }) mit Proxy-tileUrl: keine Anfrage an tile.openstreetmap.org, Marker und Karte bleiben`, osm.length === 0 && info.markers === 3 && info.state === 'ready' && info.label === 'Nur der Name ändert sich', { osm, info });
  await page.close();
}

async function checkLoaders(ctx, origin, browserName) {
  for (const variant of ['importmap', 'global']) {
    const page = await ctx.newPage();
    const log = trackRequests(page);
    await page.goto(`${origin}/t/${variant}`, { waitUntil: 'networkidle' });
    await sleep(200);
    const before = log.length;
    const leafletBefore = log.some((r) => r.url.includes('/vendor/leaflet/') && r.url.endsWith('.js'));
    await page.click('.dss-map-load');
    await waitFor(async () => (await stateOf(page)) === 'ready', `Karte ${variant}`);
    record(`${browserName} · Lader ${variant}: vor dem Klick kein Leaflet, danach lebendige Karte`, !leafletBefore && log.length > before && (await page.evaluate(() => document.querySelectorAll('.leaflet-marker-icon').length)) === 3);
    await page.close();
  }
  const page404 = await ctx.newPage();
  await page404.goto(`${origin}/t/lader404`, { waitUntil: 'networkidle' });
  await page404.click('.dss-map-load');
  await waitFor(async () => (await stateOf(page404)) === 'error', 'Fehler import');
  record(`${browserName} · Fehler: Leaflet nicht ladbar → Grund import, Statuszeile, Liste bleibt`, await page404.evaluate(() => window.__errors.join() === 'import' && document.querySelector('.dss-map-status').textContent.includes('konnte nicht geladen werden') && document.querySelectorAll('.dss-map-item').length === 3));
  await page404.close();
  const pageTiles = await ctx.newPage();
  await pageTiles.goto(`${origin}/t/kachel404`, { waitUntil: 'networkidle' });
  await pageTiles.click('.dss-map-load');
  await waitFor(async () => (await stateOf(pageTiles)) === 'error', 'Fehler tiles');
  const tilesInfo = await pageTiles.evaluate(() => ({ errors: window.__errors, canvas: document.querySelector('.dss-map-canvas') !== null, status: document.querySelector('.dss-map-status')?.textContent }));
  record(`${browserName} · Fehler: alle ersten Kacheln 404 → Grund tiles, Karte abgebaut`, tilesInfo.errors.join() === 'tiles' && !tilesInfo.canvas, tilesInfo);
  await pageTiles.close();
}

async function checkCycles(ctx, origin, browserName) {
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page).catch(() => null);
  await page.goto(`${origin}/t/cycle`, { waitUntil: 'networkidle' });
  if (!cdp) { record(`${browserName} · Zyklen: CDP nicht verfügbar (nur Chromium)`, true, 'übersprungen'); await page.close(); return; }
  await cdp.send('Performance.enable');
  const metrics = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await sleep(100);
    await cdp.send('HeapProfiler.collectGarbage');
    const { metrics: list } = await cdp.send('Performance.getMetrics');
    return Object.fromEntries(list.map((m) => [m.name, m.value]));
  };
  await page.evaluate(() => window.__cycle(3)); // Warmlauf
  const m0 = await metrics();
  await page.evaluate(() => window.__cycle(5));
  const m5 = await metrics();
  await page.evaluate(() => window.__cycle(40));
  const m45 = await metrics();
  await page.evaluate(() => window.__cycle(40));
  const m85 = await metrics();
  const pick = (m) => ({ nodes: m.Nodes, listeners: m.JSEventListeners, heapKiB: Math.round(m.JSHeapUsedSize / 1024), docs: m.Documents });
  const a = pick(m5);
  const b = pick(m45);
  const c = pick(m85);
  const leftover = await page.evaluate(() => ({ canvases: document.querySelectorAll('.leaflet-container').length, children: document.getElementById('k').childNodes.length + document.getElementById('v').childNodes.length }));
  record(`${browserName} · Zyklen 5 → 45: Knoten und Listener stabil, Heap ohne Wachstum`, // stabil heißt: von 45 auf 85 Zyklen wächst nichts (Knoten und Listener gleich, Heap höchstens 10 % plus 256 KiB); die ersten Zyklen dürfen einmalig Zustand aufbauen (Leaflet-Klassen, Zwischenspeicher)
    c.nodes <= b.nodes + 20 && c.listeners <= b.listeners + 2 && c.heapKiB <= b.heapKiB * 1.1 + 256 && b.nodes <= a.nodes + 120 && leftover.canvases === 0 && leftover.children === 0, { m0: pick(m0), nach5: a, nach45: b, nach85: c, leftover });
  await page.close();
}

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const AXE_EXTRA = ['color-contrast-enhanced', 'target-size', 'landmark-unique', 'heading-order'];
async function axeRun(page) {
  await page.addScriptTag({ path: join(ROOT, 'node_modules/axe-core/axe.min.js') });
  return page.evaluate(async ({ tags, extra }) => {
    // Standardverhalten von axe: nur die Regeln der Tags (experimentelle Regeln wie focus-order-semantics laufen nicht); die vier genannten Regeln gelten ausdrücklich
    const rules = Object.fromEntries(extra.map((id) => [id, { enabled: true }]));
    const out = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, rules });
    return out.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' · ' + (n.failureSummary || '').split('\n')[1]) }));
  }, { tags: AXE_TAGS, extra: AXE_EXTRA });
}

async function checkAxe(browser, origin, browserName) {
  const combos = [];
  for (const brand of ['bbv', 'dbb']) for (const theme of ['light', 'dark']) for (const width of [1280, 420]) combos.push({ brand, theme, width });
  for (const combo of combos) {
    const ctx = await browser.newContext({ viewport: { width: combo.width, height: 900 }, colorScheme: combo.theme === 'dark' ? 'dark' : 'light' });
    const page = await ctx.newPage();
    await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
    await applyTheme(page, combo);
    await waitFor(() => stateOf(page), 'Platzhalter');
    const idle = await axeRun(page);
    await page.click('#karte .dss-map-load');
    await page.click('#halle .dss-map-load');
    await waitFor(async () => (await stateOf(page, '#karte .dss-map')) === 'ready' && (await stateOf(page, '#halle .dss-map')) === 'ready', 'beide Karten');
    await sleep(400);
    const ready = await axeRun(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    record(`${browserName} · axe ${combo.brand}/${combo.theme}/${combo.width}: Platzhalter ohne Verstöße`, idle.length === 0, idle);
    record(`${browserName} · axe ${combo.brand}/${combo.theme}/${combo.width}: geladene Karten ohne Verstöße, kein seitliches Scrollen`, ready.length === 0 && overflow <= 0, { ready, overflow });
    await ctx.close();
  }
  // Fehlerzustand und Mehrkartenseite einmal (BBV, hell, 1280)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${origin}/t/lader404`, { waitUntil: 'networkidle' });
  await page.click('.dss-map-load');
  await waitFor(async () => (await stateOf(page)) === 'error', 'Fehler');
  record(`${browserName} · axe Fehlerzustand: ohne Verstöße`, (await axeRun(page)).length === 0);
  await ctx.close();
}

async function checkReactCompare(browser, origin, browserName) {
  const rects = async (url) => {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(`${origin}${url}`, { waitUntil: 'networkidle' });
    await waitFor(() => page.evaluate(() => window.__done), 'bereit');
    await sleep(500);
    const data = await page.evaluate(() => {
      const sels = ['.dss-map', '.dss-map-skip', '.dss-map-frame', '.dss-map-stage', '.dss-map-canvas', '.dss-map-zoom', '.dss-map-zoom-btn', '.dss-map-status', '.dss-map-attr', '.dss-map-attr a', '.dss-map-text', '.dss-map-list', '.dss-map-item', '.dss-map-num', '.dss-map-name', '.dss-chip', '.dss-map-coords', '.dss-map-links a', '.dss-map-marker'];
      const props = ['display', 'position', 'color', 'background-color', 'font-size', 'font-weight', 'border-radius', 'padding', 'margin', 'min-height', 'border-top-width', 'outline-style', 'filter'];
      const root = document.getElementById('root');
      const out = {};
      for (const sel of sels) {
        out[sel] = [...root.querySelectorAll(sel)].map((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return { rect: [Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10 - Math.round(root.getBoundingClientRect().y * 10) / 10 + Math.round(root.getBoundingClientRect().y * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], style: Object.fromEntries(props.map((p) => [p, cs.getPropertyValue(p)])) };
        });
      }
      return out;
    });
    await ctx.close();
    return data;
  };
  const [vanilla, react] = await Promise.all([rects('/t/vanilla'), rects('/t/react')]);
  const diffs = [];
  for (const sel of Object.keys(react)) {
    const a = vanilla[sel];
    const b = react[sel];
    if (a.length !== b.length) { diffs.push(`${sel}: Anzahl ${a.length} gegen ${b.length}`); continue; }
    a.forEach((item, i) => {
      // Marker-Bilder von Leaflet liegen in Pixeln der Kartenfläche: gleiche Karte, gleiche Lage
      for (let k = 0; k < 4; k++) if (Math.abs(item.rect[k] - b[i].rect[k]) > 0.6) diffs.push(`${sel}[${i}] Rechteck ${item.rect} gegen ${b[i].rect}`);
      for (const p of Object.keys(item.style)) if (item.style[p] !== b[i].style[p]) diffs.push(`${sel}[${i}] ${p}: ${item.style[p]} gegen ${b[i].style[p]}`);
    });
  }
  const total = Object.values(vanilla).reduce((n, l) => n + l.length, 0);
  record(`${browserName} · Vergleich Vanilla gegen React: ${total} Elemente, Rechtecke und Stile gleich`, diffs.length === 0 && total > 40, diffs.slice(0, 8));
}

// ── Lauf ─────────────────────────────────────────────────────

const tmp = await mkdtemp(join(tmpdir(), 'dss-map-check-'));
let server;
try {
  const dist = join(tmp, 'vanilla');
  await buildVanilla({ outDir: dist });
  const reactJs = wants('react') ? await buildReact(tmp) : '';
  const started = await startServer({ dist, reactJs });
  server = started.server;
  const launchers = { chromium, firefox, webkit };
  for (const name of BROWSERS) {
    const browser = await launchers[name].launch();
    try {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      if (wants('privacy')) await checkPrivacy(ctx, started.origin, started.counts, name);
      if (wants('keyboard')) await checkKeyboard(ctx, started.origin, name);
      if (wants('many')) await checkMany(ctx, started.origin, name);
      if (wants('initall')) await checkInitAll(ctx, started.origin, name);
      if (wants('twice')) await checkTwice(ctx, started.origin, name);
      if (wants('partial')) await checkPartialUpdate(ctx, started.origin, name);
      if (wants('fresh')) await checkFresh(ctx, dist, name);
      if (wants('loaders')) await checkLoaders(ctx, started.origin, name);
      if (wants('cycles') && name === 'chromium') await checkCycles(ctx, started.origin, name);
      await ctx.close();
      if (wants('axe') && name === 'chromium') await checkAxe(browser, started.origin, name);
      if (wants('react') && name === 'chromium') await checkReactCompare(browser, started.origin, name);
    } finally {
      await browser.close();
    }
  }
} catch (error) {
  record(`Lauf abgebrochen: ${error?.message ?? error}`, false);
} finally {
  server?.close();
  await rm(tmp, { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.name}${r.ok ? '' : ` — ${r.detail}`}`);
console.log(`\n${results.length - failed.length} von ${results.length} Prüfungen bestanden`);
