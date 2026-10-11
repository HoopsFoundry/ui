// @vitest-environment jsdom
// Svelte-Verhalten (Svelte 5, mount + flushSync): Öffnen, bind:open, exclusive, Alle öffnen, Hash, Tastatur, Nav, Ebenen und deren Reaktivität.
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Host from './helpers/AccordionHost.svelte';
import SsrHost from './helpers/AccordionSsr.svelte';

type Api = { set: (values: Record<string, unknown>) => void; get: () => { openA: boolean } };
let target: HTMLElement;
let instance: Record<string, unknown>;
const api = () => instance as unknown as Api;

const start = (initial: Record<string, unknown> = {}) => {
  window.history.replaceState(null, '', '/');
  target = document.createElement('div');
  document.body.replaceChildren(target);
  instance = mount(Host, { target });
  flushSync();
  if (Object.keys(initial).length) set(initial);
};
const set = (values: Record<string, unknown>) => {
  api().set(values);
  flushSync();
};
const trigger = (id: string) => target.querySelector<HTMLButtonElement>(`[id="${id}-trigger"]`)!;
const panel = (id: string) => target.querySelector<HTMLElement>(`[id="${id}-panel"]`)!;
// jsdom kennt die Eigenschaft `inert` nicht: Svelte setzt dort eine einfache Eigenschaft, Browser das Attribut
const inert = (el: HTMLElement) => el.hasAttribute('inert') || (el as unknown as { inert?: boolean }).inert === true;
const isOpen = (id: string) => trigger(id).getAttribute('aria-expanded') === 'true';
const click = (el: Element) => {
  (el as HTMLElement).click();
  flushSync();
};
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  flushSync();
  return event;
};
const wait = async () => {
  await new Promise((r) => setTimeout(r, 0));
  flushSync();
};
const tag = (id: string) => target.querySelector(`[id="${id}"] > .dss-acc-title`)!.tagName.toLowerCase();

beforeEach(() => start());
afterEach(() => {
  void unmount(instance);
  window.history.replaceState(null, '', '/');
});

