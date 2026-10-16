// initTabs: Tastatur (Pfeile, Pos1/Ende, Umlauf, gesperrte), ARIA, roving tabindex, Panels (hidden/inert), manuelle Aktivierung, Mehrfachauswahl,
// Deep-Link, Ereignis hoops:tabchange, mehrere Leisten, mehrfaches init, destroy.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initTabs, initialTab, nextTab } from '../js/tabs.js';
import { keydown, mountHtml, tabsMarkup } from './helpers/tabs-markup';

type Handle = ReturnType<typeof initTabs>;
let handles: Handle[] = [];
const start = (html = tabsMarkup(), options = {}, id = 'r-bar') => {
  mountHtml(html);
  const handle = initTabs(document.getElementById(id)!, options);
  handles.push(handle);
  return handle;
};
const tab = (name: string, ids = 'r') => document.getElementById(`${ids}-${name}`)!;
const panel = (name: string, ids = 'r') => document.getElementById(`${ids}-p-${name}`)!;
const selected = (ids = 'r') => [...document.querySelectorAll(`#${ids}-bar [role="tab"]`)].filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.id.replace(`${ids}-`, ''));

beforeEach(() => {
  window.history.replaceState(null, '', '/');
  window.scrollTo = vi.fn() as never;
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
});
afterEach(() => {
  for (const h of handles.splice(0)) h.destroy();
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('nextTab (reine Funktion, dieselben Regeln wie Svelte/React)', () => {
  const four = [false, false, true, false];
  it('rechts/links wählen den Nachbarn, gesperrte werden übersprungen, am Rand geht es von vorn weiter', () => {
    expect(nextTab(0, 'ArrowRight', four)).toBe(1);
    expect(nextTab(1, 'ArrowRight', four)).toBe(3);
    expect(nextTab(3, 'ArrowRight', four)).toBe(0);
    expect(nextTab(0, 'ArrowLeft', four)).toBe(3);
    expect(nextTab(3, 'ArrowLeft', four)).toBe(1);
  });
  it('senkrecht: ab/auf statt rechts/links', () => {
    expect(nextTab(0, 'ArrowDown', four, { vertical: true })).toBe(1);
    expect(nextTab(0, 'ArrowRight', four, { vertical: true })).toBe(0);
    expect(nextTab(0, 'ArrowUp', four, { vertical: true })).toBe(3);
    expect(nextTab(0, 'ArrowDown', four)).toBe(0);
  });
  it('RTL kehrt links/rechts um', () => {
    expect(nextTab(0, 'ArrowLeft', four, { rtl: true })).toBe(1);
    expect(nextTab(1, 'ArrowRight', four, { rtl: true })).toBe(0);
  });
  it('Pos1 und Ende: erster und letzter nicht gesperrter Tab', () => {
    expect(nextTab(1, 'Home', [true, false, false, true])).toBe(1);
    expect(nextTab(2, 'End', [false, false, false, true])).toBe(2);
    expect(nextTab(3, 'Home', four)).toBe(0);
    expect(nextTab(0, 'End', four)).toBe(3);
  });
  it('wrap: false hält an den Rändern', () => {
    expect(nextTab(3, 'ArrowRight', four, { wrap: false })).toBe(3);
    expect(nextTab(0, 'ArrowLeft', four, { wrap: false })).toBe(0);
  });
  it('andere Tasten, Müll und Listen ohne Ziel ergeben den Index', () => {
    expect(nextTab(1, 'a', four)).toBe(1);
    expect(nextTab(1, 'ArrowRight', [true, false, true])).toBe(1);
    expect(nextTab(1, 'Home', [true, false])).toBe(1);
    expect(nextTab(5, 'ArrowRight', four)).toBe(5);
    expect(nextTab(-1, 'ArrowRight', four)).toBe(-1);
    expect(nextTab(0, 'ArrowRight', [] as never)).toBe(0);
    expect(nextTab(0, 'ArrowRight', null as never)).toBe(0);
    expect(nextTab(1.5, 'ArrowRight', four)).toBe(1.5);
  });
  it('akzeptiert { disabled } wie die Köpfe des Accordions', () => {
    expect(nextTab(0, 'ArrowRight', [{ disabled: false }, { disabled: true }, {}])).toBe(2);
  });
});

describe('initialTab', () => {
  it('gewünscht, sonst markiert, sonst erster nicht gesperrter; gesperrte gelten nicht', () => {
    const t = [true, false, false];
    expect(initialTab(t, 2, 1)).toBe(2);
    expect(initialTab(t, 0, 2)).toBe(2);
    expect(initialTab(t, undefined, undefined)).toBe(1);
    expect(initialTab([true, true])).toBe(-1);
    expect(initialTab([], 0, 0)).toBe(-1);
  });
});

describe('Anfangszustand und ARIA', () => {
  it('der markierte Tab ist gewählt, roving tabindex, nur sein Panel ist sichtbar', () => {
    start();
    expect(selected()).toEqual(['alle']);
    expect(tab('alle').getAttribute('tabindex')).toBe('0');
    for (const n of ['heim', 'aus', 'ausw']) expect(tab(n).getAttribute('tabindex')).toBe('-1');
    expect(panel('alle').hidden).toBe(false);
    expect(panel('alle').hasAttribute('inert')).toBe(false);
    for (const n of ['heim', 'aus', 'ausw']) {
      expect(panel(n).hidden).toBe(true);
      expect(panel(n).hasAttribute('inert')).toBe(true);
    }
  });
  it('ohne Markierung ist der erste nicht gesperrte Tab gewählt (is-active folgt)', () => {
    start(tabsMarkup().replace(' is-active', '').replace('aria-selected="true"', 'aria-selected="false"'));
    expect(selected()).toEqual(['alle']);
    expect(tab('alle').classList.contains('is-active')).toBe(true);
    expect(tab('heim').classList.contains('is-active')).toBe(false);
  });
  it('ergänzt fehlende Rollen, ids und Beschriftungen (Markup nur mit Klassen)', () => {
    start(`<div class="hoops-tabs" id="r-bar" aria-label="X"><button class="hoops-tab">A</button><button class="hoops-tab">B</button></div>`);
    const bar = document.getElementById('r-bar')!;
    expect(bar.getAttribute('role')).toBe('tablist');
    const [a, b] = [...bar.querySelectorAll('button')];
    expect(a.getAttribute('role')).toBe('tab');
    expect(a.id).toMatch(/^hoops-tab-\d+$/);
    expect(a.id).not.toBe(b.id);
    expect(a.getAttribute('aria-selected')).toBe('true');
    expect(b.getAttribute('tabindex')).toBe('-1');
  });
  it('vertical: aria-orientation, Pfeil ab/auf', () => {
    start(tabsMarkup().replace('hoops-tabs--segmented', 'hoops-tabs--vertical'));
    expect(document.getElementById('r-bar')!.getAttribute('aria-orientation')).toBe('vertical');
    keydown(tab('alle'), 'ArrowRight');
    expect(selected()).toEqual(['alle']);
    keydown(tab('alle'), 'ArrowDown');
    expect(selected()).toEqual(['heim']);
  });
  it('Panels ohne eigene Rolle bekommen role=tabpanel und aria-labelledby', () => {
    start(`<div class="hoops-tabs" id="r-bar"><button class="hoops-tab" id="a" aria-controls="pa">A</button><button class="hoops-tab" id="b" aria-controls="pb">B</button></div><div id="pa">x</div><div id="pb">y</div>`);
    expect(document.getElementById('pa')!.getAttribute('role')).toBe('tabpanel');
    expect(document.getElementById('pa')!.getAttribute('aria-labelledby')).toBe('a');
    expect(document.getElementById('pb')!.hidden).toBe(true);
  });
  it('ohne Panels (reiner Umschalter) funktioniert es ebenso', () => {
    start(`<div class="hoops-tabs" id="r-bar"><button class="hoops-tab" id="a">A</button><button class="hoops-tab" id="b">B</button></div>`);
    keydown(document.getElementById('a')!, 'ArrowRight');
    expect(document.getElementById('b')!.getAttribute('aria-selected')).toBe('true');
  });
  it('ein Verweis auf ein fehlendes Panel stört nicht', () => {
    expect(() => start(`<div class="hoops-tabs" id="r-bar"><button class="hoops-tab" aria-controls="gibt-es-nicht">A</button></div>`)).not.toThrow();
  });
  it('option value wählt den Anfangstab (data-tab, id oder Index); ein gesperrter wird nicht genommen', () => {
    start(tabsMarkup(), { value: 'r-ausw' });
    expect(selected()).toEqual(['ausw']);
    handles.pop()!.destroy();
    start(tabsMarkup(), { value: 1 });
    expect(selected()).toEqual(['heim']);
    handles.pop()!.destroy();
    start(tabsMarkup(), { value: 'r-aus' });
    expect(selected()).toEqual(['alle']);
  });
  it('gar keine Tabs oder keine Wurzel: harmloses Handle', () => {
    mountHtml('<div id="leer"></div>');
    expect(() => initTabs(document.getElementById('leer')!).destroy()).not.toThrow();
    expect(() => initTabs(null as never).destroy()).not.toThrow();
    expect(initTabs(null as never).getValue()).toBeNull();
  });
});

describe('Tastatur', () => {
  it('Pfeil rechts wählt und fokussiert den nächsten, überspringt den gesperrten', () => {
    start();
    tab('alle').focus();
    const event = keydown(tab('alle'), 'ArrowRight');
    expect(event.defaultPrevented).toBe(true);
    expect(selected()).toEqual(['heim']);
    expect(document.activeElement).toBe(tab('heim'));
    keydown(tab('heim'), 'ArrowRight');
    expect(selected()).toEqual(['ausw']);
    expect(document.activeElement).toBe(tab('ausw'));
  });
  it('am Rand geht es von vorn weiter, Pfeil links rückwärts', () => {
    start();
    keydown(tab('alle'), 'ArrowLeft');
    expect(selected()).toEqual(['ausw']);
    keydown(tab('ausw'), 'ArrowRight');
    expect(selected()).toEqual(['alle']);
  });
  it('Pos1 und Ende', () => {
    start();
    keydown(tab('alle'), 'End');
    expect(selected()).toEqual(['ausw']);
    keydown(tab('ausw'), 'Home');
    expect(selected()).toEqual(['alle']);
  });
  it('Panels folgen, roving tabindex folgt, das alte Panel ist hidden und inert', () => {
    start();
    keydown(tab('alle'), 'ArrowRight');
    expect(panel('heim').hidden).toBe(false);
    expect(panel('heim').hasAttribute('inert')).toBe(false);
    expect(panel('alle').hidden).toBe(true);
    expect(panel('alle').hasAttribute('inert')).toBe(true);
    expect(tab('heim').getAttribute('tabindex')).toBe('0');
    expect(tab('alle').getAttribute('tabindex')).toBe('-1');
    expect(selected()).toHaveLength(1);
  });
  it('Pfeile mit Strg, Alt, Meta oder Umschalt bleiben dem Browser', () => {
    start();
    for (const init of [{ ctrlKey: true }, { altKey: true }, { metaKey: true }, { shiftKey: true }]) {
      const event = keydown(tab('alle'), 'ArrowRight', init);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(selected()).toEqual(['alle']);
  });
  it('andere Tasten (Buchstabe, Pfeil ab in der waagerechten Leiste) werden nicht abgefangen', () => {
    start();
    expect(keydown(tab('alle'), 'a').defaultPrevented).toBe(false);
    expect(keydown(tab('alle'), 'ArrowDown').defaultPrevented).toBe(false);
    expect(selected()).toEqual(['alle']);
  });
  it('RTL: Pfeil links wählt den nächsten', () => {
    start(tabsMarkup('dir="rtl"').replace('data-hoops="tabs"', 'data-hoops="tabs" style="direction: rtl"'));
    keydown(tab('alle'), 'ArrowLeft');
    expect(selected()).toEqual(['heim']);
    keydown(tab('heim'), 'ArrowRight');
    expect(selected()).toEqual(['alle']);
  });
  it('manuelle Aktivierung: Pfeile bewegen nur den Fokus, Enter (Klick) wählt', () => {
    start(tabsMarkup(), { activation: 'manual' });
    keydown(tab('alle'), 'ArrowRight');
    expect(document.activeElement).toBe(tab('heim'));
    expect(selected()).toEqual(['alle']);
    tab('heim').click();
    expect(selected()).toEqual(['heim']);
  });
  it('Enter und Leertaste wählen auch ein Tab, das kein Button ist', () => {
    start(`<div class="hoops-tabs" id="r-bar"><a class="hoops-tab" id="a" role="tab" href="#a">A</a><a class="hoops-tab" id="b" role="tab" href="#b">B</a></div>`);
    const event = keydown(document.getElementById('b')!, 'Enter');
    expect(event.defaultPrevented).toBe(true);
    expect(document.getElementById('b')!.getAttribute('aria-selected')).toBe('true');
    keydown(document.getElementById('a')!, ' ');
    expect(document.getElementById('a')!.getAttribute('aria-selected')).toBe('true');
  });
  it('eine Taste an einem Element, das kein Tab ist, tut nichts', () => {
    start(tabsMarkup().replace('<span class="hoops-tab-label">Alle</span>', '<span class="hoops-tab-label">Alle</span>') + '<input id="x">');
    keydown(document.getElementById('r-bar')!, 'ArrowRight');
    expect(selected()).toEqual(['alle']);
  });
});

describe('Klick', () => {
  it('ein Klick wählt (auch auf das innere Label), ein gesperrter Tab nicht', () => {
    start();
    (tab('ausw').querySelector('.hoops-tab-label') as HTMLElement).click();
    expect(selected()).toEqual(['ausw']);
    tab('aus').click();
    expect(selected()).toEqual(['ausw']);
  });
  it('aria-disabled und is-disabled sperren ebenso', () => {
    start(tabsMarkup().replace(' disabled>', ' aria-disabled="true">'));
    tab('aus').click();
    keydown(tab('alle'), 'ArrowRight');
    keydown(tab('heim'), 'ArrowRight');
    expect(selected()).toEqual(['ausw']);
  });
  it('ein Klick auf den gewählten Tab ändert nichts und meldet nichts', () => {
    start();
    const spy = vi.fn();
    document.getElementById('r-bar')!.addEventListener('hoops:tabchange', spy);
    tab('alle').click();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('Ereignis hoops:tabchange', () => {
  it('meldet den Wechsel mit Detail, blubbert, kommt nicht beim Start', () => {
    mountHtml(tabsMarkup());
    const spy = vi.fn();
    document.body.addEventListener('hoops:tabchange', spy);
    const onChange = vi.fn();
    handles.push(initTabs(document.getElementById('r-bar')!, { onChange }));
    expect(spy).not.toHaveBeenCalled();
    keydown(tab('alle'), 'ArrowRight');
    expect(spy).toHaveBeenCalledTimes(1);
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toMatchObject({ index: 1, id: 'r-heim', source: 'user' });
    expect(detail.tab).toBe(tab('heim'));
    expect(detail.panel).toBe(panel('heim'));
    expect(onChange).toHaveBeenCalledTimes(1);
    document.body.removeEventListener('hoops:tabchange', spy);
  });
  it('select() meldet source api, data-tab ist der Schlüssel', () => {
    const h = start(tabsMarkup().replace('id="r-heim"', 'id="r-heim" data-tab="heim"'));
    const sources: string[] = [];
    document.getElementById('r-bar')!.addEventListener('hoops:tabchange', (e) => sources.push((e as CustomEvent).detail.source + ':' + (e as CustomEvent).detail.id));
    h.select('heim');
    h.select(3);
    h.select(tab('alle'));
    h.select('gibt-es-nicht');
    h.select(99);
    h.select(2); // gesperrt
    expect(sources).toEqual(['api:heim', 'api:r-ausw', 'api:r-alle']);
    expect(h.getValue()).toBe('r-alle');
    h.select('heim');
    expect(h.getValue()).toBe('heim');
  });
});

describe('Mehrfachauswahl (role=group, aria-pressed)', () => {
  const group = `<div class="hoops-tabs hoops-tabs--pills" role="group" aria-label="Wettbewerb" id="m-bar">
    <button type="button" class="hoops-tab is-active" id="m-liga" aria-pressed="true">Liga</button>
    <button type="button" class="hoops-tab" id="m-pokal" aria-pressed="false">Pokal</button>
    <button type="button" class="hoops-tab" id="m-ref" aria-pressed="false" disabled>Test</button></div>`;
  it('Klick schaltet um, kein Rollenwechsel, keine Pfeiltasten', () => {
    const h = start(group, {}, 'm-bar');
    const bar = document.getElementById('m-bar')!;
    expect(bar.getAttribute('role')).toBe('group');
    expect(document.getElementById('m-liga')!.hasAttribute('role')).toBe(false);
    expect(document.getElementById('m-liga')!.hasAttribute('tabindex')).toBe(false);
    document.getElementById('m-pokal')!.click();
    expect([...bar.querySelectorAll('[aria-pressed="true"]')].map((b) => b.id)).toEqual(['m-liga', 'm-pokal']);
    document.getElementById('m-liga')!.click();
    expect(h.getValue()).toEqual(['m-pokal']);
    expect(document.getElementById('m-liga')!.classList.contains('is-active')).toBe(false);
    expect(keydown(document.getElementById('m-liga')!, 'ArrowRight').defaultPrevented).toBe(false);
    document.getElementById('m-ref')!.click();
    expect(h.getValue()).toEqual(['m-pokal']);
  });
  it('das Ereignis trägt pressed und ids', () => {
    start(group, {}, 'm-bar');
    const spy = vi.fn();
    document.getElementById('m-bar')!.addEventListener('hoops:tabchange', spy);
    document.getElementById('m-pokal')!.click();
    expect((spy.mock.calls[0][0] as CustomEvent).detail).toMatchObject({ pressed: true, ids: ['m-liga', 'm-pokal'], index: 1 });
  });
});

describe('Deep-Link (hash)', () => {
  it('ein Anker auf ein Panel wählt den Tab beim Start und scrollt', () => {
    window.history.replaceState(null, '', '/#r-p-ausw');
    const scroll = vi.fn();
    (Element.prototype as never as { scrollIntoView: unknown }).scrollIntoView = scroll;
    start(tabsMarkup(), { hash: true });
    expect(selected()).toEqual(['ausw']);
    expect(scroll).toHaveBeenCalled();
  });
  it('ein Anker auf ein Element im Panel wählt dessen Tab', () => {
    window.history.replaceState(null, '', '/#r-in-heim');
    start(tabsMarkup(), { hash: true });
    expect(selected()).toEqual(['heim']);
  });
  it('ein Anker auf den Tab selbst und URL-kodierte Anker', () => {
    window.history.replaceState(null, '', '/#r-heim');
    start(tabsMarkup(), { hash: true });
    expect(selected()).toEqual(['heim']);
  });
  it('ein unbekannter oder gesperrter Anker bleibt ohne Wirkung', () => {
    window.history.replaceState(null, '', '/#gibt-es-nicht');
    start(tabsMarkup(), { hash: true });
    expect(selected()).toEqual(['alle']);
    handles.pop()!.destroy();
    window.history.replaceState(null, '', '/#r-p-aus');
    start(tabsMarkup(), { hash: true });
    expect(selected()).toEqual(['alle']);
  });
  it('ohne hash: true bleibt der Anker unbeachtet, und eine Wahl schreibt ihn nicht', () => {
    window.history.replaceState(null, '', '/#r-p-ausw');
    start();
    expect(selected()).toEqual(['alle']);
    keydown(tab('alle'), 'ArrowRight');
    expect(window.location.hash).toBe('#r-p-ausw');
  });
  it('mit hash: eine Wahl schreibt die Panel-id in die Adresse (replaceState), der Start nicht', () => {
    const spy = vi.spyOn(window.history, 'replaceState');
    start(tabsMarkup(), { hash: true });
    expect(spy).not.toHaveBeenCalled();
    keydown(tab('alle'), 'ArrowRight');
    expect(window.location.hash).toBe('#r-p-heim');
    spy.mockRestore();
  });
  it('hashchange wählt den Tab', () => {
    start(tabsMarkup(), { hash: true });
    window.history.replaceState(null, '', '/#r-p-ausw');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(selected()).toEqual(['ausw']);
    const sources: string[] = [];
    document.getElementById('r-bar')!.addEventListener('hoops:tabchange', (e) => sources.push((e as CustomEvent).detail.source));
    window.history.replaceState(null, '', '/#r-in-heim');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(selected()).toEqual(['heim']);
    expect(sources).toEqual(['hash']);
  });
  it('nach destroy hört die Leiste nicht mehr auf hashchange', () => {
    const h = start(tabsMarkup(), { hash: true });
    h.destroy();
    window.history.replaceState(null, '', '/#r-p-ausw');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect(document.getElementById('r-ausw')!.getAttribute('aria-selected')).not.toBe('true');
  });
});

describe('mehrere Leisten, init mehrfach, destroy', () => {
  const two = tabsMarkup('', 'a') + tabsMarkup('', 'b');
  it('zwei Leisten arbeiten unabhängig, auch bei gleicher Tab-Beschriftung', () => {
    mountHtml(two);
    handles.push(initTabs(document.getElementById('a-bar')!), initTabs(document.getElementById('b-bar')!));
    keydown(tab('alle', 'a'), 'ArrowRight');
    expect(selected('a')).toEqual(['heim']);
    expect(selected('b')).toEqual(['alle']);
    expect(panel('alle', 'b').hidden).toBe(false);
    expect(panel('heim', 'b').hidden).toBe(true);
  });
  it('eine verschachtelte Leiste im Panel gehört nicht zur äußeren', () => {
    const inner = `<div class="hoops-tabs" id="i-bar"><button class="hoops-tab" id="i1">1</button><button class="hoops-tab" id="i2">2</button></div>`;
    start(tabsMarkup().replace('<p>Alle 12 Spiele</p>', `<p>Alle 12 Spiele</p>${inner}`));
    handles.push(initTabs(document.getElementById('i-bar')!));
    keydown(document.getElementById('i1')!, 'ArrowRight');
    expect(document.getElementById('i2')!.getAttribute('aria-selected')).toBe('true');
    expect(selected()).toEqual(['alle']);
    expect(document.getElementById('r-bar')!.querySelectorAll('[role="tab"]')).toHaveLength(4);
  });
  it('init zweimal für dieselbe Leiste: nur ein Listener, ein Ereignis je Wechsel', () => {
    mountHtml(tabsMarkup());
    const bar = document.getElementById('r-bar')!;
    handles.push(initTabs(bar));
    handles.push(initTabs(bar));
    const spy = vi.fn();
    bar.addEventListener('hoops:tabchange', spy);
    keydown(tab('alle'), 'ArrowRight');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(selected()).toEqual(['heim']);
  });
  it('destroy stellt das Markup wieder her und löst die Listener', () => {
    mountHtml(tabsMarkup());
    const before = document.body.innerHTML;
    const h = initTabs(document.getElementById('r-bar')!);
    keydown(tab('alle'), 'ArrowRight');
    h.destroy();
    h.destroy();
    expect(document.body.innerHTML).toBe(before);
    keydown(tab('alle'), 'ArrowRight');
    expect(document.body.innerHTML).toBe(before);
  });
  it('destroy entfernt ergänzte Rollen und ids wieder', () => {
    mountHtml(`<div class="hoops-tabs" id="r-bar"><button class="hoops-tab">A</button><button class="hoops-tab">B</button></div>`);
    const before = document.body.innerHTML;
    initTabs(document.getElementById('r-bar')!).destroy();
    expect(document.body.innerHTML).toBe(before);
  });
  it('nach destroy ist ein erneutes init möglich', () => {
    mountHtml(tabsMarkup());
    const bar = document.getElementById('r-bar')!;
    initTabs(bar).destroy();
    handles.push(initTabs(bar));
    keydown(tab('alle'), 'ArrowRight');
    expect(selected()).toEqual(['heim']);
  });
});

describe('bösartige Eingaben', () => {
  it('Beschriftungen mit Markup bleiben Text, es entsteht kein neues Element', () => {
    const evil = '<img src=x onerror=alert(1)>';
    start(tabsMarkup().replace('Heim</span>', `${evil.replace(/</g, '&lt;')}</span>`));
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(tab('heim').textContent).toContain('<img');
  });
  it('ein Anker mit Sonderzeichen oder fehlerhafter Kodierung wirft nicht', () => {
    for (const h of ['#%E0%A4%A', '#"><img src=x>', '#__proto__', '#']) {
      window.history.replaceState(null, '', `/${h}`);
      expect(() => start(tabsMarkup(), { hash: true })).not.toThrow();
      handles.pop()!.destroy();
    }
  });
  it('Optionen aus Müll (null, Zahl, Liste) fallen auf Standard zurück', () => {
    for (const o of [null, 7, [], 'x']) {
      start(tabsMarkup(), o as never);
      expect(selected()).toEqual(['alle']);
      handles.pop()!.destroy();
    }
  });
  it('aria-controls zeigt auf die Leiste selbst oder einen anderen Tab: kein Absturz, kein Verstecken', () => {
    start(tabsMarkup().replace('aria-controls="r-p-alle"', 'aria-controls="r-bar"').replace('aria-controls="r-p-heim"', 'aria-controls="r-alle"'));
    expect(document.getElementById('r-bar')!.hidden).toBe(false);
    expect(tab('alle').hidden).toBe(false);
  });
});

describe('Deep-Link in einem geschlossenen Bereich', () => {
  const inDetails = `<details id="d"><summary>Mehr</summary>${tabsMarkup()}</details>`;
  it('der Anker auf ein Panel öffnet das umgebende details und wählt den Tab', () => {
    window.history.replaceState(null, '', '/#r-p-ausw');
    start(inDetails, { hash: true });
    expect((document.getElementById('d') as HTMLDetailsElement).open).toBe(true);
    expect(selected()).toEqual(['ausw']);
  });
  it('hashchange öffnet den Bereich ebenfalls', () => {
    start(inDetails, { hash: true });
    expect((document.getElementById('d') as HTMLDetailsElement).open).toBe(false);
    window.history.replaceState(null, '', '/#r-in-heim');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    expect((document.getElementById('d') as HTMLDetailsElement).open).toBe(true);
    expect(selected()).toEqual(['heim']);
  });
  it('ohne Anker bleibt der Bereich geschlossen', () => {
    start(inDetails, { hash: true });
    expect((document.getElementById('d') as HTMLDetailsElement).open).toBe(false);
  });
});
