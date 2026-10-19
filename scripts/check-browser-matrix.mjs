#!/usr/bin/env node
/**
 * Browser-Matrix der Kernbausteine (Lückenplan 2.1): dieselben Prüfungen in Chromium, Firefox und WebKit (Playwright), reines HTML ohne Storybook.
 *
 *   node scripts/check-browser-matrix.mjs                                   # Chromium, Firefox, WebKit
 *   node scripts/check-browser-matrix.mjs --browsers=chromium,webkit
 *   node scripts/check-browser-matrix.mjs --only=modal,theme --markdown     # Ergebnistabelle als Markdown statt JSON
 *   node scripts/check-browser-matrix.mjs --firefox-channel=moz-firefox     # System-Firefox über WebDriver BiDi statt Playwright-Firefox
 *
 * Gebaut wird dist/vanilla in einen temporären Ordner (scripts/build-vanilla.mjs); ein lokaler Server liefert die Bündel und die Prüfseiten aus.
 * Geprüft wird je Browser: Accordion (Klick, Enter, Panel sichtbar/verborgen, gestrichelter Fokusring), Tabs (Pfeile, Pos1/Ende, Panels),
 * Modal mit `<dialog>` (`:modal`, `::backdrop`-Farbe nur beim modalen Dialog, Top-Layer über einem Element mit z-index 2147483647, Fokus hinein,
 * Fokusfalle, Escape, Fokus zurück, Scroll-Sperre; mit show() statt showModal() werden drei Prüfungen rot),
 * Karten-Platzhalter (Zwei-Klick: keine Anfrage an Leaflet oder Kacheln, Knopf ≥ 44 px), PageNav (Navigation aus den Überschriften, Sprung mit
 * Fokus und Hash), Theme (Umschalter, `aria-pressed`, Speicher, Token wechseln, prefers-color-scheme ohne Wahl, Boot-Skript vor dem ersten
 * Zeichnen), Container-Abfragen (Hallenkarte einspaltig bei schmalem Behälter, zweispaltig bei breitem, unabhängig vom Fenster) und
 * Bewegung (Live-Punkt pulsiert, steht bei prefers-reduced-motion und data-motion="reduce" still; Ergebniszahlen pulsieren nie).
 * Ein Browser, der nicht startet, erscheint als „nicht gestartet“ mit Grund (Fehlschlag nur mit --strict); startet keiner der angeforderten
 * Browser, endet das Skript immer mit Exit-Code 1 und einer klaren Meldung (scripts/browser-launch.mjs).
 * Ergebnis: JSON (oder Markdown) auf stdout; Exit-Code 1 bei jedem Fehlschlag. Läuft nicht unter `npm test` (braucht Browser).
 */
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit } from 'playwright';
import { buildVanilla } from './build-vanilla.mjs';
import { exitIfNoKnownBrowser, requireOneStarted } from './browser-launch.mjs';
import { renderVenueCard } from '../js/render/venue-card.js';
import { registerLocale, setLocale } from '../js/i18n/index.js';
import de from '../js/i18n/de.js';

registerLocale('de', de);
setLocale('de');

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v = 'true'] = a.replace(/^--/, '').split('='); return [k, v]; }));
const BROWSERS = (args.browsers ?? 'chromium,firefox,webkit').split(',');
exitIfNoKnownBrowser(BROWSERS);
const ONLY = args.only ? args.only.split(',') : null;
const wants = (key) => !ONLY || ONLY.includes(key);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
const ENGINES = { chromium, firefox, webkit };

const results = [];
const notStarted = [];
const record = (browser, group, name, ok, detail = '') => {
  results.push({ browser, group, name, ok: Boolean(ok), detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
  if (!ok) process.exitCode = 1;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 4000) {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value || Date.now() - start > ms) return value;
    await sleep(40);
  }
}

// ── Seiten ────────────────────────────────────────────────────

