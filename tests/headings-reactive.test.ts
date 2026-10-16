// @vitest-environment jsdom
// Svelte: Ebenen bleiben reaktiv (Svelte 5, mount + flushSync): ein inneres HeadingLevel mit by folgt dem äußeren level,
// titleAs-Wechsel und Modal-titleAs wirken sofort.
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Host from './helpers/ReactiveHost.svelte';

type Api = { set: (values: Record<string, unknown>) => void };
let target: HTMLElement;
let app: Api;
let instance: Record<string, unknown>;

beforeEach(() => {
  target = document.createElement('div');
  document.body.replaceChildren(target);
  instance = mount(Host, { target });
  app = instance as unknown as Api;
  flushSync();
});
afterEach(() => {
  void unmount(instance);
});

const set = (values: Record<string, unknown>) => {
  app.set(values);
  flushSync();
};
const tagsIn = (selector: string) => [...target.querySelectorAll(`${selector} :is(h1,h2,h3,h4,h5,h6)`)].map((h) => `${h.tagName.toLowerCase()}:${h.textContent!.trim()}`);
const innen = () => tagsIn('#innen');

describe('HeadingLevel in Svelte ist reaktiv', () => {
  it('Ausgangslage: level 3, inneres by=2 ergibt h5', () => {
    expect(target.querySelector('#direkt .hoops-empty-title')!.tagName).toBe('H3');
    expect(innen()).toEqual(['h5:innen', 'h5:Karte', 'h5:Team', 'h5:Tabelle']);
  });

  it('äußeres level 3 -> 5: inneres by=2 ergibt h6 (Obergrenze), alle Titelkomponenten folgen', () => {
    set({ outer: 5 });
    expect(innen()).toEqual(['h6:innen', 'h6:Karte', 'h6:Team', 'h6:Tabelle']);
    expect(target.querySelector('#direkt .hoops-empty-title')!.tagName).toBe('H5');
  });

  it('äußeres level nach unten: 3 -> 2 ergibt innen h4', () => {
    set({ outer: 2 });
    expect(innen()).toEqual(['h4:innen', 'h4:Karte', 'h4:Team', 'h4:Tabelle']);
    set({ outer: 3 });
    expect(innen()[0]).toBe('h5:innen');
  });

  it('inneres by ändert sich', () => {
    set({ inner: 1 });
    expect(innen()[0]).toBe('h4:innen');
    set({ inner: 0 });
    expect(innen()[0]).toBe('h3:innen');
  });

  it('level als Ziffern-Zeichenkette und ungültige Werte', () => {
    set({ outer: '4' });
    expect(innen()[0]).toBe('h6:innen');
    set({ outer: undefined });
    // ohne level zählt by vom Vorfahren aus: der äußere HeadingLevel hat dann by=1 ohne Vorfahr = 3, innen 3 + 2
    expect(innen()[0]).toBe('h5:innen');
  });

  it('titleAs-Wechsel wirkt sofort und gibt die Ebene wieder frei', () => {
    set({ titleAs: 'h2' });
    expect(innen()[0]).toBe('h2:innen');
    set({ titleAs: 'h6' });
    expect(innen()[0]).toBe('h6:innen');
    set({ titleAs: undefined });
    expect(innen()[0]).toBe('h5:innen');
  });

  it('Modal-titleAs-Wechsel: Titel und Ebene des Inhalts folgen', () => {
    expect(tagsIn('#modal')).toEqual(['h2:Modal', 'h3:im Modal']);
    set({ modalAs: 'h4' });
    expect(tagsIn('#modal')).toEqual(['h4:Modal', 'h5:im Modal']);
    set({ modalAs: 'h6' });
    expect(tagsIn('#modal')).toEqual(['h6:Modal', 'h6:im Modal']);
    set({ modalAs: undefined });
    expect(tagsIn('#modal')).toEqual(['h2:Modal', 'h3:im Modal']);
  });
});
