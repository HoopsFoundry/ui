// Regeln für initAll (js/vanilla-core.js): tests/vanilla-core.test.ts prüft sie am echten Quelltext, tests/vanilla-mutation-dom.test.ts verfälscht ihn.
import type { Rules } from './mutation';

type Core = { initAll: (scope?: ParentNode | null, o?: Record<string, unknown>) => { destroy(): void; count: number }; parseOptions: (t: unknown) => Record<string, unknown> };

const ACC = (id: string) => `<div class="dss-acc" data-dss="accordion"><details class="dss-acc-item" id="${id}"><summary class="dss-acc-trigger"><span class="dss-acc-label">${id}</span></summary><div class="dss-acc-panel">x</div></details></div>`;
const PAGE = (n: string) => `<main data-dss="pagenav" data-dss-options='{"label":"Nav ${n}"}'><h2>A${n}</h2><h2>B${n}</h2><h2>C${n}</h2></main>`;
export const MANY = `${ACC('e1')}${ACC('e2')}${PAGE('1')}${PAGE('2')}<button id="t1" data-dss="theme"></button><button id="t2" data-dss="theme"></button><div id="h1" data-dss="backtop"></div><div id="h2" data-dss="backtop"></div>`;

export function coreRules(mod: Core): Rules {
  const safe = (fn: () => unknown) => { try { return fn() === true; } catch { return false; } };
  const out: Rules = {};
  const run = (name: string, fn: (api: { destroy(): void; count: number }) => unknown, options: Record<string, unknown> = {}) => {
    document.body.replaceChildren(document.createRange().createContextualFragment(MANY));
    const win = window as unknown as { scrollTo: unknown };
    const scrollTo = win.scrollTo;
    win.scrollTo = () => {};
    let api: { destroy(): void; count: number } | undefined;
    try {
      out[name] = safe(() => { api = mod.initAll(document, { accordion: { syncHash: false, expandAll: true }, ...options }); return fn(api); });
    } finally {
      api?.destroy();
      win.scrollTo = scrollTo;
      document.body.replaceChildren();
      document.documentElement.removeAttribute('data-theme');
    }
  };
  run('initAll: jedes Element eines Bausteins wird gestartet', (api) => api.count === 8
    && document.querySelectorAll('.dss-acc-bar').length === 2
    && document.querySelectorAll('nav.dss-pagenav').length === 2
    && document.querySelectorAll('button[aria-pressed]').length === 2
    && document.querySelectorAll('button.dss-backtop').length === 2);
  run('initAll: jedes Element bekommt seine eigenen Optionen', () => [...document.querySelectorAll('.dss-pagenav .dss-eyebrow')].map((e) => e.textContent).join() === 'Nav 1,Nav 2');
  run('initAll: destroy baut alle Elemente ab', (api) => {
    api.destroy();
    return document.querySelectorAll('.dss-acc-bar, nav.dss-pagenav, button.dss-backtop, button[aria-pressed]').length === 0;
  });
  out['initAll: ohne data-dss nichts'] = safe(() => { document.body.replaceChildren(document.createRange().createContextualFragment('<div><main><h2>A</h2></main></div>')); const h = mod.initAll(document); const ok = h.count === 0; h.destroy(); document.body.replaceChildren(); return ok; });
  return out;
}