const head = (title, extra = '') => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
${extra}<link rel="stylesheet" href="/hoops/hoops.css">
<style>body{margin:0;padding:1rem;background:var(--hoops-page-bg);color:var(--hoops-page-fg);font-family:var(--hoops-font-body)}main{max-width:60rem;margin:0 auto;display:grid;gap:1.5rem}</style></head><body>`;
const boot = (src) => `<script type="module">import { initAll } from '/hoops/hoops.min.js';\nimport '/hoops/hoops-i18n-de.min.js';\n(await import('/hoops/hoops.min.js')).setLocale('de');\n${src}\nwindow.__ready = true;</script></body></html>`;
const CHEVRON = '<svg class="hoops-acc-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M5 7.5l5 5 5-5"></path></svg>';
const LOREM = 'Die Mannschaft trainiert dienstags und donnerstags in der Sporthalle Nordhain. Gäste sind willkommen, Anmeldung über die Geschäftsstelle. ';

const PAGES = {
  '/accordion.html': () => `${head('Accordion')}<main><h1>Accordion</h1>
<div class="hoops-acc hoops-acc--card" data-hoops="accordion">
<div class="hoops-acc-item"><h2 class="hoops-acc-title"><button type="button" class="hoops-acc-trigger" id="a1-t" aria-expanded="false" aria-controls="a1-p"><span class="hoops-acc-label">Training</span>${CHEVRON}</button></h2>
<div class="hoops-acc-panel" id="a1-p" hidden inert><div class="hoops-acc-panel-inner"><div class="hoops-acc-body"><p>${LOREM}</p></div></div></div></div>
<div class="hoops-acc-item"><h2 class="hoops-acc-title"><button type="button" class="hoops-acc-trigger" id="a2-t" aria-expanded="false" aria-controls="a2-p"><span class="hoops-acc-label">Halle</span>${CHEVRON}</button></h2>
<div class="hoops-acc-panel" id="a2-p" hidden inert><div class="hoops-acc-panel-inner"><div class="hoops-acc-body"><p>${LOREM}</p></div></div></div></div></div>
<details class="hoops-acc-item" id="d1"><summary class="hoops-acc-trigger"><span class="hoops-acc-label">Natives details</span></summary><div class="hoops-acc-panel"><div class="hoops-acc-panel-inner"><div class="hoops-acc-body"><p>${LOREM}</p></div></div></div></details>
</main>${boot('initAll();')}`,
  '/tabs.html': () => `${head('Tabs')}<main><h1>Tabs</h1>
<div class="hoops-tabs hoops-tabs--underline hoops-tabs--md" role="tablist" aria-label="Ansicht" data-hoops="tabs">
${['Spiele', 'Tabelle', 'Kader'].map((label, i) => `<button type="button" class="hoops-tab${i === 0 ? ' is-active' : ''}" role="tab" id="t${i}" aria-selected="${i === 0}" aria-controls="t${i}-p" tabindex="${i === 0 ? 0 : -1}"><span class="hoops-tab-label">${label}</span></button>`).join('\n')}</div>
${['Spiele', 'Tabelle', 'Kader'].map((label, i) => `<div id="t${i}-p" role="tabpanel" aria-labelledby="t${i}" tabindex="0"${i === 0 ? '' : ' hidden'}><p>${label}: ${LOREM}</p></div>`).join('\n')}
</main>${boot('initAll();')}`,
  '/modal.html': () => `${head('Modal')}<main><h1>Modal</h1><div style="height:200vh"><button type="button" id="open" class="hoops-btn hoops-btn--primary hoops-btn--md" data-hoops-modal-open="dlg">Dialog öffnen</button></div>
<!-- Wachposten für den Top-Layer: höchstmöglicher z-index im normalen Stapel; nur ein Dialog im Top-Layer (showModal) liegt darüber -->
<div id="wache" aria-hidden="true" style="position:fixed;inset:0;z-index:2147483647;background:transparent"></div>
<dialog class="hoops-modal-dialog" id="dlg" data-hoops="modal" aria-labelledby="dlg-t"><div class="hoops-modal"><div class="hoops-m-head"><div class="hoops-m-head-text"><h2 class="hoops-m-title" id="dlg-t">Fehler melden</h2></div>
<button type="button" class="hoops-m-close" aria-label="Schließen"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8"/></svg></button></div>
<div class="hoops-m-body"><p>${LOREM}</p><button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--md" id="in1">Eins</button> <button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--md" id="in2">Zwei</button></div></div></dialog>
</main>${boot('initAll();')}`,
  '/map.html': () => `${head('Karte')}<main><h1>Karte</h1><section aria-labelledby="h"><h2 id="h">Halle</h2><div id="k"></div></section></main>
