#!/usr/bin/env node
/**
 * axe- und Regressionsmatrix über alle Docs-Seiten eines Storybook-Builds (Lückenplan 2.3), CI-fähig:
 *
 *   npm run build-storybook                                    # oder: npx storybook build -o <ordner> --quiet
 *   node scripts/check-docs-axe.mjs storybook-static           # alle Docs-Seiten × BBV/DBB × hell/dunkel, 1280 px
 *   node scripts/check-docs-axe.mjs storybook-static --widths=1280,420 --filter=components-map --concurrency=4
 *   node scripts/check-docs-axe.mjs storybook-static --json=axe-docs.json   # Ergebnis zusätzlich als Datei (CI-Artefakt)
 *   node scripts/check-docs-axe.mjs storybook-static --extra-css=probe.css     # Mutationsprobe: zusätzliches CSS in jeder Seite
 *   node scripts/check-docs-axe.mjs storybook-static --scope=page            # ganze Seite samt Storybook-Rahmen (zur Information, Lückenplan 2.5)
 *
 * Die Seiten kommen aus `index.json` des Builds (alle Einträge vom Typ `docs`): neue Seiten sind ohne Änderung am Skript dabei.
 * Matrix: Marke (`brand:bbv|dbb`) × Theme (`theme:Light|Dark`, dazu `prefers-color-scheme` im Kontext) × Breiten. Je Lauf:
 *  - axe auf dem Docs-Inhalt (`.sbdocs-content`) mit WCAG 2.x A/AA/AAA, 2.1, 2.2, best-practice, color-contrast-enhanced, target-size,
 *    landmark-unique, heading-order. Wie im a11y-Addon gelten Regeln für das ganze Dokument (region, landmark-one-main, page-has-heading-one)
 *    der App, nicht der Doku; Storybook-eigene Bausteine (Argumenttabelle, „Show code“, Vorschau-Aktionen, Codeblöcke, Syntaxfarben) sind
 *    ausgenommen (nur ganze Bausteine, scripts/docs-axe-chrome.mjs); MDX-Links und Inline-Code bleiben in der Prüfung. Was Storybook selbst erzeugt, dokumentiert Lückenplan 2.5.
 *  - Regression: die Seite rendert (Inhalt vorhanden, keine Fehlermeldung von Storybook), keine Seitenfehler und keine Konsolenfehler,
 *    kein seitliches Scrollen des Docs-Inhalts.
 * Ausgabe: eine Zeile je Fehlschlag, am Ende eine Übersicht (Läufe, Seiten, Verstöße je Regel); Exit-Code 1 bei jedem Fehlschlag.
 * Läuft nicht unter `npm test` (braucht einen Storybook-Build und Chromium).
 */
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { STORYBOOK_CHROME } from './docs-axe-chrome.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const STATIC = resolve(positional[0] ?? 'storybook-static');
const FILTER = args.filter ?? '';
const WIDTHS = (args.widths ?? '1280').split(',').map(Number);
const BRANDS = (args.brands ?? 'bbv,dbb').split(',');
const THEMES = (args.themes ?? 'Light,Dark').split(',');
const CONCURRENCY = Math.max(1, Number(args.concurrency ?? 4));
// content: nur unser Docs-Inhalt (Standard, Gate); page: das ganze Dokument samt Storybook-Rahmen, ohne Ausnahmen (zeigt, was Storybook erzeugt)
const WHOLE_PAGE = args.scope === 'page';
// Mutationsprobe: eine CSS-Datei, die in jede Seite eingesetzt wird (z. B. Inline-Code #333), muss Befunde erzeugen
const EXTRA_CSS = args['extra-css'] ? await readFile(resolve(args['extra-css']), 'utf8') : '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.map': 'application/json' };
const TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const EXTRA = ['color-contrast-enhanced', 'target-size', 'landmark-unique', 'heading-order'];
const PAGE_RULES = ['region', 'landmark-one-main', 'page-has-heading-one'];
// Konsolenmeldungen, die Storybook oder der Browser selbst erzeugen und die keine Regression unserer Seiten sind
const CONSOLE_IGNORE = [/Download the React DevTools/, /favicon/, /\[HMR\]/];

