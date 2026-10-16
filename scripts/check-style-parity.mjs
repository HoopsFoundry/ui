#!/usr/bin/env node
/**
 * Stilparität eines Storybook-Builds vor und nach einem mechanischen Umbau (Umbenennungen, Refactorings).
 *
 * Erfasst für ALLE Stories (und die Docs-Seiten unter Foundation/ und Introduction) in der Matrix
 * Marke BBV/DBB × hell/dunkel × 1280/420 px die Rechtecke und die BERECHNETEN Stilwerte aller sichtbaren
 * Elemente (Farben, Abstände, Schriftgrößen, Radien, Schatten, Ringe; computed values, keine Variablennamen).
 *
 *   npx storybook build -o <ordner> --quiet
 *   node scripts/check-style-parity.mjs capture <storybook-ordner> <ausgabe.ndjson.gz> [--only=teil-der-id] [--workers=4]
 *   node scripts/check-style-parity.mjs compare <vorher.ndjson.gz> <nachher.ndjson.gz> [--tol=0.6] [--json]
 *
 * Ausgabe von `compare`: Anzahl Seiten und Elemente, Abweichungen je Seite (Struktur, Rechteck, Stil). Rechteck-Abweichungen auf
 * Docs-Seiten werden getrennt gezählt (dort ändern geänderte Texte, etwa längere Tokennamen in Tabellen, legitim den Umbruch);
 * Stilabweichungen zählen überall. Exit-Code 1 bei Abweichungen, 2 bei falschem Aufruf.
 * Ladezeit-Flakes: den Lauf (oder mit `--only=<teil-der-id>` einzelne Seiten) wiederholen.
 */
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { createGunzip, gzipSync } from 'node:zlib';
import { createInterface } from 'node:readline';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.map': 'application/json', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
export const BRANDS = ['bbv', 'dbb'];
export const THEMES = ['Light', 'Dark'];
export const WIDTHS = [1280, 420];

/** Eigenschaften, deren Zahlen vom Layout abhängen (Toleranz ±tol px); alle anderen Zahlen müssen (fast) exakt gleich sein. */
const LAYOUT_PROPS = new Set(['width', 'height', 'inline-size', 'block-size', 'min-width', 'min-height', 'top', 'left', 'right', 'bottom', 'perspective-origin', 'transform-origin', 'translate']);
const PROPS = [
  'display', 'position', 'color', 'background-color', 'background-image', 'opacity', 'visibility',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'row-gap', 'column-gap', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant-numeric', 'line-height', 'letter-spacing',
  'text-transform', 'text-decoration-line', 'text-decoration-color', 'text-align', 'white-space',
  'box-shadow', 'text-shadow', 'filter',
  'outline-color', 'outline-style', 'outline-width', 'outline-offset',
  'fill', 'stroke', 'stroke-width', 'width', 'height', 'min-width', 'min-height', 'transform', 'z-index', 'overflow-x', 'overflow-y',
  'accent-color', 'caret-color', 'cursor', 'content',
];
const PSEUDO_PROPS = ['content', 'display', 'color', 'background-color', 'background-image', 'width', 'height', 'border-top-color', 'border-top-width', 'border-top-left-radius', 'box-shadow', 'opacity', 'font-size', 'transform'];

