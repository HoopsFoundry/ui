#!/usr/bin/env node
/**
 * Browser-Prüfung der Vorschauen in Gerätebreite (Storybook aufräumen, Preview/StickyPreview in stories/docs/blocks/Preview.tsx) auf einem
 * Storybook-Build, in Chromium und WebKit:
 *
 *   npm run build-storybook
 *   node scripts/check-preview-docs.mjs storybook-static                       # Chromium und WebKit, vier Kombinationen je Seite
 *   node scripts/check-preview-docs.mjs storybook-static --browsers=webkit --filter=components-tabs
 *   node scripts/check-preview-docs.mjs storybook-static --full                # volles Produkt Marke × Theme × Breite × Sprache × Fensterbreite
 *
 * Seiten: alle Docs-Seiten des Builds, die eine Vorschau enthalten. Je Seite laufen vier Kombinationen, die jeden Wert jeder Dimension
 * mindestens einmal abdecken (Fensterbreite 1400, 900, 640 = Zoom 200 % bei 1280, 320; Breite voll, handy, tablet, desktop; Marke, Theme und
 * Sprache wechselnd); `--full` nimmt das volle Produkt. Geprüft wird je Lauf:
 *  - keine Seitenfehler und keine Konsolenfehler (auch aus den Iframes),
 *  - jede Vorschau und jedes Beispiel einer feststehenden Vorschau rendert (Story sichtbar, keine Fehlermeldung von Storybook),
 *  - der Iframe übernimmt Marke, Theme und Sprache der Seite (Adresse und `data-brand`/`data-theme` im Iframe), seine Breite ist die
 *    gewählte Gerätebreite (bei breiteren Geräten verkleinert per transform) bzw. die Spaltenbreite bei Vollbreite,
 *  - kein seitliches Scrollen durch die Vorschau (Docs-Seite) und keines im Iframe; seitliches Scrollen durch andere Inhalte der Seite wird
 *    als Hinweis gezählt (nicht Teil dieser Prüfung, die Docs-Matrix prüft 1280 und 420 px),
 *  - feststehend: Ist der Abschnitt höher als die Vorschau, steht sie beim Scrollen durch den Abschnitt 16 px (nebeneinander, ab 1100 px)
 *    bzw. 0 px (untereinander) vom oberen Rand,
 *  - automatischer Wechsel (bei 1400 und 900 px): Steht der Anfang eines Abschnitts an der Lesezeile, zeigt die Vorschau sein Beispiel.
 * Die Beispiele werden mit reduzierter Bewegung (`prefers-reduced-motion`) über die Liste gewählt, damit kein automatischer Wechsel dazwischen
 * kommt; den automatischen Wechsel prüft ein eigener Lauf ohne reduzierte Bewegung.
 * Ausgabe: eine Zeile je Fehlschlag, am Ende eine Übersicht; Exit-Code 1 bei Fehlschlägen oder wenn kein Browser startet (ADR-013).
 * Läuft nicht unter `npm test` (braucht einen Storybook-Build und Browser).
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import * as playwright from 'playwright';
import { exitIfNoKnownBrowser, requireOneStarted } from './browser-launch.mjs';

const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v = 'true'] = a.slice(2).split('='); return [k, v]; }));
const STATIC = resolve(positional[0] ?? 'storybook-static');
const FILTER = args.filter ?? '';
const BROWSERS = (args.browsers ?? 'chromium,webkit').split(',');
const DEVICE = { voll: null, handy: 390, tablet: 768, desktop: 1280 }; // wie .storybook/breite.ts
const STICKY_TOP = { wide: 16, narrow: 0 }; // wie STICKY_GAP in Preview.tsx und blocks.css
const WIDE_MIN = 1100;
const READ_LINE = { wide: 0.3, narrow: 0.62 }; // wie READ_LINE_WIDE und READ_LINE_NARROW in preview-logic.ts
const COMBOS = args.full === 'true'
  ? ['bbv', 'dbb'].flatMap((brand) => ['Light', 'Dark'].flatMap((theme) => Object.keys(DEVICE).flatMap((breite) => ['de', 'en'].flatMap((locale) => [1400, 900, 640, 320].map((width) => ({ brand, theme, breite, locale, width }))))))
  : [
      { width: 1400, breite: 'voll', brand: 'bbv', theme: 'Light', locale: 'de' },
      { width: 900, breite: 'handy', brand: 'dbb', theme: 'Dark', locale: 'en' },
      { width: 640, breite: 'tablet', brand: 'bbv', theme: 'Dark', locale: 'en' },
      { width: 320, breite: 'desktop', brand: 'dbb', theme: 'Light', locale: 'de' },
    ];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.map': 'application/json' };
const CONSOLE_IGNORE = [/Download the React DevTools/, /favicon/, /\[HMR\]/];

exitIfNoKnownBrowser(BROWSERS);
if (!existsSync(join(STATIC, 'index.json'))) {
  console.error(`Kein Storybook-Build in ${STATIC} (index.json fehlt). Erst: npm run build-storybook`);
  process.exit(2);
}
const index = JSON.parse(await readFile(join(STATIC, 'index.json'), 'utf8'));
const DOCS = Object.values(index.entries).filter((e) => e.type === 'docs' && e.id.includes(FILTER)).map((e) => e.id);

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  const file = join(STATIC, path === '/' ? 'index.html' : path);
  if (!existsSync(file) || !extname(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const failures = [];
const versions = {};
const notStarted = [];
let runs = 0;
let previewsChecked = 0;
let stickyMeasured = 0;
let autoChecked = 0;
const otherOverflow = new Set();
const pagesWithPreview = new Set();

async function checkCombo(browserName, ctx, id, combo) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`Seitenfehler: ${String(e.message ?? e).split('\n')[0]}`));
  page.on('console', (m) => { if (m.type() === 'error' && !CONSOLE_IGNORE.some((re) => re.test(m.text()))) errors.push(`Konsole: ${m.text().slice(0, 200)}`); });
  const label = `${browserName} ${id} [${combo.width}px ${combo.breite} ${combo.brand}/${combo.theme}/${combo.locale}]`;
  const fail = (kind, detail) => failures.push({ label, kind, detail });
  try {
    await page.goto(`${origin}/iframe.html?viewMode=docs&id=${id}&globals=brand:${combo.brand};theme:${combo.theme};breite:${combo.breite};locale:${combo.locale}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.sbdocs-content', { timeout: 20000 });
    const figures = page.locator('.hoops-preview');
    const count = await figures.count();
    if (count === 0) { await page.close(); return false; }
    pagesWithPreview.add(id);
    runs += 1;
    for (let i = 0; i < count; i += 1) {
      const fig = figures.nth(i);
      const picks = fig.locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " hoops-sp ")][1]//button[contains(@class, "hoops-sp-pick")]');
      const n = Math.max(1, await picks.count());
      for (let k = 0; k < n; k += 1) {
        await fig.evaluate((f) => f.scrollIntoView({ block: 'center' }));
        const wanted = (await picks.count()) ? await picks.nth(k).evaluate((b) => { b.click(); return b.textContent.replace(/^✓\s*/, '').trim(); }) : null;
        try {
          await page.waitForFunction(({ f, wanted }) => {
            const ifr = f.querySelector('iframe');
            const d = ifr?.contentDocument;
            if (wanted && ifr?.title !== `Vorschau: ${wanted}`) return false;
            return Boolean(d?.body?.classList.contains('sb-show-main') && d.getElementById('storybook-root')?.childElementCount && d.documentElement.hasAttribute('data-theme'));
          }, { f: await fig.elementHandle(), wanted }, { timeout: 20000 });
        } catch {
          fail('Vorschau rendert nicht', `Vorschau ${i + 1}, Beispiel ${k + 1}`);
          continue;
        }
        await page.waitForTimeout(400);
        const r = await fig.evaluate((f) => {
          const ifr = f.querySelector('iframe');
          const d = ifr.contentDocument;
          const err = d.querySelector('.sb-errordisplay');
          const stage = f.querySelector('.hoops-preview-stage');
          return {
            title: ifr.title,
            src: ifr.getAttribute('src'),
            cssWidth: parseFloat(ifr.style.width),
            innerWidth: d.documentElement.clientWidth,
            visualWidth: ifr.getBoundingClientRect().width,
            stageWidth: stage.clientWidth,
            brand: d.documentElement.getAttribute('data-brand'),
            type: d.documentElement.getAttribute('data-type'),
            theme: d.documentElement.getAttribute('data-theme'),
            error: err && getComputedStyle(err).display !== 'none' && (err.textContent ?? '').trim() ? (err.textContent ?? '').trim().slice(0, 160) : '',
            overflow: d.documentElement.scrollWidth - d.documentElement.clientWidth,
            fixedTheme: f.closest('.hoops-preview-pair') !== null,
          };
        });
        previewsChecked += 1;
        const where = `„${r.title}“`;
        if (r.error) fail('Story-Fehler', `${where}: ${r.error}`);
        if (r.overflow > 0) fail('seitliches Scrollen im Iframe', `${where}: ${r.overflow}px`);
        const want = DEVICE[combo.breite] ?? Math.floor(r.stageWidth);
        if (Math.abs(r.innerWidth - want) > 1) fail('Breite', `${where}: Iframe ${r.innerWidth}px statt ${want}px`);
        if (r.visualWidth > r.stageWidth + 1) fail('Breite', `${where}: sichtbar ${r.visualWidth}px breiter als die Spalte ${r.stageWidth}px`);
        if (!r.src.includes(`brand:${combo.brand}`) || !r.src.includes(`locale:${combo.locale}`)) fail('Globals', `${where}: ${r.src}`);
        if ((combo.brand === 'dbb') !== (r.brand === 'dbb' && r.type === 'dbb')) fail('Marke/Schrift', `${where}: data-brand=${r.brand} data-type=${r.type}`);
        if (!r.fixedTheme && r.theme !== combo.theme.toLowerCase()) fail('Theme', `${where}: data-theme=${r.theme} statt ${combo.theme.toLowerCase()}`);
      }
    }
    // feststehende Vorschau: in der Mitte des Abschnitts muss die Vorschau am oberen Rand stehen
    for (const sp of await page.locator('.hoops-sp').all()) {
      const m = await sp.evaluate((el) => ({ top: el.getBoundingClientRect().top + scrollY, h: el.offsetHeight, aside: el.querySelector('.hoops-sp-aside').offsetHeight }));
      if (m.h - m.aside < 120) continue; // Text kürzer als die Vorschau: nichts zu halten
      await page.evaluate((y) => scrollTo(0, y), m.top + (m.h - m.aside) / 2);
      await page.waitForTimeout(250);
      const top = await sp.evaluate((el) => el.querySelector('.hoops-sp-aside').getBoundingClientRect().top);
      const expect = combo.width >= WIDE_MIN ? STICKY_TOP.wide : STICKY_TOP.narrow;
      stickyMeasured += 1;
      if (Math.abs(top - expect) > 2) fail('feststehend', `Vorschau steht bei ${Math.round(top)}px statt ${expect}px`);
    }
    // seitliches Scrollen: nur, was die Vorschau-Bausteine selbst über den Rand schieben, zählt als Befund
    const over = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const right = (sel) => Math.max(0, ...[...document.querySelectorAll(sel)].map((el) => el.getBoundingClientRect().right));
      return { own: Math.ceil(right('.hoops-sp, .hoops-sp *, .hoops-preview-pair, .hoops-preview, .hoops-preview *') - W), page: document.documentElement.scrollWidth - W };
    });
    if (over.own > 0) fail('seitliches Scrollen durch die Vorschau', `${over.own}px`);
    if (over.page > 0) otherOverflow.add(`${id} bei ${combo.width}px: ${over.page}px`);
    for (const e of errors) fail('Fehler', e);
  } catch (error) {
    fail('abgebrochen', String(error.message).split('\n')[0]);
  }
  for (const f of failures.filter((x) => x.label === label)) console.log(`FAIL ${label} ${f.kind}: ${f.detail}`);
  await page.close();
  return true;
}

