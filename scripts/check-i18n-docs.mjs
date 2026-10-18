#!/usr/bin/env node
/**
 * Browser-Prüfung der Seite Foundation/Internationalisierung und des Umschalters „Sprache“ (nicht Teil von `npm test`):
 *
 *   npm run build-storybook            (oder: npx storybook build -o <ordner> --quiet)
 *   node scripts/check-i18n-docs.mjs [<ordner>] [--browsers=chromium,webkit]
 *
 * 1. axe auf der Docs-Seite und ihren Stories, Matrix Sprache de/en × hell/dunkel × 1280/420 px (Marke BBV), Regeln wie scripts/check-map-docs.mjs
 *    (WCAG 2.x A/AA/AAA, best-practice, color-contrast-enhanced, target-size, landmark-unique, heading-order); dazu kein seitliches Scrollen der Stories.
 * 2. Texte je Sprache: Svelte- und Vanilla-Beispiel zeigen die Beschriftungen der gewählten Sprache (über `globals=locale:` in der Adresse).
 * 3. Umschalter in der Oberfläche: Storybook öffnen, im Menü „Sprache“ English wählen, ohne Neuladen wechseln die Texte im Vorschau-Rahmen,
 *    Fokus und Zustand des Rahmens bleiben (die Seite lädt nicht neu); zurück auf Deutsch.
 * Exit 1 bei einem Fehler; nicht installierte Browser werden gemeldet und übersprungen.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, webkit, firefox } from 'playwright';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const STATIC = resolve(positional[0] ?? 'storybook-static');
const BROWSERS = (process.argv.find((a) => a.startsWith('--browsers='))?.split('=')[1] ?? 'chromium').split(',');
const LAUNCH = { chromium, webkit, firefox };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.map': 'application/json' };
const DOCS = 'foundation-internationalisierung--docs';
const PAGES = [['docs', DOCS], ['story', 'foundation-internationalisierung--svelte-sprache'], ['story', 'foundation-internationalisierung--vanilla-sprache'], ['story', 'foundation-internationalisierung--eigene-texte']];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const EXTRA = ['color-contrast-enhanced', 'target-size', 'landmark-unique', 'heading-order'];
// Wie scripts/check-map-docs.mjs: geprüft wird der Inhalt, Regeln für das ganze Dokument gehören der App; die Argumenttabelle ist Storybook selbst
const PAGE_RULES = ['region', 'landmark-one-main', 'page-has-heading-one'];
const EXCLUDE = ['.docblock-argstable', '.sb-argstableBlock'];
// Erwartete Texte der Beispiele je Sprache (aus den Katalogen: league.link, stepper.label, league.col.points-short, Formbuchstaben)
const TEXT = {
  de: { link: 'Komplette Tabelle und Spielplan', stepper: 'Fortschritt', points: 'PKT', letters: ['S', 'N', 'U'] },
  en: { link: 'Full standings and schedule', stepper: 'Progress', points: 'PTS', letters: ['W', 'L', 'D'] },
};

if (!existsSync(join(STATIC, 'iframe.html'))) {
  console.error(`Kein Storybook-Build in ${STATIC} (erst npm run build-storybook).`);
  process.exit(1);
}
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(STATIC, path === '/' ? 'index.html' : path);
  if (!existsSync(file) || !extname(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const axeSource = join(ROOT, 'node_modules/axe-core/axe.min.js');
let failed = 0;
let checks = 0;
const fail = (message) => { failed += 1; console.log(`FAIL ${message}`); };

/** Texte der Beispiele im Dokument `frame` (Seite oder Rahmen). */
const texts = (frame) => frame.evaluate(() => ({
  stepper: [...document.querySelectorAll('[aria-label]')].map((n) => n.getAttribute('aria-label')),
  body: document.body.textContent,
  letters: [...document.querySelectorAll('.hoops-form--letters .hoops-form-item')].map((n) => n.getAttribute('data-letter')),
  lang: [...document.querySelectorAll('[lang]')].map((n) => n.getAttribute('lang')),
}));

function expectTexts(found, locale, label) {
  const want = TEXT[locale];
  const other = TEXT[locale === 'de' ? 'en' : 'de'];
  if (!found.body.includes(want.link)) fail(`${label}: „${want.link}“ fehlt`);
  if (!found.stepper.includes(want.stepper) && label.includes('svelte')) fail(`${label}: Stepper „${want.stepper}“ fehlt`);
  if (!found.body.includes(want.points)) fail(`${label}: Spaltenkopf „${want.points}“ fehlt`);
  if (found.body.includes(other.link)) fail(`${label}: Text der anderen Sprache („${other.link}“)`);
  if (label.includes('svelte') && found.letters.slice(0, 3).join('') !== want.letters.join('')) fail(`${label}: Formbuchstaben ${found.letters.join('')} statt ${want.letters.join('')}`);
}

