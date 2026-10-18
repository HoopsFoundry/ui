// @vitest-environment node
// Doku-Seite „Internationalisierung“ (I4): Die Code-Beispiele laufen (Vanilla gegen das gebaute Bündel in jsdom, Svelte per Server-Rendern, React mit dem
// TypeScript-Compiler und per Server-Rendern), das Glossar stimmt mit den Katalogen überein (mit Mutationsprobe am Katalog), die Aussagen der Seite zu
// Ereignis und unbekannter Sprache gelten, die Werkzeugleiste hat das Global `locale`, und die Seite ist in Einführung, Sortierung, README und CHANGELOG eingetragen.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { ViteDevServer } from 'vite';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as code from '../stories/Foundation/Internationalisierung.code';
import type { GlossarEintrag } from '../stories/Foundation/Internationalisierung.code';
import { __resetForTests, getLocale, registerLocale, setLocale, setTexts, t } from '../js/i18n/index.js';
import { langFor } from '../js/i18n/lang.js';
import en from '../js/i18n/en.js';
import de from '../js/i18n/de.js';
import { checkCatalogs } from '../scripts/check-i18n.mjs';
import { bundleDir } from './helpers/bundle-dir';
import { cleanup, compileReact, read, renderSvelteSource, rootDir, startServer, type Render } from './helpers/docs-code';
import { mutantDir, writeMutant } from './helpers/mutant-file';

const tmpDir = `${rootDir}tests/.code-tmp-i18n/`;
const mdx = read('stories/Foundation/Internationalisierung.mdx');
const stories = read('stories/Foundation/Internationalisierung.stories.ts');
const demo = read('stories/Foundation/InternationalisierungDemo.svelte');
const preview = read('.storybook/preview.ts');

type Catalog = Record<string, string | Record<string, string>>;
/** Abweichungen des Glossars von den Katalogen (leer = passt). */
function glossarAbweichungen(glossar: GlossarEintrag[], enCat: Catalog, deCat: Catalog) {
  const wert = (cat: Catalog, g: GlossarEintrag) => {
    const v = cat[g.key];
    return typeof v === 'string' ? (g.form ? undefined : v) : v && g.form ? v[g.form] : undefined;
  };
  const out: string[] = [];
  for (const g of glossar) {
    if (wert(enCat, g) !== g.en) out.push(`${g.key} en: Glossar „${g.en}“, Katalog „${String(wert(enCat, g))}“`);
    if (wert(deCat, g) !== g.de) out.push(`${g.key} de: Glossar „${g.de}“, Katalog „${String(wert(deCat, g))}“`);
  }
  return out;
}

