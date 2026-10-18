#!/usr/bin/env node
/**
 * Browser-Prüfung der Internationalisierung von Svelte und React (nicht Teil von `npm test`):
 *
 *   node scripts/check-i18n-browser.mjs [--browsers=chromium,webkit] [--only=svelte|react]
 *
 * Startet einen Vite-Server auf scripts/i18n-demo/ (Demo-Seiten mit allen Bausteinen, Svelte und React) und prüft je Browser, Fassung und Sprache (en, de):
 *   1. axe ohne Verstöße (WCAG 2.x A/AA/AAA, best-practice, Kontrast 7:1, Zielgrößen),
 *   2. Beschriftungen in der gewählten Sprache,
 *   3. Sprachwechsel zur Laufzeit ohne Neuladen: Beschriftungen von Tabs, Stepper, Akkordeon, Navigation und Modal folgen, Auswahl, offener Bereich,
 *      Fokus und das geöffnete Modal bleiben erhalten, die Live-Region ändert sich nicht (keine Ansage),
 *   4. nach dem Wechsel erneut axe,
 *   5. React: ein `HoopsProvider` mit eigener Sprache gilt nur in seinem Bereich und setzt dort `lang`.
 * Exit 1 bei einem Fehler; nicht installierte Browser werden gemeldet und übersprungen.
 */
import { createServer as createNetServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { chromium, webkit, firefox } from 'playwright';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const BROWSERS = arg('browsers', 'chromium,webkit').split(',');
const ONLY = arg('only', '');
const LAUNCH = { chromium, webkit, firefox };

const TAGS = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const EXTRA = ['color-contrast-enhanced', 'target-size', 'landmark-unique', 'heading-order'];
// Regeln für das ganze Dokument (Landmarken, h1) gehören der Anwendung, die die Bausteine einsetzt; die Demo ist ein Ausschnitt
const OFF = ['region', 'landmark-one-main', 'page-has-heading-one', 'landmark-no-duplicate-banner', 'landmark-unique'];

const TEXT = {
  en: { close: 'Close', tabs: 'Tabs', progress: 'Progress', sections: 'Sections', nav: 'Main navigation', crumb: 'Breadcrumb', expand: 'Expand all', collapse: 'Collapse all', live: 'Live', captain: 'Captain', pbp: 'Play-by-play · newest first', letters: ['W', 'L', 'D'] },
  de: { close: 'Schließen', tabs: 'Tabs', progress: 'Fortschritt', sections: 'Bereiche', nav: 'Hauptnavigation', crumb: 'Breadcrumb', expand: 'Alle öffnen', collapse: 'Alle schließen', live: 'Live', captain: 'Kapitän', pbp: 'Play-by-Play · neueste oben', letters: ['S', 'N', 'U'] },
};

// Vite kennt keinen Port 0: einen freien Port vorab suchen
const port = await new Promise((resolve) => {
  const probe = createNetServer().listen(0, '127.0.0.1', () => {
    const { port: free } = probe.address();
    probe.close(() => resolve(free));
  });
});
const server = await createServer({
  root: ROOT, configFile: false, plugins: [svelte({ configFile: join(ROOT, 'svelte.config.js') })],
  esbuild: { jsx: 'automatic' }, server: { host: '127.0.0.1', port, strictPort: true, hmr: false }, logLevel: 'error', appType: 'mpa',
});
await server.listen();
const origin = `http://127.0.0.1:${port}`;
const axeSource = join(ROOT, 'node_modules/axe-core/axe.min.js');

let failures = 0;
let checks = 0;
const fail = (where, message) => {
  failures += 1;
  console.log(`FEHLER [${where}] ${message}`);
};
const expect = (where, condition, message) => {
  checks += 1;
  if (!condition) fail(where, message);
};

async function axe(page, where) {
  await page.addScriptTag({ path: axeSource });
  const violations = await page.evaluate(async ({ tags, extra, off }) => {
    const rules = { ...Object.fromEntries(extra.map((r) => [r, { enabled: true }])), ...Object.fromEntries(off.map((r) => [r, { enabled: false }])) };
    const out = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, rules });
    return out.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')}: ${(n.failureSummary || '').split('\n')[1] ?? ''}`) }));
  }, { tags: TAGS, extra: EXTRA, off: OFF });
  checks += 1;
  if (violations.length) fail(where, `axe: ${JSON.stringify(violations)}`);
}

