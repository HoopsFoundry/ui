// Mutationstests für Tabs, Modal und initAll (Vanilla-Paket V1b): Jede Regel muss kippen, wenn man den Quelltext gezielt verfälscht.
import { describe, expect, it } from 'vitest';
import { loadModule, mutate, read } from './helpers/mutation';
import { modalLogicRules } from './helpers/modal-rules';
import { tabsLogicRules } from './helpers/tabs-rules';
import { tabsModalCoreRules } from './helpers/tabs-modal-core-rules';
import { polyfillDialog, removeDialogPolyfill } from './helpers/modal-markup';

type Mutation = { name: string; rule: string; from: string; to: string };
const tabsJs = read('js/tabs.js');
const modalJs = read('js/modal.js');
const coreJs = read('js/vanilla-core.js');

const TABS: Mutation[] = [
  { name: 'Pfeil rechts geht nach links', rule: 'Tabs: Pfeil rechts wählt den Nachbarn und überspringt gesperrte', from: "const step = key === forward ? 1 : -1;", to: "const step = key === forward ? -1 : 1;" },
  { name: 'gesperrte werden nicht übersprungen', rule: 'Tabs: Pfeil rechts wählt den Nachbarn und überspringt gesperrte', from: "if (!isOff(tabs[next])) return next;", to: "return next;" },
  { name: 'kein Umlauf', rule: 'Tabs: am Rand geht es von vorn weiter', from: "if (!wrap) return index;", to: "return index;" },
  { name: 'wrap false wird ignoriert', rule: 'Tabs: wrap false hält an den Rändern', from: "if (!wrap) return index;", to: "" },
  { name: 'Pos1 nimmt gesperrte', rule: 'Tabs: Pos1 und Ende springen auf den ersten und letzten nicht gesperrten', from: "const first = tabs.findIndex((tab) => !isOff(tab));", to: "const first = 0;" },
  { name: 'Ende nimmt gesperrte', rule: 'Tabs: Pos1 und Ende springen auf den ersten und letzten nicht gesperrten', from: "for (let i = tabs.length - 1; i >= 0; i--) if (!isOff(tabs[i])) return i;", to: "return tabs.length - 1;" },
  { name: 'senkrecht ohne ab/auf', rule: 'Tabs: senkrecht nutzt auf/ab und ignoriert rechts/links', from: "const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';", to: "const forward = rtl ? 'ArrowLeft' : 'ArrowRight';" },
  { name: 'RTL ohne Wirkung', rule: 'Tabs: RTL kehrt links/rechts um', from: "const forward = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';", to: "const forward = vertical ? 'ArrowDown' : 'ArrowRight';" },
  { name: 'Tabs mit Tastendruck a springen', rule: 'Tabs: andere Tasten und Müll ergeben den Index', from: "if (key !== forward && key !== backward) return index;", to: "" },
  { name: 'kein roving tabindex', rule: 'Tabs: Pfeil wählt, fokussiert und folgt mit roving tabindex', from: "tab.setAttribute('tabindex', on ? '0' : '-1');", to: "" },
  { name: 'kein Fokus nach der Wahl', rule: 'Tabs: Pfeil wählt, fokussiert und folgt mit roving tabindex', from: "if (focus) tabs[index].focus();", to: "" },
  { name: 'Panel nur hidden', rule: 'Tabs: Panels folgen mit hidden und inert', from: "else panel.setAttribute('inert', '');", to: "" },
  { name: 'Panel nur inert', rule: 'Tabs: Panels folgen mit hidden und inert', from: "panel.hidden = !on;", to: "" },
  { name: 'Strg + Pfeil wird abgefangen', rule: 'Tabs: Pfeil mit Strg bleibt dem Browser', from: "event.altKey || event.ctrlKey || event.metaKey || event.shiftKey", to: "event.altKey || event.metaKey || event.shiftKey" },
  { name: 'manuell wählt sofort', rule: 'Tabs: manuelle Aktivierung bewegt nur den Fokus', from: "if (manual) tabs[next].focus();", to: "if (false) tabs[next].focus();" },
  { name: 'Klick auf gesperrten Tab wählt', rule: 'Tabs: ein Klick wählt, ein gesperrter Tab nicht', from: "|| disabledOf(tabs[index])) return;", to: ") return;" },
  { name: 'kein Ereignis', rule: 'Tabs: Ereignis hoops:tabchange mit Detail, nicht beim Start', from: "root.dispatchEvent(new CustomEvent(TAB_EVENT, { bubbles: true, detail }));", to: "" },
  { name: 'Ereignis auch ohne Änderung', rule: 'Tabs: ein Klick auf den gewählten Tab meldet nichts', from: "if (!changed) return;", to: "" },
  { name: 'Deep-Link ignoriert', rule: 'Tabs: Deep-Link wählt den Tab zu einem Panel', from: "const hashed = fromHash();\n    current", to: "const hashed = -1;\n    current" },
  { name: 'Deep-Link nur auf Tabs', rule: 'Tabs: Deep-Link wählt den Tab zu einem Panel', from: "return tabs.findIndex((tab, i) => tab.id === hit || panels[i]?.id === hit);", to: "return tabs.findIndex((tab) => tab.id === hit);" },
  { name: 'Deep-Link ohne Element im Panel', rule: 'Tabs: Deep-Link auf ein Element im Panel wählt dessen Tab', from: "return el ? panels.findIndex((panel) => panel && panel.contains(el)) : -1;", to: "return -1;" },
  { name: 'Anker gilt auch ohne hash', rule: 'Tabs: ohne hash bleibt der Anker unbeachtet', from: "const withHash = opts.hash === true && !multi;", to: "const withHash = !multi;" },
  { name: 'Wahl schreibt keinen Anker', rule: 'Tabs: eine Wahl schreibt den Anker nur mit hash', from: "if (withHash && target) writeHash(target, true);", to: "" },
  { name: 'Wahl schreibt immer den Anker', rule: 'Tabs: ohne hash schreibt eine Wahl keinen Anker', from: "if (withHash && target) writeHash(target, true);", to: "if (target) writeHash(target, true);" },
  { name: 'Mehrfachauswahl wählt einzeln', rule: 'Tabs: Mehrfachauswahl schaltet um und kennt keine Pfeiltasten', from: "tabs[index].setAttribute('aria-pressed', String(!pressed(tabs[index])));", to: "tabs[index].setAttribute('aria-pressed', 'true');" },
  { name: 'Mehrfachauswahl mit Pfeilen', rule: 'Tabs: Mehrfachauswahl schaltet um und kennt keine Pfeiltasten', from: "if (multi) return; // jeder Schalter", to: "// jeder Schalter" },
  { name: 'verschachtelte Leiste zählt mit', rule: 'Tabs: eine verschachtelte Leiste gehört nicht zur äußeren', from: ".filter((tab) => barOf(tab) === root);", to: ";" },
  { name: 'Rolle wird nicht ergänzt', rule: 'Tabs: fehlende Rollen und ids werden ergänzt', from: "if (!root.hasAttribute('role')) root.setAttribute('role', 'tablist');", to: "" },
  { name: 'ids werden nicht vergeben', rule: 'Tabs: ohne id vergibt der Baustein eine', from: "if (!tab.id) tab.id = `hoops-tab-${++uid}`;", to: "" },
  { name: 'select ignoriert gesperrte', rule: 'Tabs: select() wählt per Index, id oder Element und ignoriert gesperrte', from: "|| disabledOf(tabs[index])) return;", to: ") return;" },
  { name: 'destroy lässt Attribute stehen', rule: 'Tabs: destroy stellt das Markup wieder her', from: "cleanups.add(snapshotAttributes(tab, ['role', 'aria-selected', 'aria-pressed', 'tabindex', 'id', 'class']));", to: "" },
  { name: 'destroy lässt Panels stehen', rule: 'Tabs: destroy stellt das Markup wieder her', from: "cleanups.add(snapshotAttributes(panel, ['role', 'aria-labelledby', 'hidden', 'inert']));", to: "" },
  { name: 'zweiter Aufruf ersetzt nicht', rule: 'Tabs: ein zweiter Aufruf ersetzt den ersten (ein Ereignis je Wechsel)', from: "registry.release(root);", to: "" },
  { name: 'Deep-Link öffnet nichts', rule: 'Tabs: ein Deep-Link öffnet das umgebende details', from: "      revealAround(goal); // liegt die Leiste", to: "      void 0; // liegt die Leiste" },
];