<script type="module">import { mountMap } from '/hoops/hoops-map.min.js';\nimport '/hoops/hoops-i18n-de.min.js';\n(await import('/hoops/hoops.min.js')).setLocale('de');
mountMap(document.getElementById('k'), { label: 'Karte der Halle', markers: [{ id: 'h', lat: 49.3, lng: 7.9, label: 'Sporthalle Nordhain' }], tileUrl: '/tiles/{z}/{x}/{y}.png', height: 260 }, { loadLeaflet: () => import('/vendor/leaflet/leaflet-src.esm.js') });
window.__ready = true;</script></body></html>`,
  '/pagenav.html': () => `${head('PageNav')}<main data-hoops="pagenav" data-hoops-options='{"label":"Auf dieser Seite"}'><h1>Verein</h1>
${['Training', 'Mannschaften', 'Halle', 'Kontakt'].map((t) => `<section><h2>${t}</h2><p>${LOREM.repeat(12)}</p></section>`).join('\n')}
</main>${boot('initAll();')}`,
  '/theme.html': () => `${head('Theme', `<script src="/t/theme-boot.js"></script><script src="/t/theme-probe.js"></script>`)}<main><h1>Theme</h1><p><button type="button" class="hoops-btn hoops-btn--secondary hoops-btn--icon" data-hoops="theme" hidden></button></p>
<div class="hoops-card" id="card" style="padding:1rem;background:var(--hoops-surface)">Fläche</div></main>${boot('initAll();')}`,
  '/container.html': () => `${head('Container')}<main style="max-width:none"><h1>Container-Abfragen</h1>
<section aria-labelledby="s"><h2 id="s">Schmale Spalte</h2><div id="schmal" style="width:520px">${renderVenueCard(HALLE, { uid: 'cq1' })}</div></section>
<section aria-labelledby="b"><h2 id="b">Breite Spalte</h2><div id="breit" style="width:960px">${renderVenueCard(HALLE, { uid: 'cq2' })}</div></section></main>
<script type="module">window.__ready = true;</script></body></html>`,
  '/motion.html': () => `${head('Bewegung')}<main><h1>Live</h1><p><span class="hoops-live"><span class="hoops-live-dot" id="dot" aria-hidden="true"></span> Live</span></p>
<table class="hoops-tbl hoops-tbl--schedule"><caption>Spiele</caption><tbody><tr class="hoops-sch-row is-live"><td><span class="hoops-sch-score" id="score">78 : 74</span></td></tr></tbody></table></main>
<script type="module">window.__ready = true;</script></body></html>`,
};
const HALLE = { name: 'Sporthalle Nordhain', address: { street: 'Am Sportpark 4', zip: '12345', city: 'Nordhain' }, lat: 49.3, lng: 7.9, tileUrl: '/tiles/{z}/{x}/{y}.png' };
// Boot-Skript als eigene Datei (wie ein Inline-Skript, aber ohne CSP-Frage; die CSP-Prüfung steht in scripts/check-csp-boot.mjs) und eine Probe direkt dahinter
const STATIC = {
  '/t/theme-probe.js': 'window.__early = document.documentElement.getAttribute("data-theme");',
};

async function startServer(dist) {
  const { themeBootScript } = await import('../js/theme.js');
  STATIC['/t/theme-boot.js'] = themeBootScript();
  const log = [];
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    log.push(path);
    const send = (status, type, body) => { res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' }); res.end(body); };
    if (PAGES[path]) return send(200, TYPES['.html'], PAGES[path]());
    if (STATIC[path]) return send(200, TYPES['.js'], STATIC[path]);
    if (path.startsWith('/hoops/')) {
      const file = join(dist, path.slice('/hoops/'.length));
      if (existsSync(file)) return send(200, TYPES[extname(file)] ?? 'application/octet-stream', await readFile(file));
    }
    send(404, 'text/plain', 'nicht da');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { origin: `http://127.0.0.1:${server.address().port}`, log, close: () => new Promise((r) => server.close(r)) };
}

async function open(ctx, srv, path) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(srv.origin + path, { waitUntil: 'load' });
  await waitFor(() => page.evaluate(() => window.__ready === true));
  return { page, errors };
}

