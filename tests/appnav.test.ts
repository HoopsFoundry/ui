import { describe, it, expect, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { initAppNav } from '../js/appnav.js';

const MARKUP = `
<nav class="hoops-appnav hoops-appnav--light" data-hoops-appnav aria-label="Hauptnavigation">
  <div class="hoops-appnav-bar">
    <button type="button" class="hoops-appnav-toggle" data-appnav-toggle aria-expanded="false" aria-controls="n-list">Menü</button>
    <ul class="hoops-appnav-list" id="n-list">
      <li class="hoops-appnav-item">
        <button type="button" class="hoops-appnav-group-btn" data-appnav-group aria-expanded="false" aria-controls="n-g1">Vorbereiten</button>
        <ul class="hoops-appnav-panel" id="n-g1" hidden><li><a class="hoops-appnav-link" href="/teams">Teams</a></li></ul>
      </li>
      <li class="hoops-appnav-item">
        <button type="button" class="hoops-appnav-group-btn" data-appnav-group aria-expanded="false" aria-controls="n-g2">Ansehen</button>
        <ul class="hoops-appnav-panel" id="n-g2" hidden><li><a class="hoops-appnav-link" href="/zeitplan">Zeitplan</a></li></ul>
      </li>
    </ul>
  </div>
</nav>
<button type="button" id="outside">Außen</button>`;

let cleanup: () => void = () => {};

function mount() {
  const doc = new DOMParser().parseFromString(MARKUP, 'text/html');
  document.body.replaceChildren(...Array.from(doc.body.childNodes).map((node) => document.importNode(node, true)));
  const root = document.querySelector<HTMLElement>('[data-hoops-appnav]')!;
  cleanup = initAppNav(root);
  return {
    root,
    toggle: root.querySelector<HTMLButtonElement>('[data-appnav-toggle]')!,
    groups: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-appnav-group]')),
    panel: (id: string) => document.getElementById(id) as HTMLElement,
  };
}

afterEach(() => cleanup());

describe('js/appnav.js', () => {
  it('öffnet und schließt das mobile Menü', () => {
    const { root, toggle } = mount();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(root).toHaveClass('is-open');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(root).not.toHaveClass('is-open');
  });

  it('öffnet eine Gruppe und schließt die andere', () => {
    const { groups, panel } = mount();
    fireEvent.click(groups[0]);
    expect(groups[0]).toHaveAttribute('aria-expanded', 'true');
    expect(panel('n-g1').hidden).toBe(false);
    fireEvent.click(groups[1]);
    expect(groups[0]).toHaveAttribute('aria-expanded', 'false');
    expect(panel('n-g1').hidden).toBe(true);
    expect(panel('n-g2').hidden).toBe(false);
  });

  it('schließt mit Esc und fokussiert den Auslöser', () => {
    const { groups, panel } = mount();
    fireEvent.click(groups[0]);
    fireEvent.keyDown(panel('n-g1').querySelector('a')!, { key: 'Escape' });
    expect(groups[0]).toHaveAttribute('aria-expanded', 'false');
    expect(groups[0]).toHaveFocus();
  });

  it('schließt bei Klick außerhalb', () => {
    const { groups, panel } = mount();
    fireEvent.click(groups[0]);
    fireEvent.mouseDown(document.getElementById('outside')!);
    expect(panel('n-g1').hidden).toBe(true);
  });

  it('schließt Gruppe und Menü nach Klick auf einen Link', () => {
    const { root, toggle, groups, panel } = mount();
    fireEvent.click(toggle);
    fireEvent.click(groups[0]);
    const link = panel('n-g1').querySelector('a')!;
    link.addEventListener('click', (event) => event.preventDefault());
    fireEvent.click(link);
    expect(panel('n-g1').hidden).toBe(true);
    expect(root).not.toHaveClass('is-open');
  });

  it('initialisiert dasselbe Element nicht doppelt', () => {
    const { root, toggle } = mount();
    initAppNav(root);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
  it('entfernt beim Cleanup alle Listener und erlaubt erneutes Initialisieren', () => {
    const { root, toggle } = mount();
    cleanup();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    cleanup = initAppNav(root);
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('schließt mit Esc das mobile Menü, wenn keine Gruppe offen ist', () => {
    const { root, toggle } = mount();
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: 'Escape' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(root).not.toHaveClass('is-open');
  });

  it('schließt eine Gruppe, wenn der Fokus die Navigation verlässt', () => {
    const { groups, panel } = mount();
    fireEvent.click(groups[0]);
    fireEvent.focusOut(groups[0], { relatedTarget: document.getElementById('outside') });
    expect(groups[0]).toHaveAttribute('aria-expanded', 'false');
    expect(panel('n-g1').hidden).toBe(true);
  });

  it('lässt die Gruppe offen, wenn der Fokus innerhalb der Navigation bleibt', () => {
    const { groups, panel } = mount();
    fireEvent.click(groups[0]);
    fireEvent.focusOut(groups[0], { relatedTarget: panel('n-g1').querySelector('a') });
    expect(groups[0]).toHaveAttribute('aria-expanded', 'true');
  });
});