const MODAL: Mutation[] = [
  { name: 'Fokus bleibt draußen', rule: 'Modal: Öffnen holt den Fokus auf die Fläche und gibt ihn beim Schließen an den Auslöser zurück', from: "focusTarget().focus({ preventScroll: true });", to: "" },
  { name: 'Fokus kehrt nicht zurück', rule: 'Modal: Öffnen holt den Fokus auf die Fläche und gibt ihn beim Schließen an den Auslöser zurück', from: "if (usable(target)) target.focus();", to: "if (false) target.focus();" },
  { name: 'Fokusziel ignoriert', rule: 'Modal: data-hoops-modal-focus bekommt den Fokus', from: "?? root.querySelector('[data-hoops-modal-focus], [autofocus]') ?? surface;", to: "?? surface;" },
  { name: 'Escape ohne Wirkung', rule: 'Modal: Escape schließt', from: "if (closable) close('escape');", to: "" },
  { name: 'Escape ignoriert closable', rule: 'Modal: closable false: Escape schließt nicht, der Schließen-Knopf schon', from: "if (closable) close('escape');", to: "close('escape');" },
  { name: 'Schließen-Knopf gehorcht closable', rule: 'Modal: closable false: Escape schließt nicht, der Schließen-Knopf schon', from: "close('close-button');", to: "if (closable) close('close-button');" },
  { name: 'Hintergrund schließt immer', rule: 'Modal: ein Klick auf den Hintergrund schließt standardmäßig nicht', from: "if (dismissOnBackdrop && closable && downOnBackdrop && onBackdrop(target)) close('backdrop');", to: "if (closable && downOnBackdrop && onBackdrop(target)) close('backdrop');" },
  { name: 'dismissOnBackdrop ohne Wirkung', rule: 'Modal: mit dismissOnBackdrop schließt der Hintergrund, ein Klick im Modal nicht', from: "const dismissOnBackdrop = opts.dismissOnBackdrop === true;", to: "const dismissOnBackdrop = false;" },
  { name: 'Klick im Modal schließt', rule: 'Modal: mit dismissOnBackdrop schließt der Hintergrund, ein Klick im Modal nicht', from: "const onBackdrop = (target) => target === backdropEl || target === wrapEl || (isDialog && target === root);", to: "const onBackdrop = () => true;" },
  { name: 'Mausdruck wird nicht beachtet', rule: 'Modal: gedrückt im Modal, losgelassen auf dem Hintergrund schließt nicht', from: "downOnBackdrop && onBackdrop(target)", to: "onBackdrop(target)" },
  { name: 'Tab springt nicht weiter (Index bleibt)', rule: 'Modal: Tab von der letzten zur ersten Schaltfläche, Umschalt+Tab zurück', from: "(index + (event.shiftKey ? -1 : 1) + list.length) % list.length;", to: "index;" },
  { name: 'kein Umlauf an den Enden', rule: 'Modal: Tab von der letzten zur ersten Schaltfläche, Umschalt+Tab zurück', from: "+ list.length) % list.length;", to: ") % (list.length * 99);" },
  { name: 'Tab geht nicht über das Modal', rule: 'Modal: Tab geht auch in der Mitte über das Modal auf das nächste Element', from: "    event.preventDefault();\n    const list = focusables(dialogEl);", to: "    const list = focusables(dialogEl);\n    if (list.length) return;" },
  { name: 'Tab von der Fläche wird ignoriert', rule: 'Modal: Tab von der Fläche geht auf das erste Element', from: "const next = index < 0 ? (event.shiftKey ? list.length - 1 : 0)", to: "const next = index < 0 ? (event.shiftKey ? 0 : list.length - 1)" },
  { name: 'Fokus von außen bleibt draußen', rule: 'Modal: Fokus von außen kommt zurück', from: "if (!opened || !isTop() || dialogEl.contains(event.target)) return;\n    (focusables(dialogEl)[0] ?? surface).focus();", to: "return;" },
  { name: 'Hintergrund nicht inert', rule: 'Modal: der Hintergrund wird inert und beim Schließen zurückgebaut', from: "const restore = inertAround(root);", to: "const restore = () => {};" },
  { name: 'inert bleibt stehen', rule: 'Modal: der Hintergrund wird inert und beim Schließen zurückgebaut', from: "for (const sibling of changed) sibling.removeAttribute('inert');", to: "" },
  { name: 'kein aria-modal', rule: 'Modal: role dialog, aria-modal und aria-labelledby aus dem Titel', from: "if (!isDialog) dialogEl.setAttribute('aria-modal', 'true');", to: "" },
  { name: 'keine Beschriftung', rule: 'Modal: role dialog, aria-modal und aria-labelledby aus dem Titel', from: "dialogEl.setAttribute('aria-labelledby', title.id);", to: "" },
  { name: 'startet offen', rule: 'Modal: startet geschlossen', from: "if (!isDialog) root.hidden = true;\n  else", to: "if (false) root.hidden = true;\n  else" },
  { name: 'keine Scroll-Sperre', rule: 'Modal: die Scroll-Sperre setzt overflow hidden und baut zurück', from: "html.style.overflow = 'hidden';", to: "" },
  { name: 'Scroll-Sperre bleibt', rule: 'Modal: die Scroll-Sperre setzt overflow hidden und baut zurück', from: "html.style.overflow = lock.overflow;", to: "" },
  { name: 'Sperre zählt nicht', rule: 'Modal: zwei offene Modals sperren einmal', from: "if (!lock || --lock.count > 0) return;", to: "if (!lock) return;" },
  { name: 'Escape schließt alle', rule: 'Modal: Escape schließt nur das oberste von zwei Modals', from: "if (!opened || !isTop() || event.defaultPrevented) return;", to: "if (!opened || event.defaultPrevented) return;" },
  { name: 'jeder Auslöser öffnet', rule: 'Modal: ein Auslöser öffnet nur das Modal mit seiner id', from: "trigger.getAttribute('data-hoops-modal-open') !== root.id", to: "false" },
  { name: 'kein Schließen-Ereignis', rule: 'Modal: Ereignisse mit Grund', from: "if (!quiet) emit(MODAL_CLOSE_EVENT, { reason, trigger: lastTrigger }, opts.onClose);", to: "" },
  { name: 'Grund fehlt', rule: 'Modal: Ereignisse mit Grund', from: "close('close-button');", to: "close('api');" },
  { name: 'destroy lässt offen', rule: 'Modal: destroy im offenen Zustand baut alles zurück', from: "close('destroy', true);", to: "" },
  { name: 'destroy lässt Attribute stehen', rule: 'Modal: destroy im offenen Zustand baut alles zurück', from: "cleanups.add(snapshotAttributes(dialogEl, ['role', 'aria-modal', 'aria-labelledby']));", to: "" },
  { name: 'zweiter Aufruf ersetzt nicht', rule: 'Modal: ein zweiter Aufruf ersetzt den ersten', from: "registry.release(root);", to: "" },
  { name: 'natives Dialog ohne showModal', rule: 'Modal: natives Dialog nutzt showModal und räumt beim Schließen von außen auf', from: "root.showModal();\n        nativeOpen = true;", to: "nativeOpen = false;" },
  { name: 'cancel läuft durch', rule: 'Modal: natives Dialog: cancel wird abgefangen', from: "cleanups.add(listen(root, 'cancel', (event) => {\n      event.preventDefault();", to: "cleanups.add(listen(root, 'cancel', (event) => {" },
  { name: 'Dialog selbst ist kein Hintergrund', rule: 'Modal: natives Dialog: Klick auf das Dialog selbst ist der Hintergrund', from: "|| (isDialog && target === root);", to: ";" },
  { name: 'Dialog ohne showModal bleibt ohne inert', rule: 'Modal: ein Dialog ohne showModal bekommt inert statt Top-Layer', from: "if (!nativeOpen) {", to: "if (false) {" },
  { name: 'spätes close-Ereignis zählt', rule: 'Modal: open, close, open im selben Tick auf natives Dialog: das späte close-Ereignis ändert nichts', from: "if (!opened || root.open) return;", to: "if (!opened) return;" },
  { name: 'geschlossene Modal-Wurzeln werden inert', rule: 'Modal: ohne dialog gestapelt: das zweite Modal ist nicht inert, hat den Fokus, das erste ist inert und wird beim Schließen frei', from: "if (instances.has(sibling) && !openRoots.has(sibling)) continue;", to: "" },
  { name: 'kein Rückfall auf main', rule: 'Modal: ist der Auslöser weg, bekommt main den Fokus', from: "const fallback = below && usable(below.surface) ? below.surface : usable(main) ? main : null;", to: "const fallback = null;" },
];

