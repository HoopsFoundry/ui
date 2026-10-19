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
 *   node scripts/check-docs-axe.mjs storybook-static --breiten=voll,handy,tablet,desktop   # Vorschauen in weiteren Breiten (Standard voll,handy)
 *
 * Die Seiten kommen aus `index.json` des Builds (alle Einträge vom Typ `docs`): neue Seiten sind ohne Änderung am Skript dabei.
 * Matrix: Marke (`brand:bbv|dbb`) × Theme (`theme:Light|Dark`, dazu `prefers-color-scheme` im Kontext) × Breiten. Je Lauf:
 *  - axe auf dem Docs-Inhalt (`.sbdocs-content`) mit WCAG 2.x A/AA/AAA, 2.1, 2.2, best-practice, color-contrast-enhanced, target-size,
 *    landmark-unique, heading-order. Wie im a11y-Addon gelten Regeln für das ganze Dokument (region, landmark-one-main, page-has-heading-one)
 *    der App, nicht der Doku; Storybook-eigene Bausteine (Argumenttabelle, „Show code“, Vorschau-Aktionen, Codeblöcke, Syntaxfarben) sind
 *    ausgenommen (nur ganze Bausteine, scripts/docs-axe-chrome.mjs); MDX-Links und Inline-Code bleiben in der Prüfung. Was Storybook selbst erzeugt, dokumentiert Lückenplan 2.5.
 *  - Vorschauen in Gerätebreite (Preview/StickyPreview, eigene Iframes): axe mit denselben Regeln im Dokument jedes Iframes, für jedes
 *    Beispiel einer feststehenden Vorschau (über die Liste gewählt), dazu Story-Fehler, Konsolenfehler und seitliches Scrollen im Iframe.
 *    Die erste Breite aus `--breiten` gilt für die ganze Seite; Seiten mit Vorschauen laufen zusätzlich in jeder weiteren Breite (Global
 *    `breite`). Ohne diese Erweiterung prüfte axe die Iframes nicht (axe-core braucht sein Skript in jedem Rahmen).
 *  - Regression: die Seite rendert (Inhalt vorhanden, keine Fehlermeldung von Storybook, keine Story, die beim Rendern wirft), keine
 *    Seitenfehler und keine Konsolenfehler,
 *    kein seitliches Scrollen des Docs-Inhalts.
 * Die Läufe nutzen `prefers-reduced-motion: reduce` (seit „Storybook aufräumen“): Sonst wechselte die feststehende Vorschau beim Scrollen
 * selbst das Beispiel, während das Skript die Beispiele über die Liste wählt. Text-Kontraste hängen nicht an Bewegung (ADR-013, Punkt 1).
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
// Breiten der Vorschauen (Global `breite`, .storybook/breite.ts): die erste für alle Seiten, die weiteren nur für Seiten mit Vorschauen
const BREITEN = (args.breiten ?? 'voll,handy').split(',');
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
let frameRuns = 0;

/** axe im Dokument `target` (Seite oder Iframe); `include` ist der geprüfte Bereich, Storybook-Bausteine fallen weg. */
async function runAxe(target, include) {
  await target.evaluate(axeSource);
  return target.evaluate(async ({ tags, extra, off, chromeSel, whole, include }) => {
    const rules = { ...Object.fromEntries(extra.map((r) => [r, { enabled: true }])), ...Object.fromEntries(off.map((r) => [r, { enabled: false }])) };
    const el = include ? document.querySelector(include) : null;
    // iframes: false: die Vorschau-Iframes prüft checkPreviews einzeln (mit eigenem axe im Rahmen)
    const out = await window.axe.run(whole || !el ? document : { include: [el] }, { runOnly: { type: 'tag', values: tags }, rules, elementRef: true, iframes: false });
    // nur Knoten in Storybook-Bausteinen fallen weg (scripts/docs-axe-chrome.mjs), geprüft am Element selbst, nicht am Selektortext
    const chrome = (n) => !whole && Boolean(n.element?.closest?.(chromeSel));
    return out.violations
      .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.filter((n) => !chrome(n)).map((n) => `${n.target.join(' ')}: ${(n.failureSummary || '').split('\n')[1] ?? ''}`.slice(0, 240)) }))
      .filter((v) => v.nodes.length > 0);
  }, { tags: TAGS, extra: EXTRA, off: WHOLE_PAGE ? [] : PAGE_RULES, chromeSel: STORYBOOK_CHROME, whole: WHOLE_PAGE, include });
}

/**
 * Alle Vorschauen der Seite (Preview.tsx): jede in den Blick holen (die Iframes laden lazy), in einer feststehenden Vorschau jedes Beispiel
 * über die Liste wählen, auf die gerenderte Story warten und den Iframe prüfen. Gibt die Befunde zurück.
 */
