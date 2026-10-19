#!/usr/bin/env node
/**
 * axe auf den neuen und geänderten Stories und Docs-Seiten der Karte (Vanilla):
 *
 *   npx storybook build -o <ordner> --quiet
 *   node scripts/check-map-docs.mjs <ordner>
 *
 * Matrix: BBV/DBB × hell/dunkel × 1280/420 px; Regeln: WCAG 2.x A/AA/AAA, 2.1, 2.2, best-practice, color-contrast-enhanced, target-size,
 * landmark-unique, heading-order. Auf den Stories mit „Karte laden“ wird nach dem Klick erneut geprüft (geladene Karte).
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STATIC = resolve(process.argv[2] ?? 'storybook-static');
// optional: nur Seiten, deren id den Text enthält (z. B. `venuecard`)
const FILTER = process.argv[3] ?? '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.map': 'application/json' };
const PAGES = [
  ['docs', 'components-map--docs'], ['docs', 'components-venuecard--docs'], ['docs', 'foundation-vanilla--docs'], ['docs', 'introduction--docs'],
  ['story', 'components-map--vanilla-karte'], ['story', 'components-map--vanilla-geladen'], ['story', 'components-map--vanilla-handy'], ['story', 'components-map--vanilla-handy-geladen'],
  ['story', 'components-map--do-lokal'], ['story', 'components-map--dont-lokal'],
  ['story', 'components-venuecard--vanilla-karte'], ['story', 'components-venuecard--vanilla-handy'], ['story', 'components-venuecard--vanilla-handy-kompakt'],
];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const EXTRA = ['color-contrast-enhanced', 'target-size', 'landmark-unique', 'heading-order'];
// Wie das a11y-Addon von Storybook: geprüft wird der Inhalt (Story bzw. Docs-Inhalt), nicht die Seite des Iframes; Regeln für das ganze Dokument
// (Landmarken, h1) gelten für die App, die die Komponenten einsetzt. Die Argumenttabelle (Controls) ist Storybook selbst.
const PAGE_RULES = ['region', 'landmark-one-main', 'page-has-heading-one'];
const EXCLUDE = ['.docblock-argstable', '.sb-argstableBlock', '.sbdocs-preview .docblock-argstable'];

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(STATIC, path === '/' ? 'index.html' : path);
  if (!existsSync(file) || !extname(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((resolve_) => server.listen(0, '127.0.0.1', resolve_));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let failed = 0;
let checks = 0;
const axeSource = join(ROOT, 'node_modules/axe-core/axe.min.js');

for (const brand of ['bbv', 'dbb']) {
  for (const theme of ['Light', 'Dark']) {
    for (const width of [1280, 420]) {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === 'Dark' ? 'dark' : 'light' });
      for (const [kind, id] of PAGES.filter(([, pageId]) => pageId.includes(FILTER))) {
        const page = await ctx.newPage();
        const url = `${origin}/iframe.html?viewMode=${kind}&id=${id}&globals=brand:${brand};theme:${theme}`;
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(kind === 'docs' ? 1500 : 600);
        const run = async (label) => {
          await page.addScriptTag({ path: axeSource });
          const violations = await page.evaluate(async ({ tags, extra, off, exclude, context }) => {
            const rules = { ...Object.fromEntries(extra.map((r) => [r, { enabled: true }])), ...Object.fromEntries(off.map((r) => [r, { enabled: false }])) };
            const target = document.querySelector(context) ?? document;
            const out = await window.axe.run({ include: [target], exclude: exclude.map((s) => [s]) }, { runOnly: { type: 'tag', values: tags }, rules });
            // Storybook selbst (Links der MDX-Seiten, Schalter „Show code“, Syntaxfarben, Hilfsklassen `css-…`) gehört nicht zu den Komponenten
            const chrome = (n) => n.target.some((t) => /\.sbdocs|\.docblock|\.sb-|\.css-[a-z0-9]+|react-aria|\.token/.test(t));
            return out.violations
              .map((v) => ({ id: v.id, nodes: v.nodes.filter((n) => !chrome(n)).slice(0, 3).map((n) => `${n.target.join(' ')}: ${(n.failureSummary || '').split('\n')[1] ?? ''}`) }))
              .filter((v) => v.nodes.length > 0);
          }, { tags: TAGS, extra: EXTRA, off: PAGE_RULES, exclude: EXCLUDE, context: kind === 'docs' ? '.sbdocs-content' : '#storybook-root' });
          checks += 1;
          if (violations.length) {
            failed += 1;
            console.log(`FAIL ${id} ${label} [${brand}/${theme}/${width}]`, JSON.stringify(violations));
          }
        };
        await run('Ausgangslage');
        const buttons = await page.$$('.hoops-map-load');
        if (kind === 'story' && buttons.length) {
          for (const button of buttons) await button.click().catch(() => {});
          await page.waitForTimeout(900);
          await run('Karte geladen');
        }
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (kind === 'story' && overflow > 0) { failed += 1; console.log(`FAIL ${id} seitliches Scrollen ${overflow}px [${brand}/${theme}/${width}]`); }
        await page.close();
      }
      await ctx.close();
    }
  }
}
await browser.close();
server.close();
console.log(failed === 0 ? `OK: ${checks} axe-Läufe ohne Verstöße` : `${failed} von ${checks} Läufen mit Verstößen`);
process.exitCode = failed === 0 ? 0 : 1;