for (const name of BROWSERS) {
  let browser;
  try {
    browser = await LAUNCH[name].launch();
  } catch (error) {
    console.log(`übersprungen: ${name} ist nicht installiert (${String(error.message).split('\n')[0]})`);
    continue;
  }
  // 1 und 2: axe und Texte je Sprache, Theme und Breite
  for (const locale of ['de', 'en']) {
    for (const theme of ['Light', 'Dark']) {
      for (const width of [1280, 420]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme === 'Dark' ? 'dark' : 'light' });
        for (const [kind, id] of PAGES) {
          const page = await ctx.newPage();
          await page.goto(`${origin}/iframe.html?viewMode=${kind}&id=${id}&globals=brand:bbv;theme:${theme};locale:${locale}`, { waitUntil: 'networkidle' });
          await page.waitForTimeout(kind === 'docs' ? 1500 : 600);
          const where = `${name} ${id} [${locale}/${theme}/${width}]`;
          await page.addScriptTag({ path: axeSource });
          const violations = await page.evaluate(async ({ tags, extra, off, exclude, context }) => {
            const rules = { ...Object.fromEntries(extra.map((r) => [r, { enabled: true }])), ...Object.fromEntries(off.map((r) => [r, { enabled: false }])) };
            const target = document.querySelector(context) ?? document;
            const out = await window.axe.run({ include: [target], exclude: exclude.map((s) => [s]) }, { runOnly: { type: 'tag', values: tags }, rules });
            const chrome = (n) => n.target.some((t) => /\.sbdocs|\.docblock|\.sb-|\.css-[a-z0-9]+|react-aria|\.token/.test(t));
            return out.violations
              .map((v) => ({ id: v.id, nodes: v.nodes.filter((n) => !chrome(n)).slice(0, 3).map((n) => `${n.target.join(' ')}: ${(n.failureSummary || '').split('\n')[1] ?? ''}`) }))
              .filter((v) => v.nodes.length > 0);
          }, { tags: TAGS, extra: EXTRA, off: PAGE_RULES, exclude: EXCLUDE, context: kind === 'docs' ? '.sbdocs-content' : '#storybook-root' });
          checks += 1;
          if (violations.length) fail(`${where} axe ${JSON.stringify(violations)}`);
          if (id.endsWith('svelte-sprache') || id.endsWith('vanilla-sprache')) expectTexts(await texts(page), locale, where.replace(id, id.split('--')[1]));
          if (kind === 'docs') {
            const found = await texts(page);
            if (!found.body.includes(TEXT[locale].link)) fail(`${where}: Beispiele der Docs-Seite nicht in der Sprache ${locale}`);
          }
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (kind === 'story' && overflow > 0) fail(`${where} seitliches Scrollen ${overflow}px`);
          await page.close();
        }
        await ctx.close();
      }
    }
  }

  // 3: Umschalter in der Oberfläche (Manager), ohne Neuladen
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto(`${origin}/?path=/docs/${DOCS}`, { waitUntil: 'networkidle' });
  const frame = page.frameLocator('#storybook-preview-iframe');
  await frame.locator('.sbdocs-content').waitFor();
  await page.waitForTimeout(1500);
  const preview = page.frames().find((f) => f.url().includes('iframe.html'));
  await preview.evaluate(() => { window.__hoopsMarker = 'ohne Neuladen'; });
  const before = await texts(preview);
  if (!before.body.includes(TEXT.de.link)) fail(`${name} Oberfläche: Start nicht deutsch`);
  // Der Knopf trägt die Beschreibung des Globals und den gewählten Wert im Namen (Storybook 10: Auswahlliste mit role=option)
  const toggle = page.locator('button[aria-haspopup="listbox"][aria-label^="Sprache der eingebauten Texte"]');
  for (const [target, label] of [['en', 'English (en)'], ['de', 'Deutsch (de)']]) {
    const failedBefore = failed;
    await toggle.click();
    await page.getByRole('option', { name: label }).click();
    await page.waitForTimeout(1200);
    const after = await texts(preview);
    checks += 1;
    expectTexts(after, target, `${name} Oberfläche svelte+vanilla nach Wechsel auf ${target}`);
    const marker = await preview.evaluate(() => window.__hoopsMarker);
    if (marker !== 'ohne Neuladen') fail(`${name} Oberfläche: der Rahmen wurde neu geladen`);
    if (target === 'en' && !after.lang.includes('en')) fail(`${name} Oberfläche: lang="en" fehlt an den Bausteinen`);
    // Storybook schreibt nur vom Start abweichende Globals in die Adresse: en steht drin, der Start de nicht mehr
    const search = decodeURIComponent(new URL(page.url()).search);
    if (target === 'en' ? !search.includes('locale:en') : search.includes('locale:en')) fail(`${name} Oberfläche: Adresse passt nicht zu ${target} (${page.url()})`);
    if (failed === failedBefore) console.log(`ok ${name}: Umschalter auf ${target}, Link „${TEXT[target].link}“, Buchstaben ${after.letters.slice(0, 3).join('')}`);
  }
  await ctx.close();
  await browser.close();
}
server.close();
console.log(failed === 0 ? `OK: ${checks} Prüfungen ohne Fehler (${BROWSERS.join(', ')})` : `${failed} Fehler in ${checks} Prüfungen`);
process.exitCode = failed === 0 ? 0 : 1;
