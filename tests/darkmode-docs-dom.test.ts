// Das Vanilla-Markup der Dark-Mode-Doku läuft mit initAll in jsdom: Umschalter, Symbole, Zustand, Aufräumen.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initAll } from '../js/vanilla-core.js';
import { buttonMarkup, vanilla } from '../stories/Foundation/DarkMode.code';

let handle: { destroy(): void; count: number } | undefined;
beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.body.replaceChildren(document.createRange().createContextualFragment(buttonMarkup));
});
afterEach(() => {
  handle?.destroy();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
});

describe('Vanilla-Beispiel der Dark-Mode-Doku', () => {
  it('initAll macht den leeren Button zum Umschalter', () => {
    handle = initAll(document);
    const b = document.querySelector('button')!;
    expect(handle.count).toBe(1);
    expect(b.hidden).toBe(false);
    expect(b.getAttribute('aria-label')).toBe('Dunkelmodus');
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(b.querySelectorAll('svg')).toHaveLength(2);
    b.click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('hoops-theme')).toBe('dark');
  });
  it('destroy stellt das Markup wieder her', () => {
    const before = document.body.innerHTML;
    handle = initAll(document);
    handle.destroy();
    expect(document.body.innerHTML).toBe(before);
  });
  it('das Code-Beispiel enthält das Markup', () => {
    expect(vanilla).toContain(buttonMarkup);
    expect(vanilla).toContain('<!doctype html>');
  });
});
