#!/usr/bin/env node
/**
 * Browser-Prüfung der Beispiel-Portalseite stories/examples/portal-seite (Vereinsseite und Teamseite, reines HTML ohne Build).
 *
 *   node scripts/check-portal-seite.mjs                              # Chromium, alle Prüfungen
 *   node scripts/check-portal-seite.mjs --browsers=chromium,webkit,firefox
 *   node scripts/check-portal-seite.mjs --only=csp,keyboard
 *
 * Die Prüfung geht den echten Auslieferungsweg: baut dist/vanilla in einen temporären Ordner, erzeugt daraus das Release (scripts/release-vanilla.mjs),
 * legt es auf einen lokalen Server, holt es mit dem Release-Anhang dss-sync.mjs (--from-release, Prüfsumme) in ein leeres Projekt und liefert die Seite von dort aus,
 * mit strenger Content-Security-Policy (default-src 'self'; script-src 'self' 'sha256-<Boot-Skript>'; style-src 'self'; img-src 'self' <Kachel-Host>).
 * Der Kachel-Host ist ein zweiter lokaler Server (localhost, anderer Port). Geprüft wird: keine Konsolenfehler, keine fremden Anfragen vor dem Klick,
 * keine CSP-Verletzung, Karte nach dem Klick, Tastatur (Tab-Reihenfolge, sichtbarer Fokusring, Dialog, Accordion, Tabs), kein seitliches Scrollen bei
 * 420, 360 und 320 px (WCAG 1.4.10), Betrieb unter einem Unterpfad (GitHub-Pages-Projektseite), Verhalten ohne JavaScript (noscript, Knopf verborgen),
 * Theme-Umschalter, Seitennavigation, Nach oben, Versionsabgleich JS↔CSS, axe (WCAG 2.x A/AA/AAA, 2.2, best-practice, Kontrast AAA, Zielgröße)
 * in BBV/DBB × hell/dunkel × 1280/420 px. Ergebnis als JSON (Tabelle der Prüfungen) auf stdout; Exit-Code 1 bei jedem Fehlschlag. Läuft nicht
 * unter `npm test` (braucht Browser).
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { buildVanilla } from './build-vanilla.mjs';
import { releaseVanilla } from './release-vanilla.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const BROWSERS = (args.browsers ?? 'chromium').split(',');
const ONLY = args.only ? args.only.split(',') : null;
const wants = (key) => !ONLY || ONLY.includes(key);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.map': 'application/json' };
const results = [];
const skipped = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  if (!ok) process.exitCode = 1;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, label, ms = 10000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`Zeitüberschreitung: ${label}`);
    await sleep(40);
  }
}

// ── Aufbau: bauen, Release erzeugen, vom lokalen Server holen, Seite ausliefern ──

async function setup() {
  const dir = await mkdtemp(join(tmpdir(), 'dss-portal-'));
  const dist = join(dir, 'dist');
  await buildVanilla({ outDir: dist });
  const release = await releaseVanilla({ bundleDir: dist, outDir: join(dir, 'release'), build: false, allowDirty: true });
  const files = new Map();
  for (const name of ['tgz', 'sha256']) {
    const file = `dss-vanilla-${release.version}.${name}`;
    files.set(`/v${release.version}/${file}`, await readFile(join(dir, 'release', file)));
  }
  const releaseServer = createServer((req, res) => {
    const body = files.get(new URL(req.url, 'http://x').pathname);
    res.writeHead(body ? 200 : 404, { 'content-length': body ? body.length : 0 });
    res.end(body);
  });
  await new Promise((r) => releaseServer.listen(0, '127.0.0.1', r));
  const project = join(dir, 'projekt');
  await mkdir(join(project, 'node_modules'), { recursive: true });
  await symlink(join(ROOT, 'node_modules/leaflet'), join(project, 'node_modules/leaflet'));
  // der Release-Anhang dss-sync.mjs (eine Datei) läuft in einem fremden Ordner, ohne Zugriff auf dieses Repository
  const syncFile = join(dir, 'release', 'dss-sync.mjs');
  // asynchron: der Release-Server läuft in diesem Prozess und muss antworten können, während dss-sync.mjs lädt
  const run = await new Promise((done) => {
    const child = spawn(process.execPath, [syncFile, '--from-release', release.version, '--base-url', `http://127.0.0.1:${releaseServer.address().port}`, '--leaflet', '--no-fonts'], { cwd: project });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (status) => done({ status, stdout, stderr }));
  });
  await new Promise((r) => releaseServer.close(r));
  if (run.status !== 0) throw new Error(`dss-sync.mjs ist fehlgeschlagen: ${run.stderr}`);
  const synced = { version: run.stdout.match(/ (\d+\.\d+\.\d+\S*) nach /)?.[1], leaflet: /Leaflet nach/.test(run.stdout) };
  const site = join(project, '_site');
  await cp(join(ROOT, 'stories/examples/portal-seite'), site, { recursive: true });
  return { dir, site, version: release.version, synced, releaseBytes: release.tgz.length };
}

async function startServers(site) {
  const demo = await readFile(join(ROOT, 'stories/assets/tiles/demo.png'));
  const log = { site: [], tiles: [] };
  const tiles = createServer((req, res) => {
    log.tiles.push(new URL(req.url, 'http://x').pathname);
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' });
    res.end(demo);
  });
  await new Promise((r) => tiles.listen(0, '127.0.0.1', r));
  const tileOrigin = `http://localhost:${tiles.address().port}`;
  const boot = (await readFile(join(site, 'index.html'), 'utf8')).match(/<script>([^<]*)<\/script>/)?.[1] ?? '';
  const bootHash = createHash('sha256').update(boot).digest('base64');
  const csp = `default-src 'self'; script-src 'self' 'sha256-${bootHash}'; style-src 'self'; img-src 'self' ${tileOrigin}`;
  const server = createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    // Unterpfad wie bei einer GitHub-Pages-Projektseite (https://<nutzer>.github.io/<repo>/): die relativen Pfade der Seite müssen auch dort tragen
    if (path.startsWith('/projekt/') || path === '/projekt') path = path.slice('/projekt'.length);
    if (path === '/' || path === '') path = '/index.html';
    log.site.push(path);
    const file = join(site, path);
    if (!existsSync(file) || !extname(file)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('nicht da');
    }
    let body = await readFile(file);
    const headers = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' };
    if (path.endsWith('.html')) {
      headers['content-security-policy'] = csp;
      body = Buffer.from(body.toString('utf8').replace('content="/tiles/{z}/{x}/{y}.png"', `content="${tileOrigin}/tiles/{z}/{x}/{y}.png"`));
    }
    res.writeHead(200, headers);
    res.end(body);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, tileOrigin, log, csp, bootHash, boot, close: async () => { await new Promise((r) => server.close(r)); await new Promise((r) => tiles.close(r)); } };
}

// ── Hilfen ───────────────────────────────────────────────────

const PAGES = [['index.html', 'Vereinsseite'], ['team.html', 'Teamseite']];
const AXE_SOURCE = await readFile(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const AXE_EXTRA = ['color-contrast-enhanced', 'target-size', 'landmark-unique', 'heading-order'];

async function openPage(ctx, origin, path, hooks = {}) {
  const page = await ctx.newPage();
  const seen = { console: [], errors: [], failed: [], requests: [] };
  page.on('console', (m) => { if (m.type() === 'error') seen.console.push(m.text()); });
  page.on('pageerror', (e) => seen.errors.push(String(e.message ?? e)));
  page.on('requestfailed', (r) => seen.failed.push(r.url()));
  page.on('request', (r) => seen.requests.push(r.url()));
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await hooks.before?.(page);
  await page.goto(`${origin}/${path}`, { waitUntil: 'networkidle' });
  await waitFor(() => page.evaluate(() => document.documentElement.getAttribute('data-portal')), `Seite ${path}`);
  return { page, seen };
}

async function axeRun(page) {
  await page.evaluate(AXE_SOURCE);
  return page.evaluate(async ({ tags, extra }) => {
    const rules = Object.fromEntries(extra.map((id) => [id, { enabled: true }]));
    const out = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, rules });
    return out.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} · ${(n.failureSummary || '').split('\n')[1]}`) }));
  }, { tags: AXE_TAGS, extra: AXE_EXTRA });
}

const applyTheme = (page, { brand, theme }) => page.evaluate(({ brand, theme }) => {
  const root = document.documentElement;
  if (brand === 'dbb') root.setAttribute('data-brand', 'dbb'); else root.removeAttribute('data-brand');
  root.setAttribute('data-theme', theme);
}, { brand, theme });

const describeFocus = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  return { tag: el.tagName.toLowerCase(), id: el.id, cls: String(el.className).slice(0, 40), text: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), inDialog: Boolean(el.closest('dialog')) };
});

// ── Prüfungen ────────────────────────────────────────────────

async function checkLoad(ctx, srv, name, context) {
  for (const [path, label] of PAGES) {
    const { page, seen } = await openPage(ctx, srv.origin, path);
    await sleep(300);
    const hosts = new Set(seen.requests.map((u) => new URL(u).origin));
    const urls = seen.requests.map((u) => new URL(u).pathname);
    const csp = await page.evaluate(() => window.__csp);
    const info = await page.evaluate(() => ({
      versions: document.documentElement.getAttribute('data-dss-versions'),
      ready: document.documentElement.getAttribute('data-portal'),
      cards: document.querySelectorAll('.dss-lc, .dss-tc, .dss-st, .dss-venue, [class*="dss-venue"]').length,
      h1: document.querySelectorAll('h1').length,
      navLinks: document.querySelectorAll('.dss-pagenav a').length,
      markerCount: document.querySelectorAll('.leaflet-marker-icon').length,
      cookie: document.cookie, local: localStorage.length, session: sessionStorage.length,
    }));
    record(`${name} · ${label}: Seite fertig, 0 Konsolenfehler, keine Seitenfehler, keine fehlgeschlagenen Anfragen`, info.ready === 'ready' && seen.console.length === 0 && seen.errors.length === 0 && seen.failed.length === 0, { info, console: seen.console, errors: seen.errors, failed: seen.failed });
    record(`${name} · ${label}: Versionsabgleich JS↔CSS (Kern, Render, Karte, dss.css) = ${context.version}`, info.versions === context.version, info.versions);
    record(`${name} · ${label}: vor dem Klick nur der eigene Host, kein Leaflet, keine Kachel, kein Cookie, kein Speicher`,
      hosts.size === 1 && hosts.has(srv.origin) && !urls.some((u) => u.includes('/vendor/leaflet/') && u.endsWith('.js')) && !urls.some((u) => u.startsWith('/tiles/')) && info.cookie === '' && info.local === 0 && info.session === 0 && srv.log.tiles.length === 0,
      { hosts: [...hosts], tiles: srv.log.tiles.length });
    record(`${name} · ${label}: keine Verletzung der Content-Security-Policy beim Laden`, csp.length === 0, csp);
    if (process.env.DUMP) console.error(await page.evaluate(() => document.body.innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '').slice(0, 6000)));
    record(`${name} · ${label}: genau eine h1, Seitennavigation mit mindestens 3 Einträgen`, info.h1 === 1 && info.navLinks >= 3, { h1: info.h1, navLinks: info.navLinks });
    await page.close();
  }
}

async function checkMap(ctx, srv, name) {
  for (const [path, label] of PAGES) {
    const { page, seen } = await openPage(ctx, srv.origin, path);
    const before = srv.log.tiles.length;
    const requestsBefore = seen.requests.length;
    await page.click('.dss-venue .dss-map-load, .dss-map-load');
    await waitFor(() => page.evaluate(() => document.querySelector('.dss-map')?.getAttribute('data-state') === 'ready'), 'Karte bereit');
    await sleep(500);
    const after = seen.requests.slice(requestsBefore).map((u) => new URL(u));
    const hosts = new Set(after.map((u) => u.origin));
    const info = await page.evaluate(() => ({ csp: window.__csp, markers: document.querySelectorAll('.leaflet-marker-icon').length, tiles: document.querySelectorAll('.leaflet-tile-loaded').length, focus: document.activeElement?.className ?? '' }));
    record(`${name} · ${label}: nach dem Klick lokales Leaflet und Kacheln nur vom Kachel-Host (${srv.tileOrigin})`,
      srv.log.tiles.length > before && after.some((u) => u.pathname.includes('leaflet-src.esm.js')) && [...hosts].every((h) => h === srv.origin || h === srv.tileOrigin) && info.tiles > 0 && info.markers >= 1, { hosts: [...hosts], ...info, csp: undefined });
    record(`${name} · ${label}: Karte unter strenger CSP ohne Verletzung, 0 Konsolenfehler`, info.csp.length === 0 && seen.console.length === 0 && seen.errors.length === 0, { csp: info.csp, console: seen.console, errors: seen.errors });
    await page.close();
  }
}

// WebKit unter macOS springt mit Tab nicht auf Links und Schaltflächen (Systemeinstellung „Tab hebt jedes Element hervor“ aus); Alt+Tab tut es
let TAB = 'Tab';
async function checkKeyboard(ctx, srv, name) {
  TAB = name === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  // Tab-Reihenfolge: jeder fokussierte Knoten folgt im Dokument auf den vorigen; kein positives tabindex
  for (const [path, label] of PAGES) {
    const { page } = await openPage(ctx, srv.origin, path);
    const positive = await page.evaluate(() => document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length);
    await page.evaluate(() => { window.__order = []; document.addEventListener('focusin', (e) => window.__order.push(e.target), true); });
    const names = [];
    let ring = null;
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press(TAB);
      const d = await describeFocus(page);
      if (!d) break;
      names.push(d);
      // Fokusring des ersten Ziels (Sprunglink) messen, solange er den Fokus hat
      if (i === 0) ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) }; });
    }
    record(`${name} · ${label}: der Sprunglink hat beim Fokus den gestrichelten Ring der Tokens (3 px)`, ring?.style === 'dashed' && ring.width >= 3, ring);
    const ordered = await page.evaluate(() => window.__order.every((el, i, a) => i === 0 || (a[i - 1].compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 || a[i - 1] === el));
    const visible = await page.evaluate(() => window.__order.every((el) => el.getClientRects().length > 0));
    record(`${name} · ${label}: Tab-Reihenfolge folgt dem Dokument, nur sichtbare Ziele, kein positives tabindex`,
      positive === 0 && ordered && visible && names.length > 8 && names[0].text === 'Zum Inhalt', { first: names.slice(0, 6).map((n) => n.text), count: names.length, ordered, visible, positive });
    await page.close();
  }
  // Dialog
  {
    const { page } = await openPage(ctx, srv.origin, 'index.html');
    await page.focus('[data-dss-modal-open="fehler-melden"]');
    await page.keyboard.press('Enter');
    await waitFor(() => page.evaluate(() => document.getElementById('fehler-melden')?.open), 'Dialog offen');
    const first = await describeFocus(page);
    // Tab bleibt im Dialog; läuft der Fokus über das Ende hinaus, darf er (je nach Browser) kurz in die Browser-Oberfläche wechseln (activeElement
    // ist dann body), aber nie auf ein Element der Seite dahinter
    let inside = true;
    const stops = new Set();
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press(TAB);
      const d = await describeFocus(page);
      if (d) {
        inside = inside && d.inDialog;
        stops.add(`${d.cls}|${d.text}`);
      }
    }
    inside = inside && stops.size >= 3;
    const inertBehind = await page.evaluate(() => document.querySelector('main')?.hasAttribute('inert') || document.getElementById('fehler-melden').matches(':modal'));
    await page.keyboard.press('Escape');
    await waitFor(() => page.evaluate(() => !document.getElementById('fehler-melden').open), 'Dialog zu');
    const back = await describeFocus(page);
    record(`${name} · Dialog „Fehler melden“: Fokus im Dialog, Tab bleibt darin, Escape schließt, Fokus zurück auf den Auslöser`, first?.inDialog && inside && inertBehind && back?.text === 'Fehler melden', { first, inside, back });
    await page.close();
  }
  // Tabs und Accordion (Teamseite)
  {
    const { page } = await openPage(ctx, srv.origin, 'team.html');
    await page.focus('#ort-alle');
    await page.keyboard.press('ArrowRight');
    const afterRight = await page.evaluate(() => ({ sel: document.querySelector('[role=tab][aria-selected=true]')?.id, focus: document.activeElement.id, heimShown: !document.getElementById('ort-heim-panel').hidden, alleHidden: document.getElementById('ort-alle-panel').hidden }));
    await page.keyboard.press('End');
    const afterEnd = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]')?.id);
    await page.keyboard.press('Home');
    const afterHome = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]')?.id);
    record(`${name} · Tabs Alle/Heim/Auswärts: Pfeil rechts, Ende, Pos1 wechseln Tab und Panel`, afterRight.sel === 'ort-heim' && afterRight.focus === 'ort-heim' && afterRight.heimShown && afterRight.alleHidden && afterEnd === 'ort-auswaerts' && afterHome === 'ort-alle', { afterRight, afterEnd, afterHome });
    const counts = await page.evaluate(() => [...document.querySelectorAll('[role=tabpanel]')].map((p) => p.querySelectorAll('tbody tr, .dss-sched-row, tr').length));
    const trigger = '.dss-acc-trigger';
    await page.focus(trigger);
    await page.keyboard.press('Enter');
    const open = await page.evaluate((s) => document.querySelector(s).getAttribute('aria-expanded'), trigger);
    await page.keyboard.press('Space');
    const closed = await page.evaluate((s) => document.querySelector(s).getAttribute('aria-expanded'), trigger);
    record(`${name} · Einklappbare Tabellen: Enter öffnet, Leertaste schließt`, open === 'true' && closed === 'false', { open, closed, counts });
    await page.close();
  }
}

async function checkLayout(browser, srv, name) {
  for (const [path, label] of PAGES) {
    for (const width of [420, 360, 320]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 } });
      const { page } = await openPage(ctx, srv.origin, path);
      await page.click('.dss-map-load');
      await waitFor(() => page.evaluate(() => document.querySelector('.dss-map')?.getAttribute('data-state') === 'ready'), 'Karte');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      record(`${name} · ${label} bei ${width} px: kein seitliches Scrollen der Seite`, overflow <= 0, { overflow });
      await ctx.close();
    }
  }
}

async function checkSubpath(ctx, srv, name) {
  const page = await ctx.newPage();
  const seen = { console: [], errors: [], failed: [] };
  page.on('console', (m) => { if (m.type() === 'error') seen.console.push(m.text()); });
  page.on('pageerror', (e) => seen.errors.push(String(e.message ?? e)));
  page.on('requestfailed', (r) => seen.failed.push(r.url()));
  for (const path of ['projekt/index.html', 'projekt/team.html']) {
    await page.goto(`${srv.origin}/${path}`, { waitUntil: 'networkidle' });
    await waitFor(() => page.evaluate(() => document.documentElement.getAttribute('data-portal')), `Unterpfad ${path}`);
    const info = await page.evaluate(() => ({ ready: document.documentElement.getAttribute('data-portal'), versions: document.documentElement.getAttribute('data-dss-versions'), cards: document.querySelectorAll('.dss-league, .dss-team, [class*="dss-venue"]').length }));
    record(`${name} · Unterpfad /${path}: Seite fertig (relative Pfade tragen), 0 Konsolenfehler, keine fehlgeschlagene Anfrage`, info.ready === 'ready' && seen.console.length === 0 && seen.errors.length === 0 && seen.failed.length === 0, { info, ...seen });
  }
  await page.close();
}

async function checkNoJs(browser, srv, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  for (const [path, label] of PAGES) {
    const page = await ctx.newPage();
    await page.goto(`${srv.origin}/${path}`, { waitUntil: 'load' });
    const info = await page.evaluate(() => null).catch(() => null);
    void info;
    const visible = await page.locator('.portal-noscript').isVisible();
    const report = await page.locator('[data-dss-modal-open]').isVisible();
    const h1 = await page.locator('h1').count();
    record(`${name} · ${label} ohne JavaScript: Hinweis sichtbar, Knopf „Fehler melden“ verborgen (er wäre wirkungslos), Überschrift vorhanden`, visible && !report && h1 === 1, { visible, report, h1 });
    await page.close();
  }
  await ctx.close();
}

async function checkBehavior(ctx, srv, name) {
  const { page } = await openPage(ctx, srv.origin, 'team.html');
  const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.click('[data-dss="theme"]');
  const changed = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.reload({ waitUntil: 'networkidle' });
  await waitFor(() => page.evaluate(() => document.documentElement.getAttribute('data-portal')), 'neu geladen');
  const kept = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  record(`${name} · Theme-Umschalter: wechselt und bleibt nach dem Neuladen (kein Flackern durch das Boot-Skript)`, changed !== before && kept === changed, { before, changed, kept });
  await page.evaluate(() => window.scrollTo(0, 2000));
  await waitFor(() => page.evaluate(() => document.querySelector('.dss-backtop, [class*="backtop"]') && !document.querySelector('.dss-backtop, [class*="backtop"]').hidden), 'Nach-oben sichtbar', 4000).catch(() => null);
  const visible = await page.evaluate(() => { const b = document.querySelector('.dss-backtop, [class*="backtop"]'); return Boolean(b) && getComputedStyle(b).visibility !== 'hidden' && b.getClientRects().length > 0; });
  await page.click('.dss-backtop, [class*="backtop"]');
  await sleep(600);
  const top = await page.evaluate(() => window.scrollY);
  record(`${name} · Nach oben: erscheint nach dem Scrollen, bringt an den Anfang`, visible && top === 0, { visible, top });
  const link = await page.evaluate(() => document.querySelector('.dss-pagenav a')?.getAttribute('href'));
  record(`${name} · Seitennavigation: Einträge verweisen auf vorhandene Abschnitte`, await page.evaluate(() => [...document.querySelectorAll('.dss-pagenav a')].every((a) => document.getElementById(new URL(a.href).hash.slice(1)))), { link });
  await page.close();
}

async function checkAxe(browser, srv, name, full) {
  const combos = [];
  const brands = full ? ['bbv', 'dbb'] : ['bbv'];
  const themes = full ? ['light', 'dark'] : ['light'];
  const widths = full ? [1280, 420] : [420];
  for (const brand of brands) for (const theme of themes) for (const width of widths) combos.push({ brand, theme, width });
  for (const [path, label] of PAGES) {
    for (const combo of combos) {
      const ctx = await browser.newContext({ viewport: { width: combo.width, height: 900 }, colorScheme: combo.theme });
      const { page } = await openPage(ctx, srv.origin, path);
      await applyTheme(page, combo);
      const idle = await axeRun(page);
      await page.click('.dss-map-load');
      await waitFor(() => page.evaluate(() => document.querySelector('.dss-map')?.getAttribute('data-state') === 'ready'), 'Karte');
      await sleep(300);
      // einklappbare Bereiche geöffnet prüfen
      await page.evaluate(() => document.querySelectorAll('.dss-acc-trigger[aria-expanded="false"]').forEach((b) => b.click()));
      await sleep(300);
      const ready = await axeRun(page);
      record(`${name} · axe ${label} ${combo.brand}/${combo.theme}/${combo.width}: vor und nach dem Klick (Karte, geöffnete Tabellen) ohne Verstöße`, idle.length === 0 && ready.length === 0, { idle, ready });
      await ctx.close();
    }
  }
}

async function checkContentChecks(ctx, srv, name) {
  // CSP-Text und Boot-Skript: der Hash gehört genau zum Inline-Skript der Seiten
  for (const [path, label] of PAGES) {
    const text = await readFile(join(srv.site, path), 'utf8');
    const scripts = [...text.matchAll(/<script>([^<]*)<\/script>/g)].map((m) => m[1]);
    const styleTags = (text.match(/<style[\s>]/g) ?? []).length;
    const inlineStyle = (text.match(/\sstyle="/g) ?? []).length;
    const handlers = (text.match(/\son[a-z]+="/g) ?? []).length;
    record(`${label}: genau ein Inline-Skript (Boot-Skript, per Hash erlaubt), kein style, kein Inline-Handler`, scripts.length === 1 && createHash('sha256').update(scripts[0]).digest('base64') === srv.bootHash && styleTags === 0 && inlineStyle === 0 && handlers === 0, { scripts: scripts.length, styleTags, inlineStyle, handlers });
  }
}

// ── Ablauf ───────────────────────────────────────────────────

const LAUNCHERS = { chromium, firefox, webkit };
const context = await setup();
context.site = context.site;
const srv = await startServers(context.site);
srv.site = context.site;
record(`Auslieferung: Release ${context.version} erzeugt, mit dem Anhang dss-sync.mjs (--from-release, Prüfsumme) geholt, Leaflet kopiert`, context.synced.version === context.version && context.synced.leaflet === true, { version: context.synced.version, tgzBytes: context.releaseBytes });
await checkContentChecks(null, srv, 'Inhalt');

const versionsOfBrowsers = {};
try {
  for (const name of BROWSERS) {
    let browser;
    try {
      browser = await LAUNCHERS[name].launch();
    } catch (error) {
      const lines = String(error.message).split('\n');
      skipped.push({ browser: name, reason: (lines.find((l) => /Could not find profile folder|Executable doesn't exist/.test(l)) ?? lines[0]).replace(/^\[pid=\d+\]\[err\]\s*/, '') });
      continue;
    }
    versionsOfBrowsers[name] = browser.version();
    srv.log.tiles.length = 0;
    try {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      // Ein Ausfall (Zeitüberschreitung, Browserfehler) wird als fehlgeschlagene Prüfung gemeldet, die übrigen laufen weiter
      const guard = async (label, fn) => {
        try {
          await fn();
        } catch (error) {
          record(`${name} · ${label}: Prüfung abgebrochen`, false, String(error.message).split('\n')[0]);
        }
      };
      if (wants('load')) await guard('load', () => checkLoad(ctx, srv, name, context));
      if (wants('map')) await guard('map', () => checkMap(ctx, srv, name));
      if (wants('keyboard')) await guard('keyboard', () => checkKeyboard(ctx, srv, name));
      if (wants('behavior')) await guard('behavior', () => checkBehavior(ctx, srv, name));
      if (wants('subpath')) await guard('subpath', () => checkSubpath(ctx, srv, name));
      await ctx.close();
      if (wants('layout')) await guard('layout', () => checkLayout(browser, srv, name));
      if (wants('nojs')) await guard('nojs', () => checkNoJs(browser, srv, name));
      if (wants('axe')) await guard('axe', () => checkAxe(browser, srv, name, name === 'chromium'));
    } finally {
      await browser.close();
    }
  }
} finally {
  await srv.close();
  await rm(context.dir, { recursive: true, force: true });
}

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ browsers: versionsOfBrowsers, skipped, total: results.length, failed: failed.length, results: results.map((r) => ({ ok: r.ok, name: r.name, detail: r.ok ? undefined : r.detail })) }, null, 2));
