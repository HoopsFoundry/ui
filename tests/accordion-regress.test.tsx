// Nachbesserungen aus dem Review: exclusive + defaultOpen + Anker (alle drei Fassungen gleich), Fokus beim Schließen,
// Name der Sprungleiste im Vanilla-Skript, Scroll-Abstand unter klebenden Elternköpfen.
import { flushSync, mount, unmount } from 'svelte';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Accordion, AccordionItem } from '../react/Accordion';
import SsrHost from './helpers/AccordionSsr.svelte';
import Host from './helpers/AccordionHost.svelte';
import { initAccordion, scrollToElement, stickyOffset } from '../js/accordion.js';

const wait = (ms = 0) => act(() => new Promise<void>((r) => setTimeout(r, ms)));
const setHash = (h: string) => window.history.replaceState(null, '', h ? `/${h}` : '/');
const states = (root: ParentNode, n = 4) => Array.from({ length: n }, (_, i) => root.querySelector(`[id="i${i}-trigger"]`)!.getAttribute('aria-expanded') === 'true');

beforeEach(() => setHash(''));
afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  setHash('');
});

// ── D: exclusive + defaultOpen + Anker ────────────────────────────────
const CASES: [string, number[], string, boolean[]][] = [
  ['Bereich 0 offen, Anker #i2: der Anker gewinnt', [0], '#i2', [false, false, true, false]],
  ['Bereich 0 offen, kein Anker: bleibt offen', [0], '', [true, false, false, false]],
  ['Bereich 3 offen, Anker #i1', [3], '#i1', [false, true, false, false]],
  ['Bereiche 1 und 2 offen, kein Anker: nur der erste', [1, 2], '', [false, true, false, false]],
  ['Bereich 2 offen, Anker auf den ersten #i0', [2], '#i0', [true, false, false, false]],
  ['Bereiche 0, 1, 3 offen, Anker #i3', [0, 1, 3], '#i3', [false, false, false, true]],
  ['unbekannter Anker verändert nichts', [1], '#nope', [false, true, false, false]],
];
const titles = ['A', 'B', 'C', 'D'];

describe.each(CASES)('exclusive + defaultOpen + Anker: %s', (_name, open, hash, expected) => {
  it('React', async () => {
    setHash(hash);
    const { container } = render(
      <Accordion exclusive>
        {titles.map((t, i) => (
          <AccordionItem key={i} id={`i${i}`} title={t} defaultOpen={open.includes(i)}>x</AccordionItem>
        ))}
      </Accordion>,
    );
    await wait(20);
    expect(states(container)).toEqual(expected);
  });
  it('Svelte', async () => {
    setHash(hash);
    const target = document.createElement('div');
    document.body.replaceChildren(target);
    const app = mount(SsrHost, { target, props: { cfg: { props: { exclusive: true }, items: titles.map((t, i) => ({ id: `i${i}`, title: t, open: open.includes(i) })) } } });
    flushSync();
    await wait(20);
    flushSync();
    expect(states(target)).toEqual(expected);
    void unmount(app);
  });
  it('Vanilla', async () => {
    setHash(hash);
    const item = (i: number) => `<div class="dss-acc-item${open.includes(i) ? ' is-open' : ''}" id="i${i}"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="i${i}-trigger" aria-expanded="${open.includes(i)}" aria-controls="i${i}-panel"><span class="dss-acc-label">${titles[i]}</span></button></h3><div class="dss-acc-panel" id="i${i}-panel"${open.includes(i) ? '' : ' hidden inert'}><div class="dss-acc-panel-inner"><div class="dss-acc-body">x</div></div></div></div>`;
    document.body.replaceChildren(document.createRange().createContextualFragment(`<div class="dss-acc dss-acc--card">${[0, 1, 2, 3].map(item).join('')}</div>`));
    const destroy = initAccordion(document.querySelector('.dss-acc')!, { exclusive: true });
    await wait(20);
    expect(states(document.body)).toEqual(expected);
    destroy();
  });
});

// ── I: Fokus beim Schließen ───────────────────────────────────────────
describe('Fokus geht auf den Kopf, wenn sein Bereich inert wird', () => {
  it('React: exclusive, Anker öffnet einen anderen Bereich', async () => {
    const { container } = render(
      <Accordion exclusive>
        <AccordionItem id="a" title="A" defaultOpen><button type="button" id="inner">innen</button></AccordionItem>
        <AccordionItem id="b" title="B">y</AccordionItem>
      </Accordion>,
    );
    await wait(20);
    (container.querySelector('#inner') as HTMLElement).focus();
    expect(document.activeElement?.id).toBe('inner');
    act(() => {
      window.location.hash = '#b';
    });
    await wait(30);
    expect(container.querySelector('[id="b-trigger"]')!.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('[id="a-trigger"]')!.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement?.id).toBe('a-trigger');
  });
  it('Svelte: Köpfe der verschachtelten Gruppe im Bereich c, Anker auf a (exclusive)', async () => {
    const target = document.createElement('div');
    document.body.replaceChildren(target);
    const app = mount(Host, { target });
    const api = app as unknown as { set: (v: Record<string, unknown>) => void };
    api.set({ exclusive: true, syncHash: true, lockB: true });
    flushSync();
    await wait(20);
    flushSync();
    (target.querySelector('[id="c-trigger"]') as HTMLElement).click();
    flushSync();
    (target.querySelector('[id="c1-trigger"]') as HTMLElement).focus();
    expect(document.activeElement?.id).toBe('c1-trigger');
    window.location.hash = '#a';
    await wait(30);
    flushSync();
    expect(target.querySelector('[id="c-trigger"]')!.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement?.id).toBe('c-trigger');
    void unmount(app);
  });
  it('Vanilla: Anker öffnet einen anderen Bereich (exclusive)', async () => {
    const item = (id: string, open: boolean, inner = '') => `<div class="dss-acc-item${open ? ' is-open' : ''}" id="${id}"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="${id}-t" aria-expanded="${open}" aria-controls="${id}-p"><span class="dss-acc-label">${id}</span></button></h3><div class="dss-acc-panel" id="${id}-p"${open ? '' : ' hidden inert'}><div class="dss-acc-panel-inner"><div class="dss-acc-body">${inner}</div></div></div></div>`;
    document.body.replaceChildren(document.createRange().createContextualFragment(`<div class="dss-acc dss-acc--card">${item('a', true, '<button id="inner">i</button>')}${item('b', false)}</div>`));
    const destroy = initAccordion(document.querySelector('.dss-acc')!, { exclusive: true });
    document.getElementById('inner')!.focus();
    window.location.hash = '#b';
    await wait(30);
    expect(document.getElementById('b-t')!.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement?.id).toBe('a-t');
    destroy();
  });
});

