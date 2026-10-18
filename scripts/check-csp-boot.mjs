#!/usr/bin/env node
/**
 * Boot-Skript gegen echte Content-Security-Policy (Lückenplan 2.2): `themeBootScript()` als Inline-Skript im `<head>`, freigegeben per Hash
 * oder per nonce, in Chromium, Firefox und WebKit (Playwright).
 *
 *   node scripts/check-csp-boot.mjs                         # Chromium, Firefox, WebKit
 *   node scripts/check-csp-boot.mjs --browsers=chromium     # einzeln
 *
 * Der Hash wird genau mit dem Befehl aus der Doku berechnet (`cspHeader` in stories/Foundation/DarkMode.code.ts: printf | openssl) und mit dem
 * Hash aus node:crypto verglichen. Geprüfte Fälle je Browser:
 *  - Hash im Header, Hash im meta-Element, nonce im Header (je Antwort neu): das Skript läuft, die gemerkte Wahl steht vor dem ersten
 *    Zeichnen auf `<html>` (eine Probe direkt dahinter liest sie), keine CSP-Verletzung; das Bündel (`initAll`, Theme-Umschalter) läuft unter
 *    `default-src 'self'; style-src 'self'` mit;
 *  - Gegenproben: ohne Freigabe, mit falscher nonce und mit dem Standard-Hash für ein Skript mit anderen Optionen wird das Skript blockiert
 *    (Verletzung von script-src gemeldet), die Seite funktioniert weiter, nur das Attribut fehlt bis zum Laden des Bündels.
 * Ergebnis als JSON auf stdout; Exit-Code 1 bei jedem Fehlschlag. Ein Browser, der nicht startet, erscheint als „nicht gestartet“.
 * Läuft nicht unter `npm test` (braucht Browser); der Rezept-Hash ohne Browser steht in tests/csp-boot.test.ts.
 */
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { buildVanilla } from './build-vanilla.mjs';
import { themeBootScript } from '../js/theme.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
// Das Rezept steht in einer TypeScript-Datei der Doku: als Text gelesen (kein TypeScript-Import nötig), Backslashes wie im Template-Literal
const docSource = await readFile(join(ROOT, 'stories/Foundation/DarkMode.code.ts'), 'utf8');
const cspHeader = (docSource.match(/export const cspHeader = `([\s\S]*?)`;/)?.[1] ?? '').replace(/\\\\/g, '\\');
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = 'true'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const BROWSERS = (args.browsers ?? 'chromium,firefox,webkit').split(',');
const ENGINES = { chromium, firefox, webkit };
const results = [];
const notStarted = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  if (!ok) process.exitCode = 1;
};
const sha = (text) => createHash('sha256').update(text, 'utf8').digest('base64');

// ── Rezept aus der Doku ausführen ────────────────────────────

/** Der Shell-Befehl aus der Doku (zwei Zeilen: printf … | openssl …), ausgeführt im Repository (Selbstbezug auf @hoopsfoundry/ui). */
export function recipeHash(header = cspHeader, cwd = ROOT) {
  const lines = header.split('\n');
  const start = lines.findIndex((l) => l.startsWith('printf '));
  if (start < 0) throw new Error('Rezept ohne printf-Zeile');
  // die erste Zeile endet mit einem Backslash: die Shell setzt die Zeilen genau wie in der Doku zusammen
  const command = `${lines[start]}\n${lines[start + 1]}`;
  return execFileSync('sh', ['-c', command], { cwd, encoding: 'utf8' }).trim();
}

const BOOT = themeBootScript();
const BOOT_DARK = themeBootScript({ defaultMode: 'dark' });
const HASH = sha(BOOT);
const fromRecipe = recipeHash();
record('Rezept der Doku (printf | openssl) ergibt denselben Hash wie node:crypto', fromRecipe === HASH, { fromRecipe, HASH });
record('ein Skript mit anderen Optionen hat einen anderen Hash (der Hash hängt an den Optionen)', sha(BOOT_DARK) !== HASH, { dark: sha(BOOT_DARK) });

// ── Seiten ────────────────────────────────────────────────────

const BASE = "default-src 'self'; style-src 'self'; img-src 'self'";
/** Fälle: CSP (Header oder meta), Skript, nonce am Tag, Erwartung. `{nonce}` wird je Antwort ersetzt. */
const CASES = {
  hash: { header: `${BASE}; script-src 'self' 'sha256-${HASH}'`, script: BOOT, expect: 'läuft' },
  meta: { meta: `${BASE}; script-src 'self' 'sha256-${HASH}'`, script: BOOT, expect: 'läuft' },
  nonce: { header: `${BASE}; script-src 'self' 'nonce-{nonce}'`, script: BOOT, nonce: true, expect: 'läuft' },
  ohne: { header: `${BASE}; script-src 'self'`, script: BOOT, expect: 'blockiert' },
  'falsche-nonce': { header: `${BASE}; script-src 'self' 'nonce-{nonce}'`, script: BOOT, nonce: 'falsch', expect: 'blockiert' },
  'hash-andere-optionen': { header: `${BASE}; script-src 'self' 'sha256-${HASH}'`, script: BOOT_DARK, expect: 'blockiert' },
};
const nonces = [];

