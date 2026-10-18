// @vitest-environment node
// Das Vanilla-Bündel (scripts/build-vanilla.mjs): lädt in Node ohne window, enthält kein Framework, kein innerHTML, keine Leaflet-Importe,
// exportiert genau die dokumentierte Liste (Schnappschuss der Namen), bleibt im Größenbudget und liefert CSS, Typen und Quellkarten.
import { BUDGETS } from '../scripts/vanilla-budgets.mjs';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import { bundleDir as out } from './helpers/bundle-dir';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const text = (name: string) => readFileSync(`${out}${name}`, 'utf8');
let mod: Record<string, unknown>;

// Größenbudget (gemessen: 47,5 KiB min, 16,4 KiB gzip, davon Sprachkern und englischer Katalog; vor I2: 36,3 KiB und 12,9 KiB; Render-Funktionen und Karte haben eigene Bündel mit eigenem Budget)
export const BUDGET = BUDGETS['hoops'];

// Die dokumentierte Liste (Foundation/Vanilla): neue Exporte gehören bewusst hierher und in die Doku
export const EXPORTS = [
  'HOOPS_BLOCKS', 'MODAL_CLOSE_EVENT', 'MODAL_OPEN_EVENT', 'TAB_EVENT', 'THEME_ATTRIBUTE', 'THEME_KEY', 'VERSION',
  'checkVersion', 'closeModal', 'createHandle', 'cssVersion', 'focusables', 'hashTarget', 'initAccordion', 'initAccordions', 'initAll',
  'initBackToTop', 'initModal', 'initPageNav', 'initTabs', 'initTheme', 'initialTab', 'nextHeader', 'nextTab', 'nextTheme', 'openModal',
  'parseOptions', 'parseTheme', 'readTheme', 'reducedMotion', 'resolveTheme', 'revealAround', 'safeHref', 'scrollToElement', 'slug',
  'themeBootScript', 'writeTheme',
  // Sprache und Texte (I2); localeOf und onLocaleChange sind für die Bündel render, map und i18n-de, die den Kern von hier importieren
  'LOCALE_EVENT', 'availableLocales', 'getLocale', 'localeOf', 'onLocaleChange', 'registerLocale', 'setLocale', 'setTexts', 't',
];

beforeAll(async () => {
  mod = await import(/* @vite-ignore */ pathToFileURL(`${out}hoops.js`).href);
});

