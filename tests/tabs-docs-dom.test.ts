// Das Vanilla-Markup der Tabs-Doku läuft mit initAll in jsdom: Leisten, Panels, Filter, Ereignis, destroy.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAll } from '../js/vanilla-core.js';
import { barMarkup, filterMarkup, registerMarkup, vanilla } from '../stories/Tabs.code';
import { keydown, mountHtml } from './helpers/tabs-markup';

let handle: { destroy(): void; count: number } | undefined;
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn() as never;
});
afterEach(() => {
  handle?.destroy();
  document.body.replaceChildren();
});
const el = (id: string) => document.getElementById(id)!;
const visible = (id: string) => !el(id).hidden && !el(id).hasAttribute('inert');

describe('Vanilla-Beispiele der Tabs-Doku', () => {
  it('Hauptbeispiel: Pfeil rechts wählt die Aufstellung, der gesperrte Boxscore wird übersprungen', () => {
    mountHtml(barMarkup);
    handle = initAll(document);
    expect(handle.count).toBe(1);
    expect(visible('spiel-uebersicht-panel')).toBe(true);
    keydown(el('spiel-uebersicht'), 'ArrowRight');
    expect(visible('spiel-aufstellung-panel')).toBe(true);
    expect(visible('spiel-uebersicht-panel')).toBe(false);
    keydown(el('spiel-aufstellung'), 'ArrowRight');
    expect(el('spiel-uebersicht').getAttribute('aria-selected')).toBe('true');
    expect(visible('spiel-boxscore-panel')).toBe(false);
  });
  it('Register: beide Leisten arbeiten unabhängig (Alle/Heim/Auswärts, Liga/Pokal)', () => {
    mountHtml(registerMarkup);
    handle = initAll(document);
    expect(handle.count).toBe(2);
    keydown(el('ort-alle'), 'End');
    expect(visible('ort-auswaerts-panel')).toBe(true);
    expect(visible('wb-liga-panel')).toBe(true);
    el('wb-pokal').click();
    expect(visible('wb-pokal-panel')).toBe(true);
    expect(visible('ort-auswaerts-panel')).toBe(true);
    expect(el('wb-pokal').getAttribute('tabindex')).toBe('0');
  });
  it('Filter: Klick schaltet um, hoops:tabchange meldet alle gedrückten', () => {
    mountHtml(filterMarkup);
    handle = initAll(document);
    const seen: string[][] = [];
    document.addEventListener('hoops:tabchange', (e) => seen.push((e as CustomEvent).detail.ids));
    el('f-b').click();
    el('f-a').click();
    expect(seen).toEqual([['f-a', 'f-b', 'f-c'], ['f-b', 'f-c']]);
    expect(el('f-a').getAttribute('aria-pressed')).toBe('false');
  });
  it('destroy stellt jedes Beispiel wieder her', () => {
    for (const markup of [barMarkup, registerMarkup, filterMarkup]) {
      mountHtml(markup);
      const before = document.body.innerHTML;
      const h = initAll(document);
      keydown(document.querySelector('[role="tab"], button')!, 'ArrowRight');
      h.destroy();
      expect(document.body.innerHTML).toBe(before);
    }
  });
  it('das Code-Beispiel ruft die Funktionen mit vorhandenen Optionen auf', () => {
    for (const option of ['activation', 'hash', 'onChange', 'select', 'getValue', 'destroy']) expect(vanilla).toContain(option);
    expect(vanilla).toContain("activation: 'auto'");
  });
});
