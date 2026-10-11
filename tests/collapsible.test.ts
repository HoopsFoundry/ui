// @vitest-environment jsdom
// Gemeinsamer Baustein createCollapsible (js/accordion.js), Vanilla-Skript mit einklappbaren Rahmen und die Parität der internen Bausteine.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCollapsible, initAccordion, moveFocus } from '../js/accordion.js';
import { collapsibleMarkup as tableMarkup } from '../stories/Table.code';

afterEach(() => {
  document.body.replaceChildren();
  window.history.replaceState(null, '', '/');
});

function host(over: Record<string, unknown> = {}) {
  const state = { open: false, disabled: false, anchor: true, group: undefined as unknown, parent: undefined as unknown, id: 'a', committed: [] as boolean[] };
  const el = document.createElement('div');
  const panel = document.createElement('div');
  const trigger = document.createElement('button');
  el.append(trigger, panel);
  document.body.append(el);
  const h = {
    id: () => state.id,
    title: () => 'Titel',
    open: () => state.open,
    disabled: () => state.disabled,
    anchor: () => state.anchor,
    group: () => state.group as never,
    parent: () => state.parent as never,
    el: () => el,
    trigger: () => trigger,
    panel: () => panel,
    commit: (next: boolean) => {
      state.open = next;
      state.committed.push(next);
    },
    ...over,
  };
  return { state, el, panel, trigger, c: createCollapsible(h as never) };
}

describe('createCollapsible', () => {
  it('setOpen setzt den Zustand über commit, ein gleicher Wert löst nichts aus', () => {
    const { state, c } = host();
    c.setOpen(true);
    c.setOpen(true);
    c.setOpen(false);
    expect(state.committed).toEqual([true, false]);
  });
  it('gesperrt: eine Änderung wird ignoriert, derselbe Wert nicht', () => {
    const { state, c } = host();
    state.disabled = true;
    c.setOpen(true);
    expect(state.committed).toEqual([]);
  });
  it('user: schreibt den Anker nur mit anchor und syncHash; Schließen entfernt ihn', () => {
    const a = host();
    a.c.setOpen(true, true);
    expect(window.location.hash).toBe('#a');
    a.c.setOpen(false, true);
    expect(window.location.hash).toBe('');
    const b = host();
    b.state.anchor = false;
    b.c.setOpen(true, true);
    expect(window.location.hash).toBe('');
    const g = host();
    g.state.group = { exclusive: false, syncHash: false, closeOthers: () => {} };
    g.c.setOpen(true, true);
    expect(window.location.hash).toBe('');
  });
  it('exclusive: öffnen ruft closeOthers auch bei schon offenem Bereich', () => {
    const closeOthers = vi.fn();
    const { state, c } = host();
    state.group = { exclusive: true, syncHash: true, closeOthers };
    c.setOpen(true);
    state.open = true;
    c.setOpen(true);
    expect(closeOthers).toHaveBeenCalledTimes(2);
    expect(closeOthers).toHaveBeenCalledWith('a');
  });
  it('schließen holt den Fokus aus dem Bereich auf den Kopf', () => {
    const { state, c, panel, trigger } = host();
    const inner = document.createElement('button');
    panel.append(inner);
    state.open = true;
    inner.focus();
    c.setOpen(false);
    expect(document.activeElement).toBe(trigger);
  });
  it('reveal öffnet auch die Eltern', () => {
    const parentReveal = vi.fn();
    const { state, c } = host();
    state.parent = { reveal: parentReveal };
    c.reveal();
    expect(state.open).toBe(true);
    expect(parentReveal).toHaveBeenCalled();
  });
  it('checkHash: öffnet bei passendem Anker, ignoriert andere und Rahmen ohne id', () => {
    const a = host();
    window.history.replaceState(null, '', '/#a');
    a.c.checkHash();
    expect(a.state.open).toBe(true);
    const b = host();
    b.state.id = 'b';
    b.c.checkHash();
    expect(b.state.open).toBe(false);
    const n = host();
    n.state.anchor = false;
    n.c.checkHash();
    expect(n.state.open).toBe(false);
  });
  it('der Eintrag liest die Werte erst beim Zugriff und hat anchor', () => {
    const { state, c, el, trigger } = host();
    expect(c.entry.open).toBe(false);
    state.open = true;
    state.id = 'neu';
    expect(c.entry.open).toBe(true);
    expect(c.entry.id).toBe('neu');
    expect(c.entry.anchor).toBe(true);
    expect(c.entry.el).toBe(el);
    expect(c.entry.trigger).toBe(trigger);
    expect(c.entry.disabled).toBe(false);
    c.entry.setOpen(false);
    expect(state.open).toBe(false);
  });
});

