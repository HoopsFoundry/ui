// Das gebaute Bündel im Browser-Modell (jsdom): initAll startet jeden Baustein per data-dss, Tabs und Modal arbeiten, destroy räumt auf,
// Versionsabgleich mit dem geladenen Stylesheet.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { bundleDir as out } from './helpers/bundle-dir';
import { dialogMarkup, divMarkup, polyfillDialog, removeDialogPolyfill } from './helpers/modal-markup';
import { keydown, mountHtml, tabsMarkup } from './helpers/tabs-markup';

type Bundle = {
  initAll: (scope?: ParentNode, o?: Record<string, unknown>) => { destroy(): void; count: number };
  checkVersion: (doc?: Document) => { js: string; css: string | null; match: boolean };
  VERSION: string;
  themeBootScript: () => string;
};
let bundle: Bundle;
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

beforeAll(async () => {
  bundle = await import(/* @vite-ignore */ pathToFileURL(`${out}dss.min.js`).href);
  polyfillDialog();
});
afterAll(() => removeDialogPolyfill());
afterEach(() => {
  document.body.replaceChildren();
  document.head.replaceChildren();
  document.documentElement.removeAttribute('style');
  document.documentElement.removeAttribute('data-theme');
  vi.unstubAllGlobals();
});

const page = () => `
<button type="button" id="theme" data-dss="theme"></button>
<main data-dss="pagenav"><h1>Verein</h1><h2>Tabelle</h2><p>x</p><h2>Spielplan</h2><p>y</p><h2>Kader</h2><p>z</p></main>
${tabsMarkup('', 'a')}${tabsMarkup('', 'b')}${divMarkup('m1')}${dialogMarkup('m2')}`;

describe('minifiziertes Bündel im Browser-Modell', () => {
  it('initAll startet jeden Baustein per data-dss (mehrere Elemente je Baustein)', () => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    mountHtml(page());
    const handle = bundle.initAll(document);
    expect(handle.count).toBe(1 + 1 + 2 + 2);
    expect(document.getElementById('theme')!.getAttribute('aria-pressed')).toBe('false');
    expect(document.querySelector('nav.dss-pagenav')).not.toBeNull();
    keydown(document.getElementById('a-alle')!, 'ArrowRight');
    keydown(document.getElementById('b-alle')!, 'ArrowRight');
    expect(document.getElementById('a-heim')!.getAttribute('aria-selected')).toBe('true');
    expect(document.getElementById('b-heim')!.getAttribute('aria-selected')).toBe('true');
    click(document.getElementById('m1-auf')!);
    expect((document.getElementById('m1') as HTMLElement).hidden).toBe(false);
    keydown(document.activeElement!, 'Escape');
    expect((document.getElementById('m1') as HTMLElement).hidden).toBe(true);
    click(document.getElementById('m2-auf')!);
    expect(document.getElementById('m2')!.hasAttribute('open')).toBe(true);
    handle.destroy();
    expect(document.querySelector('nav.dss-pagenav')).toBeNull();
    expect(document.getElementById('a-heim')!.getAttribute('aria-selected')).toBe('false');
  });
  it('themeBootScript liefert den Inline-Code für den head', () => {
    expect(bundle.themeBootScript()).toMatch(/^\(function/);
  });
  it('Versionsabgleich: ohne Stylesheet css null, mit dss.css (:root --dss-version) passt es', () => {
    expect(bundle.checkVersion().css).toBeNull();
    const style = document.createElement('style');
    style.textContent = `:root { --dss-version: "${bundle.VERSION}"; }`;
    document.head.append(style);
    const result = bundle.checkVersion();
    expect(result).toEqual({ js: bundle.VERSION, css: bundle.VERSION, match: true });
    style.textContent = ':root { --dss-version: "0.1.0"; }';
    expect(bundle.checkVersion().match).toBe(false);
  });
  it('checkVersion({ warn: true }) meldet fehlendes oder abweichendes Stylesheet mit console.warn, sonst still', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    bundle.checkVersion(document, { warn: true } as never);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('dss.css ist nicht geladen');
    bundle.checkVersion({ warn: true } as never);
    expect(warn).toHaveBeenCalledTimes(2);
    const style = document.createElement('style');
    style.textContent = ':root { --dss-version: "0.0.1"; }';
    document.head.append(style);
    bundle.checkVersion(document, { warn: true } as never);
    expect(String(warn.mock.calls[2][0])).toContain('passen nicht zusammen');
    style.textContent = `:root { --dss-version: "${bundle.VERSION}"; }`;
    bundle.checkVersion(document, { warn: true } as never);
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });
  it('dss.css enthält die Version, die das Bündel meldet', () => {
    expect(readFileSync(`${out}dss.css`, 'utf8')).toContain(`--dss-version: "${bundle.VERSION}"`);
  });
});