const focusRing = (page) => page.evaluate(() => {
  const s = getComputedStyle(document.activeElement);
  return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
});

// ── Prüfungen ────────────────────────────────────────────────

async function checkAccordion(b, ctx, srv) {
  const { page, errors } = await open(ctx, srv, '/accordion.html');
  const state = () => page.evaluate(() => {
    const t = document.getElementById('a1-t');
    const p = document.getElementById('a1-p');
    return { expanded: t.getAttribute('aria-expanded'), hidden: p.hidden, inert: p.inert, height: Math.round(p.getBoundingClientRect().height) };
  });
  await page.click('#a1-t');
  const opened = await waitFor(async () => { const s = await state(); return s.expanded === 'true' && !s.hidden && s.height > 20 ? s : null; });
  record(b, 'Accordion', 'Klick öffnet: aria-expanded=true, Panel sichtbar und nicht inert', opened && !opened.inert, opened ?? await state());
  await page.focus('#a1-t');
  await page.keyboard.press('Enter');
  const closed = await waitFor(async () => { const s = await state(); return s.expanded === 'false' && s.hidden ? s : null; }, 3000);
  record(b, 'Accordion', 'Enter schließt: aria-expanded=false, Panel verborgen', closed, closed ?? await state());
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const ring = await focusRing(page);
  record(b, 'Accordion', 'Tastaturfokus zeigt den gestrichelten Ring (≥ 2 px)', ring.style === 'dashed' && ring.width >= 2, ring);
  await page.click('#d1 > summary');
  const details = await page.evaluate(() => ({ open: document.getElementById('d1').open, height: Math.round(document.querySelector('#d1 .hoops-acc-panel').getBoundingClientRect().height) }));
  record(b, 'Accordion', 'natives <details> öffnet ohne Skript, Inhalt sichtbar', details.open && details.height > 20, details);
  record(b, 'Accordion', 'keine Seitenfehler', errors.length === 0, errors);
  await page.close();
}

async function checkTabs(b, ctx, srv) {
  const { page, errors } = await open(ctx, srv, '/tabs.html');
  const state = () => page.evaluate(() => ({
    focus: document.activeElement?.id,
    selected: [...document.querySelectorAll('[role=tab]')].filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.id),
    visible: [...document.querySelectorAll('[role=tabpanel]')].filter((p) => !p.hidden).map((p) => p.id),
  }));
  await page.focus('#t0');
  await page.keyboard.press('ArrowRight');
  const s1 = await state();
  record(b, 'Tabs', 'Pfeil rechts: Fokus und Auswahl auf Tab 2, nur Panel 2 sichtbar', s1.focus === 't1' && s1.selected.join() === 't1' && s1.visible.join() === 't1-p', s1);
  await page.keyboard.press('End');
  const s2 = await state();
  await page.keyboard.press('Home');
  const s3 = await state();
  record(b, 'Tabs', 'Ende und Pos1 springen auf den letzten und ersten Tab', s2.focus === 't2' && s2.visible.join() === 't2-p' && s3.focus === 't0' && s3.visible.join() === 't0-p', { ende: s2, pos1: s3 });
  await page.keyboard.press('ArrowLeft');
  const s4 = await state();
  record(b, 'Tabs', 'Pfeil links auf dem ersten Tab: Fokus, Auswahl und Panel springen zum letzten', s4.focus === 't2' && s4.selected.join() === 't2' && s4.visible.join() === 't2-p', s4);
  record(b, 'Tabs', 'keine Seitenfehler', errors.length === 0, errors);
  await page.close();
}