async function checkPreviews(page, label) {
  const found = [];
  const figures = page.locator('.hoops-preview');
  const count = await figures.count();
  for (let i = 0; i < count; i += 1) {
    const fig = figures.nth(i);
    const picks = fig.locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " hoops-sp ")][1]//button[contains(@class, "hoops-sp-pick")]');
    const n = Math.max(1, await picks.count());
    for (let k = 0; k < n; k += 1) {
      // erst in den Blick holen (lazy), dann wählen; gewartet wird auf genau das gewählte Beispiel
      await fig.evaluate((f) => f.scrollIntoView({ block: 'center' }));
      const wanted = (await picks.count()) ? await picks.nth(k).evaluate((b) => { b.click(); return b.textContent.trim(); }) : null;
      const where = `${label} Vorschau „${wanted ?? (await fig.locator('iframe').getAttribute('title').catch(() => i))}“`;
      try {
        await page.waitForFunction(({ f, wanted }) => {
          const ifr = f.querySelector('iframe');
          const d = ifr?.contentDocument;
          if (wanted && ifr?.title !== `Vorschau: ${wanted}`) return false;
          return Boolean(d?.body?.classList.contains('sb-show-main') && d.getElementById('storybook-root')?.childElementCount);
        }, { f: await fig.elementHandle(), wanted }, { timeout: 20000 });
        await page.waitForTimeout(600);
        const frame = await (await fig.locator('iframe').elementHandle()).contentFrame();
        const render = await frame.evaluate(() => {
          const err = document.querySelector('.sb-errordisplay');
          return {
            error: err && getComputedStyle(err).display !== 'none' && (err.textContent ?? '').trim() ? (err.textContent ?? '').trim().slice(0, 200) : '',
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          };
        });
        if (render.error) found.push({ kind: 'Story-Fehler (Vorschau)', detail: `${where}: ${render.error}` });
        if (render.overflow > 0) found.push({ kind: 'seitliches Scrollen (Vorschau)', detail: `${where}: ${render.overflow}px` });
        for (const v of await runAxe(frame, '#storybook-root')) found.push({ kind: `axe ${v.id} (Vorschau)`, detail: `${where}: ${v.nodes.slice(0, 3).join(' | ')}`, count: v.nodes.length, rule: v.id });
        frameRuns += 1;
      } catch (error) {
        found.push({ kind: 'Vorschau abgebrochen', detail: `${where}: ${String(error.message).split('\n')[0]}` });
      }
    }
  }
  return found;
}

async function checkPage(ctx, doc, combo) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`Seitenfehler: ${String(e.message ?? e).split('\n')[0]}`));
  page.on('console', (m) => { if (m.type() === 'error' && !CONSOLE_IGNORE.some((re) => re.test(m.text()))) errors.push(`Konsole: ${m.text().slice(0, 200)}`); });
  const label = `${doc.id} [${combo.brand}/${combo.theme}/${combo.width}]`;
  try {
    const url = (breite) => `${origin}/iframe.html?viewMode=docs&id=${doc.id}&globals=brand:${combo.brand};theme:${combo.theme};breite:${breite}`;
    await page.goto(url(BREITEN[0]), { waitUntil: 'networkidle', timeout: 60000 });
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
        // Story, die beim Rendern wirft: Storybook setzt den Stapel als <pre><span>Error</span>: … in die Vorschau (kein Konsolenfehler)
        storyErrors: [...document.querySelectorAll('.docs-story .sb-story > pre')]
          .filter((pre) => /^\s*\w*Error\b/.test(pre.textContent ?? ''))
          .map((pre) => `${pre.closest('[id^="story--"]')?.id ?? '?'}: ${(pre.textContent ?? '').split('\n')[0].slice(0, 160)}`),
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    if (render.text < 50 || render.error) failures.push({ page: doc.id, combo, kind: 'Darstellung', detail: render.error || `Inhalt fast leer (${render.text} Zeichen)` });
    for (const e of render.storyErrors) failures.push({ page: doc.id, combo, kind: 'Story-Fehler', detail: e });
    if (render.pageOverflow > 0) failures.push({ page: doc.id, combo, kind: 'seitliches Scrollen', detail: `${render.pageOverflow}px` });
    const violations = await runAxe(page, '.sbdocs-content');
    for (const v of violations) {
      byRule[v.id] = (byRule[v.id] ?? 0) + v.nodes.length;
      failures.push({ page: doc.id, combo, kind: `axe ${v.id}`, detail: v.nodes.slice(0, 3).join(' | '), count: v.nodes.length });
    }
    // Vorschauen: in der ersten Breite auf der schon geladenen Seite, in jeder weiteren Breite neu geladen (nur Seiten mit Vorschauen)
    const previewFindings = [];
    if (await page.locator('.hoops-preview').count()) {
      previewFindings.push(...(await checkPreviews(page, `breite:${BREITEN[0]}`)));
      for (const breite of BREITEN.slice(1)) {
        await page.goto(url(breite), { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForSelector('.sbdocs-content', { timeout: 20000 });
        previewFindings.push(...(await checkPreviews(page, `breite:${breite}`)));
      }
    }
    for (const f of previewFindings) {
      if (f.rule) byRule[f.rule] = (byRule[f.rule] ?? 0) + f.count;
      failures.push({ page: doc.id, combo, kind: f.kind, detail: f.detail, count: f.count });
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
        // reduzierte Bewegung: kein automatischer Wechsel der feststehenden Vorschau, während die Beispiele über die Liste gewählt werden
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === 'Dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
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
const summary = { runs, frameRuns, breiten: BREITEN, pages: DOCS.length, combos: BRANDS.length * THEMES.length * WIDTHS.length, failures: failures.length, pagesWithFailures, byRule };
if (args.json) await writeFile(resolve(args.json), JSON.stringify({ summary, failures }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log(failures.length === 0 ? `OK: ${runs} Läufe (${DOCS.length} Docs-Seiten × ${summary.combos} Kombinationen) und ${frameRuns} Vorschau-Läufe (Breiten ${BREITEN.join(', ')}) ohne Verstöße und ohne Regressionen` : `${failures.length} Befunde auf ${pagesWithFailures.length} Seiten`);
process.exitCode = failures.length === 0 ? 0 : 1;
