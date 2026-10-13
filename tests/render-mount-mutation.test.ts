// Mutationstests für js/render/mount.js (unter jsdom): Fokus, Zustand offen/zu, destroy, Gruppe, Ereignisse, Ersetzen.
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { renderTable } from '../js/render/table.js';
import { mutate, read, type Rules } from './helpers/mutation';

type MountFn = (el: Element, render: (p: object, o: object) => string, props: object, options?: object) => { update(p: object): void; destroy(): void };
const url = (file: string) => pathToFileURL(resolve(process.cwd(), file)).href;

async function load(source: string): Promise<MountFn> {
  const code = source.replace(/from '\.\.\/([\w-]+\.js)'/g, (_m, f: string) => `from '${url(`js/${f}`)}'`);
  const mod = await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  return mod.mount as MountFn;
}
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

function rules(mount: MountFn): Rules {
  const R: Rules = {};
  const run = (name: string, fn: (host: HTMLElement) => boolean) => {
    const host = document.createElement('div');
    document.body.append(host);
    try {
      R[name] = fn(host) === true;
    } catch {
      R[name] = false;
    } finally {
      document.body.replaceChildren();
      window.history.replaceState(null, '', window.location.pathname); // ein Klick schreibt den Anker in die Adresse
    }
  };
  const props = { title: 'Tabelle', id: 'tab', collapsible: true, rows: [[{ text: 'a', href: '/a' }]] };

  run('mount: Fokus bleibt bei update erhalten', (host) => {
    const h = mount(host, renderTable as never, props);
    host.querySelector<HTMLElement>('#tab-trigger')!.focus();
    h.update({ ...props, rows: [[{ text: 'b', href: '/b' }]] });
    return document.activeElement === host.querySelector('#tab-trigger') && host.querySelector('a')?.textContent === 'b';
  });
  run('mount: Fokus findet den Knoten über die id, auch wenn sich die Lage ändert', (host) => {
    const render = ((p: { shift?: boolean }) => (p.shift ? '<div><button id="a0">a</button><p>x</p><button id="b">b</button></div>' : '<div><button id="a0">a</button><button id="b">b</button></div>')) as never;
    const h = mount(host, render, {});
    host.querySelector<HTMLElement>('#b')!.focus();
    h.update({ shift: true });
    return document.activeElement === host.querySelector('#b') && document.activeElement?.id === 'b';
  });
  run('mount: der Zustand offen/zu bleibt bei gleichem open erhalten, ein geändertes open gilt', (host) => {
    const h = mount(host, renderTable as never, props);
    click(host.querySelector('#tab-trigger')!);
    const opened = host.querySelector('#tab-trigger')!.getAttribute('aria-expanded') === 'true';
    h.update({ ...props, caption: 'x' });
    const kept = host.querySelector('#tab-trigger')!.getAttribute('aria-expanded') === 'true';
    h.update({ ...props, open: false });
    return opened && kept && host.querySelector('#tab-trigger')!.getAttribute('aria-expanded') === 'false';
  });
  run('mount: ohne Gruppe legt mount eine an und bedient den Rahmen', (host) => {
    mount(host, renderTable as never, props);
    click(host.querySelector('#tab-trigger')!);
    return host.querySelector(':scope > .dss-acc') !== null && host.querySelector<HTMLElement>('#tab-panel')!.hidden === false;
  });
  run('mount: im Panel eines fremden Bereichs bekommt der Rahmen eine eigene Gruppe', (host) => {
    host.className = 'dss-acc';
    host.append(document.createRange().createContextualFragment('<div class="dss-acc-item"><div class="dss-acc-panel"><div id="inner"></div></div></div>'));
    const inner = host.querySelector<HTMLElement>('#inner')!;
    mount(inner, renderTable as never, props);
    click(inner.querySelector('#tab-trigger')!);
    return inner.querySelector(':scope > .dss-acc') !== null && inner.querySelector('#tab-trigger')!.getAttribute('aria-expanded') === 'true';
  });
  run('mount: gleiches Markup bei update ersetzt nichts, die Scrollposition bleibt bei geändertem', (host) => {
    const h = mount(host, renderTable as never, { title: 'T', rows: [['a']] });
    const before = host.querySelector('table');
    h.update({ title: 'T', rows: [['a']] });
    const same = host.querySelector('table') === before;
    host.querySelector<HTMLElement>('.dss-table-scroll')!.scrollLeft = 40;
    h.update({ title: 'T', rows: [['b']] });
    return same && host.querySelector('table') !== before && host.querySelector<HTMLElement>('.dss-table-scroll')!.scrollLeft === 40;
  });
  run('mount: style-Attribute werden über das CSSOM gesetzt, nicht als Attribut', (host) => {
    mount(host, ((p: object) => `<div id="d" style="left:10%;top:20%"></div><div id="e" style="color:red;left:1px"></div>${JSON.stringify(p) ? '' : ''}`) as never, {});
    const d = host.querySelector<HTMLElement>('#d')!;
    const e = host.querySelector<HTMLElement>('#e')!;
    return d.style.left === '10%' && d.style.top === '20%' && !d.hasAttribute('data-dss-style') && e.style.color === '' && e.style.left === '1px';
  });
  run('mount: ein Ereignis außerhalb von el (Vorfahr passt zum Selektor) löst den Handler nicht aus', (host) => {
    host.className = 'x';
    const inner = document.createElement('div');
    host.append(inner);
    let calls = 0;
    mount(inner, (() => '<span id="s">s</span>') as never, {}, { on: [{ type: 'click', selector: '.x', handler: () => { calls += 1; } }] });
    click(inner.querySelector('#s')!);
    return calls === 0;
  });
  run('mount: in einer vorhandenen Gruppe keine zweite', (host) => {
    host.className = 'dss-acc';
    mount(host, renderTable as never, props);
    return host.querySelector('.dss-acc') === null;
  });
  run('mount: destroy stellt den früheren Inhalt wieder her', (host) => {
    host.append(document.createRange().createContextualFragment('<p id="alt">alt</p>'));
    const h = mount(host, renderTable as never, props);
    const gone = host.querySelector('#alt') === null;
    h.destroy();
    return gone && host.querySelector('#alt') !== null && host.querySelector('.dss-frame') === null;
  });
  run('mount: destroy baut das Accordion ab (Klick bleibt ohne Wirkung)', (host) => {
    const h = mount(host, renderTable as never, props);
    const group = host.querySelector<HTMLElement>('.dss-acc')!;
    h.destroy();
    host.append(group); // die abgeräumte Gruppe wieder einsetzen: ohne Verhalten bleibt der Klick wirkungslos
    click(group.querySelector('#tab-trigger')!);
    return group.querySelector('#tab-trigger')!.getAttribute('aria-expanded') === 'false';
  });
  run('mount: destroy entfernt delegierte Ereignisse', (host) => {
    let calls = 0;
    const h = mount(host, (() => '<button class="x">x</button>') as never, {}, { on: [{ type: 'click', selector: '.x', handler: () => { calls += 1; } }] });
    const button = host.querySelector('.x')!;
    host.append(button);
    click(button);
    h.destroy();
    host.append(button);
    click(button);
    return calls === 1;
  });
  run('mount: ein zweites mount ersetzt das erste', (host) => {
    let first = 0;
    let second = 0;
    const render = (() => '<button class="x">x</button>') as never;
    mount(host, render, {}, { on: [{ type: 'click', selector: '.x', handler: () => { first += 1; } }] });
    mount(host, render, {}, { on: [{ type: 'click', selector: '.x', handler: () => { second += 1; } }] });
    click(host.querySelector('.x')!);
    return first === 0 && second === 1;
  });
  run('mount: update nach destroy ändert nichts', (host) => {
    const h = mount(host, ((p: { v?: boolean }) => (p.v ? '<p>neu</p>' : '<i></i>')) as never, {});
    h.destroy();
    h.update({ v: true });
    return host.querySelector('p') === null;
  });
  run('mount: uid gleich bei update (ids bleiben stabil)', (host) => {
    const noId = { title: 'T', collapsible: true, rows: [] };
    const h = mount(host, renderTable as never, noId);
    const before = host.querySelector('.dss-acc-trigger')!.id;
    h.update({ ...noId, title: 'Anderer Titel' });
    return before !== '' && host.querySelector('.dss-acc-trigger')!.id === before;
  });
  return R;
}