async function checkModal(b, ctx, srv) {
  const { page, errors } = await open(ctx, srv, '/modal.html');
  await page.focus('#open');
  await page.keyboard.press('Enter');
  const opened = await waitFor(() => page.evaluate(() => {
    const d = document.getElementById('dlg');
    if (!d.open) return null;
    const bd = getComputedStyle(d, '::backdrop').backgroundColor;
    const r = d.querySelector('.hoops-modal').getBoundingClientRect();
    // Mitte der Dialogfläche: im Top-Layer liegt der Dialog über dem Wachposten (z-index 2147483647); mit show() statt showModal() träfe der Punkt den Wachposten
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      modal: d.matches(':modal'), backdrop: bd, focusInside: d.contains(document.activeElement), focus: document.activeElement?.className,
      overflow: document.documentElement.style.overflow, hit: hit?.id || hit?.className || hit?.tagName, hitDialog: d.contains(hit),
    };
  }));
  const transparent = !opened || /rgba\(0, 0, 0, 0\)|transparent/.test(opened.backdrop);
  record(b, 'Modal', 'showModal: dialog offen, :modal trifft zu', opened?.modal, opened);
  record(b, 'Modal', '::backdrop des modalen Dialogs hat eine deckende Farbe (nur gültig, wenn :modal zutrifft)', opened?.modal && !transparent, { modal: opened?.modal, backdrop: opened?.backdrop });
  record(b, 'Modal', 'Top-Layer: der Dialog liegt über einem Element mit z-index 2147483647', opened?.hitDialog, opened);
  record(b, 'Modal', 'Fokus geht in den Dialog, Seite scrollt nicht (overflow hidden)', opened?.focusInside && opened?.overflow === 'hidden', opened);
  const trail = [];
  for (let i = 0; i < 6; i += 1) {
    await page.keyboard.press('Tab');
    trail.push(await page.evaluate(() => (document.getElementById('dlg').contains(document.activeElement) ? document.activeElement.id || document.activeElement.className : `DRAUSSEN:${document.activeElement?.tagName}`)));
  }
  record(b, 'Modal', 'Fokusfalle: sechsmal Tab bleibt im Dialog', trail.every((x) => !String(x).startsWith('DRAUSSEN')), trail);
  await page.keyboard.press('Escape');
  const closed = await waitFor(() => page.evaluate(() => {
    const d = document.getElementById('dlg');
    return d.open ? null : { focus: document.activeElement?.id, overflow: document.documentElement.style.overflow };
  }));
  record(b, 'Modal', 'Escape schließt, Fokus zurück auf den Auslöser, Scroll-Sperre aufgehoben', closed?.focus === 'open' && closed?.overflow === '', closed);
  record(b, 'Modal', 'keine Seitenfehler', errors.length === 0, errors);
  await page.close();
}

async function checkMap(b, ctx, srv) {
  const before = srv.log.length;
  const { page, errors } = await open(ctx, srv, '/map.html');
  await sleep(300);
  const info = await page.evaluate(() => {
    const btn = document.querySelector('.hoops-map-load');
    const r = btn?.getBoundingClientRect();
    return { button: Boolean(btn), visible: btn ? btn.checkVisibility?.() ?? r.height > 0 : false, w: r && Math.round(r.width), h: r && Math.round(r.height), leaflet: Boolean(document.querySelector('.leaflet-container')), cookie: document.cookie, local: localStorage.length };
  });
  const asked = srv.log.slice(before);
  const foreign = asked.filter((p) => p.startsWith('/vendor/') || p.startsWith('/tiles/'));
  record(b, 'Karte', 'Platzhalter mit Knopf „Karte laden“, Knopf ≥ 44 px hoch', info.button && info.visible && info.h >= 44, info);
  record(b, 'Karte', 'vor dem Klick: kein Leaflet, keine Kachel, kein Cookie, kein Speicher', !info.leaflet && foreign.length === 0 && info.cookie === '' && info.local === 0, { foreign });
  record(b, 'Karte', 'keine Seitenfehler', errors.length === 0, errors);
  await page.close();
}

async function checkPageNav(b, ctx, srv) {
  const { page, errors } = await open(ctx, srv, '/pagenav.html');
  const nav = await waitFor(() => page.evaluate(() => {
    const n = document.querySelector('nav.hoops-pagenav');
    return n ? { label: n.getAttribute('aria-label') || n.getAttribute('aria-labelledby'), links: [...n.querySelectorAll('a')].map((a) => a.getAttribute('href')) } : null;
  }));
  record(b, 'PageNav', 'Navigation aus vier Überschriften (nav mit Namen, vier Links)', nav && nav.links.length === 4 && nav.label, nav);
  if (nav) {
    await page.click(`nav.hoops-pagenav a[href="${nav.links[2]}"]`);
    const jumped = await waitFor(() => page.evaluate((href) => {
      const target = document.getElementById(new URL(href, location.href).hash.slice(1));
      const r = target?.getBoundingClientRect();
      const ok = target && document.activeElement === target && location.hash === `#${target.id}` && r.top >= -2 && r.top < innerHeight;
      return ok ? { hash: location.hash, top: Math.round(r.top) } : null;
    }, nav.links[2]), 4000);
    record(b, 'PageNav', 'Sprung: Ziel im Bild, fokussiert, Hash gesetzt', jumped, jumped ?? await page.evaluate(() => ({ active: document.activeElement?.id, hash: location.hash, y: scrollY, top: document.activeElement?.getBoundingClientRect().top })));
  }
  record(b, 'PageNav', 'keine Seitenfehler', errors.length === 0, errors);
  await page.close();
}

