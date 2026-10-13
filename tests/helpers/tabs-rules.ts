// Regeln für Tabs (js/tabs.js) als prüfbare Aussagen: tests/tabs-rules.test.ts prüft sie am echten Quelltext, tests/vanilla-mutation-v1b.test.ts
// verfälscht den Quelltext und prüft, dass jede Aussage kippt. Läuft unter jsdom.
import { trapErrors, type Rules } from './mutation';
import { tabsMarkup } from './tabs-markup';

type Tabs = {
  nextTab: (i: number, k: string, t: unknown[], o?: Record<string, unknown>) => number;
  initTabs: (el: Element, o?: Record<string, unknown>) => { destroy(): void; select(t: unknown): void; getValue(): unknown };
};

export function tabsLogicRules(mod: Tabs): Rules {
  const out: Rules = {};
  const four = [false, false, true, false];
  const key = (id: string, k: string, init: KeyboardEventInit = {}) => document.getElementById(id)!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
  const attr = (id: string, name: string) => document.getElementById(id)!.getAttribute(name);
  const rule = (name: string, fn: () => unknown, html = tabsMarkup(), options: Record<string, unknown> = {}, hash = '/') => {
    window.history.replaceState(null, '', hash);
    document.body.replaceChildren(document.createRange().createContextualFragment(html));
    let handle: { destroy(): void } | undefined;
    const trap = trapErrors();
    try {
      handle = mod.initTabs(document.getElementById('r-bar') ?? document.querySelector('.dss-tabs')!, options);
      out[name] = fn() === true;
    } catch {
      out[name] = false;
    } finally {
      try {
        handle?.destroy();
      } catch {
        // verfälschte Quelle
      }
      if (trap.stop().length) out[name] = false; // eine Ausnahme im Listener der (verfälschten) Quelle verletzt die Regel
      document.body.replaceChildren();
      window.history.replaceState(null, '', '/');
    }
  };
  const pure = (name: string, fn: () => unknown) => { try { out[name] = fn() === true; } catch { out[name] = false; } };

  pure('Tabs: Pfeil rechts wählt den Nachbarn und überspringt gesperrte', () => mod.nextTab(0, 'ArrowRight', four) === 1 && mod.nextTab(1, 'ArrowRight', four) === 3 && mod.nextTab(3, 'ArrowLeft', four) === 1);
  pure('Tabs: am Rand geht es von vorn weiter', () => mod.nextTab(3, 'ArrowRight', four) === 0 && mod.nextTab(0, 'ArrowLeft', four) === 3);
  pure('Tabs: wrap false hält an den Rändern', () => mod.nextTab(3, 'ArrowRight', four, { wrap: false }) === 3);
  pure('Tabs: Pos1 und Ende springen auf den ersten und letzten nicht gesperrten', () => mod.nextTab(2, 'Home', [true, false, false, false]) === 1 && mod.nextTab(0, 'End', [false, false, false, true]) === 2);
  pure('Tabs: senkrecht nutzt auf/ab und ignoriert rechts/links', () => mod.nextTab(0, 'ArrowDown', four, { vertical: true }) === 1 && mod.nextTab(0, 'ArrowRight', four, { vertical: true }) === 0);
  pure('Tabs: RTL kehrt links/rechts um', () => mod.nextTab(0, 'ArrowLeft', four, { rtl: true }) === 1 && mod.nextTab(1, 'ArrowRight', four, { rtl: true }) === 0);
  pure('Tabs: andere Tasten und Müll ergeben den Index', () => mod.nextTab(1, 'a', four) === 1 && mod.nextTab(9, 'ArrowRight', four) === 9 && mod.nextTab(0, 'ArrowRight', [] as never) === 0);

  rule('Tabs: Pfeil wählt, fokussiert und folgt mit roving tabindex', () => {
    key('r-alle', 'ArrowRight');
    return attr('r-heim', 'aria-selected') === 'true' && attr('r-alle', 'aria-selected') === 'false' && attr('r-heim', 'tabindex') === '0' && attr('r-alle', 'tabindex') === '-1' && document.activeElement === document.getElementById('r-heim');
  });
  rule('Tabs: Panels folgen mit hidden und inert', () => {
    key('r-alle', 'ArrowRight');
    const p = (id: string) => document.getElementById(id)!;
    return !p('r-p-heim').hidden && !p('r-p-heim').hasAttribute('inert') && p('r-p-alle').hidden && p('r-p-alle').hasAttribute('inert');
  });
  rule('Tabs: Pfeil mit Strg bleibt dem Browser', () => !key('r-alle', 'ArrowRight', { ctrlKey: true }) === false && attr('r-alle', 'aria-selected') === 'true');
  rule('Tabs: manuelle Aktivierung bewegt nur den Fokus', () => {
    key('r-alle', 'ArrowRight');
    return attr('r-alle', 'aria-selected') === 'true' && document.activeElement === document.getElementById('r-heim');
  }, tabsMarkup(), { activation: 'manual' });
  rule('Tabs: ein Klick wählt, ein gesperrter Tab nicht', () => {
    document.getElementById('r-aus')!.click();
    const stay = attr('r-alle', 'aria-selected') === 'true';
    document.getElementById('r-ausw')!.click();
    return stay && attr('r-ausw', 'aria-selected') === 'true';
  }, tabsMarkup().replace(' disabled>', ' aria-disabled="true">'));
  rule('Tabs: ein Klick auf den gewählten Tab meldet nichts', () => {
    let n = 0;
    document.getElementById('r-bar')!.addEventListener('dss:tabchange', () => n++);
    document.getElementById('r-alle')!.click();
    return n === 0;
  });
  rule('Tabs: Ereignis dss:tabchange mit Detail, nicht beim Start', () => {
    const seen: Array<{ index: number; source: string }> = [];
    document.getElementById('r-bar')!.addEventListener('dss:tabchange', (e) => seen.push((e as CustomEvent).detail));
    key('r-alle', 'ArrowRight');
    return seen.length === 1 && seen[0].index === 1 && seen[0].source === 'user';
  });
  rule('Tabs: Deep-Link wählt den Tab zu einem Panel', () => attr('r-ausw', 'aria-selected') === 'true', tabsMarkup(), { hash: true }, '/#r-p-ausw');
  rule('Tabs: Deep-Link auf ein Element im Panel wählt dessen Tab', () => attr('r-heim', 'aria-selected') === 'true', tabsMarkup(), { hash: true }, '/#r-in-heim');
  rule('Tabs: ohne hash bleibt der Anker unbeachtet', () => attr('r-alle', 'aria-selected') === 'true', tabsMarkup(), {}, '/#r-p-ausw');
  rule('Tabs: eine Wahl schreibt den Anker nur mit hash', () => {
    key('r-alle', 'ArrowRight');
    return window.location.hash === '#r-p-heim';
  }, tabsMarkup(), { hash: true });
  rule('Tabs: ohne hash schreibt eine Wahl keinen Anker', () => {
    key('r-alle', 'ArrowRight');
    return window.location.hash === '';
  });
  rule('Tabs: Mehrfachauswahl schaltet um und kennt keine Pfeiltasten', () => {
    key('m-liga', 'ArrowRight');
    document.getElementById('m-pokal')!.click();
    const both = attr('m-pokal', 'aria-pressed') === 'true' && attr('m-liga', 'aria-pressed') === 'true';
    document.getElementById('m-liga')!.click();
    return both && attr('m-liga', 'aria-pressed') === 'false' && !document.getElementById('m-liga')!.hasAttribute('role') && document.activeElement !== document.getElementById('m-pokal');
  }, `<div class="dss-tabs" role="group" id="r-bar"><button class="dss-tab is-active" id="m-liga" aria-pressed="true">L</button><button class="dss-tab" id="m-pokal" aria-pressed="false">P</button></div>`);
  rule('Tabs: eine verschachtelte Leiste gehört nicht zur äußeren', () => {
    key('o2', 'ArrowRight');
    return attr('o1', 'aria-selected') === 'true' && !document.getElementById('i1')!.hasAttribute('role') && !document.getElementById('i1')!.hasAttribute('aria-selected');
  }, `<div class="dss-tabs" id="r-bar"><button class="dss-tab" id="o1">1</button><button class="dss-tab" id="o2">2</button><div class="dss-tabs" id="i-bar"><button class="dss-tab" id="i1">a</button><button class="dss-tab" id="i2">b</button></div></div>`);
  rule('Tabs: fehlende Rollen und ids werden ergänzt', () => attr('a', 'role') === 'tab' && document.getElementById('x')!.getAttribute('role') === 'tablist',
    `<div class="dss-tabs" id="x"><button class="dss-tab" id="a">A</button><button class="dss-tab" id="b">B</button></div>`);
  pure('Tabs: ohne id vergibt der Baustein eine', () => {
    document.body.replaceChildren(document.createRange().createContextualFragment(`<div class="dss-tabs" id="x"><button class="dss-tab">A</button><button class="dss-tab">B</button></div>`));
    const h = mod.initTabs(document.getElementById('x')!);
    const ids = [...document.querySelectorAll('button')].map((b) => b.id);
    h.destroy();
    document.body.replaceChildren();
    return ids.every((id) => /^dss-tab-\d+$/.test(id)) && new Set(ids).size === 2;
  });
  rule('Tabs: select() wählt per Index, id oder Element und ignoriert gesperrte', () => {
    const h = mod.initTabs(document.getElementById('r-bar')!);
    h.select(3);
    const a = attr('r-ausw', 'aria-selected') === 'true';
    h.select('r-heim');
    h.select(2);
    return a && h.getValue() === 'r-heim';
  });
  rule('Tabs: destroy stellt das Markup wieder her', () => {
    const before = document.body.innerHTML;
    const h = mod.initTabs(document.getElementById('r-bar')!);
    key('r-alle', 'ArrowRight');
    h.destroy();
    return document.body.innerHTML === before;
  });
  rule('Tabs: ein zweiter Aufruf ersetzt den ersten (ein Ereignis je Wechsel)', () => {
    const second = mod.initTabs(document.getElementById('r-bar')!);
    try {
      let n = 0;
      document.getElementById('r-bar')!.addEventListener('dss:tabchange', () => n++);
      key('r-alle', 'ArrowRight');
      return n === 1;
    } finally {
      second.destroy();
    }
  });
  rule('Tabs: ein Deep-Link öffnet das umgebende details', () => (document.getElementById('d') as HTMLDetailsElement).open && attr('r-ausw', 'aria-selected') === 'true',
    `<details id="d"><summary>Mehr</summary>${tabsMarkup()}</details>`, { hash: true }, '/#r-p-ausw');
  return out;
}
