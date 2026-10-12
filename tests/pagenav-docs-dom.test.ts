// Das Vanilla-Markup der PageNav-Doku läuft mit initAll in jsdom: Navigation, Einträge, Ausnahmen, Knopf.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initAll } from '../js/vanilla-core.js';
import { pageMarkup, vanilla } from '../stories/PageNav.code';

let handle: { destroy(): void; count: number } | undefined;
beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn() as never;
  const body = pageMarkup;
  document.body.replaceChildren(document.createRange().createContextualFragment(body));
  document.body.setAttribute('data-dss', 'backtop');
});
afterEach(() => {
  handle?.destroy();
  document.body.removeAttribute('data-dss');
  document.body.replaceChildren();
});

describe('Vanilla-Beispiel der PageNav-Doku', () => {
  it('initAll baut die Navigation und den Knopf', () => {
    handle = initAll(document);
    expect(handle.count).toBe(2);
    const links = [...document.querySelectorAll('.dss-pagenav-link')].map((a) => a.textContent);
    expect(links).toEqual(['Tabelle', 'Spielplan', 'Kader', 'Kalender-Abo']);
    expect(document.querySelector('.dss-eyebrow')!.textContent).toBe('Auf dieser Seite');
    expect(document.querySelector('button.dss-backtop')).not.toBeNull();
  });
  it('data-pagenav-skip: das Impressum fehlt, die Überschrift bekommt keine id', () => {
    handle = initAll(document);
    const skipped = [...document.querySelectorAll('h2')].find((h) => h.textContent === 'Impressum')!;
    expect(skipped.id).toBe('');
    expect([...document.querySelectorAll('.dss-pagenav-link')].some((a) => a.textContent === 'Impressum')).toBe(false);
  });
  it('destroy stellt das Markup wieder her', () => {
    const before = document.body.innerHTML;
    handle = initAll(document);
    handle.destroy();
    expect(document.body.innerHTML).toBe(before);
  });
  it('das Code-Beispiel enthält das Markup und beide Wege (initAll, einzeln)', () => {
    expect(vanilla).toContain(pageMarkup);
    expect(vanilla).toContain("import { initAll } from '@bbv/dss-design-system/vanilla-core.js'");
    expect(vanilla).toContain("import { initPageNav } from '@bbv/dss-design-system/pagenav.js'");
    expect(vanilla).toContain("import { initBackToTop } from '@bbv/dss-design-system/backtop.js'");
  });
});