async function checkTheme(b, engine, srv, launch) {
  // Hell als Systemeinstellung: der Umschalter startet ungedrückt
  const ctx = await launch({ colorScheme: 'light' });
  const { page, errors } = await open(ctx, srv, '/theme.html');
  const surface = () => page.evaluate(() => getComputedStyle(document.getElementById('card')).backgroundColor);
  const s0 = await page.evaluate(() => { const btn = document.querySelector('[data-hoops="theme"]'); return { hidden: btn.hidden, pressed: btn.getAttribute('aria-pressed'), label: btn.getAttribute('aria-label') || btn.textContent.trim(), attr: document.documentElement.getAttribute('data-theme') }; });
  const light = await surface();
  record(b, 'Theme', 'Umschalter sichtbar, Name gesetzt, aria-pressed=false bei hellem System', !s0.hidden && s0.pressed === 'false' && s0.label, s0);
  await page.click('[data-hoops="theme"]');
  const s1 = await page.evaluate(() => ({ pressed: document.querySelector('[data-hoops="theme"]').getAttribute('aria-pressed'), attr: document.documentElement.getAttribute('data-theme'), stored: localStorage.getItem('hoops-theme') }));
  const dark = await surface();
  record(b, 'Theme', 'Klick: data-theme=dark, aria-pressed=true, Wahl gespeichert, Fläche wechselt die Farbe', s1.pressed === 'true' && s1.attr === 'dark' && s1.stored === 'dark' && dark !== light, { ...s1, light, dark });
  await page.reload({ waitUntil: 'load' });
  await waitFor(() => page.evaluate(() => window.__ready === true));
  const early = await page.evaluate(() => window.__early);
  record(b, 'Theme', 'Boot-Skript: gemerkte Wahl steht vor dem ersten Zeichnen auf <html>', early === 'dark', early);
  record(b, 'Theme', 'keine Seitenfehler', errors.length === 0, errors);
  await ctx.close();
  // Dunkel als Systemeinstellung, keine gemerkte Wahl: Token folgen prefers-color-scheme
  const ctx2 = await launch({ colorScheme: 'dark' });
  const p2 = await open(ctx2, srv, '/theme.html');
  const sys = await p2.page.evaluate(() => ({ attr: document.documentElement.getAttribute('data-theme'), bg: getComputedStyle(document.getElementById('card')).backgroundColor, pressed: document.querySelector('[data-hoops="theme"]').getAttribute('aria-pressed') }));
  record(b, 'Theme', 'ohne Wahl folgt die Seite prefers-color-scheme: dark (kein Attribut, dunkle Fläche, aria-pressed=true)', sys.attr === null && sys.bg === dark && sys.pressed === 'true', { ...sys, erwartet: dark });
  await ctx2.close();
}

async function checkContainer(b, ctx, srv) {
  for (const width of [1280, 600]) {
    const page = await ctx.newPage();
    await page.setViewportSize({ width, height: 900 });
    await page.goto(srv.origin + '/container.html', { waitUntil: 'load' });
    const cols = await page.evaluate(() => Object.fromEntries(['schmal', 'breit'].map((id) => {
      const inner = document.querySelector(`#${id} .hoops-venue-in`);
      return [id, inner ? getComputedStyle(inner).gridTemplateColumns.split(' ').filter(Boolean).length : -1];
    })));
    const supports = await page.evaluate(() => CSS.supports('container-type: inline-size'));
    record(b, 'Container', `Fenster ${width} px: Hallenkarte im 520-px-Behälter einspaltig, im 960-px-Behälter zweispaltig`, supports && cols.schmal === 1 && cols.breit === 2, { ...cols, supports });
    await page.close();
  }
}

