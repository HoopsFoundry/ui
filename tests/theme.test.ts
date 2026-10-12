// initTheme und themeBootScript unter jsdom: Modi, Speicher, Systemeinstellung, Beschriftung, Aufräumen, Boot-Skript, Sicherheit.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTheme, nextTheme, parseTheme, readTheme, resolveTheme, themeBootScript, writeTheme } from '../js/theme.js';

const html = document.documentElement;
let handle: { destroy(): void; getMode(): string; setMode(m: string): void } | undefined;
let dark = false;
let listeners: Array<() => void> = [];
const stubMedia = (initial = false) => {
  dark = initial;
  listeners = [];
  vi.stubGlobal('matchMedia', (q: string) => ({
    get matches() { return q.includes('dark') ? dark : false; },
    media: q,
    addEventListener: (_t: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (_t: string, fn: () => void) => { listeners = listeners.filter((l) => l !== fn); },
  }));
};
const system = (value: boolean) => { dark = value; listeners.slice().forEach((fn) => fn()); };
const button = (attrs = '', inner = '') => {
  document.body.replaceChildren(document.createRange().createContextualFragment(`<button id="b" ${attrs}>${inner}</button>`));
  return document.getElementById('b') as HTMLButtonElement;
};
const memory = (data: Record<string, string> = {}) => ({
  data,
  getItem: (k: string) => (k in data ? data[k] : null),
  setItem: (k: string, v: string) => { data[k] = v; },
  removeItem: (k: string) => { delete data[k]; },
});

beforeEach(() => {
  html.removeAttribute('data-theme');
  localStorage.clear();
  stubMedia(false);
});
afterEach(() => {
  handle?.destroy();
  handle = undefined;
  document.body.replaceChildren();
  html.removeAttribute('data-theme');
  html.removeAttribute('data-x');
  vi.unstubAllGlobals();
});

describe('reine Funktionen', () => {
  it('parseTheme: nur light, dark, system', () => {
    expect(['light', 'dark', 'system'].map(parseTheme)).toEqual(['light', 'dark', 'system']);
    for (const v of ['Dark', 'auto', '', null, undefined, 1, {}]) expect(parseTheme(v)).toBeNull();
  });
  it('resolveTheme: system folgt der Systemeinstellung, ungültig gilt als system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('x', true)).toBe('dark');
  });
  it('nextTheme: wechselt den tatsächlichen Zustand, nie auf system', () => {
    expect(nextTheme('light', false)).toBe('dark');
    expect(nextTheme('dark', false)).toBe('light');
    expect(nextTheme('system', true)).toBe('light');
    expect(nextTheme('system', false)).toBe('dark');
  });
  it('readTheme/writeTheme: Fehler des Speichers bleiben ohne Wirkung', () => {
    const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
    expect(readTheme(broken as never)).toBeNull();
    expect(writeTheme(broken as never, 'dark')).toBe(false);
    expect(writeTheme(broken as never, 'system')).toBe(false);
    expect(readTheme(null)).toBeNull();
    const m = memory();
    expect(writeTheme(m, 'dark', 'k')).toBe(true);
    expect(readTheme(m, 'k')).toBe('dark');
    writeTheme(m, 'system', 'k');
    expect(readTheme(m, 'k')).toBeNull();
    expect(readTheme(memory({ k: 'kaputt' }), 'k')).toBeNull();
  });
});