const labels = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label')));
// textContent statt innerText: das CSS setzt manche Texte in Großbuchstaben
const text = (page) => page.evaluate(() => document.body.textContent);

async function run(browserName, framework, lang) {
  const launcher = LAUNCH[browserName];
  const browser = await launcher.launch();
  const other = lang === 'en' ? 'de' : 'en';
  const where = `${browserName}/${framework}/${lang}`;
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${origin}/scripts/i18n-demo/${framework}.html?lang=${lang}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__ready === true);
  await page.waitForTimeout(400);

  const t = TEXT[lang];
  // 1 + 2: Ausgangslage
  await axe(page, `${where} Ausgangslage`);
  const names = await labels(page);
  for (const [what, value] of [['Tabs', t.tabs], ['Stepper', t.progress], ['Sprungleiste', t.sections], ['Navigation', t.nav], ['Pfad', t.crumb], ['Play-by-Play', t.pbp]]) expect(where, names.includes(value), `${what}: aria-label „${value}“ fehlt (gefunden: ${names.join(' | ')})`);
  const body = await text(page);
  for (const word of [t.expand, t.collapse, t.live, t.captain]) expect(where, body.includes(word), `Text „${word}“ fehlt`);
  const letters = await page.evaluate(() => [...document.querySelectorAll('.hoops-form--letters .hoops-form-item')].map((el) => getComputedStyle(el, '::before').content.replace(/"/g, '')));
  expect(where, JSON.stringify(letters) === JSON.stringify(t.letters), `Buchstaben der Form: ${JSON.stringify(letters)} statt ${JSON.stringify(t.letters)}`);
  expect(where, errors.length === 0, `Konsolenfehler: ${errors.join(' | ')}`);

  // 3: Sprachwechsel zur Laufzeit. Zustand herstellen: Tab „Two“ gewählt und fokussiert; Bereich X ist offen; Bereich Y wird geöffnet
  await page.locator('[role=tab]', { hasText: 'Two' }).click();
  await page.locator('[id="y-trigger"]').click();
  // Safari fokussiert Schaltflächen beim Klick nicht: den Fokus ausdrücklich setzen, damit er in allen Browsern geprüft wird
  await page.locator('[id="y-trigger"]').focus();
  const liveBefore = await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((el) => el.textContent));
  const before = await page.evaluate(() => ({ focus: document.activeElement?.id || document.activeElement?.tagName, x: document.getElementById('x-trigger')?.getAttribute('aria-expanded'), y: document.getElementById('y-trigger')?.getAttribute('aria-expanded'), tab: document.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim() }));
  await page.evaluate((code) => window.__setLocale(code), other);
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ focus: document.activeElement?.id || document.activeElement?.tagName, x: document.getElementById('x-trigger')?.getAttribute('aria-expanded'), y: document.getElementById('y-trigger')?.getAttribute('aria-expanded'), tab: document.querySelector('[role=tab][aria-selected=true]')?.textContent?.trim() }));
  const names2 = await labels(page);
  const t2 = TEXT[other];
  for (const [what, value] of [['Stepper', t2.progress], ['Sprungleiste', t2.sections], ['Navigation', t2.nav], ['Play-by-Play', t2.pbp]]) expect(where, names2.includes(value), `nach dem Wechsel zu ${other}: ${what} „${value}“ fehlt`);
  expect(where, (await text(page)).includes(t2.expand), `nach dem Wechsel zu ${other}: „${t2.expand}“ fehlt`);
  expect(where, JSON.stringify(after) === JSON.stringify(before), `Zustand nach dem Wechsel: ${JSON.stringify(after)} statt ${JSON.stringify(before)} (Auswahl, offene Bereiche, Fokus)`);
  const liveAfter = await page.evaluate(() => [...document.querySelectorAll('[aria-live]')].map((el) => el.textContent));
  expect(where, JSON.stringify(liveAfter) === JSON.stringify(liveBefore), `Live-Region hat sich geändert (Ansage): ${JSON.stringify(liveBefore)} -> ${JSON.stringify(liveAfter)}`);
  await axe(page, `${where} nach dem Wechsel zu ${other}`);

  // Modal: Fokus im Dialog, Sprachwechsel, Dialog bleibt offen und trägt die neue Sprache
  await page.evaluate((code) => window.__setLocale(code), lang);
  await page.waitForTimeout(200);
  await page.click('#open-modal');
  await page.waitForSelector('.hoops-m-close');
  await page.focus('.hoops-m-close');
  const closeBefore = await page.getAttribute('.hoops-m-close', 'aria-label');
  expect(where, closeBefore === t.close, `Modal: Schließen-Knopf „${closeBefore}“ statt „${t.close}“`);
  await page.evaluate((code) => window.__setLocale(code), other);
  await page.waitForTimeout(300);
  const closeAfter = await page.getAttribute('.hoops-m-close', 'aria-label');
  expect(where, closeAfter === t2.close, `Modal nach dem Wechsel: „${closeAfter}“ statt „${t2.close}“`);
  expect(where, await page.evaluate(() => document.activeElement?.classList.contains('hoops-m-close') ?? false), 'Modal: der Fokus blieb nicht auf dem Schließen-Knopf');
  expect(where, (await page.locator('.hoops-modal').count()) === 1, 'Modal: nach dem Wechsel nicht mehr offen');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  expect(where, (await page.locator('.hoops-modal').count()) === 0, 'Modal: Escape schließt nicht');

  // 5: Anbieter (nur React)
  if (framework === 'react') {
    await page.evaluate((code) => window.__setLocale(code), lang);
    await page.waitForTimeout(200);
    const provider = await page.evaluate(() => {
      const section = document.getElementById('provider');
      const list = section?.querySelector('ol');
      return { label: list?.getAttribute('aria-label'), lang: list?.getAttribute('lang'), text: section?.textContent };
    });
    expect(where, provider.label === 'Fortschritt (Anbieter)', `Anbieter: Name der Liste „${provider.label}“`);
    expect(where, provider.lang === 'de', `Anbieter: lang „${provider.lang}“ statt „de“ (Seite ist ${lang})`);
    expect(where, (provider.text ?? '').includes('(erledigt)') && (provider.text ?? '').includes('(ausstehend)'), `Anbieter: Zustände nicht deutsch: ${provider.text}`);
    const outside = await labels(page);
    expect(where, outside.includes(t.progress), 'außerhalb des Anbieters gilt die globale Sprache nicht mehr');
  }

  await browser.close();
}

const missing = [];
for (const browserName of BROWSERS) {
  if (!LAUNCH[browserName]) { missing.push(`${browserName} (unbekannt)`); continue; }
  for (const framework of ['svelte', 'react'].filter((f) => !ONLY || f === ONLY)) {
    for (const lang of ['en', 'de']) {
      try {
        await run(browserName, framework, lang);
        console.log(`geprüft: ${browserName}/${framework}/${lang}`);
      } catch (error) {
        if (/Executable doesn't exist|browserType.launch/.test(String(error))) { if (!missing.includes(browserName)) missing.push(`${browserName} (nicht installiert)`); break; }
        fail(`${browserName}/${framework}/${lang}`, String(error?.stack ?? error));
      }
    }
  }
}
await server.close();
if (missing.length) console.log(`übersprungen: ${missing.join(', ')}`);
console.log(failures === 0 ? `OK: ${checks} Prüfungen ohne Fehler` : `${failures} Fehler bei ${checks} Prüfungen`);
process.exitCode = failures === 0 ? 0 : 1;