async function checkMotion(b, srv, launch) {
  const anim = async (ctx, setup) => {
    const { page } = await open(ctx, srv, '/motion.html');
    if (setup) await page.evaluate(setup);
    const out = await page.evaluate(() => ({ dot: getComputedStyle(document.getElementById('dot')).animationName, score: getComputedStyle(document.getElementById('score')).animationName }));
    await page.close();
    return out;
  };
  const ctx = await launch({ reducedMotion: 'no-preference' });
  const normal = await anim(ctx);
  const paused = await anim(ctx, () => document.documentElement.setAttribute('data-motion', 'reduce'));
  await ctx.close();
  const ctx2 = await launch({ reducedMotion: 'reduce' });
  const reduced = await anim(ctx2);
  await ctx2.close();
  record(b, 'Bewegung', 'Live-Punkt pulsiert (hoops-live-pulse), Ergebniszahl nie', normal.dot === 'hoops-live-pulse' && normal.score === 'none', normal);
  record(b, 'Bewegung', 'data-motion="reduce" und prefers-reduced-motion: reduce halten den Punkt an', paused.dot === 'none' && reduced.dot === 'none', { paused, reduced });
}

// ── Ablauf ───────────────────────────────────────────────────

const dir = await mkdtemp(join(tmpdir(), 'hoops-matrix-'));
const dist = join(dir, 'dist');
await buildVanilla({ outDir: dist });
const srv = await startServer(dist);
const versions = {};
try {
  for (const name of BROWSERS) {
    const engine = ENGINES[name];
    if (!engine) { notStarted.push({ browser: name, reason: 'unbekannt' }); continue; }
    let browser;
    try {
      const channel = name === 'firefox' && args['firefox-channel'] ? args['firefox-channel'] : undefined;
      browser = await engine.launch({ channel, timeout: 30000 });
    } catch (error) {
      const reason = String(error.message).replace(/\u001b\[[0-9;]*m/g, '').split('\n').filter((l) => !l.startsWith('  - ')).filter((l) => /err\]|Timeout|Executable/.test(l)).slice(0, 3).join(' | ') || String(error.message).split('\n')[0];
      notStarted.push({ browser: name, reason });
      if (args.strict) process.exitCode = 1;
      continue;
    }
    versions[name] = browser.version();
    const launch = (opts = {}) => browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
    const ctx = await launch();
    const run = async (key, fn) => {
      if (!wants(key)) return;
      try { await fn(); } catch (error) { record(name, key, `Prüfung ${key} abgebrochen`, false, String(error.message).split('\n')[0]); }
    };
    await run('accordion', () => checkAccordion(name, ctx, srv));
    await run('tabs', () => checkTabs(name, ctx, srv));
    await run('modal', () => checkModal(name, ctx, srv));
    await run('map', () => checkMap(name, ctx, srv));
    await run('pagenav', () => checkPageNav(name, ctx, srv));
    await run('theme', () => checkTheme(name, engine, srv, launch));
    await run('container', () => checkContainer(name, ctx, srv));
    await run('motion', () => checkMotion(name, srv, launch));
    await ctx.close();
    await browser.close();
  }
} finally {
  await srv.close();
  await rm(dir, { recursive: true, force: true });
}
requireOneStarted(BROWSERS, versions, notStarted);

if (args.markdown) {
  const ran = Object.keys(versions);
  const names = [...new Set(results.map((r) => `${r.group}|${r.name}`))];
  const lines = [`| Bereich | Prüfung | ${ran.map((b) => `${b} ${versions[b]}`).join(' | ')} |`, `|---|---|${ran.map(() => '---').join('|')}|`];
  for (const key of names) {
    const [group, name] = key.split('|');
    lines.push(`| ${group} | ${name} | ${ran.map((b) => { const r = results.find((x) => x.browser === b && `${x.group}|${x.name}` === key); return r ? (r.ok ? 'ok' : `FEHLER: ${r.detail.slice(0, 120)}`) : '–'; }).join(' | ')} |`);
  }
  for (const n of notStarted) lines.push(`\n${n.browser}: nicht gestartet (${n.reason})`);
  console.log(lines.join('\n'));
} else {
  console.log(JSON.stringify({ versions, notStarted, passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length, results }, null, 2));
}
