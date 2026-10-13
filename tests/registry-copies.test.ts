// Zwei Kopien desselben Bausteins (zwei Bündel, Bündel plus Einzelmodul) teilen sich das Register: ein zweites init ersetzt das erste.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadModule, read } from './helpers/mutation';
import { keydown, mountHtml, tabsMarkup } from './helpers/tabs-markup';
import { createRegistry } from '../js/lifecycle.js';

afterEach(() => {
  document.body.replaceChildren();
});

describe('Register über Kopien hinweg', () => {
  it('createRegistry(name): gleiche Namen teilen, verschiedene nicht, ohne Namen privat', () => {
    const a = createRegistry('x-test');
    const b = createRegistry('x-test');
    const c = createRegistry('y-test');
    const key = {};
    const destroy = vi.fn();
    a.claim(key, destroy);
    b.release(key);
    expect(destroy).toHaveBeenCalledTimes(1);
    const d = vi.fn();
    a.claim(key, d);
    c.release(key);
    createRegistry().release(key);
    expect(d).not.toHaveBeenCalled();
  });
  it('zwei geladene Kopien von tabs.js: ein Ereignis je Wechsel, die erste wird abgebaut', async () => {
    const source = read('js/tabs.js');
    // zwei verschiedene Module (verschiedener Text) mit je eigenem Modulzustand
    const first = (await loadModule(source)) as typeof import('../js/tabs.js');
    const second = (await loadModule(`${source}\n// zweite Kopie`)) as typeof import('../js/tabs.js');
    mountHtml(tabsMarkup());
    const bar = document.getElementById('r-bar')!;
    const h1 = first.initTabs(bar);
    const h2 = second.initTabs(bar);
    const spy = vi.fn();
    bar.addEventListener('dss:tabchange', spy);
    keydown(document.getElementById('r-alle')!, 'ArrowRight');
    expect(spy).toHaveBeenCalledTimes(1);
    h2.destroy();
    h1.destroy();
    keydown(document.getElementById('r-heim')!, 'ArrowRight');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