const CORE: Mutation[] = [
  { name: 'tabs fehlt in initAll', rule: 'initAll: jede Tab-Leiste wird gestartet (nicht nur die erste)', from: "  tabs: { selector: '[data-hoops=\"tabs\"]', start: (el, o) => initTabs(el, o) },\n", to: '' },
  { name: 'modal fehlt in initAll', rule: 'initAll: jedes Modal wird gestartet (nicht nur das erste)', from: "  modal: { selector: '[data-hoops=\"modal\"]', start: (el, o) => initModal(el, o) },\n", to: '' },
  { name: 'nur die erste Leiste', rule: 'initAll: jede Tab-Leiste wird gestartet (nicht nur die erste)', from: "const found = new Set(host.querySelectorAll(block.selector));", to: "const found = new Set([host.querySelector(block.selector)].filter(Boolean));" },
  { name: 'nur das erste Modal', rule: 'initAll: jedes Modal wird gestartet (nicht nur das erste)', from: "const found = new Set(host.querySelectorAll(block.selector));", to: "const found = new Set([host.querySelector(block.selector)].filter(Boolean));" },
  { name: 'Optionen je Element fehlen', rule: 'initAll: Optionen je Leiste aus data-hoops-options', from: "...parseOptions(el.getAttribute('data-hoops-options'))", to: "" },
  { name: 'options.tabs wird ignoriert', rule: 'initAll: tabs-Optionen aus options.tabs gelten für alle Leisten', from: "const shared = isPlain(opts[name]) ? opts[name] : {};", to: "const shared = {};" },
  { name: 'only wird ignoriert', rule: 'initAll: only wählt tabs oder modal', from: "if (!only.includes(name)) continue;", to: "" },
  { name: 'destroy lässt Leisten stehen', rule: 'initAll: destroy baut alle Leisten und Modals ab', from: "for (const h of handles.splice(0).reverse()) h.destroy();", to: "for (const h of handles.splice(0, 1).reverse()) h.destroy();" },
];