if (!existsSync(join(STATIC, 'index.json'))) {
  console.error(`Kein Storybook-Build in ${STATIC} (index.json fehlt). Erst: npm run build-storybook`);
  process.exit(2);
}
const index = JSON.parse(await readFile(join(STATIC, 'index.json'), 'utf8'));
const DOCS = Object.values(index.entries).filter((e) => e.type === 'docs' && e.id.includes(FILTER)).map((e) => ({ id: e.id, title: e.title }));
if (DOCS.length === 0) {
  console.error(`Keine Docs-Seiten gefunden (Filter „${FILTER}“).`);
  process.exit(2);
}

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(STATIC, path === '/' ? 'index.html' : path);
  if (!existsSync(file) || !extname(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;
const axeSource = await readFile(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch();

const failures = [];
const byRule = {};
let runs = 0;

async function checkPage(ctx, doc, combo) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`Seitenfehler: ${String(e.message ?? e).split('\n')[0]}`));
  page.on('console', (m) => { if (m.type() === 'error' && !CONSOLE_IGNORE.some((re) => re.test(m.text()))) errors.push(`Konsole: ${m.text().slice(0, 200)}`); });
  const label = `${doc.id} [${combo.brand}/${combo.theme}/${combo.width}]`;
  try {
    await page.goto(`${origin}/iframe.html?viewMode=docs&id=${doc.id}&globals=brand:${combo.brand};theme:${combo.theme}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.sbdocs-content', { timeout: 20000 });
    if (EXTRA_CSS) await page.addStyleTag({ content: EXTRA_CSS });
    await page.waitForTimeout(1200);
    const render = await page.evaluate(() => {
      const content = document.querySelector('.sbdocs-content');
      const sbError = document.querySelector('.sb-errordisplay, #error-message');
      return {
        text: (content?.textContent ?? '').trim().length,
        error: sbError && getComputedStyle(sbError).display !== 'none' && (sbError.textContent ?? '').trim() ? (sbError.textContent ?? '').trim().slice(0, 200) : '',
        overflow: content ? content.scrollWidth - content.clientWidth : 0,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    if (render.text < 50 || render.error) failures.push({ page: doc.id, combo, kind: 'Darstellung', detail: render.error || `Inhalt fast leer (${render.text} Zeichen)` });
    if (render.pageOverflow > 0) failures.push({ page: doc.id, combo, kind: 'seitliches Scrollen', detail: `${render.pageOverflow}px` });
    await page.evaluate(axeSource);
    const violations = await page.evaluate(async ({ tags, extra, off, chromeSel, whole }) => {
      const rules = { ...Object.fromEntries(extra.map((r) => [r, { enabled: true }])), ...Object.fromEntries(off.map((r) => [r, { enabled: false }])) };
      const target = whole ? document : (document.querySelector('.sbdocs-content') ?? document);
      const out = await window.axe.run(whole ? document : { include: [target] }, { runOnly: { type: 'tag', values: tags }, rules, elementRef: true });
      // nur Knoten in Storybook-Bausteinen fallen weg (scripts/docs-axe-chrome.mjs), geprüft am Element selbst, nicht am Selektortext
      const chrome = (n) => !whole && Boolean(n.element?.closest?.(chromeSel));
      return out.violations
        .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.filter((n) => !chrome(n)).map((n) => `${n.target.join(' ')}: ${(n.failureSummary || '').split('\n')[1] ?? ''}`.slice(0, 240)) }))
        .filter((v) => v.nodes.length > 0);
    }, { tags: TAGS, extra: EXTRA, off: WHOLE_PAGE ? [] : PAGE_RULES, chromeSel: STORYBOOK_CHROME, whole: WHOLE_PAGE });
    for (const v of violations) {
      byRule[v.id] = (byRule[v.id] ?? 0) + v.nodes.length;
      failures.push({ page: doc.id, combo, kind: `axe ${v.id}`, detail: v.nodes.slice(0, 3).join(' | '), count: v.nodes.length });
    }
    for (const e of errors) failures.push({ page: doc.id, combo, kind: 'Fehler', detail: e });
  } catch (error) {
    failures.push({ page: doc.id, combo, kind: 'abgebrochen', detail: String(error.message).split('\n')[0] });
  }
  runs += 1;
  const mine = failures.filter((f) => f.page === doc.id && f.combo === combo);
  for (const f of mine) console.log(`FAIL ${label} ${f.kind}: ${f.detail}`);
  await page.close();
}

try {
  for (const brand of BRANDS) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const combo = { brand, theme, width };
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === 'Dark' ? 'dark' : 'light' });
        const queue = [...DOCS];
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
          while (queue.length) await checkPage(ctx, queue.shift(), combo);
        }));
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}

const pagesWithFailures = [...new Set(failures.map((f) => f.page))];
const summary = { runs, pages: DOCS.length, combos: BRANDS.length * THEMES.length * WIDTHS.length, failures: failures.length, pagesWithFailures, byRule };
if (args.json) await writeFile(resolve(args.json), JSON.stringify({ summary, failures }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log(failures.length === 0 ? `OK: ${runs} Läufe (${DOCS.length} Docs-Seiten × ${summary.combos} Kombinationen) ohne Verstöße und ohne Regressionen` : `${failures.length} Befunde auf ${pagesWithFailures.length} Seiten`);
process.exitCode = failures.length === 0 ? 0 : 1;
