// Regeln für den Dunkelmodus-Umschalter und das Boot-Skript als prüfbare Aussagen (tests/theme-rules.test.ts prüft sie am echten Quelltext,
// tests/vanilla-mutation-dom.test.ts verfälscht den Quelltext und prüft, dass jede Aussage kippt). Läuft unter jsdom.
import { bodyOf, cssSection, rulesOf, type Rules } from './mutation';

type ThemeMod = {
  parseTheme: (v: unknown) => string | null;
  resolveTheme: (m: unknown, dark: boolean) => string;
  nextTheme: (m: unknown, dark: boolean) => string;
  readTheme: (s: unknown, k?: string) => string | null;
  writeTheme: (s: unknown, m: string, k?: string) => boolean;
  initTheme: (b: HTMLElement, o?: Record<string, unknown>) => { destroy(): void; getMode(): string; setMode(m: string): void };
  themeBootScript: (o?: Record<string, unknown>) => string;
};

const html = document.documentElement;
const mk = (attrs = '') => {
  document.body.replaceChildren(document.createRange().createContextualFragment(`<button id="b" ${attrs}></button>`));
  return document.getElementById('b') as HTMLButtonElement;
};

export async function themeLogicRules(mod: ThemeMod): Promise<Rules> {
  const out: Rules = {};
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
  let dark = false;
  let listeners: Array<() => void> = [];
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      get matches() { return q.includes('dark') ? dark : false; },
      media: q,
      addEventListener: (t: string, fn: () => void) => { if (t === 'change') listeners.push(fn); },
      removeEventListener: (_t: string, fn: () => void) => { listeners = listeners.filter((l) => l !== fn); },
    }),
  });
  const reset = () => {
    dark = false;
    listeners = [];
    html.removeAttribute('data-theme');
    html.removeAttribute('data-x');
    localStorage.clear();
    document.body.replaceChildren();
  };
  const rule = (name: string, fn: () => unknown) => {
    reset();
    let ok = false;
    try {
      ok = fn() === true;
    } catch {
      ok = false;
    }
    out[name] = ok;
    reset();
  };
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  const boot = (script: string, stored: string | null | 'wirft') => {
    html.removeAttribute('data-theme');
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { if (stored === 'wirft') throw new Error('x'); return { getItem: () => stored }; } });
    try {
      new Function(script)();
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original);
    }
    return html.getAttribute('data-theme');
  };
  try {
    rule('Theme: nur light, dark und system sind Modi', () => ['light', 'dark', 'system'].every((m) => mod.parseTheme(m) === m) && ['Dark', 'auto', '', null, 1].every((v) => mod.parseTheme(v) === null));
    rule('Theme: system folgt der Systemeinstellung', () => mod.resolveTheme('system', true) === 'dark' && mod.resolveTheme('system', false) === 'light' && mod.resolveTheme('light', true) === 'light' && mod.resolveTheme('dark', false) === 'dark' && mod.resolveTheme('x', true) === 'dark');
    rule('Theme: der Klick wechselt den tatsächlichen Zustand', () => mod.nextTheme('light', false) === 'dark' && mod.nextTheme('dark', true) === 'light' && mod.nextTheme('system', true) === 'light' && mod.nextTheme('system', false) === 'dark');
    rule('Theme: blockierter Speicher bleibt ohne Fehler', () => mod.readTheme(broken) === null && mod.writeTheme(broken, 'dark') === false && mod.writeTheme(broken, 'system') === false && mod.readTheme(null) === null);
    rule('Theme: Speicher kennt den Schlüssel dss-theme und system löscht ihn', () => {
      const b = mk();
      const h = mod.initTheme(b);
      b.click();
      const set = localStorage.getItem('dss-theme') === 'dark';
      h.setMode('system');
      const cleared = localStorage.getItem('dss-theme') === null;
      h.destroy();
      return set && cleared;
    });
    rule('Theme: ein ungültiger gemerkter Wert gilt als system', () => {
      localStorage.setItem('dss-theme', 'lila');
      const h = mod.initTheme(mk());
      const ok = h.getMode() === 'system' && !html.hasAttribute('data-theme');
      h.destroy();
      return ok;
    });
    rule('Theme: Klick setzt Attribut, aria-pressed und Zustand', () => {
      const b = mk();
      const h = mod.initTheme(b);
      const start = b.getAttribute('aria-pressed') === 'false' && b.getAttribute('data-theme-state') === 'light';
      b.click();
      const on = html.getAttribute('data-theme') === 'dark' && b.getAttribute('aria-pressed') === 'true' && b.getAttribute('data-theme-state') === 'dark';
      b.click();
      const off = html.getAttribute('data-theme') === 'light' && b.getAttribute('aria-pressed') === 'false';
      h.destroy();
      return start && on && off;
    });
    rule('Theme: feste Beschriftung „Dunkelmodus“, auch nach dem Umschalten', () => {
      const b = mk();
      const h = mod.initTheme(b);
      const first = b.getAttribute('aria-label');
      b.click();
      const ok = first === 'Dunkelmodus' && b.getAttribute('aria-label') === 'Dunkelmodus';
      h.destroy();
      return ok;
    });
    rule('Theme: ein Button mit eigenem Text behält seinen Namen', () => {
      const b = mk();
      b.textContent = 'Dunkler Modus';
      const h = mod.initTheme(b);
      const ok = !b.hasAttribute('aria-label');
      h.destroy();
      return ok;
    });
    rule('Theme: system setzt kein Attribut, auch bei dunklem System', () => {
      dark = true;
      const b = mk();
      const h = mod.initTheme(b);
      const ok = !html.hasAttribute('data-theme') && b.getAttribute('aria-pressed') === 'true';
      h.destroy();
      return ok;
    });
    rule('Theme: Änderungen der Systemeinstellung werden gehört (nur im Modus system)', () => {
      const b = mk();
      let calls = 0;
      const h = mod.initTheme(b, { onChange: () => { calls += 1; } });
      dark = true;
      listeners.slice().forEach((fn) => fn());
      const followed = b.getAttribute('aria-pressed') === 'true' && calls === 1;
      h.setMode('light');
      calls = 0;
      dark = false;
      listeners.slice().forEach((fn) => fn());
      dark = true;
      listeners.slice().forEach((fn) => fn());
      const fixed = b.getAttribute('aria-pressed') === 'false' && calls === 0;
      h.destroy();
      return followed && fixed;
    });
    rule('Theme: Symbole sind aria-hidden-SVG, eigene Symbole bleiben', () => {
      const b = mk();
      const h = mod.initTheme(b);
      const icons = [...b.querySelectorAll('svg')];
      const ok = icons.length === 2 && icons.every((i) => i.namespaceURI === 'http://www.w3.org/2000/svg' && i.getAttribute('aria-hidden') === 'true') && icons[0].classList.contains('dss-theme-icon--sun') && icons[1].classList.contains('dss-theme-icon--moon');
      h.destroy();
      const own = mk();
      own.append(Object.assign(document.createElement('span'), { className: 'dss-theme-icon' }));
      const h2 = mod.initTheme(own);
      const kept = own.querySelectorAll('svg').length === 0;
      h2.destroy();
      return ok && kept;
    });
    rule('Theme: ein anderer Tab ändert die Wahl', () => {
      const h = mod.initTheme(mk());
      localStorage.setItem('dss-theme', 'dark');
      window.dispatchEvent(new StorageEvent('storage', { key: 'dss-theme' }));
      const ok = html.getAttribute('data-theme') === 'dark';
      h.destroy();
      return ok;
    });
    rule('Theme: destroy entfernt Listener und Ergänzungen', () => {
      const b = mk('class="dss-btn"');
      const before = b.outerHTML;
      const h = mod.initTheme(b);
      h.destroy();
      b.click();
      return b.outerHTML === before && !html.hasAttribute('data-theme');
    });
    rule('Theme: ein zweiter Aufruf ersetzt den ersten', () => {
      const b = mk();
      mod.initTheme(b);
      const h = mod.initTheme(b);
      b.click();
      const ok = html.getAttribute('data-theme') === 'dark' && b.querySelectorAll('svg').length === 2 && listeners.length === 1;
      h.destroy();
      return ok;
    });
    rule('Theme: ein ungültiger Attributname fällt auf data-theme zurück', () => {
      const b = mk();
      const h = mod.initTheme(b, { attribute: 'x y', mode: 'dark' });
      const ok = html.getAttribute('data-theme') === 'dark';
      h.destroy();
      return ok;
    });
    rule('Theme: defaultMode gilt ohne gemerkte Wahl', () => {
      const h = mod.initTheme(mk(), { defaultMode: 'dark' });
      const ok = h.getMode() === 'dark' && html.getAttribute('data-theme') === 'dark';
      h.destroy();
      return ok;
    });
    rule('Theme: die gemerkte Wahl gewinnt gegen defaultMode', () => {
      localStorage.setItem('dss-theme', 'light');
      const h = mod.initTheme(mk(), { defaultMode: 'dark' });
      const ok = h.getMode() === 'light';
      h.destroy();
      return ok;
    });
    rule('Theme: die Wahl „System“ wird bei defaultMode dark gemerkt', () => {
      const h = mod.initTheme(mk(), { defaultMode: 'dark' });
      h.setMode('system');
      const kept = localStorage.getItem('dss-theme') === 'system';
      h.destroy();
      const h2 = mod.initTheme(mk(), { defaultMode: 'dark' });
      const ok = kept && h2.getMode() === 'system' && !html.hasAttribute('data-theme');
      h2.destroy();
      return ok;
    });
    rule('Theme: mehrere Umschalter teilen den Modus', () => {
      document.body.replaceChildren(document.createRange().createContextualFragment('<button id="b1"></button><button id="b2"></button>'));
      const b1 = document.getElementById('b1') as HTMLButtonElement;
      const b2 = document.getElementById('b2') as HTMLButtonElement;
      const h1 = mod.initTheme(b1);
      const h2 = mod.initTheme(b2);
      b1.click();
      const ok = b2.getAttribute('aria-pressed') === 'true' && h2.getMode() === 'dark';
      h1.destroy();
      h2.destroy();
      return ok;
    });
    rule('Boot: eine gemerkte Wahl „system“ bleibt ohne Attribut, auch bei defaultMode dark', () => boot(mod.themeBootScript({ defaultMode: 'dark' }), 'system') === null);
    rule('Boot: setzt die gemerkte Wahl', () => boot(mod.themeBootScript(), 'dark') === 'dark' && boot(mod.themeBootScript(), 'light') === 'light');
    rule('Boot: system, ungültig und leer setzen nichts', () => ['system', 'lila', '', null].every((v) => boot(mod.themeBootScript(), v) === null));
    rule('Boot: blockierter Speicher wirft nicht und defaultMode gilt', () => boot(mod.themeBootScript({ defaultMode: 'dark' }), 'wirft') === 'dark' && boot(mod.themeBootScript(), 'wirft') === null);
    rule('Boot: die gemerkte Wahl gewinnt gegen defaultMode', () => boot(mod.themeBootScript({ defaultMode: 'dark' }), 'light') === 'light');
    rule('Boot: Schlüssel und Attribut sind konfigurierbar und maskiert', () => {
      const evil = '"</script><script>window.__pwn=1</script> \\';
      const s = mod.themeBootScript({ storageKey: evil });
      return !/<\/?script/i.test(s) && !s.includes(' ') && mod.themeBootScript({ attribute: 'data-x' }).includes('"data-x"') && mod.themeBootScript({ attribute: 'x"; alert(1); "' }).includes('"data-theme"');
    });
    rule('Boot: kurz und ohne let, const, Pfeilfunktion', () => {
      const s = mod.themeBootScript();
      return s.length < 300 && !/\b(let|const)\b|=>/.test(s);
    });
  } finally {
    reset();
    if (original) Object.defineProperty(window, 'matchMedia', original);
    else delete (window as unknown as { matchMedia?: unknown }).matchMedia;
  }
  return out;
}