describe('Vanilla: einklappbarer Rahmen', () => {
  const mount = (html: string) => {
    document.body.replaceChildren(document.createRange().createContextualFragment(html));
    return document.querySelector<HTMLElement>('.dss-acc')!;
  };
  // Der Rahmen aus dem Markup der Doku, per DOM herausgelöst
  const frameHtml = () => document.createRange().createContextualFragment(tableMarkup).querySelector('.dss-frame')!.outerHTML;
  const group = (n: number, extra = '') =>
    `<div class="dss-acc" data-dss-acc>${Array.from({ length: n }, (_, i) => frameHtml().replace(/boxscore/g, `f${i}`).replace('Spieler-Statistiken"', `Rahmen ${i}"`).replace('Spieler-Statistiken<', `Rahmen ${i}<`)).join('')}${extra}</div>`;
  const trig = (id: string) => document.querySelector<HTMLButtonElement>(`[id="${id}-trigger"]`)!;

  it('der Skript-Weg schaltet aria-expanded, hidden, inert und is-open', () => {
    const root = mount(tableMarkup);
    const destroy = initAccordion(root, { syncHash: false });
    const t = trig('boxscore');
    const panel = document.getElementById('boxscore-panel')!;
    expect(t.getAttribute('aria-expanded')).toBe('true');
    t.click();
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(panel.hidden).toBe(true);
    expect(panel.hasAttribute('inert')).toBe(true);
    expect(document.getElementById('boxscore')!.classList.contains('is-open')).toBe(false);
    t.click();
    expect(document.getElementById('boxscore')!.classList.contains('is-open')).toBe(true);
    destroy();
  });
  it('Gruppe: Sprungleiste mit dem Titel (ohne Komma), exclusive, Alle öffnen', () => {
    const root = mount(group(3));
    initAccordion(root, { syncHash: false, nav: true, expandAll: true });
    expect([...document.querySelectorAll('.dss-acc-nav-link')].map((a) => a.textContent)).toEqual(['Rahmen 0', 'Rahmen 1', 'Rahmen 2']);
    const [open, close] = [...document.querySelectorAll<HTMLButtonElement>('.dss-acc-bar button')];
    open.click();
    expect([...document.querySelectorAll('.dss-acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);
    close.click();
    expect([...document.querySelectorAll('.dss-acc-trigger')].every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });
  it('exclusive hält nur einen Rahmen offen', () => {
    const root = mount(group(3));
    initAccordion(root, { syncHash: false, exclusive: true });
    expect([...document.querySelectorAll('.dss-acc-trigger')].filter((b) => b.getAttribute('aria-expanded') === 'true')).toHaveLength(1);
    trig('f1').click();
    expect(trig('f1').getAttribute('aria-expanded')).toBe('true');
    expect(trig('f0').getAttribute('aria-expanded')).toBe('false');
  });
  it('Anker öffnet den Rahmen, Pfeiltasten springen zwischen den Köpfen', () => {
    window.history.replaceState(null, '', '/#f2');
    const root = mount(group(3));
    initAccordion(root);
    expect(trig('f2').getAttribute('aria-expanded')).toBe('true');
    const heads = [...document.querySelectorAll<HTMLButtonElement>('.dss-acc-trigger')];
    heads[0].focus();
    expect(moveFocus(root, heads[0], 'ArrowDown')).toBe(true);
    expect(document.activeElement).toBe(heads[1]);
  });
  it('ein einzelner Rahmen im Panel eines Bereichs gehört nicht zur äußeren Gruppe', () => {
    const inner = frameHtml();
    const root = mount(
      `<div class="dss-acc" data-dss-acc><div class="dss-acc-item is-open" id="p"><h3 class="dss-acc-title"><button type="button" class="dss-acc-trigger" id="p-trigger" aria-expanded="true" aria-controls="p-panel"><span class="dss-acc-label">Eltern</span></button></h3><div class="dss-acc-panel" id="p-panel"><div class="dss-acc-panel-inner">${inner}</div></div></div></div>`,
    );
    initAccordion(root, { syncHash: false, exclusive: true, nav: true });
    expect([...document.querySelectorAll('.dss-acc-nav-link')].map((a) => a.textContent)).toEqual(['Eltern']);
    const heads = [...root.querySelectorAll<HTMLButtonElement>('.dss-acc-trigger')];
    const child = heads.find((b) => b.id === 'boxscore-trigger')!;
    expect(moveFocus(root, child, 'ArrowUp')).toBe(false);
    child.click(); // wird von der äußeren Gruppe nicht behandelt: der Elternbereich bleibt offen
    expect(trig('p').getAttribute('aria-expanded')).toBe('true');
  });
});

describe('interne Bausteine: Parität Svelte und React', () => {
  // (unter jsdom liefert das globale URL-Objekt eine Variante, die readFileSync(new URL(...)) ablehnt: Pfade über das Arbeitsverzeichnis)
  const file = (p: string) => join(process.cwd(), p);
  const svelte = readFileSync(file('svelte/internal/CollapsibleFrame.svelte'), 'utf8');
  const react = readFileSync(file('react/internal/CollapsibleFrame.tsx'), 'utf8');
  it('beide Dateien gibt es, ohne eigenen <style>-Block', () => {
    expect(existsSync(file('svelte/internal/CollapsibleFrame.svelte'))).toBe(true);
    expect(svelte).not.toMatch(/<style[\s>]/);
  });
  it('beide nutzen dieselben Klassen und den gemeinsamen Baustein', () => {
    const classes = (src: string) => new Set(src.match(/dss-[\w-]+/g));
    for (const cls of classes(svelte)) if (cls !== 'dss-cf') expect(react, cls).toContain(cls);
    expect(svelte).toContain('createCollapsible');
    expect(react).toContain('createCollapsible');
  });
  it('die internen Bausteine sind nicht öffentlich: kein Paket-Export, kein Eintrag in react/index.ts', () => {
    const pkg = readFileSync(file('package.json'), 'utf8');
    expect(pkg).not.toContain('CollapsibleFrame');
    expect(readFileSync(file('react/index.ts'), 'utf8')).not.toContain('CollapsibleFrame');
  });
});
