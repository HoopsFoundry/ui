// @vitest-environment jsdom
// Svelte-Verhalten einklappbarer Rahmen (Svelte 5, mount + flushSync): Öffnen, bind:open, Gruppe, Anker, Tastatur, Ebenen.
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Host from './helpers/FramesHost.svelte';

let target: HTMLElement;
let instance: Record<string, unknown>;
const start = (props: Record<string, unknown> = {}, hash = '') => {
  window.history.replaceState(null, '', hash ? `/${hash}` : '/');
  target = document.createElement('div');
  document.body.replaceChildren(target);
  instance = mount(Host, { target, props });
  flushSync();
};
afterEach(() => {
  void unmount(instance);
  window.history.replaceState(null, '', '/');
});
const wait = async () => {
  await new Promise((r) => setTimeout(r, 0));
  flushSync();
};
const trig = (id: string) => target.querySelector<HTMLButtonElement>(`[id="${id}-trigger"]`)!;
const isOpen = (id: string) => trig(id).getAttribute('aria-expanded') === 'true';
const click = (el: Element) => {
  (el as HTMLElement).click();
  flushSync();
};
const key = (el: Element, k: string) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  flushSync();
};
const api = () => instance as unknown as { get: () => { openT: boolean }; set: (v: boolean) => void };

describe('einzelne Rahmen', () => {
  it('Kopf: Überschrift mit Button; geschlossen hidden und inert; Klick öffnet und schließt, Anker folgt', () => {
    start({ grouped: false });
    expect(trig('t1').parentElement!.tagName).toBe('H3');
    expect(trig('t1').getAttribute('aria-controls')).toBe('t1-panel');
    const panel = target.querySelector<HTMLElement>('[id="t1-panel"]')!;
    expect(panel.hasAttribute('hidden')).toBe(true);
    click(trig('t1'));
    expect(isOpen('t1')).toBe(true);
    expect(panel.hasAttribute('hidden')).toBe(false);
    expect(window.location.hash).toBe('#t1');
    click(trig('t1'));
    expect(window.location.hash).toBe('');
  });
  it('bind:open: Klick ändert den Wert der Eltern, der Wert der Eltern öffnet den Rahmen', () => {
    start({ grouped: false });
    expect(api().get().openT).toBe(false);
    click(trig('t1'));
    expect(api().get().openT).toBe(true);
    api().set(false);
    flushSync();
    expect(isOpen('t1')).toBe(false);
    api().set(true);
    flushSync();
    expect(isOpen('t1')).toBe(true);
  });
  it('Anker beim Laden und bei hashchange', async () => {
    start({ grouped: false, syncHash: true }, '#t5');
    await wait();
    expect(isOpen('t5')).toBe(true);
    window.history.replaceState(null, '', '/#t2');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    flushSync();
    expect(isOpen('t2')).toBe(true);
  });
  it('ohne id: kein id-Attribut, kein Anker, ids verbunden', () => {
    start({ grouped: false });
    const t = [...target.querySelectorAll<HTMLButtonElement>('.dss-acc-trigger')].find((b) => b.textContent!.includes('Vier ohne id'))!;
    click(t);
    expect(window.location.hash).toBe('');
    expect(t.getAttribute('aria-expanded')).toBe('true');
    expect(target.ownerDocument.getElementById(t.getAttribute('aria-controls')!)).not.toBeNull();
    expect(t.closest('.is-collapsible')!.hasAttribute('id')).toBe(false);
  });
});

describe('in einer Accordion-Gruppe', () => {
  it('Sprungleiste: nur Rahmen und Bereiche mit id; Klick öffnet und fokussiert den Kopf', async () => {
    start({ nav: true });
    await wait();
    expect([...target.querySelectorAll('.dss-acc-nav-link')].map((a) => a.textContent)).toEqual(['Eins', 'Zwei', 'Drei', 'Fünf']);
    click(target.querySelector('a[href="#t2"]')!);
    await wait();
    expect(isOpen('t2')).toBe(true);
    expect(document.activeElement).toBe(trig('t2'));
  });
  it('Alle öffnen / schließen, auch der Rahmen ohne id', async () => {
    start({ expandAll: true });
    await wait();
    const buttons = [...target.querySelectorAll<HTMLButtonElement>('.dss-acc-bar button')];
    click(buttons[0]);
    expect([...target.querySelectorAll('.dss-acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);
    expect(api().get().openT).toBe(true);
    click(buttons[1]);
    expect([...target.querySelectorAll('.dss-acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });
  it('exclusive schließt die anderen, auch den AccordionItem', async () => {
    start({ exclusive: true });
    await wait();
    click(trig('t3'));
    click(trig('t1'));
    expect(isOpen('t3')).toBe(false);
    expect(isOpen('t1')).toBe(true);
    click(trig('t2'));
    expect(isOpen('t1')).toBe(false);
    expect(api().get().openT).toBe(false);
  });
  it('Tastatur zwischen Köpfen', async () => {
    start({});
    await wait();
    const heads = [...target.querySelectorAll<HTMLButtonElement>('.dss-acc-trigger')];
    heads[0].focus();
    key(heads[0], 'ArrowDown');
    expect(document.activeElement).toBe(heads[1]);
    key(heads[1], 'End');
    expect(document.activeElement).toBe(heads[heads.length - 1]);
    key(heads[heads.length - 1], 'Home');
    expect(document.activeElement).toBe(heads[0]);
  });
  it('titleAs der Gruppe und HeadingLevel', async () => {
    start({ titleAs: 'h4' });
    expect(trig('t1').parentElement!.tagName).toBe('H4');
    void unmount(instance);
    start({ level: 2 });
    expect(trig('t1').parentElement!.tagName).toBe('H2');
  });
  it('Inhalt bekommt Titelebene + 1', async () => {
    start({ grouped: false, level: 2 });
    click(trig('t1'));
    expect(target.querySelector('[id="t1-panel"] h3')).not.toBeNull();
  });
  it('Anker auf einen Rahmen öffnet ihn in der Gruppe (syncHash)', async () => {
    start({ syncHash: true }, '#t2');
    await wait();
    expect(isOpen('t2')).toBe(true);
  });
});