export function themeCssRules(css: string): Rules {
  const text = cssSection(css, 'Dunkelmodus-Umschalter');
  const rules = rulesOf(text);
  const sun = bodyOf(rules, '.dss-theme-toggle[data-theme-state="dark"] .dss-theme-icon--sun, .dss-theme-toggle:not([data-theme-state="dark"]) .dss-theme-icon--moon');
  return {
    'Abschnitt vorhanden': text.length > 200,
    'CSS: Symbole wechseln über den Zustand (Mond im Dunkelmodus, Sonne sonst)': /display:\s*none/.test(sun),
    'CSS: Symbolgröße 20 px': /width:\s*20px/.test(bodyOf(rules, '.dss-theme-toggle .dss-theme-icon')) && /height:\s*20px/.test(bodyOf(rules, '.dss-theme-toggle .dss-theme-icon')),
    'CSS: gedrückt zeigt die Auswahlfläche': /background:\s*var\(--dss-selected-bg\)/.test(bodyOf(rules, '.dss-theme-toggle[aria-pressed="true"]')),
    'CSS: kein festes Hex': !/#[0-9a-fA-F]{3,8}\b/.test(text),
  };
}

export function themeSourceRules(src: string): Rules {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return {
    'Quelltext: kein innerHTML, kein Inline-onclick, kein eval': !/innerHTML|outerHTML|insertAdjacentHTML|document\.write|onclick|eval\(|new Function/.test(code),
    'Quelltext: kein globaler Zustand': !/\bwindow\.\w+\s*=/.test(code) && !/\bglobalThis\.\w+\s*=/.test(code),
    'Quelltext: Speicherzugriff nur in try': /try \{\s*storage = opts\.storage \?\? win\.localStorage;/.test(code) && /try \{\s*return parseTheme\(storage\?\.getItem\(key\)\);/.test(code),
    'Quelltext: Lebenszyklus über js/lifecycle.js': code.includes("from './lifecycle.js'"),
    'Quelltext: Standardschlüssel dss-theme': code.includes("export const THEME_KEY = 'dss-theme';"),
  };
}