// ── B: Name der Sprungleiste ohne das unsichtbare Komma ───────────────
describe('Vanilla-Sprungleiste: Linktext ist der Titel', () => {
  it('auch bei einem Kopf mit Zusatzinfo (unsichtbares Komma im Label, .dss-acc-sep)', () => {
    const item = (id: string, title: string, meta: boolean) => `<div class="dss-acc-item" id="${id}"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="${id}-t" aria-expanded="false" aria-controls="${id}-p"><span class="dss-acc-label">${title}${meta ? '<span class="dss-acc-sep">,</span>' : ''}</span>${meta ? '<span class="dss-acc-meta">14 Spieler</span>' : ''}</button></h3><div class="dss-acc-panel" id="${id}-p" hidden inert><div class="dss-acc-panel-inner"><div class="dss-acc-body">x</div></div></div></div>`;
    document.body.replaceChildren(document.createRange().createContextualFragment(`<div class="dss-acc dss-acc--card">${item('a', 'Bereich 0', true)}${item('b', 'Spielplan', false)}</div>`));
    const destroy = initAccordion(document.querySelector('.dss-acc')!, { nav: true, syncHash: false });
    expect([...document.querySelectorAll('.dss-acc-nav-link')].map((l) => l.textContent)).toEqual(['Bereich 0', 'Spielplan']);
    destroy();
  });
});

// ── C: Scroll-Abstand unter klebenden Elternköpfen ────────────────────
describe('Scroll-Abstand bei verschachtelten Zielen unter klebendem Kopf', () => {
  const tree = (sticky: boolean) => {
    document.body.replaceChildren(
      document.createRange().createContextualFragment(
        `<div class="dss-acc ${sticky ? 'dss-acc--sticky' : ''}"><div class="dss-acc-item is-open" id="o"><h3 class="dss-acc-title"><button class="dss-acc-trigger">O</button></h3><div class="dss-acc-panel"><div class="dss-acc-panel-inner"><div class="dss-acc-body">` +
          `<div class="dss-acc dss-acc--nested"><div class="dss-acc-item is-open" id="m"><h3 class="dss-acc-title"><button class="dss-acc-trigger">M</button></h3><div class="dss-acc-panel"><div class="dss-acc-panel-inner"><div class="dss-acc-body">` +
          `<div class="dss-acc dss-acc--nested"><div class="dss-acc-item" id="t"><h3 class="dss-acc-title"><button class="dss-acc-trigger">T</button></h3></div></div>` +
          `</div></div></div></div></div></div></div></div></div>`,
      ),
    );
    const head = document.querySelector('#o > .dss-acc-title') as HTMLElement;
    head.getBoundingClientRect = () => ({ height: 46.4, top: 0, bottom: 46.4, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON() {} });
  };
  it('stickyOffset: Höhe des klebenden Kopfes der obersten Ebene; 0 für den Bereich selbst und ohne sticky', () => {
    tree(true);
    expect(stickyOffset(document.getElementById('t'))).toBe(47);
    expect(stickyOffset(document.getElementById('m'))).toBe(47);
    expect(stickyOffset(document.getElementById('o'))).toBe(0);
    tree(false);
    expect(stickyOffset(document.getElementById('t'))).toBe(0);
  });
  it('scrollToElement setzt für das Ziel beim Scrollen einen Abstand mit der Kopfhöhe und stellt ihn danach zurück (3 Ebenen)', async () => {
    tree(true);
    const el = document.getElementById('t')!;
    let margin = '';
    el.scrollIntoView = vi.fn(() => {
      margin = el.style.scrollMarginTop;
    });
    scrollToElement(el);
    await wait(40);
    expect(margin).toBe('calc(var(--hoops-acc-sticky-top, 0px) + 8px + 47px)');
    expect(el.style.scrollMarginTop).toBe('');
  });
  it('für den Bereich der obersten Ebene bleibt der Abstand aus dem CSS', async () => {
    tree(true);
    const el = document.getElementById('o')!;
    let margin = 'x';
    el.scrollIntoView = vi.fn(() => {
      margin = el.style.scrollMarginTop;
    });
    scrollToElement(el);
    await wait(40);
    expect(margin).toBe('');
  });
});