describe('Svelte Accordion: Öffnen und bind:open', () => {
  it('Klick öffnet und schließt (aria-expanded, hidden, inert, is-open)', () => {
    expect(isOpen('a')).toBe(false);
    expect(panel('a').hasAttribute('hidden')).toBe(true);
    expect(inert(panel('a'))).toBe(true);
    click(trigger('a'));
    expect(isOpen('a')).toBe(true);
    expect(panel('a').hasAttribute('hidden')).toBe(false);
    expect(inert(panel('a'))).toBe(false);
    expect(target.querySelector('[id="a"]')!.classList.contains('is-open')).toBe(true);
    click(trigger('a'));
    expect(isOpen('a')).toBe(false);
  });
  it('bind:open gibt den Zustand nach außen und nimmt ihn von außen an', () => {
    click(trigger('a'));
    expect(api().get().openA).toBe(true);
    set({ openA: false });
    expect(isOpen('a')).toBe(false);
    set({ openA: true });
    expect(isOpen('a')).toBe(true);
    expect(inert(panel('a'))).toBe(false);
  });
  it('ein gesperrter Bereich öffnet nicht; Freigeben macht ihn bedienbar', () => {
    click(trigger('b'));
    expect(isOpen('b')).toBe(false);
    expect(trigger('b').getAttribute('aria-disabled')).toBe('true');
    set({ lockB: false });
    expect(trigger('b').hasAttribute('aria-disabled')).toBe(false);
    click(trigger('b'));
    expect(isOpen('b')).toBe(true);
  });
  it('Zusatzinfo steht im Kopf, einmal; ohne meta entfällt sie', () => {
    expect(trigger('a').querySelector('.dss-acc-meta')!.textContent).toBe('14 Spieler');
    expect(trigger('a').querySelector('.dss-acc-label')!.textContent).toBe('Tabelle,');
    set({ metaOn: false });
    expect(trigger('a').querySelector('.dss-acc-meta')).toBeNull();
  });
  it('Überschrift enthält den Button, der Pfeil ist aria-hidden', () => {
    expect(target.querySelector('h3.dss-acc-title > button.dss-acc-trigger')).toBe(trigger('a'));
    expect(trigger('a').querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Svelte Accordion: exclusive', () => {
  it('ein Öffnen schließt die anderen; zur Laufzeit umschaltbar', () => {
    set({ lockB: false });
    click(trigger('a'));
    click(trigger('b'));
    expect([isOpen('a'), isOpen('b')]).toEqual([true, true]);
    set({ exclusive: true });
    click(trigger('a')); // schließt a
    click(trigger('a')); // öffnet a und schließt b
    expect([isOpen('a'), isOpen('b')]).toEqual([true, false]);
    expect(api().get().openA).toBe(true);
    click(trigger('c'));
    expect([isOpen('a'), isOpen('c')]).toEqual([false, true]);
    expect(api().get().openA).toBe(false);
  });
});

describe('Svelte Accordion: Alle öffnen / schließen', () => {
  it('erscheint nach dem Anmelden, öffnet alle (gesperrte nicht), sagt an, schließt', async () => {
    set({ expandAll: true });
    await wait();
    const buttons = [...target.querySelectorAll<HTMLButtonElement>('.dss-acc-bar button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Alle öffnen', 'Alle schließen']);
    click(buttons[0]);
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([true, false, true]);
    expect(target.querySelector('.dss-acc-bar [aria-live="polite"]')!.textContent).toBe('2 von 3 Bereichen geöffnet');
    click(buttons[1]);
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([false, false, false]);
    expect(target.querySelector('.dss-acc-bar [aria-live="polite"]')!.textContent).toBe('Alle Bereiche geschlossen');
  });
  it('bei exclusive nicht angeboten', async () => {
    set({ expandAll: true, exclusive: true });
    await wait();
    expect(target.querySelector('.dss-acc-bar')).toBeNull();
  });
});

describe('Svelte Accordion: Deep-Link', () => {
  it('öffnet beim Laden den Bereich samt Eltern', async () => {
    void unmount(instance);
    window.history.replaceState(null, '', '/#c2');
    target = document.createElement('div');
    document.body.replaceChildren(target);
    instance = mount(Host, { target });
    flushSync();
    set({ syncHash: true });
    await wait();
    expect(isOpen('c2')).toBe(true);
    expect(isOpen('c')).toBe(true);
    expect(isOpen('c1')).toBe(false);
  });
  it('reagiert auf hashchange', async () => {
    set({ syncHash: true });
    await wait();
    window.location.hash = '#c1';
    await wait();
    await wait();
    expect(isOpen('c1')).toBe(true);
    expect(isOpen('c')).toBe(true);
  });
  it('Klick setzt den Anker, Schließen entfernt ihn; syncHash=false schreibt nichts', async () => {
    click(trigger('a'));
    expect(window.location.hash).toBe('');
    set({ syncHash: true });
    await wait();
    click(trigger('a'));
    expect(window.location.hash).toBe('');
    click(trigger('a'));
    expect(window.location.hash).toBe('#a');
    click(trigger('a'));
    expect(window.location.hash).toBe('');
  });
});

describe('Svelte Accordion: Tastatur', () => {
  it('Pfeile, Home, End; gesperrte übersprungen; Strg lässt es dem Browser', () => {
    trigger('a').focus();
    expect(key(trigger('a'), 'ArrowDown').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(trigger('c'));
    key(trigger('c'), 'ArrowDown');
    expect(document.activeElement).toBe(trigger('c'));
    key(trigger('c'), 'Home');
    expect(document.activeElement).toBe(trigger('a'));
    key(trigger('a'), 'End');
    expect(document.activeElement).toBe(trigger('c'));
    expect(key(trigger('c'), 'ArrowUp', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key(trigger('c'), 'Enter').defaultPrevented).toBe(false);
  });
  it('verschachtelte Köpfe bleiben in ihrer Gruppe', () => {
    click(trigger('c'));
    trigger('c1').focus();
    key(trigger('c1'), 'End');
    expect(document.activeElement).toBe(trigger('c2'));
    key(trigger('c2'), 'ArrowDown');
    expect(document.activeElement).toBe(trigger('c2'));
  });
});

describe('Svelte Accordion: Sprungleiste', () => {
  it('Links in Dokumentreihenfolge, Klick öffnet, fokussiert und markiert', async () => {
    set({ nav: true });
    await wait();
    const nav = target.querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Bereiche');
    const links = [...nav.querySelectorAll('a')];
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([['Tabelle', '#a'], ['Spielplan', '#b'], ['Kader', '#c']]);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    links[2].dispatchEvent(event);
    flushSync();
    expect(event.defaultPrevented).toBe(true);
    expect(isOpen('c')).toBe(true);
    expect(document.activeElement).toBe(trigger('c'));
    expect(links[2].getAttribute('aria-current')).toBe('true');
  });
  it('der Schalter klappt die Liste', async () => {
    set({ nav: true });
    await wait();
    const toggle = target.querySelector<HTMLButtonElement>('.dss-acc-nav-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(target.querySelector('.dss-acc-nav')!.classList.contains('is-open')).toBe(true);
  });
  it('neue Bereiche erscheinen in der Sprungleiste, entfernte verschwinden', async () => {
    set({ nav: true });
    await wait();
    set({ extra: 2 });
    await wait();
    expect([...target.querySelectorAll('.dss-acc-nav-link')].map((l) => l.textContent)).toEqual(['Tabelle', 'Spielplan', 'Kader', 'Extra 0', 'Extra 1']);
    set({ extra: 0 });
    await wait();
    expect(target.querySelectorAll('.dss-acc-nav-link').length).toBe(3);
  });
});

describe('Svelte Accordion: Region nur bis 6 Bereiche', () => {
  it('3 Bereiche: Region; 7 Bereiche: keine Rolle; zurück: wieder Region', async () => {
    await wait();
    expect(panel('a').getAttribute('role')).toBe('region');
    expect(panel('a').getAttribute('aria-labelledby')).toBe('a-trigger');
    set({ extra: 4 });
    await wait();
    expect(panel('a').hasAttribute('role')).toBe(false);
    expect(panel('a').hasAttribute('aria-labelledby')).toBe(false);
    set({ extra: 0 });
    await wait();
    expect(panel('a').getAttribute('role')).toBe('region');
  });
});

describe('Svelte Accordion: Ebenen sind reaktiv', () => {
  it('Standard h3, Inhalt h4; verschachtelt h4 und Inhalt h5', () => {
    expect(['a', 'c'].map(tag)).toEqual(['h3', 'h3']);
    expect(target.querySelector('[id="c"] > .dss-acc-panel > .dss-acc-panel-inner .dss-empty-title')!.tagName).toBe('H4');
    expect(tag('c1')).toBe('h4');
    expect(target.querySelector('[id="c1"] .dss-empty-title')!.tagName).toBe('H5');
  });
  it('titleAs der Gruppe, des Bereichs und HeadingLevel folgen zur Laufzeit', () => {
    set({ titleAs: 'h5' });
    expect(['a', 'b', 'c', 'c1'].map(tag)).toEqual(['h5', 'h5', 'h5', 'h6']);
    set({ itemAs: 'h2' });
    expect(tag('a')).toBe('h2');
    set({ titleAs: undefined, itemAs: undefined, level: 2 });
    expect(['a', 'c', 'c1'].map(tag)).toEqual(['h2', 'h2', 'h3']);
    set({ level: 4 });
    expect(['a', 'c', 'c1'].map(tag)).toEqual(['h4', 'h4', 'h5']);
    expect(target.querySelector('[id="c1"] .dss-empty-title')!.tagName).toBe('H6');
  });
  it('Variante und sticky als Klassen', () => {
    const root = target.querySelector('.dss-acc')!;
    expect(root.classList.contains('dss-acc--card')).toBe(true);
    set({ variant: 'flat', sticky: true });
    expect(root.classList.contains('dss-acc--flat')).toBe(true);
    expect(root.classList.contains('dss-acc--sticky')).toBe(true);
    expect(root.classList.contains('dss-acc--card')).toBe(false);
    expect(target.querySelectorAll('.dss-acc--nested').length).toBe(1);
  });
});

describe('Svelte Accordion: scrollt zum Deep-Link', () => {
  it('ruft scrollIntoView für den Bereich auf', async () => {
    const spy = vi.fn();
    Element.prototype.scrollIntoView = spy;
    set({ syncHash: true });
    await wait();
    window.location.hash = '#b';
    await wait();
    await new Promise((r) => setTimeout(r, 30));
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    // b ist gesperrt und öffnet nicht, scrollt aber zum Anker
    expect(spy).toHaveBeenCalled();
  });
});

describe('Svelte Accordion: exclusive beim Start', () => {
  const mountCfg = async (props: Record<string, unknown>) => {
    void unmount(instance);
    target = document.createElement('div');
    document.body.replaceChildren(target);
    instance = mount(SsrHost, {
      target,
      props: { cfg: { props: { syncHash: false, ...props }, items: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B', open: true }, { id: 'c', title: 'C', open: true }] } },
    });
    flushSync();
    await wait();
  };
  it('bleibt nur der erste offene Bereich offen', async () => {
    await mountCfg({ exclusive: true });
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([false, true, false]);
  });
  it('ohne exclusive bleiben beide offen', async () => {
    await mountCfg({});
    expect([isOpen('b'), isOpen('c')]).toEqual([true, true]);
  });
  it('wird exclusive später eingeschaltet, bleibt nur der erste offene', async () => {
    set({ lockB: false });
    click(trigger('a'));
    click(trigger('b'));
    click(trigger('c'));
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([true, true, true]);
    set({ exclusive: true });
    await wait();
    expect([isOpen('a'), isOpen('b'), isOpen('c')]).toEqual([true, false, false]);
    expect(api().get().openA).toBe(true);
  });
});

describe('Svelte Accordion: navLabel', () => {
  it('Standard „Bereiche“', async () => {
    set({ nav: true });
    await wait();
    expect(target.querySelector('nav')!.getAttribute('aria-label')).toBe('Bereiche');
    expect(target.querySelector('.dss-acc-nav-toggle')!.textContent).toBe('Bereiche');
  });
  it('navLabel setzt Navigation und Schalter', async () => {
    void unmount(instance);
    target = document.createElement('div');
    document.body.replaceChildren(target);
    instance = mount(SsrHost, { target, props: { cfg: { props: { syncHash: false, nav: true, navLabel: 'Bereiche der Liga-Seite' }, items: [{ id: 'a', title: 'A' }] } } });
    flushSync();
    await wait();
    expect(target.querySelector('nav')!.getAttribute('aria-label')).toBe('Bereiche der Liga-Seite');
    expect(target.querySelector('.dss-acc-nav-toggle')!.textContent).toBe('Bereiche der Liga-Seite');
  });
});