describe('Mutationstests: Tabs', () => {
  it('Ausgangslage', async () => {
    expect(Object.entries(tabsLogicRules((await loadModule(tabsJs)) as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(TABS)('$name', async ({ rule, from, to }) => {
    const mutated = tabsLogicRules((await loadModule(mutate(tabsJs, from, to))) as never);
    expect(rule in mutated, `Regel fehlt: ${rule}`).toBe(true);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: Modal', () => {
  it('Ausgangslage', async () => {
    expect(Object.entries(modalLogicRules((await loadModule(modalJs)) as never)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(MODAL)('$name', async ({ rule, from, to }) => {
    const mutated = modalLogicRules((await loadModule(mutate(modalJs, from, to))) as never);
    expect(rule in mutated, `Regel fehlt: ${rule}`).toBe(true);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});

describe('Mutationstests: initAll mit tabs und modal', () => {
  const load = (source: string) => loadModule(source);
  const rulesOf = async (source: string) => {
    polyfillDialog();
    try {
      return tabsModalCoreRules((await load(source)) as never);
    } finally {
      removeDialogPolyfill();
    }
  };
  it('Ausgangslage', async () => {
    expect(Object.entries(await rulesOf(coreJs)).filter(([, ok]) => !ok)).toEqual([]);
  });
  it.each(CORE)('$name', async ({ rule, from, to }) => {
    const mutated = await rulesOf(mutate(coreJs, from, to));
    expect(rule in mutated, `Regel fehlt: ${rule}`).toBe(true);
    expect(mutated[rule], `Regel kippt nicht: ${rule}`).toBe(false);
  });
});