/** Läuft im Browser: sammelt Rechtecke und berechnete Stile aller sichtbaren Elemente. */
function collectInBrowser({ PROPS, PSEUDO_PROPS }) {
  const root = document.body;
  const rows = [];
  const pageX = window.scrollX;
  const pageY = window.scrollY;
  const skip = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'NOSCRIPT', 'TEMPLATE']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const pick = (cs, list) => list.map((p) => cs.getPropertyValue(p)).join('|');
  const sig = (el) => {
    const cls = typeof el.className === 'string' ? el.className : el.getAttribute('class') ?? '';
    return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id.replace(/\d{3,}/g, 'N') : ''}.${cls.trim().split(/\s+/).filter(Boolean).join('.')}`;
  };
  for (let el = walker.currentNode; el; el = walker.nextNode()) {
    if (el === root || skip.has(el.tagName)) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    const pseudo = ['::before', '::after'].map((p) => {
      const c = getComputedStyle(el, p);
      return c.content && c.content !== 'none' && c.content !== 'normal' ? pick(c, PSEUDO_PROPS) : '';
    }).join('~');
    rows.push([sig(el), [r.x + pageX, r.y + pageY, r.width, r.height].map((n) => Math.round(n * 10) / 10), pick(cs, PROPS), pseudo]);
  }
  return { rows, error: document.body.classList.contains('sb-show-errordisplay') };
}

function serveStatic(dir) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    const file = join(dir, path === '/' ? 'index.html' : path);
    if (!existsSync(file) || !extname(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

export function pageList(index, only = '') {
  const entries = Object.values(index.entries);
  const list = [];
  for (const e of entries) {
    if (e.type === 'story') list.push({ kind: 'story', id: e.id });
    else if (e.type === 'docs' && (e.title === 'Introduction' || e.title.startsWith('Foundation/'))) list.push({ kind: 'docs', id: e.id });
  }
  return list.filter((p) => p.id.includes(only));
}

async function capture(dir, out, opts) {
  const { chromium } = await import('playwright');
  const root = resolve(dir);
  const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'));
  const pages = pageList(index, opts.only ?? '');
  if (pages.length === 0) throw new Error('Keine Stories gefunden');
  const server = await serveStatic(root);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const chunks = [];
  const failures = [];
  const workers = Number(opts.workers ?? 4);
  let done = 0;
  const total = pages.length * BRANDS.length * THEMES.length * WIDTHS.length;
  try {
    for (const brand of BRANDS) for (const theme of THEMES) for (const width of WIDTHS) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, colorScheme: theme === 'Dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
      // Nichts aus dem Netz (Karten-Kacheln, Schriften, Bilder fremder Hosts): macht den Lauf schnell und unabhängig vom Netz.
      await ctx.route('**/*', (route) => (route.request().url().startsWith(origin) || route.request().url().startsWith('data:') ? route.continue() : route.abort()));
      const queue = [...pages];
      const work = async () => {
        let page = await ctx.newPage();
        for (let p = queue.shift(); p; p = queue.shift()) {
          const key = `${p.kind}:${p.id}|${brand}|${theme}|${width}`;
          let result = null;
          let timer;
          const t0 = Date.now();
          for (let attempt = 0; attempt < 3 && !result; attempt++) {
            try {
              // Gesamtzeit je Versuch begrenzt: eine hängende Seite (Endlosschleife, nie fertige Schrift) darf den Lauf nicht blockieren.
              result = await Promise.race([
                (async () => {
                  await page.goto(`${origin}/iframe.html?viewMode=${p.kind}&id=${p.id}&globals=brand:${brand};theme:${theme}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
                  await page.waitForSelector('body.sb-show-main, body.sb-show-errordisplay', { state: 'attached', timeout: 30000 });
                  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
                  await page.evaluate(() => document.fonts.ready);
                  await page.waitForTimeout(p.kind === 'docs' ? 700 : 250);
                  return page.evaluate(collectInBrowser, { PROPS, PSEUDO_PROPS });
                })(),
                new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Zeitüberschreitung (90 s)')), 90000); }),
              ]);
            } catch (error) {
              clearTimeout(timer);
              if (attempt === 2) failures.push(`${key}: ${String(error.message).split('\n')[0]}`);
              await page.close().catch(() => {});
              page = await ctx.newPage();
            }
          }
          clearTimeout(timer);
          if (opts.verbose || Date.now() - t0 > 15000) console.log(`  ${Date.now() - t0} ms ${key}${result ? '' : ' (FEHLT)'}`);
          if (result) chunks.push(JSON.stringify({ key, kind: p.kind, error: result.error, rows: result.rows }));
          if (++done % 200 === 0) console.log(`  ${done}/${total}`);
        }
        await page.close().catch(() => {});
      };
      await Promise.all(Array.from({ length: workers }, work));
      await ctx.close();
    }
  } finally {
    await browser.close();
    server.closeAllConnections();
    server.close();
  }
  chunks.sort();
  await writeFile(out, gzipSync(Buffer.from(chunks.join('\n') + '\n')));
  const elements = chunks.reduce((n, c) => n + JSON.parse(c).rows.length, 0);
  console.log(`erfasst: ${chunks.length} Seiten-Zustände (${pages.length} Seiten × ${BRANDS.length * THEMES.length * WIDTHS.length}), ${elements} Elemente → ${out}`);
  if (failures.length) { console.error(`${failures.length} Seiten nicht erfasst:\n  ${failures.join('\n  ')}`); process.exitCode = 1; }
  const errors = chunks.filter((c) => JSON.parse(c).error).length;
  if (errors) console.log(`Hinweis: ${errors} Zustände zeigen die Storybook-Fehleranzeige (in beiden Läufen gleich zu erwarten).`);
}