const page = (c, nonce) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${c.meta ? `<meta http-equiv="Content-Security-Policy" content="${c.meta}">` : ''}<title>CSP</title>
<script src="/t/listen.js"></script>
<script${c.nonce ? ` nonce="${c.nonce === true ? nonce : 'falsch'}"` : ''}>${c.script}</script>
<script src="/t/probe.js"></script>
<link rel="stylesheet" href="/hoops/hoops.css">
<script type="module" src="/t/start.js"></script></head>
<body><main><h1>Boot-Skript unter CSP</h1><p><button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" data-hoops="theme" hidden></button></p></main></body></html>`;

const STATIC = {
  '/t/listen.js': 'window.__csp = []; document.addEventListener("securitypolicyviolation", function (e) { window.__csp.push(e.violatedDirective + " " + (e.blockedURI || "")); });',
  '/t/probe.js': 'window.__early = document.documentElement.getAttribute("data-theme");',
  '/t/start.js': "import { initAll } from '/hoops/hoops.min.js';\nimport '/hoops/hoops-i18n-de.min.js';\n(await import('/hoops/hoops.min.js')).setLocale('de');\ninitAll();\nwindow.__ready = true;",
};
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };

async function startServer(dist) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const name = path.match(/^\/fall\/([\w-]+)\.html$/)?.[1];
    if (name && CASES[name]) {
      const c = CASES[name];
      const nonce = randomBytes(18).toString('base64');
      nonces.push(nonce);
      const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };
      if (c.header) headers['content-security-policy'] = c.header.replace('{nonce}', nonce);
      res.writeHead(200, headers);
      return res.end(page(c, nonce));
    }
    const staticBody = STATIC[path];
    const file = path.startsWith('/hoops/') ? join(dist, path.slice('/hoops/'.length)) : null;
    if (staticBody || (file && existsSync(file))) {
      res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      return res.end(staticBody ?? await readFile(file));
    }
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('nicht da');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

async function runCase(browserName, ctx, srv, name) {
  const c = CASES[name];
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
  // gemerkte Wahl „dunkel“ vor dem ersten Skript der Seite
  await page.addInitScript(() => { try { localStorage.setItem('hoops-theme', 'dark'); } catch (e) { /* Speicher gesperrt */ } });
  await page.goto(`${srv.origin}/fall/${name}.html`, { waitUntil: 'load' });
  const start = Date.now();
  while (!(await page.evaluate(() => window.__ready === true)) && Date.now() - start < 5000) await page.waitForTimeout(40);
  await page.waitForTimeout(150);
  const info = await page.evaluate(() => ({
    early: window.__early, csp: window.__csp, ready: window.__ready === true,
    late: document.documentElement.getAttribute('data-theme'),
    button: (() => { const b = document.querySelector('[data-hoops="theme"]'); return { hidden: b.hidden, pressed: b.getAttribute('aria-pressed') }; })(),
  }));
  const scriptViolations = info.csp.filter((v) => /^script-src/.test(v));
  const otherViolations = info.csp.filter((v) => !/^script-src/.test(v));
  const bundleOk = info.ready && !info.button.hidden && info.button.pressed === 'true' && info.late === 'dark' && errors.length === 0 && otherViolations.length === 0;
  if (c.expect === 'läuft') {
    record(`${browserName} · ${name}: Boot-Skript läuft, data-theme="dark" vor dem ersten Zeichnen, keine CSP-Verletzung`, info.early === 'dark' && info.csp.length === 0, info);
  } else {
    record(`${browserName} · ${name}: Boot-Skript blockiert (Verletzung von script-src gemeldet, kein Attribut vor dem Bündel)`, info.early === null && scriptViolations.length >= 1, info);
  }
  record(`${browserName} · ${name}: Bündel läuft unter der CSP (initAll, Umschalter gedrückt, data-theme="dark", keine Seitenfehler, keine weitere Verletzung)`, bundleOk, { ...info, errors });
  await page.close();
}

const dir = await mkdtemp(join(tmpdir(), 'hoops-csp-'));
const dist = join(dir, 'dist');
await buildVanilla({ outDir: dist });
const srv = await startServer(dist);
const versions = {};
try {
  for (const name of BROWSERS) {
    let browser;
    try {
      browser = await ENGINES[name].launch({ timeout: 30000 });
    } catch (error) {
      notStarted.push({ browser: name, reason: String(error.message).replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter((l) => /err\]|Timeout/.test(l) && !l.startsWith('  - ')).slice(0, 2).join(' | ') });
      continue;
    }
    versions[name] = browser.version();
    const ctx = await browser.newContext();
    for (const c of Object.keys(CASES)) await runCase(name, ctx, srv, c);
    await ctx.close();
    await browser.close();
  }
  record('nonce ist je Antwort neu (keine zwei gleichen Werte)', nonces.length > 1 && new Set(nonces).size === nonces.length, { count: nonces.length });
} finally {
  await srv.close();
  await rm(dir, { recursive: true, force: true });
}
console.log(JSON.stringify({ versions, notStarted, hash: `sha256-${HASH}`, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }, null, 2));
