// Regeln für initAll mit tabs und modal (mehrere Elemente je Baustein, Optionen je Element, only, destroy, nur das erste Element).
// tests/vanilla-core-v1b.test.ts prüft sie am echten Quelltext, tests/vanilla-mutation-v1b.test.ts verfälscht ihn.
import { trapErrors, type Rules } from './mutation';
import { tabsMarkup } from './tabs-markup';
import { dialogMarkup, divMarkup } from './modal-markup';

type Core = { initAll: (scope?: ParentNode | null, o?: Record<string, unknown>) => { destroy(): void; count: number } };
export const PAGE_V1B = `${tabsMarkup('', 'a')}${tabsMarkup('', 'b')}${divMarkup('m1')}${dialogMarkup('m2')}${divMarkup('m3')}`;

export function tabsModalCoreRules(mod: Core): Rules {
  const safe = (fn: () => unknown) => { try { return fn() === true; } catch { return false; } };
  const out: Rules = {};
  const key = (id: string, k: string) => document.getElementById(id)!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const click = (id: string) => document.getElementById(id)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  const run = (name: string, fn: (api: { destroy(): void; count: number }) => unknown, options: Record<string, unknown> = {}, html = PAGE_V1B) => {
    document.body.replaceChildren(document.createRange().createContextualFragment(html));
    let api: { destroy(): void; count: number } | undefined;
    const trap = trapErrors();
    try {
      out[name] = safe(() => { api = mod.initAll(document, options); return fn(api); });
    } finally {
      try {
        api?.destroy();
      } catch {
        // verfälschte Quelle
      }
      if (trap.stop().length) out[name] = false;
      document.body.replaceChildren();
      document.documentElement.removeAttribute('style');
    }
  };
  run('initAll: jede Tab-Leiste wird gestartet (nicht nur die erste)', (api) => api.count === 5
    && (key('a-alle', 'ArrowRight'), key('b-alle', 'ArrowRight'), true)
    && document.getElementById('a-heim')!.getAttribute('aria-selected') === 'true'
    && document.getElementById('b-heim')!.getAttribute('aria-selected') === 'true');
  run('initAll: jedes Modal wird gestartet (nicht nur das erste)', () => {
    click('m3-auf');
    const third = !(document.getElementById('m3') as HTMLElement).hidden;
    click('m3-abbr');
    click('m1-auf');
    const first = !(document.getElementById('m1') as HTMLElement).hidden;
    return third && first && (document.getElementById('m2') as HTMLElement).hasAttribute('open') === false;
  });
  run('initAll: Optionen je Leiste aus data-hoops-options', () => {
    key('x-alle', 'ArrowRight');
    key('y-alle', 'ArrowRight');
    return document.getElementById('x-heim')!.getAttribute('aria-selected') === 'false' && document.getElementById('y-heim')!.getAttribute('aria-selected') === 'true';
  }, {}, tabsMarkup(`data-hoops-options='{"activation":"manual"}'`, 'x') + tabsMarkup('', 'y'));
  run('initAll: tabs-Optionen aus options.tabs gelten für alle Leisten', () => {
    key('a-alle', 'ArrowRight');
    key('b-alle', 'ArrowRight');
    return document.getElementById('a-heim')!.getAttribute('aria-selected') === 'false' && document.getElementById('b-heim')!.getAttribute('aria-selected') === 'false';
  }, { tabs: { activation: 'manual' } });
  run('initAll: modal-Optionen aus options.modal (dismissOnBackdrop)', () => {
    click('m1-auf');
    const backdrop = document.querySelector('#m1 .hoops-backdrop')!;
    backdrop.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return (document.getElementById('m1') as HTMLElement).hidden === true;
  }, { modal: { dismissOnBackdrop: true } });
  run('initAll: only wählt tabs oder modal', (api) => api.count === 2, { only: ['tabs'] });
  run('initAll: only modal', (api) => api.count === 3, { only: ['modal'] });
  out['initAll: destroy baut alle Leisten und Modals ab'] = safe(() => {
    document.body.replaceChildren(document.createRange().createContextualFragment(PAGE_V1B));
    const before = document.body.innerHTML;
    const api = mod.initAll(document);
    key('a-alle', 'ArrowRight');
    click('m1-auf');
    api.destroy();
    const ok = document.body.innerHTML === before && !document.documentElement.hasAttribute('style');
    document.body.replaceChildren();
    return ok;
  });
  out['initAll: ein zweiter Aufruf ersetzt die Leisten (ein Ereignis je Wechsel)'] = safe(() => {
    document.body.replaceChildren(document.createRange().createContextualFragment(PAGE_V1B));
    let n = 0;
    const count = () => n++;
    document.addEventListener('hoops:tabchange', count);
    const first = mod.initAll(document);
    const second = mod.initAll(document);
    key('a-alle', 'ArrowRight');
    document.removeEventListener('hoops:tabchange', count);
    const ok = n === 1;
    first.destroy();
    second.destroy();
    document.body.replaceChildren();
    return ok;
  });
  return out;
}