async function load(file) {
  const map = new Map();
  const rl = createInterface({ input: createReadStream(file).pipe(createGunzip()), crlfDelay: Infinity });
  for await (const line of rl) { if (line) { const o = JSON.parse(line); map.set(o.key, o); } }
  return map;
}

const NUM = /-?\d+(?:\.\d+)?(?:e-?\d+)?/g;
/** Vergleicht zwei Stil-Zeichenketten: gleiche Gestalt, Zahlen exakt (Layout-Eigenschaften mit Toleranz). */
export function stylesDiffer(a, b, props, tol) {
  if (a === b) return [];
  const pa = a.split('|');
  const pb = b.split('|');
  const diffs = [];
  for (let i = 0; i < props.length; i++) {
    const x = pa[i] ?? '';
    const y = pb[i] ?? '';
    if (x === y) continue;
    const sx = x.replace(NUM, '#');
    const sy = y.replace(NUM, '#');
    const t = LAYOUT_PROPS.has(props[i]) ? tol : 0.001;
    const nx = x.match(NUM) ?? [];
    const ny = y.match(NUM) ?? [];
    if (sx === sy && nx.every((n, k) => Math.abs(Number(n) - Number(ny[k])) <= t)) continue;
    diffs.push(`${props[i]}: ${x} → ${y}`);
    diffs.layoutOnly = (diffs.layoutOnly ?? true) && LAYOUT_PROPS.has(props[i]);
  }
  return diffs;
}

export function compareRows(ra, rb, { kind, tol }) {
  const out = { structure: 0, rect: 0, style: 0, layout: 0, details: [] };
  if (ra.length !== rb.length) { out.structure++; out.details.push(`Elementanzahl ${ra.length} → ${rb.length}`); }
  const n = Math.min(ra.length, rb.length);
  for (let i = 0; i < n; i++) {
    const [sa, rectA, styA, psA] = ra[i];
    const [sb, rectB, styB, psB] = rb[i];
    // Emotion-Klassen (`css-1h62cpo`) sind Hashes der erzeugten Stile; ändert sich nur die Höhe eines Beispiels, ändert sich der Hash
    if (sa.replace(/\bcss-[a-z0-9]+/g, 'css-#') !== sb.replace(/\bcss-[a-z0-9]+/g, 'css-#')) { out.structure++; if (out.details.length < 5) out.details.push(`#${i} Gestalt ${sa} → ${sb}`); continue; }
    if (rectA.some((v, k) => Math.abs(v - rectB[k]) > tol)) { out.rect++; if (out.details.length < 5) out.details.push(`#${i} ${sa} Rechteck ${rectA} → ${rectB}`); }
    const d = stylesDiffer(styA, styB, PROPS, tol);
    const dp = stylesDiffer(psA.split('~').join('|'), psB.split('~').join('|'), PSEUDO_PROPS.concat(PSEUDO_PROPS), tol);
    // reine Layout-Unterschiede (Breite, Höhe) zählen getrennt: sie folgen aus geändertem Text (z. B. längere Tokennamen in Doku-Tabellen)
    const layoutOnly = (!d.length || d.layoutOnly) && !dp.length;
    if (d.length || dp.length) { if (layoutOnly) out.layout++; else out.style++; if (out.details.length < 5) out.details.push(`#${i} ${sa} ${d.concat(dp).slice(0, 3).join('; ')}`); }
  }
  return out;
}