describe('initTheme: Zustand und Beschriftung', () => {
  it('ohne Speicher und System hell: kein Attribut, aria-pressed false, feste Beschriftung „Dunkelmodus“', () => {
    const b = button('hidden');
    handle = initTheme(b);
    expect(html.hasAttribute('data-theme')).toBe(false);
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(b.getAttribute('aria-label')).toBe('Dunkelmodus');
    expect(b.getAttribute('type')).toBe('button');
    expect(b.getAttribute('data-theme-state')).toBe('light');
    expect(b.getAttribute('data-theme-mode')).toBe('system');
    expect(b.hidden).toBe(false);
    expect(b.classList.contains('dss-theme-toggle')).toBe(true);
    expect(handle.getMode()).toBe('system');
  });
  it('System dunkel: aria-pressed true, aber kein Attribut (das CSS folgt prefers-color-scheme)', () => {
    stubMedia(true);
    const b = button();
    handle = initTheme(b);
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
  it('gemerkte Wahl wird gesetzt', () => {
    localStorage.setItem('dss-theme', 'dark');
    const b = button();
    handle = initTheme(b);
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(handle.getMode()).toBe('dark');
  });
  it('ein ungültiger gemerkter Wert gilt als system', () => {
    localStorage.setItem('dss-theme', 'lila');
    handle = initTheme(button());
    expect(handle.getMode()).toBe('system');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
  it('option mode gewinnt, wird aber nicht gemerkt', () => {
    localStorage.setItem('dss-theme', 'light');
    handle = initTheme(button(), { mode: 'dark' });
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('dss-theme')).toBe('light');
  });
  it('die Beschriftung bleibt beim Umschalten gleich; ein Button mit Text behält seinen Namen', () => {
    const b = button();
    handle = initTheme(b);
    b.click();
    expect(b.getAttribute('aria-label')).toBe('Dunkelmodus');
    b.click();
    expect(b.getAttribute('aria-label')).toBe('Dunkelmodus');
    handle.destroy();
    const t = button('', 'Dunkler Modus');
    handle = initTheme(t);
    expect(t.hasAttribute('aria-label')).toBe(false);
    const own = button('aria-label="Design"');
    handle = initTheme(own, { label: 'Anderes' });
    expect(own.getAttribute('aria-label')).toBe('Design');
    handle.destroy();
    const custom = button();
    handle = initTheme(custom, { label: 'Nachtmodus' });
    expect(custom.getAttribute('aria-label')).toBe('Nachtmodus');
  });
  it('legt zwei SVG-Symbole an (aria-hidden), eigene Symbole bleiben unberührt', () => {
    const b = button();
    handle = initTheme(b);
    const icons = [...b.querySelectorAll('svg')];
    expect(icons.map((i) => i.getAttribute('class'))).toEqual(['dss-theme-icon dss-theme-icon--sun', 'dss-theme-icon dss-theme-icon--moon']);
    for (const i of icons) expect(i.getAttribute('aria-hidden')).toBe('true');
    handle.destroy();
    const own = button('', '<span class="dss-theme-icon">x</span>');
    handle = initTheme(own);
    expect(own.querySelectorAll('svg')).toHaveLength(0);
  });
});

describe('initTheme: Umschalten und Merken', () => {
  it('Klick schaltet hell/dunkel, setzt Attribut und aria-pressed, merkt die Wahl', () => {
    const b = button();
    handle = initTheme(b);
    b.click();
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.getAttribute('data-theme-state')).toBe('dark');
    expect(localStorage.getItem('dss-theme')).toBe('dark');
    b.click();
    expect(html.getAttribute('data-theme')).toBe('light');
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('dss-theme')).toBe('light');
  });
  it('aus system (dunkel) schaltet der erste Klick auf hell', () => {
    stubMedia(true);
    const b = button();
    handle = initTheme(b);
    b.click();
    expect(html.getAttribute('data-theme')).toBe('light');
  });
  it('setMode(system) entfernt Attribut und Eintrag; ungültige Modi werden ignoriert', () => {
    const b = button();
    handle = initTheme(b);
    handle.setMode('dark');
    handle.setMode('lila' as never);
    expect(handle.getMode()).toBe('dark');
    handle.setMode('system');
    expect(html.hasAttribute('data-theme')).toBe(false);
    expect(localStorage.getItem('dss-theme')).toBeNull();
    expect(b.getAttribute('data-theme-mode')).toBe('system');
  });
  it('storageKey, storage und attribute sind konfigurierbar; storage null merkt nichts', () => {
    const m = memory();
    const b = button();
    handle = initTheme(b, { storageKey: 'mein-theme', storage: m, attribute: 'data-x' });
    b.click();
    expect(m.data['mein-theme']).toBe('dark');
    expect(html.getAttribute('data-x')).toBe('dark');
    expect(localStorage.getItem('dss-theme')).toBeNull();
    handle.destroy();
    handle = initTheme(button(), { storage: null });
    document.getElementById('b')!.click();
    expect(localStorage.length).toBe(0);
  });
  it('target: ein anderes Element bekommt das Attribut', () => {
    document.body.replaceChildren(document.createRange().createContextualFragment('<div id="t"></div><button id="b"></button>'));
    handle = initTheme(document.getElementById('b')!, { target: document.getElementById('t')! });
    document.getElementById('b')!.click();
    expect(document.getElementById('t')!.getAttribute('data-theme')).toBe('dark');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
  it('ein ungültiger attribute-Name fällt auf data-theme zurück', () => {
    const b = button();
    handle = initTheme(b, { attribute: 'onclick=alert(1) x' });
    b.click();
    expect(html.getAttribute('data-theme')).toBe('dark');
  });
  it('onChange meldet Modus und Zustand', () => {
    const calls: unknown[] = [];
    const b = button();
    handle = initTheme(b, { onChange: (m: string, t: string) => calls.push([m, t]) });
    b.click();
    b.click();
    expect(calls).toEqual([['dark', 'dark'], ['light', 'light']]);
  });
  it('blockierter Speicher (Zugriff wirft): ohne Fehler, Umschalten geht weiter', () => {
    const broken = { getItem() { throw new Error('blockiert'); }, setItem() { throw new Error('blockiert'); }, removeItem() { throw new Error('blockiert'); } };
    const b = button();
    expect(() => { handle = initTheme(b, { storage: broken }); }).not.toThrow();
    b.click();
    expect(html.getAttribute('data-theme')).toBe('dark');
  });
  it('der Zugriff auf window.localStorage selbst wirft: ohne Fehler', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('SecurityError'); });
    const b = button();
    try {
      expect(() => { handle = initTheme(b); }).not.toThrow();
      b.click();
      expect(html.getAttribute('data-theme')).toBe('dark');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('initTheme: Systemeinstellung und andere Tabs', () => {
  it('im Modus system folgt aria-pressed der Änderung der Systemeinstellung', () => {
    const b = button();
    handle = initTheme(b);
    expect(b.getAttribute('aria-pressed')).toBe('false');
    system(true);
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(b.getAttribute('data-theme-state')).toBe('dark');
    system(false);
    expect(b.getAttribute('aria-pressed')).toBe('false');
  });
  it('mit gewählter Wahl ändert die Systemeinstellung nichts', () => {
    const b = button();
    handle = initTheme(b, { mode: 'light' });
    system(true);
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(html.getAttribute('data-theme')).toBe('light');
  });
  it('ein storage-Ereignis eines anderen Tabs übernimmt die Wahl', () => {
    const b = button();
    handle = initTheme(b);
    localStorage.setItem('dss-theme', 'dark');
    window.dispatchEvent(new StorageEvent('storage', { key: 'dss-theme', newValue: 'dark' }));
    expect(html.getAttribute('data-theme')).toBe('dark');
    localStorage.setItem('anderer', 'x');
    window.dispatchEvent(new StorageEvent('storage', { key: 'anderer' }));
    expect(html.getAttribute('data-theme')).toBe('dark');
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
  it('ältere Browser mit addListener', () => {
    const fns: Array<() => void> = [];
    vi.stubGlobal('matchMedia', () => ({ matches: false, addListener: (f: () => void) => fns.push(f), removeListener: (f: () => void) => fns.splice(fns.indexOf(f), 1) }));
    handle = initTheme(button());
    expect(fns).toHaveLength(1);
    handle.destroy();
    expect(fns).toHaveLength(0);
  });
  it('ohne matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    const b = button();
    expect(() => { handle = initTheme(b); }).not.toThrow();
    b.click();
    expect(html.getAttribute('data-theme')).toBe('dark');
  });
});

describe('initTheme: Aufräumen und Idempotenz', () => {
  it('destroy entfernt Listener, Symbole und gesetzte Attribute; das Theme bleibt wie gewählt', () => {
    const b = button('class="dss-btn"');
    const before = b.outerHTML;
    handle = initTheme(b);
    b.click();
    handle.destroy();
    handle.destroy();
    expect(b.outerHTML).toBe(before);
    expect(html.getAttribute('data-theme')).toBe('dark');
    b.click();
    expect(html.getAttribute('data-theme')).toBe('dark');
    system(true);
    expect(b.hasAttribute('aria-pressed')).toBe(false);
    expect(listeners).toHaveLength(0);
  });
  it('ein zweiter Aufruf für denselben Button ersetzt den ersten (ein Klick schaltet nur einmal)', () => {
    const b = button();
    initTheme(b);
    handle = initTheme(b);
    b.click();
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(b.querySelectorAll('svg')).toHaveLength(2);
    expect(listeners).toHaveLength(1);
  });
  it('ohne Button: Handle, das nichts tut', () => {
    for (const v of [null, undefined, {}, 'b']) {
      const h = initTheme(v as never);
      expect(() => { h.setMode('dark'); h.destroy(); }).not.toThrow();
      expect(h.getMode()).toBe('system');
    }
  });
});

describe('defaultMode: Boot-Skript und Umschalter stimmen überein', () => {
  it('ohne gemerkte Wahl gilt defaultMode: Attribut gesetzt, nichts entfernt', () => {
    html.setAttribute('data-theme', 'dark'); // das Boot-Skript hat es gesetzt
    const remove = vi.spyOn(html, 'removeAttribute');
    const b = button();
    handle = initTheme(b, { defaultMode: 'dark' });
    expect(handle.getMode()).toBe('dark');
    expect(html.getAttribute('data-theme')).toBe('dark');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(remove).not.toHaveBeenCalledWith('data-theme');
    remove.mockRestore();
  });
  it('die gemerkte Wahl gewinnt gegen defaultMode, defaultMode gegen system', () => {
    localStorage.setItem('dss-theme', 'light');
    handle = initTheme(button(), { defaultMode: 'dark' });
    expect(handle.getMode()).toBe('light');
    handle.destroy();
    localStorage.clear();
    handle = initTheme(button());
    expect(handle.getMode()).toBe('system');
    handle.destroy();
    handle = initTheme(button(), { defaultMode: 'bunt' as never });
    expect(handle.getMode()).toBe('system');
  });
  it('die Wahl „System“ wird bei defaultMode dark gemerkt und beim nächsten Besuch behalten', () => {
    handle = initTheme(button(), { defaultMode: 'dark' });
    handle.setMode('system');
    expect(localStorage.getItem('dss-theme')).toBe('system');
    expect(html.hasAttribute('data-theme')).toBe(false);
    handle.destroy();
    handle = initTheme(button(), { defaultMode: 'dark' });
    expect(handle.getMode()).toBe('system');
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
  it('bei defaultMode system löscht „System“ weiter den Eintrag', () => {
    handle = initTheme(button());
    handle.setMode('dark');
    handle.setMode('system');
    expect(localStorage.getItem('dss-theme')).toBeNull();
  });
  it('das Boot-Skript lässt eine gemerkte Wahl „system“ ohne Attribut, auch bei defaultMode dark', () => {
    const s = themeBootScript({ defaultMode: 'dark' });
    html.removeAttribute('data-theme');
    vi.stubGlobal('localStorage', { getItem: () => 'system' });
    new Function(s)();
    expect(html.hasAttribute('data-theme')).toBe(false);
  });
  it('ein anderer Tab, der den Eintrag löscht, ergibt defaultMode', () => {
    localStorage.setItem('dss-theme', 'light');
    handle = initTheme(button(), { defaultMode: 'dark' });
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
    expect(handle.getMode()).toBe('dark');
  });
});

describe('mehrere Umschalter teilen den Modus', () => {
  const two = () => {
    document.body.replaceChildren(document.createRange().createContextualFragment('<button id="b1"></button><button id="b2"></button>'));
    return [document.getElementById('b1')!, document.getElementById('b2')!] as HTMLButtonElement[];
  };
  it('ein Klick auf den ersten stellt auch den zweiten um (aria-pressed, Zustand, Modus)', () => {
    const [b1, b2] = two();
    const h1 = initTheme(b1);
    const h2 = initTheme(b2);
    b1.click();
    expect(b2.getAttribute('aria-pressed')).toBe('true');
    expect(b2.getAttribute('data-theme-mode')).toBe('dark');
    expect(h2.getMode()).toBe('dark');
    b2.click();
    expect(b1.getAttribute('aria-pressed')).toBe('false');
    expect(h1.getMode()).toBe('light');
    h1.destroy();
    h2.destroy();
  });
  it('setMode(system) auf einem wirkt auf alle; die Wahl wird nur einmal gespeichert', () => {
    const [b1, b2] = two();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const h1 = initTheme(b1);
    const h2 = initTheme(b2);
    h1.setMode('dark');
    expect(setItem).toHaveBeenCalledTimes(1);
    h2.setMode('system');
    expect(h1.getMode()).toBe('system');
    expect(b1.getAttribute('data-theme-mode')).toBe('system');
    setItem.mockRestore();
    h1.destroy();
    h2.destroy();
  });
  it('Umschalter mit anderem Schlüssel bleiben unabhängig; nach destroy hört keiner mehr', () => {
    const [b1, b2] = two();
    const h1 = initTheme(b1, { storageKey: 'a' });
    const h2 = initTheme(b2, { storageKey: 'b' });
    b1.click();
    expect(h2.getMode()).toBe('system');
    h2.destroy();
    b1.click();
    expect(b2.hasAttribute('aria-pressed')).toBe(false);
    h1.destroy();
  });
  it('onChange der anderen Instanz wird aufgerufen', () => {
    const [b1, b2] = two();
    const calls: string[] = [];
    const h1 = initTheme(b1);
    const h2 = initTheme(b2, { onChange: (m: string) => calls.push(m) });
    b1.click();
    expect(calls).toEqual(['dark']);
    h1.destroy();
    h2.destroy();
  });
});

describe('themeBootScript', () => {
  const run = (script: string, stored?: string | (() => never)) => {
    html.removeAttribute('data-theme');
    const store = typeof stored === 'function' ? stored : () => (stored ?? null);
    vi.stubGlobal('localStorage', { getItem: store });
    new Function(script)();
    vi.unstubAllGlobals();
    return html.getAttribute('data-theme');
  };
  it('setzt die gemerkte Wahl (light, dark)', () => {
    const s = themeBootScript();
    expect(run(s, 'dark')).toBe('dark');
    expect(run(s, 'light')).toBe('light');
  });
  it('system, ungültig, leer: kein Attribut', () => {
    const s = themeBootScript();
    for (const v of ['system', 'lila', '', undefined]) expect(run(s, v)).toBeNull();
  });
  it('blockierter Speicher wirft nicht', () => {
    const s = themeBootScript({ defaultMode: 'dark' });
    expect(run(s, () => { throw new Error('x'); })).toBe('dark');
  });
  it('defaultMode gilt ohne gemerkte Wahl, die Wahl gewinnt', () => {
    expect(run(themeBootScript({ defaultMode: 'dark' }), undefined)).toBe('dark');
    expect(run(themeBootScript({ defaultMode: 'dark' }), 'light')).toBe('light');
    expect(run(themeBootScript({ defaultMode: 'x' as never }), undefined)).toBeNull();
  });
  it('storageKey und attribute', () => {
    const s = themeBootScript({ storageKey: 'mein-theme', attribute: 'data-x' });
    vi.stubGlobal('localStorage', { getItem: (k: string) => (k === 'mein-theme' ? 'dark' : null) });
    new Function(s)();
    expect(html.getAttribute('data-x')).toBe('dark');
  });
  it('ein ungültiger attribute-Name fällt auf data-theme zurück', () => {
    expect(themeBootScript({ attribute: 'x"; alert(1); "' })).toContain('"data-theme"');
  });
  it('kurz, ohne Fremdcode, ES5-Stil (kein let/const/Pfeil)', () => {
    const s = themeBootScript();
    expect(s.length).toBeLessThan(300);
    expect(s).not.toMatch(/\b(let|const)\b|=>/);
    expect(s.startsWith('(function(){')).toBe(true);
  });
  it('Schlüssel mit </script> und Anführungszeichen bleibt eine Zeichenkette (nichts bricht aus)', () => {
    const evil = '"</script><script>window.__pwn=1</script> \\';
    const s = themeBootScript({ storageKey: evil });
    expect(s).not.toContain('</script');
    expect(s).not.toMatch(/<\/?script/i);
    let asked = '';
    vi.stubGlobal('localStorage', { getItem: (k: string) => { asked = k; return 'dark'; } });
    new Function(s)();
    expect(asked).toBe(evil);
    expect((window as unknown as { __pwn?: number }).__pwn).toBeUndefined();
    expect(html.getAttribute('data-theme')).toBe('dark');
  });
});

describe('Quelltext', () => {
  it('kein innerHTML, kein onclick-Attribut, kein globaler Zustand', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('js/theme.js', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(src).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|onclick|eval\(|new Function/);
    expect(src).not.toMatch(/\bwindow\.\w+\s*=/);
  });
});