/** Automatischer Wechsel ohne reduzierte Bewegung: jeden Abschnitt an die Lesezeile scrollen, die Vorschau zeigt sein Beispiel. */
async function checkAuto(browserName, ctx, id, combo) {
  const page = await ctx.newPage();
  const label = `${browserName} ${id} [auto ${combo.width}px]`;
  try {
    await page.goto(`${origin}/iframe.html?viewMode=docs&id=${id}&globals=breite:${combo.breite}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.sbdocs-content', { timeout: 20000 });
    const share = combo.width >= WIDE_MIN ? READ_LINE.wide : READ_LINE.narrow;
    for (const sp of await page.locator('.hoops-sp[data-steps]').all()) {
      if (Number(await sp.getAttribute('data-steps')) < 2) continue;
      if ((await sp.getAttribute('data-auto')) !== 'true') { failures.push({ label, kind: 'automatischer Wechsel', detail: 'data-auto ist nicht true' }); continue; }
      const titles = await sp.locator('.hoops-sp-title').evaluateAll((hs) => hs.map((h) => h.firstChild.textContent.trim()));
      for (let i = 0; i < titles.length; i += 1) {
        await sp.evaluate((el, { i, share }) => {
          const step = el.querySelectorAll('.hoops-sp-step')[i];
          scrollBy(0, step.getBoundingClientRect().top - innerHeight * share + 2);
        }, { i, share });
        try {
          await page.waitForFunction(({ el, t }) => el.querySelector('.hoops-preview iframe')?.title === `Vorschau: ${t}`, { el: await sp.elementHandle(), t: titles[i] }, { timeout: 5000 });
          autoChecked += 1;
        } catch {
          const shown = await sp.evaluate((el) => el.querySelector('.hoops-preview iframe')?.title);
          failures.push({ label, kind: 'automatischer Wechsel', detail: `Abschnitt „${titles[i]}“ an der Lesezeile, die Vorschau zeigt „${shown}“` });
        }
      }
    }
  } catch (error) {
    failures.push({ label, kind: 'abgebrochen', detail: String(error.message).split('\n')[0] });
  }
  for (const f of failures.filter((x) => x.label === label)) console.log(`FAIL ${label} ${f.kind}: ${f.detail}`);
  await page.close();
}

try {
  for (const name of BROWSERS) {
    let browser;
    try {
      browser = await playwright[name].launch();
      versions[name] = browser.version();
    } catch (error) {
      notStarted.push({ browser: name, reason: String(error.message).split('\n')[0] });
      continue;
    }
    for (const id of DOCS) {
      for (const combo of COMBOS) {
        const ctx = await browser.newContext({ viewport: { width: combo.width, height: 900 }, colorScheme: combo.theme === 'Dark' ? 'dark' : 'light', reducedMotion: 'reduce' });
        const hasPreview = await checkCombo(name, ctx, id, combo);
        await ctx.close();
        if (!hasPreview) break; // Seite ohne Vorschau: weitere Kombinationen unnötig
        if (combo.width === 1400 || combo.width === 900) {
          const auto = await browser.newContext({ viewport: { width: combo.width, height: 900 }, reducedMotion: 'no-preference' });
          await checkAuto(name, auto, id, combo);
          await auto.close();
        }
      }
    }
    await browser.close();
  }
} finally {
  server.close();
}

if (requireOneStarted(BROWSERS, versions, notStarted)) {
  const summary = { browsers: versions, notStarted, pages: [...pagesWithPreview].sort(), combos: COMBOS.length, runs, previewsChecked, stickyMeasured, autoChecked, failures: failures.length, hinweisSeitlichesScrollenAndererInhalte: [...otherOverflow].sort() };
  console.log(JSON.stringify(summary, null, 2));
  console.log(failures.length === 0 ? `OK: ${runs} Läufe, ${previewsChecked} Vorschauen, ${stickyMeasured} Messungen der feststehenden Vorschau, ${autoChecked} automatische Wechsel ohne Befund` : `${failures.length} Befunde`);
  if (failures.length) process.exitCode = 1;
}