async function compare(fa, fb, opts) {
  const tol = Number(opts.tol ?? 0.6);
  const a = await load(fa);
  const b = await load(fb);
  let elements = 0;
  const bad = [];
  const layoutOnly = [];
  const missing = [];
  for (const [key, pa] of a) {
    const pb = b.get(key);
    if (!pb) { missing.push(key); continue; }
    elements += pa.rows.length;
    const r = compareRows(pa.rows, pb.rows, { kind: pa.kind, tol });
    // streng: Struktur und Stil außer Layout; Rechteck und Layout-Stil nur als Hinweis, wenn sie auf Seiten mit geändertem Text vorkommen
    if (r.structure || r.style) bad.push({ key, ...r });
    else if (r.rect || r.layout) layoutOnly.push({ key, ...r });
  }
  for (const key of b.keys()) if (!a.has(key)) missing.push(`${key} (nur nachher)`);
  const stories = new Set([...a.keys()].map((k) => k.split('|')[0]));
  const report = { zustaende: a.size, seiten: stories.size, elemente: elements, fehlend: missing.length, abweichend: bad.length, nurLayout: layoutOnly.length, tol };
  if (opts.json) console.log(JSON.stringify({ report, missing, bad, layoutOnly }, null, 1));
  else {
    console.log(`verglichen: ${report.zustaende} Zustände (${report.seiten} Seiten), ${elements} Elemente, Toleranz ±${tol} px`);
    for (const m of missing) console.log(`FEHLT  ${m}`);
    for (const x of bad) console.log(`ABWEICHT ${x.key}  Struktur ${x.structure}, Rechteck ${x.rect}, Layout-Stil ${x.layout}, Stil ${x.style}\n    ${x.details.join('\n    ')}`);
    const seiten = new Map();
    for (const x of layoutOnly) { const id = x.key.split('|')[0]; seiten.set(id, (seiten.get(id) ?? 0) + 1); }
    for (const [id, n] of seiten) console.log(`NUR LAYOUT ${id} (${n} Zustände)`);
    console.log(`\n${bad.length === 0 && missing.length === 0 ? 'Keine Abweichungen in Struktur und Stil.' : `${bad.length} abweichende Zustände (Struktur oder Stil), ${missing.length} fehlend.`} Nur Layout (Rechteck, Breite, Höhe): ${layoutOnly.length} Zustände auf ${seiten.size} Seiten, einzeln zu bewerten (geänderter Text).`);
  }
  if (bad.length || missing.length) process.exitCode = 1;
}

function parse(argv) {
  const pos = [];
  const opts = {};
  for (const a of argv) {
    const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
    if (m) opts[m[1]] = m[2] ?? true;
    else pos.push(a);
  }
  return { pos, opts };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { pos, opts } = parse(process.argv.slice(2));
  if (pos[0] === 'capture' && pos[1] && pos[2]) await capture(pos[1], pos[2], opts);
  else if (pos[0] === 'compare' && pos[1] && pos[2]) await compare(pos[1], pos[2], opts);
  else { console.error('Aufruf: check-style-parity.mjs capture <storybook-ordner> <aus.ndjson.gz> [--only=] [--workers=] | compare <vorher> <nachher> [--tol=0.6] [--json]'); process.exit(2); }
}
