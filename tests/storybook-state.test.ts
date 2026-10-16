// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyState, setForcedState } from '../.storybook/state-switch';

function mount(html: string, rootAttrs: { id?: string; class?: string } = { id: 'storybook-root' }) {
  const root = document.createElement('div');
  if (rootAttrs.id) root.id = rootAttrs.id;
  if (rootAttrs.class) root.className = rootAttrs.class;
  root.append(document.createRange().createContextualFragment(html));
  document.body.replaceChildren(root);
  return root;
}

describe('applyState', () => {
  it('setzt Hover, Fokus und Aktiv als pseudo-Klassen', () => {
    const root = mount('<button id="b">x</button>');
    const b = root.querySelector('#b')!;
    applyState(root, 'hover');
    expect(b.className).toBe('pseudo-hover');
    applyState(root, 'focus');
    expect(b.className).toBe('pseudo-focus-visible');
    applyState(root, 'active');
    expect([...b.classList].sort()).toEqual(['pseudo-active', 'pseudo-hover']);
  });

  it('normal entfernt nur die gesetzten Klassen und lässt eigene stehen', () => {
    const root = mount('<button id="a" class="hoops-btn">x</button><button id="f" class="pseudo-focus-visible">y</button>');
    applyState(root, 'hover');
    applyState(root, 'normal');
    expect(root.querySelector('#a')!.className).toBe('hoops-btn');
    expect(root.querySelector('#f')!.className).toBe('pseudo-focus-visible');
  });

  it('übergeht gesperrte Elemente und feste Zustandsbereiche', () => {
    const root = mount(
      '<button id="d" disabled>x</button><button id="aria" aria-disabled="true">x</button>' +
        '<div data-fixed-states><button id="fixed">y</button></div>',
    );
    applyState(root, 'focus');
    for (const id of ['d', 'aria', 'fixed']) expect(root.querySelector('#' + id)!.className).toBe('');
  });

  it('erfasst Links, Eingabefelder, summary und tabindex, aber nicht tabindex=-1', () => {
    const root = mount('<a id="l" href="#">l</a><input id="i"><summary id="s">s</summary><div id="t" tabindex="0"></div><div id="n" tabindex="-1"></div>');
    applyState(root, 'hover');
    for (const id of ['l', 'i', 's', 't']) expect(root.querySelector('#' + id)!.classList.contains('pseudo-hover')).toBe(true);
    expect(root.querySelector('#n')!.className).toBe('');
  });
});

describe('Fokus: Vorfahren', () => {
  it('Fokus setzt .pseudo-focus-within auf Vorfahren (Ring liegt auf .hoops-input-group), Wechsel räumt auf', () => {
    const root = mount('<div id="g" class="hoops-input-group"><input id="i"></div>');
    applyState(root, 'focus');
    expect(root.querySelector('#g')!.classList.contains('pseudo-focus-within')).toBe(true);
    applyState(root, 'hover');
    expect(root.querySelector('#g')!.className).toBe('hoops-input-group');
    applyState(root, 'focus');
    applyState(root, 'normal');
    expect(root.querySelector('#g')!.className).toBe('hoops-input-group');
    expect(root.querySelector('#g')!.hasAttribute('data-forced-within')).toBe(false);
  });
});

describe('setForcedState', () => {
  beforeEach(() => mount('<button id="b">x</button>'));
  afterEach(() => setForcedState('normal'));

  it('wirkt sofort auf #storybook-root', () => {
    setForcedState('focus');
    expect(document.getElementById('b')!.classList.contains('pseudo-focus-visible')).toBe(true);
  });

  it('erfasst später eingefügte Elemente (MutationObserver)', async () => {
    setForcedState('hover');
    const late = document.createElement('button');
    late.id = 'late';
    document.getElementById('storybook-root')!.append(late);
    await new Promise((r) => setTimeout(r, 80));
    expect(late.classList.contains('pseudo-hover')).toBe(true);
  });

  it('wirkt auch in Doku-Stories (.docs-story)', () => {
    mount('<button id="d">x</button>', { class: 'docs-story' });
    setForcedState('hover');
    expect(document.getElementById('d')!.classList.contains('pseudo-hover')).toBe(true);
  });
});
