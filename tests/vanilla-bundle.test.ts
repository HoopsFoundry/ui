// @vitest-environment node
// Das Vanilla-Bündel (scripts/build-vanilla.mjs): lädt in Node ohne window, enthält kein Framework, kein innerHTML, keine Leaflet-Importe,
// exportiert genau die dokumentierte Liste (Schnappschuss der Namen), bleibt im Größenbudget und liefert CSS, Typen und Quellkarten.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import { bundleDir as out } from './helpers/bundle-dir';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const text = (name: string) => readFileSync(`${out}${name}`, 'utf8');
let mod: Record<string, unknown>;

// Größenbudget (gemessen: 36,3 KiB min, 12,9 KiB gzip; Reserve für kleine Ergänzungen; Render-Funktionen und Karte haben eigene Bündel mit eigenem Budget)
export const BUDGET = { minBytes: 40 * 1024, gzipBytes: 15 * 1024 };

// Die dokumentierte Liste (Foundation/Vanilla): neue Exporte gehören bewusst hierher und in die Doku
export const EXPORTS = [
  'DSS_BLOCKS', 'MODAL_CLOSE_EVENT', 'MODAL_OPEN_EVENT', 'TAB_EVENT', 'THEME_ATTRIBUTE', 'THEME_KEY', 'THEME_LABEL', 'VERSION',
  'checkVersion', 'closeModal', 'createHandle', 'cssVersion', 'focusables', 'hashTarget', 'initAccordion', 'initAccordions', 'initAll',
  'initBackToTop', 'initModal', 'initPageNav', 'initTabs', 'initTheme', 'initialTab', 'nextHeader', 'nextTab', 'nextTheme', 'openModal',
  'parseOptions', 'parseTheme', 'readTheme', 'reducedMotion', 'resolveTheme', 'revealAround', 'safeHref', 'scrollToElement', 'slug',
  'themeBootScript', 'writeTheme',
];

beforeAll(async () => {
  mod = await import(/* @vite-ignore */ pathToFileURL(`${out}dss.js`).href);
});

describe('Bündel dist/vanilla', () => {
  it('liefert alle Dateien', () => {
    for (const name of ['dss.js', 'dss.min.js', 'dss.js.map', 'dss.min.js.map', 'dss.d.ts', 'dss.css', 'courtlines/court.svg', 'courtlines/court-portrait.svg']) expect(existsSync(`${out}${name}`), name).toBe(true);
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
  it('VERSION ist die Version der package.json, dss.css trägt sie ebenfalls', () => {
    expect(mod.VERSION).toBe(pkg.version);
    expect(text('dss.css')).toContain(`--dss-version: "${pkg.version}"`);
  });
  it('DSS_BLOCKS nennt alle Bausteine von initAll', () => {
    expect(mod.DSS_BLOCKS).toEqual(['accordion', 'pagenav', 'backtop', 'theme', 'tabs', 'modal', 'map']);
  });
  it('kein import, kein require: das Bündel ist eine Datei ohne Abhängigkeiten (kein React, Svelte, Radix, Leaflet)', () => {
    for (const name of ['dss.js', 'dss.min.js']) {
      const code = text(name);
      expect(code, name).not.toMatch(/^\s*import[\s{("']/m);
      expect(code, name).not.toMatch(/\brequire\(/);
      expect(code, name).not.toMatch(/from\s*["'][^"']+["']/);
      expect(code, name).not.toMatch(/import\(/); // auch kein dynamischer Import: Leaflet gehört nicht hinein
      for (const word of ['react', 'svelte', 'radix', 'leaflet', 'L.map', 'map-leaflet']) expect(code.toLowerCase(), `${name}: ${word}`).not.toContain(word);
    }
  });
  it('kein innerHTML, outerHTML, insertAdjacentHTML, document.write, eval oder new Function', () => {
    for (const name of ['dss.js', 'dss.min.js']) {
      const code = text(name);
      for (const needle of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'srcdoc']) expect(code, `${name}: ${needle}`).not.toContain(needle);
    }
  });
  it('Größenbudget: min und gzip', () => {
    const min = statSync(`${out}dss.min.js`).size;
    const gz = gzipSync(readFileSync(`${out}dss.min.js`)).length;
    console.log(`dss.min.js ${min} Byte, gzip ${gz} Byte; dss.js ${statSync(`${out}dss.js`).size} Byte`);
    expect(min).toBeLessThanOrEqual(BUDGET.minBytes);
    expect(gz).toBeLessThanOrEqual(BUDGET.gzipBytes);
    expect(statSync(`${out}dss.js`).size).toBeGreaterThan(min);
  });
  it('Quellkarten verweisen auf die Quelldateien in js/', () => {
    const map = JSON.parse(text('dss.min.js.map')) as { sources: string[]; sourcesContent?: string[] };
    expect(map.sources.some((s) => s.endsWith('js/tabs.js'))).toBe(true);
    expect(map.sources.some((s) => s.endsWith('js/modal.js'))).toBe(true);
    expect(text('dss.min.js')).toContain('sourceMappingURL=dss.min.js.map');
  });
  it('Typen: zusammengeführt in einer Datei, ohne Importe aus dem Paket', () => {
    const types = text('dss.d.ts');
    expect(types).not.toMatch(/from ['"]\.\//);
    for (const name of EXPORTS) expect(types, name).toContain(name);
    for (const name of ['TabsOptions', 'ModalOptions', 'TabChangeDetail', 'ModalCloseDetail']) expect(types).toContain(name);
  });
  it('CSS: Tokens vor den Komponenten, einschließlich Tabs und natives Dialog', () => {
    const css = text('dss.css');
    expect(css.indexOf('--dss-version')).toBeLessThan(css.indexOf('.dss-tab'));
    expect(css.indexOf(':root')).toBeLessThan(css.indexOf('.dss-tabs'));
    expect(css).toContain('dialog.dss-modal-dialog');
    expect(css).toContain('url("courtlines/court.svg")');
  });
  it('package.json: exports ./vanilla und ./vanilla/*, dist in files, Skripte', () => {
    expect(pkg.exports['./vanilla']).toEqual({ types: './dist/vanilla/dss.d.ts', import: './dist/vanilla/dss.js' });
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