// ── Ausführen der Vanilla-Beispiele: jsdom als globales Fenster, Seitenpfade (/hoops/…) auf das Test-Bündel ──────────────
let dom: JSDOM;
const fileUrl = (path: string) => pathToFileURL(resolve(process.cwd(), path)).href;
let runs = 0;
async function runModule(source: string, names: string[]) {
  // hoops-i18n-de registriert sich beim Import; die Abfrage macht je Lauf ein frisches Modul (nach __resetForTests), der Kern bleibt eine Instanz
  const n = ++runs;
  const mapped = source
    .replaceAll("'/hoops/hoops-i18n-de.min.js'", `'${pathToFileURL(`${bundleDir}hoops-i18n-de.min.js`).href}?lauf=${n}'`)
    .replaceAll("'/hoops/hoops.min.js'", `'${pathToFileURL(`${bundleDir}hoops.min.js`).href}'`)
    .replaceAll("'/hoops/hoops-render.min.js'", `'${pathToFileURL(`${bundleDir}hoops-render.min.js`).href}'`)
    .replaceAll("'@hoopsfoundry/ui/i18n/de'", `'${fileUrl('js/i18n/de-register.js')}?lauf=${n}'`)
    .replaceAll("'@hoopsfoundry/ui/i18n/en'", `'${fileUrl('js/i18n/en.js')}'`)
    .replaceAll("'@hoopsfoundry/ui/i18n'", `'${fileUrl('js/i18n/index.js')}'`)
    .replaceAll("'./i18n/fr.js'", `'${fileUrl('js/i18n/de.js')}'`);
  const text = `${mapped}\nexport { ${names.join(', ')} };\n// Lauf ${n}`;
  return (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`)) as Record<string, unknown>;
}
/** HTML-Beispiel: Markup in den body, Inhalt des Modul-Skripts als Modul. */
async function runPage(page: string, names: string[]) {
  const script = page.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  const body = page.match(/<body>([\s\S]*?)<script type="module">/)?.[1] ?? '';
  document.body.replaceChildren(document.createRange().createContextualFragment(body));
  return runModule(script, names);
}

beforeEach(() => {
  dom = new JSDOM('<!doctype html><html lang="de"><body></body></html>', { url: 'http://localhost/' });
  const w = dom.window as unknown as Record<string, unknown>;
  for (const name of ['window', 'document', 'Element', 'HTMLElement', 'HTMLButtonElement', 'Node', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent', 'DocumentFragment', 'history', 'location', 'localStorage', 'matchMedia']) {
    if (name === 'window') vi.stubGlobal(name, dom.window);
    else if (name in w) vi.stubGlobal(name, w[name]);
  }
  if (!('matchMedia' in w)) vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  __resetForTests(); // Werkseinstellung: nur Englisch, so beweist jedes Beispiel, dass es selbst Deutsch lädt
});
afterEach(() => {
  dom.window.close();
  vi.unstubAllGlobals();
  __resetForTests();
  registerLocale('de', de);
  setLocale('de');
});

describe('Vanilla-Beispiele (gebautes Bündel, jsdom)', () => {
  it('Sprache einstellen: Deutsch nach dem Import von hoops-i18n-de, der Umschalter folgt einem späteren setLocale', async () => {
    expect(getLocale()).toBe('en');
    const out = await runPage(code.einstellenVanilla, ['sprache', 'knopf', 'ui']);
    expect(out.sprache).toBe('de');
    expect(out.knopf).toBe('Dunkelmodus');
    const button = document.querySelector('[data-hoops="theme"]')!;
    expect(button.getAttribute('aria-label')).toBe('Dunkelmodus');
    expect(button.hasAttribute('hidden')).toBe(false);
    setLocale('en');
    expect(button.getAttribute('aria-label')).toBe('Dark mode');
    (out.ui as { destroy(): void }).destroy();
  });
  it('Texte überschreiben: setTexts global und in jeder Sprache, options.texts nur für den Aufruf, linkLabel schlägt beides, options.locale ändert nichts global', async () => {
    const out = await runPage(code.ueberschreibenVanilla, ['eigen', 'verlinkt', 'englisch']);
    const eigen = out.eigen as string;
    const verlinkt = out.verlinkt as string;
    const englisch = out.englisch as string;
    expect(eigen).toContain('Alle Tabellen des Bezirks');
    expect(eigen).toContain('Zeichenerklärung');
    expect(eigen).not.toContain('>Legende<');
    expect(verlinkt).toContain('Zur Tabelle');
    expect(verlinkt).not.toContain('wird nicht gezeigt');
    expect(englisch).toContain('Standings');
    expect(englisch).toContain('Alle Tabellen des Bezirks'); // setTexts gilt für jede Sprache
    expect(englisch).toContain('lang="en"'); // Seite deutsch, Baustein englisch
    expect(getLocale()).toBe('de');
  });
  it('Sprache ergänzen: de-CH fällt auf de zurück, fr auf en, Mehrzahl nach Intl.PluralRules', async () => {
    const out = await runModule(code.ergaenzen, ['schliessen', 'menue', 'teams', 'fallback']);
    expect(out).toMatchObject({ schliessen: 'Schliessen', menue: 'Menü', teams: '12 équipes', fallback: 'Menu' });
    expect(t('league.summary.teams', { count: 1 })).toBe('1 équipe');
    expect(new Intl.PluralRules('fr').resolvedOptions().pluralCategories).toEqual(expect.arrayContaining(['one', 'many', 'other']));
  });
  it('Eigenen Katalog prüfen: das Beispiel läuft (mit dem deutschen Katalog als Ersatz: nichts fehlt, nichts zu viel)', async () => {
    const out = await runModule(code.pruefen, ['fehlt', 'zuviel']);
    expect(out.fehlt).toEqual([]);
    expect(out.zuviel).toEqual([]);
  });
  it('Ereignis: onLocaleChange und das DOM-Ereignis melden setLocale und setTexts, auch ohne laufenden Baustein; nach dem Abmelden nichts mehr', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await runModule(code.ereignis, ['abmelden']);
      expect(log.mock.calls.map((c) => c[0])).toEqual(['en', 'en']);
      expect(document.documentElement.lang).toBe('en');
      log.mockClear();
      setLocale('de');
      expect(log).not.toHaveBeenCalled(); // abgemeldet und kein Baustein: kein Ereignis mehr
    } finally {
      log.mockRestore();
    }
  });
  it('ohne Baustein und ohne onLocaleChange gibt es kein hoops:localechange (Aussage der Seite)', async () => {
    await import(/* @vite-ignore */ pathToFileURL(`${bundleDir}hoops.min.js`).href);
    const seen: string[] = [];
    document.addEventListener('hoops:localechange', (event) => seen.push((event as CustomEvent).detail.locale));
    setLocale('en');
    expect(seen).toEqual([]);
  });
});

describe('Svelte- und React-Beispiele', () => {
  let vite: ViteDevServer;
  let render: Render;
  beforeAll(async () => {
    ({ vite, render } = await startServer());
  }, 60000);
  afterAll(async () => {
    await vite?.close();
    cleanup(tmpDir);
  });
  const svelteSource = (source: string) =>
    source
      .replaceAll("'@hoopsfoundry/ui/i18n/de'", `'${rootDir}js/i18n/de-register.js'`)
      .replaceAll("'@hoopsfoundry/ui/i18n'", `'${rootDir}js/i18n/index.js'`)
      .replaceAll("'@hoopsfoundry/ui/svelte/i18n'", `'${rootDir}svelte/i18n.js'`);
  const reactSource = (source: string) =>
    source
      .replaceAll("'@hoopsfoundry/ui/i18n/de'", `'../js/i18n/de-register.js'`)
      .replaceAll("'@hoopsfoundry/ui/i18n'", `'../js/i18n/index.js'`);

  it('Svelte, Sprache einstellen: der Stepper ist deutsch, obwohl der Test mit Englisch beginnt', async () => {
    registerLocale('de', de); // der Vite-Server hat den Katalog im eigenen Modulgraphen schon geladen; der Import im Beispiel registriert nicht erneut
    expect(getLocale()).toBe('en');
    const html = await renderSvelteSource(vite, render, tmpDir, 'einstellen', svelteSource(code.einstellenSvelte));
    expect(getLocale()).toBe('de');
    expect(html).toContain('aria-label="Fortschritt"');
    expect(html).toContain('erledigt');
    expect(html).not.toContain('undefined');
  });
  it('Svelte, Texte überschreiben: Anbieter und texts an der Komponente', async () => {
    registerLocale('de', de);
    setLocale('de');
    const html = await renderSvelteSource(vite, render, tmpDir, 'ueberschreiben', svelteSource(code.ueberschreibenSvelte));
    expect(html).toContain('Alle Tabellen des Bezirks');
    expect(html).toContain('Zeichenerklärung');
    expect(html).toContain('Tabelle: Bezirksliga Nordhain');
  });
  it('React-Beispiele bestehen den TypeScript-Compiler', () => {
    expect(compileReact({ i18nEinstellen: reactSource(code.einstellenReact), i18nUeberschreiben: reactSource(code.ueberschreibenReact) })).toEqual([]);
  }, 60000);
  it('React, Sprache einstellen: außen deutsch, im HoopsProvider englisch mit lang="en", useLocale meldet beides richtig', async () => {
    registerLocale('de', de);
    mkdirSync(tmpDir, { recursive: true });
    const file = `${tmpDir}einstellen.tsx`;
    writeFileSync(file, code.einstellenReact
      .replaceAll("'@hoopsfoundry/ui/i18n/de'", `'${rootDir}js/i18n/de-register.js'`)
      .replaceAll("'@hoopsfoundry/ui/i18n'", `'${rootDir}js/i18n/index.js'`)
      .replaceAll("'@hoopsfoundry/ui/react'", `'${rootDir}react/index.ts'`));
    const { App } = (await vite.ssrLoadModule(file)) as { App: () => unknown };
    const html = renderToString(createElement(App as never));
    expect(getLocale()).toBe('de');
    expect(html).toContain('aria-label="Fortschritt"');
    expect(html).toContain('aria-label="Progress"');
    expect(html).toMatch(/lang="en"[^>]*aria-label="Progress"|aria-label="Progress"[^>]*lang="en"/);
    expect(html).toContain('Sprache hier: <!-- -->en');
  });
  it('React, Texte überschreiben: Anbieter und texts an der Komponente', async () => {
    registerLocale('de', de);
    setLocale('de');
    mkdirSync(tmpDir, { recursive: true });
    const file = `${tmpDir}ueberschreiben.tsx`;
    writeFileSync(file, code.ueberschreibenReact.replaceAll("'@hoopsfoundry/ui/react'", `'${rootDir}react/index.ts'`));
    const { Tabelle } = (await vite.ssrLoadModule(file)) as { Tabelle: () => unknown };
    const html = renderToString(createElement(Tabelle as never));
    expect(html).toContain('Alle Tabellen des Bezirks');
    expect(html).toContain('Zeichenerklärung');
  });
});

describe('Glossar und Kataloge', () => {
  it('jede Zeile des Glossars steht so in en und de', () => {
    expect(glossarAbweichungen(code.glossar, en as Catalog, de as Catalog)).toEqual([]);
    expect(new Set(code.glossar.map((g) => g.key)).size).toBe(code.glossar.length);
  });
  it('das Glossar nennt die Fachbegriffe aus der Aufgabe, soweit sie im Katalog stehen (Spielfrei, Heim, Gast, Viertel, Verlängerung)', () => {
    for (const word of ['Spielfrei', 'Heim', 'Gast', '{number}. Viertel', 'Verlängerung', 'Endstand']) expect(code.glossar.map((g) => g.de)).toContain(word);
  });
  it('Mutationsprobe: ein geänderter Fachbegriff im deutschen Katalog lässt den Vergleich fehlschlagen', async () => {
    const m = mutantDir();
    try {
      const file = writeMutant(m.dir, 'de.js', 'js/i18n/de.js', [["'common.home': 'Heim'", "'common.home': 'Zuhause'"]]);
      const mutant = (await import(/* @vite-ignore */ pathToFileURL(file).href)).default as Catalog;
      expect(glossarAbweichungen(code.glossar, en as Catalog, mutant)).toEqual(['common.home de: Glossar „Heim“, Katalog „Zuhause“']);
      const enMutant = writeMutant(m.dir, 'en.js', 'js/i18n/en.js', [["'league.zone.down.legend': 'Relegation'", "'league.zone.down.legend': 'Relegated'"]]);
      const enCat = (await import(/* @vite-ignore */ pathToFileURL(enMutant).href)).default as Catalog;
      expect(glossarAbweichungen(code.glossar, enCat, de as Catalog)).toHaveLength(1);
    } finally {
      m.drop();
    }
  });
  it('Begriffe aus Daten: die Ereignisarten gibt es am PlayByPlay, ihre Wörter stehen in keinem Katalog', () => {
    const pbp = read('svelte/PlayByPlay.svelte');
    const kinds = pbp.match(/kind\?: ([^;]+);/)![1];
    const values = new Set([...Object.values(en), ...Object.values(de)].flatMap((v) => (typeof v === 'string' ? [v] : Object.values(v))));
    for (const b of code.datenBegriffe) {
      expect(kinds, b.kind).toContain(`'${b.kind}'`);
      expect(values.has(b.de), b.de).toBe(false);
      expect(values.has(b.en), b.en).toBe(false);
    }
  });
  it('die Zahlen der Seite sind die der Kataloge; beide Kataloge haben dieselben Schlüssel (Prüfskript)', () => {
    expect(checkCatalogs({ en, de })).toEqual([]);
    expect(code.katalog.schluessel).toBe(Object.keys(de).length);
    expect(code.katalog.mehrzahl).toBeGreaterThan(0);
    expect(code.katalog.platzhalter).toBeGreaterThan(code.katalog.mehrzahl);
    expect(code.laengsteDe).toHaveLength(5);
    for (const z of code.laengsteDe) expect(z.mehr).toBeGreaterThan(0);
    expect(mdx).toContain('{katalog.schluessel}');
    expect(mdx).toContain('{katalog.zeichenDe}');
  });
});

describe('Aussagen der Seite zum Kern', () => {
  beforeEach(() => {
    registerLocale('de', de);
  });
  it('unbekannte Sprache: getLocale behält den Code, Texte englisch, lang am Baustein ist der Code', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setLocale('fr');
    expect(getLocale()).toBe('fr');
    expect(t('modal.close')).toBe('Close');
    expect(langFor({ documentLang: 'de' })).toBe('fr');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
  it('de_AT wird de-AT mit deutschen Texten; ein ungültiger Code ergibt en mit Warnung; ein fehlender Schlüssel sich selbst', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setLocale('de_AT');
    expect(getLocale()).toBe('de-AT');
    expect(t('modal.close')).toBe('Schließen');
    setLocale('xx!!');
    expect(getLocale()).toBe('en');
    expect(t('gibt.es.nicht')).toBe('gibt.es.nicht');
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
  it('setTexts gilt in jeder Sprache; ungültige Werte werden übergangen', () => {
    setTexts({ 'modal.close': 'Done', 'backtop.label': 42 as never });
    setLocale('de');
    expect(t('modal.close')).toBe('Done');
    expect(t('backtop.label')).toBe('Nach oben');
    setLocale('en');
    expect(t('modal.close')).toBe('Done');
  });
  it('die Tabelle der Seite nennt diese Fälle', () => {
    for (const part of ["setLocale('fr')", "setLocale('de_AT')", "setLocale('xx!!')", "'de-AT'", 'Englisch (Rückfall)', 'lang="fr"']) expect(mdx, part).toContain(part);
  });
});

describe('Seite, Werkzeugleiste, Einträge', () => {
  it('Toolbar-Global locale mit de und en, Start de; der Decorator setzt die Sprache aus context.globals.locale; kein fester Aufruf mehr', () => {
    expect(preview).toMatch(/locale: \{[\s\S]*?title: 'Sprache'[\s\S]*?value: 'de'[\s\S]*?value: 'en'/);
    expect(preview).toMatch(/initialGlobals: \{[\s\S]*?locale: 'de'/);
    expect(preview).toMatch(/context\.globals\.locale/);
    expect(preview).toMatch(/if \(getLocale\(\) !== locale\) setLocale\(locale\)/);
    expect(preview).not.toMatch(/^setLocale\('de'\);/m);
    expect(preview).toContain("import '../js/i18n/de-register.js'");
  });
  it('Mutationsprobe: ohne Decorator-Aufruf oder ohne Global schlägt die Prüfung fehl', () => {
    const ohneAufruf = preview.replace('if (getLocale() !== locale) setLocale(locale);', '');
    expect(ohneAufruf).not.toMatch(/if \(getLocale\(\) !== locale\) setLocale\(locale\)/);
    const ohneGlobal = preview.replace("title: 'Sprache'", "title: 'Language'");
    expect(ohneGlobal).not.toMatch(/locale: \{[\s\S]*?title: 'Sprache'/);
  });
  it('vor dem ersten Beispiel steht eine ##-Überschrift; jede genutzte Story gibt es, mit literalem Tag und Beispiel in der Demo', () => {
    expect(mdx.indexOf('\n## ')).toBeGreaterThan(0);
    expect(mdx.indexOf('\n## ')).toBeLessThan(mdx.indexOf('<Canvas'));
    for (const m of mdx.matchAll(/I18nStories\.(\w+)/g)) expect(stories, m[1]).toMatch(new RegExp(`export const ${m[1]}\\s*= \\{ \\.\\.\\.example\\('[\\w-]+'\\), tags: \\['!dev'\\] \\}`));
    for (const m of stories.matchAll(/example\('([\w-]+)'\)/g)) expect(demo, m[1]).toContain(`example === '${m[1]}'`);
    expect(stories).toMatch(/default \{[\s\S]*tags: \['!dev'\]/);
    expect(stories).toContain("title: 'Foundation/Internationalisierung'");
  });
  it('geschweifte Klammern im Fließtext sind nur Ausdrücke mit katalog.* (sonst wertet MDX {name} als Variable aus und die Seite bricht)', () => {
    const prose = mdx.split('\n').filter((line) => !/^\s|^import |^</.test(line)).map((line) => line.replace(/`[^`]*`/g, '')).join('\n');
    const braces = [...prose.matchAll(/\{[^}]*\}/g)].map((m) => m[0]);
    expect(braces.length).toBeGreaterThan(0);
    for (const b of braces) expect(b).toMatch(/^\{katalog\.\w+\}$/);
  });
  it('eindeutige Titel der Karten und Beschriftungen der Code-Blöcke (axe landmark-unique), keine Markdown-Tabellen', () => {
    const titles = [...demo.matchAll(/title(?:=|: )['"]([^'"]+)['"]/g)].map((m) => m[1]);
    expect(new Set(titles).size).toBe(titles.length);
    const labels = [...mdx.matchAll(/label="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(labels).size).toBe(labels.length);
    expect(mdx).not.toMatch(/^\|.*\|$/m);
  });
  it('die Seite behandelt alle Abschnitte des Plans', () => {
    for (const part of ['## Sprache einstellen', '## Texte überschreiben', '## Sprache ergänzen', '## Ereignis hoops:localechange', '## Unbekannte oder ungültige Sprache', '## Übersetzungsleitfaden', '### Glossar', '## Migration', 'hoops-i18n-de', 'provideI18n', 'HoopsProvider', 'useLocale', 'registerLocale', 'setTexts', 'documentLang', 'onLocaleChange']) expect(mdx, part).toContain(part);
    for (const part of ['statEmptyText', 'THEME_LABEL', 'data-letter', 'hoops.js', "setLocale('de')"]) expect(JSON.stringify(code.migration), part).toContain(part);
  });
  it('das Migrationsskript kennt die Änderungen der Internationalisierung nicht (die Tabelle sagt „von Hand“)', () => {
    const tools = read('scripts/migrate-from-dss.mjs') + read('scripts/lib/name-rename.mjs') + read('scripts/migration-table.mjs');
    for (const name of ['statEmptyText', 'THEME_LABEL', 'setLocale', 'data-letter']) expect(tools, name).not.toContain(name);
    for (const row of code.migration) expect(row.skript).toBe('nein, von Hand');
  });
  it('Einführung, storySort, README und CHANGELOG nennen die Seite', () => {
    expect(read('stories/Introduction.mdx')).toContain('foundation-internationalisierung--docs');
    expect(read('stories/Introduction.mdx')).toContain('**Sprache:**');
    expect(preview).toMatch(/'Dark Mode', 'Vanilla', 'Internationalisierung'/);
    expect(read('README.md')).toContain('Foundation/Internationalisierung');
    expect(read('CHANGELOG.md')).toContain('Foundation/Internationalisierung');
  });
});