describe('Bündel dist/vanilla', () => {
  it('liefert alle Dateien', () => {
    for (const name of ['hoops.js', 'hoops.min.js', 'hoops.js.map', 'hoops.min.js.map', 'hoops.d.ts', 'hoops.css', 'courtlines/court.svg', 'courtlines/court-portrait.svg']) expect(existsSync(`${out}${name}`), name).toBe(true);
  });
  it('lädt in Node ohne window und document; der Import hat keine Nebenwirkung', () => {
    expect(typeof (globalThis as { window?: unknown }).window).toBe('undefined');
    expect(typeof (globalThis as { document?: unknown }).document).toBe('undefined');
    expect(Object.keys(mod).sort()).toEqual([...EXPORTS].sort());
  });
  it('in Node tun die Init-Funktionen nichts, ohne zu werfen', () => {
    const { initAll, initTabs, initModal, initPageNav, themeBootScript, safeHref, checkVersion } = mod as Record<string, (...a: unknown[]) => any>;
    expect(initAll()).toMatchObject({ count: 0 });
    initAll().destroy();
    expect(initTabs(null).getValue()).toBeNull();
    expect(initModal(null).isOpen()).toBe(false);
    expect(() => initPageNav(null).destroy()).not.toThrow();
    expect(themeBootScript()).toContain('localStorage');
    expect(safeHref('javascript:alert(1)')).toBeUndefined();
    expect(safeHref('https://example.org/')).toBe('https://example.org/');
    expect(checkVersion()).toEqual({ js: pkg.version, css: null, match: false });
  });
  it('VERSION ist die Version der package.json, hoops.css trägt sie ebenfalls', () => {
    expect(mod.VERSION).toBe(pkg.version);
    expect(text('hoops.css')).toContain(`--hoops-version: "${pkg.version}"`);
  });
  it('HOOPS_BLOCKS nennt alle Bausteine von initAll', () => {
    expect(mod.HOOPS_BLOCKS).toEqual(['accordion', 'pagenav', 'backtop', 'theme', 'tabs', 'modal', 'map']);
  });
  it('kein import, kein require: das Bündel ist eine Datei ohne Abhängigkeiten (kein React, Svelte, Radix, Leaflet)', () => {
    for (const name of ['hoops.js', 'hoops.min.js']) {
      const code = text(name);
      expect(code, name).not.toMatch(/^\s*import[\s{("']/m);
      expect(code, name).not.toMatch(/\brequire\(/);
      expect(code, name).not.toMatch(/from\s*["'][^"']+["']/);
      expect(code, name).not.toMatch(/import\(/); // auch kein dynamischer Import: Leaflet gehört nicht hinein
      for (const word of ['react', 'svelte', 'radix', 'leaflet', 'L.map', 'map-leaflet']) expect(code.toLowerCase(), `${name}: ${word}`).not.toContain(word);
    }
  });
  it('kein innerHTML, outerHTML, insertAdjacentHTML, document.write, eval oder new Function', () => {
    for (const name of ['hoops.js', 'hoops.min.js']) {
      const code = text(name);
      for (const needle of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'srcdoc']) expect(code, `${name}: ${needle}`).not.toContain(needle);
    }
  });
  it('Größenbudget: min und gzip', () => {
    const min = statSync(`${out}hoops.min.js`).size;
    const gz = gzipSync(readFileSync(`${out}hoops.min.js`)).length;
    console.log(`hoops.min.js ${min} Byte, gzip ${gz} Byte; hoops.js ${statSync(`${out}hoops.js`).size} Byte`);
    expect(min).toBeLessThanOrEqual(BUDGET.minBytes);
    expect(gz).toBeLessThanOrEqual(BUDGET.gzipBytes);
    expect(statSync(`${out}hoops.js`).size).toBeGreaterThan(min);
  });
  it('Quellkarten verweisen auf die Quelldateien in js/', () => {
    const map = JSON.parse(text('hoops.min.js.map')) as { sources: string[]; sourcesContent?: string[] };
    expect(map.sources.some((s) => s.endsWith('js/tabs.js'))).toBe(true);
    expect(map.sources.some((s) => s.endsWith('js/modal.js'))).toBe(true);
    expect(text('hoops.min.js')).toContain('sourceMappingURL=hoops.min.js.map');
  });
  it('Typen: zusammengeführt in einer Datei, ohne Importe aus dem Paket', () => {
    const types = text('hoops.d.ts');
    expect(types).not.toMatch(/from ['"]\.\//);
    for (const name of EXPORTS) expect(types, name).toContain(name);
    for (const name of ['TabsOptions', 'ModalOptions', 'TabChangeDetail', 'ModalCloseDetail']) expect(types).toContain(name);
  });
  it('CSS: Tokens vor den Komponenten, einschließlich Tabs und natives Dialog', () => {
    const css = text('hoops.css');
    expect(css.indexOf('--hoops-version')).toBeLessThan(css.indexOf('.hoops-tab'));
    expect(css.indexOf(':root')).toBeLessThan(css.indexOf('.hoops-tabs'));
    expect(css).toContain('dialog.hoops-modal-dialog');
    expect(css).toContain('url("courtlines/court.svg")');
  });
  it('package.json: exports ./vanilla und ./vanilla/*, dist in files, Skripte', () => {
    expect(pkg.exports['./vanilla']).toEqual({ types: './dist/vanilla/hoops.d.ts', import: './dist/vanilla/hoops.js' });
    expect(pkg.exports['./vanilla/*']).toBe('./dist/vanilla/*');
    expect(pkg.exports['./tabs.js']).toEqual({ types: './js/tabs.d.ts', import: './js/tabs.js' });
    expect(pkg.exports['./modal.js']).toEqual({ types: './js/modal.d.ts', import: './js/modal.js' });
    expect(pkg.files).toContain('dist/');
    expect(pkg.scripts['build:vanilla']).toBe('node scripts/build-vanilla.mjs');
    expect(pkg.scripts['build:react']).toBe('tsup');
    expect(pkg.scripts.prepare).toBe('npm run build');
    expect(pkg.scripts.build).toBe('npm run build:react && npm run build:vanilla');
  });
});

describe('Paket: Peer-Abhängigkeiten', () => {
  it('React 18 und 19 sind freigegeben (npm install im leeren Projekt ohne ERESOLVE)', () => {
    expect(pkg.peerDependencies.react).toBe('^18.0.0 || ^19.0.0');
    expect(pkg.peerDependencies['react-dom']).toBe('^18.0.0 || ^19.0.0');
    expect(pkg.peerDependenciesMeta.react.optional).toBe(true);
  });
});
