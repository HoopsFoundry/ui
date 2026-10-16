// Parität der Tastaturregeln: Svelte-Tabs, React-Tabs und initTabs wählen bei derselben Tastenfolge dieselben Tabs
// (Pfeile in Richtung, Umlauf, gesperrte übersprungen, roving tabindex). Pos1/Ende springen in allen drei Fassungen an den ersten bzw. letzten nicht gesperrten Tab.
import { cleanup, fireEvent, render } from '@testing-library/react';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { Tabs as ReactTabs } from '../react/Tabs';
import SvelteTabs from '../svelte/Tabs.svelte';
import { initTabs } from '../js/tabs.js';

const items = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C', disabled: true }, { id: 'd', label: 'D' }];
const markup = (variant: string) => `<div class="hoops-tabs hoops-tabs--${variant}" role="tablist" aria-label="x" id="v">${items.map((i, n) =>
  `<button type="button" class="hoops-tab${n === 0 ? ' is-active' : ''}" role="tab" id="v-${i.id}" aria-selected="${n === 0}" tabindex="${n === 0 ? 0 : -1}"${i.disabled ? ' disabled' : ''}>${i.label}</button>`).join('')}</div>`;

type Trace = { selected: string; focus: string; tabindex: string };
const snapshot = (root: Element): Trace => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const on = tabs.filter((t) => t.getAttribute('aria-selected') === 'true');
  return {
    selected: on.map((t) => t.textContent!.trim()).join(),
    focus: tabs.includes(document.activeElement as Element) ? document.activeElement!.textContent!.trim() : '',
    tabindex: tabs.map((t) => t.getAttribute('tabindex')).join(),
  };
};
const press = (root: Element, keys: string[], after: () => void = () => {}) => {
  const out: Trace[] = [];
  for (const key of keys) {
    const tabs = [...root.querySelectorAll<HTMLElement>('[role="tab"]')];
    const current = tabs.find((t) => t.getAttribute('aria-selected') === 'true')!;
    current.focus();
    fireEvent.keyDown(current, { key });
    after();
    out.push(snapshot(root));
  }
  return out;
};

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

const SEQUENCES: Record<string, string[]> = {
  waagerecht: ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'a', 'ArrowDown', 'ArrowUp', 'End', 'End', 'Home', 'Home'],
  senkrecht: ['ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowLeft', 'Enter', 'End', 'Home', 'End'],
};

describe.each([['underline', 'waagerecht'], ['vertical', 'senkrecht']])('Tastenfolge (%s)', (variant, name) => {
  const keys = SEQUENCES[name];
  const viaSvelte = () => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(SvelteTabs, { target, props: { items, variant: variant as 'underline' | 'vertical' } });
    flushSync();
    const trace = press(target, keys, () => flushSync());
    unmount(instance);
    return trace;
  };
  const viaReact = () => {
    const { container } = render(<ReactTabs items={items} variant={variant as 'underline' | 'vertical'} />);
    return press(container, keys);
  };
  const viaVanilla = () => {
    document.body.replaceChildren(document.createRange().createContextualFragment(markup(variant)));
    const handle = initTabs(document.getElementById('v')!);
    const trace = press(document.getElementById('v')!, keys);
    handle.destroy();
    return trace;
  };
  it('Svelte, React und Vanilla wählen, fokussieren und setzen tabindex gleich', () => {
    const svelte = viaSvelte();
    const react = viaReact();
    const vanilla = viaVanilla();
    expect(svelte.at(-1)!.selected).not.toBe('');
    expect(react).toEqual(svelte);
    expect(vanilla).toEqual(svelte);
  });
});

describe('Pos1 und Ende', () => {
  it('Svelte, React und Vanilla springen an die Ränder (WAI-ARIA), gesperrte Tabs zählen nicht', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const instance = mount(SvelteTabs, { target, props: { items } });
    flushSync();
    expect(press(target, ['End'], () => flushSync())[0].selected).toBe('D');
    unmount(instance);
    const { container } = render(<ReactTabs items={items} />);
    expect(press(container, ['End', 'Home'])[1].selected).toBe('A');
    expect(press(container, ['End'])[0].selected).toBe('D');
    document.body.replaceChildren(document.createRange().createContextualFragment(markup('underline')));
    const handle = initTabs(document.getElementById('v')!);
    expect(press(document.getElementById('v')!, ['End'])[0].selected).toBe('D');
    handle.destroy();
  });
  it('mit multi bleiben Pos1/Ende ohne Wirkung', () => {
    const { container } = render(<ReactTabs items={items} multi />);
    const first = container.querySelector<HTMLElement>('button')!;
    expect(fireEvent.keyDown(first, { key: 'End' })).toBe(true);
  });
});