const source = read('js/render/mount.js');
const MUTATIONS: { name: string; rule: string; from: string; to: string; after?: string }[] = [
  { name: 'Fokus nicht zurückgegeben', rule: 'mount: Fokus bleibt bei update erhalten', from: 'restoreFocus(wrapper ?? el, memo);', to: '' },
  { name: 'Fokus nicht über die id', rule: 'mount: Fokus findet den Knoten über die id, auch wenn sich die Lage ändert', from: "if (memo.id) target = [...host.querySelectorAll('[id]')].find((el) => el.id === memo.id) ?? null;", to: '' },
  { name: 'Zustand wird nicht gehalten', rule: 'mount: der Zustand offen/zu bleibt bei gleichem open erhalten, ein geändertes open gilt', from: 'if (live !== undefined && next.open === previous.open) props = { ...next, open: live };', to: '' },
  { name: 'open-Änderung wird ignoriert', rule: 'mount: der Zustand offen/zu bleibt bei gleichem open erhalten, ein geändertes open gilt', from: 'next.open === previous.open', to: 'true' },
  { name: 'keine eigene Gruppe', rule: 'mount: ohne Gruppe legt mount eine an und bedient den Rahmen', from: 'if (!group) return true;', to: 'if (!group) return false;' },
  { name: 'Panel ignoriert', rule: 'mount: im Panel eines fremden Bereichs bekommt der Rahmen eine eigene Gruppe', from: 'return Boolean(panel) && panel.closest(`.${GROUP}`) === group && group !== el;', to: 'return false;' },
  { name: 'identisches Markup wird ersetzt', rule: 'mount: gleiches Markup bei update ersetzt nichts, die Scrollposition bleibt bei geändertem', from: 'if (previous && html === lastHtml && wantsGroup === Boolean(wrapper)) {', to: 'if (false) {' },
  { name: 'Scrollposition geht verloren', rule: 'mount: gleiches Markup bei update ersetzt nichts, die Scrollposition bleibt bei geändertem', from: 'restoreScrolls(wrapper ?? el, scrolls);', to: '' },
  { name: 'style bleibt Attribut', rule: 'mount: style-Attribute werden über das CSSOM gesetzt, nicht als Attribut', from: "host.replaceChildren(range.createContextualFragment(deferStyles(html)));\n    applyStyles(host);", to: 'host.replaceChildren(range.createContextualFragment(html));' },
  { name: 'beliebige Eigenschaften', rule: 'mount: style-Attribute werden über das CSSOM gesetzt, nicht als Attribut', from: 'if (STYLE_PROPS.has(name) && ', to: 'if (' },
  { name: 'Handler ohne el.contains', rule: 'mount: ein Ereignis außerhalb von el (Vorfahr passt zum Selektor) löst den Handler nicht aus', from: 'if (target && el.contains(target)) rule.handler(event, target);', to: 'if (target) rule.handler(event, target);' },
  { name: 'Accordion nicht gestartet', rule: 'mount: ohne Gruppe legt mount eine an und bedient den Rahmen', from: 'if (wantsGroup && !accordion) accordion = initAccordion(wrapper);', to: '' },
  { name: 'immer eine Gruppe', rule: 'mount: in einer vorhandenen Gruppe keine zweite', from: 'if (!next.collapsible) return false;', to: 'if (!next.collapsible) return false;\n    if (true) return true;' },
  { name: 'Inhalt nicht wiederhergestellt', rule: 'mount: destroy stellt den früheren Inhalt wieder her', from: 'el.replaceChildren(...original);', to: 'el.replaceChildren();' },
  { name: 'Markup bleibt nach destroy', rule: 'mount: destroy stellt den früheren Inhalt wieder her', from: 'el.replaceChildren(...original);', to: '' },
  { name: 'Accordion bleibt nach destroy', rule: 'mount: destroy baut das Accordion ab (Klick bleibt ohne Wirkung)', from: '    done = true;\n    accordion?.destroy();', to: '    done = true;' },
  { name: 'Ereignisse bleiben', rule: 'mount: destroy entfernt delegierte Ereignisse', from: 'cleanups.push(() => el.removeEventListener(rule.type, listener));', to: '' },
  { name: 'altes mount bleibt', rule: 'mount: ein zweites mount ersetzt das erste', from: 'registry.release(el);', to: '' },
  { name: 'update nach destroy wirkt', rule: 'mount: update nach destroy ändert nichts', from: 'if (done) return;', to: '' },
  { name: 'uid wechselt je update', rule: 'mount: uid gleich bei update (ids bleiben stabil)', from: "render(props, { ...renderOptions, uid })", to: "render(props, { ...renderOptions, uid: `m${++counter}` })" },
];

afterEach(() => {
  document.body.replaceChildren();
  window.history.replaceState(null, '', window.location.pathname);
});

describe('Mutationstests: mount', () => {
  it('Ausgangslage: alle Aussagen gelten', async () => {
    const all = rules(await load(source));
    expect(Object.entries(all).filter(([, ok]) => !ok).map(([name]) => name)).toEqual([]);
  });
  it.each(MUTATIONS)('$name', async ({ rule, from, to }) => {
    expect(rules(await load(source))[rule], `Regel fehlt: ${rule}`).toBe(true);
    const mutated = rules(await load(mutate(source, from, to)));
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
